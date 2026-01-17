/// <reference types="node" />
import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const getEnv = (key: string, defaultValue: string): string => process.env[key] || defaultValue;

const dbConfig = {
  host: getEnv('DB_HOST', 'localhost'),
  port: parseInt(getEnv('DB_PORT', '5432'), 10),
  username: getEnv('DB_USER', 'postgres'),
  password: getEnv('DB_PASSWORD', ''),
  dialect: 'postgres' as const,
  logging: false,
};

const dbName = getEnv('DB_NAME', 'task_management');

async function createDatabase() {
  // Connect to postgres database to create the target database
  const sequelize = new Sequelize({
    ...dbConfig,
    database: 'postgres', // Connect to default postgres database
  });

  try {
    await sequelize.authenticate();
    console.log('Connected to PostgreSQL server');

    // Check if database exists
    const [results] = await sequelize.query(
      `SELECT 1 FROM pg_database WHERE datname = '${dbName}'`
    );

    if (Array.isArray(results) && results.length === 0) {
      // Database doesn't exist, create it
      await sequelize.query(`CREATE DATABASE "${dbName}"`);
      console.log(`✓ Database "${dbName}" created successfully`);
    } else {
      console.log(`✓ Database "${dbName}" already exists`);
    }

    await sequelize.close();
  } catch (error) {
    console.error('Error creating database:', error);
    process.exit(1);
  }
}

createDatabase();
