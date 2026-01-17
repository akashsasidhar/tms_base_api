/**
 * EXAMPLE: How to use RBAC middleware in routes
 * 
 * This file demonstrates the usage of RBAC middleware.
 * Copy the patterns to your actual route files.
 */

import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { checkPermission, attachUserPermissions } from '../../middleware/rbac.middleware';
import { PERMISSIONS } from '../../constants/permissions';

const router = Router();

/**
 * Example 1: Simple permission check (AND logic by default)
 * User must have 'users:read' permission
 */
router.get(
  '/users',
  authenticate,
  checkPermission([PERMISSIONS.USERS.READ]),
  (req, res) => {
    // req.user.permissions is available here
    res.json({ message: 'Users list', user: req.user });
  }
);

/**
 * Example 2: Multiple permissions with AND logic
 * User must have BOTH 'users:read' AND 'users:write' permissions
 */
router.post(
  '/users',
  authenticate,
  checkPermission([PERMISSIONS.USERS.READ, PERMISSIONS.USERS.CREATE], 'AND'),
  (req, res) => {
    res.json({ message: 'Create user' });
  }
);

/**
 * Example 3: Multiple permissions with OR logic
 * User must have EITHER 'users:read' OR 'users:write' permission
 */
router.get(
  '/users/:id',
  authenticate,
  checkPermission([PERMISSIONS.USERS.READ, PERMISSIONS.USERS.UPDATE], 'OR'),
  (req, res) => {
    res.json({ message: 'Get or update user' });
  }
);

/**
 * Example 4: Using manage permission
 * If user has 'users:manage', they automatically have all 'users:*' permissions
 */
router.delete(
  '/users/:id',
  authenticate,
  checkPermission([PERMISSIONS.USERS.DELETE]),
  (req, res) => {
    // User with 'users:manage' will also pass this check
    res.json({ message: 'Delete user' });
  }
);

/**
 * Example 5: Attach permissions without checking
 * Useful when you need permissions in controller but want custom logic
 */
router.get(
  '/profile',
  authenticate,
  attachUserPermissions,
  (req, res) => {
    // req.user.permissions is available
    // You can implement custom permission logic in controller
    const canManageUsers = req.user?.permissions.includes(PERMISSIONS.USERS.MANAGE);
    res.json({
      user: req.user,
      canManageUsers,
    });
  }
);

/**
 * Example 6: Multiple permission checks in sequence
 */
router.put(
  '/users/:id/roles',
  authenticate,
  checkPermission([PERMISSIONS.USERS.UPDATE], 'AND'),
  checkPermission([PERMISSIONS.USER_ROLES.ASSIGN], 'AND'),
  (req, res) => {
    // User must have both permissions
    res.json({ message: 'Assign role to user' });
  }
);

/**
 * Example 7: Combining with role-based authorization (legacy)
 */
import { authorize } from '../../middleware/auth.middleware';

router.get(
  '/admin/users',
  authenticate,
  authorize('admin', 'Super Admin'), // Role-based check
  checkPermission([PERMISSIONS.USERS.READ]), // Permission-based check
  (req, res) => {
    res.json({ message: 'Admin users list' });
  }
);

export default router;
