import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { checkPermission } from '../../middleware/rbac.middleware';
import { PERMISSIONS } from '../../constants/permissions';
import { RoleController } from './role.controller';

const router = Router();

/**
 * @route   GET /api/roles/task-types
 * @desc    Get roles for task type selection (excludes Project Manager, Admin, Super Admin)
 * @access  Private - Requires authentication only (no specific permission)
 */
router.get(
  '/task-types',
  authenticate,
  RoleController.getTaskTypes
);

/**
 * @route   GET /api/roles
 * @desc    Get all roles with filtering and pagination
 * @access  Private - Requires 'roles:read' permission
 */
router.get(
  '/',
  authenticate,
  checkPermission([PERMISSIONS.ROLES.READ]),
  RoleController.getRoles
);

/**
 * @route   GET /api/roles/:id
 * @desc    Get role by ID with permissions and users
 * @access  Private - Requires 'roles:read' permission
 */
router.get(
  '/:id',
  authenticate,
  checkPermission([PERMISSIONS.ROLES.READ]),
  RoleController.getRole
);

/**
 * @route   POST /api/roles
 * @desc    Create new role
 * @access  Private - Requires 'roles:create' permission
 */
router.post(
  '/',
  authenticate,
  checkPermission([PERMISSIONS.ROLES.CREATE]),
  RoleController.createRole
);

/**
 * @route   PUT /api/roles/:id
 * @desc    Update role
 * @access  Private - Requires 'roles:update' permission
 */
router.put(
  '/:id',
  authenticate,
  checkPermission([PERMISSIONS.ROLES.UPDATE]),
  RoleController.updateRole
);

/**
 * @route   DELETE /api/roles/:id
 * @desc    Delete role (soft delete)
 * @access  Private - Requires 'roles:delete' permission
 * @query   force=true to force delete even if users are assigned
 */
router.delete(
  '/:id',
  authenticate,
  checkPermission([PERMISSIONS.ROLES.DELETE]),
  RoleController.deleteRole
);

/**
 * @route   POST /api/roles/:id/permissions
 * @desc    Assign permissions to role (bulk)
 * @access  Private - Requires 'roles:update' permission
 */
router.post(
  '/:id/permissions',
  authenticate,
  checkPermission([PERMISSIONS.ROLES.UPDATE]),
  RoleController.assignPermissionsToRole
);

/**
 * @route   DELETE /api/roles/:id/permissions
 * @desc    Remove permissions from role (bulk)
 * @access  Private - Requires 'roles:update' permission
 */
router.delete(
  '/:id/permissions',
  authenticate,
  checkPermission([PERMISSIONS.ROLES.UPDATE]),
  RoleController.removePermissionsFromRole
);

/**
 * @route   GET /api/roles/:id/permissions
 * @desc    Get role permissions
 * @access  Private - Requires 'roles:read' permission
 */
router.get(
  '/:id/permissions',
  authenticate,
  checkPermission([PERMISSIONS.ROLES.READ]),
  RoleController.getRolePermissions
);

/**
 * @route   GET /api/roles/:id/users
 * @desc    Get users with this role
 * @access  Private - Requires 'roles:read' permission
 */
router.get(
  '/:id/users',
  authenticate,
  checkPermission([PERMISSIONS.ROLES.READ]),
  RoleController.getRoleUsers
);

export default router;
