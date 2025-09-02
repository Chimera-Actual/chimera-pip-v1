/**
 * Security Hook
 * Provides security utilities and state management for components
 */

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { z } from 'zod';
import { useAuth } from './useAuth';
import { xssProtection } from '@/lib/security/xssProtection';
import { inputValidator, commonSchemas } from '@/lib/security/inputValidation';
import { securityAuditLogger, logSecurityEvent } from '@/lib/security/auditLogger';
import { rateLimiter } from '@/lib/security/rateLimiter';
import { cspManager } from '@/lib/security/cspConfig';
import { logger } from '@/lib/logger';

interface SecurityContextType {
  // XSS Protection
  sanitizeInput: (input: string, options?: any) => string;
  sanitizeObject: <T extends Record<string, any>>(obj: T, options?: any) => T;
  
  // Input Validation
  validateInput: (input: string, type: 'email' | 'password' | 'username' | 'url') => { isValid: boolean; error?: string };
  validateJSON: (input: string) => { isValid: boolean; data?: any; error?: string };
  validateFilePath: (path: string) => { isValid: boolean; error?: string };
  
  // Rate Limiting
  checkRateLimit: (endpoint: string) => { allowed: boolean; remaining: number; retryAfter?: number };
  recordRequest: (endpoint: string, success?: boolean) => void;
  
  // Security Monitoring
  logSecurityEvent: (type: string, details: Record<string, any>, severity?: string) => void;
  getSecurityStats: () => Record<string, any>;
  
  // CSP Management
  getCurrentNonce: () => string | null;
  generateNonce: () => string;
  
  // Security Status
  securityStatus: {
    cspEnabled: boolean;
    rateLimitEnabled: boolean;
    auditLogEnabled: boolean;
  };
}

const SecurityContext = createContext<SecurityContextType | undefined>(undefined);

export function SecurityProvider({ children }: { children: ReactNode }) {
  const { user, session } = useAuth();
  const [clientId, setClientId] = useState<string>('');
  const [securityStatus] = useState({
    cspEnabled: true,
    rateLimitEnabled: true,
    auditLogEnabled: true,
  });

  // Generate client ID for rate limiting
  useEffect(() => {
    const id = rateLimiter.generateClientId(user?.id, session?.access_token);
    setClientId(id);
  }, [user?.id, session?.access_token]);

  // Initialize CSP nonce
  useEffect(() => {
    cspManager.generateNonce();
  }, []);

  // Log user authentication events
  useEffect(() => {
    if (user) {
      logSecurityEvent.authSuccess({ userId: user.id });
    }
  }, [user]);

  // Sanitization methods
  const sanitizeInput = useCallback((input: string, options?: any) => {
    return xssProtection.sanitizeInput(input, options);
  }, []);

  const sanitizeObject = useCallback(<T extends Record<string, any>>(obj: T, options?: any) => {
    return xssProtection.sanitizeObject(obj, options);
  }, []);

  // Validation methods
  const validateInput = useCallback((input: string, type: 'email' | 'password' | 'username' | 'url') => {
    try {
      const schemas = {
        email: commonSchemas.email,
        password: commonSchemas.password,
        username: commonSchemas.username,
        url: commonSchemas.url,
      };

      const result = inputValidator.validateFormData(input, schemas[type]);
      return { isValid: result.isValid, error: result.errors?.[0] };
    } catch (error) {
      return { isValid: false, error: 'Validation failed' };
    }
  }, []);

  const validateJSON = useCallback((input: string) => {
    return inputValidator.validateJSON(input);
  }, []);

  const validateFilePath = useCallback((path: string) => {
    return inputValidator.validateFilePath(path);
  }, []);

  // Rate limiting methods
  const checkRateLimit = useCallback((endpoint: string) => {
    if (!clientId) return { allowed: true, remaining: 100 };
    
    const result = rateLimiter.isAllowed(clientId, endpoint);
    
    if (!result.allowed) {
      logger.warn('Rate limit exceeded', {
        endpoint,
        clientId: clientId.substring(0, 8) + '...',
        retryAfter: result.retryAfter,
      }, 'Security');
    }
    
    return result;
  }, [clientId]);

  const recordRequest = useCallback((endpoint: string, success = true) => {
    if (clientId) {
      rateLimiter.recordRequest(clientId, endpoint, success);
    }
  }, [clientId]);

  // Security monitoring methods
  const logSecurityEventMethod = useCallback((type: string, details: Record<string, any>, severity = 'medium') => {
    securityAuditLogger.logSecurityEvent(type as any, details, severity as any);
  }, []);

  const getSecurityStats = useCallback(() => {
    return securityAuditLogger.getSecurityStats();
  }, []);

  // CSP methods
  const getCurrentNonce = useCallback(() => {
    return cspManager.getCurrentNonce();
  }, []);

  const generateNonce = useCallback(() => {
    return cspManager.generateNonce();
  }, []);

  const value: SecurityContextType = {
    sanitizeInput,
    sanitizeObject,
    validateInput,
    validateJSON,
    validateFilePath,
    checkRateLimit,
    recordRequest,
    logSecurityEvent: logSecurityEventMethod,
    getSecurityStats,
    getCurrentNonce,
    generateNonce,
    securityStatus,
  };

  return (
    <SecurityContext.Provider value={value}>
      {children}
    </SecurityContext.Provider>
  );
}

export function useSecurity() {
  const context = useContext(SecurityContext);
  if (context === undefined) {
    throw new Error('useSecurity must be used within a SecurityProvider');
  }
  return context;
}

// Higher-order component for automatic input sanitization
export function withSecurityValidation<T extends Record<string, any>>(
  Component: React.ComponentType<T>
) {
  return function SecurityValidatedComponent(props: T) {
    const { sanitizeObject } = useSecurity();
    
    // Sanitize all string props
    const sanitizedProps = sanitizeObject(props);
    
    return <Component {...sanitizedProps} />;
  };
}

// Hook for form security validation
export function useSecureForm() {
  const { sanitizeInput, validateInput, checkRateLimit, recordRequest } = useSecurity();
  
  const validateAndSanitizeField = useCallback((
    value: string,
    type: 'email' | 'password' | 'username' | 'url',
    sanitize = true
  ) => {
    // Validate first
    const validation = validateInput(value, type);
    if (!validation.isValid) {
      return { isValid: false, error: validation.error, value };
    }
    
    // Sanitize if requested
    const sanitizedValue = sanitize ? sanitizeInput(value) : value;
    
    return { isValid: true, value: sanitizedValue };
  }, [sanitizeInput, validateInput]);
  
  const submitWithRateLimit = useCallback(async (
    endpoint: string,
    submitFn: () => Promise<any>
  ) => {
    // Check rate limit
    const rateCheck = checkRateLimit(endpoint);
    if (!rateCheck.allowed) {
      throw new Error(`Rate limit exceeded. Try again in ${rateCheck.retryAfter} seconds.`);
    }
    
    try {
      const result = await submitFn();
      recordRequest(endpoint, true);
      return result;
    } catch (error) {
      recordRequest(endpoint, false);
      throw error;
    }
  }, [checkRateLimit, recordRequest]);
  
  return {
    validateAndSanitizeField,
    submitWithRateLimit,
  };
}