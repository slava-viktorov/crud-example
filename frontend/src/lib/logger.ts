export const logger = {
  error: (message: string, error?: unknown) => {
    if (process.env.NODE_ENV === 'development') {
      console.error(message, error);
    }
    // Sentry
  },
  
  warn: (message: string, data?: unknown) => {
    if (process.env.NODE_ENV === 'development') {
      console.warn(message, data);
    }
  },
  
  info: (message: string, data?: unknown) => {
    if (process.env.NODE_ENV === 'development') {
      console.info(message, data);
    }
  },
  
  debug: (message: string, data?: unknown) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(message, data);
    }
  }
}; 