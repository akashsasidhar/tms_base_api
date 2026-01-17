import pino from 'pino';
import { loggingConfig, shouldLog } from '../config/logging.config';
import fs from 'fs';
import path from 'path';

// Ensure logs directory exists
const logsDir = path.dirname(loggingConfig.filePath);
if (loggingConfig.file && !fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Create pino logger instance
const createLogger = () => {
  const streams: Array<{ level: string; stream: NodeJS.WritableStream }> = [];

  if (loggingConfig.console) {
    streams.push({
      level: loggingConfig.level,
      stream: process.stdout,
    });
  }

  if (loggingConfig.file) {
    const fileStream = fs.createWriteStream(loggingConfig.filePath, { flags: 'a' });
    streams.push({
      level: loggingConfig.level,
      stream: fileStream,
    });
  }

  // If no streams, return a minimal logger
  if (streams.length === 0) {
    return pino({
      level: loggingConfig.level,
      enabled: false,
    });
  }

  // Use multistream if multiple streams, otherwise single stream
  if (streams.length === 1) {
    return pino(
      {
        level: loggingConfig.level,
        formatters: {
          level: (label) => {
            return { level: label };
          },
        },
        timestamp: pino.stdTimeFunctions.isoTime,
      },
      streams[0]?.stream
    );
  }

  return pino(
    {
      level: loggingConfig.level,
      formatters: {
        level: (label) => {
          return { level: label };
        },
      },
      timestamp: pino.stdTimeFunctions.isoTime,
    },
    pino.multistream(streams)
  );
};

const logger = loggingConfig.enabled ? createLogger() : null;

type LogMessage = string | (() => string);
type LogData = Record<string, unknown> | Error;

/**
 * Smart logger with lazy evaluation and performance optimizations
 */
class SmartLogger {
  /**
   * Log error (always logged in production)
   */
  error = (message: LogMessage, data?: LogData): void => {
    if (!shouldLog('error') || !logger) return;

    const msg = typeof message === 'function' ? message() : message;
    if (data instanceof Error) {
      logger.error({ err: data }, msg);
    } else {
      logger.error(data || {}, msg);
    }
  };

  /**
   * Log warning (logged in production)
   */
  warn = (message: LogMessage, data?: LogData): void => {
    if (!shouldLog('warn') || !logger) return;

    const msg = typeof message === 'function' ? message() : message;
    logger.warn(data || {}, msg);
  };

  /**
   * Log info (dev/staging only)
   */
  info = (message: LogMessage, data?: LogData): void => {
    if (!shouldLog('info') || !logger) return;

    const msg = typeof message === 'function' ? message() : message;
    logger.info(data || {}, msg);
  };

  /**
   * Log debug (development only)
   */
  debug = (message: LogMessage, data?: LogData): void => {
    if (!shouldLog('debug') || !logger) return;

    const msg = typeof message === 'function' ? message() : message;
    logger.debug(data || {}, msg);
  };

  /**
   * Log audit (always logged if logging enabled)
   */
  audit = (message: LogMessage, data?: LogData): void => {
    if (!shouldLog('audit') || !logger) return;

    const msg = typeof message === 'function' ? message() : message;
    logger.info({ type: 'audit', ...(data || {}) }, msg);
  };
}

export const smartLogger = new SmartLogger();
