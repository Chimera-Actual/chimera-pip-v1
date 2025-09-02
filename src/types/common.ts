// Common type definitions to replace 'any' usage

export interface WidgetSettings {
  // Base widget settings
  title?: string;
  showTitle?: boolean;
  variant?: 'default' | 'minimal' | 'compact';
  autoSave?: boolean;
  refreshRate?: number;
  autoRefresh?: boolean;
  
  // Display settings - Updated to match actual usage
  theme?: 'default' | 'accent' | 'muted' | 'dark' | 'light' | 'green' | 'amber' | 'blue';
  fontSize?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | 'small' | 'medium' | 'large';
  opacity?: number;
  showBorder?: boolean;
  
  // Clock specific
  showSeconds?: boolean;
  show24Hour?: boolean;
  format24h?: boolean;
  showDate?: boolean;
  
  // Note specific
  saveDelay?: number;
  wordWrap?: boolean;
  showWordCount?: boolean;
  
  // Chart specific
  maxDataPoints?: number;
  dataPoints?: number;
  showGrid?: boolean;
  animated?: boolean;
  animateChart?: boolean;
  showStats?: boolean;
  
  // Map specific
  showControls?: boolean;
  zoomLevel?: number;
  mapStyle?: string;
  
  // Audio specific
  volume?: number;
  showWaveform?: boolean;
  
  // Widget metadata
  name?: string;
  
  // Allow additional custom settings
  [key: string]: unknown;
}

export interface DatabaseError {
  message: string;
  code?: string;
  details?: string;
}

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: DatabaseError;
}

export interface AnalyticsEvent {
  event: string;
  properties?: Record<string, string | number | boolean>;
  timestamp?: number;
}

export interface FileUploadResult {
  path: string;
  size: number;
  type: string;
  url?: string;
}

export interface GeocodeResult {
  display_name: string;
  lat: string;
  lon: string;
  place_id: string;
  osm_type: string;
  osm_id: string;
}

export interface MapSearchResult {
  id: string;
  display_name: string;
  lat: number;
  lon: number;
  importance: number;
}

export interface AudioTrack {
  id: string;
  title: string;
  path: string;
  duration?: number;
  artist?: string;
  album?: string;
}

export interface SecurityValidationResult {
  isValid: boolean;
  errors: string[];
  sanitized?: string;
}

export interface PerformanceMetrics {
  memory?: number;
  connection?: {
    effectiveType: string;
    downlink: number;
  };
  deviceType: 'mobile' | 'tablet' | 'desktop';
  isLowPowerMode: boolean;
}

// Form validation types
export interface FormValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  validator?: (value: string) => boolean;
  message: string;
}

export interface FormValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
  values: Record<string, unknown>;
}