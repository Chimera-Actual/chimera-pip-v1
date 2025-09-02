import { useState, useCallback, useEffect } from 'react';
import { GridItem } from '@/components/dashboard/DashboardGrid';
import { LucideIcon, Monitor } from 'lucide-react';
import { type Layout } from "react-grid-layout";
import { logger } from '@/lib/logger';

export interface DashboardTab {
  id: string;
  name: string;
  icon: string; // Store as string identifier instead of component
  widgets: GridItem[];
  layout?: Layout[];
  createdAt: number;
}

const STORAGE_KEY = 'dashboard:tabs';
const ACTIVE_TAB_KEY = 'dashboard:activeTab';

export function useDashboardTabs() {
  const [tabs, setTabs] = useState<DashboardTab[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsedTabs = JSON.parse(saved);
        // Ensure we have at least one tab
        return parsedTabs.length > 0 ? parsedTabs : getDefaultTabs();
      }
    } catch (error) {
      logger.warn('Failed to load saved tabs', error, 'DashboardTabs');
    }
    return getDefaultTabs();
  });

  const [activeTabId, setActiveTabId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(ACTIVE_TAB_KEY);
      if (saved && tabs.some(tab => tab.id === saved)) {
        return saved;
      }
    } catch (error) {
      logger.warn('Failed to load active tab', error, 'DashboardTabs');
    }
    return tabs[0]?.id || '';
  });

  // Save tabs to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tabs));
    } catch (error) {
      logger.warn('Failed to save tabs', error, 'DashboardTabs');
    }
  }, [tabs]);

  // Save active tab to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(ACTIVE_TAB_KEY, activeTabId);
    } catch (error) {
      logger.warn('Failed to save active tab', error, 'DashboardTabs');
    }
  }, [activeTabId]);

  const createTab = useCallback((name: string, iconName: string) => {
    const newTab: DashboardTab = {
      id: `tab-${Date.now()}`,
      name,
      icon: iconName,
      widgets: [],
      layout: [],
      createdAt: Date.now()
    };
    
    setTabs(prev => [...prev, newTab]);
    setActiveTabId(newTab.id);
    return newTab;
  }, []);

  const deleteTab = useCallback((tabId: string) => {
    setTabs(prev => {
      const filteredTabs = prev.filter(tab => tab.id !== tabId);
      // Ensure we always have at least one tab
      if (filteredTabs.length === 0) {
        return getDefaultTabs();
      }
      return filteredTabs;
    });
    
    // If we deleted the active tab, switch to the first available
    setActiveTabId(prev => {
      if (prev === tabId) {
        const remainingTabs = tabs.filter(tab => tab.id !== tabId);
        return remainingTabs[0]?.id || getDefaultTabs()[0].id;
      }
      return prev;
    });
  }, [tabs]);

  const updateTab = useCallback((tabId: string, updates: Partial<DashboardTab>) => {
    setTabs(prev => prev.map(tab => 
      tab.id === tabId ? { ...tab, ...updates } : tab
    ));
  }, []);

  const reorderTabs = useCallback((sourceIndex: number, destinationIndex: number) => {
    setTabs(prev => {
      const newTabs = [...prev];
      const [removed] = newTabs.splice(sourceIndex, 1);
      newTabs.splice(destinationIndex, 0, removed);
      return newTabs;
    });
  }, []);

  const addWidgetToTab = useCallback((tabId: string, widget: GridItem) => {
    setTabs(prev => prev.map(tab => 
      tab.id === tabId 
        ? { ...tab, widgets: [...tab.widgets, widget] }
        : tab
    ));
  }, []);

  const removeWidgetFromTab = useCallback((tabId: string, widgetId: string) => {
    setTabs(prev => prev.map(tab => 
      tab.id === tabId 
        ? { ...tab, widgets: tab.widgets.filter(w => w.id !== widgetId) }
        : tab
    ));
  }, []);

  const updateTabLayout = useCallback((tabId: string, layout: Layout[]) => {
    setTabs(prev => prev.map(tab => 
      tab.id === tabId ? { ...tab, layout } : tab
    ));
  }, []);

  const activeTab = tabs.find(tab => tab.id === activeTabId) || tabs[0];

  return {
    tabs,
    activeTab,
    activeTabId,
    setActiveTabId,
    createTab,
    deleteTab,
    updateTab,
    reorderTabs,
    addWidgetToTab,
    removeWidgetFromTab,
    updateTabLayout
  };
}

function getDefaultTabs(): DashboardTab[] {
  return [
    {
      id: 'default-tab',
      name: 'Main Dashboard',
      icon: 'Monitor',
      widgets: [
        { id: "clock-1", widgetType: "SampleClock", w: 4, h: 4, minW: 3, minH: 3 },
        { id: "note-1", widgetType: "SampleNote", w: 5, h: 6, minW: 4, minH: 4 },
        { id: "chart-1", widgetType: "SampleChart", w: 6, h: 6, minW: 4, minH: 4 },
      ],
      layout: [],
      createdAt: Date.now()
    }
  ];
}