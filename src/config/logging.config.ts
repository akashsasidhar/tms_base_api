import appConfig from './app-config';

export type LogLevel = 'error' | 'warn' | 'info' | 'debug' | 'audit';
export type LogFormat = 'json' | 'simple';

export interface LoggingConfig {
  enabled: boolean;
  level: LogLevel;
  console: boolean;
  file: boolean;
  filePath: string;
  maxSize: string;
  maxFiles: number;
  format: LogFormat;
  async: boolean;
  errorOnly: boolean;
}

/**
 * Get logging configuration based on environment
 */
export const getLoggingConfig = (): LoggingConfig => {
  const enabled = appConfig.ENABLE_LOGGING !== 'false';
  const logLevel = (appConfig.LOG_LEVEL || 'info') as LogLevel;
  const logFilePath = appConfig.LOG_FILE_PATH;

  // Production: errors only, JSON format, file-based
  if (appConfig.NODE_ENV === 'production') {
    return {
      enabled,
      level: 'error',
      console: false,
      file: true,
      filePath: logFilePath,
      maxSize: '10m',
      maxFiles: 5,
      format: 'json',
      async: true,
      errorOnly: true,
    };
  }

  // Staging: info and above
  if (appConfig.NODE_ENV === 'staging') {
    return {
      enabled,
      level: logLevel === 'error' || logLevel === 'warn' ? 'info' : logLevel,
      console: true,
      file: true,
      filePath: logFilePath,
      maxSize: '10m',
      maxFiles: 5,
      format: 'json',
      async: true,
      errorOnly: false,
    };
  }

  // Development: all logs, console + file
  return {
    enabled,
    level: logLevel,
    console: true,
    file: true,
    filePath: logFilePath,
    maxSize: '10m',
    maxFiles: 5,
    format: 'simple',
    async: false,
    errorOnly: false,
  };
};

export const loggingConfig = getLoggingConfig();

/**
 * Check if a log level should be logged
 */
export const shouldLog = (level: LogLevel): boolean => {
  if (!loggingConfig.enabled) {
    return false;
  }

  const levels: LogLevel[] = ['error', 'warn', 'info', 'debug', 'audit'];
  const currentLevelIndex = levels.indexOf(loggingConfig.level);
  const messageLevelIndex = levels.indexOf(level);

  // Audit logs are always enabled if logging is enabled
  if (level === 'audit') {
    return true;
  }

  // Error logs are always enabled if logging is enabled
  if (level === 'error') {
    return true;
  }

  return messageLevelIndex <= currentLevelIndex;
};
