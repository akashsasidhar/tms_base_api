import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { smartLogger } from '../utils/logger.util';
import { AuditLogger } from '../utils/audit-logger.util';
import appConfig from '../config/app-config';

/**
 * Rate limit handler with logging
 */
const rateLimitHandler = (req: Request, res: Response): void => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  smartLogger.warn('Rate limit exceeded', {
    ip,
    url: req.url,
    method: req.method,
  });

  AuditLogger.securityEvent('rate_limit_exceeded', {
    ip,
    url: req.url,
    method: req.method,
  });

  res.status(429).json({
    success: false,
    message: 'Too many requests, please try again later.',
    errors: ['Rate limit exceeded'],
  });
};

/**
 * Login rate limiter: 5 attempts per 15 minutes
 */
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: parseInt(appConfig.LOGIN_RATE_LIMIT_MAX, 10),
  message: 'Too many login attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  handler: rateLimitHandler,
});

/**
 * Register rate limiter: 3 attempts per hour
 */
export const registerRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: parseInt(appConfig.REGISTER_RATE_LIMIT_MAX, 10),
  message: 'Too many registration attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

/**
 * API rate limiter: 100 requests per 15 minutes
 */
export const apiRateLimiter = rateLimit({
  windowMs: parseInt(appConfig.RATE_LIMIT_WINDOW_MS, 10),
  max: parseInt(appConfig.RATE_LIMIT_MAX_REQUESTS, 10),
  message: 'Too many requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req: Request) => {
    // Skip rate limit for health check
    return req.path === '/health' || req.path === '/api/health';
  },
  handler: rateLimitHandler,
});
