import { UserRole, Role, RolePermission, Permission } from '../models';
import { Op } from 'sequelize';

export interface UserRoleInfo {
  id: string;
  name: string;
}

export interface UserPermissionInfo {
  id: string;
  resource: string;
  action: string;
  permission: string; // resource:action format
}

/**
 * Get user roles from UserRole table
 */
export async function getUserRoles(userId: string): Promise<UserRoleInfo[]> {
  const userRoles = await UserRole.findAll({
    where: {
      user_id: userId,
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

  return userRoles
    .map((ur) => {
      const userRole = ur as UserRole & { role?: Role };
      return userRole.role;
    })
    .filter((role): role is Role => role !== null && role !== undefined)
    .map((role) => ({
      id: role.id,
      name: role.name,
    }));
}

/**
 * Get aggregated permissions from multiple roles
 */
export async function getAggregatedPermissions(roleIds: string[]): Promise<UserPermissionInfo[]> {
  if (roleIds.length === 0) {
    return [];
  }

  const rolePermissions = await RolePermission.findAll({
    where: {
      role_id: {
        [Op.in]: roleIds,
      },
      is_active: true,
    },
    include: [
      {
        model: Permission,
        as: 'permission',
        where: { is_active: true },
        required: true,
      },
    ],
  });

  // Create a map to deduplicate permissions (same permission from multiple roles)
  const permissionMap = new Map<string, UserPermissionInfo>();

  rolePermissions.forEach((rp) => {
    const rolePermission = rp as RolePermission & { permission?: Permission };
    const permission = rolePermission.permission!;
    const permissionKey = `${permission.resource}:${permission.action}`;

    if (!permissionMap.has(permissionKey)) {
      permissionMap.set(permissionKey, {
        id: permission.id,
        resource: permission.resource,
        action: permission.action,
        permission: permissionKey,
      });
    }
  });

  return Array.from(permissionMap.values());
}

/**
 * Get all permissions for a user (aggregated from all their roles)
 */
export async function getUserPermissions(userId: string): Promise<UserPermissionInfo[]> {
  const userRoles = await getUserRoles(userId);
  const roleIds = userRoles.map((role) => role.id);

  if (roleIds.length === 0) {
    return [];
  }

  return getAggregatedPermissions(roleIds);
}

/**
 * Check if user has a specific permission
 */
export function hasPermission(
  userPermissions: string[],
  requiredPermission: string
): boolean {
  // Check for exact match
  if (userPermissions.includes(requiredPermission)) {
    return true;
  }

  // Check for wildcard/manage permission
  // If user has 'users:manage', they have all 'users:*' permissions
  const [resource, action] = requiredPermission.split(':');
  if (resource && action) {
    const managePermission = `${resource}:manage`;
    if (userPermissions.includes(managePermission)) {
      return true;
    }
  }

  return false;
}

/**
 * Check if user has ANY of the required permissions (OR logic)
 */
export function hasAnyPermission(
  userPermissions: string[],
  requiredPermissions: string[]
): boolean {
  if (requiredPermissions.length === 0) {
    return true; // No requirements means allowed
  }

  return requiredPermissions.some((permission) =>
    hasPermission(userPermissions, permission)
  );
}

/**
 * Check if user has ALL of the required permissions (AND logic)
 */
export function hasAllPermissions(
  userPermissions: string[],
  requiredPermissions: string[]
): boolean {
  if (requiredPermissions.length === 0) {
    return true; // No requirements means allowed
  }

  return requiredPermissions.every((permission) =>
    hasPermission(userPermissions, permission)
  );
}

/**
 * Format permission string from resource and action
 */
export function formatPermission(resource: string, action: string): string {
  return `${resource}:${action}`;
}

/**
 * Parse permission string into resource and action
 */
export function parsePermission(permission: string): { resource: string; action: string } | null {
  const parts = permission.split(':');
  if (parts.length !== 2) {
    return null;
  }

  return {
    resource: parts[0]!,
    action: parts[1]!,
  };
}
