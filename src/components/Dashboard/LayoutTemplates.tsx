// Dashboard Layout Templates and Presets
import React from 'react';
import { Monitor, Grid, BarChart3, Settings, Gauge } from 'lucide-react';
import type { DashboardLayout, Widget } from '@/types/dashboard';

export interface LayoutTemplate {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  category: 'productivity' | 'monitoring' | 'media' | 'development';
  widgets: Omit<Widget, 'id' | 'widgetInstanceId'>[];
  gridCols: number;
  gridRows: string;
}

export const LAYOUT_TEMPLATES: LayoutTemplate[] = [
  {
    id: 'productivity-dashboard',
    name: 'Productivity Hub',
    description: 'Clock, calendar, weather, and system info for daily use',
    icon: <Grid className="w-5 h-5" />,
    category: 'productivity',
    widgets: [
      {
        type: 'ClockWidget',
        title: 'System Clock',
        position: { x: 0, y: 0, width: 3, height: 2 },
        panelId: 'main',
        collapsed: false,
        isDraggable: true,
        isResizable: true,
        settings: { format: '24h', showDate: true, showSeconds: true },
      },
      {
        type: 'WeatherWidget',
        title: 'Weather Status',
        position: { x: 3, y: 0, width: 4, height: 3 },
        panelId: 'main',
        collapsed: false,
        isDraggable: true,
        isResizable: true,
        settings: { showForecast: true, units: 'metric' },
      },
      {
        type: 'CalendarWidget',
        title: 'Schedule',
        position: { x: 7, y: 0, width: 5, height: 4 },
        panelId: 'main',
        collapsed: false,
        isDraggable: true,
        isResizable: true,
        settings: { view: 'month', showEvents: true },
      },
      {
        type: 'UserInfoWidget',
        title: 'User Profile',
        position: { x: 0, y: 2, width: 3, height: 2 },
        panelId: 'main',
        collapsed: false,
        isDraggable: true,
        isResizable: true,
        settings: { showStats: true, showAvatar: true },
      },
    ],
    gridCols: 12,
    gridRows: 'auto',
  },
  {
    id: 'monitoring-dashboard',
    name: 'System Monitor',
    description: 'Comprehensive system monitoring and analytics',
    icon: <Gauge className="w-5 h-5" />,
    category: 'monitoring',
    widgets: [
      {
        type: 'SystemSettingsWidget',
        title: 'System Status',
        position: { x: 0, y: 0, width: 6, height: 3 },
        panelId: 'main',
        collapsed: false,
        isDraggable: true,
        isResizable: true,
        settings: { showPerformance: true, showNetwork: true },
      },
      {
        type: 'MapWidget',
        title: 'Location Tracker',
        position: { x: 6, y: 0, width: 6, height: 4 },
        panelId: 'main',
        collapsed: false,
        isDraggable: true,
        isResizable: true,
        settings: { showCurrent: true, trackMovement: true },
      },
      {
        type: 'WeatherWidget',
        title: 'Environmental Data',
        position: { x: 0, y: 3, width: 4, height: 2 },
        panelId: 'main',
        collapsed: false,
        isDraggable: true,
        isResizable: true,
        settings: { showDetails: true, showRadar: true },
      },
    ],
    gridCols: 12,
    gridRows: 'auto',
  },
  {
    id: 'media-dashboard',
    name: 'Media Center',
    description: 'Audio, images, and multimedia content management',
    icon: <Monitor className="w-5 h-5" />,
    category: 'media',
    widgets: [
      {
        type: 'AudioPlayerWidget',
        title: 'Audio Player',
        position: { x: 0, y: 0, width: 8, height: 3 },
        panelId: 'main',
        collapsed: false,
        isDraggable: true,
        isResizable: true,
        settings: { showVisualizer: true, showPlaylist: true },
      },
      {
        type: 'ImageDisplayWidget',
        title: 'Gallery',
        position: { x: 8, y: 0, width: 4, height: 4 },
        panelId: 'main',
        collapsed: false,
        isDraggable: true,
        isResizable: true,
        settings: { slideshow: true, fullscreen: true },
      },
      {
        type: 'TextDisplayWidget',
        title: 'Media Info',
        position: { x: 0, y: 3, width: 4, height: 2 },
        panelId: 'main',
        collapsed: false,
        isDraggable: true,
        isResizable: true,
        settings: { scrolling: true, fontSize: 'medium' },
      },
    ],
    gridCols: 12,
    gridRows: 'auto',
  },
  {
    id: 'development-dashboard',
    name: 'Developer Console',
    description: 'Development tools and system administration',
    icon: <Settings className="w-5 h-5" />,
    category: 'development',
    widgets: [
      {
        type: 'BrowserWidget',
        title: 'Web Browser',
        position: { x: 0, y: 0, width: 8, height: 5 },
        panelId: 'main',
        collapsed: false,
        isDraggable: true,
        isResizable: true,
        settings: { devMode: true, showConsole: true },
      },
      {
        type: 'SystemSettingsWidget',
        title: 'System Control',
        position: { x: 8, y: 0, width: 4, height: 3 },
        panelId: 'main',
        collapsed: false,
        isDraggable: true,
        isResizable: true,
        settings: { advancedMode: true, showLogs: true },
      },
      {
        type: 'TextDisplayWidget',
        title: 'Debug Console',
        position: { x: 8, y: 3, width: 4, height: 2 },
        panelId: 'main',
        collapsed: false,
        isDraggable: true,
        isResizable: true,
        settings: { monospace: true, lineNumbers: true },
      },
    ],
    gridCols: 12,
    gridRows: 'auto',
  },
];

export const getTemplatesByCategory = (category?: string) => {
  if (!category) return LAYOUT_TEMPLATES;
  return LAYOUT_TEMPLATES.filter(template => template.category === category);
};

export const createLayoutFromTemplate = (
  template: LayoutTemplate,
  userId: string,
  customName?: string
): Omit<DashboardLayout, 'id' | 'createdAt' | 'updatedAt'> => {
  return {
    name: customName || template.name,
    userId,
    panels: [
      {
        id: 'sidebar-left',
        name: 'Widget Catalog',
        direction: 'horizontal',
        defaultSize: 20,
        minSize: 15,
        collapsible: true,
        collapsed: false,
      },
      {
        id: 'main',
        name: 'Dashboard',
        direction: 'horizontal',
        defaultSize: 60,
        minSize: 40,
        collapsible: false,
        collapsed: false,
      },
      {
        id: 'sidebar-right',
        name: 'Properties',
        direction: 'horizontal',
        defaultSize: 20,
        minSize: 15,
        collapsible: true,
        collapsed: false,
      },
    ],
    widgets: template.widgets.map(widget => ({
      ...widget,
      id: crypto.randomUUID(),
      widgetInstanceId: crypto.randomUUID(),
    })),
    gridCols: template.gridCols,
    gridRows: template.gridRows,
    isActive: false,
  };
};