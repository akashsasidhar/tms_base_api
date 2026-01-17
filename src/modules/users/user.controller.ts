import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import { UserService } from './user.service';
import {
  createUserSchema,
  updateUserSchema,
  addContactSchema,
  updateContactSchema,
  assignRoleSchema,
  changeUserPasswordSchema,
  getUsersQuerySchema,
} from './user.validation';
import { CreateUserDto, UpdateUserDto, AddContactDto, UpdateContactDto } from './user.types';
import { success, error, paginated } from '../../utils/response.util';

/**
 * User Controller - Handles HTTP requests for user management
 */
export class UserController {
  /**
   * Get all users
   */
  static async getUsers(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate query parameters
      const query = getUsersQuerySchema.parse(req.query);

      const filters: {
        username?: string;
        first_name?: string;
        last_name?: string;
        role_id?: string;
        is_active?: boolean;
        contact?: string;
      } = {};
      
      if (query.username) filters.username = query.username;
      if (query.first_name) filters.first_name = query.first_name;
      if (query.last_name) filters.last_name = query.last_name;
      if (query.role_id) filters.role_id = query.role_id;
      if (query.is_active !== undefined) filters.is_active = query.is_active;
      if (query.contact) filters.contact = query.contact;

      const sort = query.sort_field
        ? {
            field: query.sort_field,
            order: query.sort_order || 'ASC',
          }
        : undefined;

      const result = await UserService.getAllUsers(
        filters,
        query.page,
        query.limit,
        sort
      );

      paginated(res, result.users, result.meta, 'Users retrieved successfully');
    } catch (err) {
      if (err instanceof Error && err.name === 'ZodError') {
        error(res, 'Validation failed', 400, [err.message]);
        return;
      }
      next(err);
    }
  }

  /**
   * Get user by ID
   */
  static async getUser(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      
      if (!id) {
        error(res, 'User ID is required', 400);
        return;
      }

      const user = await UserService.getUserById(id);

      if (!user) {
        error(res, 'User not found', 404);
        return;
      }

      success(res, user, 'User retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  /**
   * Create user
   */
  static async createUser(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const createdBy = req.user?.id;

      // Validate request body
      const validatedData = createUserSchema.parse(req.body);
      
      // Enforce single role: only take the first valid role if multiple are provided
      let roleIds: string[] | undefined = undefined;
      if (validatedData.role_ids && validatedData.role_ids.length > 0) {
        const firstRoleId = validatedData.role_ids.find((id): id is string => typeof id === 'string' && id.length > 0);
        if (firstRoleId) {
          roleIds = [firstRoleId];
        }
      }
      
      const userData: CreateUserDto = {
        username: validatedData.username,
        contacts: validatedData.contacts,
        ...(validatedData.first_name !== undefined && validatedData.first_name !== null ? { first_name: validatedData.first_name } : {}),
        ...(validatedData.last_name !== undefined && validatedData.last_name !== null ? { last_name: validatedData.last_name } : {}),
        ...(validatedData.password !== undefined && validatedData.password !== null ? { password: validatedData.password } : {}),
        ...(roleIds !== undefined ? { role_ids: roleIds } : {}),
      };

      const user = await UserService.createUser(userData, createdBy);

      success(res, user, 'User created successfully', 201);
    } catch (err) {
      if (err instanceof Error && err.name === 'ZodError') {
        error(res, 'Validation failed', 400, [err.message]);
        return;
      }
      if (err instanceof Error) {
        error(res, err.message, 400);
        return;
      }
      next(err);
    }
  }

  /**
   * Update user
   */
  static async updateUser(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      
      if (!id) {
        error(res, 'User ID is required', 400);
        return;
      }
      
      const updatedBy = req.user?.id;

      // Validate request body
      const validatedData = updateUserSchema.parse(req.body);
      const userData: UpdateUserDto = {
        ...(validatedData.first_name !== undefined && validatedData.first_name !== null ? { first_name: validatedData.first_name } : {}),
        ...(validatedData.last_name !== undefined && validatedData.last_name !== null ? { last_name: validatedData.last_name } : {}),
        ...(validatedData.is_active !== undefined ? { is_active: validatedData.is_active } : {}),
      };

      const user = await UserService.updateUser(id, userData, updatedBy);

      success(res, user, 'User updated successfully');
    } catch (err) {
      if (err instanceof Error && err.name === 'ZodError') {
        error(res, 'Validation failed', 400, [err.message]);
        return;
      }
      if (err instanceof Error) {
        error(res, err.message, 400);
        return;
      }
      next(err);
    }
  }

  /**
   * Delete user
   */
  static async deleteUser(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      
      if (!id) {
        error(res, 'User ID is required', 400);
        return;
      }
      
      const deletedBy = req.user?.id;

      await UserService.deleteUser(id, deletedBy);

      success(res, null, 'User deleted successfully');
    } catch (err) {
      if (err instanceof Error) {
        error(res, err.message, 400);
        return;
      }
      next(err);
    }
  }

  /**
   * Add contact to user
   */
  static async addContact(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id: userId } = req.params;
      
      if (!userId) {
        error(res, 'User ID is required', 400);
        return;
      }
      
      const createdBy = req.user?.id;

      // Validate request body
      const validatedData = addContactSchema.parse(req.body);
      const contactData: AddContactDto = {
        contact_type_id: validatedData.contact_type_id,
        contact: validatedData.contact,
      };

      const contact = await UserService.addUserContact(userId, contactData, createdBy);

      success(res, contact, 'Contact added successfully', 201);
    } catch (err) {
      if (err instanceof Error && err.name === 'ZodError') {
        error(res, 'Validation failed', 400, [err.message]);
        return;
      }
      if (err instanceof Error) {
        error(res, err.message, 400);
        return;
      }
      next(err);
    }
  }

  /**
   * Remove contact from user
   */
  static async removeContact(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id: userId, contactId } = req.params;
      
      if (!userId || !contactId) {
        error(res, 'User ID and Contact ID are required', 400);
        return;
      }
      
      const deletedBy = req.user?.id;

      await UserService.removeUserContact(userId, contactId, deletedBy);

      success(res, null, 'Contact removed successfully');
    } catch (err) {
      if (err instanceof Error) {
        error(res, err.message, 400);
        return;
      }
      next(err);
    }
  }

  /**
   * Update user contact
   */
  static async updateContact(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id: userId, contactId } = req.params;
      
      if (!userId || !contactId) {
        error(res, 'User ID and Contact ID are required', 400);
        return;
      }
      
      const updatedBy = req.user?.id;

      // Validate request body
      const validatedData = updateContactSchema.parse(req.body);
      const contactData: UpdateContactDto = {
        ...(validatedData.contact ? { contact: validatedData.contact } : {}),
      };

      const contact = await UserService.updateUserContact(userId, contactId, contactData, updatedBy);

      success(res, contact, 'Contact updated successfully');
    } catch (err) {
      if (err instanceof Error && err.name === 'ZodError') {
        error(res, 'Validation failed', 400, [err.message]);
        return;
      }
      if (err instanceof Error) {
        error(res, err.message, 400);
        return;
      }
      next(err);
    }
  }

  /**
   * Assign role to user
   */
  static async assignRole(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id: userId } = req.params;
      
      if (!userId) {
        error(res, 'User ID is required', 400);
        return;
      }
      
      const createdBy = req.user?.id;

      // Validate request body
      const validatedData = assignRoleSchema.parse(req.body);

      const role = await UserService.assignRoleToUser(userId, validatedData.role_id, createdBy);

      success(res, role, 'Role assigned successfully', 201);
    } catch (err) {
      if (err instanceof Error && err.name === 'ZodError') {
        error(res, 'Validation failed', 400, [err.message]);
        return;
      }
      if (err instanceof Error) {
        error(res, err.message, 400);
        return;
      }
      next(err);
    }
  }

  /**
   * Remove role from user
   */
  static async removeRole(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id: userId, roleId } = req.params;
      
      if (!userId || !roleId) {
        error(res, 'User ID and Role ID are required', 400);
        return;
      }
      
      const deletedBy = req.user?.id;

      await UserService.removeRoleFromUser(userId, roleId, deletedBy);

      success(res, null, 'Role removed successfully');
    } catch (err) {
      if (err instanceof Error) {
        error(res, err.message, 400);
        return;
      }
      next(err);
    }
  }

  /**
   * Get user roles
   */
  static async getUserRoles(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      
      if (!id) {
        error(res, 'User ID is required', 400);
        return;
      }

      const roles = await UserService.getUserRoles(id);

      success(res, roles, 'User roles retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get user contacts
   */
  static async getUserContacts(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      
      if (!id) {
        error(res, 'User ID is required', 400);
        return;
      }

      const contacts = await UserService.getUserContacts(id);

      success(res, contacts, 'User contacts retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  /**
   * Change user password
   */
  static async changePassword(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      
      if (!id) {
        error(res, 'User ID is required', 400);
        return;
      }
      
      const updatedBy = req.user?.id;

      // Validate request body
      const validatedData = changeUserPasswordSchema.parse(req.body);

      await UserService.changeUserPassword(id, validatedData.new_password, updatedBy);

      success(res, null, 'Password changed successfully');
    } catch (err) {
      if (err instanceof Error && err.name === 'ZodError') {
        error(res, 'Validation failed', 400, [err.message]);
        return;
      }
      if (err instanceof Error) {
        error(res, err.message, 400);
        return;
      }
      next(err);
    }
  }
}
