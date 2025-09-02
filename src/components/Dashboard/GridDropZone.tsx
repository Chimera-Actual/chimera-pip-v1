// Grid Drop Zone Component for Drag and Drop
import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';

interface GridDropZoneProps {
  position: { x: number; y: number };
  panelId: string;
}

export const GridDropZone: React.FC<GridDropZoneProps> = ({ position, panelId }) => {
  const { isOver, setNodeRef } = useDroppable({
    id: `drop-zone-${position.x}-${position.y}`,
    data: {
      type: 'grid-cell',
      position,
      panelId,
    },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "min-h-[80px] border-2 border-dashed transition-all duration-200",
        isOver 
          ? "border-primary bg-primary/10 shadow-[0_0_15px_rgba(var(--primary),0.3)]" 
          : "border-transparent hover:border-primary/30"
      )}
      style={{
        gridColumn: `${position.x + 1} / span 1`,
        gridRow: `${position.y + 1} / span 1`,
      }}
    />
  );
};