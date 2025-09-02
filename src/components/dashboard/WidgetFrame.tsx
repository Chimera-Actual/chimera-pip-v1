import React from "react";
import { MoreVertical, GripVertical, Settings } from "lucide-react";
import { motion } from "framer-motion";

interface WidgetFrameProps {
  title: string;
  children: React.ReactNode;
  onSettings?: () => void;
  right?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export default function WidgetFrame({
  title,
  children,
  onSettings,
  right,
  className = "",
  style
}: WidgetFrameProps) {
  return (
    <motion.div 
      className={`crt-card h-full flex flex-col overflow-hidden ${className}`}
      style={style}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b crt-border bg-gradient-to-r from-transparent to-[var(--crt-border)]/10">
        <div className="flex items-center gap-2">
          <GripVertical className="w-4 h-4 opacity-70 crt-muted drag-handle cursor-move" />
          <span className="font-mono text-sm crt-text font-medium">{title}</span>
        </div>
        <div className="flex items-center gap-2">
          {right}
          {onSettings ? (
            <button 
              onClick={onSettings}
              className="p-1 rounded hover:bg-crt-bg/50 transition-colors group"
              title="Widget Settings"
            >
              <MoreVertical className="w-4 h-4 opacity-70 crt-muted group-hover:crt-accent group-hover:opacity-100" />
            </button>
          ) : (
            <MoreVertical className="w-4 h-4 opacity-70 crt-muted" />
          )}
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-1 p-3 overflow-hidden">
        {children}
      </div>
    </motion.div>
  );
}