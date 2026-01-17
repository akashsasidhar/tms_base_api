// Sequelize CLI configuration (JavaScript for CLI compatibility)
require('dotenv').config();

// Access environment variables directly for Sequelize CLI
const getEnv = (key, defaultValue) => process.env[key] || defaultValue;

module.exports = {
  development: {
    username: getEnv('DB_USER', 'postgres'),
    password: getEnv('DB_PASSWORD', ''),
    database: getEnv('DB_NAME', 'task_management'),
    host: getEnv('DB_HOST', 'localhost'),
    port: parseInt(getEnv('DB_PORT', '5432'), 10),
    dialect: 'postgres',
    logging: getEnv('ENABLE_LOGGING', 'true') === 'true' ? console.log : false,
    pool: {
      min: parseInt(getEnv('DB_POOL_MIN', '2'), 10),
      max: parseInt(getEnv('DB_POOL_MAX', '10'), 10),
      idle: 10000,
    },
  },
  test: {
    username: getEnv('DB_USER', 'postgres'),
    password: getEnv('DB_PASSWORD', ''),
    database: getEnv('DB_NAME_TEST', getEnv('DB_NAME', 'task_management_test')),
    host: getEnv('DB_HOST', 'localhost'),
    port: parseInt(getEnv('DB_PORT', '5432'), 10),
    dialect: 'postgres',
    logging: false,
  },
  production: {
    username: getEnv('DB_USER', 'postgres'),
    password: getEnv('DB_PASSWORD', ''),
    database: getEnv('DB_NAME', 'task_management'),
    host: getEnv('DB_HOST', 'localhost'),
    port: parseInt(getEnv('DB_PORT', '5432'), 10),
    dialect: 'postgres',
    logging: false,
    pool: {
      min: parseInt(getEnv('DB_POOL_MIN', '2'), 10),
      max: parseInt(getEnv('DB_POOL_MAX', '10'), 10),
      idle: 10000,
    },
  },
};
