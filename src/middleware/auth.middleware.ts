import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt.util';
// Models are not directly used in this middleware
import { loadUserPermissions } from './rbac.middleware';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    userId: string; // Alias for id (for backward compatibility)
    username: string;
    roles: Array<{ id: string; name: string }>;
    permissions: string[];
  };
}

/**
 * Authentication middleware
 * Verifies access token and attaches user info to request
 */
export async function authenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Get token from cookie or Authorization header
    let token: string | undefined;
    // Check cookie first
    if (req.cookies && req.cookies['accessToken']) {
      token = req.cookies['accessToken'];
    }

    // Check Authorization header if no cookie
    if (!token && req.headers.authorization) {
      const authHeader = req.headers.authorization;
      if (authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
        errors: ['No access token provided'],
      });
      return;
    }

    // Verify token
    const payload = await verifyAccessToken(token);

    // Load user permissions (with caching)
    const { permissions, roles } = await loadUserPermissions(payload.userId);

    // Attach user info to request with permissions
    req.user = {
      id: payload.userId,
      userId: payload.userId,
      username: payload.username,
      roles,
      permissions,
    };

    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Authentication failed',
      errors: [error instanceof Error ? error.message : 'Invalid or expired token'],
    });
  }
}

/**
 * Authorization middleware - Check if user has required role
 * @deprecated Use checkPermission from rbac.middleware instead for permission-based access control
 */
export function authorize(...allowedRoles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
        errors: ['User not authenticated'],
      });
      return;
    }

    const hasRole = req.user.roles.some((role) => allowedRoles.includes(role.name));

    if (!hasRole) {
      res.status(403).json({
        success: false,
        message: 'Access forbidden',
        errors: ['Insufficient permissions'],
      });
      return;
    }

    next();
  };
}
