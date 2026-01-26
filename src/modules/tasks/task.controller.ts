import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import { TaskService } from './task.service';
import {
  createTaskSchema,
  updateTaskSchema,
  getTasksQuerySchema,
} from './task.validation';
import { CreateTaskDto, UpdateTaskDto, TaskFilters } from './task.types';
import { success, error, paginated } from '../../utils/response.util';

/**
 * Task Controller - Handles HTTP requests for task management
 */
export class TaskController {
  /**
   * Get all tasks
   */
  static async getTasks(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate query parameters
      const query = getTasksQuerySchema.parse(req.query);

      const filters: TaskFilters = {};

      // Handle search parameter (searches in title)
      if (query.search) {
        filters.title = query.search;
      }

      if (query.project_id) filters.project_id = query.project_id;
      if (query.title) filters.title = query.title;
      if (query.task_type) filters.task_type = query.task_type;
      if (query.priority) filters.priority = query.priority;
      if (query.status) filters.status = query.status;
      if (query.created_by) filters.created_by = query.created_by;
      if (query.assigned_to) filters.assigned_to = query.assigned_to;
      if (query.is_active !== undefined) filters.is_active = query.is_active;
      if (query.list_type) filters.list_type = query.list_type;
      if (query.due_date_from) filters.due_date_from = query.due_date_from;
      if (query.due_date_to) filters.due_date_to = query.due_date_to;

      const sortField = query.sort_field;
      const sortOrder = query.sort_order || 'ASC';

      const result = await TaskService.getAllTasks(
        filters,
        query.page || 1,
        query.limit || 10,
        sortField,
        sortOrder,
        req.user?.id,
        req.user?.roles
      );

      paginated(res, result.tasks, result.meta, 'Tasks retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get pending tasks (overdue and not completed)
   */
  static async getPendingTasks(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = getTasksQuerySchema.parse(req.query);

      const filters: TaskFilters = {
        list_type: 'pending',
      };

      if (query.search) {
        filters.title = query.search;
      }
      if (query.project_id) filters.project_id = query.project_id;
      if (query.task_type) filters.task_type = query.task_type;
      if (query.priority) filters.priority = query.priority;
      if (query.assigned_to) filters.assigned_to = query.assigned_to;

      const sortField = query.sort_field;
      const sortOrder = query.sort_order || 'ASC';

      const result = await TaskService.getAllTasks(
        filters,
        query.page || 1,
        query.limit || 10,
        sortField,
        sortOrder,
        req.user?.id,
        req.user?.roles
      );

      paginated(res, result.tasks, result.meta, 'Pending tasks retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get completed tasks
   */
  static async getCompletedTasks(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = getTasksQuerySchema.parse(req.query);

      const filters: TaskFilters = {
        list_type: 'completed',
      };

      if (query.search) {
        filters.title = query.search;
      }
      if (query.project_id) filters.project_id = query.project_id;
      if (query.task_type) filters.task_type = query.task_type;
      if (query.priority) filters.priority = query.priority;
      if (query.assigned_to) filters.assigned_to = query.assigned_to;

      const sortField = query.sort_field;
      const sortOrder = query.sort_order || 'ASC';

      const result = await TaskService.getAllTasks(
        filters,
        query.page || 1,
        query.limit || 10,
        sortField,
        sortOrder,
        req.user?.id,
        req.user?.roles
      );

      paginated(res, result.tasks, result.meta, 'Completed tasks retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get task by ID
   */
  static async getTask(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          message: 'Task id is required',
        });
        return;
      }

      const task = await TaskService.getTaskById(
        id,
        req.user?.id,
        req.user?.roles
      );

      if (!task) {
        error(res, 'Task not found', 404);
        return;
      }

      success(res, task, 'Task retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  /**
   * Create new task
   */
  static async createTask(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate request body
      const validatedData = createTaskSchema.parse(req.body) as CreateTaskDto;

      // Get current user ID
      const createdBy = req.user!.id;

      const task = await TaskService.createTask(validatedData, createdBy);

      success(res, task, 'Task created successfully', 201);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Update task
   */
  static async updateTask(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({ message: 'Task id is required' });
        return;
      }

      // Validate request body
      const validatedData = updateTaskSchema.parse(req.body) as UpdateTaskDto;

      // Get current user ID
      const updatedBy = req.user!.id;

      const task = await TaskService.updateTask(id, validatedData, updatedBy);

      if (!task) {
        error(res, 'Task not found', 404);
        return;
      }

      success(res, task, 'Task updated successfully');
    } catch (err) {
      next(err);
    }
  }

  /**
   * Delete task
   */
  static async deleteTask(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({ message: 'Task id is required' });
        return;
      }
      const deletedBy = req.user!.id;

      const deleted = await TaskService.deleteTask(id, deletedBy);

      if (!deleted) {
        error(res, 'Task not found', 404);
        return;
      }

      success(res, null, 'Task deleted successfully');
    } catch (err) {
      next(err);
    }
  }
}
