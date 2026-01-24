import { Op } from 'sequelize';
import {
  User,
  UserContact,
  UserPassword,
  UserRole,
  Role,
  ContactType,
  UserVerificationToken,
} from '../../models';
import { hashPassword } from '../../utils/password.util';
import { formatContact, validateContactFormat } from '../../helpers/contact.helper';
import { getPaginationParams, getPaginationMeta } from '../../helpers/pagination.helper';
import {
  buildUserWhereWithContact,
  buildUserOrderClause,
  UserFilters,
  SortOptions,
} from '../../helpers/query.helper';
import {
  CreateUserDto,
  UpdateUserDto,
  AddContactDto,
  UpdateContactDto,
  UserResponseDto,
  ContactDto,
  RoleDto,
  UserSelectDto,
} from './user.types';
import sequelize from '../../config/database';
import appConfig from '../../config/app-config';
import { emailService } from '../../utils/email.util';
import crypto from 'crypto';

/**
 * Transform user model to response DTO (excludes password)
 */
function transformUserToDto(user: User): UserResponseDto {
  // Type assertion for included associations
  const userWithIncludes = user as User & {
    contacts?: Array<UserContact & { contactType?: ContactType }>;
    userRoles?: Array<UserRole & { role?: Role }>;
  };

  const contacts: ContactDto[] = (userWithIncludes.contacts || []).map((contact: UserContact & { contactType?: ContactType }) => ({
    id: contact.id,
    contact_type_id: contact.contact_type_id,
    contact_type: contact.contactType?.contact_type || '',
    contact: contact.contact,
    is_active: contact.is_active,
    is_primary: contact.is_primary || false,
    created_at: contact.created_at,
    updated_at: contact.updated_at,
  }));

  const roles: RoleDto[] = (userWithIncludes.userRoles || [])
    .map((ur: UserRole & { role?: Role }) => ur.role)
    .filter((role): role is Role => role !== null && role !== undefined)
    .map((role: Role) => ({
      id: role.id,
      name: role.name,
      description: role.description,
      is_active: role.is_active,
      created_at: role.created_at,
      updated_at: role.updated_at,
    }));

  return {
    id: user.id,
    username: user.username,
    first_name: user.first_name,
    last_name: user.last_name,
    is_active: user.is_active,
    contacts,
    roles,
    created_at: user.created_at,
    updated_at: user.updated_at,
    created_by: user.created_by,
    updated_by: user.updated_by,
  };
}

/**
 * User Service - Handles all user management business logic
 */
export class UserService {
  /**
   * Get all users with filtering, pagination, and sorting
   */
  static async getAllUsers(
    filters: UserFilters = {},
    page: number = 1,
    limit: number = 10,
    sort?: SortOptions
  ): Promise<{
    users: UserResponseDto[];
    meta: ReturnType<typeof getPaginationMeta>;
  }> {
    const { offset, limit: limitNum, page: pageNum } = getPaginationParams(page, limit);
    const { where, include } = buildUserWhereWithContact(filters, !!filters.contact);
    const order = buildUserOrderClause(sort);

    const { rows, count } = await User.findAndCountAll({
      where: {
        ...where,
        deleted_at: null,
      },
      include,
      order,
      limit: limitNum,
      offset,
      distinct: true, // Important for correct count with joins
    });

    const users = rows.map(transformUserToDto);

    return {
      users,
      meta: getPaginationMeta(count, pageNum, limitNum),
    };
  }

  /**
   * Get users list for selection/dropdown purposes
   * Returns simplified user data (id, username, name, roles, is_active)
   * This is a lightweight endpoint for user selection in forms, dropdowns, etc.
   */
  static async getUsersList(filters: {
    role_id?: string;
    is_active?: boolean;
    limit?: number;
  }): Promise<{ users: UserSelectDto[] }> {
    const where: any = {
      deleted_at: null,
    };

    if (filters.is_active !== undefined) {
      where.is_active = filters.is_active;
    }

    const include: any[] = [
      {
        model: UserRole,
        as: 'userRoles',
        required: false,
        include: [
          {
            model: Role,
            as: 'role',
            required: false,
            where: {
              ...(filters.role_id ? { id: filters.role_id } : {}),
              deleted_at: null,
            },
          },
        ],
      },
    ];

    // If filtering by role_id, we need to ensure the user has that role
    if (filters.role_id) {
      include[0].required = true;
    }

    const users = await User.findAll({
      where,
      include,
      limit: filters.limit || 1000,
      order: [['first_name', 'ASC'], ['last_name', 'ASC'], ['username', 'ASC']],
      subQuery: false, // Prevents duplicate rows when using includes
    });

    const userSelectList: UserSelectDto[] = users.map((user) => {
      const userWithIncludes = user as User & {
        userRoles?: Array<UserRole & { role?: Role }>;
      };

      const roles = (userWithIncludes.userRoles || [])
        .map((ur: UserRole & { role?: Role }) => ur.role)
        .filter((role): role is Role => role !== null && role !== undefined)
        .map((role: Role) => ({
          id: role.id,
          name: role.name,
        }));

      return {
        id: user.id,
        username: user.username,
        first_name: user.first_name,
        last_name: user.last_name,
        is_active: user.is_active,
        roles,
      };
    });

    return {
      users: userSelectList,
    };
  }

  private static async generateUniqueUsername(base: string, transaction: any): Promise<string> {
  const username = base.toLowerCase().replace(/[^a-z0-9_.]/g, '');
  let suffix = 0;

  for (;;) {
    const finalUsername = suffix === 0 ? username : `${username}${suffix}`;

    const exists = await User.findOne({
      where: { username: finalUsername, deleted_at: null },
      transaction,
    });

    if (!exists) return finalUsername;

    suffix++;
  }
}


  
  /**
   * Get user by ID
   */
  static async getUserById(id: string): Promise<UserResponseDto | null> {
    const user = await User.findOne({
      where: {
        id,
        deleted_at: null,
      },
      include: [
        {
          model: UserContact,
          as: 'contacts',
          where: { deleted_at: null },
          required: false,
          include: [
            {
              model: ContactType,
              as: 'contactType',
              required: false,
            },
          ],
        },
        {
          model: UserRole,
          as: 'userRoles',
          where: { deleted_at: null, is_active: true },
          required: false,
          include: [
            {
              model: Role,
              as: 'role',
              where: { deleted_at: null, is_active: true },
              required: false,
            },
          ],
        },
      ],
    });

    if (!user) {
      return null;
    }

    return transformUserToDto(user);
  }

  /**
   * Create user
   */
  static async createUser(
    userData: CreateUserDto,
    createdBy?: string
  ): Promise<UserResponseDto> {
    const transaction = await sequelize.transaction();
  
    try {
      // 1️⃣ Generate unique username from first_name + last_name
      const baseUsername = [userData.first_name, userData.last_name].filter(Boolean).join('.');
      const finalUsername = await this.generateUniqueUsername(baseUsername, transaction);
  
      // 2️⃣ Determine password to use
      const passwordToUse = userData.password || appConfig.ADMIN_DEFAULT_PASSWORD;
      const passwordHash = await hashPassword(passwordToUse);
  
      // 3️⃣ Create user
      const user = await User.create(
        {
          username: finalUsername,
          password_hash: passwordHash,
          first_name: userData.first_name || null,
          last_name: userData.last_name || null,
          is_verified: false, // user will verify via email
          created_by: createdBy || null,
        },
        { transaction }
      );
  
      // 4️⃣ Create user contacts
      let userEmail: string | null = null;
      let hasPrimaryEmail = false;
      let hasPrimaryMobile = false;
  
      for (const contactData of userData.contacts) {
        const contactType = await ContactType.findByPk(contactData.contact_type_id, { transaction });
  
        if (!contactType) {
          throw new Error(`Contact type not found: ${contactData.contact_type_id}`);
        }
  
        const formattedContact = formatContact(contactData.contact, contactType.contact_type);
        const validation = validateContactFormat(formattedContact, contactType.contact_type);
  
        if (!validation.isValid) {
          throw new Error(validation.error || 'Invalid contact format');
        }
  
        // Check if contact already exists globally
        const existingContact = await UserContact.findOne({
          where: { contact: formattedContact, deleted_at: null },
          transaction,
        });
  
        if (existingContact) {
          throw new Error(`Contact already exists: ${formattedContact}`);
        }

        // Check if this is a primary email or primary mobile contact type
        const contactTypeName = contactType.contact_type.toLowerCase();
        const isPrimaryEmail = contactTypeName === 'primary email' || contactTypeName === 'primary_email';
        const isPrimaryMobile = contactTypeName === 'primary mobile' || contactTypeName === 'primary_mobile';

        // Ensure only one primary email and one primary mobile per user
        if (isPrimaryEmail) {
          if (hasPrimaryEmail) {
            throw new Error('User can only have one primary email contact');
          }
          hasPrimaryEmail = true;
        }

        if (isPrimaryMobile) {
          if (hasPrimaryMobile) {
            throw new Error('User can only have one primary mobile contact');
          }
          hasPrimaryMobile = true;
        }
  
        // Determine if this is a primary contact
        const isPrimaryContact = isPrimaryEmail || isPrimaryMobile;

        await UserContact.create(
          {
            user_id: user.id,
            contact_type_id: contactData.contact_type_id,
            contact: formattedContact,
            is_primary: isPrimaryContact,
            created_by: createdBy || null,
          },
          { transaction }
        );
  
        // Save first primary email or email contact for sending setup email
        if ((isPrimaryEmail || contactType.contact_type.toLowerCase() === 'email') && !userEmail) {
          userEmail = formattedContact;
        }
      }
  
      // 5️⃣ Create password history entry
      await UserPassword.create(
        {
          user_id: user.id,
          password_hash: passwordHash,
          created_by: createdBy || null,
        },
        { transaction }
      );
  
      // 6️⃣ Assign role
      let roleIdToAssign: string | undefined;
  
      if (userData.role_ids && userData.role_ids.length > 0) {
        roleIdToAssign = userData.role_ids[0]; // only the first role
      } else {
        // Assign default 'User' role
        const defaultRole = await Role.findOne({
          where: { name: 'User', deleted_at: null },
          transaction,
        });
        roleIdToAssign = defaultRole?.id;
      }
  
      if (roleIdToAssign) {
        await UserRole.create(
          {
            user_id: user.id,
            role_id: roleIdToAssign,
            created_by: createdBy || null,
          },
          { transaction }
        );
      }
  
      // 7️⃣ Commit transaction before sending emails
      await transaction.commit();
  
      // 8️⃣ Send setup password email (if email exists)
      if (userEmail) {
        try {
          const setupToken = crypto.randomBytes(32).toString('hex');
          const tokenHash = crypto.createHash('sha256').update(setupToken).digest('hex');
          const expiresAt = new Date();
          expiresAt.setHours(expiresAt.getHours() + 24); // 24-hour expiry
  
          // Save verification token
          await UserVerificationToken.create({
            user_id: user.id,
            token_hash: tokenHash,
            expires_at: expiresAt,
            created_by: createdBy || null,
          });
  
          const userName = user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.username;
          await emailService.sendSetupPasswordEmail(userEmail, setupToken, user.id, userName);
        } catch (emailError) {
          console.error('Failed to send setup password email:', emailError);
        }
      }
  
      // 9️⃣ Fetch user with relations and return
      const createdUser = await this.getUserById(user.id);
      if (!createdUser) throw new Error('Failed to retrieve created user');
  
      return createdUser;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
  

  /**
   * Update user
   */
  static async updateUser(
    id: string,
    userData: UpdateUserDto,
    updatedBy?: string
  ): Promise<UserResponseDto> {
    const transaction = await sequelize.transaction();

    try {
      const user = await User.findOne({
        where: { id, deleted_at: null },
        transaction,
      });

      if (!user) {
        await transaction.rollback();
        throw new Error('User not found');
      }

      // Update user fields
      const updateData: Partial<typeof user> = {};
      if (userData.first_name !== undefined) updateData.first_name = userData.first_name;
      if (userData.last_name !== undefined) updateData.last_name = userData.last_name;
      if (userData.is_active !== undefined) updateData.is_active = userData.is_active;
      updateData.updated_by = updatedBy || null;

      await user.update(updateData, { transaction });

      await transaction.commit();

      // Fetch updated user with relations
      const updatedUser = await this.getUserById(id);
      if (!updatedUser) {
        throw new Error('Failed to retrieve updated user');
      }

      return updatedUser;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Delete user (soft delete)
   */
  static async deleteUser(id: string, deletedBy?: string): Promise<void> {
    const transaction = await sequelize.transaction();

    try {
      const user = await User.findOne({
        where: { id, deleted_at: null },
        transaction,
      });

      if (!user) {
        await transaction.rollback();
        throw new Error('User not found');
      }

      // Soft delete user
      await user.update(
        {
          deleted_at: new Date(),
          deleted_by: deletedBy || null,
        },
        { transaction }
      );

      // Soft delete user contacts
      await UserContact.update(
        {
          deleted_at: new Date(),
          deleted_by: deletedBy || null,
        },
        {
          where: { user_id: id, deleted_at: null },
          transaction,
        }
      );

      // Soft delete user roles
      await UserRole.update(
        {
          deleted_at: new Date(),
          deleted_by: deletedBy || null,
        },
        {
          where: { user_id: id, deleted_at: null },
          transaction,
        }
      );

      // Soft delete user passwords
      await UserPassword.update(
        {
          deleted_at: new Date(),
          deleted_by: deletedBy || null,
        },
        {
          where: { user_id: id, deleted_at: null },
          transaction,
        }
      );

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Restore user
   */
  static async restoreUser(id: string, updatedBy?: string): Promise<UserResponseDto> {
    const transaction = await sequelize.transaction();

    try {
      const user = await User.findOne({
        where: { id },
        transaction,
      });

      if (!user) {
        await transaction.rollback();
        throw new Error('User not found');
      }

      if (!user.deleted_at) {
        await transaction.rollback();
        throw new Error('User is not deleted');
      }

      // Restore user
      await user.update(
        {
          deleted_at: null,
          deleted_by: null,
          updated_by: updatedBy || null,
        },
        { transaction }
      );

      // Restore user contacts
      await UserContact.update(
        {
          deleted_at: null,
          deleted_by: null,
          updated_by: updatedBy || null,
        },
        {
          where: { user_id: id },
          transaction,
        }
      );

      // Restore user roles
      await UserRole.update(
        {
          deleted_at: null,
          deleted_by: null,
          updated_by: updatedBy || null,
        },
        {
          where: { user_id: id },
          transaction,
        }
      );

      await transaction.commit();

      // Fetch restored user with relations
      const restoredUser = await this.getUserById(id);
      if (!restoredUser) {
        throw new Error('Failed to retrieve restored user');
      }

      return restoredUser;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Add contact to user
   */
  static async addUserContact(
    userId: string,
    contactData: AddContactDto,
    createdBy?: string
  ): Promise<ContactDto> {
    const transaction = await sequelize.transaction();

    try {
      // Verify user exists
      const user = await User.findOne({
        where: { id: userId, deleted_at: null },
        transaction,
      });

      if (!user) {
        await transaction.rollback();
        throw new Error('User not found');
      }

      // Verify contact type exists
      const contactType = await ContactType.findByPk(contactData.contact_type_id, {
        transaction,
      });

      if (!contactType) {
        await transaction.rollback();
        throw new Error('Contact type not found');
      }

      const formattedContact = formatContact(contactData.contact, contactType.contact_type);
      const validation = validateContactFormat(formattedContact, contactType.contact_type);

      if (!validation.isValid) {
        await transaction.rollback();
        throw new Error(validation.error || 'Invalid contact format');
      }

      // Check if contact already exists globally
      const existingContact = await UserContact.findOne({
        where: { contact: formattedContact, deleted_at: null },
        transaction,
      });

      if (existingContact) {
        await transaction.rollback();
        throw new Error('Contact already exists');
      }

      // Check if this is a primary email or primary mobile contact type
      const contactTypeName = contactType.contact_type.toLowerCase();
      const isPrimaryEmail = contactTypeName === 'primary email' || contactTypeName === 'primary_email';
      const isPrimaryMobile = contactTypeName === 'primary mobile' || contactTypeName === 'primary_mobile';

      // If adding primary email or primary mobile, check if user already has one
      if (isPrimaryEmail || isPrimaryMobile) {
        // Find existing primary email/mobile contacts for this user
        const existingPrimaryContacts = await UserContact.findAll({
          where: {
            user_id: userId,
            deleted_at: null,
          },
          include: [
            {
              model: ContactType,
              as: 'contactType',
              required: true,
            },
          ],
          transaction,
        });

        // Check if user already has a primary email/mobile of this type
        const existingPrimary = existingPrimaryContacts.find((c: any) => {
          const type = c.contactType?.contact_type?.toLowerCase();
          if (isPrimaryEmail) {
            return (type === 'primary email' || type === 'primary_email') && c.is_primary;
          } else if (isPrimaryMobile) {
            return (type === 'primary mobile' || type === 'primary_mobile') && c.is_primary;
          }
          return false;
        });

        if (existingPrimary) {
          await transaction.rollback();
          const typeName = isPrimaryEmail ? 'primary email' : 'primary mobile';
          throw new Error(`User already has a ${typeName}. Please update the existing ${typeName} instead of adding a new one.`);
        }
      }

      // Determine if this is a primary contact
      const isPrimaryContact = isPrimaryEmail || isPrimaryMobile;

      const userContact = await UserContact.create(
        {
          user_id: userId,
          contact_type_id: contactData.contact_type_id,
          contact: formattedContact,
          is_primary: isPrimaryContact,
          created_by: createdBy || null,
        },
        { transaction }
      );

      await transaction.commit();

      // Fetch contact with type
      const contactWithType = await UserContact.findByPk(userContact.id, {
        include: [
          {
            model: ContactType,
            as: 'contactType',
          },
        ],
      });

      const contactWithTypeData = contactWithType as UserContact & { contactType?: ContactType };
      
      if (!contactWithTypeData || !contactWithTypeData.contactType) {
        throw new Error('Failed to retrieve created contact');
      }

      return {
        id: contactWithTypeData.id,
        contact_type_id: contactWithTypeData.contact_type_id,
        contact_type: contactWithTypeData.contactType.contact_type,
        contact: contactWithTypeData.contact,
        is_active: contactWithTypeData.is_active,
        is_primary: contactWithTypeData.is_primary || false,
        created_at: contactWithTypeData.created_at,
        updated_at: contactWithTypeData.updated_at,
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Remove contact from user (soft delete)
   */
  static async removeUserContact(
    userId: string,
    contactId: string,
    deletedBy?: string
  ): Promise<void> {
    const transaction = await sequelize.transaction();

    try {
      const contact = await UserContact.findOne({
        where: {
          id: contactId,
          user_id: userId,
          deleted_at: null,
        },
        transaction,
      });

      if (!contact) {
        await transaction.rollback();
        throw new Error('Contact not found');
      }

      await contact.update(
        {
          deleted_at: new Date(),
          deleted_by: deletedBy || null,
        },
        { transaction }
      );

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Update user contact
   */
  static async updateUserContact(
    userId: string,
    contactId: string,
    contactData: UpdateContactDto,
    updatedBy?: string
  ): Promise<ContactDto> {
    const transaction = await sequelize.transaction();

    try {
      const contact = await UserContact.findOne({
        where: {
          id: contactId,
          user_id: userId,
          deleted_at: null,
        },
        include: [
          {
            model: ContactType,
            as: 'contactType',
          },
        ],
        transaction,
      });

      const contactWithType = contact as UserContact & { contactType?: ContactType };
      
      if (!contactWithType || !contactWithType.contactType) {
        await transaction.rollback();
        throw new Error('Contact not found');
      }

      if (contactData.contact) {
        const formattedContact = formatContact(
          contactData.contact,
          contactWithType.contactType.contact_type
        );
        const validation = validateContactFormat(
          formattedContact,
          contactWithType.contactType.contact_type
        );

        if (!validation.isValid) {
          await transaction.rollback();
          throw new Error(validation.error || 'Invalid contact format');
        }

        // Check if contact already exists (excluding current contact)
        const existingContact = await UserContact.findOne({
          where: {
            contact: formattedContact,
            deleted_at: null,
            id: { [Op.ne]: contactId },
          },
          transaction,
        });

        if (existingContact) {
          await transaction.rollback();
          throw new Error('Contact already exists');
        }

        // Check if this is a primary email or primary mobile contact type
        const contactTypeName = contactWithType.contactType.contact_type.toLowerCase();
        const isPrimaryEmail = contactTypeName === 'primary email' || contactTypeName === 'primary_email';
        const isPrimaryMobile = contactTypeName === 'primary mobile' || contactTypeName === 'primary_mobile';

        // If updating a primary email/mobile, ensure no duplicates exist
        if (isPrimaryEmail || isPrimaryMobile) {
          // Find other primary email/mobile contacts for this user (excluding current one)
          const otherPrimaryContacts = await UserContact.findAll({
            where: {
              user_id: userId,
              deleted_at: null,
              id: { [Op.ne]: contactId },
            },
            include: [
              {
                model: ContactType,
                as: 'contactType',
                required: true,
              },
            ],
            transaction,
          });

          // Check if user has another primary email/mobile of the same type
          const duplicatePrimary = otherPrimaryContacts.find((c: any) => {
            const type = c.contactType?.contact_type?.toLowerCase();
            if (isPrimaryEmail) {
              return (type === 'primary email' || type === 'primary_email') && c.is_primary;
            } else if (isPrimaryMobile) {
              return (type === 'primary mobile' || type === 'primary_mobile') && c.is_primary;
            }
            return false;
          });

          if (duplicatePrimary) {
            await transaction.rollback();
            const typeName = isPrimaryEmail ? 'primary email' : 'primary mobile';
            throw new Error(`User already has another ${typeName}. Only one ${typeName} is allowed per user.`);
          }
        }

        if (!contact) {
          await transaction.rollback();
          throw new Error('Contact not found');
        }
        
        await contact.update(
          {
            contact: formattedContact,
            updated_by: updatedBy || null,
          },
          { transaction }
        );
      }

      await transaction.commit();

      // Fetch updated contact
      const updatedContact = await UserContact.findByPk(contactId, {
        include: [
          {
            model: ContactType,
            as: 'contactType',
          },
        ],
      });

      const updatedContactData = updatedContact as UserContact & { contactType?: ContactType };
      
      if (!updatedContactData || !updatedContactData.contactType) {
        throw new Error('Failed to retrieve updated contact');
      }

      return {
        id: updatedContactData.id,
        contact_type_id: updatedContactData.contact_type_id,
        contact_type: updatedContactData.contactType.contact_type,
        contact: updatedContactData.contact,
        is_active: updatedContactData.is_active,
        is_primary: updatedContactData.is_primary || false,
        created_at: updatedContactData.created_at,
        updated_at: updatedContactData.updated_at,
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Assign role to user (replaces any existing role)
   * Users can only have one role at a time
   */
  static async assignRoleToUser(
    userId: string,
    roleId: string,
    createdBy?: string
  ): Promise<RoleDto> {
    const transaction = await sequelize.transaction();

    try {
      // Verify user exists
      const user = await User.findOne({
        where: { id: userId, deleted_at: null },
        transaction,
      });

      if (!user) {
        await transaction.rollback();
        throw new Error('User not found');
      }

      // Verify role exists
      const role = await Role.findOne({
        where: { id: roleId, deleted_at: null },
        transaction,
      });

      if (!role) {
        await transaction.rollback();
        throw new Error('Role not found');
      }

      // Check if the same role is already assigned and active
      const existingActiveRole = await UserRole.findOne({
        where: {
          user_id: userId,
          role_id: roleId,
          deleted_at: null,
        },
        transaction,
      });

      if (existingActiveRole) {
        // Role is already assigned and active, no need to do anything
        await transaction.commit();
        return {
          id: role.id,
          name: role.name,
          description: role.description,
          is_active: role.is_active,
          created_at: role.created_at,
          updated_at: role.updated_at,
        };
      }

      // Remove any existing active roles (users can only have one role)
      const existingUserRoles = await UserRole.findAll({
        where: {
          user_id: userId,
          deleted_at: null,
        },
        transaction,
      });

      // Soft delete all existing active roles
      for (const userRole of existingUserRoles) {
        await userRole.update(
          {
            deleted_at: new Date(),
            deleted_by: createdBy || null,
          },
          { transaction }
        );
      }

      // Check if this role was previously assigned (soft deleted)
      const existingSoftDeletedRole = await UserRole.findOne({
        where: {
          user_id: userId,
          role_id: roleId,
        },
        paranoid: false, // Include soft-deleted records
        transaction,
      });

      if (existingSoftDeletedRole && existingSoftDeletedRole.deleted_at) {
        // Restore the soft-deleted role assignment
        await existingSoftDeletedRole.update(
          {
            deleted_at: null,
            deleted_by: null,
            created_by: createdBy || existingSoftDeletedRole.created_by,
          },
          { transaction }
        );
      } else {
        // Create new role assignment
        await UserRole.create(
          {
            user_id: userId,
            role_id: roleId,
            created_by: createdBy || null,
          },
          { transaction }
        );
      }

      await transaction.commit();

      return {
        id: role.id,
        name: role.name,
        description: role.description,
        is_active: role.is_active,
        created_at: role.created_at,
        updated_at: role.updated_at,
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Remove role from user (soft delete)
   */
  static async removeRoleFromUser(
    userId: string,
    roleId: string,
    deletedBy?: string
  ): Promise<void> {
    const transaction = await sequelize.transaction();

    try {
      const userRole = await UserRole.findOne({
        where: {
          user_id: userId,
          role_id: roleId,
          deleted_at: null,
        },
        transaction,
      });

      if (!userRole) {
        await transaction.rollback();
        throw new Error('Role assignment not found');
      }

      await userRole.update(
        {
          deleted_at: new Date(),
          deleted_by: deletedBy || null,
        },
        { transaction }
      );

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Get user roles
   */
  static async getUserRoles(userId: string): Promise<RoleDto[]> {
    const userRoles = await UserRole.findAll({
      where: {
        user_id: userId,
        deleted_at: null,
        is_active: true,
      },
      include: [
        {
          model: Role,
          as: 'role',
          where: { deleted_at: null, is_active: true },
          required: true,
        },
      ],
    });

    return userRoles
      .map((ur: UserRole & { role?: Role }) => ur.role)
      .filter((role): role is Role => role !== null && role !== undefined)
      .map((role: Role) => ({
        id: role.id,
        name: role.name,
        description: role.description,
        is_active: role.is_active,
        created_at: role.created_at,
        updated_at: role.updated_at,
      }));
  }

  /**
   * Get user contacts
   */
  static async getUserContacts(userId: string): Promise<ContactDto[]> {
    const contacts = await UserContact.findAll({
      where: {
        user_id: userId,
        deleted_at: null,
      },
      include: [
        {
          model: ContactType,
          as: 'contactType',
          required: true,
        },
      ],
    });

    return contacts.map((contact: UserContact & { contactType?: ContactType }) => ({
      id: contact.id,
      contact_type_id: contact.contact_type_id,
      contact_type: contact.contactType?.contact_type || '',
      contact: contact.contact,
      is_active: contact.is_active,
      is_primary: contact.is_primary || false,
      created_at: contact.created_at,
      updated_at: contact.updated_at,
    }));
  }

  /**
   * Change user password
   */
  static async changeUserPassword(
    userId: string,
    newPassword: string,
    updatedBy?: string
  ): Promise<void> {
    const transaction = await sequelize.transaction();

    try {
      const user = await User.findOne({
        where: { id: userId, deleted_at: null },
        transaction,
      });

      if (!user) {
        await transaction.rollback();
        throw new Error('User not found');
      }

      // Hash new password
      const passwordHash = await hashPassword(newPassword);

      // Update user password
      await user.update(
        {
          password_hash: passwordHash,
          updated_by: updatedBy || null,
        },
        { transaction }
      );

      // Create password history entry
      await UserPassword.create(
        {
          user_id: userId,
          password_hash: passwordHash,
          created_by: updatedBy || null,
        },
        { transaction }
      );

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}
