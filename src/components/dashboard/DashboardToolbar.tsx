import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Settings, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCRT, type Theme } from "@/lib/CRTTheme";

interface DashboardToolbarProps {
  onUndo?: () => void;
  canUndo?: boolean;
  undoCount?: number;
}

const DashboardSettings = React.memo(() => {
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
});

DashboardSettings.displayName = "DashboardSettings";

export const DashboardToolbar = React.memo<DashboardToolbarProps>(({
  onUndo,
  canUndo,
  undoCount
}) => {
  return (
    <motion.div 
      className="flex items-center gap-3"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
    >
      <DashboardSettings />
      
      {canUndo && (
        <Button
          onClick={onUndo}
          variant="outline"
          className="px-3 py-2 rounded flex items-center space-x-2 text-sm"
          title={`Undo (${undoCount} changes available)`}
        >
          <span>Undo</span>
        </Button>
      )}
    </motion.div>
  );
});

DashboardToolbar.displayName = "DashboardToolbar";