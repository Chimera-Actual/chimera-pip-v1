import React, { useEffect, useState, useMemo, useCallback } from "react";
import RGL, { WidthProvider, type Layout } from "react-grid-layout";
import classNames from "classnames";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import "@/styles/crt.css";
import AddWidgetPlaceholder from "./AddWidgetPlaceholder";

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
  renderItem: (id: string) => React.ReactNode;
  storageKey?: string;
  cols?: number;
  rowHeight?: number;
  editable?: boolean;
  margin?: [number, number];
  containerPadding?: [number, number];
  onLayoutChange?: (layout: Layout[]) => void;
  onAddWidget?: () => void;
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
  onAddWidget,
  className = ""
}: DashboardGridProps) {
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
  const layoutData = useMemo(() => {
    return items.map(item => {
      const existingLayout = layout.find(l => l.i === item.id);
      if (existingLayout) {
        return existingLayout;
      }
      // Create layout for new items
      return {
        i: item.id,
        x: 0,
        y: Infinity, // This will place new items at the bottom
        w: item.w ?? 4,
        h: item.h ?? 6,
        minW: item.minW,
        minH: item.minH,
        maxW: item.maxW,
        maxH: item.maxH,
        static: item.static ?? false,
      };
    });
  }, [items, layout]);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(layout));
    } catch (error) {
      console.warn("Failed to save layout to localStorage:", error);
    }
  }, [layout, storageKey]);

  const handleLayoutChange = useCallback((newLayout: Layout[]) => {
    // Filter out placeholder items from the layout before saving
    const filteredLayout = newLayout.filter(item => !item.i.startsWith('placeholder-'));
    setLayout(filteredLayout);
    onLayoutChange?.(filteredLayout);
  }, [onLayoutChange]);

  // Calculate empty spaces and add placeholder items
  const itemsWithPlaceholders = useMemo(() => {
    if (!onAddWidget) return items;
    
    const occupiedSpaces = new Set<string>();
    layoutData.forEach(item => {
      for (let x = item.x; x < item.x + item.w; x++) {
        for (let y = item.y; y < item.y + item.h; y++) {
          occupiedSpaces.add(`${x}-${y}`);
        }
      }
    });

    // Find empty 2x2 spaces
    const placeholders: GridItem[] = [];
    const maxY = Math.max(...layoutData.map(item => item.y + item.h), 0);
    
    for (let y = 0; y <= maxY + 2; y++) {
      for (let x = 0; x <= cols - 2; x++) {
        let canPlace = true;
        for (let dx = 0; dx < 2; dx++) {
          for (let dy = 0; dy < 2; dy++) {
            if (occupiedSpaces.has(`${x + dx}-${y + dy}`)) {
              canPlace = false;
              break;
            }
          }
          if (!canPlace) break;
        }
        
        if (canPlace && placeholders.length < 3) {
          placeholders.push({ 
            id: `placeholder-${x}-${y}`,
            widgetType: 'AddWidgetPlaceholder',
            w: 2, 
            h: 2, 
            x, 
            y,
            static: true
          });
          // Mark this space as occupied to prevent overlapping placeholders
          for (let dx = 0; dx < 2; dx++) {
            for (let dy = 0; dy < 2; dy++) {
              occupiedSpaces.add(`${x + dx}-${y + dy}`);
            }
          }
        }
      }
    }

    return [...items, ...placeholders];
  }, [items, layoutData, cols, onAddWidget]);

  // Update layoutData to include placeholders
  const finalLayoutData = useMemo(() => {
    return itemsWithPlaceholders.map(item => {
      const existingLayout = layout.find(l => l.i === item.id);
      if (existingLayout) {
        return existingLayout;
      }
      // Create layout for new items
      return {
        i: item.id,
        x: item.x ?? 0,
        y: item.y ?? Infinity,
        w: item.w ?? 4,
        h: item.h ?? 6,
        minW: item.minW,
        minH: item.minH,
        maxW: item.maxW,
        maxH: item.maxH,
        static: item.static ?? false,
      };
    });
  }, [itemsWithPlaceholders, layout]);

  return (
    <div className={classNames("dashboard-grid", className)}>
      <Grid
        className="layout"
        layout={finalLayoutData}
        cols={cols}
        rowHeight={rowHeight}
        margin={margin}
        containerPadding={containerPadding}
        isResizable={editable}
        isDraggable={editable}
        onLayoutChange={handleLayoutChange}
        draggableHandle=".drag-handle"
        useCSSTransforms={true}
        compactType="vertical"
        preventCollision={false}
      >
        {itemsWithPlaceholders.map(item => (
          <div key={item.id} className="grid-item">
            {item.widgetType === 'AddWidgetPlaceholder' ? (
              <AddWidgetPlaceholder onClick={onAddWidget!} />
            ) : (
              renderItem(item.id)
            )}
          </div>
        ))}
      </Grid>
    </div>
  );
}