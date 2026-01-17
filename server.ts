import express, { Express } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { connectDatabase, closeDatabase } from './src/config/database';
import { smartLogger } from './src/utils/logger.util';
import { requestLogger } from './src/middleware/request-logger.middleware';
import { apiRateLimiter } from './src/middleware/rateLimit.middleware';
import { errorHandler, notFoundHandler } from './src/middleware/error.middleware';
import appRouter from './src/index';
import appConfig from './src/config/app-config';

const PORT = parseInt(appConfig.PORT, 10);
const NODE_ENV = appConfig.NODE_ENV;

/**
 * Initialize Express application
 */
const initializeApp = (): Express => {
  const app = express();

  // Security middleware
  app.use(helmet());

  // CORS configuration
  const corsOptions = {
    origin: appConfig.CORS_ORIGIN,
    credentials: appConfig.CORS_CREDENTIALS === 'true',
    optionsSuccessStatus: 200,
  };
  app.use(cors(corsOptions));

  // Cookie parser middleware
  app.use(cookieParser());

  // Body parsing middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Request logger middleware
  app.use(requestLogger);

  // API rate limiting (skip health check)
  app.use('/api', (req, res, next) => {
    if (req.path === '/health' || req.path === '/v1/health') {
      return next();
    }
    apiRateLimiter(req, res, next);
  });

  // Mount routes
  app.use('/', appRouter);

  // 404 handler
  app.use(notFoundHandler);

  // Global error handler
  app.use(errorHandler);

  return app;
};

/**
 * Start server with database connection retry
 */
const startServer = async (): Promise<void> => {
  try {
    // Connect to database with retry logic
    await connectDatabase(5, 5000);

    // Initialize Express app
    const app = initializeApp();

    // Start HTTP server
    const server = app.listen(PORT, () => {
      smartLogger.info(`🚀 Server running on port ${PORT} in ${NODE_ENV} mode`);
    });

    // Graceful shutdown handler
    const gracefulShutdown = async (signal: string): Promise<void> => {
      smartLogger.info(`${signal} signal received: starting graceful shutdown`);

      // Close HTTP server
      server.close(async () => {
        smartLogger.info('HTTP server closed');

        // Close database connection
        await closeDatabase();

        smartLogger.info('Graceful shutdown completed');
        process.exit(0);
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        smartLogger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    // Handle shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (err: Error) => {
      smartLogger.error('Unhandled Promise Rejection', err);
      gracefulShutdown('unhandledRejection');
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (err: Error) => {
      smartLogger.error('Uncaught Exception', err);
      gracefulShutdown('uncaughtException');
    });
  } catch (err) {
    const error = err instanceof Error ? err : new Error('Unknown error');
    smartLogger.error('Failed to start server', error);
    process.exit(1);
  }
};

// Start the server
startServer().catch((err) => {
  const error = err instanceof Error ? err : new Error('Unknown error');
  smartLogger.error('Fatal error starting server', error);
  process.exit(1);
});
