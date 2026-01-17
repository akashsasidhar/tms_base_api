import dotenv from 'dotenv';

dotenv.config();

interface AppConfig {
  // Application
  readonly NODE_ENV: string;
  readonly PORT: string;
  readonly API_VERSION: string;
  // Database
  readonly DB_HOST: string;
  readonly DB_PORT: string;
  readonly DB_NAME: string;
  readonly DB_USER: string;
  readonly DB_PASSWORD: string;
  readonly DB_DIALECT: string;
  readonly DB_POOL_MIN: string;
  readonly DB_POOL_MAX: string;
  readonly DB_POOL_IDLE: string;
  readonly DB_POOL_ACQUIRE: string;
  readonly DB_POOL_EVICT: string;
  readonly DB_NAME_TEST: string;
  // JWT
  readonly JWT_SECRET: string;
  readonly JWT_ACCESS_SECRET: string;
  readonly JWT_REFRESH_SECRET: string;
  readonly JWT_ACCESS_TOKEN_EXPIRY: string;
  readonly JWT_REFRESH_TOKEN_EXPIRY: string;
  readonly JWT_ACCESS_VALIDITY: string;
  readonly JWT_REFRESH_VALIDITY: string;
  readonly JWE_SECRET_KEY: string;
  readonly JWE_ALGORITHM: string;
  readonly PRIVATE_KEY: string;
  readonly PUBLIC_KEY: string;
  // Cookies
  readonly ACCESS_COOKIE_MAX_AGE: string;
  readonly REFRESH_COOKIE_MAX_AGE: string;
  // Security
  readonly BCRYPT_SALT_ROUNDS: string;
  readonly BCRYPT_ROUNDS: string;
  readonly ENCRYPTION_KEY: string;
  // CORS
  readonly CORS_ORIGIN: string;
  readonly CORS_CREDENTIALS: string;
  // Rate Limiting
  readonly RATE_LIMIT_WINDOW_MS: string;
  readonly RATE_LIMIT_MAX_REQUESTS: string;
  readonly LOGIN_RATE_LIMIT_MAX: string;
  readonly REGISTER_RATE_LIMIT_MAX: string;
  // Logging
  readonly ENABLE_LOGGING: string;
  readonly LOG_LEVEL: string;
  readonly LOG_FILE_PATH: string;
  // Email
  readonly SYSTEM_EMAIL: string;
  readonly SYSTEM_EMAIL_PASSWORD: string;
  readonly DEFAULT_EMAIL_SUFFIX: string;
  // Frontend
  readonly FRONT_END_PORTAL: string;
  // Admin Default Password
  readonly ADMIN_DEFAULT_PASSWORD: string;
}

// Helper function to safely access process.env with bracket notation
const getEnv = (key: string, defaultValue: string): string => {
  return process.env[key] ?? defaultValue;
};

const appConfig: AppConfig = {
  // Application
  NODE_ENV: getEnv('NODE_ENV', 'development'),
  PORT: getEnv('PORT', '5000'),
  API_VERSION: getEnv('API_VERSION', 'v1'),

  // Database
  DB_HOST: getEnv('DB_HOST', 'localhost'),
  DB_PORT: getEnv('DB_PORT', '5432'),
  DB_NAME: getEnv('DB_NAME', 'task_management_db'),
  DB_USER: getEnv('DB_USER', 'postgres'),
  DB_PASSWORD: getEnv('DB_PASSWORD', ''),
  DB_DIALECT: getEnv('DB_DIALECT', 'postgres'),
  DB_POOL_MIN: getEnv('DB_POOL_MIN', '2'),
  DB_POOL_MAX: getEnv('DB_POOL_MAX', '10'),
  DB_POOL_IDLE: getEnv('DB_POOL_IDLE', '10000'),
  DB_POOL_ACQUIRE: getEnv('DB_POOL_ACQUIRE', '30000'),
  DB_POOL_EVICT: getEnv('DB_POOL_EVICT', '1000'),
  DB_NAME_TEST: getEnv('DB_NAME_TEST', 'task_management_db_test'),

  // JWT
  JWT_SECRET: getEnv('JWT_SECRET', 'your-secret-key-change-in-production'),
  JWT_ACCESS_SECRET: getEnv('JWT_ACCESS_SECRET', getEnv('JWT_SECRET', 'your-secret-key-change-in-production')),
  JWT_REFRESH_SECRET: getEnv('JWT_REFRESH_SECRET', getEnv('JWT_SECRET', 'your-secret-key-change-in-production')),
  JWT_ACCESS_TOKEN_EXPIRY: getEnv('JWT_ACCESS_TOKEN_EXPIRY', '30m'),
  JWT_REFRESH_TOKEN_EXPIRY: getEnv('JWT_REFRESH_TOKEN_EXPIRY', '7d'),
  JWT_ACCESS_VALIDITY: getEnv('JWT_ACCESS_VALIDITY', '30m'),
  JWT_REFRESH_VALIDITY: getEnv('JWT_REFRESH_VALIDITY', '7d'),
  JWE_SECRET_KEY: getEnv('JWE_SECRET_KEY', 'your-jwe-secret-key-32-bytes-minimum-change-in-production'),
  JWE_ALGORITHM: getEnv('JWE_ALGORITHM', 'dir'),
  PRIVATE_KEY: getEnv('PRIVATE_KEY', ''),
  PUBLIC_KEY: getEnv('PUBLIC_KEY', ''),

  // Cookies
  ACCESS_COOKIE_MAX_AGE: getEnv('ACCESS_COOKIE_MAX_AGE', '1800000'), // 30 minutes in ms
  REFRESH_COOKIE_MAX_AGE: getEnv('REFRESH_COOKIE_MAX_AGE', '604800000'), // 7 days in ms

  // Security
  BCRYPT_SALT_ROUNDS: getEnv('BCRYPT_SALT_ROUNDS', '12'),
  BCRYPT_ROUNDS: getEnv('BCRYPT_ROUNDS', getEnv('BCRYPT_SALT_ROUNDS', '12')),
  ENCRYPTION_KEY: getEnv('ENCRYPTION_KEY', ''),

  // CORS
  CORS_ORIGIN: getEnv('CORS_ORIGIN', 'http://localhost:3000'),
  CORS_CREDENTIALS: getEnv('CORS_CREDENTIALS', 'true'),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: getEnv('RATE_LIMIT_WINDOW_MS', '900000'),
  RATE_LIMIT_MAX_REQUESTS: getEnv('RATE_LIMIT_MAX_REQUESTS', '100'),
  LOGIN_RATE_LIMIT_MAX: getEnv('LOGIN_RATE_LIMIT_MAX', '5'),
  REGISTER_RATE_LIMIT_MAX: getEnv('REGISTER_RATE_LIMIT_MAX', '3'),

  // Logging
  ENABLE_LOGGING: getEnv('ENABLE_LOGGING', 'true'),
  LOG_LEVEL: getEnv('LOG_LEVEL', 'info'),
  LOG_FILE_PATH: getEnv('LOG_FILE_PATH', './logs/app.log'),

  // Email
  SYSTEM_EMAIL: getEnv('SYSTEM_EMAIL', ''),
  SYSTEM_EMAIL_PASSWORD: getEnv('SYSTEM_EMAIL_PASSWORD', ''),
  DEFAULT_EMAIL_SUFFIX: getEnv('DEFAULT_EMAIL_SUFFIX', '@example.com'),

  // Frontend
  FRONT_END_PORTAL: getEnv('FRONT_END_PORTAL', 'http://localhost:3000'),

  // Admin Default Password
  ADMIN_DEFAULT_PASSWORD: getEnv('ADMIN_DEFAULT_PASSWORD', 'Admin@123456'),
};

export default appConfig;
