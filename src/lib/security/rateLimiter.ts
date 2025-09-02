/**
 * Rate Limiting System
 * Protects against brute force attacks and API abuse
 */

import { logger } from '@/lib/logger';
import { logSecurityEvent } from './auditLogger';

interface RateLimit {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

interface RequestRecord {
  timestamp: number;
  success: boolean;
}

interface ClientData {
  requests: RequestRecord[];
  blocked: boolean;
  blockedUntil?: number;
  totalBlocked: number;
}

class RateLimiter {
  private clients = new Map<string, ClientData>();
  private readonly cleanupInterval = 5 * 60 * 1000; // 5 minutes
  private cleanupTimer?: NodeJS.Timeout;

  // Rate limit configurations for different endpoints
  private readonly limits: Record<string, RateLimit> = {
    auth: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 5, // 5 auth attempts per 15 minutes
      skipSuccessfulRequests: true,
    },
    api: {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 100, // 100 API calls per minute
    },
    upload: {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 10, // 10 uploads per minute
    },
    widget: {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 50, // 50 widget operations per minute
    },
  };

  constructor() {
    this.startCleanupTimer();
  }

  /**
   * Check if request is allowed
   */
  isAllowed(clientId: string, endpoint: string, isSuccess?: boolean): {
    allowed: boolean;
    remaining: number;
    resetTime: number;
    retryAfter?: number;
  } {
    const limit = this.limits[endpoint] || this.limits.api;
    const client = this.getOrCreateClient(clientId);
    const now = Date.now();

    // Check if client is currently blocked
    if (client.blocked && client.blockedUntil && now < client.blockedUntil) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: client.blockedUntil,
        retryAfter: Math.ceil((client.blockedUntil - now) / 1000),
      };
    }

    // Clean old requests outside the window
    const windowStart = now - limit.windowMs;
    client.requests = client.requests.filter(req => req.timestamp > windowStart);

    // Count relevant requests based on configuration
    let relevantRequests = client.requests;
    if (limit.skipSuccessfulRequests) {
      relevantRequests = relevantRequests.filter(req => !req.success);
    }
    if (limit.skipFailedRequests) {
      relevantRequests = relevantRequests.filter(req => req.success);
    }

    const requestCount = relevantRequests.length;
    const remaining = Math.max(0, limit.maxRequests - requestCount);

    // Check if limit exceeded
    if (requestCount >= limit.maxRequests) {
      this.blockClient(clientId, endpoint, limit.windowMs);
      
      logSecurityEvent.rateLimitExceeded({
        clientId: clientId.substring(0, 8) + '...',
        endpoint,
        requestCount,
        limit: limit.maxRequests,
        windowMs: limit.windowMs,
      });

      return {
        allowed: false,
        remaining: 0,
        resetTime: now + limit.windowMs,
        retryAfter: Math.ceil(limit.windowMs / 1000),
      };
    }

    return {
      allowed: true,
      remaining,
      resetTime: now + limit.windowMs,
    };
  }

  /**
   * Record a request
   */
  recordRequest(clientId: string, endpoint: string, isSuccess: boolean = true): void {
    const client = this.getOrCreateClient(clientId);
    
    client.requests.push({
      timestamp: Date.now(),
      success: isSuccess,
    });

    // If client was blocked but request is successful, consider unblocking
    if (client.blocked && isSuccess && endpoint === 'auth') {
      this.unblockClient(clientId);
    }
  }

  /**
   * Block a client for progressive delays
   */
  private blockClient(clientId: string, endpoint: string, baseDelay: number): void {
    const client = this.getOrCreateClient(clientId);
    client.blocked = true;
    client.totalBlocked++;

    // Progressive delay - increases with each block
    const progressiveDelay = baseDelay * Math.min(client.totalBlocked, 10);
    client.blockedUntil = Date.now() + progressiveDelay;

    logger.warn('Client blocked due to rate limiting', {
      clientId: clientId.substring(0, 8) + '...',
      endpoint,
      blockCount: client.totalBlocked,
      blockedUntilMs: progressiveDelay,
    }, 'Security');
  }

  /**
   * Unblock a client
   */
  private unblockClient(clientId: string): void {
    const client = this.clients.get(clientId);
    if (client) {
      client.blocked = false;
      client.blockedUntil = undefined;
      
      logger.info('Client unblocked', {
        clientId: clientId.substring(0, 8) + '...',
      }, 'Security');
    }
  }

  /**
   * Get or create client data
   */
  private getOrCreateClient(clientId: string): ClientData {
    if (!this.clients.has(clientId)) {
      this.clients.set(clientId, {
        requests: [],
        blocked: false,
        totalBlocked: 0,
      });
    }
    return this.clients.get(clientId)!;
  }

  /**
   * Generate client ID based on user/session info
   */
  generateClientId(userId?: string, sessionId?: string): string {
    // Combine user ID, session ID, and user agent for unique identification
    const components = [
      userId || 'anonymous',
      sessionId || 'no-session',
      navigator.userAgent.substring(0, 50),
    ];
    
    // Simple hash function
    const combined = components.join('|');
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash).toString(16);
  }

  /**
   * Get rate limit status for a client
   */
  getStatus(clientId: string, endpoint: string): {
    blocked: boolean;
    requests: number;
    limit: number;
    remaining: number;
    resetTime: number;
  } {
    const limit = this.limits[endpoint] || this.limits.api;
    const client = this.clients.get(clientId);
    
    if (!client) {
      return {
        blocked: false,
        requests: 0,
        limit: limit.maxRequests,
        remaining: limit.maxRequests,
        resetTime: Date.now() + limit.windowMs,
      };
    }

    const now = Date.now();
    const windowStart = now - limit.windowMs;
    const recentRequests = client.requests.filter(req => req.timestamp > windowStart);
    
    return {
      blocked: client.blocked && !!client.blockedUntil && now < client.blockedUntil,
      requests: recentRequests.length,
      limit: limit.maxRequests,
      remaining: Math.max(0, limit.maxRequests - recentRequests.length),
      resetTime: now + limit.windowMs,
    };
  }

  /**
   * Start periodic cleanup of old client data
   */
  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      const now = Date.now();
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours

      for (const [clientId, client] of this.clients.entries()) {
        // Remove old requests
        client.requests = client.requests.filter(
          req => now - req.timestamp < maxAge
        );

        // Remove inactive clients
        if (client.requests.length === 0 && 
            (!client.blockedUntil || now > client.blockedUntil)) {
          this.clients.delete(clientId);
        }
      }
    }, this.cleanupInterval);
  }

  /**
   * Stop cleanup timer (for cleanup)
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
  }
}

// Export singleton instance
export const rateLimiter = new RateLimiter();

// Convenience wrapper for common rate limiting patterns
export const withRateLimit = async <T>(
  operation: () => Promise<T>,
  clientId: string,
  endpoint: string
): Promise<T> => {
  const result = rateLimiter.isAllowed(clientId, endpoint);
  
  if (!result.allowed) {
    const error = new Error('Rate limit exceeded');
    (error as any).statusCode = 429;
    (error as any).retryAfter = result.retryAfter;
    throw error;
  }

  try {
    const operationResult = await operation();
    rateLimiter.recordRequest(clientId, endpoint, true);
    return operationResult;
  } catch (error) {
    rateLimiter.recordRequest(clientId, endpoint, false);
    throw error;
  }
};