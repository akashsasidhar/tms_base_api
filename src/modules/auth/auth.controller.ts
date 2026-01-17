import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { jwtConfig } from '../../config/jwt';
import { AuthRequest } from '../../middleware/auth.middleware';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  verifyContactSchema,
  setupPasswordSchema,
} from './auth.validation';
import { RegisterRequest, LoginRequest } from './auth.types';

/**
 * Auth Controller - Handles HTTP requests for authentication
 */
export class AuthController {
  /**
   * Register new user
   */
  static async register(req: Request, res: Response): Promise<void> {
    try {
      // Validate request body
      const validatedData = registerSchema.parse(req.body);
      const registerData: RegisterRequest = {
        username: validatedData.username,
        password: validatedData.password,
        contacts: validatedData.contacts,
        ...(validatedData.first_name ? { first_name: validatedData.first_name } : {}),
        ...(validatedData.last_name ? { last_name: validatedData.last_name } : {}),
      };

      // Call service
      const result = await AuthService.register(registerData);

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      res.status(201).json(result);
    } catch (error) {
      if (error instanceof Error && error.name === 'ZodError') {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: JSON.parse(error.message),
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: 'Registration failed',
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      });
    }
  }

  /**
   * Login user
   */
  static async login(req: Request, res: Response): Promise<void> {
    try {
      // Validate request body
      const validatedData = loginSchema.parse(req.body);
      const loginData: LoginRequest = {
        contact: validatedData.contact,
        password: validatedData.password,
        ...(validatedData.contact_type ? { contact_type: validatedData.contact_type } : {}),
      };

      // Call service
      const result = await AuthService.login(
        loginData.contact,
        loginData.password,
        loginData.contact_type
      );

      if (!result.success) {
        res.status(401).json(result);
        return;
      }

      // Set HTTP-only cookies
      if (result.data?.accessToken) {
        res.cookie('accessToken', result.data.accessToken, jwtConfig.accessTokenCookieOptions);
      }

      if (result.data?.refreshToken) {
        res.cookie('refreshToken', result.data.refreshToken, jwtConfig.cookieOptions);
      }

      // Return response without tokens in body (security best practice)
      res.status(200).json({
        success: true,
        message: result.message,
        data: {
          user: result.data?.user,
        },
      });
    } catch (error) {
      if (error instanceof Error && error.name === 'ZodError') {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: JSON.parse(error.message),
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: 'Login failed',
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      });
    }
  }

  /**
   * Logout user
   */
  static async logout(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const refreshToken = req.cookies?.['refreshToken'] || req.body.refreshToken;

      if (!userId || !refreshToken) {
        res.status(400).json({
          success: false,
          message: 'Missing required fields',
          errors: ['User ID and refresh token are required'],
        });
        return;
      }

      // Call service
      const result = await AuthService.logout(userId, refreshToken);

      // Clear cookies
      res.clearCookie('accessToken', jwtConfig.accessTokenCookieOptions);
      res.clearCookie('refreshToken', jwtConfig.cookieOptions);

      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Logout failed',
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      });
    }
  }

  /**
   * Refresh tokens
   */
  static async refresh(req: Request, res: Response): Promise<void> {
    try {
      const refreshToken = req.cookies?.['refreshToken'] || req.body.refreshToken;

      if (!refreshToken) {
        res.status(400).json({
          success: false,
          message: 'Refresh token required',
          errors: ['No refresh token provided'],
        });
        return;
      }

      // Call service
      const result = await AuthService.refreshTokens(refreshToken);

      if (!result.success) {
        res.status(401).json(result);
        return;
      }

      // Set new HTTP-only cookies
      if (result.data?.accessToken) {
        res.cookie('accessToken', result.data.accessToken, jwtConfig.accessTokenCookieOptions);
      }

      if (result.data?.refreshToken) {
        res.cookie('refreshToken', result.data.refreshToken, jwtConfig.cookieOptions);
      }

      // Return response without tokens in body
      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Token refresh failed',
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      });
    }
  }

  /**
   * Forgot password
   */
  static async forgotPassword(req: Request, res: Response): Promise<void> {
    try {
      // Validate request body
      const validatedData = forgotPasswordSchema.parse(req.body);

      // Call service
      const result = await AuthService.forgotPassword(
        validatedData.contact,
        validatedData.contact_type
      );

      res.status(200).json(result);
    } catch (error) {
      if (error instanceof Error && error.name === 'ZodError') {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: JSON.parse(error.message),
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: 'Password reset request failed',
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      });
    }
  }

  /**
   * Reset password
   */
  static async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      // Validate request body
      const validatedData = resetPasswordSchema.parse(req.body);

      // Call service
      const result = await AuthService.resetPassword(
        validatedData.token,
        validatedData.new_password,
        validatedData.user_id
      );

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      res.status(200).json(result);
    } catch (error) {
      if (error instanceof Error && error.name === 'ZodError') {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: JSON.parse(error.message),
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: 'Password reset failed',
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      });
    }
  }

  /**
   * Change password
   */
  static async changePassword(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
          errors: ['User not authenticated'],
        });
        return;
      }

      // Validate request body
      const validatedData = changePasswordSchema.parse(req.body);

      // Call service
      const result = await AuthService.changePassword(
        userId,
        validatedData.old_password,
        validatedData.new_password
      );

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      res.status(200).json(result);
    } catch (error) {
      if (error instanceof Error && error.name === 'ZodError') {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: JSON.parse(error.message),
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: 'Password change failed',
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      });
    }
  }

  /**
   * Get current authenticated user
   */
  static async getCurrentUser(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
          errors: ['User not authenticated'],
        });
        return;
      }

      // Call service
      const result = await AuthService.getCurrentUser(userId);

      if (!result.success) {
        res.status(404).json(result);
        return;
      }

      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve user',
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      });
    }
  }

  /**
   * Verify contact
   */
  static async verifyContact(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
          errors: ['User not authenticated'],
        });
        return;
      }

      // Validate request body
      const validatedData = verifyContactSchema.parse(req.body);

      // Call service
      const result = await AuthService.verifyContact(
        userId,
        validatedData.contact_id,
        validatedData.verification_code
      );

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      res.status(200).json(result);
    } catch (error) {
      if (error instanceof Error && error.name === 'ZodError') {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: JSON.parse(error.message),
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: 'Contact verification failed',
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      });
    }
  }

  /**
   * Setup password for first-time user verification
   */
  static async setupPassword(req: Request, res: Response): Promise<void> {
    try {
      // Validate request body
      const validatedData = setupPasswordSchema.parse(req.body);

      // Call service
      const result = await AuthService.setupPassword(
        validatedData.token,
        validatedData.user_id,
        validatedData.password
      );

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      res.status(200).json(result);
    } catch (error) {
      if (error instanceof Error && error.name === 'ZodError') {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: JSON.parse(error.message),
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: 'Password setup failed',
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      });
    }
  }
}
