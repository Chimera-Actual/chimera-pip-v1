import React, { useRef, useCallback, useState } from 'react';
import { cn } from '@/lib/utils';

interface WidgetResizerProps {
  children: React.ReactNode;
  className?: string;
  onResize?: (width: number, height: number) => void;
  disabled?: boolean;
  collapsed?: boolean;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
}

type ResizeDirection = 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'nw';

export default function WidgetResizer({
  children,
  className = '',
  onResize,
  disabled = false,
  collapsed = false,
  minWidth = 100,
  minHeight = 60,
  maxWidth = Infinity,
  maxHeight = Infinity
}: WidgetResizerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState<ResizeDirection | null>(null);

  const startResize = useCallback((direction: ResizeDirection, e: React.MouseEvent) => {
    if (disabled || !containerRef.current) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    setIsResizing(true);
    setResizeDirection(direction);
    
    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = rect.width;
    const startHeight = rect.height;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!container) return;

      let newWidth = startWidth;
      let newHeight = startHeight;
      
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;

      // Handle width changes
      if (direction.includes('e')) {
        newWidth = Math.max(minWidth, Math.min(maxWidth, startWidth + deltaX));
      } else if (direction.includes('w')) {
        newWidth = Math.max(minWidth, Math.min(maxWidth, startWidth - deltaX));
      }

      // Handle height changes (only if not collapsed)
      if (!collapsed) {
        if (direction.includes('s')) {
          newHeight = Math.max(minHeight, Math.min(maxHeight, startHeight + deltaY));
        } else if (direction.includes('n')) {
          newHeight = Math.max(minHeight, Math.min(maxHeight, startHeight - deltaY));
        }
      }

      // Apply the new dimensions
      container.style.width = `${newWidth}px`;
      if (!collapsed) {
        container.style.height = `${newHeight}px`;
      }

      onResize?.(newWidth, newHeight);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      setResizeDirection(null);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = getCursorForDirection(direction);
    document.body.style.userSelect = 'none';
  }, [disabled, collapsed, minWidth, minHeight, maxWidth, maxHeight, onResize]);

  const getCursorForDirection = (direction: ResizeDirection): string => {
    const cursors = {
      n: 'ns-resize',
      ne: 'nesw-resize',
      e: 'ew-resize',
      se: 'nwse-resize',
      s: 'ns-resize',
      sw: 'nesw-resize',
      w: 'ew-resize',
      nw: 'nwse-resize'
    };
    return cursors[direction];
  };

  // Determine which handles to show based on collapsed state
  const visibleHandles: ResizeDirection[] = collapsed 
    ? ['e', 'w'] // Only horizontal resize when collapsed
    : ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw']; // All handles when expanded

  return (
    <div 
      ref={containerRef}
      className={cn(
        'widget-resizer relative',
        {
          'widget-resizing': isResizing,
          'widget-resize-disabled': disabled,
          'collapsed': collapsed
        },
        className
      )}
      style={{
        height: collapsed ? '48px' : 'auto',
        maxHeight: collapsed ? '48px' : 'none'
      }}
    >
      {children}
      
      {!disabled && visibleHandles.map(direction => (
        <div
          key={direction}
          className={cn(
            'widget-resize-handle',
            `widget-resize-handle-${direction}`,
            {
              'widget-resize-handle-active': resizeDirection === direction
            }
          )}
          style={{ cursor: getCursorForDirection(direction) }}
          onMouseDown={(e) => startResize(direction, e)}
        />
      ))}
    </div>
  );
}