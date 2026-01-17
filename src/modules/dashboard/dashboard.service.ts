import { User, Role, UserContact } from '../../models';

export interface DashboardStatistics {
  total_users: number;
  total_roles: number;
  active_users: number;
  total_contacts: number;
}

/**
 * Dashboard Service - Handles dashboard statistics
 */
export class DashboardService {
  /**
   * Get dashboard statistics
   */
  static async getStatistics(): Promise<DashboardStatistics> {
    // Get all statistics in parallel for better performance
    const [totalUsers, totalRoles, activeUsers, totalContacts] = await Promise.all([
      // Total users (excluding soft-deleted)
      User.count(),
      
      // Total roles (excluding soft-deleted)
      Role.count(),
      
      // Active users (is_active = true, excluding soft-deleted)
      User.count({
        where: {
          is_active: true,
        },
      }),
      
      // Total contacts (excluding soft-deleted)
      UserContact.count(),
    ]);

    return {
      total_users: totalUsers,
      total_roles: totalRoles,
      active_users: activeUsers,
      total_contacts: totalContacts,
    };
  }
}
