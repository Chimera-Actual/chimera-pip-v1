import React, { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { CRTChrome, CRTThemeProvider, useCRT, type Theme } from "@/lib/CRTTheme";
import DashboardGrid, { GridItem } from "@/components/dashboard/DashboardGrid";
import TabManager from "@/components/dashboard/TabManager";
import OrphanedWidget from "@/components/dashboard/OrphanedWidget";
import { WIDGET_COMPONENTS, WidgetComponentName } from "@/components/Layout/WidgetRegistry";
import { useOptimizedWidgetManager } from "@/hooks/useOptimizedWidgetManager";
import { Zap, Undo, Settings, User, LogOut, Monitor, Trash2, AlertTriangle, ChevronUp, ChevronDown } from "lucide-react";
import { useLayoutHistory } from "@/hooks/useLayoutHistory";
import { useDashboardTabs } from "@/hooks/useDashboardTabs";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { UserAvatar } from "@/components/Layout/UserAvatar";
import { Toaster } from "@/components/ui/toaster";
import debounce from "lodash.debounce";

function DashboardSettings() {
  const { theme, setTheme, scanlinesEnabled, setScanlinesEnabled } = useCRT();
  const [showSettings, setShowSettings] = useState(false);

  return (
    <div className="relative">
      <Button
        onClick={() => setShowSettings(!showSettings)}
        variant="outline"
        className="px-3 py-2 rounded flex items-center space-x-2 text-sm"
      >
        <Settings className="w-4 h-4" />
        <span>Dashboard Settings</span>
      </Button>
      
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute right-0 top-12 crt-card p-4 space-y-3 min-w-[200px] z-10"
          >
            <div>
              <label className="block text-xs crt-muted uppercase mb-2">Theme</label>
              <select
                className="w-full crt-input px-2 py-1 rounded text-sm"
                value={theme}
                onChange={(e) => setTheme(e.target.value as Theme)}
              >
                <option value="green">Matrix Green</option>
                <option value="amber">Fallout Amber</option>
                <option value="blue">Cyberpunk Blue</option>
              </select>
            </div>
            
            <div className="flex items-center justify-between">
              <label className="text-xs crt-muted uppercase">Scanlines</label>
              <button
                onClick={() => setScanlinesEnabled(!scanlinesEnabled)}
                className={`flex items-center space-x-2 px-2 py-1 rounded text-xs transition-colors ${
                  scanlinesEnabled ? 'crt-button' : 'opacity-50'
                }`}
              >
                <Zap className="w-3 h-3" />
                <span>{scanlinesEnabled ? 'ON' : 'OFF'}</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function DashboardHeader() {
  const { user, signOut } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <div className="flex items-center justify-between mb-6">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="space-y-2"
      >
        <h1 className="text-3xl font-bold crt-accent">
          DASHBOARD CONTROL SYSTEM
        </h1>
        <p className="text-sm crt-muted uppercase tracking-wide">
          Vault-Tec Industries - Dashboard Kit v2.0
        </p>
      </motion.div>
      
      <motion.div 
        className="flex items-center space-x-3"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
      >
        
        <div className="relative">
          <Button
            onClick={() => setShowUserMenu(!showUserMenu)}
            variant="ghost"
            className="p-0 h-auto"
          >
            <UserAvatar />
          </Button>
          
          <AnimatePresence>
            {showUserMenu && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                className="absolute right-0 top-12 crt-card p-3 space-y-2 min-w-[160px] z-10"
              >
                <div className="text-xs crt-muted px-2 py-1 border-b crt-border">
                  {user?.email}
                </div>
                <Button variant="ghost" size="sm" className="w-full justify-start text-xs">
                  <User className="w-3 h-3 mr-2" />
                  Profile
                </Button>
                <Button variant="ghost" size="sm" className="w-full justify-start text-xs">
                  <Settings className="w-3 h-3 mr-2" />
                  Settings
                </Button>
                <Button 
                  onClick={signOut}
                  variant="ghost" 
                  size="sm" 
                  className="w-full justify-start text-xs text-red-400 hover:text-red-300"
                >
                  <LogOut className="w-3 h-3 mr-2" />
                  Sign Out
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

function DashboardContent() {
  const { toast } = useToast();
  const [isToolbarCollapsed, setIsToolbarCollapsed] = useState(false);
  
  // Initialize dashboard tab manager
  const {
    tabs,
    activeTab,
    activeTabId,
    setActiveTabId,
    createTab,
    deleteTab,
    updateTab,
    reorderTabs,
    addWidgetToTab,
    removeWidgetFromTab,
    updateTabLayout
  } = useDashboardTabs();

  // Widget management
  const {
    availableWidgets,
    addWidgetToTab: addWidgetToTabHook,
    removeWidgetFromTab: removeWidgetFromTabHook,
    getAllUserTags,
    addTagToWidget,
    removeTagFromWidget,
    getActiveWidgetsForTab,
    getWidgetSettings,
    updateWidgetSettings
  } = useOptimizedWidgetManager();

  // Update the default tab to have the Monitor icon (already handled in hook)
  // React.useEffect(() => {
  //   if (tabs.length === 1 && tabs[0].id === 'default-tab' && !tabs[0].icon) {
  //     updateTab('default-tab', { icon: Monitor });
  //   }
  // }, [tabs, updateTab]);

  // Detect orphaned widgets in the current tab
  const orphanedWidgets = (activeTab?.widgets || []).filter(widget => {
    if (!widget.widgetType) return true;
    return !WIDGET_COMPONENTS[widget.widgetType as WidgetComponentName];
  });

  const { saveLayout, undo, canUndo, undoCount } = useLayoutHistory(`dashboard:layout:${activeTabId}`);

  // Permanent widgets that appear on every tab - memoized for performance
  const permanentWidgets = useMemo(() => [
    {
      id: 'permanent-add-widget',
      widgetType: 'AddWidgetWidget',
      w: 4,
      h: 6,
      x: 0,
      y: 0,
      minW: 3,
      minH: 4,
    },
    {
      id: 'permanent-dashboard-settings',
      widgetType: 'DashboardSettingsWidget', 
      w: 4,
      h: 6,
      x: 4,
      y: 0,
      minW: 3,
      minH: 4,
    }
  ], []);
  
  const permanentWidgetIds = useMemo(() => new Set(permanentWidgets.map(w => w.id)), [permanentWidgets]);

  // Show notification about orphaned widgets
  useEffect(() => {
    if (orphanedWidgets.length > 0) {
      toast({
        title: "Orphaned widgets detected",
        description: `${orphanedWidgets.length} widget${orphanedWidgets.length > 1 ? 's' : ''} could not be loaded`,
        variant: "destructive",
      });
    }
  }, [orphanedWidgets.length, toast]);

  const handleCleanupOrphanedWidgets = () => {
    orphanedWidgets.forEach(widget => {
      removeWidgetFromTab(activeTabId, widget.id);
    });
    toast({
      title: "Widgets cleaned up",
      description: `Removed ${orphanedWidgets.length} orphaned widget${orphanedWidgets.length > 1 ? 's' : ''}`,
    });
  };

  const handleAddWidget = async (widgetId: string) => {
    try {
      await addWidgetToTabHook({ widgetId, tabId: activeTabId });
      toast({
        title: "Widget Added",
        description: "Widget has been added to your dashboard.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add widget to dashboard.",
        variant: "destructive",
      });
    }
  };

  const handleRemoveWidget = (widgetId: string) => {
    // Prevent removal of permanent widgets
    if (permanentWidgetIds.has(widgetId)) {
      toast({
        title: "Cannot Remove Widget",
        description: "This widget is permanently available on all tabs.",
        variant: "destructive",
      });
      return;
    }
    removeWidgetFromTab(activeTabId, widgetId);
  };

  const handleLayoutChange = useCallback(
    debounce((layout: any[]) => {
      saveLayout(layout);
      updateTabLayout(activeTabId, layout);
    }, 300),
    [saveLayout, updateTabLayout, activeTabId]
  );

  const handleUndo = useCallback(() => {
    const previousLayout = undo();
    if (previousLayout) {
      // Update layout state directly instead of reloading
      updateTabLayout(activeTabId, previousLayout);
      toast({
        title: "Layout restored",
        description: "Reverted to previous layout state",
      });
    }
  }, [undo, updateTabLayout, activeTabId, toast]);

  // Permanent widgets that appear on every tab

  // Combine permanent widgets with tab widgets, offsetting tab widgets to avoid overlap
  const allWidgets = useMemo(() => [
    ...permanentWidgets,
    ...(activeTab?.widgets.map(widget => ({
      ...widget,
      y: (widget.y || 0) + 7 // Offset regular widgets below permanent ones
    })) || [])
  ], [permanentWidgets, activeTab?.widgets]);

  // Handle widget collapse to communicate with grid
  const handleWidgetCollapse = useCallback((widgetId: string, collapsed: boolean) => {
    // This will be called when widgets are collapsed/expanded
    // The grid will handle the layout updates automatically
  }, []);

  const renderWidget = (id: string, onCollapseChange?: (widgetId: string, collapsed: boolean) => void) => {
    // Check if it's a permanent widget first
    const permanentWidget = permanentWidgets.find(w => w.id === id);
    if (permanentWidget) {
      const WidgetComponent = WIDGET_COMPONENTS[permanentWidget.widgetType as WidgetComponentName];
      if (WidgetComponent) {
        return (
          <WidgetComponent 
            widgetInstanceId={id} 
            widgetName={permanentWidget.widgetType === 'AddWidgetWidget' ? 'Add Widget' : 'Dashboard Settings'}
            title={permanentWidget.widgetType === 'AddWidgetWidget' ? 'Add Widget' : 'Dashboard Settings'}
            widgetType={permanentWidget.widgetType}
            onCollapseChange={onCollapseChange}
          />
        );
      }
    }

    // Handle regular tab widgets - find widget instance from useOptimizedWidgetManager
    const widgetInstance = getActiveWidgetsForTab(activeTabId).find(instance => instance.id === id);
    if (!widgetInstance || !widgetInstance.widget_definition) {
      return (
        <OrphanedWidget
          widgetId={id}
          onRemove={handleRemoveWidget}
          reason="missing-type"
        />
      );
    }

    const ComponentName = widgetInstance.widget_definition.component_name as WidgetComponentName;
    const WidgetComponent = WIDGET_COMPONENTS[ComponentName];
    if (!WidgetComponent) {
      return (
        <OrphanedWidget
          widgetId={id}
          widgetType={widgetInstance.widget_definition.component_name}
          onRemove={handleRemoveWidget}
          reason="component-not-found"
        />
      );
    }

    // Get merged settings (default + user-specific)
    const widgetSettings = getWidgetSettings(widgetInstance.id);
    
    return (
      <WidgetComponent
        key={id}
        widgetInstanceId={widgetInstance.id}
        widgetType={widgetInstance.widget_definition.component_name}
        title={widgetInstance.widget_definition.name}
        widgetName={widgetInstance.custom_name || widgetInstance.widget_definition.name}
        settings={widgetSettings}
        defaultSettings={widgetInstance.widget_definition.default_settings}
        onSettingsChange={(newSettings) => updateWidgetSettings({ instanceId: widgetInstance.id, settings: newSettings })}
        onCollapseChange={onCollapseChange}
      />
    );
  };


  return (
    <div className="font-mono crt-text min-h-screen flex flex-col">
      <div className="px-6 pt-6">
        <DashboardHeader />
        
        <TabManager
          tabs={tabs}
          activeTabId={activeTabId}
          onTabSelect={setActiveTabId}
          onTabCreate={createTab}
          onTabDelete={deleteTab}
          onTabUpdate={updateTab}
          onTabReorder={reorderTabs}
        />
      </div>

      <div className="flex-1 p-6 min-h-0">
        <motion.div
          key={activeTabId} // Re-render when tab changes
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <DashboardGrid
            items={allWidgets}
            renderItem={renderWidget}
            editable={true}
            storageKey={`dashboard:layout:${activeTabId}`}
            cols={12}
            rowHeight={32}
            margin={[12, 12]}
            onLayoutChange={handleLayoutChange}
            onWidgetCollapse={handleWidgetCollapse}
            className=""
          />
        </motion.div>
      </div>
      
      {/* Remove the WidgetLibrary from here since it's now handled by AddWidgetWidget */}
    </div>
  );
}

export default function Dashboard() {
  return (
    <CRTThemeProvider>
      <CRTChrome>
        <DashboardContent />
        <Toaster />
      </CRTChrome>
    </CRTThemeProvider>
  );
}