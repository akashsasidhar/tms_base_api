import { Router } from 'express';
import { success } from './utils/response.util';
import appConfig from './config/app-config';

const router = Router();

// Health check endpoint
router.get('/health', (_req, res) => {
  success(res, {
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: appConfig.NODE_ENV,
    uptime: process.uptime(),
  }, 'Server is healthy');
});

// API routes
const API_VERSION = appConfig.API_VERSION;

// Auth routes
import authRoutes from './modules/auth/auth.routes';
router.use('/api/auth', authRoutes);

// User routes
import userRoutes from './modules/users/user.routes';
router.use('/api/users', userRoutes);

// Contact type routes
import contactTypeRoutes from './modules/contactTypes/contactType.routes';
router.use('/api/contact-types', contactTypeRoutes);

// Role routes
import roleRoutes from './modules/roles/role.routes';
router.use('/api/roles', roleRoutes);

// Permission routes
import permissionRoutes from './modules/permissions/permission.routes';
router.use('/api/permissions', permissionRoutes);

// Dashboard routes
import dashboardRoutes from './modules/dashboard/dashboard.routes';
router.use('/api/dashboard', dashboardRoutes);

// Project routes
import projectRoutes from './modules/projects/project.routes';
router.use('/api/projects', projectRoutes);

// Task routes
import taskRoutes from './modules/tasks/task.routes';
router.use('/api/tasks', taskRoutes);

// API info endpoint
router.get('/api', (_req, res) => {
  success(res, {
    message: 'Task Management System API',
    version: API_VERSION,
    status: 'operational',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      roles: '/api/roles',
      permissions: '/api/permissions',
      contactTypes: '/api/contact-types',
      dashboard: '/api/dashboard',
      projects: '/api/projects',
      tasks: '/api/tasks',
    },
  }, 'API information');
});

export default router;
