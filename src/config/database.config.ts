import dotenv from 'dotenv';
import appConfig from './app-config';

dotenv.config();

interface SequelizeConfig {
  username: string;
  password: string;
  database: string;
  host: string;
  port: number;
  dialect: 'postgres';
  logging: boolean | ((sql: string) => void);
  pool?: {
    min: number;
    max: number;
    idle: number;
    acquire: number;
    evict: number;
  };
  dialectOptions?: {
    ssl: {
      require: boolean;
      rejectUnauthorized: boolean;
    };
  };
}

const baseConfig: Omit<SequelizeConfig, 'logging' | 'dialectOptions'> = {
  username: appConfig.DB_USER,
  password: appConfig.DB_PASSWORD,
  database: appConfig.DB_NAME,
  host: appConfig.DB_HOST,
  port: parseInt(appConfig.DB_PORT, 10),
  dialect: 'postgres',
  pool: {
    min: parseInt(appConfig.DB_POOL_MIN, 10),
    max: parseInt(appConfig.DB_POOL_MAX, 10),
    idle: parseInt(appConfig.DB_POOL_IDLE, 10),
    acquire: parseInt(appConfig.DB_POOL_ACQUIRE, 10),
    evict: parseInt(appConfig.DB_POOL_EVICT, 10),
  },
};

const config: {
  development: SequelizeConfig;
  test: SequelizeConfig;
  production: SequelizeConfig;
} = {
  development: {
    ...baseConfig,
    logging: console.log,
  },
  test: {
    ...baseConfig,
    database: appConfig['DB_NAME_TEST'] || 'task_management_db_test',
    logging: false,
  },
  production: {
    ...baseConfig,
    username: appConfig.DB_USER,
    password: appConfig.DB_PASSWORD,
    database: appConfig.DB_NAME,
    host: appConfig.DB_HOST,
    logging: false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
  },
};

// Export as CommonJS for Sequelize CLI compatibility
// Sequelize CLI requires CommonJS format
module.exports = config;
export default config;
