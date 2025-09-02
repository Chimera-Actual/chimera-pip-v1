import React, { useState } from "react";
import { CRTChrome, CRTThemeProvider, useCRT } from "@/lib/CRTTheme";
import DashboardGrid, { GridItem } from "@/components/dashboard/DashboardGrid";
import SampleClock from "@/components/widgets/SampleClock";
import SampleNote from "@/components/widgets/SampleNote";
import SampleChart from "@/components/widgets/SampleChart";
import { Edit, Eye, Palette, Zap, RotateCcw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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

function DashboardContent() {
  const [editMode, setEditMode] = useState(false);
  const [items] = useState<GridItem[]>([
    { id: "clock", w: 4, h: 6, minW: 3, minH: 4 },
    { id: "note", w: 5, h: 8, minW: 4, minH: 6 },
    { id: "chart", w: 3, h: 6, minW: 3, minH: 4 },
  ]);

  const renderWidget = (id: string) => {
    switch (id) {
      case "clock":
        return <SampleClock />;
      case "note":
        return <SampleNote />;
      case "chart":
        return <SampleChart />;
      default:
        return <div>Unknown widget: {id}</div>;
    }
  };

  const resetLayout = () => {
    localStorage.removeItem("dashboard:layout");
    window.location.reload();
  };

  return (
    <div className="p-6 font-mono crt-text min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-2"
        >
          <h1 className="text-3xl font-bold crt-accent">
            PIP-BOY DASHBOARD
          </h1>
          <p className="text-sm crt-muted uppercase tracking-wide">
            Vault-Tec Industries - Model 3000 Mk IV
          </p>
        </motion.div>
        
        <motion.div 
          className="flex items-center space-x-3"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <button
            onClick={resetLayout}
            className="crt-button px-3 py-2 rounded flex items-center space-x-2 text-sm"
            title="Reset Layout"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset</span>
          </button>
          
          <button
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
          </button>
        </motion.div>
      </div>

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
          storageKey="pipboy:dashboard:layout"
          cols={12}
          rowHeight={32}
          margin={[12, 12]}
          className={editMode ? 'edit-mode' : ''}
        />
      </motion.div>
      
      <motion.footer 
        className="mt-8 text-center text-xs crt-muted space-y-1"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <div>Dashboard Kit v1.0 - Powered by React Grid Layout</div>
        <div className="flex justify-center space-x-4">
          <span>⚡ CRT Effects</span>
          <span>🎛️ Resizable Widgets</span>
          <span>💾 Auto-Save Layout</span>
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