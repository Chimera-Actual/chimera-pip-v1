// Individual Widget Component with Drag, Resize, and Pip-Boy Styling
import React, { CSSProperties } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Maximize2, Minimize2, X } from 'lucide-react';

import { useDashboardStore } from '@/stores/dashboardStore';
import { WidgetRenderer } from '../Layout/WidgetRenderer';
import { cn } from '@/lib/utils';
import type { Widget } from '@/types/dashboard';

interface DashboardGridWidgetProps {
  widget: Widget;
  onSelect: (widgetId: string | null) => void;
  style?: CSSProperties;
}

export const DashboardGridWidget: React.FC<DashboardGridWidgetProps> = ({
  widget,
  onSelect,
  style,
}) => {
  const { 
    selectedWidget, 
    removeWidget, 
    toggleWidgetCollapse,
    updateWidgetSettings 
  } = useDashboardStore();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: widget.id,
    data: {
      type: 'widget',
      widget,
    },
    disabled: !widget.isDraggable,
  });

  const dragStyle = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  const isSelected = selectedWidget === widget.id;

  const handleSelect = () => {
    onSelect(isSelected ? null : widget.id);
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    removeWidget(widget.id);
  };

  const handleToggleCollapse = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleWidgetCollapse(widget.id);
  };

  const handleSettingsUpdate = (newSettings: any) => {
    updateWidgetSettings(widget.id, newSettings);
  };

  if (isDragging) {
    return (
      <div 
        ref={setNodeRef}
        style={{ ...style, ...dragStyle }}
        className="opacity-50"
      />
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={{ ...style, ...dragStyle }}
      className={cn(
        "group relative",
        "bg-card/90 border-2 rounded-lg overflow-hidden",
        "shadow-[0_0_15px_rgba(var(--primary),0.2)]",
        "transition-all duration-200",
        isSelected 
          ? "border-primary shadow-[0_0_25px_rgba(var(--primary),0.4)]" 
          : "border-border/50 hover:border-primary/70",
        "pip-boy-scanlines"
      )}
      onClick={handleSelect}
    >
      {/* Widget Header */}
      <div className={cn(
        "flex items-center justify-between px-3 py-2",
        "border-b border-border/30",
        "bg-card/50 backdrop-blur-sm"
      )}>
        {/* Drag Handle */}
        <div 
          {...attributes}
          {...listeners}
          className={cn(
            "flex items-center gap-2 cursor-grab active:cursor-grabbing",
            "text-muted-foreground hover:text-foreground transition-colors"
          )}
        >
          <GripVertical className="w-4 h-4" />
          <span className="font-mono text-sm uppercase tracking-wider truncate">
            {widget.customName || widget.title}
          </span>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleToggleCollapse}
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

      {/* Widget Content */}
      {!widget.collapsed && (
        <div className="p-4 h-[calc(100%-3rem)] overflow-hidden">
          <WidgetRenderer
            widgetInstanceId={widget.widgetInstanceId}
            widgetType={widget.type}
            settings={widget.settings}
            widgetName={widget.customName || widget.title}
            onSettingsUpdate={handleSettingsUpdate}
          />
        </div>
      )}

      {/* Resize Handles (when selected) */}
      {isSelected && widget.isResizable && (
        <>
          {/* Corner resize handle */}
          <div className={cn(
            "absolute bottom-0 right-0 w-4 h-4",
            "bg-primary/50 cursor-se-resize",
            "hover:bg-primary transition-colors",
            "border-l border-t border-primary/30"
          )} />
          
          {/* Edge resize handles */}
          <div className={cn(
            "absolute bottom-0 left-4 right-4 h-1",
            "bg-primary/20 cursor-s-resize hover:bg-primary/40"
          )} />
          <div className={cn(
            "absolute top-4 bottom-4 right-0 w-1",
            "bg-primary/20 cursor-e-resize hover:bg-primary/40"
          )} />
        </>
      )}

      {/* Selection indicator */}
      {isSelected && (
        <div className={cn(
          "absolute inset-0 pointer-events-none",
          "border-2 border-primary/50 rounded-lg",
          "animate-pulse"
        )} />
      )}
    </div>
  );
};