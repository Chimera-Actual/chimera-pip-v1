/**
 * Widget State Management Utilities
 * 
 * Provides consistent patterns for managing widget-specific state
 * with localStorage persistence and cleanup capabilities.
 */

import React from 'react';
import { logger } from './logger';

export interface WidgetStateConfig {
  widgetInstanceId: string;
  storagePrefix?: string;
}

/**
 * Creates widget-specific localStorage keys
 */
export function createWidgetStorageKey(
  widgetInstanceId: string, 
  stateKey: string, 
  prefix: string = 'widget'
): string {
  return `${prefix}-${widgetInstanceId}-${stateKey}`;
}

/**
 * Saves widget state to localStorage with error handling
 */
export function saveWidgetState<T>(
  widgetInstanceId: string,
  stateKey: string,
  value: T,
  prefix: string = 'widget'
): boolean {
  try {
    const key = createWidgetStorageKey(widgetInstanceId, stateKey, prefix);
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    logger.warn('Failed to save widget state', { widgetInstanceId, stateKey, error }, 'WidgetStateManager');
    return false;
  }
}

/**
 * Loads widget state from localStorage with error handling
 */
export function loadWidgetState<T>(
  widgetInstanceId: string,
  stateKey: string,
  defaultValue: T,
  prefix: string = 'widget'
): T {
  try {
    const key = createWidgetStorageKey(widgetInstanceId, stateKey, prefix);
    const saved = localStorage.getItem(key);
    if (saved !== null) {
      return JSON.parse(saved);
    }
  } catch (error) {
    logger.warn('Failed to load widget state', { widgetInstanceId, stateKey, error }, 'WidgetStateManager');
  }
  return defaultValue;
}

/**
 * Clears all localStorage data for a specific widget instance
 */
export function clearWidgetState(
  widgetInstanceId: string,
  prefix: string = 'widget'
): void {
  try {
    const keysToRemove: string[] = [];
    const searchPattern = `${prefix}-${widgetInstanceId}-`;
    
    // Find all keys for this widget
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(searchPattern)) {
        keysToRemove.push(key);
      }
    }
    
    // Remove all found keys
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    logger.info('Cleared widget state entries', { widgetInstanceId, count: keysToRemove.length }, 'WidgetStateManager');
  } catch (error) {
    logger.warn('Failed to clear widget state', { widgetInstanceId, error }, 'WidgetStateManager');
  }
}

/**
 * React hook for managing widget-specific state with localStorage persistence
 */
export function useWidgetState<T>(
  widgetInstanceId: string,
  stateKey: string,
  defaultValue: T,
  prefix: string = 'widget'
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [state, setState] = React.useState<T>(() => 
    loadWidgetState(widgetInstanceId, stateKey, defaultValue, prefix)
  );

  React.useEffect(() => {
    saveWidgetState(widgetInstanceId, stateKey, state, prefix);
  }, [widgetInstanceId, stateKey, state, prefix]);

  return [state, setState];
}

/**
 * Gets all localStorage keys for a specific widget
 */
export function getWidgetStateKeys(
  widgetInstanceId: string,
  prefix: string = 'widget'
): string[] {
  const keys: string[] = [];
  const searchPattern = `${prefix}-${widgetInstanceId}-`;
  
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(searchPattern)) {
        keys.push(key);
      }
    }
  } catch (error) {
    logger.warn('Failed to get widget state keys', { widgetInstanceId, error }, 'WidgetStateManager');
  }
  
  return keys;
}