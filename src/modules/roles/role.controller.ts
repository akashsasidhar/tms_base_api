import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import { RoleService } from './role.service';
import {
  createRoleSchema,
  updateRoleSchema,
  assignPermissionsSchema,
  removePermissionsSchema,
  getRolesQuerySchema,
} from './role.validation';
import { CreateRoleDto, UpdateRoleDto, AssignPermissionsDto, RemovePermissionsDto } from './role.types';
import { success, error, paginated } from '../../utils/response.util';

/**
 * Role Controller - Handles HTTP requests for role management
 */
export class RoleController {
  /**
   * Get all roles
   */
  static async getRoles(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate query parameters
      const query = getRolesQuerySchema.parse(req.query);

      const filters: {
        name?: string;
        is_active?: boolean;
      } = {};
      
      if (query.name) filters.name = query.name;
      if (query.is_active !== undefined) filters.is_active = query.is_active;

      const result = await RoleService.getAllRoles(filters, query.page, query.limit);

      paginated(res, result.roles, result.meta, 'Roles retrieved successfully');
    } catch (err) {
      if (err instanceof Error && err.name === 'ZodError') {
        error(res, 'Validation failed', 400, [err.message]);
        return;
      }
      next(err);
    }
  }

  /**
   * Get role by ID
   */
  static async getRole(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      
      if (!id) {
        error(res, 'Role ID is required', 400);
        return;
      }

      const role = await RoleService.getRoleById(id);

      if (!role) {
        error(res, 'Role not found', 404);
        return;
      }

      success(res, role, 'Role retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  /**
   * Create role
   */
  static async createRole(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const createdBy = req.user?.id;

      // Validate request body
      const validatedData = createRoleSchema.parse(req.body);
      const roleData: CreateRoleDto = {
        name: validatedData.name,
        ...(validatedData.description !== undefined && validatedData.description !== null ? { description: validatedData.description } : {}),
      };

      const role = await RoleService.createRole(roleData, createdBy);

      success(res, role, 'Role created successfully', 201);
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
   * Update role
   */
  static async updateRole(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      
      if (!id) {
        error(res, 'Role ID is required', 400);
        return;
      }
      
      const updatedBy = req.user?.id;

      // Validate request body
      const validatedData = updateRoleSchema.parse(req.body);
      const roleData: UpdateRoleDto = {
        ...(validatedData.name ? { name: validatedData.name } : {}),
        ...(validatedData.description !== undefined && validatedData.description !== null ? { description: validatedData.description } : {}),
        ...(validatedData.is_active !== undefined ? { is_active: validatedData.is_active } : {}),
      };

      const role = await RoleService.updateRole(id, roleData, updatedBy);

      success(res, role, 'Role updated successfully');
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
   * Delete role
   */
  static async deleteRole(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      
      if (!id) {
        error(res, 'Role ID is required', 400);
        return;
      }
      
      const deletedBy = req.user?.id;
      const force = req.query['force'] === 'true';

      await RoleService.deleteRole(id, deletedBy, force);

      success(res, null, 'Role deleted successfully');
    } catch (err) {
      if (err instanceof Error) {
        error(res, err.message, 400);
        return;
      }
      next(err);
    }
  }

  /**
   * Assign permissions to role
   */
  static async assignPermissionsToRole(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id: roleId } = req.params;
      
      if (!roleId) {
        error(res, 'Role ID is required', 400);
        return;
      }
      
      const createdBy = req.user?.id;

      // Validate request body
      const validatedData = assignPermissionsSchema.parse(req.body);
      const permissionData: AssignPermissionsDto = {
        permission_ids: validatedData.permission_ids,
      };

      const permissions = await RoleService.assignPermissions(
        roleId,
        permissionData.permission_ids,
        createdBy
      );

      success(res, permissions, 'Permissions assigned successfully', 201);
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
   * Remove permissions from role
   */
  static async removePermissionsFromRole(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id: roleId } = req.params;
      
      if (!roleId) {
        error(res, 'Role ID is required', 400);
        return;
      }
      
      const deletedBy = req.user?.id;

      // Validate request body
      const validatedData = removePermissionsSchema.parse(req.body);
      const permissionData: RemovePermissionsDto = {
        permission_ids: validatedData.permission_ids,
      };

      await RoleService.removePermissions(roleId, permissionData.permission_ids, deletedBy);

      success(res, null, 'Permissions removed successfully');
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
   * Get role permissions
   */
  static async getRolePermissions(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      
      if (!id) {
        error(res, 'Role ID is required', 400);
        return;
      }

      const permissions = await RoleService.getRolePermissions(id);

      success(res, permissions, 'Role permissions retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get users with this role
   */
  static async getRoleUsers(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      
      if (!id) {
        error(res, 'Role ID is required', 400);
        return;
      }

      const users = await RoleService.getRoleUsers(id);

      success(res, users, 'Role users retrieved successfully');
    } catch (err) {
      next(err);
    }
  }
}
