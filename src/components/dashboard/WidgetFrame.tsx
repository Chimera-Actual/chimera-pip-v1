import React, { useState, useEffect } from "react";
import { MoreVertical, GripVertical, Settings, ChevronDown } from "lucide-react";
import { motion } from "framer-motion";
import WidgetResizer from "@/components/ui/widget-resizer";

interface WidgetFrameProps {
  title: string;
  children: React.ReactNode;
  onSettings?: () => void;
  right?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  widgetId?: string;
  onCollapseChange?: (widgetId: string, collapsed: boolean) => void;
}

export default function WidgetFrame({
  title,
  children,
  onSettings,
  right,
  className = "",
  style,
  collapsible = true,
  defaultCollapsed = false,
  widgetId,
  onCollapseChange
}: WidgetFrameProps) {
  // Generate unique storage key for this widget - require widgetId for proper uniqueness
  const storageKey = `widget-${widgetId}-collapsed`;
  
  // Load initial state from localStorage or use default
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window !== 'undefined' && widgetId) {
      const saved = localStorage.getItem(storageKey);
      return saved !== null ? JSON.parse(saved) : defaultCollapsed;
    }
    return defaultCollapsed;
  });

  // Save collapse state to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined' && widgetId) {
      localStorage.setItem(storageKey, JSON.stringify(isCollapsed));
    }
  }, [isCollapsed, storageKey, widgetId]);

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
    // Notify parent grid about collapse state change
    if (widgetId && onCollapseChange) {
      onCollapseChange(widgetId, !isCollapsed);
    }
  };
  return (
    <WidgetResizer 
      collapsed={isCollapsed}
      className={`widget-frame h-full ${isCollapsed ? 'collapsed' : 'expanded'}`}
    >
      <motion.div 
        className={`crt-card flex flex-col ${
          isCollapsed ? 'widget-collapsed' : 'widget-expanded'
        } ${className}`}
        style={{
          ...style,
          height: isCollapsed ? '48px' : 'auto',
          minHeight: isCollapsed ? '48px' : '200px',
          maxHeight: isCollapsed ? '48px' : 'none'
        }}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
      >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b crt-border bg-gradient-to-r from-transparent to-[var(--crt-border)]/10 flex-shrink-0">
        <div className="flex items-center gap-2">
          <GripVertical className="w-4 h-4 opacity-70 crt-muted drag-handle cursor-move" />
          <span className="font-mono text-sm crt-text font-medium pipboy-title">{title}</span>
        </div>
        <div className="flex items-center gap-2">
          {right}
          {collapsible && (
            <button 
              onClick={toggleCollapse}
              className="p-1 rounded hover:bg-crt-bg/50 transition-all duration-200 group pipboy-hover"
              title={isCollapsed ? "Expand widget" : "Collapse widget"}
            >
              <motion.div
                animate={{ rotate: isCollapsed ? 180 : 0 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
              >
                <ChevronDown className="w-4 h-4 opacity-70 crt-muted group-hover:crt-accent group-hover:opacity-100 transition-all duration-200" />
              </motion.div>
            </button>
          )}
          {onSettings ? (
            <button 
              onClick={onSettings}
              className="p-1 rounded hover:bg-crt-bg/50 transition-colors group pipboy-hover"
              title="Widget Settings"
            >
              <Settings className="w-4 h-4 opacity-70 crt-muted group-hover:crt-accent group-hover:opacity-100" />
            </button>
          ) : (
            <MoreVertical className="w-4 h-4 opacity-70 crt-muted" />
          )}
        </div>
      </div>
      
      {/* Content - Conditionally rendered based on collapse state */}
      {!isCollapsed && (
        <div className="flex-1 overflow-hidden pipboy-panel">
          <div className="p-3">
            {children}
          </div>
        </div>
      )}
      </motion.div>
    </WidgetResizer>
  );
}