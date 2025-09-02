// Widget Factory utilities and helper functions
import { WidgetConfig, WidgetDefinition } from './WidgetFactory';

export interface WidgetBulkCreateOptions {
  widgets: Array<{
    widgetId: string;
    customName?: string;
    overrideSettings?: Record<string, any>;
    layoutOverrides?: Partial<WidgetConfig['layout']>;
  }>;
  tabId: string;
  startPosition?: number;
  spacing?: number;
}

export interface WidgetCloneOptions {
  sourceInstanceId: string;
  targetTabId: string;
  preserveSettings?: boolean;
  customName?: string;
  layoutOffset?: { x: number; y: number };
}

export interface DashboardTemplate {
  name: string;
  description: string;
  widgets: Array<{
    widgetId: string;
    position: { x: number; y: number };
    layout: { w: number; h: number };
    settings?: Record<string, any>;
    customName?: string;
  }>;
}

/**
 * Widget Factory utility functions for advanced widget management
 */
export class WidgetFactoryUtils {
  /**
   * Creates multiple widgets in bulk with optimal positioning
   * @param options Bulk creation options
   * @param availableWidgets Available widget definitions
   * @returns Array of widget configurations
   */
  static createWidgetsBulk(
    options: WidgetBulkCreateOptions,
    availableWidgets: WidgetDefinition[]
  ): WidgetConfig[] {
    const { widgets, tabId, startPosition = 0, spacing = 1 } = options;
    const results: WidgetConfig[] = [];

    widgets.forEach((widgetOptions, index) => {
      const widgetDefinition = availableWidgets.find(w => w.id === widgetOptions.widgetId);
      if (!widgetDefinition) {
        console.warn(`Widget definition not found for ID: ${widgetOptions.widgetId}`);
        return;
      }

      const widgetConfig: WidgetConfig = {
        instanceId: crypto.randomUUID(),
        widgetId: widgetDefinition.id,
        name: widgetOptions.customName || widgetDefinition.name,
        category: widgetDefinition.category,
        icon: widgetDefinition.icon,
        componentName: widgetDefinition.component_name,
        description: widgetDefinition.description,
        defaultSettings: widgetDefinition.default_settings,
        settings: {
          ...widgetDefinition.default_settings,
          ...widgetOptions.overrideSettings,
        },
        layout: {
          w: 4,
          h: 6,
          minW: 3,
          minH: 4,
          ...widgetOptions.layoutOverrides,
        },
        tabId,
        position: startPosition + (index * spacing),
        createdAt: new Date(),
      };

      results.push(widgetConfig);
    });

    return results;
  }

  /**
   * Creates a widget template from an existing configuration
   * @param config Source widget configuration
   * @returns Widget template
   */
  static createTemplate(config: WidgetConfig): DashboardTemplate['widgets'][0] {
    return {
      widgetId: config.widgetId,
      position: { x: 0, y: 0 }, // Templates use relative positioning
      layout: { w: config.layout.w, h: config.layout.h },
      settings: config.settings,
      customName: config.name,
    };
  }

  /**
   * Creates widget configurations from a dashboard template
   * @param template Dashboard template
   * @param tabId Target tab ID
   * @param availableWidgets Available widget definitions
   * @returns Array of widget configurations
   */
  static fromTemplate(
    template: DashboardTemplate,
    tabId: string,
    availableWidgets: WidgetDefinition[]
  ): WidgetConfig[] {
    return template.widgets.map((widgetTemplate, index) => {
      const widgetDefinition = availableWidgets.find(w => w.id === widgetTemplate.widgetId);
      if (!widgetDefinition) {
        throw new Error(`Widget definition not found for template widget: ${widgetTemplate.widgetId}`);
      }

      return {
        instanceId: crypto.randomUUID(),
        widgetId: widgetDefinition.id,
        name: widgetTemplate.customName || widgetDefinition.name,
        category: widgetDefinition.category,
        icon: widgetDefinition.icon,
        componentName: widgetDefinition.component_name,
        description: widgetDefinition.description,
        defaultSettings: widgetDefinition.default_settings,
        settings: {
          ...widgetDefinition.default_settings,
          ...widgetTemplate.settings,
        },
        layout: {
          w: widgetTemplate.layout.w,
          h: widgetTemplate.layout.h,
          minW: 3,
          minH: 4,
        },
        tabId,
        position: index,
        createdAt: new Date(),
      };
    });
  }

  /**
   * Optimizes widget layout to prevent overlaps
   * @param widgets Array of widget configurations
   * @param gridCols Number of grid columns (default: 12)
   * @returns Optimized widget configurations
   */
  static optimizeLayout(widgets: WidgetConfig[], gridCols: number = 12): WidgetConfig[] {
    const optimized = [...widgets];
    const occupiedPositions = new Set<string>();

    optimized.forEach((widget, index) => {
      let x = (index % Math.floor(gridCols / widget.layout.w)) * widget.layout.w;
      let y = Math.floor(index / Math.floor(gridCols / widget.layout.w)) * widget.layout.h;

      // Find first available position
      while (this.isPositionOccupied(x, y, widget.layout.w, widget.layout.h, occupiedPositions)) {
        x += widget.layout.w;
        if (x + widget.layout.w > gridCols) {
          x = 0;
          y += widget.layout.h;
        }
      }

      // Mark position as occupied
      this.markPositionOccupied(x, y, widget.layout.w, widget.layout.h, occupiedPositions);

      // Update widget layout (assuming layout has x, y properties for positioning)
      if ('x' in widget.layout) {
        (widget.layout as any).x = x;
      }
      if ('y' in widget.layout) {
        (widget.layout as any).y = y;
      }
    });

    return optimized;
  }

  /**
   * Finds conflicts between widget configurations
   * @param widgets Array of widget configurations
   * @returns Array of conflict descriptions
   */
  static findConflicts(widgets: WidgetConfig[]): string[] {
    const conflicts: string[] = [];
    const instanceIds = new Set<string>();
    const positions = new Map<string, string[]>();

    widgets.forEach(widget => {
      // Check for duplicate instance IDs
      if (instanceIds.has(widget.instanceId)) {
        conflicts.push(`Duplicate instance ID: ${widget.instanceId}`);
      }
      instanceIds.add(widget.instanceId);

      // Check for position conflicts within same tab
      const positionKey = `${widget.tabId}-${widget.position}`;
      if (!positions.has(positionKey)) {
        positions.set(positionKey, []);
      }
      positions.get(positionKey)!.push(widget.instanceId);
    });

    // Report position conflicts
    positions.forEach((widgetIds, positionKey) => {
      if (widgetIds.length > 1) {
        conflicts.push(`Position conflict at ${positionKey}: ${widgetIds.join(', ')}`);
      }
    });

    return conflicts;
  }

  /**
   * Groups widgets by category
   * @param widgets Array of widget configurations
   * @returns Map of category to widgets
   */
  static groupByCategory(widgets: WidgetConfig[]): Map<string, WidgetConfig[]> {
    const groups = new Map<string, WidgetConfig[]>();

    widgets.forEach(widget => {
      if (!groups.has(widget.category)) {
        groups.set(widget.category, []);
      }
      groups.get(widget.category)!.push(widget);
    });

    return groups;
  }

  /**
   * Filters widgets by criteria
   * @param widgets Array of widget configurations
   * @param criteria Filter criteria
   * @returns Filtered widget configurations
   */
  static filterWidgets(
    widgets: WidgetConfig[],
    criteria: {
      category?: string;
      tabId?: string;
      minWidth?: number;
      minHeight?: number;
      hasSettings?: boolean;
    }
  ): WidgetConfig[] {
    return widgets.filter(widget => {
      if (criteria.category && widget.category !== criteria.category) return false;
      if (criteria.tabId && widget.tabId !== criteria.tabId) return false;
      if (criteria.minWidth && widget.layout.w < criteria.minWidth) return false;
      if (criteria.minHeight && widget.layout.h < criteria.minHeight) return false;
      if (criteria.hasSettings !== undefined) {
        const hasSettings = Object.keys(widget.settings).length > 0;
        if (criteria.hasSettings !== hasSettings) return false;
      }
      return true;
    });
  }

  /**
   * Generates unique widget name if conflicts exist
   * @param baseName Base name for the widget
   * @param existingNames Array of existing widget names
   * @returns Unique widget name
   */
  static generateUniqueName(baseName: string, existingNames: string[]): string {
    if (!existingNames.includes(baseName)) {
      return baseName;
    }

    let counter = 1;
    let uniqueName = `${baseName} (${counter})`;

    while (existingNames.includes(uniqueName)) {
      counter++;
      uniqueName = `${baseName} (${counter})`;
    }

    return uniqueName;
  }

  /**
   * Calculates total grid area used by widgets
   * @param widgets Array of widget configurations
   * @returns Total grid units used
   */
  static calculateGridUsage(widgets: WidgetConfig[]): number {
    return widgets.reduce((total, widget) => total + (widget.layout.w * widget.layout.h), 0);
  }

  /**
   * Helper method to check if a position is occupied
   * @private
   */
  private static isPositionOccupied(
    x: number,
    y: number,
    w: number,
    h: number,
    occupiedPositions: Set<string>
  ): boolean {
    for (let dx = 0; dx < w; dx++) {
      for (let dy = 0; dy < h; dy++) {
        if (occupiedPositions.has(`${x + dx},${y + dy}`)) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Helper method to mark a position as occupied
   * @private
   */
  private static markPositionOccupied(
    x: number,
    y: number,
    w: number,
    h: number,
    occupiedPositions: Set<string>
  ): void {
    for (let dx = 0; dx < w; dx++) {
      for (let dy = 0; dy < h; dy++) {
        occupiedPositions.add(`${x + dx},${y + dy}`);
      }
    }
  }
}

// Predefined dashboard templates
export const DASHBOARD_TEMPLATES: Record<string, DashboardTemplate> = {
  productivity: {
    name: 'Productivity Dashboard',
    description: 'Essential widgets for productivity and task management',
    widgets: [
      {
        widgetId: 'sample-note',
        position: { x: 0, y: 0 },
        layout: { w: 6, h: 8 },
        customName: 'Quick Notes'
      },
      {
        widgetId: 'sample-clock',
        position: { x: 6, y: 0 },
        layout: { w: 3, h: 4 },
        customName: 'System Time'
      },
      {
        widgetId: 'sample-chart',
        position: { x: 9, y: 0 },
        layout: { w: 3, h: 4 },
        customName: 'System Monitor'
      }
    ]
  },
  monitoring: {
    name: 'System Monitoring',
    description: 'System performance and monitoring widgets',
    widgets: [
      {
        widgetId: 'sample-chart',
        position: { x: 0, y: 0 },
        layout: { w: 8, h: 6 },
        customName: 'Performance Monitor'
      },
      {
        widgetId: 'sample-clock',
        position: { x: 8, y: 0 },
        layout: { w: 4, h: 3 },
        customName: 'System Clock'
      }
    ]
  }
};