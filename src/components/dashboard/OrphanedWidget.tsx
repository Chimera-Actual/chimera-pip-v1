import React from 'react';
import { AlertTriangle, X, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

interface OrphanedWidgetProps {
  widgetId: string;
  widgetType?: string;
  onRemove: (widgetId: string) => void;
  reason: 'missing-type' | 'component-not-found';
}

export default function OrphanedWidget({ 
  widgetId, 
  widgetType, 
  onRemove, 
  reason 
}: OrphanedWidgetProps) {
  const getMessage = () => {
    switch (reason) {
      case 'missing-type':
        return 'Widget configuration is incomplete';
      case 'component-not-found':
        return `Widget "${widgetType}" is no longer available`;
      default:
        return 'Widget could not be loaded';
    }
  };

  return (
    <motion.div 
      className="crt-card h-full flex flex-col overflow-hidden border-2 border-red-500/50"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-red-500/30 bg-red-500/10">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-400" />
          <span className="font-mono text-sm text-red-400 font-medium">WIDGET ERROR</span>
        </div>
        <Button
          onClick={() => onRemove(widgetId)}
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/20"
          title="Remove orphaned widget"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
      
      {/* Content */}
      <div className="flex-1 p-4 flex flex-col items-center justify-center text-center space-y-4">
        <div className="p-4 rounded-full bg-red-500/20 border border-red-500/30">
          <AlertTriangle className="w-8 h-8 text-red-400" />
        </div>
        
        <div className="space-y-2">
          <h3 className="font-mono text-sm font-bold text-red-400">
            Widget Not Found
          </h3>
          <p className="text-xs text-red-300/80 max-w-48">
            {getMessage()}
          </p>
          {widgetType && (
            <p className="text-xs font-mono text-red-400/60">
              Type: {widgetType}
            </p>
          )}
        </div>

        <Button
          onClick={() => onRemove(widgetId)}
          variant="outline"
          size="sm"
          className="border-red-500/50 text-red-400 hover:bg-red-500/20 hover:border-red-400"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Remove Widget
        </Button>
      </div>
    </motion.div>
  );
}