/**
 * Security Audit Logging System
 * Tracks security events and potential threats
 */

import { logger } from '@/lib/logger';
import { supabase } from '@/integrations/supabase/client';

export type SecurityEventType = 
  | 'auth_success'
  | 'auth_failure' 
  | 'auth_lockout'
  | 'privilege_escalation'
  | 'xss_attempt'
  | 'sql_injection_attempt'
  | 'file_upload_blocked'
  | 'rate_limit_exceeded'
  | 'suspicious_activity'
  | 'data_access'
  | 'settings_change'
  | 'widget_creation'
  | 'widget_deletion';

interface SecurityEvent {
  type: SecurityEventType;
  userId?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  details: Record<string, any>;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
}

class SecurityAuditLogger {
  private events: SecurityEvent[] = [];
  private maxEvents = 10000;
  private alertThresholds = {
    auth_failure: 5, // 5 failures in 15 minutes triggers alert
    xss_attempt: 3,
    sql_injection_attempt: 1,
    rate_limit_exceeded: 10,
  };

  /**
   * Log a security event
   */
  async logSecurityEvent(
    type: SecurityEventType,
    details: Record<string, any>,
    severity: SecurityEvent['severity'] = 'medium'
  ): Promise<void> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const event: SecurityEvent = {
        type,
        userId: session?.user?.id,
        sessionId: session?.access_token ? this.hashSessionId(session.access_token) : undefined,
        ipAddress: await this.getClientIP(),
        userAgent: navigator.userAgent,
        details,
        severity,
        timestamp: new Date().toISOString(),
      };

      // Store in memory for immediate access
      this.events.push(event);
      if (this.events.length > this.maxEvents) {
        this.events.shift();
      }

      // Log to application logger
      logger.warn(`Security Event: ${type}`, {
        ...event,
        userAgent: event.userAgent?.substring(0, 100), // Truncate for readability
      }, 'Security');

      // Check for alert conditions
      this.checkAlertConditions(type, event);

      // Store critical events in database (if needed for compliance)
      if (severity === 'critical' || severity === 'high') {
        await this.persistCriticalEvent(event);
      }

    } catch (error) {
      logger.error('Failed to log security event', error as Error, 'Security');
    }
  }

  /**
   * Get recent security events
   */
  getRecentEvents(hours = 24, type?: SecurityEventType): SecurityEvent[] {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    
    return this.events.filter(event => {
      const eventTime = new Date(event.timestamp);
      const matchesTime = eventTime >= cutoff;
      const matchesType = !type || event.type === type;
      return matchesTime && matchesType;
    });
  }

  /**
   * Get security statistics
   */
  getSecurityStats(hours = 24): Record<string, any> {
    const recentEvents = this.getRecentEvents(hours);
    const stats: Record<string, any> = {};

    // Count events by type
    recentEvents.forEach(event => {
      stats[event.type] = (stats[event.type] || 0) + 1;
    });

    // Add severity breakdown
    const severityBreakdown = recentEvents.reduce((acc, event) => {
      acc[event.severity] = (acc[event.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalEvents: recentEvents.length,
      eventTypes: stats,
      severityBreakdown,
      timeRange: `${hours} hours`,
    };
  }

  /**
   * Check for alert conditions based on event patterns
   */
  private checkAlertConditions(type: SecurityEventType, event: SecurityEvent): void {
    const threshold = this.alertThresholds[type as keyof typeof this.alertThresholds];
    if (!threshold) return;

    const recentEvents = this.getRecentEvents(0.25, type); // Last 15 minutes
    
    if (recentEvents.length >= threshold) {
      this.logSecurityEvent('suspicious_activity', {
        triggeredBy: type,
        eventCount: recentEvents.length,
        threshold,
        timeWindow: '15 minutes',
        events: recentEvents.slice(-5), // Last 5 events
      }, 'high');
    }
  }

  /**
   * Persist critical security events to database
   */
  private async persistCriticalEvent(event: SecurityEvent): Promise<void> {
    try {
      // In a real implementation, you might want to create a security_logs table
      // For now, we'll use the existing logging system
      logger.error(`CRITICAL SECURITY EVENT: ${event.type}`, event, 'Security');
    } catch (error) {
      logger.error('Failed to persist critical security event', error as Error, 'Security');
    }
  }

  /**
   * Hash session ID for privacy
   */
  private hashSessionId(sessionId: string): string {
    // Simple hash for session tracking without storing full session
    let hash = 0;
    for (let i = 0; i < sessionId.length; i++) {
      const char = sessionId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * Get client IP address (best effort)
   */
  private async getClientIP(): Promise<string | undefined> {
    try {
      // In a real deployment, this would be handled by the server
      // For client-side, we can only get limited info
      return 'client-side-unknown';
    } catch (error) {
      return undefined;
    }
  }

  /**
   * Clear old events (for memory management)
   */
  clearOldEvents(hours = 168): void { // Default: 1 week
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    this.events = this.events.filter(event => new Date(event.timestamp) >= cutoff);
  }
}

// Export singleton instance
export const securityAuditLogger = new SecurityAuditLogger();

// Convenience methods for common security events
export const logSecurityEvent = {
  authSuccess: (details?: Record<string, any>) => 
    securityAuditLogger.logSecurityEvent('auth_success', details || {}, 'low'),
    
  authFailure: (details?: Record<string, any>) => 
    securityAuditLogger.logSecurityEvent('auth_failure', details || {}, 'medium'),
    
  xssAttempt: (details: Record<string, any>) => 
    securityAuditLogger.logSecurityEvent('xss_attempt', details, 'high'),
    
  sqlInjectionAttempt: (details: Record<string, any>) => 
    securityAuditLogger.logSecurityEvent('sql_injection_attempt', details, 'critical'),
    
  privilegeEscalation: (details: Record<string, any>) => 
    securityAuditLogger.logSecurityEvent('privilege_escalation', details, 'critical'),
    
  dataAccess: (details: Record<string, any>) => 
    securityAuditLogger.logSecurityEvent('data_access', details, 'low'),
    
  settingsChange: (details: Record<string, any>) => 
    securityAuditLogger.logSecurityEvent('settings_change', details, 'medium'),
    
  rateLimitExceeded: (details: Record<string, any>) => 
    securityAuditLogger.logSecurityEvent('rate_limit_exceeded', details, 'medium'),
};