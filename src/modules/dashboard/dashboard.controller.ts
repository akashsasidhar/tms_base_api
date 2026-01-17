import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import { DashboardService } from './dashboard.service';
import { success } from '../../utils/response.util';

/**
 * Dashboard Controller - Handles HTTP requests for dashboard
 */
export class DashboardController {
  /**
   * Get dashboard statistics
   */
  static async getStatistics(_req: AuthRequest, res: Response): Promise<void> {
    try {
      const statistics = await DashboardService.getStatistics();
      success(res, statistics, 'Statistics retrieved successfully');
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve statistics',
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      });
    }
  }
}
