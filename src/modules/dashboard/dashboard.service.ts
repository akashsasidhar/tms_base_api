import { Op } from 'sequelize';
import { Project, Task, TaskAssignment } from '../../models';

export interface DashboardStatistics {
  // Admin/PM stats
  total_projects?: number;
  active_projects?: number;
  total_tasks?: number;
  active_tasks?: number;
  pending_tasks?: number;
  completed_tasks?: number;
  
  // User-specific stats
  my_active_tasks?: number;
  my_pending_tasks?: number;
  my_completed_tasks?: number;
}

/**
 * Dashboard Service - Handles dashboard statistics
 */
export class DashboardService {
  /**
   * Get dashboard statistics based on user role
   */
  static async getStatistics(
    userId?: string,
    userRoles?: Array<{ id: string; name: string }>
  ): Promise<DashboardStatistics> {
    const adminRoles = ['Project Manager', 'Admin', 'Super Admin'];
    const isAdmin = userRoles?.some((role) =>
      adminRoles.some((adminRole) => role.name.toLowerCase() === adminRole.toLowerCase())
    ) ?? false;

    if (isAdmin) {
      // Admin/PM dashboard: Show project and task overview
      const now = new Date();
      now.setHours(0, 0, 0, 0);

      const [
        totalProjects,
        activeProjects,
        totalTasks,
        activeTasks,
        pendingTasks,
        completedTasks,
      ] = await Promise.all([
        // Total projects
        Project.count({
          where: { deleted_at: null },
        }),

        // Active projects
        Project.count({
          where: {
            is_active: true,
            deleted_at: null,
          },
        }),

        // Total tasks
        Task.count({
          where: { deleted_at: null },
        }),

        // Active tasks (status != DONE AND (due_date is null OR due_date >= today))
        Task.count({
          where: {
            status: { [Op.ne]: 'DONE' },
            deleted_at: null,
            [Op.or]: [{ due_date: null }, { due_date: { [Op.gte]: now } }],
          },
        }),

        // Pending tasks (status != DONE AND due_date < today)
        Task.count({
          where: {
            status: { [Op.ne]: 'DONE' },
            due_date: { [Op.lt]: now, [Op.ne]: null },
            deleted_at: null,
          },
        }),

        // Completed tasks
        Task.count({
          where: {
            status: 'DONE',
            deleted_at: null,
          },
        }),
      ]);

      return {
        total_projects: totalProjects,
        active_projects: activeProjects,
        total_tasks: totalTasks,
        active_tasks: activeTasks,
        pending_tasks: pendingTasks,
        completed_tasks: completedTasks,
      };
    } else {
      // User dashboard: Show only assigned tasks
      if (!userId) {
        return {
          my_active_tasks: 0,
          my_pending_tasks: 0,
          my_completed_tasks: 0,
        };
      }

      const now = new Date();
      now.setHours(0, 0, 0, 0);

      // Get all task IDs assigned to this user
      const assignedTaskIds = await TaskAssignment.findAll({
        where: {
          user_id: userId,
          is_active: true,
          deleted_at: null,
        },
        attributes: ['task_id'],
      });

      const taskIds = assignedTaskIds.map((ta) => ta.task_id);

      if (taskIds.length === 0) {
        return {
          my_active_tasks: 0,
          my_pending_tasks: 0,
          my_completed_tasks: 0,
        };
      }

      const [myActiveTasks, myPendingTasks, myCompletedTasks] = await Promise.all([
        // My active tasks
        Task.count({
          where: {
            id: { [Op.in]: taskIds },
            status: { [Op.ne]: 'DONE' },
            deleted_at: null,
            [Op.or]: [{ due_date: null }, { due_date: { [Op.gte]: now } }],
          },
        }),

        // My pending tasks
        Task.count({
          where: {
            id: { [Op.in]: taskIds },
            status: { [Op.ne]: 'DONE' },
            due_date: { [Op.lt]: now, [Op.ne]: null },
            deleted_at: null,
          },
        }),

        // My completed tasks
        Task.count({
          where: {
            id: { [Op.in]: taskIds },
            status: 'DONE',
            deleted_at: null,
          },
        }),
      ]);

      return {
        my_active_tasks: myActiveTasks,
        my_pending_tasks: myPendingTasks,
        my_completed_tasks: myCompletedTasks,
      };
    }
  }
}
