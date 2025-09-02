// Independent Widget System - Complete Isolation Architecture
import { WidgetSettings } from './widget';

// React Grid Layout compatible position format
export interface GridPosition {
  x: number; // grid column position (0-based)
  y: number; // grid row position (0-based) 
  w: number; // width in grid units (1-12)
  h: number; // height in grid units
}

// Completely independent widget instance
export interface Widget {
  id: string; // unique crypto.randomUUID() for complete isolation
  type: string; // widget type (clock, weather, etc)
  title: string;
  customName?: string;
  position: GridPosition; // react-grid-layout format
  collapsed: boolean;
  isDraggable: boolean;
  isResizable: boolean;
  settings: WidgetSettings; // completely isolated per instance
  panelId: string; // which panel this widget belongs to
  minW?: number; // minimum width in grid units
  maxW?: number; // maximum width in grid units  
  minH?: number; // minimum height in grid units
  maxH?: number; // maximum height in grid units
  static?: boolean; // if true, widget cannot be moved or resized
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
  // Widget isolation - Map for O(1) lookups and true independence  
  widgets: Map<string, Widget>;
  
  // Layout management
  layouts: DashboardLayout[];
  activeLayoutId: string | null;
  
  // UI state
  selectedWidgetId: string | null;
  
  // History for undo/redo
  history: DashboardSnapshot[];
  historyIndex: number;
  
  // Loading and error states
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