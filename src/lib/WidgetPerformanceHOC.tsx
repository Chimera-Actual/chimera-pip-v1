import React, { memo, useMemo, useCallback } from 'react';
import { BaseWidgetProps } from '@/types/widget';
import { logger } from '@/lib/logger';

/**
 * Higher-Order Component for widget performance optimization
 * Provides standardized memoization and error handling for all widgets
 */
export function withWidgetPerformance<T extends BaseWidgetProps>(
  WrappedComponent: React.ComponentType<T>,
  displayName: string
) {
  const MemoizedWidget = memo((props: T) => {
    // Memoize storage keys to prevent recreation
    const storageKeys = useMemo(() => ({
      settings: `widget-${props.widgetInstanceId}-settings`,
      data: `widget-${props.widgetInstanceId}-data`,
      state: `widget-${props.widgetInstanceId}-state`
    }), [props.widgetInstanceId]);

    // Memoized settings save function
    const saveSettings = useCallback((settings: any) => {
      try {
        localStorage.setItem(storageKeys.settings, JSON.stringify(settings));
        props.onSettingsChange?.(settings);
      } catch (error) {
        logger.warn(`Failed to save widget settings for ${displayName}`, error, displayName);
      }
    }, [storageKeys.settings, props.onSettingsChange]);

    // Enhanced props with performance optimizations
    const enhancedProps = useMemo(() => ({
      ...props,
      storageKeys,
      saveSettings
    }), [props, storageKeys, saveSettings]);

    return <WrappedComponent {...enhancedProps} />;
  });

  MemoizedWidget.displayName = `withWidgetPerformance(${displayName})`;
  return MemoizedWidget;
}

/**
 * Utility hook for optimized widget state management
 */
export function useWidgetState<T>(
  widgetInstanceId: string,
  defaultState: T,
  storageKey?: string
) {
  const key = storageKey || `widget-${widgetInstanceId}-state`;
  
  const [state, setState] = React.useState<T>(() => {
    try {
      const saved = localStorage.getItem(key);
      return saved ? { ...defaultState, ...JSON.parse(saved) } : defaultState;
    } catch {
      return defaultState;
    }
  });

  const updateState = useCallback((newState: Partial<T> | ((prev: T) => T)) => {
    setState(prev => {
      const updated = typeof newState === 'function' ? newState(prev) : { ...prev, ...newState };
      
      try {
        localStorage.setItem(key, JSON.stringify(updated));
      } catch (error) {
        logger.warn('Failed to persist widget state', error, 'useWidgetState');
      }
      
      return updated;
    });
  }, [key]);

  return [state, updateState] as const;
}

/**
 * Optimized settings hook with automatic persistence
 */
export function useWidgetSettings<T extends Record<string, any>>(
  widgetInstanceId: string,
  defaultSettings: T,
  externalSettings?: Partial<T>,
  onSettingsChange?: (settings: T) => void
) {
  const storageKey = useMemo(() => `widget-${widgetInstanceId}-settings`, [widgetInstanceId]);
  
  const [settings, setSettings] = React.useState<T>(() => {
    if (externalSettings) return { ...defaultSettings, ...externalSettings };
    
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
    } catch {
      return defaultSettings;
    }
  });

  const updateSettings = useCallback((newSettings: Partial<T> | ((prev: T) => T)) => {
    setSettings(prev => {
      const updated = typeof newSettings === 'function' ? newSettings(prev) : { ...prev, ...newSettings };
      
      try {
        localStorage.setItem(storageKey, JSON.stringify(updated));
        onSettingsChange?.(updated);
      } catch (error) {
        logger.warn('Failed to save widget settings', error, 'useWidgetSettings');
      }
      
      return updated;
    });
  }, [storageKey, onSettingsChange]);

  return [settings, updateSettings] as const;
}