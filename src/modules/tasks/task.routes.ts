import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { checkPermission } from '../../middleware/rbac.middleware';
import { PERMISSIONS } from '../../constants/permissions';
import { TaskController } from './task.controller';

const router = Router();

/**
 * @route   GET /api/tasks
 * @desc    Get all tasks with filtering, pagination, and sorting
 * @access  Private - Requires 'tasks:read' permission (Project Manager/Admin/Task Assignees)
 */
router.get(
  '/',
  authenticate,
  checkPermission([PERMISSIONS.TASKS.READ]),
  TaskController.getTasks
);

/**
 * @route   GET /api/tasks/pending
 * @desc    Get pending tasks (overdue and not completed)
 * @access  Private - Requires 'tasks:read' permission
 */
router.get(
  '/pending',
  authenticate,
  checkPermission([PERMISSIONS.TASKS.READ]),
  TaskController.getPendingTasks
);

/**
 * @route   GET /api/tasks/completed
 * @desc    Get completed tasks
 * @access  Private - Requires 'tasks:read' permission
 */
router.get(
  '/completed',
  authenticate,
  checkPermission([PERMISSIONS.TASKS.READ]),
  TaskController.getCompletedTasks
);

/**
 * @route   GET /api/tasks/:id
 * @desc    Get task by ID
 * @access  Private - Requires 'tasks:read' permission
 */
router.get(
  '/:id',
  authenticate,
  checkPermission([PERMISSIONS.TASKS.READ]),
  TaskController.getTask
);

/**
 * @route   POST /api/tasks
 * @desc    Create new task
 * @access  Private - Requires 'tasks:create' permission (Project Manager)
 */
router.post(
  '/',
  authenticate,
  checkPermission([PERMISSIONS.TASKS.CREATE]),
  TaskController.createTask
);

/**
 * @route   PUT /api/tasks/:id
 * @desc    Update task
 * @access  Private - Requires 'tasks:update' permission (Project Manager/Task Assignees)
 */
router.put(
  '/:id',
  authenticate,
  checkPermission([PERMISSIONS.TASKS.UPDATE]),
  TaskController.updateTask
);

/**
 * @route   DELETE /api/tasks/:id
 * @desc    Delete task (soft delete)
 * @access  Private - Requires 'tasks:delete' permission (Project Manager/Admin)
 */
router.delete(
  '/:id',
  authenticate,
  checkPermission([PERMISSIONS.TASKS.DELETE]),
  TaskController.deleteTask
);

export default router;
