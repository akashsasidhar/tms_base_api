import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { checkPermission } from '../../middleware/rbac.middleware';
import { PERMISSIONS } from '../../constants/permissions';
import { UserController } from './user.controller';

const router = Router();

/**
 * @route   GET /api/users/list
 * @desc    Get users list for selection/dropdown purposes (simplified data)
 * @access  Private - Requires authentication only (no specific permission)
 * @note    This endpoint is designed for user selection in forms, assignee selection, etc.
 *          Returns only essential fields: id, username, first_name, last_name, roles, is_active
 */
router.get(
  '/list',
  authenticate,
  UserController.getUsersList
);

/**
 * @route   GET /api/users
 * @desc    Get all users with filtering, pagination, and sorting
 * @access  Private - Requires 'users:read' permission
 */
router.get(
  '/',
  authenticate,
  checkPermission([PERMISSIONS.USERS.READ]),
  UserController.getUsers
);

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID
 * @access  Private - Requires 'users:read' permission
 */
router.get(
  '/:id',
  authenticate,
  checkPermission([PERMISSIONS.USERS.READ]),
  UserController.getUser
);

/**
 * @route   POST /api/users
 * @desc    Create new user
 * @access  Private - Requires 'users:create' permission
 */
router.post(
  '/',
  authenticate,
  checkPermission([PERMISSIONS.USERS.CREATE]),
  UserController.createUser
);

/**
 * @route   PUT /api/users/:id
 * @desc    Update user
 * @access  Private - Requires 'users:update' permission
 */
router.put(
  '/:id',
  authenticate,
  checkPermission([PERMISSIONS.USERS.UPDATE]),
  UserController.updateUser
);

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete user (soft delete)
 * @access  Private - Requires 'users:delete' permission
 */
router.delete(
  '/:id',
  authenticate,
  checkPermission([PERMISSIONS.USERS.DELETE]),
  UserController.deleteUser
);

/**
 * @route   POST /api/users/:id/contacts
 * @desc    Add contact to user
 * @access  Private - Requires 'contacts:create' permission
 */
router.post(
  '/:id/contacts',
  authenticate,
  checkPermission([PERMISSIONS.CONTACTS.CREATE]),
  UserController.addContact
);

/**
 * @route   PUT /api/users/:id/contacts/:contactId
 * @desc    Update user contact
 * @access  Private - Requires 'contacts:update' permission
 */
router.put(
  '/:id/contacts/:contactId',
  authenticate,
  checkPermission([PERMISSIONS.CONTACTS.UPDATE]),
  UserController.updateContact
);

/**
 * @route   DELETE /api/users/:id/contacts/:contactId
 * @desc    Remove contact from user
 * @access  Private - Requires 'contacts:delete' permission
 */
router.delete(
  '/:id/contacts/:contactId',
  authenticate,
  checkPermission([PERMISSIONS.CONTACTS.DELETE]),
  UserController.removeContact
);

/**
 * @route   GET /api/users/:id/contacts
 * @desc    Get user contacts
 * @access  Private - Requires 'contacts:read' permission
 */
router.get(
  '/:id/contacts',
  authenticate,
  checkPermission([PERMISSIONS.CONTACTS.READ]),
  UserController.getUserContacts
);

/**
 * @route   POST /api/users/:id/roles
 * @desc    Assign role to user
 * @access  Private - Requires 'users:update' permission
 */
router.post(
  '/:id/roles',
  authenticate,
  checkPermission([PERMISSIONS.USERS.UPDATE]),
  UserController.assignRole
);

/**
 * @route   DELETE /api/users/:id/roles/:roleId
 * @desc    Remove role from user
 * @access  Private - Requires 'users:update' permission
 */
router.delete(
  '/:id/roles/:roleId',
  authenticate,
  checkPermission([PERMISSIONS.USERS.UPDATE]),
  UserController.removeRole
);

/**
 * @route   GET /api/users/:id/roles
 * @desc    Get user roles
 * @access  Private - Requires 'users:read' permission
 */
router.get(
  '/:id/roles',
  authenticate,
  checkPermission([PERMISSIONS.USERS.READ]),
  UserController.getUserRoles
);

/**
 * @route   PUT /api/users/:id/change-password
 * @desc    Change user password
 * @access  Private - Requires 'users:update' permission
 */
router.put(
  '/:id/change-password',
  authenticate,
  checkPermission([PERMISSIONS.USERS.UPDATE]),
  UserController.changePassword
);

export default router;
