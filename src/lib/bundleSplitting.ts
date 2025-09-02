/**
 * Bundle Splitting and Code Organization Utilities
 * Provides centralized lazy loading and dynamic imports for optimal performance
 */

import React from 'react';
import { logger } from './logger';

/**
 * Enhanced dynamic import with error handling and retry logic
 */
export async function dynamicImport<T = any>(
  importFn: () => Promise<{ default: T }>,
  componentName: string,
  retries = 2
): Promise<{ default: T }> {
  try {
    const module = await importFn();
    logger.debug(`Successfully loaded module: ${componentName}`, undefined, 'BundleSplitting');
    return module;
  } catch (error) {
    if (retries > 0) {
      logger.warn(`Failed to load ${componentName}, retrying...`, { retries }, 'BundleSplitting');
      await new Promise(resolve => setTimeout(resolve, 1000));
      return dynamicImport(importFn, componentName, retries - 1);
    }
    
    logger.error(`Failed to load module: ${componentName}`, error, 'BundleSplitting');
    throw error;
  }
}

/**
 * Create lazy component with enhanced error handling
 */
export function createLazyComponent<P = {}>(
  importFn: () => Promise<{ default: React.ComponentType<P> }>,
  componentName: string
): React.LazyExoticComponent<React.ComponentType<P>> {
  return React.lazy(async () => {
    try {
      const module = await importFn();
      if (!module.default) {
        throw new Error(`Component ${componentName} does not have a default export`);
      }
      logger.debug(`Successfully loaded lazy component: ${componentName}`, undefined, 'BundleSplitting');
      return module;
    } catch (error) {
      logger.error(`Failed to load lazy component: ${componentName}`, error, 'BundleSplitting');
      throw error;
    }
  });
}

/**
 * Preload component for better performance
 */
export function preloadComponent(importFn: () => Promise<any>, componentName: string) {
  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    window.requestIdleCallback(() => {
      dynamicImport(importFn, componentName).catch(() => {
        // Silently fail preloading - it's just optimization
      });
    });
  } else {
    // Fallback for browsers without requestIdleCallback
    setTimeout(() => {
      dynamicImport(importFn, componentName).catch(() => {
        // Silently fail preloading
      });
    }, 100);
  }
}

/**
 * Bundle configuration for different widget categories
 */
type WidgetName = 'SampleClock' | 'SampleNote' | 'SampleChart' | 'AddWidgetWidget' | 'DashboardSettingsWidget' | 'AudioWidget' | 'MapWidget' | 'AnalyticsWidget' | 'WidgetFactoryDemo' | 'ModernCSSDemo';

export const BUNDLE_CONFIG = {
  core: {
    // Essential widgets that should be in main bundle
    widgets: ['SampleClock', 'SampleNote', 'SampleChart'] as const,
    priority: 'high' as const
  },
  dashboard: {
    // Dashboard management widgets
    widgets: ['AddWidgetWidget', 'DashboardSettingsWidget'] as const,
    priority: 'medium' as const
  },
  utilities: {
    // Utility widgets that can be lazy loaded
    widgets: ['AudioWidget', 'MapWidget', 'AnalyticsWidget'] as const,
    priority: 'low' as const
  },
  demo: {
    // Development and demo widgets
    widgets: ['WidgetFactoryDemo', 'ModernCSSDemo'] as const,
    priority: 'lowest' as const
  }
} as const;

/**
 * Get bundle priority for a widget
 */
export function getWidgetBundlePriority(widgetName: string): 'high' | 'medium' | 'low' | 'lowest' {
  // Check each category directly
  if (BUNDLE_CONFIG.core.widgets.includes(widgetName as any)) return 'high';
  if (BUNDLE_CONFIG.dashboard.widgets.includes(widgetName as any)) return 'medium';
  if (BUNDLE_CONFIG.utilities.widgets.includes(widgetName as any)) return 'low';
  if (BUNDLE_CONFIG.demo.widgets.includes(widgetName as any)) return 'lowest';
  
  return 'low'; // Default priority
}