import React from 'react';
import { useEffect } from 'react';
import { useSecurity } from '@/hooks/useSecurity';
import { logger } from '@/lib/logger';

// Secure component wrapper
export function withSecurityMiddleware<T extends Record<string, any>>(
  Component: React.ComponentType<T>,
  options: {
    sanitizeProps?: boolean;
    validateInputs?: boolean;
    enforceRateLimit?: boolean;
    endpoint?: string;
  } = {}
) {
  return function SecureComponent(props: T) {
    const security = useSecurity();
    const {
      sanitizeProps = true,
      validateInputs = false,
      enforceRateLimit = false,
      endpoint = 'component',
    } = options;

    // Rate limiting check
    useEffect(() => {
      if (enforceRateLimit) {
        const rateCheck = security.checkRateLimit(endpoint);
        if (!rateCheck.allowed) {
          logger.warn('Component blocked by rate limit', {
            component: Component.name,
            endpoint,
            retryAfter: rateCheck.retryAfter,
          }, 'Security');
          // In a real app, you might redirect or show an error
          return;
        }
        security.recordRequest(endpoint, true);
      }
    }, []);

    // Sanitize props if enabled
    let secureProps = props;
    if (sanitizeProps) {
      try {
        secureProps = security.sanitizeObject(props);
      } catch (error) {
        logger.error('Failed to sanitize component props', error as Error, 'Security');
        secureProps = props; // Fallback to original props
      }
    }

    return <Component {...secureProps} />;
  };
}

// Security validation decorator for form components
export function withFormSecurity<T extends Record<string, any>>(
  Component: React.ComponentType<T>,
  validationRules?: Record<string, (value: any) => boolean>
) {
  return function SecureFormComponent(props: T) {
    const security = useSecurity();

    // Validate form data if validation rules are provided
    useEffect(() => {
      if (validationRules && props) {
        for (const [field, validator] of Object.entries(validationRules)) {
          if (props[field] && !validator(props[field])) {
            security.logSecurityEvent('input_validation_failed', {
              field,
              value: typeof props[field] === 'string' ? props[field].substring(0, 50) : 'non-string',
              component: Component.name,
            }, 'medium');
          }
        }
      }
    }, [props]);

    // Apply XSS protection to string props
    const secureProps = security.sanitizeObject(props, {
      allowHTML: false,
      stripTags: true,
    });

    return <Component {...secureProps} />;
  };
}

// Hook for secure data fetching
export function useSecureDataFetch() {
  const security = useSecurity();

  const secureRequest = async <T>(
    url: string,
    options: RequestInit = {},
    endpoint = 'api'
  ): Promise<T> => {
    // Check rate limit
    const rateCheck = security.checkRateLimit(endpoint);
    if (!rateCheck.allowed) {
      const error = new Error('Rate limit exceeded');
      (error as any).retryAfter = rateCheck.retryAfter;
      throw error;
    }

    // Validate URL
    const urlValidation = security.validateInput(url, 'url');
    if (!urlValidation.isValid) {
      security.logSecurityEvent('invalid_url_blocked', {
        url: url.substring(0, 100),
        error: urlValidation.error,
      }, 'high');
      throw new Error('Invalid URL blocked by security middleware');
    }

    // Add security headers
    const secureOptions: RequestInit = {
      ...options,
      headers: {
        ...options.headers,
        'X-Requested-With': 'XMLHttpRequest',
        'X-Content-Type': 'application/json',
      },
    };

    try {
      const response = await fetch(url, secureOptions);
      
      // Record successful request
      security.recordRequest(endpoint, response.ok);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Validate response content type
      const contentType = response.headers.get('content-type');
      if (contentType && !contentType.includes('application/json')) {
        security.logSecurityEvent('unexpected_content_type', {
          url: url.substring(0, 50),
          contentType,
          expected: 'application/json',
        }, 'medium');
      }

      const data = await response.json();
      
      // Sanitize response data
      const sanitizedData = security.sanitizeObject(data);
      
      return sanitizedData as T;
    } catch (error) {
      // Record failed request
      security.recordRequest(endpoint, false);
      
      security.logSecurityEvent('api_request_failed', {
        url: url.substring(0, 50),
        error: (error as Error).message,
      }, 'low');
      
      throw error;
    }
  };

  return { secureRequest };
}

// Component security audit helper
export function useSecurityAudit(componentName: string) {
  const security = useSecurity();

  const auditComponentAccess = (action: string, details?: Record<string, any>) => {
    security.logSecurityEvent('component_access', {
      component: componentName,
      action,
      ...details,
    }, 'low');
  };

  const auditDataAccess = (dataType: string, operation: string, details?: Record<string, any>) => {
    security.logSecurityEvent('data_access', {
      component: componentName,
      dataType,
      operation,
      ...details,
    }, 'medium');
  };

  const auditSensitiveOperation = (operation: string, details?: Record<string, any>) => {
    security.logSecurityEvent('sensitive_operation', {
      component: componentName,
      operation,
      ...details,
    }, 'high');
  };

  return {
    auditComponentAccess,
    auditDataAccess,
    auditSensitiveOperation,
  };
}

// Error boundary with security logging  
export class SecurityErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error('Security boundary caught error', {
      error: error.message,
      stack: error.stack?.substring(0, 500),
      componentStack: errorInfo.componentStack?.substring(0, 500),
    }, 'Security');
  }

  render() {
    if (this.state.hasError) {
      return React.createElement('div', {
        className: 'p-4 border border-destructive rounded-md bg-destructive/10'
      }, [
        React.createElement('h2', {
          key: 'title',
          className: 'text-lg font-semibold text-destructive mb-2'
        }, 'Security Error'),
        React.createElement('p', {
          key: 'message',
          className: 'text-muted-foreground'
        }, 'A security-related error occurred. The system has been notified.')
      ]);
    }

    return this.props.children;
  }
}