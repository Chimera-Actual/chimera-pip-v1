// Resizable Widget Component with Handles
import React, { useState, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import type { Widget } from '@/types/dashboard';

interface ResizeHandle {
  direction: 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';
  cursor: string;
  className: string;
}

const RESIZE_HANDLES: ResizeHandle[] = [
  { direction: 'n', cursor: 'ns-resize', className: 'top-0 left-2 right-2 h-1' },
  { direction: 's', cursor: 'ns-resize', className: 'bottom-0 left-2 right-2 h-1' },
  { direction: 'e', cursor: 'ew-resize', className: 'right-0 top-2 bottom-2 w-1' },
  { direction: 'w', cursor: 'ew-resize', className: 'left-0 top-2 bottom-2 w-1' },
  { direction: 'ne', cursor: 'ne-resize', className: 'top-0 right-0 w-3 h-3' },
  { direction: 'nw', cursor: 'nw-resize', className: 'top-0 left-0 w-3 h-3' },
  { direction: 'se', cursor: 'se-resize', className: 'bottom-0 right-0 w-3 h-3' },
  { direction: 'sw', cursor: 'sw-resize', className: 'bottom-0 left-0 w-3 h-3' },
];

interface ResizableWidgetProps {
  widget: Widget;
  children: React.ReactNode;
  isSelected: boolean;
  onResize: (widgetId: string, newSize: { w: number; h: number }) => void;
  className?: string;
  style?: React.CSSProperties;
}

export const ResizableWidget: React.FC<ResizableWidgetProps> = ({
  widget,
  children,
  isSelected,
  onResize,
  className,
  style,
}) => {
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const startPosRef = useRef({ x: 0, y: 0 });
  const startSizeRef = useRef({ width: 0, height: 0 });

  const handleResizeStart = useCallback((direction: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsResizing(true);
    setResizeDirection(direction);
    
    startPosRef.current = { x: e.clientX, y: e.clientY };
    startSizeRef.current = {
  width: widget.position.w,
  height: widget.position.h,
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      
      const deltaX = e.clientX - startPosRef.current.x;
      const deltaY = e.clientY - startPosRef.current.y;
      
      let newWidth = startSizeRef.current.width;
      let newHeight = startSizeRef.current.height;

      // Calculate new dimensions based on resize direction
      if (direction.includes('e')) newWidth += Math.round(deltaX / 80); // 80px per grid cell
      if (direction.includes('w')) newWidth -= Math.round(deltaX / 80);
      if (direction.includes('s')) newHeight += Math.round(deltaY / 80);
      if (direction.includes('n')) newHeight -= Math.round(deltaY / 80);

  // Apply size constraints
  const minWidth = (widget.minW || 1);
  const minHeight = (widget.minH || 1);
  const maxWidth = (widget.maxW || 8);
  const maxHeight = (widget.maxH || 8);

      newWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
      newHeight = Math.max(minHeight, Math.min(maxHeight, newHeight));

      if (newWidth !== widget.position.w || newHeight !== widget.position.h) {
        onResize(widget.id, { w: newWidth, h: newHeight });
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      setResizeDirection(null);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [widget, onResize, isResizing]);

  if (!widget.isResizable || !isSelected) {
    return (
      <div 
        ref={containerRef}
        className={className}
        style={style}
      >
        {children}
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={cn(className, "relative")}
      style={style}
    >
      {children}
      
      {/* Resize Handles */}
      {RESIZE_HANDLES.map(({ direction, cursor, className: handleClassName }) => (
        <div
          key={direction}
          className={cn(
            "absolute z-10",
            "bg-primary/20 hover:bg-primary/40 transition-colors",
            "border border-primary/30",
            handleClassName,
            isResizing && resizeDirection === direction && "bg-primary/60"
          )}
          style={{ cursor }}
          onMouseDown={(e) => handleResizeStart(direction, e)}
        />
      ))}

      {/* Resize indicator */}
      {isResizing && (
        <div className={cn(
          "absolute inset-0 pointer-events-none",
          "border-2 border-primary border-dashed",
          "bg-primary/10 animate-pulse"
        )} />
      )}
    </div>
  );
};