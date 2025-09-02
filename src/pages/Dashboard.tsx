import React, { useState } from "react";
import { CRTChrome, CRTThemeProvider, useCRT } from "@/lib/CRTTheme";
import DashboardGrid, { GridItem } from "@/components/dashboard/DashboardGrid";
import WidgetLibrary from "@/components/dashboard/WidgetLibrary";
import { WIDGET_COMPONENTS, WidgetComponentName } from "@/components/Layout/WidgetRegistry";
import { Edit, Eye, Palette, Zap, RotateCcw, Plus, Settings, User, LogOut } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { UserAvatar } from "@/components/Layout/UserAvatar";

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
        <Button
          onClick={() => window.location.href = '/pipboy'}
          variant="outline"
          size="sm"
          className="text-xs font-mono"
        >
          Legacy Mode
        </Button>
        
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
  const [editMode, setEditMode] = useState(false);
  const [showWidgetLibrary, setShowWidgetLibrary] = useState(false);
  const [items, setItems] = useState<GridItem[]>(() => {
    // Load saved widgets or use defaults
    try {
      const saved = localStorage.getItem('dashboard:widgets');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.warn('Failed to load saved widgets:', error);
    }
    
    // Default widgets
    return [
      { id: "clock-1", widgetType: "SampleClock", w: 4, h: 4, minW: 3, minH: 3 },
      { id: "note-1", widgetType: "SampleNote", w: 5, h: 6, minW: 4, minH: 4 },
      { id: "chart-1", widgetType: "SampleChart", w: 6, h: 6, minW: 4, minH: 4 },
    ];
  });

  // Save widgets to localStorage whenever they change
  React.useEffect(() => {
    try {
      localStorage.setItem('dashboard:widgets', JSON.stringify(items));
    } catch (error) {
      console.warn('Failed to save widgets:', error);
    }
  }, [items]);

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
    
    setItems(prev => [...prev, newWidget]);
    setShowWidgetLibrary(false);
  };

  const handleRemoveWidget = (widgetId: string) => {
    setItems(prev => prev.filter(item => item.id !== widgetId));
  };

  const renderWidget = (id: string) => {
    const widget = items.find(item => item.id === id);
    if (!widget || !widget.widgetType) {
      return <div className="p-4 text-center crt-muted">Unknown widget: {id}</div>;
    }

    const WidgetComponent = WIDGET_COMPONENTS[widget.widgetType as WidgetComponentName];
    if (!WidgetComponent) {
      return <div className="p-4 text-center crt-muted">Widget not found: {widget.widgetType}</div>;
    }

    return <WidgetComponent widgetInstanceId={id} />;
  };

  const resetLayout = () => {
    localStorage.removeItem("dashboard:layout");
    window.location.reload();
  };

  return (
    <div className="p-6 font-mono crt-text min-h-screen">
      <DashboardHeader />

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
          onClick={resetLayout}
          variant="outline"
          className="px-3 py-2 rounded flex items-center space-x-2 text-sm"
          title="Reset Layout"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Reset</span>
        </Button>
        
        <Button
          onClick={() => setEditMode(!editMode)}
          className={`px-4 py-2 rounded flex items-center space-x-2 text-sm transition-colors ${
            editMode ? 'bg-[var(--crt-accent)] text-[var(--crt-bg)]' : 'crt-button'
          }`}
        >
          {editMode ? (
            <>
              <Eye className="w-4 h-4" />
              <span>Exit Edit</span>
            </>
          ) : (
            <>
              <Edit className="w-4 h-4" />
              <span>Edit Layout</span>
            </>
          )}
        </Button>
      </motion.div>

      {editMode && (
        <motion.div 
          className="mb-4 p-3 crt-card border-dashed"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
        >
          <div className="flex items-center space-x-2 text-sm crt-accent">
            <Edit className="w-4 h-4" />
            <span>Edit Mode Active - Drag widgets by their grip handles to reposition and resize</span>
          </div>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <DashboardGrid
          items={items}
          renderItem={renderWidget}
          editable={editMode}
          storageKey="dashboard:layout"
          cols={12}
          rowHeight={32}
          margin={[12, 12]}
          className={editMode ? 'edit-mode' : ''}
        />
      </motion.div>
      
      <WidgetLibrary
        isOpen={showWidgetLibrary}
        onClose={() => setShowWidgetLibrary(false)}
        onAddWidget={handleAddWidget}
      />
      
      <motion.footer 
        className="mt-8 text-center text-xs crt-muted space-y-1"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <div>Dashboard Control System v2.0 - Powered by React Grid Layout</div>
        <div className="flex justify-center space-x-4">
          <span>⚡ CRT Effects</span>
          <span>🎛️ Resizable Widgets</span>
          <span>💾 Auto-Save Layout</span>
          <span>📦 Widget Library</span>
        </div>
      </motion.footer>
    </div>
  );
}

export default function Dashboard() {
  return (
    <CRTThemeProvider>
      <CRTChrome>
        <ThemeControls />
        <DashboardContent />
      </CRTChrome>
    </CRTThemeProvider>
  );
}