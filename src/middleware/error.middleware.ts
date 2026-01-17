import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { ValidationError, UniqueConstraintError, ForeignKeyConstraintError } from 'sequelize';
import { smartLogger } from '../utils/logger.util';
import { error } from '../utils/response.util';
import appConfig from '../config/app-config';

/**
 * Global error handler middleware
 */
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Always log errors
  smartLogger.error('Error occurred', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userId: (req as Request & { user?: { id: string } }).user?.id,
  });

  // Zod validation errors
  if (err instanceof ZodError) {
    const errors = err.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
    error(res, 'Validation failed', 400, errors);
    return;
  }

  // Sequelize validation errors
  if (err instanceof ValidationError) {
    const errors = err.errors.map((e) => `${e.path}: ${e.message}`);
    error(res, 'Database validation failed', 400, errors);
    return;
  }

  // Sequelize unique constraint errors
  if (err instanceof UniqueConstraintError) {
    const field = err.errors[0]?.path || 'field';
    error(res, `${field} already exists`, 409, [`Duplicate value for ${field}`]);
    return;
  }

  // Sequelize foreign key constraint errors
  if (err instanceof ForeignKeyConstraintError) {
    error(res, 'Referenced record does not exist', 400, ['Foreign key constraint violation']);
    return;
  }

  // JWT errors
  if (err.name === 'TokenExpiredError' || err.name === 'JsonWebTokenError') {
    error(res, 'Invalid or expired token', 401, ['Authentication required']);
    return;
  }

  // Custom errors with status code
  if ('statusCode' in err && typeof err.statusCode === 'number') {
    error(res, err.message, err.statusCode as number);
    return;
  }

  // Default error response
  const isDevelopment = appConfig.NODE_ENV === 'development';
  error(
    res,
    isDevelopment ? err.message : 'Internal server error',
    500,
    isDevelopment && err.stack ? [err.stack] : undefined
  );
};

/**
 * 404 Not Found handler
 */
export const notFoundHandler = (req: Request, res: Response): void => {
  smartLogger.warn('Route not found', {
    url: req.url,
    method: req.method,
    ip: req.ip,
  });

  error(res, 'Route not found', 404);
};
