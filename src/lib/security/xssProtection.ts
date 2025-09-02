/**
 * XSS Protection and Input Sanitization
 * Provides comprehensive protection against cross-site scripting attacks
 */

import DOMPurify from 'dompurify';
import { logger } from '@/lib/logger';

interface SanitizeOptions {
  allowHTML?: boolean;
  allowedTags?: string[];
  allowedAttributes?: string[];
  stripTags?: boolean;
}

class XSSProtection {
  private defaultOptions: SanitizeOptions = {
    allowHTML: false,
    allowedTags: ['b', 'i', 'em', 'strong', 'p', 'br'],
    allowedAttributes: [],
    stripTags: true,
  };

  /**
   * Sanitize user input to prevent XSS attacks
   */
  sanitizeInput(input: string, options: SanitizeOptions = {}): string {
    if (!input || typeof input !== 'string') {
      return '';
    }

    const config = { ...this.defaultOptions, ...options };

    try {
      let sanitized: string;

      if (config.allowHTML) {
        // Allow specific HTML tags with DOMPurify
        sanitized = DOMPurify.sanitize(input, {
          ALLOWED_TAGS: config.allowedTags,
          ALLOWED_ATTR: config.allowedAttributes,
          KEEP_CONTENT: true,
        });
      } else {
        // Strip all HTML and encode special characters
        sanitized = this.encodeHTML(input);
      }

      // Log potential XSS attempts
      if (sanitized !== input) {
        logger.warn('XSS attempt detected and sanitized', {
          original: input.substring(0, 100),
          sanitized: sanitized.substring(0, 100),
        }, 'Security');
      }

      return sanitized;
    } catch (error) {
      logger.error('Error sanitizing input', error as Error, 'Security');
      return '';
    }
  }

  /**
   * Encode HTML entities to prevent XSS
   */
  encodeHTML(input: string): string {
    const div = document.createElement('div');
    div.textContent = input;
    return div.innerHTML;
  }

  /**
   * Sanitize object properties recursively
   */
  sanitizeObject<T extends Record<string, any>>(obj: T, options: SanitizeOptions = {}): T {
    const sanitized = { ...obj } as T;

    for (const [key, value] of Object.entries(sanitized)) {
      if (typeof value === 'string') {
        (sanitized as any)[key] = this.sanitizeInput(value, options);
      } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        (sanitized as any)[key] = this.sanitizeObject(value, options);
      } else if (Array.isArray(value)) {
        (sanitized as any)[key] = value.map(item => 
          typeof item === 'string' 
            ? this.sanitizeInput(item, options)
            : typeof item === 'object' && item !== null
              ? this.sanitizeObject(item, options)
              : item
        );
      }
    }

    return sanitized;
  }

  /**
   * Validate and sanitize file uploads
   */
  validateFileUpload(file: File): { isValid: boolean; error?: string } {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'audio/mpeg',
      'audio/wav',
      'audio/ogg',
      'text/plain',
      'application/json',
    ];

    // Check file size
    if (file.size > maxSize) {
      return { isValid: false, error: 'File size exceeds 10MB limit' };
    }

    // Check file type
    if (!allowedTypes.includes(file.type)) {
      return { isValid: false, error: 'File type not allowed' };
    }

    // Check for malicious file names
    const dangerousPatterns = [
      /\.exe$/i,
      /\.bat$/i,
      /\.cmd$/i,
      /\.scr$/i,
      /\.php$/i,
      /\.jsp$/i,
      /\.asp$/i,
      /\.js$/i,
      /\.html$/i,
      /\.htm$/i,
    ];

    if (dangerousPatterns.some(pattern => pattern.test(file.name))) {
      return { isValid: false, error: 'File name contains potentially dangerous extension' };
    }

    return { isValid: true };
  }

  /**
   * Generate secure CSP nonce
   */
  generateNonce(): string {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }
}

// Export singleton instance
export const xssProtection = new XSSProtection();