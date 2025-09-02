// Independent Widget Container - Complete Isolation
import React from 'react';
import { GripVertical, Maximize2, Minimize2, X, Copy } from 'lucide-react';
import { useDashboardStore } from '@/stores/dashboardStore';
import { WidgetRenderer } from '../Layout/WidgetRenderer';
import { cn } from '@/lib/utils';
import type { Widget } from '@/types/dashboard';

interface WidgetContainerProps {
  widgetId: string;
  className?: string;
  style?: React.CSSProperties;
}

export const WidgetContainer: React.FC<WidgetContainerProps> = ({
  widgetId,
  className,
  style,
}) => {
  const widget = useDashboardStore(state => state.widgets.get(widgetId));
  const selectedWidgetId = useDashboardStore(state => state.selectedWidgetId);
  const updateWidget = useDashboardStore(state => state.updateWidget);
  const removeWidget = useDashboardStore(state => state.removeWidget);
  const duplicateWidget = useDashboardStore(state => state.duplicateWidget);
  const setSelectedWidget = useDashboardStore(state => state.setSelectedWidget);

  // Widget not found - should not happen in normal operation
  if (!widget) {
    console.error(`Widget with ID ${widgetId} not found in store`);
    return (
      <div className="pip-boy-widget">
        <div className="p-4 text-center text-destructive font-mono">
          WIDGET NOT FOUND
          <div className="text-sm mt-2">ID: {widgetId}</div>
        </div>
      </div>
    );
  }

  const isSelected = selectedWidgetId === widgetId;

  const handleSelect = (e: React.MouseEvent) => {
    // Don't select if clicking on header buttons
    if ((e.target as HTMLElement).closest('button')) return;
    setSelectedWidget(isSelected ? null : widgetId);
  };

  const handleCollapse = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateWidget(widgetId, { collapsed: !widget.collapsed });
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    removeWidget(widgetId);
  };

  const handleDuplicate = (e: React.MouseEvent) => {
    e.stopPropagation();
    duplicateWidget(widgetId);
  };

  const handleSettingsUpdate = (newSettings: any) => {
    updateWidget(widgetId, { settings: newSettings });
  };

  return (
    <div 
      className={cn(
        "pip-boy-widget group relative",
        "bg-card/90 border-2 rounded-lg overflow-hidden",
        "shadow-[0_0_15px_rgba(var(--primary),0.2)]",
        "transition-all duration-200",
        isSelected 
          ? "border-primary shadow-[0_0_25px_rgba(var(--primary),0.4)]" 
          : "border-border/50 hover:border-primary/70",
        "pip-boy-scanlines",
        className
      )}
      style={style}
      onClick={handleSelect}
    >
      {/* Widget Header - Always visible */}
      <div className={cn(
        "flex items-center justify-between px-3 py-2",
        "border-b border-border/30",
        "bg-card/50 backdrop-blur-sm",
        "cursor-pointer"
      )}>
        {/* Drag Handle + Title */}
        <div 
          className={cn(
            "flex items-center gap-2 cursor-grab active:cursor-grabbing",
            "text-muted-foreground hover:text-foreground transition-colors",
            "react-grid-dragHandleClassName" // react-grid-layout drag handle
          )}
        >
          <GripVertical className="w-4 h-4" />
          <span className="font-mono text-sm uppercase tracking-wider truncate crt-glow">
            {widget.customName || widget.title}
          </span>
        </div>

        {/* Header Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleDuplicate}
            className={cn(
              "p-1 rounded text-muted-foreground hover:text-foreground",
              "hover:bg-primary/20 transition-colors"
            )}
            title="Duplicate Widget"
          >
            <Copy className="w-3 h-3" />
          </button>
          
          <button
            onClick={handleCollapse}
            className={cn(
              "p-1 rounded text-muted-foreground hover:text-foreground",
              "hover:bg-primary/20 transition-colors"
            )}
            title={widget.collapsed ? "Expand" : "Collapse"}
          >
            {widget.collapsed ? (
              <Maximize2 className="w-3 h-3" />
            ) : (
              <Minimize2 className="w-3 h-3" />
            )}
          </button>
          
          <button
            onClick={handleRemove}
            className={cn(
              "p-1 rounded text-muted-foreground hover:text-destructive",
              "hover:bg-destructive/20 transition-colors"
            )}
            title="Remove Widget"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Widget Content - Only when not collapsed */}
      {!widget.collapsed && (
        <div className="p-4 h-[calc(100%-3rem)] overflow-hidden">
          <WidgetRenderer
            widgetInstanceId={widgetId} // Use widget ID as instance ID
            widgetType={widget.type}
            settings={widget.settings}
            widgetName={widget.customName || widget.title}
            onSettingsUpdate={handleSettingsUpdate}
          />
        </div>
      )}

      {/* Selection Indicator */}
      {isSelected && (
        <div className={cn(
          "absolute inset-0 pointer-events-none",
          "border-2 border-primary/50 rounded-lg",
          "animate-pulse"
        )} />
      )}

      {/* Pip-Boy Scanlines Overlay */}
      <div className="absolute inset-0 pointer-events-none pip-boy-scanlines opacity-30" />
    </div>
  );
};