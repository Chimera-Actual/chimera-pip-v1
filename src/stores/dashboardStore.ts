// Independent Widget System Store - Complete Isolation Architecture
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { 
  DashboardState, 
  DashboardLayout, 
  Widget, 
  PanelConfig,
  DashboardSnapshot,
  GridPosition 
} from '@/types/dashboard';
import type { WidgetSettings } from '@/types/widget';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Layout } from 'react-grid-layout';

interface DashboardActions {
  // Widget Management - Complete Independence
  addWidget: (widgetType: string, panelId?: string, position?: Partial<GridPosition>) => string; // returns widget ID
  removeWidget: (widgetId: string) => void;
  updateWidget: (widgetId: string, updates: Partial<Widget>) => void;
  updateWidgetSettings: (widgetId: string, settings: WidgetSettings) => void;
  updateWidgetPosition: (widgetId: string, position: GridPosition, panelId?: string) => void;
  moveWidget: (widgetId: string, position: GridPosition, panelId?: string) => void;
  resizeWidget: (widgetId: string, size: { w: number; h: number }) => void;
  toggleWidgetCollapse: (widgetId: string) => void;
  duplicateWidget: (widgetId: string) => string; // returns new widget ID

  // Layout Management  
  loadLayouts: () => Promise<void>;
  createLayout: (name: string) => Promise<void>;
  updateLayout: (layoutId: string, updates: Partial<DashboardLayout>) => Promise<void>;
  deleteLayout: (layoutId: string) => Promise<void>;
  setActiveLayout: (layoutId: string) => void;
  saveCurrentLayout: () => Promise<void>;

  // Grid Layout Integration
  updateGridLayout: (panelId: string, layout: Layout[]) => void;
  getWidgetsByPanel: (panelId: string) => Widget[];
  getGridLayout: (panelId: string) => Layout[];
  
  // Enhanced layout functions
  autoArrangeWidgets: (panelId: string) => void;
  setGridDensity: (density: 'compact' | 'comfortable' | 'spacious') => void;

  // Selection and UI
  setSelectedWidget: (widgetId: string | null) => void;

  // History Management
  createSnapshot: (action: string) => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;

  // Panel Configuration
  updatePanelConfig: (panelId: string, config: Partial<PanelConfig>) => void;

  // Utility
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
  clearAllWidgets: () => void;
  getWidget: (widgetId: string) => Widget | undefined;

  // Legacy compatibility
  selectedWidget?: string | null;
  currentLayout?: DashboardLayout | null;
}

type DashboardStore = DashboardState & DashboardActions;

// Default panels configuration
const defaultPanels: PanelConfig[] = [
  {
    id: 'sidebar',
    name: 'Widget Library',
    direction: 'vertical',
    defaultSize: 20,
    minSize: 15,
    collapsible: true,
    collapsed: false,
  },
  {
    id: 'main',
    name: 'Dashboard',
    direction: 'vertical',
    defaultSize: 60,
    minSize: 40,
    collapsible: false,
    collapsed: false,
  },
  {
    id: 'properties',
    name: 'Widget Properties',
    direction: 'vertical',
    defaultSize: 20,
    minSize: 15,
    collapsible: true,
    collapsed: false,
  },
];

const HISTORY_LIMIT = 50;
const AUTO_SAVE_DELAY = 30000; // 30 seconds

// Widget type registry for default settings
const WIDGET_DEFAULTS: Record<string, Partial<Widget>> = {
  clock: {
    title: 'Clock',
    position: { x: 0, y: 0, w: 2, h: 1 },
    minW: 1,
    maxW: 4,
    minH: 1,
    maxH: 2,
    settings: { format: '12h', showSeconds: true, showDate: true },
  },
  weather: {
    title: 'Weather',
    position: { x: 0, y: 0, w: 3, h: 2 },
    minW: 2,
    maxW: 6,
    minH: 2,
    maxH: 4,
    settings: { units: 'metric', showForecast: true },
  },
  map: {
    title: 'Map',
    position: { x: 0, y: 0, w: 4, h: 3 },
    minW: 3,
    maxW: 8,
    minH: 2,
    maxH: 6,
    settings: { zoom: 10, mapType: 'street' },
  },
  calendar: {
    title: 'Calendar',
    position: { x: 0, y: 0, w: 3, h: 3 },
    minW: 2,
    maxW: 6,
    minH: 2,
    maxH: 6,
    settings: { view: 'month', showEvents: true },
  },
};

let autoSaveTimeout: NodeJS.Timeout | null = null;

export const useDashboardStore = create<DashboardStore>()(
  subscribeWithSelector(
    immer((set, get) => ({
      // State
      widgets: new Map<string, Widget>(),
  layouts: [],
  activeLayoutId: null,
  selectedWidgetId: null,
  gridDensity: 'comfortable',
      history: [],
      historyIndex: -1,
      isLoading: false,
      error: null,

      // Legacy compatibility properties
      selectedWidget: null,
      currentLayout: null,

      // Widget Management Actions
      addWidget: (widgetType: string, panelId = 'main', position?: Partial<GridPosition>) => {
        const widgetId = crypto.randomUUID();
        const defaults = WIDGET_DEFAULTS[widgetType] || {};
        
        set((state) => {
          // Find next available position if not specified
          const finalPosition: GridPosition = {
            x: position?.x ?? defaults.position?.x ?? 0,
            y: position?.y ?? defaults.position?.y ?? 0,
            w: position?.w ?? defaults.position?.w ?? 2,
            h: position?.h ?? defaults.position?.h ?? 1,
          };

          const newWidget: Widget = {
            id: widgetId,
            type: widgetType,
            title: defaults.title || widgetType,
            position: finalPosition,
            panelId,
            collapsed: false,
            isDraggable: true,
            isResizable: true,
            settings: defaults.settings || {},
            minW: defaults.minW,
            maxW: defaults.maxW,
            minH: defaults.minH,
            maxH: defaults.maxH,
            ...defaults,
          };

          state.widgets.set(widgetId, newWidget);
          state.createSnapshot(`Added ${widgetType} widget`);
        });

        return widgetId;
      },

      removeWidget: (widgetId: string) => set((state) => {
        if (state.widgets.has(widgetId)) {
          state.widgets.delete(widgetId);
          if (state.selectedWidgetId === widgetId) {
            state.selectedWidgetId = null;
            state.selectedWidget = null;
          }
          state.createSnapshot(`Removed widget`);
        }
      }),

      updateWidget: (widgetId: string, updates: Partial<Widget>) => set((state) => {
        const widget = state.widgets.get(widgetId);
        if (widget) {
          state.widgets.set(widgetId, { ...widget, ...updates });
        }
      }),

      updateWidgetSettings: (widgetId: string, settings: WidgetSettings) => set((state) => {
        const widget = state.widgets.get(widgetId);
        if (widget) {
          state.widgets.set(widgetId, { ...widget, settings });
        }
      }),

      updateWidgetPosition: (widgetId: string, position: GridPosition, panelId?: string) => set((state) => {
        const widget = state.widgets.get(widgetId);
        if (widget) {
          state.widgets.set(widgetId, {
            ...widget,
            position,
            panelId: panelId || widget.panelId,
          });
        }
      }),

      moveWidget: (widgetId: string, position: GridPosition, panelId?: string) => set((state) => {
        const widget = state.widgets.get(widgetId);
        if (widget) {
          state.widgets.set(widgetId, {
            ...widget,
            position,
            panelId: panelId || widget.panelId,
          });
        }
      }),

      resizeWidget: (widgetId: string, size: { w: number; h: number }) => set((state) => {
        const widget = state.widgets.get(widgetId);
        if (widget) {
          state.widgets.set(widgetId, {
            ...widget,
            position: { ...widget.position, w: size.w, h: size.h },
          });
        }
      }),

      toggleWidgetCollapse: (widgetId: string) => set((state) => {
        const widget = state.widgets.get(widgetId);
        if (widget) {
          state.widgets.set(widgetId, { ...widget, collapsed: !widget.collapsed });
        }
      }),

      duplicateWidget: (widgetId: string) => {
        const originalWidget = get().widgets.get(widgetId);
        if (!originalWidget) return '';

        const newWidgetId = crypto.randomUUID();
        set((state) => {
          const newWidget: Widget = {
            ...originalWidget,
            id: newWidgetId,
            title: `${originalWidget.title} (Copy)`,
            position: {
              ...originalWidget.position,
              x: originalWidget.position.x + 1, // Offset slightly
            },
          };
          state.widgets.set(newWidgetId, newWidget);
          state.createSnapshot(`Duplicated ${originalWidget.type} widget`);
        });

        return newWidgetId;
      },

      // Grid Layout Integration
      updateGridLayout: (panelId: string, layout: Layout[]) => set((state) => {
        layout.forEach((item) => {
          const widget = state.widgets.get(item.i);
          if (widget && widget.panelId === panelId) {
            state.widgets.set(item.i, {
              ...widget,
              position: { x: item.x, y: item.y, w: item.w, h: item.h },
            });
          }
        });
      }),

      getWidgetsByPanel: (panelId: string) => {
        const widgets = get().widgets;
        return Array.from(widgets.values()).filter(widget => widget.panelId === panelId);
      },

      getGridLayout: (panelId: string) => {
        const widgets = get().getWidgetsByPanel(panelId);
        return widgets.map(widget => ({
          i: widget.id,
          x: widget.position.x,
          y: widget.position.y,
          w: widget.position.w,
          h: widget.position.h,
          minW: widget.minW,
          maxW: widget.maxW,
          minH: widget.minH,
          maxH: widget.maxH,
          static: widget.static || false,
          isDraggable: widget.isDraggable,
          isResizable: widget.isResizable,
        }));
      },

      // Selection
      setSelectedWidget: (widgetId: string | null) => set((state) => {
        state.selectedWidgetId = widgetId;
        state.selectedWidget = widgetId; // Legacy compatibility
      }),

      // Layout Management
      loadLayouts: async () => {
        set((state) => { state.isLoading = true; });
        
        try {
          const { data: user } = await supabase.auth.getUser();
          if (!user.user) throw new Error('No authenticated user');

          const { data, error } = await supabase
            .from('dashboard_layouts')
            .select('*')
            .eq('user_id', user.user.id)
            .order('created_at', { ascending: false });

          if (error) throw error;

          set((state) => {
            // Transform database layout data to our format
            const dbLayouts = data || [];
            state.layouts = dbLayouts.map((dbLayout: any) => {
              const layoutData = dbLayout.layout_data as any;
              const rawWidgets = layoutData?.widgets || [];
              
              // Transform widgets to match current interface
              const transformedWidgets = rawWidgets.map((widget: any) => ({
                id: widget.id,
                type: widget.type,
                title: widget.title,
                customName: widget.customName,
                position: {
                  x: widget.position.x,
                  y: widget.position.y,
                  w: widget.position.w || widget.position.width || 2,
                  h: widget.position.h || widget.position.height || 2,
                },
                collapsed: widget.collapsed || false,
                isDraggable: widget.isDraggable !== false,
                isResizable: widget.isResizable !== false,
                settings: widget.settings || {},
                panelId: widget.panelId || 'main',
                minW: widget.minW,
                maxW: widget.maxW,
                minH: widget.minH,
                maxH: widget.maxH,
                static: widget.static || false,
              }));

              return {
                id: dbLayout.id,
                name: dbLayout.name,
                userId: dbLayout.user_id,
                panels: layoutData?.panels || defaultPanels,
                widgets: transformedWidgets,
                gridCols: 12,
                gridRows: 'auto',
                isActive: dbLayout.is_active,
                createdAt: new Date(dbLayout.created_at),
                updatedAt: new Date(dbLayout.updated_at),
              };
            });
            state.isLoading = false;
            
            // Set active layout if none selected
            if (!state.activeLayoutId && state.layouts.length > 0) {
              const activeLayout = state.layouts.find(l => l.isActive) || state.layouts[0];
              state.activeLayoutId = activeLayout.id;
              state.currentLayout = activeLayout; // Legacy compatibility
              
              // Load widgets from layout
              if (activeLayout.widgets) {
                state.widgets.clear();
                activeLayout.widgets.forEach((widget: Widget) => {
                  state.widgets.set(widget.id, widget);
                });
              }
            }
          });
        } catch (error) {
          console.error('Error loading layouts:', error);
          set((state) => {
            state.error = error instanceof Error ? error.message : 'Failed to load layouts';
            state.isLoading = false;
          });
        }
      },

      createLayout: async (name: string) => {
        try {
          const { data: user } = await supabase.auth.getUser();
          if (!user.user) throw new Error('No authenticated user');

          const layoutData = {
            panels: defaultPanels,
            widgets: Array.from(get().widgets.values()),
          };

          const { data, error } = await supabase
            .from('dashboard_layouts')
            .insert({
              name,
              user_id: user.user.id,
              layout_data: layoutData as any,
              is_active: false,
            })
            .select()
            .single();

          if (error) throw error;

          set((state) => {
            const newLayout: DashboardLayout = {
              id: data.id,
              name: data.name,
              userId: data.user_id,
              panels: defaultPanels,
              widgets: [],
              gridCols: 12,
              gridRows: 'auto',
              isActive: data.is_active,
              createdAt: new Date(data.created_at),
              updatedAt: new Date(data.updated_at),
            };
            state.layouts.unshift(newLayout);
          });

          toast.success(`Layout "${name}" created`);
        } catch (error) {
          console.error('Error creating layout:', error);
          toast.error('Failed to create layout');
        }
      },

      updateLayout: async (layoutId: string, updates: Partial<DashboardLayout>) => {
        try {
          const { error } = await supabase
            .from('dashboard_layouts')
            .update(updates)
            .eq('id', layoutId);

          if (error) throw error;

          set((state) => {
            const layoutIndex = state.layouts.findIndex(l => l.id === layoutId);
            if (layoutIndex >= 0) {
              state.layouts[layoutIndex] = { ...state.layouts[layoutIndex], ...updates };
            }
          });
        } catch (error) {
          console.error('Error updating layout:', error);
          toast.error('Failed to update layout');
        }
      },

      deleteLayout: async (layoutId: string) => {
        try {
          const { error } = await supabase
            .from('dashboard_layouts')
            .delete()
            .eq('id', layoutId);

          if (error) throw error;

          set((state) => {
            state.layouts = state.layouts.filter(l => l.id !== layoutId);
            if (state.activeLayoutId === layoutId) {
              state.activeLayoutId = null;
              state.currentLayout = null;
            }
          });
        } catch (error) {
          console.error('Error deleting layout:', error);
          toast.error('Failed to delete layout');
        }
      },

      setActiveLayout: (layoutId: string) => set((state) => {
        const layout = state.layouts.find(l => l.id === layoutId);
        if (layout) {
          state.activeLayoutId = layoutId;
          state.currentLayout = layout; // Legacy compatibility
          
          // Load widgets from this layout
          if (layout.widgets) {
            state.widgets.clear();
            layout.widgets.forEach((widget: Widget) => {
              state.widgets.set(widget.id, widget);
            });
          }
        }
      }),

      saveCurrentLayout: async () => {
        const { activeLayoutId, widgets } = get();
        if (!activeLayoutId) return;

        try {
          const layoutData = {
            panels: defaultPanels,
            widgets: Array.from(widgets.values()),
          };

          const { error } = await supabase
            .from('dashboard_layouts')
            .update({
              layout_data: layoutData as any,
              updated_at: new Date().toISOString(),
            })
            .eq('id', activeLayoutId);

          if (error) throw error;
        } catch (error) {
          console.error('Error saving layout:', error);
        }
      },

      // History Management
      createSnapshot: (action: string) => set((state) => {
        const snapshot: DashboardSnapshot = {
          layout: {
            id: state.activeLayoutId || '',
            name: 'Current',
            userId: '',
            panels: defaultPanels,
            widgets: Array.from(state.widgets.values()),
            gridCols: 12,
            gridRows: 'auto',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          timestamp: new Date(),
          action,
        };

        // Remove future history if we're not at the end
        if (state.historyIndex < state.history.length - 1) {
          state.history = state.history.slice(0, state.historyIndex + 1);
        }

        state.history.push(snapshot);
        if (state.history.length > HISTORY_LIMIT) {
          state.history = state.history.slice(-HISTORY_LIMIT);
        }
        state.historyIndex = state.history.length - 1;
      }),

      undo: () => set((state) => {
        if (state.historyIndex > 0) {
          state.historyIndex--;
          const snapshot = state.history[state.historyIndex];
          if (snapshot) {
            state.widgets.clear();
            snapshot.layout.widgets.forEach(widget => {
              state.widgets.set(widget.id, widget);
            });
          }
        }
      }),

      redo: () => set((state) => {
        if (state.historyIndex < state.history.length - 1) {
          state.historyIndex++;
          const snapshot = state.history[state.historyIndex];
          if (snapshot) {
            state.widgets.clear();
            snapshot.layout.widgets.forEach(widget => {
              state.widgets.set(widget.id, widget);
            });
          }
        }
      }),

      canUndo: () => get().historyIndex > 0,
      canRedo: () => get().historyIndex < get().history.length - 1,

      // Panel Configuration
      updatePanelConfig: (panelId: string, config: Partial<PanelConfig>) => set((state) => {
        // This would update panel configuration if we stored it in state
        // For now, panels are static
      }),

      // Utility
      setError: (error: string | null) => set((state) => {
        state.error = error;
      }),

      setLoading: (loading: boolean) => set((state) => {
        state.isLoading = loading;
      }),

      clearAllWidgets: () => {
        set((state) => {
          state.widgets.clear();
          state.selectedWidgetId = null;
        });
      },

      getWidget: (id: string) => {
        return get().widgets.get(id);
      },

      // Enhanced layout functions
      autoArrangeWidgets: (panelId: string) => {
        set((state) => {
          const panelWidgets = Array.from(state.widgets.values())
            .filter(w => w.panelId === panelId)
            .sort((a, b) => a.position.y - b.position.y || a.position.x - b.position.x);

          let currentX = 0;
          let currentY = 0;
          const maxCols = 12;

          panelWidgets.forEach((widget) => {
            // Simple auto-arrangement in a grid pattern
            if (currentX + widget.position.w > maxCols) {
              currentX = 0;
              currentY += 3; // Standard row height
            }

            widget.position.x = currentX;
            widget.position.y = currentY;

            currentX += widget.position.w;
          });
        });
      },

      setGridDensity: (density: 'compact' | 'comfortable' | 'spacious') => {
        set((state) => {
          state.gridDensity = density;
        });
      },
    }))
  )
);

// Auto-save current layout every 30 seconds
useDashboardStore.subscribe(
  (state) => state.widgets,
  () => {
    clearTimeout(autoSaveTimeout);
    autoSaveTimeout = setTimeout(() => {
      const store = useDashboardStore.getState();
      if (store.activeLayoutId) {
        store.saveCurrentLayout();
      }
    }, AUTO_SAVE_DELAY);
  }
);

// Cleanup on unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout);
    }
  });
}