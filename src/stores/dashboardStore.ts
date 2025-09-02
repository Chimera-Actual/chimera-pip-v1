// Zustand Dashboard Store with Immer for State Management
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { subscribeWithSelector } from 'zustand/middleware';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import type { 
  DashboardState, 
  DashboardLayout, 
  Widget, 
  GridPosition, 
  DashboardSnapshot,
  PanelConfig
} from '@/types/dashboard';

interface DashboardActions {
  // Layout management
  loadLayouts: (userId: string) => Promise<void>;
  createLayout: (name: string, userId: string) => Promise<void>;
  setActiveLayout: (layoutId: string) => Promise<void>;
  updateLayout: (layout: Partial<DashboardLayout>) => Promise<void>;
  deleteLayout: (layoutId: string) => Promise<void>;
  
  // Widget management
  addWidget: (widget: Omit<Widget, 'id'>, position: GridPosition) => void;
  moveWidget: (widgetId: string, position: GridPosition, panelId?: string) => void;
  resizeWidget: (widgetId: string, size: { width: number; height: number }) => void;
  removeWidget: (widgetId: string) => void;
  updateWidgetSettings: (widgetId: string, settings: any) => void;
  toggleWidgetCollapse: (widgetId: string) => void;
  
  // Selection
  selectWidget: (widgetId: string | null) => void;
  
  // History management
  undo: () => void;
  redo: () => void;
  createSnapshot: (action: string) => void;
  
  // Panel management
  updatePanelConfig: (panelId: string, config: Partial<PanelConfig>) => void;
  
  // Utility
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
}

type DashboardStore = DashboardState & DashboardActions;

const HISTORY_LIMIT = 10;
const AUTO_SAVE_DELAY = 2000;

// Default panel configuration
const defaultPanels: PanelConfig[] = [
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
];

let autoSaveTimeout: NodeJS.Timeout | null = null;

export const useDashboardStore = create<DashboardStore>()(
  subscribeWithSelector(
    immer((set, get) => ({
      // Initial state
      currentLayout: null,
      layouts: [],
      selectedWidget: null,
      history: [],
      historyIndex: -1,
      isLoading: false,
      error: null,

      // Layout management
      loadLayouts: async (userId: string) => {
        set(state => { state.isLoading = true; });
        
        try {
          const { data, error } = await supabase
            .from('dashboard_layouts')
            .select('*')
            .eq('user_id', userId)
            .order('updated_at', { ascending: false });

          if (error) throw error;

          set(state => {
            state.layouts = data?.map(layout => {
              const layoutData = layout.layout_data as any;
              return {
                id: layout.id,
                name: layout.name,
                userId: layout.user_id,
                panels: layoutData?.panels || defaultPanels,
                widgets: layoutData?.widgets || [],
                gridCols: layoutData?.gridCols || 12,
                gridRows: layoutData?.gridRows || 'auto',
                isActive: layout.is_active,
                createdAt: new Date(layout.created_at),
                updatedAt: new Date(layout.updated_at),
              };
            }) || [];
            
            // Set active layout or create default
            const activeLayout = state.layouts.find(l => l.isActive);
            if (activeLayout) {
              state.currentLayout = activeLayout;
            }
          });

          // Create default layout if none exists
          if (!data?.length) {
            await get().createLayout('Default Dashboard', userId);
          }
        } catch (error) {
          logger.error('Failed to load dashboard layouts:', error);
          set(state => { state.error = 'Failed to load dashboard layouts'; });
        } finally {
          set(state => { state.isLoading = false; });
        }
      },

      createLayout: async (name: string, userId: string) => {
        const newLayout: DashboardLayout = {
          id: crypto.randomUUID(),
          name,
          userId,
          panels: defaultPanels,
          widgets: [],
          gridCols: 12,
          gridRows: 'auto',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        try {
          // Mark all other layouts as inactive
          await supabase
            .from('dashboard_layouts')
            .update({ is_active: false })
            .eq('user_id', userId);

          const { data, error } = await supabase
            .from('dashboard_layouts')
            .insert({
              name,
              user_id: userId,
              layout_data: {
                panels: newLayout.panels,
                widgets: newLayout.widgets,
                gridCols: newLayout.gridCols,
                gridRows: newLayout.gridRows,
              } as any,
              is_active: true,
            })
            .select()
            .single();

          if (error) throw error;

          set(state => {
            const layout = {
              ...newLayout,
              id: data.id,
              createdAt: new Date(data.created_at),
              updatedAt: new Date(data.updated_at),
            };
            state.layouts.unshift(layout);
            state.currentLayout = layout;
          });
        } catch (error) {
          logger.error('Failed to create dashboard layout:', error);
          set(state => { state.error = 'Failed to create dashboard layout'; });
        }
      },

      setActiveLayout: async (layoutId: string) => {
        const layout = get().layouts.find(l => l.id === layoutId);
        if (!layout) return;

        try {
          // Update database
          await supabase
            .from('dashboard_layouts')
            .update({ is_active: false })
            .eq('user_id', layout.userId);

          await supabase
            .from('dashboard_layouts')
            .update({ is_active: true })
            .eq('id', layoutId);

          set(state => {
            state.layouts.forEach(l => { l.isActive = l.id === layoutId; });
            state.currentLayout = layout;
          });
        } catch (error) {
          logger.error('Failed to set active layout:', error);
          set(state => { state.error = 'Failed to set active layout'; });
        }
      },

      updateLayout: async (layoutUpdate: Partial<DashboardLayout>) => {
        const currentLayout = get().currentLayout;
        if (!currentLayout) return;

        set(state => {
          if (state.currentLayout) {
            Object.assign(state.currentLayout, layoutUpdate);
            state.currentLayout.updatedAt = new Date();
          }
        });

        // Auto-save with debouncing
        if (autoSaveTimeout) {
          clearTimeout(autoSaveTimeout);
        }

        autoSaveTimeout = setTimeout(async () => {
          try {
            const layout = get().currentLayout;
            if (!layout) return;

            await supabase
              .from('dashboard_layouts')
              .update({
                name: layout.name,
                layout_data: {
                  panels: layout.panels,
                  widgets: layout.widgets,
                  gridCols: layout.gridCols,
                  gridRows: layout.gridRows,
                } as any,
                updated_at: new Date().toISOString(),
              })
              .eq('id', layout.id);
          } catch (error) {
            logger.error('Failed to auto-save layout:', error);
          }
        }, AUTO_SAVE_DELAY);
      },

      deleteLayout: async (layoutId: string) => {
        try {
          await supabase
            .from('dashboard_layouts')
            .delete()
            .eq('id', layoutId);

          set(state => {
            state.layouts = state.layouts.filter(l => l.id !== layoutId);
            if (state.currentLayout?.id === layoutId) {
              state.currentLayout = state.layouts[0] || null;
            }
          });
        } catch (error) {
          logger.error('Failed to delete layout:', error);
          set(state => { state.error = 'Failed to delete layout'; });
        }
      },

      // Widget management
      addWidget: (widget: Omit<Widget, 'id'>, position: GridPosition) => {
        const newWidget: Widget = {
          ...widget,
          id: crypto.randomUUID(),
          position,
        };

        set(state => {
          if (state.currentLayout) {
            state.currentLayout.widgets.push(newWidget);
          }
        });

        get().createSnapshot(`Added widget: ${widget.title}`);
        get().updateLayout({ widgets: get().currentLayout?.widgets });
      },

      moveWidget: (widgetId: string, position: GridPosition, panelId?: string) => {
        set(state => {
          if (state.currentLayout) {
            const widget = state.currentLayout.widgets.find(w => w.id === widgetId);
            if (widget) {
              widget.position = position;
              if (panelId) widget.panelId = panelId;
            }
          }
        });

        get().createSnapshot(`Moved widget: ${widgetId}`);
        get().updateLayout({ widgets: get().currentLayout?.widgets });
      },

      resizeWidget: (widgetId: string, size: { width: number; height: number }) => {
        set(state => {
          if (state.currentLayout) {
            const widget = state.currentLayout.widgets.find(w => w.id === widgetId);
            if (widget) {
              widget.position.width = size.width;
              widget.position.height = size.height;
            }
          }
        });

        get().createSnapshot(`Resized widget: ${widgetId}`);
        get().updateLayout({ widgets: get().currentLayout?.widgets });
      },

      removeWidget: (widgetId: string) => {
        set(state => {
          if (state.currentLayout) {
            state.currentLayout.widgets = state.currentLayout.widgets.filter(w => w.id !== widgetId);
          }
        });

        get().createSnapshot(`Removed widget: ${widgetId}`);
        get().updateLayout({ widgets: get().currentLayout?.widgets });
      },

      updateWidgetSettings: (widgetId: string, settings: any) => {
        set(state => {
          if (state.currentLayout) {
            const widget = state.currentLayout.widgets.find(w => w.id === widgetId);
            if (widget) {
              widget.settings = { ...widget.settings, ...settings };
            }
          }
        });

        get().updateLayout({ widgets: get().currentLayout?.widgets });
      },

      toggleWidgetCollapse: (widgetId: string) => {
        set(state => {
          if (state.currentLayout) {
            const widget = state.currentLayout.widgets.find(w => w.id === widgetId);
            if (widget) {
              widget.collapsed = !widget.collapsed;
            }
          }
        });

        get().createSnapshot(`Toggled widget collapse: ${widgetId}`);
        get().updateLayout({ widgets: get().currentLayout?.widgets });
      },

      // Selection
      selectWidget: (widgetId: string | null) => {
        set(state => { state.selectedWidget = widgetId; });
      },

      // History management
      createSnapshot: (action: string) => {
        const currentLayout = get().currentLayout;
        if (!currentLayout) return;

        set(state => {
          const snapshot: DashboardSnapshot = {
            layout: JSON.parse(JSON.stringify(currentLayout)),
            timestamp: new Date(),
            action,
          };

          // Remove any snapshots after current index (if we're not at the end)
          if (state.historyIndex < state.history.length - 1) {
            state.history = state.history.slice(0, state.historyIndex + 1);
          }

          state.history.push(snapshot);
          state.historyIndex = state.history.length - 1;

          // Limit history size
          if (state.history.length > HISTORY_LIMIT) {
            state.history.shift();
            state.historyIndex--;
          }
        });
      },

      undo: () => {
        const { history, historyIndex } = get();
        if (historyIndex > 0) {
          const previousSnapshot = history[historyIndex - 1];
          set(state => {
            state.currentLayout = previousSnapshot.layout;
            state.historyIndex = historyIndex - 1;
          });
          get().updateLayout(previousSnapshot.layout);
        }
      },

      redo: () => {
        const { history, historyIndex } = get();
        if (historyIndex < history.length - 1) {
          const nextSnapshot = history[historyIndex + 1];
          set(state => {
            state.currentLayout = nextSnapshot.layout;
            state.historyIndex = historyIndex + 1;
          });
          get().updateLayout(nextSnapshot.layout);
        }
      },

      // Panel management
      updatePanelConfig: (panelId: string, config: Partial<PanelConfig>) => {
        set(state => {
          if (state.currentLayout) {
            const panel = state.currentLayout.panels.find(p => p.id === panelId);
            if (panel) {
              Object.assign(panel, config);
            }
          }
        });

        get().updateLayout({ panels: get().currentLayout?.panels });
      },

      // Utility
      setError: (error: string | null) => {
        set(state => { state.error = error; });
      },

      setLoading: (loading: boolean) => {
        set(state => { state.isLoading = loading; });
      },
    }))
  )
);

// Auto-save cleanup
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout);
    }
  });
}