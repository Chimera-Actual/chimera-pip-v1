// React Grid Layout Dashboard - Complete Widget Independence
import React, { useMemo, useCallback } from 'react';
import { Responsive, WidthProvider, Layout } from 'react-grid-layout';
import { useDroppable } from '@dnd-kit/core';
import { useDashboardStore } from '@/stores/dashboardStore';
import { WidgetContainer } from './WidgetContainer';
import { cn } from '@/lib/utils';
// Import react-grid-layout styles
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const ResponsiveGridLayout = WidthProvider(Responsive);

interface ReactGridDashboardProps {
  panelId: string;
  className?: string;
}

export const ReactGridDashboard: React.FC<ReactGridDashboardProps> = ({
  panelId = 'main',
  className,
}) => {
  const widgets = useDashboardStore(state => state.widgets);
  const updateGridLayout = useDashboardStore(state => state.updateGridLayout);
  const setSelectedWidget = useDashboardStore(state => state.setSelectedWidget);

  // Make the dashboard droppable for catalog items
  const { setNodeRef, isOver } = useDroppable({
    id: 'main-dashboard',
    data: {
      type: 'dashboard',
      panelId: panelId,
    },
  });

  // Get widgets for this specific panel
  const panelWidgets = useMemo(() => {
    return Array.from(widgets.values()).filter(widget => widget.panelId === panelId);
  }, [widgets, panelId]);

  // Convert widgets to react-grid-layout format
  const gridLayout = useMemo((): Layout[] => {
    return panelWidgets.map(widget => ({
      i: widget.id, // unique key
      x: widget.position.x,
      y: widget.position.y,
      w: widget.position.w,
      h: widget.position.h,
      minW: widget.minW,
      maxW: widget.maxW,
      minH: widget.minH,
      maxH: widget.maxH,
      static: widget.static || false,
      isDraggable: widget.isDraggable,
      isResizable: widget.isResizable,
    }));
  }, [panelWidgets]);

  // Handle layout changes (drag, resize)
  const handleLayoutChange = useCallback((newLayout: Layout[]) => {
    // Only update if layout actually changed
    if (JSON.stringify(newLayout) !== JSON.stringify(gridLayout)) {
      updateGridLayout(panelId, newLayout);
    }
  }, [updateGridLayout, panelId, gridLayout]);

  // Handle drag start - deselect widget to prevent conflicts
  const handleDragStart = useCallback(() => {
    setSelectedWidget(null);
  }, [setSelectedWidget]);

  // Grid breakpoints and column configuration
  const breakpoints = { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 };
  const cols = { lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 };
  const rowHeight = 60; // Height of each grid unit

  // Show empty state if no widgets
  if (panelWidgets.length === 0) {
    return (
      <div 
        ref={setNodeRef}
        className={cn(
          "h-full flex items-center justify-center",
          "bg-background/50 border-2 border-dashed border-border/30 rounded-lg",
          "transition-colors duration-200",
          isOver ? "border-primary/50 bg-primary/5" : "",
          className
        )}
      >
        <div className="text-center text-muted-foreground font-mono">
          <div className="text-lg crt-glow mb-2">PANEL EMPTY</div>
          <div className="text-sm">Drag widgets from the catalog to begin</div>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={setNodeRef}
      className={cn(
        "h-full w-full pip-boy-grid-container",
        "relative overflow-auto transition-colors duration-200",
        isOver ? "bg-primary/5" : "",
        className
      )}
    >
      <ResponsiveGridLayout
        className="layout"
        layouts={{ lg: gridLayout }}
        breakpoints={breakpoints}
        cols={cols}
        rowHeight={rowHeight}
        onLayoutChange={handleLayoutChange}
        onDragStart={handleDragStart}
        isDraggable={true}
        isResizable={true}
        margin={[8, 8]} // Gap between widgets
        containerPadding={[8, 8]} // Padding around grid
        useCSSTransforms={true}
        preventCollision={false}
        autoSize={true}
        dragHandleClassName="react-grid-dragHandleClassName" // Only drag by handle
        resizeHandles={['se', 'sw', 'ne', 'nw']} // Corner resize handles
      >
        {panelWidgets.map((widget) => (
          <div key={widget.id}>
            <WidgetContainer widgetId={widget.id} />
          </div>
        ))}
      </ResponsiveGridLayout>

      <style dangerouslySetInnerHTML={{
        __html: `
          /* Pip-Boy Widget Styling */
          .pip-boy-widget {
            background: hsl(var(--card));
            border: 1px solid hsl(var(--primary) / 0.6);
            border-radius: 8px;
            box-shadow: 0 0 20px hsl(var(--primary) / 0.3);
            color: hsl(var(--foreground));
            font-family: 'Share Tech Mono', monospace;
            position: relative;
            overflow: hidden;
          }
          
          .pip-boy-widget:hover {
            border-color: hsl(var(--primary));
            box-shadow: 0 0 25px hsl(var(--primary) / 0.4);
          }
          
          .pip-boy-scanlines::before {
            content: '';
            position: absolute;
            top: 0; left: 0; right: 0; bottom: 0;
            background: repeating-linear-gradient(
              0deg,
              transparent,
              transparent 2px,
              hsla(var(--theme-hue), 100%, 50%, 0.03) 2px,
              hsla(var(--theme-hue), 100%, 50%, 0.03) 4px
            );
            pointer-events: none;
            z-index: 1;
          }
        `
      }} />
    </div>
  );
};