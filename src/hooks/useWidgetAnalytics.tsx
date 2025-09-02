import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

export interface WidgetUsageStats {
  widget_type: string;
  widget_name: string;
  usage_count: number;
  total_time_active: number; // in seconds
  last_used: string;
  avg_session_duration: number;
}

export interface SystemPerformanceStats {
  avg_load_time: number;
  total_sessions: number;
  avg_session_duration: number;
  most_used_widgets: string[];
  performance_score: number;
}

export interface UserActivityPattern {
  hour: number;
  activity_count: number;
  avg_duration: number;
}

export const useWidgetAnalytics = () => {
  const { user } = useAuth();
  const [widgetStats, setWidgetStats] = useState<WidgetUsageStats[]>([]);
  const [performanceStats, setPerformanceStats] = useState<SystemPerformanceStats | null>(null);
  const [activityPatterns, setActivityPatterns] = useState<UserActivityPattern[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadAnalytics();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadAnalytics = async () => {
    if (!user) return;

    setLoading(true);
    try {
      await Promise.all([
        loadWidgetStats(),
        loadPerformanceStats(),
        loadActivityPatterns(),
      ]);
    } catch (error) {
      logger.error('Error loading analytics', error, 'WidgetAnalytics');
    } finally {
      setLoading(false);
    }
  };

  const loadWidgetStats = async () => {
    if (!user) return;

    try {
      // Generate mock stats for common widgets
      const commonWidgets = ['clock', 'weather', 'status', 'settings', 'map', 'calendar'];
      const mockStats: WidgetUsageStats[] = commonWidgets.map((widget) => ({
        widget_type: widget,
        widget_name: widget.charAt(0).toUpperCase() + widget.slice(1),
        usage_count: Math.floor(Math.random() * 100) + 10,
        total_time_active: Math.floor(Math.random() * 3600) + 300,
        last_used: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        avg_session_duration: Math.floor(Math.random() * 600) + 60,
      }));

      setWidgetStats(mockStats);
    } catch (error) {
      logger.error('Error loading widget stats', error, 'WidgetAnalytics');
    }
  };

  const loadPerformanceStats = async () => {
    if (!user) return;

    try {
      // Generate mock performance stats
      const mockStats: SystemPerformanceStats = {
        avg_load_time: Math.random() * 2000 + 500,
        total_sessions: Math.floor(Math.random() * 100) + 20,
        avg_session_duration: Math.random() * 1800 + 300,
        most_used_widgets: ['clock', 'weather', 'status'],
        performance_score: Math.floor(Math.random() * 30) + 70,
      };

      setPerformanceStats(mockStats);
    } catch (error) {
      logger.error('Error loading performance stats', error, 'WidgetAnalytics');
    }
  };

  const loadActivityPatterns = async () => {
    if (!user) return;

    try {
      // Generate mock activity patterns for 24 hours
      const mockPatterns: UserActivityPattern[] = Array.from({ length: 24 }, (_, hour) => ({
        hour,
        activity_count: Math.floor(Math.random() * 20) + (hour >= 9 && hour <= 17 ? 10 : 2),
        avg_duration: Math.random() * 300 + 60,
      }));

      setActivityPatterns(mockPatterns);
    } catch (error) {
      logger.error('Error loading activity patterns', error, 'WidgetAnalytics');
    }
  };

  const trackWidgetUsage = async (widgetType: string, widgetName: string, sessionDuration: number) => {
    if (!user) return;

    try {
      // For now, just console log the usage (could store in user_settings later)
      logger.info('Widget usage tracked', { widgetType, widgetName, sessionDuration }, 'WidgetAnalytics');
    } catch (error) {
      logger.error('Error tracking widget usage', error, 'WidgetAnalytics');
    }
  };

  const trackPerformanceMetric = async (metric: string, value: number) => {
    if (!user) return;

    try {
      // For now, just console log the metric (could store in user_settings later)
      logger.debug('Performance metric tracked', { metric, value }, 'WidgetAnalytics');
    } catch (error) {
      logger.error('Error tracking performance metric', error, 'WidgetAnalytics');
    }
  };

  const getTopWidgets = (limit: number = 5) => {
    return widgetStats.slice(0, limit);
  };

  const getTotalUsageTime = () => {
    return widgetStats.reduce((total, stat) => total + stat.total_time_active, 0);
  };

  const getPerformanceScore = () => {
    return performanceStats?.performance_score || 0;
  };

  const getPeakUsageHours = () => {
    return activityPatterns
      .sort((a, b) => b.activity_count - a.activity_count)
      .slice(0, 3)
      .map(pattern => ({
        hour: pattern.hour,
        activity: pattern.activity_count,
        formattedHour: `${pattern.hour.toString().padStart(2, '0')}:00`
      }));
  };

  return {
    widgetStats,
    performanceStats,
    activityPatterns,
    loading,
    loadAnalytics,
    trackWidgetUsage,
    trackPerformanceMetric,
    getTopWidgets,
    getTotalUsageTime,
    getPerformanceScore,
    getPeakUsageHours,
  };
};