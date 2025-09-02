// CSS Grid-Based Widget Container with Drag and Drop
import React, { useMemo } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';

import { DashboardGridWidget } from './DashboardGridWidget';
import { GridDropZone } from './GridDropZone';
import { cn } from '@/lib/utils';
import type { DashboardLayout, Widget } from '@/types/dashboard';

interface DashboardGridProps {
  layout: DashboardLayout | null;
  onWidgetSelect: (widgetId: string | null) => void;
}

export const DashboardGrid: React.FC<DashboardGridProps> = ({
  layout,
  onWidgetSelect,
}) => {
  const { setNodeRef } = useDroppable({
    id: 'dashboard-grid',
    data: {
      type: 'grid-container',
      panelId: 'main',
    },
  });

  const widgets = layout?.widgets?.filter(w => w.panelId === 'main') || [];
  const gridCols = layout?.gridCols || 12;

  // Generate grid cells for drop zones
  const gridCells = useMemo(() => {
    const cells = [];
    const rows = Math.max(8, Math.max(...widgets.map(w => w.position.y + w.position.height)) + 2);
    
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < gridCols; x++) {
        // Check if this cell is occupied by a widget
        const isOccupied = widgets.some(widget => 
          x >= widget.position.x && 
          x < widget.position.x + widget.position.width &&
          y >= widget.position.y && 
          y < widget.position.y + widget.position.height
        );

        if (!isOccupied) {
          cells.push({ x, y });
        }
      }
    }
    return cells;
  }, [widgets, gridCols]);

  const sortableWidgetIds = widgets.map(w => w.id);

  if (!layout) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <div className="text-lg font-mono mb-2">NO ACTIVE LAYOUT</div>
          <div className="text-sm">Select or create a dashboard layout to begin</div>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={setNodeRef}
      className="h-full overflow-auto p-4"
      style={{
        background: `
          radial-gradient(circle at 25% 25%, rgba(var(--primary), 0.1) 0%, transparent 50%),
          radial-gradient(circle at 75% 75%, rgba(var(--primary), 0.05) 0%, transparent 50%)
        `,
      }}
    >
      <SortableContext items={sortableWidgetIds} strategy={rectSortingStrategy}>
        <div 
          className={cn(
            "relative min-h-full",
            "grid gap-4",
            `grid-cols-${gridCols}`
          )}
          style={{
            gridTemplateColumns: `repeat(${gridCols}, 1fr)`,
            gridAutoRows: '80px',
          }}
        >
          {/* Render drop zones */}
          {gridCells.map(({ x, y }) => (
            <GridDropZone
              key={`drop-${x}-${y}`}
              position={{ x, y }}
              panelId="main"
            />
          ))}

          {/* Render widgets */}
          {widgets.map((widget) => (
            <DashboardGridWidget
              key={widget.id}
              widget={widget}
              onSelect={onWidgetSelect}
              style={{
                gridColumn: `${widget.position.x + 1} / span ${widget.position.width}`,
                gridRow: `${widget.position.y + 1} / span ${widget.position.height}`,
              }}
            />
          ))}

          {/* Empty state when no widgets */}
          {widgets.length === 0 && (
            <div 
              className="col-span-full flex items-center justify-center min-h-[400px]"
            >
              <div className="text-center text-muted-foreground">
                <div className="text-6xl mb-4 opacity-20">⊞</div>
                <div className="text-xl font-mono mb-2">DASHBOARD EMPTY</div>
                <div className="text-sm">
                  Drag widgets from the catalog to get started
                </div>
              </div>
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
};