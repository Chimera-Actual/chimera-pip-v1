import React, { useState, useCallback, useRef } from "react";
import { CRTChrome, CRTThemeProvider, useCRT } from "@/lib/CRTTheme";
import DashboardGrid, { GridItem } from "@/components/dashboard/DashboardGrid";
import WidgetLibrary from "@/components/dashboard/WidgetLibrary";
import TabManager from "@/components/dashboard/TabManager";
import { WIDGET_COMPONENTS, WidgetComponentName } from "@/components/Layout/WidgetRegistry";
import { Palette, Zap, Undo, Plus, Settings, User, LogOut, Monitor } from "lucide-react";
import { useLayoutHistory } from "@/hooks/useLayoutHistory";
import { useDashboardTabs } from "@/hooks/useDashboardTabs";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { UserAvatar } from "@/components/Layout/UserAvatar";
import { Toaster } from "@/components/ui/toaster";
import debounce from "lodash.debounce";

function ThemeControls() {
  const { theme, setTheme, scanlinesEnabled, setScanlinesEnabled } = useCRT();
  const [showControls, setShowControls] = useState(false);

  return (
    <div className="fixed right-4 top-4 z-50">
      <motion.button
        onClick={() => setShowControls(!showControls)}
        className="crt-button p-2 rounded-lg"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Palette className="w-5 h-5" />
      </motion.button>
      
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute right-0 top-12 crt-card p-4 space-y-3 min-w-[200px]"
          >
            <div>
              <label className="block text-xs crt-muted uppercase mb-2">Theme</label>
              <select
                className="w-full crt-input px-2 py-1 rounded text-sm"
                value={theme}
                onChange={(e) => setTheme(e.target.value as any)}
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
  const [showWidgetLibrary, setShowWidgetLibrary] = useState(false);
  
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

  // Update the default tab to have the Monitor icon (already handled in hook)
  // React.useEffect(() => {
  //   if (tabs.length === 1 && tabs[0].id === 'default-tab' && !tabs[0].icon) {
  //     updateTab('default-tab', { icon: Monitor });
  //   }
  // }, [tabs, updateTab]);

  const { saveLayout, undo, canUndo, undoCount } = useLayoutHistory(`dashboard:layout:${activeTabId}`);

  const handleAddWidget = (widgetDef: any) => {
    const newWidget: GridItem = {
      id: `${widgetDef.id}-${Date.now()}`,
      widgetType: widgetDef.id,
      w: widgetDef.defaultW,
      h: widgetDef.defaultH,
      minW: widgetDef.minW,
      minH: widgetDef.minH,
      x: 0,
      y: Infinity // Places at bottom
    };
    
    addWidgetToTab(activeTabId, newWidget);
    setShowWidgetLibrary(false);
  };

  const handleRemoveWidget = (widgetId: string) => {
    removeWidgetFromTab(activeTabId, widgetId);
  };

  const handleLayoutChange = useCallback(
    debounce((layout: any[]) => {
      saveLayout(layout);
      updateTabLayout(activeTabId, layout);
    }, 300),
    [saveLayout, updateTabLayout, activeTabId]
  );

  const handleUndo = () => {
    const previousLayout = undo();
    if (previousLayout) {
      // Force a re-render by updating a timestamp or similar
      window.location.reload();
      toast({
        title: "Layout restored",
        description: "Reverted to previous layout state",
      });
    }
  };

  const renderWidget = (id: string) => {
    const widget = activeTab?.widgets.find(item => item.id === id);
    if (!widget || !widget.widgetType) {
      return <div className="p-4 text-center crt-muted">Unknown widget: {id}</div>;
    }

    const WidgetComponent = WIDGET_COMPONENTS[widget.widgetType as WidgetComponentName];
    if (!WidgetComponent) {
      return <div className="p-4 text-center crt-muted">Widget not found: {widget.widgetType}</div>;
    }

    return <WidgetComponent widgetInstanceId={id} />;
  };


  return (
    <div className="font-mono crt-text min-h-screen max-h-screen flex flex-col overflow-hidden">
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

      <div className="flex-1 p-6 overflow-y-auto">
        <motion.div 
          className="flex items-center space-x-3 mb-6"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <Button
            onClick={() => setShowWidgetLibrary(true)}
            className="crt-button px-4 py-2 rounded flex items-center space-x-2 text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Widget</span>
          </Button>
          
          <Button
            onClick={handleUndo}
            disabled={!canUndo}
            variant="outline"
            className="px-3 py-2 rounded flex items-center space-x-2 text-sm"
            title={`Undo layout changes (${undoCount} available)`}
          >
            <Undo className="w-4 h-4" />
            <span>Undo {undoCount > 0 && `(${undoCount})`}</span>
          </Button>
        </motion.div>


        <motion.div
          key={activeTabId} // Re-render when tab changes
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <DashboardGrid
            items={activeTab?.widgets || []}
            renderItem={renderWidget}
            editable={true}
            storageKey={`dashboard:layout:${activeTabId}`}
            cols={12}
            rowHeight={32}
            margin={[12, 12]}
            onLayoutChange={handleLayoutChange}
            className=""
          />
        </motion.div>
      </div>
      
      <WidgetLibrary
        isOpen={showWidgetLibrary}
        onClose={() => setShowWidgetLibrary(false)}
        onAddWidget={handleAddWidget}
      />
    </div>
  );
}

export default function Dashboard() {
  return (
    <CRTThemeProvider>
      <CRTChrome>
        <ThemeControls />
        <DashboardContent />
        <Toaster />
      </CRTChrome>
    </CRTThemeProvider>
  );
}