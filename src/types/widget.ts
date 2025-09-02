// Base widget type definitions for standardized widget architecture

import { WidgetConfig } from '@/lib/WidgetFactory';
import { WidgetSettings } from '@/types/common';

export interface BaseWidgetProps {
  /** Unique identifier for this widget instance */
  widgetInstanceId: string;
  /** Widget type identifier */
  widgetType?: string;
  /** Widget display title */
  title?: string;
  /** Widget settings object with defaults merged */
  settings?: WidgetSettings;
  /** Default settings for the widget */
  defaultSettings?: WidgetSettings;
  /** Callback to handle settings changes */
  onSettingsChange?: (settings: WidgetSettings) => void;
  /** Optional custom name for the widget instance */
  widgetName?: string;
  /** Callback when widget collapse state changes */
  onCollapseChange?: (widgetId: string, collapsed: boolean) => void;
}

export interface BaseWidgetSettings {
  /** Custom title for the widget */
  title?: string;
  /** Whether to show the widget title */
  showTitle?: boolean;
  /** Theme variant for the widget */
  variant?: 'default' | 'minimal' | 'compact';
}

export interface WidgetControlConfig {
  /** Primary action controls (follow user, refresh, etc.) */
  primaryControls?: React.ReactNode;
  /** Secondary controls (settings, etc.) */
  secondaryControls?: React.ReactNode;
  /** Status display in header */
  statusDisplay?: React.ReactNode;
}

// Re-export WidgetConfig and related types from WidgetFactory
export type { WidgetConfig, WidgetDefinition, CreateWidgetOptions } from '@/lib/WidgetFactory';