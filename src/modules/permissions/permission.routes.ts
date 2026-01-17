import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { checkPermission } from '../../middleware/rbac.middleware';
import { PERMISSIONS } from '../../constants/permissions';
import { PermissionService } from './permission.service';
import { success, error } from '../../utils/response.util';

const router = Router();

/**
 * @route   GET /api/permissions
 * @desc    Get all permissions
 * @access  Private - Requires 'permissions:read' permission
 */
router.get(
  '/',
  authenticate,
  checkPermission([PERMISSIONS.PERMISSIONS.READ]),
  async (_req, res, next) => {
    try {
      const permissions = await PermissionService.getAllPermissions();
      success(res, permissions, 'Permissions retrieved successfully');
    } catch (err) {
      next(err);
    }
  }
);

/**
 * @route   GET /api/permissions/by-resource
 * @desc    Get permissions grouped by resource
 * @access  Private - Requires 'permissions:read' permission
 */
router.get(
  '/by-resource',
  authenticate,
  checkPermission([PERMISSIONS.PERMISSIONS.READ]),
  async (_req, res, next) => {
    try {
      const permissionsByResource = await PermissionService.getPermissionsByResource();
      success(res, permissionsByResource, 'Permissions retrieved successfully');
    } catch (err) {
      next(err);
    }
  }
);

/**
 * @route   GET /api/permissions/resource/:resource
 * @desc    Get permissions by resource name
 * @access  Private - Requires 'permissions:read' permission
 */
router.get(
  '/resource/:resource',
  authenticate,
  checkPermission([PERMISSIONS.PERMISSIONS.READ]),
  async (req, res, next) => {
    try {
      const { resource } = req.params;
      
      if (!resource) {
        error(res, 'Resource name is required', 400);
        return;
      }
      
      const permissions = await PermissionService.getPermissionsByResourceName(resource);
      success(res, permissions, 'Permissions retrieved successfully');
    } catch (err) {
      next(err);
    }
  }
);

export default router;
