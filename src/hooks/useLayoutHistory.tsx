import { useState, useCallback } from 'react';
import { Layout } from 'react-grid-layout';
import { logger } from '@/lib/logger';

const MAX_HISTORY_SIZE = 10;

export function useLayoutHistory(storageKey: string) {
  const [history, setHistory] = useState<Layout[][]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);

  const saveLayout = useCallback((layout: Layout[]) => {
    // Save to localStorage
    try {
      localStorage.setItem(storageKey, JSON.stringify(layout));
    } catch (error) {
      logger.warn('Failed to save layout to localStorage', error, 'LayoutHistory');
    }

    // Update history
    setHistory(prev => {
      const newHistory = [...prev.slice(0, currentIndex + 1), layout];
      // Keep only the last MAX_HISTORY_SIZE entries
      if (newHistory.length > MAX_HISTORY_SIZE) {
        return newHistory.slice(-MAX_HISTORY_SIZE);
      }
      return newHistory;
    });
    
    setCurrentIndex(prev => {
      const newIndex = Math.min(prev + 1, MAX_HISTORY_SIZE - 1);
      return newIndex;
    });
  }, [storageKey, currentIndex]);

  const undo = useCallback(() => {
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex);
      const previousLayout = history[newIndex];
      
      // Save to localStorage
      try {
        localStorage.setItem(storageKey, JSON.stringify(previousLayout));
      } catch (error) {
        logger.warn('Failed to save layout to localStorage', error, 'LayoutHistory');
      }
      
      return previousLayout;
    }
    return null;
  }, [history, currentIndex, storageKey]);

  const canUndo = currentIndex > 0;
  const undoCount = currentIndex;

  return {
    saveLayout,
    undo,
    canUndo,
    undoCount
  };
}
