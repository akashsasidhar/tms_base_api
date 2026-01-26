import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { checkPermission } from '../../middleware/rbac.middleware';
import { PERMISSIONS } from '../../constants/permissions';
import { ProjectController } from './project.controller';

const router = Router();

/**
 * @route   GET /api/projects/list
 * @desc    Get simplified list of projects (for dropdowns, etc.)
 * @access  Private - Requires authentication only (no permission required)
 */
router.get(
  '/list',
  authenticate,
  ProjectController.getProjectsList
);

/**
 * @route   GET /api/projects
 * @desc    Get all projects with filtering, pagination, and sorting
 * @access  Private - Requires 'projects:read' permission (Project Manager/Admin/Project Assigned Roles)
 */
router.get(
  '/',
  authenticate,
  checkPermission([PERMISSIONS.PROJECTS.READ]),
  ProjectController.getProjects
);

/**
 * @route   GET /api/projects/:id
 * @desc    Get project by ID
 * @access  Private - Requires 'projects:read' permission
 */
router.get(
  '/:id',
  authenticate,
  checkPermission([PERMISSIONS.PROJECTS.READ]),
  ProjectController.getProject
);

/**
 * @route   POST /api/projects
 * @desc    Create new project
 * @access  Private - Requires 'projects:create' permission (Project Manager/Admin)
 */
router.post(
  '/',
  authenticate,
  checkPermission([PERMISSIONS.PROJECTS.CREATE]),
  ProjectController.createProject
);

/**
 * @route   PUT /api/projects/:id
 * @desc    Update project
 * @access  Private - Requires 'projects:update' permission (Project Manager/Admin)
 */
router.put(
  '/:id',
  authenticate,
  checkPermission([PERMISSIONS.PROJECTS.UPDATE]),
  ProjectController.updateProject
);

/**
 * @route   DELETE /api/projects/:id
 * @desc    Delete project (soft delete)
 * @access  Private - Requires 'projects:delete' permission (Admin only)
 */
router.delete(
  '/:id',
  authenticate,
  checkPermission([PERMISSIONS.PROJECTS.DELETE]),
  ProjectController.deleteProject
);

export default router;
