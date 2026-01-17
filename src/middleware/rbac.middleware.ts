import { Response, NextFunction } from 'express';
import { getUserRoles, getUserPermissions, hasAnyPermission, hasAllPermissions } from '../helpers/permission.helper';
import { AuthRequest } from './auth.middleware';

/**
 * In-memory cache for user permissions
 * Key: userId, Value: { permissions: string[], roles: UserRoleInfo[], expiresAt: number }
 */
interface PermissionCache {
  permissions: string[];
  roles: Array<{ id: string; name: string }>;
  expiresAt: number;
}

const permissionCache = new Map<string, PermissionCache>();

// Cache TTL: 5 minutes (300000 ms)
const CACHE_TTL = 5 * 60 * 1000;

/**
 * Clear permission cache for a user
 */
export function clearUserPermissionCache(userId: string): void {
  permissionCache.delete(userId);
}

/**
 * Clear all permission cache
 */
export function clearAllPermissionCache(): void {
  permissionCache.clear();
}

/**
 * Load user permissions from database (with caching)
 */
export async function loadUserPermissions(userId: string): Promise<{
  permissions: string[];
  roles: Array<{ id: string; name: string }>;
}> {
  // Check cache first
  const cached = permissionCache.get(userId);
  if (cached && cached.expiresAt > Date.now()) {
    return {
      permissions: cached.permissions,
      roles: cached.roles,
    };
  }

  // Load from database
  const [roles, permissions] = await Promise.all([
    getUserRoles(userId),
    getUserPermissions(userId),
  ]);

  const permissionStrings = permissions.map((p) => p.permission);

  // Cache the result
  permissionCache.set(userId, {
    permissions: permissionStrings,
    roles,
    expiresAt: Date.now() + CACHE_TTL,
  });

  return {
    permissions: permissionStrings,
    roles,
  };
}

/**
 * RBAC Middleware - Check user permissions
 * @param requiredPermissions - Array of required permissions
 * @param logic - 'AND' (user must have ALL permissions) or 'OR' (user must have ANY permission)
 */
export function checkPermission(
  requiredPermissions: string[],
  logic: 'AND' | 'OR' = 'AND'
) {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Ensure user is authenticated
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
          errors: ['User not authenticated'],
        });
        return;
      }

      const userId = req.user.userId;

      // Load user permissions (with caching)
      const { permissions, roles } = await loadUserPermissions(userId);

      // Attach permissions and roles to request user object
      req.user.permissions = permissions;
      req.user.roles = roles.map((r) => ({ id: r.id, name: r.name }));

      // Check permissions based on logic
      let hasAccess = false;

      if (logic === 'OR') {
        hasAccess = hasAnyPermission(permissions, requiredPermissions);
      } else {
        hasAccess = hasAllPermissions(permissions, requiredPermissions);
      }

      if (!hasAccess) {
        res.status(403).json({
          success: false,
          message: 'Access forbidden',
          errors: [
            `Required permission(s): ${requiredPermissions.join(logic === 'OR' ? ' OR ' : ' AND ')}`,
          ],
        });
        return;
      }

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      res.status(500).json({
        success: false,
        message: 'Permission check failed',
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      });
    }
  };
}

/**
 * Middleware to load and attach user permissions to request
 * Use this if you need permissions but don't want to check them yet
 */
export async function attachUserPermissions(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
        errors: ['User not authenticated'],
      });
      return;
    }

    const userId = req.user.userId;
    const { permissions, roles } = await loadUserPermissions(userId);

    // Attach to request
    req.user.permissions = permissions;
    req.user.roles = roles.map((r) => ({ id: r.id, name: r.name }));

    next();
  } catch (error) {
    console.error('Attach permissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load user permissions',
      errors: [error instanceof Error ? error.message : 'Unknown error'],
    });
  }
}
