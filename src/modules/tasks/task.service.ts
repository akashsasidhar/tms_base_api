import { Op } from 'sequelize';
import { Task, Project, User, TaskAssignment } from '../../models';
import { getPaginationParams, getPaginationMeta } from '../../helpers/pagination.helper';
import {
  CreateTaskDto,
  UpdateTaskDto,
  TaskResponseDto,
  TaskFilters,
} from './task.types';

/**
 * Transform task model to response DTO
 */
function transformTaskToDto(task: Task): TaskResponseDto {
  const taskWithIncludes = task as Task & {
    project?: Project;
    creator?: User;
    assignments?: Array<TaskAssignment & { user?: User }>;
  };

  return {
    id: task.id,
    project_id: task.project_id,
    title: task.title,
    task_type: task.task_type,
    description: task.description,
    priority: task.priority,
    status: task.status,
    created_by: task.created_by,
    started_date: task.started_date,
    due_date: task.due_date,
    input_file_url: task.input_file_url,
    output_file_url: task.output_file_url,
    is_active: task.is_active,
    created_at: task.created_at,
    updated_at: task.updated_at,
    project: taskWithIncludes.project
      ? {
          id: taskWithIncludes.project.id,
          name: taskWithIncludes.project.name,
        }
      : null,
    creator: taskWithIncludes.creator
      ? {
          id: taskWithIncludes.creator.id,
          username: taskWithIncludes.creator.username,
          first_name: taskWithIncludes.creator.first_name,
          last_name: taskWithIncludes.creator.last_name,
        }
      : null,
    assignees: taskWithIncludes.assignments
      ? taskWithIncludes.assignments
          .filter((a) => a.is_active && !a.deleted_at)
          .map((assignment) => ({
            id: assignment.id,
            user_id: assignment.user_id,
            assigned_by: assignment.assigned_by,
            assigned_at: assignment.assigned_at,
            user: assignment.user
              ? {
                  id: assignment.user.id,
                  username: assignment.user.username,
                  first_name: assignment.user.first_name,
                  last_name: assignment.user.last_name,
                }
              : null,
          }))
      : null,
  };
}

/**
 * Task Service - Handles all task management business logic
 */
export class TaskService {
  /**
   * Get all tasks with filtering, pagination, and sorting
   */
  static async getAllTasks(
    filters: TaskFilters = {},
    page: number = 1,
    limit: number = 10,
    sortField?: string,
    sortOrder: 'ASC' | 'DESC' = 'ASC',
    userId?: string,
    userRoles?: Array<{ id: string; name: string }>
  ): Promise<{
    tasks: TaskResponseDto[];
    meta: ReturnType<typeof getPaginationMeta>;
  }> {
    const { offset, limit: limitNum, page: pageNum } = getPaginationParams(page, limit);

    // Build where clause
    const where: any = {
      deleted_at: null,
    };

    if (filters.project_id) {
      where.project_id = filters.project_id;
    }

    if (filters.title) {
      where.title = {
        [Op.iLike]: `%${filters.title}%`,
      };
    }

    if (filters.task_type) {
      where.task_type = filters.task_type;
    }

    if (filters.priority) {
      where.priority = filters.priority;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.created_by) {
      where.created_by = filters.created_by;
    }

    if (filters.is_active !== undefined) {
      where.is_active = filters.is_active;
    }

    // Handle list_type filter (active, pending, completed)
    if (filters.list_type) {
      const now = new Date();
      now.setHours(0, 0, 0, 0); // Set to start of day for comparison

      if (filters.list_type === 'completed') {
        // Completed: status = DONE
        where.status = 'DONE';
      } else if (filters.list_type === 'pending') {
        // Pending: status != DONE AND due_date < today AND due_date is not null
        where.status = {
          [Op.ne]: 'DONE',
        };
        where.due_date = {
          [Op.lt]: now,
          [Op.ne]: null, // Must have a due date
        };
      } else if (filters.list_type === 'active') {
        // Active: status != DONE AND (due_date is null OR due_date >= today)
        where.status = {
          [Op.ne]: 'DONE',
        };
        where[Op.or] = [
          { due_date: null },
          { due_date: { [Op.gte]: now } },
        ];
      }
    }
    
    // Apply date range filters only if list_type is not specified
    if (!filters.list_type && (filters.due_date_from || filters.due_date_to)) {
      // Only apply date range filters if list_type is not specified
      where.due_date = {};
      if (filters.due_date_from) {
        where.due_date[Op.gte] = filters.due_date_from;
      }
      if (filters.due_date_to) {
        where.due_date[Op.lte] = filters.due_date_to;
      }
    }

    // Build include clause
    const include: any[] = [
      {
        model: Project,
        as: 'project',
        attributes: ['id', 'name'],
        required: false,
      },
      {
        model: User,
        as: 'creator',
        attributes: ['id', 'username', 'first_name', 'last_name'],
        required: false,
      },
      {
        model: TaskAssignment,
        as: 'assignments',
        where: {
          is_active: true,
          deleted_at: null,
        },
        required: false,
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'username', 'first_name', 'last_name'],
            required: false,
          },
        ],
      },
    ];

    // Filter by assigned user if specified OR if user is not admin/PM
    const adminRoles = ['Project Manager', 'Admin', 'Super Admin'];
    const isAdmin = userRoles?.some(role => 
      adminRoles.some(adminRole => role.name.toLowerCase() === adminRole.toLowerCase())
    ) ?? false;

    // If user is not admin/PM, only show tasks assigned to them
    if (!isAdmin && userId) {
      include[2].where = {
        ...include[2].where,
        user_id: userId,
      };
      include[2].required = true; // Make it required when filtering by assignee
    } else if (filters.assigned_to) {
      // If admin/PM and assigned_to filter is specified, use it
      include[2].where = {
        ...include[2].where,
        user_id: filters.assigned_to,
      };
      include[2].required = true; // Make it required when filtering by assignee
    }

    // Build order clause
    const order: any[] = [];
    if (sortField) {
      order.push([sortField, sortOrder]);
    } else {
      order.push(['created_at', 'DESC']); // Default sort
    }

    // Execute query
    const { rows, count } = await Task.findAndCountAll({
      where,
      include,
      limit: limitNum,
      offset,
      order,
      distinct: true, // Important when using includes with one-to-many relationships
    });

    const tasks = rows.map(transformTaskToDto);
    const meta = getPaginationMeta(count, pageNum, limitNum);

    return { tasks, meta };
  }

  /**
   * Get task by ID
   */
  static async getTaskById(
    id: string,
    userId?: string,
    userRoles?: Array<{ id: string; name: string }>
  ): Promise<TaskResponseDto | null> {
    const task = await Task.findOne({
      where: {
        id,
        deleted_at: null,
      },
      include: [
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'name'],
          required: false,
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'first_name', 'last_name'],
          required: false,
        },
        {
          model: TaskAssignment,
          as: 'assignments',
          where: {
            is_active: true,
            deleted_at: null,
          },
          required: false,
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'username', 'first_name', 'last_name'],
              required: false,
            },
          ],
        },
      ],
    });

    if (!task) {
      return null;
    }

    // Check if user has permission to view this task
    const adminRoles = ['Project Manager', 'Admin', 'Super Admin'];
    const isAdmin = userRoles?.some((role: { id: string; name: string }) => 
      adminRoles.some(adminRole => role.name.toLowerCase() === adminRole.toLowerCase())
    ) ?? false;

    // If user is not admin/PM, check if task is assigned to them
    if (!isAdmin && userId) {
      const taskWithIncludes = task as Task & {
        assignments?: Array<TaskAssignment & { user?: User }>;
      };
      
      const isAssigned = taskWithIncludes.assignments?.some(
        (assignment: TaskAssignment) => assignment.user_id === userId && assignment.is_active && !assignment.deleted_at
      );

      if (!isAssigned) {
        return null; // User doesn't have permission to view this task
      }
    }

    return transformTaskToDto(task);
  }

  /**
   * Create new task
   */
  static async createTask(
    data: CreateTaskDto,
    createdBy: string
  ): Promise<TaskResponseDto> {
    const task = await Task.create({
      project_id: data.project_id,
      title: data.title,
      task_type: data.task_type,
      description: data.description || null,
      priority: data.priority || 'MEDIUM',
      status: data.status || 'TODO',
      created_by: createdBy,
      started_date: data.started_date || null,
      due_date: data.due_date || null,
      input_file_url: data.input_file_url || null,
      output_file_url: data.output_file_url || null,
      is_active: true,
    });

    // Create task assignments if assignee_ids provided
    if (data.assignee_ids && data.assignee_ids.length > 0) {
      const assignments = data.assignee_ids.map((userId) => ({
        task_id: task.id,
        user_id: userId,
        assigned_by: createdBy,
        assigned_at: new Date(),
        is_active: true,
      }));

      await TaskAssignment.bulkCreate(assignments);
    }

    // Reload with associations
    await task.reload({
      include: [
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'name'],
          required: false,
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'first_name', 'last_name'],
          required: false,
        },
        {
          model: TaskAssignment,
          as: 'assignments',
          where: {
            is_active: true,
            deleted_at: null,
          },
          required: false,
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'username', 'first_name', 'last_name'],
              required: false,
            },
          ],
        },
      ],
    });

    return transformTaskToDto(task);
  }

  /**
   * Update task
   */
  static async updateTask(
    id: string,
    data: UpdateTaskDto,
    updatedBy?: string
  ): Promise<TaskResponseDto | null> {
    const task = await Task.findOne({
      where: {
        id,
        deleted_at: null,
      },
    });

    if (!task) {
      return null;
    }

    // Update fields
    if (data.project_id !== undefined) {
      task.project_id = data.project_id;
    }
    if (data.title !== undefined) {
      task.title = data.title;
    }
    if (data.task_type !== undefined) {
      task.task_type = data.task_type;
    }
    if (data.description !== undefined) {
      task.description = data.description;
    }
    if (data.priority !== undefined) {
      task.priority = data.priority;
    }
    if (data.status !== undefined) {
      task.status = data.status;
    }
    if (data.started_date !== undefined) {
      task.started_date = data.started_date;
    }
    if (data.due_date !== undefined) {
      task.due_date = data.due_date;
    }
    if (data.input_file_url !== undefined) {
      task.input_file_url = data.input_file_url;
    }
    if (data.output_file_url !== undefined) {
      task.output_file_url = data.output_file_url;
    }
    if (data.is_active !== undefined) {
      task.is_active = data.is_active;
    }
    if (updatedBy) {
      task.updated_by = updatedBy;
    }

    await task.save();

    // Update task assignments if assignee_ids provided
    if (data.assignee_ids !== undefined) {
      // Soft delete existing active assignments
      await TaskAssignment.update(
        { is_active: false, deleted_at: new Date(), deleted_by: updatedBy ?? null, },
        {
          where: {
            task_id: id,
            is_active: true,
            deleted_at: null,
          },
        }
      );

      // Create new assignments
      if (data.assignee_ids.length > 0) {
        const assignments = data.assignee_ids.map((userId) => ({
          task_id: id,
          user_id: userId,
          assigned_by: updatedBy || task.created_by,
          assigned_at: new Date(),
          is_active: true,
        }));

        await TaskAssignment.bulkCreate(assignments);
      }
    }

    // Reload with associations
    await task.reload({
      include: [
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'name'],
          required: false,
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'first_name', 'last_name'],
          required: false,
        },
        {
          model: TaskAssignment,
          as: 'assignments',
          where: {
            is_active: true,
            deleted_at: null,
          },
          required: false,
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'username', 'first_name', 'last_name'],
              required: false,
            },
          ],
        },
      ],
    });

    return transformTaskToDto(task);
  }

  /**
   * Delete task (soft delete)
   */
  static async deleteTask(id: string, deletedBy: string): Promise<boolean> {
    const task = await Task.findOne({
      where: {
        id,
        deleted_at: null,
      },
    });

    if (!task) {
      return false;
    }

    await task.softDelete(deletedBy);
    return true;
  }
}
