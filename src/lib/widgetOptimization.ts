/**
 * Widget Performance Optimization Utilities
 * Centralizes common performance patterns for all widgets
 */

import React from 'react';
import { useCallback, useMemo, useRef, useEffect } from 'react';
import { debounce } from 'lodash';
import { logger } from './logger';

/**
 * Optimized state persistence hook with debouncing
 */
export function usePersistedState<T>(
  key: string,
  defaultValue: T,
  saveDelay = 300
): [T, (value: T | ((prev: T) => T)) => void] {
  const [state, setState] = React.useState<T>(() => {
    try {
      const saved = localStorage.getItem(key);
      return saved ? { ...defaultValue, ...JSON.parse(saved) } : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  const saveRef = useRef(
    debounce((value: T) => {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch (error) {
        logger.warn('Failed to persist state', { key, error }, 'usePersistedState');
      }
    }, saveDelay)
  );

  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    setState(prev => {
      const newValue = typeof value === 'function' ? (value as (prev: T) => T)(prev) : value;
      saveRef.current(newValue);
      return newValue;
    });
  }, []);

  // Cleanup debounced function on unmount
  useEffect(() => {
    return () => {
      saveRef.current.cancel();
    };
  }, []);

  return [state, setValue];
}

/**
 * Memoized computation with dependency tracking
 */
export function useOptimizedComputation<T>(
  computation: () => T,
  deps: React.DependencyList,
  debugName?: string
): T {
  return useMemo(() => {
    const startTime = performance.now();
    const result = computation();
    const endTime = performance.now();
    
    if (debugName && process.env.NODE_ENV === 'development' && endTime - startTime > 5) {
      logger.debug(`Computation "${debugName}" took ${(endTime - startTime).toFixed(2)}ms`, undefined, 'Performance');
    }
    
    return result;
  }, deps);
}

/**
 * Optimized event handler with automatic cleanup
 */
export function useEventHandler<T extends (...args: any[]) => any>(
  handler: T,
  deps: React.DependencyList
): T {
  return useCallback(handler, deps);
}

/**
 * Intersection Observer hook for lazy loading widgets
 */
export function useIntersectionObserver(
  callback: (isIntersecting: boolean) => void,
  options: IntersectionObserverInit = {}
) {
  const targetRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const target = targetRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      ([entry]) => callback(entry.isIntersecting),
      { threshold: 0.1, ...options }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [callback, options]);

  return targetRef;
}

/**
 * Optimized animation frame hook
 */
export function useAnimationFrame(callback: (deltaTime: number) => void, enabled = true) {
  const requestRef = useRef<number>();
  const previousTimeRef = useRef<number>();

  const animate = useCallback((time: number) => {
    if (previousTimeRef.current !== undefined) {
      const deltaTime = time - previousTimeRef.current;
      callback(deltaTime);
    }
    previousTimeRef.current = time;
    if (enabled) {
      requestRef.current = requestAnimationFrame(animate);
    }
  }, [callback, enabled]);

  useEffect(() => {
    if (enabled) {
      requestRef.current = requestAnimationFrame(animate);
    }
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [animate, enabled]);
}

/**
 * Memory usage tracker for development
 */
export function useMemoryTracker(componentName: string) {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && 'memory' in performance) {
      const memory = (performance as any).memory;
      logger.debug(`${componentName} memory usage`, {
        used: Math.round(memory.usedJSHeapSize / 1048576) + 'MB',
        total: Math.round(memory.totalJSHeapSize / 1048576) + 'MB'
      }, 'Memory');
    }
  });
}