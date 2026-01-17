import { Router } from 'express';
import { DashboardController } from './dashboard.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

/**
 * @route   GET /api/dashboard/statistics
 * @desc    Get dashboard statistics
 * @access  Private
 */
router.get('/statistics', authenticate, DashboardController.getStatistics);

export default router;
