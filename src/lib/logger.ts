/**
 * Production-safe logging utility
 * Only logs in development mode, silent in production
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  data?: any;
  timestamp: string;
  component?: string;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private logs: LogEntry[] = [];
  private maxLogs = 1000;

  private createEntry(level: LogLevel, message: string, data?: any, component?: string): LogEntry {
    return {
      level,
      message,
      data,
      component,
      timestamp: new Date().toISOString(),
    };
  }

  private addLog(entry: LogEntry) {
    if (this.isDevelopment) {
      this.logs.push(entry);
      if (this.logs.length > this.maxLogs) {
        this.logs.shift();
      }
    }
  }

  debug(message: string, data?: any, component?: string) {
    const entry = this.createEntry('debug', message, data, component);
    this.addLog(entry);
    
    if (this.isDevelopment) {
      console.debug(`[${component || 'App'}] ${message}`, data || '');
    }
  }

  info(message: string, data?: any, component?: string) {
    const entry = this.createEntry('info', message, data, component);
    this.addLog(entry);
    
    if (this.isDevelopment) {
      console.info(`[${component || 'App'}] ${message}`, data || '');
    }
  }

  warn(message: string, data?: any, component?: string) {
    const entry = this.createEntry('warn', message, data, component);
    this.addLog(entry);
    
    if (this.isDevelopment) {
      console.warn(`[${component || 'App'}] ${message}`, data || '');
    }
  }

  error(message: string, data?: any, component?: string) {
    const entry = this.createEntry('error', message, data, component);
    this.addLog(entry);
    
    if (this.isDevelopment) {
      console.error(`[${component || 'App'}] ${message}`, data || '');
    }
  }

  /**
   * Get recent logs for debugging
   */
  getRecentLogs(count = 50): LogEntry[] {
    return this.logs.slice(-count);
  }

  /**
   * Clear all stored logs
   */
  clearLogs() {
    this.logs = [];
  }

  /**
   * Get logs by level
   */
  getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logs.filter(log => log.level === level);
  }
}

// Export singleton instance
export const logger = new Logger();

// Convenience methods for common patterns
export const logWidget = {
  load: (widgetId: string, data?: any) => 
    logger.info(`Widget loaded: ${widgetId}`, data, 'WidgetSystem'),
  error: (widgetId: string, error: Error) => 
    logger.error(`Widget error: ${widgetId}`, error, 'WidgetSystem'),
  settings: (widgetId: string, settings: any) => 
    logger.debug(`Widget settings updated: ${widgetId}`, settings, 'WidgetSystem'),
};

export const logAuth = {
  signIn: (userId?: string) => 
    logger.info('User signed in', { userId }, 'Auth'),
  signOut: () => 
    logger.info('User signed out', undefined, 'Auth'),
  error: (error: Error) => 
    logger.error('Auth error', error, 'Auth'),
};

export const logDatabase = {
  query: (query: string, duration?: number) => 
    logger.debug('Database query', { query, duration }, 'Database'),
  error: (query: string, error: Error) => 
    logger.error('Database error', { query, error }, 'Database'),
};