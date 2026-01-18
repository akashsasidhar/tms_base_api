import { Op } from 'sequelize';
import { User, UserContact, UserPassword, Role, UserRole, ContactType, RefreshToken, PasswordResetToken, UserVerificationToken } from '../../models';
import { hashPassword, comparePassword, validatePasswordStrength } from '../../utils/password.util';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  hashRefreshToken,
} from '../../utils/jwt.util';
import { detectContactType, formatContact, validateContactFormat } from '../../helpers/contact.helper';
import { AuthResponse, UserWithRoles } from './auth.types';
import { RegisterRequest } from './auth.types';
import sequelize from '../../config/database';
import { loadUserPermissions } from '../../middleware/rbac.middleware';
import { emailService } from '../../utils/email.util';
import crypto from 'crypto';

/**
 * Auth Service - Handles all authentication business logic
 */
export class AuthService {
  /**
   * Register a new user
   */
  static async register(
    userData: RegisterRequest,
    createdBy?: string
  ): Promise<AuthResponse> {
    const transaction = await sequelize.transaction();

    try {
      // Validate password strength
      const passwordValidation = validatePasswordStrength(userData.password);
      if (!passwordValidation.isValid) {
        return {
          success: false,
          message: 'Password validation failed',
          errors: passwordValidation.errors,
        };
      }

      // Check if username already exists
      const existingUser = await User.findOne({
        where: { username: userData.username },
        transaction,
      });

      if (existingUser) {
        await transaction.rollback();
        return {
          success: false,
          message: 'Username already exists',
          errors: ['Username is already taken'],
        };
      }

      // Hash password
      const passwordHash = await hashPassword(userData.password);

      // Create user
      const user = await User.create(
        {
          username: userData.username,
          password_hash: passwordHash,
          first_name: userData.first_name || null,
          last_name: userData.last_name || null,
          created_by: createdBy || null,
        },
        { transaction }
      );

      // Create contacts
      const contactTypeMap = new Map<string, string>();
      const contactTypes = await ContactType.findAll({ transaction });
      contactTypes.forEach((ct) => {
        contactTypeMap.set(ct.contact_type.toLowerCase(), ct.id);
      });

      for (const contactData of userData.contacts) {
        const contactTypeId = contactTypeMap.get(contactData.contact_type.toLowerCase());
        if (!contactTypeId) {
          await transaction.rollback();
          return {
            success: false,
            message: `Invalid contact type: ${contactData.contact_type}`,
            errors: [`Contact type '${contactData.contact_type}' does not exist`],
          };
        }

        const formattedContact = formatContact(contactData.contact, contactData.contact_type);
        const validation = validateContactFormat(formattedContact, contactData.contact_type);
        if (!validation.isValid) {
          await transaction.rollback();
          return {
            success: false,
            message: 'Invalid contact format',
            errors: [validation.error || 'Invalid contact format'],
          };
        }

        // Check if contact already exists
        const existingContact = await UserContact.findOne({
          where: { contact: formattedContact },
          transaction,
        });

        if (existingContact) {
          await transaction.rollback();
          return {
            success: false,
            message: 'Contact already exists',
            errors: [`Contact '${formattedContact}' is already registered`],
          };
        }

        await UserContact.create(
          {
            user_id: user.id,
            contact_type_id: contactTypeId,
            contact: formattedContact,
            created_by: createdBy || null,
          },
          { transaction }
        );
      }

      // Create password history entry
      await UserPassword.create(
        {
          user_id: user.id,
          password_hash: passwordHash,
          created_by: createdBy || null,
        },
        { transaction }
      );

      // Assign default'User' role
      const defaultRole = await Role.findOne({
        where: { name:'User' },
        transaction,
      });

      if (defaultRole) {
        await UserRole.create(
          {
            user_id: user.id,
            role_id: defaultRole.id,
            created_by: createdBy || null,
          },
          { transaction }
        );
      }

      await transaction.commit();

      // Fetch user with relations
      const userWithRelations = await this.getUserWithRoles(user.id);

      return {
        success: true,
        message: 'User registered successfully',
        data: {
          user: userWithRelations,
        },
      };
    } catch (error) {
      await transaction.rollback();
      console.error('Registration error:', error);
      return {
        success: false,
        message: 'Registration failed',
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }

  /**
   * Login user
   */
  static async login(
    contact: string,
    password: string,
    contactType?: string
  ): Promise<AuthResponse> {
    try {
      // Detect contact type if not provided
      let detectedType = contactType;
      if (!detectedType) {
        const detected = detectContactType(contact);
        if (detected === 'unknown') {
          return {
            success: false,
            message: 'Unable to detect contact type',
            errors: ['Please specify contact type or use a valid email/phone'],
          };
        }
        // Map detected type to primary contact type
        // 'email' -> 'primary email', 'mobile' -> 'primary mobile'
        if (detected === 'email') {
          detectedType = 'primary email';
        } else if (detected === 'mobile' || detected === 'phone') {
          detectedType = 'primary mobile';
        } else {
          detectedType = detected;
        }
      } else {
        // If contact type is provided, ensure it's mapped to primary
        const lowerType = detectedType.toLowerCase();
        if (lowerType === 'email') {
          detectedType = 'primary email';
        } else if (lowerType === 'mobile' || lowerType === 'phone') {
          detectedType = 'primary mobile';
        }
      }

      // Format contact - use base type for formatting (email/mobile)
      const baseType = detectedType.toLowerCase().includes('email') ? 'email' : 'mobile';
      const formattedContact = formatContact(contact, baseType);

      // Find contact type - only accept primary email or primary mobile
      // Try both 'primary email' and 'primary_email' variations
      const contactTypeRecord = await ContactType.findOne({
        where: {
          [Op.or]: [
            { contact_type: detectedType },
            { contact_type: detectedType.replace(' ', '_') },
            { contact_type: detectedType.replace('_', ' ') },
          ],
        },
      });

      if (!contactTypeRecord) {
        return {
          success: false,
          message: 'Invalid contact type',
          errors: [`Contact type '${detectedType}' does not exist`],
        };
      }

      // Check if the contact type is primary email or primary mobile
      const contactTypeName = contactTypeRecord.contact_type.toLowerCase();
      const isPrimaryEmail = contactTypeName === 'primary email' || contactTypeName === 'primary_email';
      const isPrimaryMobile = contactTypeName === 'primary mobile' || contactTypeName === 'primary_mobile';

      if (!isPrimaryEmail && !isPrimaryMobile) {
        return {
          success: false,
          message: 'Invalid login method',
          errors: ['You must use your primary email or primary mobile number to login'],
        };
      }

      // Find user contact - must be primary email or primary mobile
      const userContact = await UserContact.findOne({
        where: {
          contact: formattedContact,
          contact_type_id: contactTypeRecord.id,
          is_primary: true, // Must be a primary contact
        },
        include: [
          {
            model: User,
            as:'user',
            include: [
              {
                model: UserRole,
                as: 'userRoles',
                where: { is_active: true },
                required: false,
                include: [
                  {
                    model: Role,
                    as: 'role',
                    where: { is_active: true },
                    required: false,
                  },
                ],
              },
            ],
          },
        ],
      });

      if (!userContact) {
        return {
          success: false,
          message: 'Invalid credentials',
          errors: ['Please use your primary email or primary mobile number to login'],
        };
      }

      // Type assertion for included user
      const user = (userContact as UserContact & { user: User }).user;
      
      if (!user) {
        return {
          success: false,
          message: 'Invalid credentials',
          errors: ['Contact or password is incorrect'],
        };
      }

      // Check if user is active
      if (!user.is_active) {
        return {
          success: false,
          message: 'Account is inactive',
          errors: ['Your account has been deactivated'],
        };
      }

      // Get latest password
      const latestPassword = await UserPassword.findOne({
        where: { user_id: user.id },
        order: [['created_at', 'DESC']],
      });

      if (!latestPassword) {
        return {
          success: false,
          message: 'Password not found',
          errors: ['Account setup incomplete'],
        };
      }

      // Verify password
      const isPasswordValid = await comparePassword(password, latestPassword.password_hash);
      if (!isPasswordValid) {
        return {
          success: false,
          message: 'Invalid credentials',
          errors: ['Contact or password is incorrect'],
        };
      }

      // Get user roles
      const userRoles = await UserRole.findAll({
        where: {
          user_id: user.id,
          is_active: true,
        },
        include: [
          {
            model: Role,
            as: 'role',
            where: { is_active: true },
            required: true,
          },
        ],
      });

      const roles = userRoles.map((ur) => {
        const userRoleWithRole = ur as UserRole & { role: Role };
        return userRoleWithRole.role.name;
      });

      // Generate tokens
      const accessToken = await generateAccessToken(user.id, user.username, roles);
      const refreshToken = await generateRefreshToken(user.id);

      // Store refresh token hash
      const tokenHash = hashRefreshToken(refreshToken);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

      await RefreshToken.create({
        user_id: user.id,
        token_hash: tokenHash,
        expires_at: expiresAt,
      });

      // Get user with relations
      const userWithRelations = await this.getUserWithRoles(user.id);

      return {
        success: true,
        message: 'Login successful',
        data: {
          user: userWithRelations,
          accessToken,
          refreshToken,
        },
      };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: 'Login failed',
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }

  /**
   * Logout user
   */
  static async logout(userId: string, refreshToken: string): Promise<AuthResponse> {
    try {
      const tokenHash = hashRefreshToken(refreshToken);

      // Delete refresh token
      await RefreshToken.destroy({
        where: {
          user_id: userId,
          token_hash: tokenHash,
        },
      });

      return {
        success: true,
        message: 'Logout successful',
      };
    } catch (error) {
      console.error('Logout error:', error);
      return {
        success: false,
        message: 'Logout failed',
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }

  /**
   * Refresh tokens (token rotation)
   */
  static async refreshTokens(refreshToken: string): Promise<AuthResponse> {
    try {
      // Verify refresh token
      const payload = await verifyRefreshToken(refreshToken);
      const tokenHash = hashRefreshToken(refreshToken);

      // Find refresh token in database
      const storedToken = await RefreshToken.findOne({
        where: {
          user_id: payload.userId,
          token_hash: tokenHash,
          is_active: true,
        },
      });

      if (!storedToken || storedToken.isExpired()) {
        return {
          success: false,
          message: 'Invalid or expired refresh token',
          errors: ['Refresh token is invalid or expired'],
        };
      }

      // Get user
      const user = await User.findByPk(payload.userId);
      if (!user || !user.is_active) {
        return {
          success: false,
          message: 'User not found or inactive',
          errors: ['User account is not available'],
        };
      }

      // Get user roles
      const userRoles = await UserRole.findAll({
        where: {
          user_id: user.id,
          is_active: true,
        },
        include: [
          {
            model: Role,
            as: 'role',
            where: { is_active: true },
            required: true,
          },
        ],
      });

      const roles = userRoles.map((ur) => {
        const userRoleWithRole = ur as UserRole & { role: Role };
        return userRoleWithRole.role.name;
      });

      // Delete old refresh token (token rotation)
      await RefreshToken.destroy({
        where: {
          user_id: payload.userId,
          token_hash: tokenHash,
        },
      });

      // Generate new tokens
      const newAccessToken = await generateAccessToken(user.id, user.username, roles);
      const newRefreshToken = await generateRefreshToken(user.id);

      // Store new refresh token
      const newTokenHash = hashRefreshToken(newRefreshToken);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      await RefreshToken.create({
        user_id: user.id,
        token_hash: newTokenHash,
        expires_at: expiresAt,
      });

      // Get user with roles for response
      const userWithRoles = await this.getUserWithRoles(user.id);

      return {
        success: true,
        message: 'Tokens refreshed successfully',
        data: {
          user: userWithRoles,
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
        },
      };
    } catch (error) {
      console.error('Refresh token error:', error);
      return {
        success: false,
        message: 'Token refresh failed',
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }

  /**
   * Forgot password
   */
  static async forgotPassword(contact: string, contactType?: string): Promise<AuthResponse> {
    try {
      // Detect contact type if not provided
      let detectedType = contactType;
      if (!detectedType) {
        detectedType = detectContactType(contact);
        if (detectedType === 'unknown') {
          return {
            success: false,
            message: 'Unable to detect contact type',
            errors: ['Please specify contact type or use a valid email/phone'],
          };
        }
      }

      // Format contact
      const formattedContact = formatContact(contact, detectedType);

      // Find contact type
      const contactTypeRecord = await ContactType.findOne({
        where: { contact_type: detectedType },
      });

      if (!contactTypeRecord) {
        return {
          success: false,
          message: 'Invalid contact type',
          errors: [`Contact type '${detectedType}' does not exist`],
        };
      }

      // Find user contact
      const userContact = await UserContact.findOne({
        where: {
          contact: formattedContact,
          contact_type_id: contactTypeRecord.id,
        },
        include: [
          {
            model: User,
            as:'user',
          },
        ],
      });

      if (!userContact) {
        // Don't reveal if user exists (security best practice)
        return {
          success: true,
          message: 'If the contact exists, a password reset link will be sent',
        };
      }

      const user = (userContact as UserContact & { user: User }).user;
      
      if (!user) {
        // Don't reveal if user exists (security best practice)
        return {
          success: true,
          message: 'If the contact exists, a password reset link will be sent',
        };
      }

      // Only send email if contact type is email
      if (detectedType !== 'email') {
        // For non-email contacts, return success without revealing if user exists
        return {
          success: true,
          message: 'If the contact exists, a password reset link will be sent',
        };
      }

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
      
      // Set expiration to 1 hour from now
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1);

      // Invalidate any existing reset tokens for this user
      await PasswordResetToken.update(
        { is_used: true, deleted_at: new Date() },
        { where: { user_id: user.id, is_used: false, deleted_at: null } }
      );

      // Create new reset token
      await PasswordResetToken.create({
        user_id: user.id,
        token_hash: tokenHash,
        expires_at: expiresAt,
        is_used: false,
      });

      // Send password reset email
      try {
        await emailService.sendPasswordResetEmail(
          formattedContact,
          resetToken,
          user.id,
          user.first_name || user.username
        );
      } catch (emailError) {
        console.error('Error sending password reset email:', emailError);
        // Still return success to not reveal if user exists
        return {
          success: true,
          message: 'If the contact exists, a password reset link will be sent',
        };
      }

      // Return success message (don't reveal if email was sent successfully)
      return {
        success: true,
        message: 'If the contact exists, a password reset link will be sent',
      };
    } catch (error) {
      console.error('Forgot password error:', error);
      return {
        success: false,
        message: 'Password reset request failed',
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }

  /**
   * Reset password
   */
  static async resetPassword(
    token: string,
    newPassword: string,
    userId: string
  ): Promise<AuthResponse> {
    const transaction = await sequelize.transaction();

    try {
      // Validate password strength
      const passwordValidation = validatePasswordStrength(newPassword);
      if (!passwordValidation.isValid) {
        await transaction.rollback();
        return {
          success: false,
          message: 'Password validation failed',
          errors: passwordValidation.errors,
        };
      }

      // Verify reset token
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      const resetToken = await PasswordResetToken.findOne({
        where: {
          user_id: userId,
          token_hash: tokenHash,
          is_used: false,
          deleted_at: null,
        },
        transaction,
      });

      if (!resetToken) {
        await transaction.rollback();
        return {
          success: false,
          message: 'Invalid or expired reset token',
          errors: ['The reset token is invalid or has already been used'],
        };
      }

      // Check if token is expired
      if (resetToken.isExpired()) {
        await transaction.rollback();
        return {
          success: false,
          message: 'Reset token has expired',
          errors: ['The reset token has expired. Please request a new one'],
        };
      }

      // Verify user exists and is active
      const user = await User.findByPk(userId, { transaction });
      if (!user || !user.is_active) {
        await transaction.rollback();
        return {
          success: false,
          message: 'User not found or inactive',
          errors: ['Invalid reset token or user'],
        };
      }

      // Hash new password
      const passwordHash = await hashPassword(newPassword);

      // Update user password
      await User.update(
        { password_hash: passwordHash },
        { where: { id: userId }, transaction }
      );

      // Create password history entry
      await UserPassword.create(
        {
          user_id: userId,
          password_hash: passwordHash,
        },
        { transaction }
      );

      // Mark reset token as used
      await resetToken.update(
        { is_used: true },
        { transaction }
      );

      // Invalidate all refresh tokens
      await RefreshToken.update(
        { is_active: false },
        {
          where: { user_id: userId },
          transaction,
        }
      );

      await transaction.commit();

      return {
        success: true,
        message: 'Password reset successfully',
      };
    } catch (error) {
      await transaction.rollback();
      console.error('Reset password error:', error);
      return {
        success: false,
        message: 'Password reset failed',
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }

  /**
   * Change password
   */
  static async changePassword(
    userId: string,
    oldPassword: string,
    newPassword: string
  ): Promise<AuthResponse> {
    const transaction = await sequelize.transaction();

    try {
      // Validate new password strength
      const passwordValidation = validatePasswordStrength(newPassword);
      if (!passwordValidation.isValid) {
        await transaction.rollback();
        return {
          success: false,
          message: 'Password validation failed',
          errors: passwordValidation.errors,
        };
      }

      // Get user
      const user = await User.findByPk(userId, { transaction });
      if (!user || !user.is_active) {
        await transaction.rollback();
        return {
          success: false,
          message: 'User not found or inactive',
          errors: ['User account is not available'],
        };
      }

      // Get latest password
      const latestPassword = await UserPassword.findOne({
        where: { user_id: userId },
        order: [['created_at', 'DESC']],
        transaction,
      });

      if (!latestPassword) {
        await transaction.rollback();
        return {
          success: false,
          message: 'Password not found',
          errors: ['Account setup incomplete'],
        };
      }

      // Verify old password
      const isOldPasswordValid = await comparePassword(oldPassword, latestPassword.password_hash);
      if (!isOldPasswordValid) {
        await transaction.rollback();
        return {
          success: false,
          message: 'Invalid old password',
          errors: ['Current password is incorrect'],
        };
      }

      // Check if new password is same as old password
      const isSamePassword = await comparePassword(newPassword, latestPassword.password_hash);
      if (isSamePassword) {
        await transaction.rollback();
        return {
          success: false,
          message: 'New password must be different from current password',
          errors: ['Please choose a different password'],
        };
      }

      // Hash new password
      const passwordHash = await hashPassword(newPassword);

      // Update user password
      await User.update(
        { password_hash: passwordHash },
        { where: { id: userId }, transaction }
      );

      // Create password history entry
      await UserPassword.create(
        {
          user_id: userId,
          password_hash: passwordHash,
          created_by: userId,
        },
        { transaction }
      );

      // Invalidate all refresh tokens (force re-login)
      await RefreshToken.update(
        { is_active: false },
        {
          where: { user_id: userId },
          transaction,
        }
      );

      await transaction.commit();

      return {
        success: true,
        message: 'Password changed successfully',
      };
    } catch (error) {
      await transaction.rollback();
      console.error('Change password error:', error);
      return {
        success: false,
        message: 'Password change failed',
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }

  /**
   * Verify contact
   */
  static async verifyContact(
    userId: string,
    contactId: string,
    _verificationCode: string
  ): Promise<AuthResponse> {
    try {
      // Find user contact
      const userContact = await UserContact.findOne({
        where: {
          id: contactId,
          user_id: userId,
        },
      });

      if (!userContact) {
        return {
          success: false,
          message: 'Contact not found',
          errors: ['Contact does not exist or does not belong to user'],
        };
      }

      // TODO: Verify verification code
      // For now, just mark as verified (you would implement OTP/SMS verification here)
      // This is a placeholder

      return {
        success: true,
        message: 'Contact verified successfully',
      };
    } catch (error) {
      console.error('Verify contact error:', error);
      return {
        success: false,
        message: 'Contact verification failed',
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }

  /**
   * Get current authenticated user with roles, contacts, and permissions
   */
  static async getCurrentUser(userId: string): Promise<AuthResponse> {
    try {
      const userWithRoles = await this.getUserWithRoles(userId);
      const { permissions } = await loadUserPermissions(userId);
      
      return {
        success: true,
        message: 'User retrieved successfully',
        data: {
          user: userWithRoles,
          permissions,
        },
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to retrieve user',
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }

  /**
   * Setup password for first-time user verification
   */
  static async setupPassword(
    token: string,
    userId: string,
    password: string
  ): Promise<AuthResponse> {
    const transaction = await sequelize.transaction();

    try {
      // Validate password strength
      const passwordValidation = validatePasswordStrength(password);
      if (!passwordValidation.isValid) {
        await transaction.rollback();
        return {
          success: false,
          message: 'Password validation failed',
          errors: passwordValidation.errors,
        };
      }

      // Hash the token to find it in database
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

      // Find verification token
      const verificationToken = await UserVerificationToken.findOne({
        where: {
          user_id: userId,
          token_hash: tokenHash,
          is_used: false,
          deleted_at: null,
        },
        transaction,
      });

      if (!verificationToken) {
        await transaction.rollback();
        return {
          success: false,
          message: 'Invalid or expired setup token',
          errors: ['The setup link is invalid or has already been used'],
        };
      }

      // Check if token is expired
      if (verificationToken.isExpired()) {
        await transaction.rollback();
        return {
          success: false,
          message: 'Setup token has expired',
          errors: ['The setup link has expired. Please contact your administrator for a new link'],
        };
      }

      // Get user
      const user = await User.findByPk(userId, { transaction });
      if (!user || !user.is_active) {
        await transaction.rollback();
        return {
          success: false,
          message: 'User not found or inactive',
          errors: ['User account is not available'],
        };
      }

      // Hash new password
      const passwordHash = await hashPassword(password);

      // Update user password and mark as verified
      await User.update(
        {
          password_hash: passwordHash,
          is_verified: true,
        },
        { where: { id: userId }, transaction }
      );

      // Create password history entry
      await UserPassword.create(
        {
          user_id: userId,
          password_hash: passwordHash,
          created_by: userId,
        },
        { transaction }
      );

      // Mark verification token as used
      await UserVerificationToken.update(
        { is_used: true },
        { where: { id: verificationToken.id }, transaction }
      );

      // Invalidate any existing refresh tokens (force re-login with new password)
      await RefreshToken.update(
        { is_active: false },
        {
          where: { user_id: userId },
          transaction,
        }
      );

      await transaction.commit();

      return {
        success: true,
        message: 'Password set successfully. Your account is now verified. You can now log in.',
      };
    } catch (error) {
      await transaction.rollback();
      console.error('Setup password error:', error);
      return {
        success: false,
        message: 'Password setup failed',
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }

  /**
   * Get user with roles and contacts
   */
  private static async getUserWithRoles(userId: string): Promise<UserWithRoles> {
    const user = await User.findByPk(userId, {
      include: [
        {
          model: UserContact,
          as: 'contacts',
          include: [
            {
              model: ContactType,
              as: 'contactType',
            },
          ],
        },
        {
          model: UserRole,
          as: 'userRoles',
          where: { is_active: true },
          required: false,
          include: [
            {
              model: Role,
              as: 'role',
              where: { is_active: true },
              required: false,
            },
          ],
        },
      ],
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Type assertion for included associations
    const userWithIncludes = user as User & {
      userRoles?: Array<UserRole & { role?: Role }>;
      contacts?: Array<UserContact & { contactType?: ContactType }>;
    };

    const roles = (userWithIncludes.userRoles || [])
      .map((ur: UserRole & { role?: Role }) => ur.role)
      .filter((r): r is Role => r !== null && r !== undefined);

    return {
      id: user.id,
      username: user.username,
      first_name: user.first_name,
      last_name: user.last_name,
      is_active: user.is_active,
      contacts: (userWithIncludes.contacts || []).map((contact: UserContact & { contactType?: ContactType }) => ({
        id: contact.id,
        contact: contact.contact,
        contactType: {
          id: contact.contactType!.id,
          contact_type: contact.contactType!.contact_type,
        },
      })),
      roles: roles,
    };
  }
}
