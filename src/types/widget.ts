// Comprehensive Widget Type Definitions
export interface WidgetSettings {
  [key: string]: string | number | boolean | string[] | null | undefined;
}

export interface WidgetDefinition {
  id: string;
  name: string;
  description?: string;
  icon: string;
  category: string;
  component_name: string;
  default_settings?: WidgetSettings;
  user_tags?: string[];
}

export interface UserWidgetInstance {
  id: string;
  user_id: string;
  widget_id: string;
  tab_id: string;
  position: number;
  is_active: boolean;
  custom_name?: string;
  widget_definition?: WidgetDefinition;
}

export interface UserWidgetSettings {
  id: string;
  user_id: string;
  widget_instance_id: string;
  settings: WidgetSettings;
}

export interface UserWidgetTag {
  id: string;
  user_id: string;
  widget_definition_id: string;
  tag: string;
}

export interface WidgetComponentProps {
  settings: WidgetSettings;
  widgetName: string;
  widgetInstanceId: string;
  onSettingsUpdate: (newSettings: WidgetSettings) => void;
}

// API Response Types
export interface SupabaseResponse<T> {
  data: T | null;
  error: Error | null;
}

export interface DatabaseError extends Error {
  code?: string;
  details?: string;
  hint?: string;
}

// Query States
export interface QueryState<T> {
  data: T | null;
  loading: boolean;
  error: DatabaseError | null;
}

// Widget Manager Types
export interface WidgetManagerState {
  availableWidgets: WidgetDefinition[];
  userWidgetInstances: UserWidgetInstance[];
  userWidgetSettings: UserWidgetSettings[];
  userWidgetTags: UserWidgetTag[];
  loading: boolean;
}