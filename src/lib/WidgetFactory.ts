// Widget Factory pattern for standardized widget creation and configuration

export interface WidgetConfig {
  /** Unique instance identifier */
  instanceId: string;
  /** Widget type identifier from widget_definitions */
  widgetId: string;
  /** Display name for this widget instance */
  name: string;
  /** Widget category */
  category: string;
  /** Widget icon identifier */
  icon: string;
  /** Component name for rendering */
  componentName: string;
  /** Widget description */
  description?: string;
  /** Default settings merged with widget definition defaults */
  defaultSettings: Record<string, any>;
  /** Current instance settings */
  settings: Record<string, any>;
  /** Grid layout properties */
  layout: {
    w: number;
    h: number;
    minW?: number;
    minH?: number;
    maxW?: number;
    maxH?: number;
    static?: boolean;
  };
  /** Tab assignment */
  tabId: string;
  /** Position in tab */
  position: number;
  /** Creation timestamp */
  createdAt: Date;
}

export interface WidgetDefinition {
  id: string;
  name: string;
  category: string;
  icon: string;
  component_name: string;
  description?: string;
  default_settings: Record<string, any>;
}

export interface CreateWidgetOptions {
  widgetDefinition: WidgetDefinition;
  tabId: string;
  position?: number;
  customName?: string;
  overrideSettings?: Record<string, any>;
  layoutOverrides?: Partial<WidgetConfig['layout']>;
}

// Default layout configurations by widget type
const DEFAULT_WIDGET_LAYOUTS: Record<string, WidgetConfig['layout']> = {
  // Dashboard widgets
  'add-widget-widget': { w: 4, h: 6, minW: 3, minH: 4 },
  'dashboard-settings-widget': { w: 4, h: 6, minW: 3, minH: 4 },
  
  // Utility widgets
  'sample-clock': { w: 4, h: 4, minW: 3, minH: 3, maxW: 6, maxH: 6 },
  'sample-note': { w: 6, h: 8, minW: 4, minH: 6, maxW: 12, maxH: 16 },
  'sample-chart': { w: 8, h: 6, minW: 6, minH: 4, maxW: 12, maxH: 12 },
  
  // System widgets
  'base-widget': { w: 4, h: 6, minW: 3, minH: 4 },
  
  // Location widgets
  'MapWidget': { w: 8, h: 8, minW: 6, minH: 6, maxW: 12, maxH: 12 },
  
  // Default fallback
  default: { w: 4, h: 6, minW: 3, minH: 4 }
};

// Enhanced default settings by widget category
const CATEGORY_DEFAULT_ENHANCEMENTS: Record<string, Record<string, any>> = {
  Dashboard: {
    collapsible: true,
    showTitle: true,
    variant: 'default'
  },
  productivity: {
    autoSave: true,
    showTitle: true,
    variant: 'default'
  },
  monitoring: {
    autoRefresh: true,
    refreshInterval: 5000,
    showTitle: true,
    variant: 'default'
  },
  utilities: {
    showTitle: true,
    variant: 'minimal'
  },
  Location: {
    showTitle: true,
    showControls: true,
    variant: 'default'
  },
  System: {
    showTitle: true,
    variant: 'default'
  }
};

export class WidgetFactory {
  /**
   * Creates a new widget configuration with proper defaults and unique ID
   * @param options Widget creation options
   * @returns Complete widget configuration
   */
  static createWidget(options: CreateWidgetOptions): WidgetConfig {
    const {
      widgetDefinition,
      tabId,
      position = 0,
      customName,
      overrideSettings = {},
      layoutOverrides = {}
    } = options;

    // Generate unique instance ID
    const instanceId = crypto.randomUUID();

    // Get default layout for this widget type
    const defaultLayout = DEFAULT_WIDGET_LAYOUTS[widgetDefinition.id] || DEFAULT_WIDGET_LAYOUTS.default;
    const layout = { ...defaultLayout, ...layoutOverrides };

    // Merge default settings with category enhancements and overrides
    const categoryDefaults = CATEGORY_DEFAULT_ENHANCEMENTS[widgetDefinition.category] || {};
    const mergedDefaultSettings = {
      ...categoryDefaults,
      ...widgetDefinition.default_settings,
    };

    const settings = {
      ...mergedDefaultSettings,
      ...overrideSettings,
    };

    return {
      instanceId,
      widgetId: widgetDefinition.id,
      name: customName || widgetDefinition.name,
      category: widgetDefinition.category,
      icon: widgetDefinition.icon,
      componentName: widgetDefinition.component_name,
      description: widgetDefinition.description,
      defaultSettings: mergedDefaultSettings,
      settings,
      layout,
      tabId,
      position,
      createdAt: new Date(),
    };
  }

  /**
   * Creates multiple widget instances with proper positioning
   * @param widgets Array of widget creation options
   * @returns Array of widget configurations
   */
  static createWidgets(widgets: CreateWidgetOptions[]): WidgetConfig[] {
    return widgets.map((options, index) => {
      return this.createWidget({
        ...options,
        position: options.position ?? index,
      });
    });
  }

  /**
   * Validates widget configuration
   * @param config Widget configuration to validate
   * @returns Validation result
   */
  static validateWidgetConfig(config: WidgetConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!config.instanceId) {
      errors.push('Widget instance ID is required');
    }

    if (!config.widgetId) {
      errors.push('Widget ID is required');
    }

    if (!config.name) {
      errors.push('Widget name is required');
    }

    if (!config.componentName) {
      errors.push('Component name is required');
    }

    if (!config.tabId) {
      errors.push('Tab ID is required');
    }

    if (config.layout.w < 1 || config.layout.h < 1) {
      errors.push('Widget layout dimensions must be positive');
    }

    if (config.layout.minW && config.layout.w < config.layout.minW) {
      errors.push('Widget width is below minimum');
    }

    if (config.layout.minH && config.layout.h < config.layout.minH) {
      errors.push('Widget height is below minimum');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Creates a widget instance from a database widget definition
   * @param widgetDefinition Widget definition from database
   * @param tabId Target tab ID
   * @param options Additional creation options
   * @returns Widget configuration
   */
  static fromWidgetDefinition(
    widgetDefinition: WidgetDefinition,
    tabId: string,
    options: Partial<CreateWidgetOptions> = {}
  ): WidgetConfig {
    return this.createWidget({
      widgetDefinition,
      tabId,
      ...options,
    });
  }

  /**
   * Clones an existing widget configuration with new instance ID
   * @param sourceConfig Source widget configuration
   * @param newTabId Optional new tab ID (uses source tab if not provided)
   * @param overrides Optional property overrides
   * @returns New widget configuration
   */
  static cloneWidget(
    sourceConfig: WidgetConfig,
    newTabId?: string,
    overrides: Partial<WidgetConfig> = {}
  ): WidgetConfig {
    return {
      ...sourceConfig,
      instanceId: crypto.randomUUID(),
      tabId: newTabId || sourceConfig.tabId,
      createdAt: new Date(),
      ...overrides,
    };
  }

  /**
   * Gets default layout for a widget type
   * @param widgetId Widget type identifier
   * @returns Default layout configuration
   */
  static getDefaultLayout(widgetId: string): WidgetConfig['layout'] {
    return { ...DEFAULT_WIDGET_LAYOUTS[widgetId] || DEFAULT_WIDGET_LAYOUTS.default };
  }

  /**
   * Gets enhanced default settings for a widget category
   * @param category Widget category
   * @returns Enhanced default settings
   */
  static getCategoryDefaults(category: string): Record<string, any> {
    return { ...CATEGORY_DEFAULT_ENHANCEMENTS[category] || {} };
  }
}