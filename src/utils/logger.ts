import { config } from '../config/vars';

const isDevelopment = config.env === 'development';

export const logger = {
  info: (...args: any[]): void => {
    if (isDevelopment) {
      console.log(...args);
    }
  },

  error: (...args: any[]): void => {
    // Always log errors, even in production
    console.error(...args);
  },

  debug: (...args: any[]): void => {
    if (isDevelopment) {
      console.log('[DEBUG]', ...args);
    }
  },

  warn: (...args: any[]): void => {
    if (isDevelopment) {
      console.warn(...args);
    }
  },
};
