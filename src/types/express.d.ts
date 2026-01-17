import { UserRoleInfo } from '../helpers/permission.helper';

/**
 * Extend Express Request type to include user and permissions
 */
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        userId: string; // Alias for id (for backward compatibility)
        username: string;
        roles: Array<{ id: string; name: string }>;
        permissions: string[];
      };
    }
  }
}

export {};
