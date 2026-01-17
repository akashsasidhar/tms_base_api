/**
 * System Permissions Constants
 * Format: resource:action
 */
export const PERMISSIONS = {
  USERS: {
    CREATE: 'users:create',
    READ: 'users:read',
    UPDATE: 'users:update',
    DELETE: 'users:delete',
    MANAGE: 'users:manage', // Full access to users
  },
  ROLES: {
    CREATE: 'roles:create',
    READ: 'roles:read',
    UPDATE: 'roles:update',
    DELETE: 'roles:delete',
    MANAGE: 'roles:manage', // Full access to roles
  },
  PERMISSIONS: {
    CREATE: 'permissions:create',
    READ: 'permissions:read',
    UPDATE: 'permissions:update',
    DELETE: 'permissions:delete',
    MANAGE: 'permissions:manage', // Full access to permissions
  },
  CONTACTS: {
    CREATE: 'contacts:create',
    READ: 'contacts:read',
    UPDATE: 'contacts:update',
    DELETE: 'contacts:delete',
    MANAGE: 'contacts:manage', // Full access to contacts
  },
  USER_ROLES: {
    ASSIGN: 'user_roles:assign',
    REVOKE: 'user_roles:revoke',
    READ: 'user_roles:read',
    MANAGE: 'user_roles:manage', // Full access to user roles
  },
  ROLE_PERMISSIONS: {
    ASSIGN: 'role_permissions:assign',
    REVOKE: 'role_permissions:revoke',
    READ: 'role_permissions:read',
    MANAGE: 'role_permissions:manage', // Full access to role permissions
  },
  AUTH: {
    REGISTER: 'auth:register',
    LOGIN: 'auth:login',
    LOGOUT: 'auth:logout',
    REFRESH: 'auth:refresh',
    RESET_PASSWORD: 'auth:reset_password',
    CHANGE_PASSWORD: 'auth:change_password',
    VERIFY_CONTACT: 'auth:verify_contact',
  },
} as const;

/**
 * Get all permission values as flat array
 */
export function getAllPermissions(): string[] {
  return Object.values(PERMISSIONS).flatMap((resource) => Object.values(resource));
}

/**
 * Check if a permission string is valid
 */
export function isValidPermission(permission: string): boolean {
  return getAllPermissions().includes(permission);
}
