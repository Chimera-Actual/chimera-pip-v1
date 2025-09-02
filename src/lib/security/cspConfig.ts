/**
 * Content Security Policy Configuration
 * Provides strict CSP headers to prevent XSS and other attacks
 */

export interface CSPDirectives {
  'default-src'?: string[];
  'script-src'?: string[];
  'style-src'?: string[];
  'img-src'?: string[];
  'font-src'?: string[];
  'connect-src'?: string[];
  'media-src'?: string[];
  'object-src'?: string[];
  'frame-src'?: string[];
  'worker-src'?: string[];
  'child-src'?: string[];
  'form-action'?: string[];
  'frame-ancestors'?: string[];
  'base-uri'?: string[];
  'manifest-src'?: string[];
}

class CSPManager {
  private nonce: string | null = null;

  /**
   * Generate a new nonce for this request
   */
  generateNonce(): string {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    this.nonce = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    return this.nonce;
  }

  /**
   * Get current nonce
   */
  getCurrentNonce(): string | null {
    return this.nonce;
  }

  /**
   * Get CSP directives for the application
   */
  getCSPDirectives(isDevelopment = false): CSPDirectives {
    const nonce = this.getCurrentNonce();
    const nonceValue = nonce ? `'nonce-${nonce}'` : '';

    const baseDirectives: CSPDirectives = {
      'default-src': ["'self'"],
      'script-src': [
        "'self'",
        nonceValue,
        // Allow inline scripts only in development
        ...(isDevelopment ? ["'unsafe-inline'", "'unsafe-eval'"] : []),
        // Trusted CDNs
        'https://fonts.googleapis.com',
        'https://fonts.gstatic.com',
        // Vite development server
        ...(isDevelopment ? ['http://localhost:*', 'ws://localhost:*'] : []),
      ].filter(Boolean),
      'style-src': [
        "'self'",
        "'unsafe-inline'", // Required for styled-components and CSS-in-JS
        'https://fonts.googleapis.com',
        'https://fonts.gstatic.com',
      ],
      'img-src': [
        "'self'",
        'data:', // For base64 images
        'blob:', // For generated images
        'https:', // Allow all HTTPS images
        // Supabase storage
        'https://*.supabase.co',
        'https://*.supabase.com',
        // Maps and external services
        'https://*.mapbox.com',
        'https://*.openstreetmap.org',
        'https://*.tile.openstreetmap.org',
      ],
      'font-src': [
        "'self'",
        'data:',
        'https://fonts.googleapis.com',
        'https://fonts.gstatic.com',
      ],
      'connect-src': [
        "'self'",
        // Supabase API
        'https://*.supabase.co',
        'https://*.supabase.com',
        // External APIs
        'https://api.openweathermap.org',
        'https://api.mapbox.com',
        // WebSocket connections
        'wss://*.supabase.co',
        'wss://*.supabase.com',
        // Development servers
        ...(isDevelopment ? [
          'http://localhost:*',
          'ws://localhost:*',
          'http://127.0.0.1:*',
          'ws://127.0.0.1:*',
        ] : []),
      ],
      'media-src': [
        "'self'",
        'blob:',
        'data:',
        // Supabase storage for audio files
        'https://*.supabase.co',
        'https://*.supabase.com',
      ],
      'object-src': ["'none'"], // Disable plugins
      'frame-src': [
        "'self'",
        // Allow embedding maps and trusted services
        'https://*.mapbox.com',
        'https://*.openstreetmap.org',
      ],
      'worker-src': [
        "'self'",
        'blob:', // For web workers
      ],
      'child-src': [
        "'self'",
        'blob:',
      ],
      'form-action': [
        "'self'",
      ],
      'frame-ancestors': [
        "'none'", // Prevent clickjacking
      ],
      'base-uri': [
        "'self'",
      ],
      'manifest-src': [
        "'self'",
      ],
    };

    return baseDirectives;
  }

  /**
   * Convert CSP directives to header string
   */
  directivesToString(directives: CSPDirectives): string {
    return Object.entries(directives)
      .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
      .join('; ');
  }

  /**
   * Get CSP header value
   */
  getCSPHeader(isDevelopment = false): string {
    const directives = this.getCSPDirectives(isDevelopment);
    return this.directivesToString(directives);
  }

  /**
   * Get report-only CSP header for testing
   */
  getReportOnlyCSPHeader(isDevelopment = false): string {
    const directives = this.getCSPDirectives(isDevelopment);
    
    // Add report-uri for CSP violations
    const reportDirectives = {
      ...directives,
      'report-uri': ['/api/csp-report'],
    };
    
    return this.directivesToString(reportDirectives);
  }

  /**
   * Validate nonce format
   */
  isValidNonce(nonce: string): boolean {
    return /^[a-f0-9]{32}$/.test(nonce);
  }

  /**
   * Get security headers for the application
   */
  getSecurityHeaders(isDevelopment = false): Record<string, string> {
    return {
      // Content Security Policy
      'Content-Security-Policy': this.getCSPHeader(isDevelopment),
      
      // X-Frame-Options (fallback for older browsers)
      'X-Frame-Options': 'DENY',
      
      // X-Content-Type-Options
      'X-Content-Type-Options': 'nosniff',
      
      // X-XSS-Protection (legacy, but still useful)
      'X-XSS-Protection': '1; mode=block',
      
      // Referrer Policy
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      
      // Strict Transport Security (for HTTPS in production)
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
      
      // Permissions Policy (Feature Policy)
      'Permissions-Policy': [
        'geolocation=(self)',
        'microphone=()',
        'camera=()',
        'payment=()',
        'usb=()',
        'magnetometer=()',
        'gyroscope=()',
        'accelerometer=()',
      ].join(', '),
    };
  }
}

// Export singleton instance
export const cspManager = new CSPManager();

// Helper function to inject nonce into HTML
export const injectCSPNonce = (html: string, nonce: string): string => {
  return html.replace(
    /<script\b(?![^>]*\bnonce=)/g,
    `<script nonce="${nonce}"`
  );
};

// Development CSP warning
if (process.env.NODE_ENV === 'development') {
  console.warn(
    '🔒 CSP is running in development mode with relaxed policies. ' +
    'Production will use strict CSP policies.'
  );
}