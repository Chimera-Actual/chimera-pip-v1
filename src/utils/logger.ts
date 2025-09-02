// Production-safe logging utility

interface LoggerConfig {
  enabledInProduction: boolean;
  enabledInDevelopment: boolean;
}

const defaultConfig: LoggerConfig = {
  enabledInProduction: false,
  enabledInDevelopment: true,
};

class Logger {
  private config: LoggerConfig;
  private isDevelopment: boolean;

  constructor(config: LoggerConfig = defaultConfig) {
    this.config = config;
    this.isDevelopment = process.env.NODE_ENV === 'development';
  }

  private shouldLog(): boolean {
    return this.isDevelopment ? this.config.enabledInDevelopment : this.config.enabledInProduction;
  }

  log(...args: any[]): void {
    if (this.shouldLog()) {
      console.log(...args);
    }
  }

  error(...args: any[]): void {
    if (this.shouldLog()) {
      console.error(...args);
    }
  }

  warn(...args: any[]): void {
    if (this.shouldLog()) {
      console.warn(...args);
    }
  }

  info(...args: any[]): void {
    if (this.shouldLog()) {
      console.info(...args);
    }
  }

  debug(...args: any[]): void {
    if (this.shouldLog()) {
      console.debug(...args);
    }
  }

  // Error reporting for production - could integrate with error tracking service
  reportError(error: Error, context?: Record<string, any>): void {
    if (this.isDevelopment) {
      console.error('Error Report:', error, 'Context:', context);
    } else {
      // In production, send to error tracking service
      // Example: Sentry, LogRocket, etc.
      // this.errorTrackingService.captureException(error, { extra: context });
    }
  }

  // Performance tracking
  time(label: string): void {
    if (this.shouldLog()) {
      console.time(label);
    }
  }

  timeEnd(label: string): void {
    if (this.shouldLog()) {
      console.timeEnd(label);
    }
  }

  // Group logging for better organization
  group(label: string): void {
    if (this.shouldLog()) {
      console.group(label);
    }
  }

  groupEnd(): void {
    if (this.shouldLog()) {
      console.groupEnd();
    }
  }
}

// Export a singleton instance
export const logger = new Logger();

// Export the class for custom configurations
export { Logger };

// Convenience exports for common use cases
export const devLogger = new Logger({
  enabledInProduction: false,
  enabledInDevelopment: true,
});

export const productionLogger = new Logger({
  enabledInProduction: true,
  enabledInDevelopment: true,
});