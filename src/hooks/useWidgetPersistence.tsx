import { useEffect, useState } from 'react';

/**
 * Custom hook for widget-specific localStorage persistence
 * Provides a consistent interface for saving and loading widget state
 */
export function useWidgetPersistence<T>(
  widgetInstanceId: string,
  stateKey: string,
  defaultValue: T,
  options?: {
    debounceMs?: number;
    serialize?: (value: T) => string;
    deserialize?: (value: string) => T;
  }
) {
  const {
    debounceMs = 0,
    serialize = JSON.stringify,
    deserialize = JSON.parse
  } = options || {};
  
  const getStorageKey = () => `widget-${widgetInstanceId}-${stateKey}`;
  
  // Load initial value from localStorage
  const [value, setValue] = useState<T>(() => {
    if (!widgetInstanceId) return defaultValue;
    
    try {
      const saved = localStorage.getItem(getStorageKey());
      return saved ? deserialize(saved) : defaultValue;
    } catch (error) {
      console.warn(`Failed to load ${stateKey} for widget ${widgetInstanceId}:`, error);
      return defaultValue;
    }
  });
  
  // Save to localStorage when value changes (with optional debouncing)
  useEffect(() => {
    if (!widgetInstanceId) return;
    
    const saveValue = () => {
      try {
        localStorage.setItem(getStorageKey(), serialize(value));
      } catch (error) {
        console.warn(`Failed to save ${stateKey} for widget ${widgetInstanceId}:`, error);
      }
    };
    
    if (debounceMs > 0) {
      const timeoutId = setTimeout(saveValue, debounceMs);
      return () => clearTimeout(timeoutId);
    } else {
      saveValue();
    }
  }, [value, widgetInstanceId, stateKey, serialize, debounceMs]);
  
  return [value, setValue] as const;
}

/**
 * Hook for persisting widget collapse state
 */
export function useWidgetCollapse(widgetInstanceId: string, defaultCollapsed = false) {
  return useWidgetPersistence(widgetInstanceId, 'collapsed', defaultCollapsed);
}

/**
 * Hook for persisting widget settings
 */
export function useWidgetSettings<T extends Record<string, any>>(
  widgetInstanceId: string, 
  defaultSettings: T
) {
  return useWidgetPersistence(widgetInstanceId, 'settings', defaultSettings, {
    debounceMs: 300 // Debounce settings saves
  });
}

/**
 * Hook for persisting complex widget state
 */
export function useWidgetState<T>(
  widgetInstanceId: string,
  stateKey: string,
  defaultValue: T,
  debounceMs = 0
) {
  return useWidgetPersistence(widgetInstanceId, stateKey, defaultValue, {
    debounceMs
  });
}

/**
 * Utility function to clear all localStorage data for a widget
 */
export function clearWidgetPersistence(widgetInstanceId: string) {
  if (!widgetInstanceId) return;
  
  const keys: string[] = [];
  const prefix = `widget-${widgetInstanceId}-`;
  
  // Find all keys for this widget
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(prefix)) {
      keys.push(key);
    }
  }
  
  // Remove all found keys
  keys.forEach(key => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn(`Failed to remove localStorage key ${key}:`, error);
    }
  });
  
  console.log(`Cleared ${keys.length} localStorage entries for widget ${widgetInstanceId}`);
}