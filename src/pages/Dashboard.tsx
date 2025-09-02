import React, { useState, useCallback, useEffect, useMemo } from "react";
import { CRTChrome, CRTThemeProvider } from "@/lib/CRTTheme";
import DashboardGrid, { GridItem } from "@/components/dashboard/DashboardGrid";
import TabManager from "@/components/dashboard/TabManager";
import OrphanedWidget from "@/components/dashboard/OrphanedWidget";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { WidgetRenderer } from "@/components/dashboard/WidgetRenderer";
import { useOptimizedWidgetManager } from "@/hooks/useOptimizedWidgetManager";
import { useLayoutHistory } from "@/hooks/useLayoutHistory";
import { useDashboardTabs } from "@/hooks/useDashboardTabs";
import { useToast } from "@/hooks/use-toast";
// import { useErrorHandler } from "@/hooks/useErrorHandler";
import { motion } from "framer-motion";
import { Toaster } from "@/components/ui/toaster";
import debounce from "lodash.debounce";
import { WidgetSettings } from "@/types/common";
import { Layout } from "react-grid-layout";

const DashboardContent = React.memo(() => {
  const { toast } = useToast();
  // const { handleError } = useErrorHandler();
  
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
    updateTabLayout
  } = useDashboardTabs();
  
  // Widget management with error handling
  const {
    availableWidgets,
    addWidgetToTab: addWidgetToTabHook,
    removeWidgetFromTab: removeWidgetFromTabHook,
    getActiveWidgetsForTab,
    getWidgetSettings,
    updateWidgetSettings
  } = useOptimizedWidgetManager();

  const { saveLayout, undo, canUndo, undoCount } = useLayoutHistory(`dashboard:layout:${activeTabId}`);

  // Permanent widgets configuration - memoized for performance
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
  
  const permanentWidgetIds = useMemo(() => 
    new Set(permanentWidgets.map(w => w.id)), 
    [permanentWidgets]
  );

  // Get active widgets for current tab
  const activeWidgetsForTab = useMemo(() => 
    getActiveWidgetsForTab(activeTabId), 
    [getActiveWidgetsForTab, activeTabId]
  );

  // Detect orphaned widgets in the current tab
  const orphanedWidgets = useMemo(() => 
    (activeTab?.widgets || []), 
    [activeTab?.widgets]
  );

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
      removeWidgetFromTabHook(widget.id);
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
    removeWidgetFromTabHook(widgetId);
  };

  const handleLayoutChange = useCallback(
    debounce((layout: Layout[]) => {
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

  const renderWidget = useCallback((id: string, onCollapseChange?: (widgetId: string, collapsed: boolean) => void) => {
    return (
      <WidgetRenderer
        widgetId={id}
        permanentWidgets={permanentWidgets}
        activeWidgetsForTab={activeWidgetsForTab}
        getWidgetSettings={getWidgetSettings}
        updateWidgetSettings={updateWidgetSettings}
        onRemoveWidget={handleRemoveWidget}
        onCollapseChange={onCollapseChange}
      />
    );
  }, [permanentWidgets, activeWidgetsForTab, getWidgetSettings, updateWidgetSettings, handleRemoveWidget]);


  return (
    <div className="font-mono crt-text min-h-screen flex flex-col">
      <div className="px-6 pt-6">
        <DashboardHeader 
          onUndo={handleUndo}
          canUndo={canUndo}
          undoCount={undoCount}
        />
        
        <TabManager
          tabs={tabs}
          activeTabId={activeTabId}
          onTabSelect={setActiveTabId}
          onTabCreate={createTab}
          onTabDelete={deleteTab}
          onTabUpdate={updateTab}
          onTabReorder={reorderTabs}
          aria-label="Dashboard tab navigation"
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
});

DashboardContent.displayName = "DashboardContent";

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