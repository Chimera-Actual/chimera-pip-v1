// Cross-Panel Drop Zone for Widget Movement
import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CrossPanelDropZoneProps {
  panelId: string;
  panelName: string;
  isActive: boolean;
}

export const CrossPanelDropZone: React.FC<CrossPanelDropZoneProps> = ({
  panelId,
  panelName,
  isActive,
}) => {
  const { isOver, setNodeRef } = useDroppable({
    id: `panel-drop-${panelId}`,
    data: {
      type: 'panel-drop',
      panelId,
    },
  });

  if (!isActive) return null;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "absolute inset-4 z-20",
        "border-4 border-dashed rounded-lg",
        "flex items-center justify-center",
        "transition-all duration-200",
        "pointer-events-auto",
        isOver 
          ? "border-primary bg-primary/20 shadow-[0_0_30px_rgba(var(--primary),0.4)]" 
          : "border-primary/40 bg-primary/5"
      )}
    >
      <div className="text-center">
        <div className={cn(
          "w-16 h-16 mx-auto mb-3 rounded-full",
          "flex items-center justify-center",
          "border-2 border-dashed",
          isOver ? "border-primary bg-primary/20" : "border-primary/50"
        )}>
          <Plus className={cn(
            "w-8 h-8",
            isOver ? "text-primary" : "text-primary/70"
          )} />
        </div>
        <div className={cn(
          "font-mono text-sm font-semibold mb-1",
          isOver ? "text-primary" : "text-primary/70"
        )}>
          DROP HERE
        </div>
        <div className={cn(
          "font-mono text-xs",
          isOver ? "text-primary/80" : "text-primary/50"
        )}>
          Add to {panelName}
        </div>
      </div>
    </div>
  );
};