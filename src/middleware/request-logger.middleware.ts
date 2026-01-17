import { Request, Response, NextFunction } from 'express';
import { smartLogger } from '../utils/logger.util';
import { loggingConfig } from '../config/logging.config';

interface RequestWithStartTime extends Request {
  startTime?: number;
}

/**
 * Request logger middleware
 * Production: only log errors or slow requests (>1000ms)
 * Development: log all requests
 */
export const requestLogger = (
  req: RequestWithStartTime,
  res: Response,
  next: NextFunction
): void => {
  req.startTime = Date.now();

  // Log response when finished
  res.on('finish', () => {
    const duration = req.startTime ? Date.now() - req.startTime : 0;
    const { method, url, ip } = req;
    const { statusCode } = res;
    const userId = (req as Request & { user?: { id: string } }).user?.id;

    const logData = {
      method,
      url,
      statusCode,
      duration: `${duration}ms`,
      ip,
      userId,
    };

    // Production: only log errors or slow requests
    if (loggingConfig.errorOnly) {
      if (statusCode >= 400 || duration > 1000) {
        if (statusCode >= 500) {
          smartLogger.error('Request error', logData);
        } else if (statusCode >= 400) {
          smartLogger.warn('Request warning', logData);
        } else if (duration > 1000) {
          smartLogger.warn('Slow request', logData);
        }
      }
    } else {
      // Development/Staging: log all requests
      if (statusCode >= 500) {
        smartLogger.error('Request error', logData);
      } else if (statusCode >= 400) {
        smartLogger.warn('Request warning', logData);
      } else {
        smartLogger.info('Request completed', logData);
      }
    }
  });

  next();
};
