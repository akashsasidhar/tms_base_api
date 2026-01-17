import { Permission } from '../../models';
import { Op } from 'sequelize';

export interface PermissionResponseDto {
  id: string;
  resource: string;
  action: string;
  permission: string; // resource:action format
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface PermissionsByResourceDto {
  resource: string;
  permissions: PermissionResponseDto[];
}

/**
 * Permission Service
 * Permissions are usually seeded, not created via API
 */
export class PermissionService {
  /**
   * Get all permissions
   */
  static async getAllPermissions(): Promise<PermissionResponseDto[]> {
    const permissions = await Permission.findAll({
      where: {
        deleted_at: null,
        is_active: true,
      },
      order: [
        ['resource', 'ASC'],
        ['action', 'ASC'],
      ],
    });

    return permissions.map((permission) => ({
      id: permission.id,
      resource: permission.resource,
      action: permission.action,
      permission: `${permission.resource}:${permission.action}`,
      is_active: permission.is_active,
      created_at: permission.created_at,
      updated_at: permission.updated_at,
    }));
  }

  /**
   * Get permissions grouped by resource
   */
  static async getPermissionsByResource(): Promise<PermissionsByResourceDto[]> {
    const permissions = await this.getAllPermissions();

    // Group by resource
    const grouped = permissions.reduce((acc, permission) => {
      const resource = permission.resource;
      if (!acc[resource]) {
        acc[resource] = [];
      }
      acc[resource]!.push(permission);
      return acc;
    }, {} as Record<string, PermissionResponseDto[]>);

    // Convert to array format
    return Object.keys(grouped)
      .sort()
      .map((resource) => ({
        resource,
        permissions: grouped[resource]!,
      }));
  }

  /**
   * Get permissions by resource name
   */
  static async getPermissionsByResourceName(resource: string): Promise<PermissionResponseDto[]> {
    const permissions = await Permission.findAll({
      where: {
        resource,
        deleted_at: null,
        is_active: true,
      },
      order: [['action', 'ASC']],
    });

    return permissions.map((permission) => ({
      id: permission.id,
      resource: permission.resource,
      action: permission.action,
      permission: `${permission.resource}:${permission.action}`,
      is_active: permission.is_active,
      created_at: permission.created_at,
      updated_at: permission.updated_at,
    }));
  }

  /**
   * Get permission by ID
   */
  static async getPermissionById(id: string): Promise<PermissionResponseDto | null> {
    const permission = await Permission.findOne({
      where: {
        id,
        deleted_at: null,
      },
    });

    if (!permission) {
      return null;
    }

    return {
      id: permission.id,
      resource: permission.resource,
      action: permission.action,
      permission: `${permission.resource}:${permission.action}`,
      is_active: permission.is_active,
      created_at: permission.created_at,
      updated_at: permission.updated_at,
    };
  }

  /**
   * Verify permission IDs exist
   */
  static async verifyPermissionIds(permissionIds: string[]): Promise<boolean> {
    const count = await Permission.count({
      where: {
        id: {
          [Op.in]: permissionIds,
        },
        deleted_at: null,
        is_active: true,
      },
    });

    return count === permissionIds.length;
  }
}
