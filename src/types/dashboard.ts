// Dashboard Types for Panel-Based Grid System
import { WidgetSettings } from './widget';

export interface GridPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Widget {
  id: string;
  widgetInstanceId: string;
  type: string;
  title: string;
  customName?: string;
  position: GridPosition;
  panelId: string;
  collapsed: boolean;
  isDraggable: boolean;
  isResizable: boolean;
  settings: WidgetSettings;
  minSize?: { width: number; height: number };
  maxSize?: { width: number; height: number };
}

export interface PanelConfig {
  id: string;
  name: string;
  direction: 'horizontal' | 'vertical';
  defaultSize: number;
  minSize: number;
  collapsible: boolean;
  collapsed: boolean;
}

export interface DashboardLayout {
  id: string;
  name: string;
  userId: string;
  panels: PanelConfig[];
  widgets: Widget[];
  gridCols: number;
  gridRows: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface DashboardState {
  currentLayout: DashboardLayout | null;
  layouts: DashboardLayout[];
  selectedWidget: string | null;
  history: DashboardSnapshot[];
  historyIndex: number;
  isLoading: boolean;
  error: string | null;
}

export interface DashboardSnapshot {
  layout: DashboardLayout;
  timestamp: Date;
  action: string;
}

export interface WidgetCatalogItem {
  id: string;
  name: string;
  description?: string;
  icon: string;
  category: string;
  componentName: string;
  defaultSettings: WidgetSettings;
  defaultSize: GridPosition;
  minSize: { width: number; height: number };
  maxSize?: { width: number; height: number };
}

export interface DragItem {
  id: string;
  type: 'widget' | 'catalog-item';
  data: Widget | WidgetCatalogItem;
}

export interface DropZone {
  panelId: string;
  position: GridPosition;
  isValid: boolean;
}

// Grid utilities
export interface GridBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export interface GridCell {
  x: number;
  y: number;
  occupied: boolean;
  widgetId?: string;
}