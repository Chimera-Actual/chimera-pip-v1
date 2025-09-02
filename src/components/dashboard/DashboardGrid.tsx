import React, { useEffect, useState, useMemo, useCallback } from "react";
import RGL, { WidthProvider, type Layout } from "react-grid-layout";
import classNames from "classnames";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import "@/styles/crt.css";

const Grid = WidthProvider(RGL);

// Enhanced GridItem type to support widget types
export type GridItem = {
  id: string;
  widgetType?: string;
  w?: number;
  h?: number;
  x?: number;
  y?: number;
  minW?: number;
  minH?: number;
  maxW?: number;
  maxH?: number;
  static?: boolean;
};

interface DashboardGridProps {
  items: GridItem[];
  renderItem: (id: string, onCollapseChange?: (widgetId: string, collapsed: boolean) => void) => React.ReactNode;
  storageKey?: string;
  cols?: number;
  rowHeight?: number;
  editable?: boolean;
  margin?: [number, number];
  containerPadding?: [number, number];
  onLayoutChange?: (layout: Layout[]) => void;
  onWidgetCollapse?: (widgetId: string, collapsed: boolean) => void;
  className?: string;
}

export default function DashboardGrid({
  items,
  renderItem,
  storageKey = "dashboard:layout",
  cols = 12,
  rowHeight = 24,
  editable = true,
  margin = [8, 8],
  containerPadding = [0, 0],
  onLayoutChange,
  onWidgetCollapse,
  className = ""
}: DashboardGridProps) {
  // Track collapsed widgets
  const [collapsedWidgets, setCollapsedWidgets] = useState<Set<string>>(new Set());
  const [layout, setLayout] = useState<Layout[]>(() => {
    try {
      const cached = localStorage.getItem(storageKey);
      if (cached) {
        const parsedLayout = JSON.parse(cached);
        // Validate that all current items have layout entries
        const layoutIds = new Set(parsedLayout.map((l: Layout) => l.i));
        const hasAllItems = items.every(item => layoutIds.has(item.id));
        if (hasAllItems) {
          return parsedLayout;
        }
      }
    } catch (error) {
      console.warn("Failed to parse cached layout:", error);
    }

    // Generate default layout
    return items.map((item, index) => ({
      i: item.id,
      x: (index % 3) * 4,
      y: Math.floor(index / 3) * 4,
      w: item.w ?? 4,
      h: item.h ?? 6,
      minW: item.minW,
      minH: item.minH,
      maxW: item.maxW,
      maxH: item.maxH,
      static: item.static ?? false,
    }));
  });

  // Memoize layout data to prevent unnecessary re-renders
  const memoizedLayoutData = useMemo(() => {
    return items.map(item => {
      const existingLayout = layout.find(l => l.i === item.id);
      const isCollapsed = collapsedWidgets.has(item.id);
      
      if (existingLayout) {
        return {
          ...existingLayout,
          // Adjust height for collapsed widgets - collapsed widgets take 2 grid units (48px)
          h: isCollapsed ? 2 : (existingLayout.h || item.h || 6)
        };
      }
      
      // Create layout for new items
      return {
        i: item.id,
        x: 0,
        y: Infinity, // This will place new items at the bottom
        w: item.w ?? 4,
        h: isCollapsed ? 2 : (item.h ?? 6),
        minW: item.minW,
        minH: isCollapsed ? 2 : (item.minH || 2),
        maxW: item.maxW,
        maxH: item.maxH,
        static: item.static ?? false,
      };
    });
  }, [items, layout, collapsedWidgets]);

  // Handle widget collapse/expand
  const handleWidgetCollapse = useCallback((widgetId: string, collapsed: boolean) => {
    setCollapsedWidgets(prev => {
      const newSet = new Set(prev);
      if (collapsed) {
        newSet.add(widgetId);
      } else {
        newSet.delete(widgetId);
      }
      return newSet;
    });
    onWidgetCollapse?.(widgetId, collapsed);
  }, [onWidgetCollapse]);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(layout));
    } catch (error) {
      console.warn("Failed to save layout to localStorage:", error);
    }
  }, [layout, storageKey]);

  const handleLayoutChange = useCallback((newLayout: Layout[]) => {
    setLayout(newLayout);
    onLayoutChange?.(newLayout);
  }, [onLayoutChange]);

  return (
    <div className={classNames("dashboard-grid", className)}>
      <Grid
        className="layout"
        layout={memoizedLayoutData}
        cols={cols}
        rowHeight={rowHeight}
        margin={margin}
        containerPadding={containerPadding}
        isResizable={false}
        isDraggable={editable}
        onLayoutChange={handleLayoutChange}
        draggableHandle=".drag-handle"
        useCSSTransforms={true}
        compactType="vertical"
        preventCollision={false}
      >
        {items.map(item => (
          <div 
            key={item.id} 
            className={`grid-item ${collapsedWidgets.has(item.id) ? 'collapsed' : 'expanded'}`}
          >
            {renderItem(item.id, handleWidgetCollapse)}
          </div>
        ))}
      </Grid>
    </div>
  );
}