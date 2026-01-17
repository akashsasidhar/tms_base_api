import { Sequelize, Options } from 'sequelize';
import { smartLogger } from '../utils/logger.util';
import appConfig from './app-config';

const dbConfig: Options = {
  host: appConfig.DB_HOST,
  port: parseInt(appConfig.DB_PORT, 10),
  database: appConfig.DB_NAME,
  username: appConfig.DB_USER,
  password: appConfig.DB_PASSWORD,
  dialect: 'postgres',
  dialectOptions: {
    ssl: appConfig.NODE_ENV === 'production'
      ? {
          require: true,
          rejectUnauthorized: false,
        }
      : false,
  },
  pool: {
    min: parseInt(appConfig.DB_POOL_MIN, 10),
    max: parseInt(appConfig.DB_POOL_MAX, 10),
    idle: parseInt(appConfig.DB_POOL_IDLE, 10),
    acquire: parseInt(appConfig.DB_POOL_ACQUIRE, 10),
    evict: parseInt(appConfig.DB_POOL_EVICT, 10),
  },
  logging: false, // Use our logger instead
  define: {
    underscored: true,
    freezeTableName: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    paranoid: true,
    deletedAt: 'deleted_at',
  },
};

// Create Sequelize instance
const sequelize = new Sequelize(dbConfig);

/**
 * Connect to database with retry logic
 */
export const connectDatabase = async (maxRetries = 5, delay = 5000): Promise<void> => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await sequelize.authenticate();
      smartLogger.info(`Database connected successfully (attempt ${attempt})`);
      return;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown database error');
      smartLogger.error(`Database connection attempt ${attempt} failed`, error);

      if (attempt === maxRetries) {
        throw new Error(`Failed to connect to database after ${maxRetries} attempts`);
      }

      smartLogger.info(`Retrying database connection in ${delay}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
};

/**
 * Close database connection
 */
export const closeDatabase = async (): Promise<void> => {
  try {
    await sequelize.close();
    smartLogger.info('Database connection closed');
  } catch (err) {
    const error = err instanceof Error ? err : new Error('Unknown error');
    smartLogger.error('Error closing database connection', error);
  }
};

export default sequelize;
export { dbConfig };
