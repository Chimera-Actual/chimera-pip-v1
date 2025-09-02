/**
 * Advanced Input Validation System
 * Provides comprehensive validation for all user inputs
 */

import { z } from 'zod';
import { logger } from '@/lib/logger';

// Common validation schemas
export const commonSchemas = {
  email: z.string().email('Invalid email format').max(254),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be at most 30 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens'),
  widgetName: z.string()
    .min(1, 'Widget name is required')
    .max(100, 'Widget name must be at most 100 characters')
    .regex(/^[a-zA-Z0-9\s\-_]+$/, 'Widget name can only contain letters, numbers, spaces, hyphens, and underscores'),
  url: z.string().url('Invalid URL format'),
  safePath: z.string()
    .regex(/^[a-zA-Z0-9\/\-_\.]+$/, 'Path contains invalid characters')
    .refine(path => !path.includes('..'), 'Path cannot contain parent directory references'),
};

// SQL Injection prevention patterns
const sqlInjectionPatterns = [
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|OR|AND)\b)|[;'"\\]/gi,
  /(\bscript\b)|(<script|<\/script>)/gi,
  /(\bon\w+\s*=)|javascript:/gi,
];

export class InputValidator {
  /**
   * Validate input against SQL injection patterns
   */
  validateSQLInjection(input: string): { isValid: boolean; error?: string } {
    for (const pattern of sqlInjectionPatterns) {
      if (pattern.test(input)) {
        logger.warn('SQL injection attempt detected', { input: input.substring(0, 50) }, 'Security');
        return { isValid: false, error: 'Input contains potentially dangerous SQL patterns' };
      }
    }
    return { isValid: true };
  }

  /**
   * Validate widget configuration
   */
  validateWidgetConfig(config: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Basic structure validation
    if (!config || typeof config !== 'object') {
      errors.push('Configuration must be a valid object');
      return { isValid: false, errors };
    }

    // Validate widget type
    if (!config.type || typeof config.type !== 'string') {
      errors.push('Widget type is required and must be a string');
    }

    // Validate widget settings
    if (config.settings && typeof config.settings !== 'object') {
      errors.push('Widget settings must be an object');
    }

    // Validate dimensions
    if (config.width && (typeof config.width !== 'number' || config.width < 1 || config.width > 20)) {
      errors.push('Widget width must be a number between 1 and 20');
    }

    if (config.height && (typeof config.height !== 'number' || config.height < 1 || config.height > 20)) {
      errors.push('Widget height must be a number between 1 and 20');
    }

    // Validate position
    if (config.x && (typeof config.x !== 'number' || config.x < 0)) {
      errors.push('Widget x position must be a non-negative number');
    }

    if (config.y && (typeof config.y !== 'number' || config.y < 0)) {
      errors.push('Widget y position must be a non-negative number');
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Validate form data with custom schema
   */
  validateFormData<T>(data: unknown, schema: z.ZodSchema<T>): { 
    isValid: boolean; 
    data?: T; 
    errors?: string[] 
  } {
    try {
      const validatedData = schema.parse(data);
      return { isValid: true, data: validatedData };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
        logger.warn('Form validation failed', { errors }, 'Security');
        return { isValid: false, errors };
      }
      
      logger.error('Unexpected validation error', error as Error, 'Security');
      return { isValid: false, errors: ['Validation failed'] };
    }
  }

  /**
   * Sanitize and validate JSON input
   */
  validateJSON(input: string): { isValid: boolean; data?: any; error?: string } {
    try {
      // Check for potential JSON injection
      if (sqlInjectionPatterns.some(pattern => pattern.test(input))) {
        return { isValid: false, error: 'JSON contains potentially dangerous patterns' };
      }

      const data = JSON.parse(input);
      
      // Limit JSON depth to prevent DoS attacks
      if (this.getObjectDepth(data) > 10) {
        return { isValid: false, error: 'JSON structure too deeply nested' };
      }

      return { isValid: true, data };
    } catch (error) {
      return { isValid: false, error: 'Invalid JSON format' };
    }
  }

  /**
   * Get object nesting depth
   */
  private getObjectDepth(obj: any, depth = 0): number {
    if (depth > 10) return depth; // Prevent infinite recursion
    
    if (typeof obj !== 'object' || obj === null) {
      return depth;
    }

    if (Array.isArray(obj)) {
      return Math.max(depth, ...obj.map(item => this.getObjectDepth(item, depth + 1)));
    }

    return Math.max(depth, ...Object.values(obj).map(value => this.getObjectDepth(value, depth + 1)));
  }

  /**
   * Validate file path for security
   */
  validateFilePath(path: string): { isValid: boolean; error?: string } {
    // Prevent directory traversal
    if (path.includes('..') || path.includes('//')) {
      return { isValid: false, error: 'Path contains invalid directory references' };
    }

    // Check for null bytes
    if (path.includes('\0')) {
      return { isValid: false, error: 'Path contains null bytes' };
    }

    // Validate against allowed patterns
    if (!/^[a-zA-Z0-9\/\-_\.]+$/.test(path)) {
      return { isValid: false, error: 'Path contains invalid characters' };
    }

    return { isValid: true };
  }
}

// Export singleton instance
export const inputValidator = new InputValidator();

// Export commonly used validation schemas
export const authSchemas = {
  signIn: z.object({
    email: commonSchemas.email,
    password: z.string().min(1, 'Password is required'),
  }),
  signUp: z.object({
    email: commonSchemas.email,
    password: commonSchemas.password,
    confirmPassword: z.string(),
  }).refine(data => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  }),
};

export const widgetSchemas = {
  create: z.object({
    type: z.string().min(1, 'Widget type is required'),
    name: commonSchemas.widgetName,
    settings: z.record(z.any()).optional(),
    x: z.number().min(0).optional(),
    y: z.number().min(0).optional(),
    width: z.number().min(1).max(20).optional(),
    height: z.number().min(1).max(20).optional(),
  }),
  update: z.object({
    id: z.string().uuid('Invalid widget ID'),
    name: commonSchemas.widgetName.optional(),
    settings: z.record(z.any()).optional(),
    x: z.number().min(0).optional(),
    y: z.number().min(0).optional(),
    width: z.number().min(1).max(20).optional(),
    height: z.number().min(1).max(20).optional(),
  }),
};