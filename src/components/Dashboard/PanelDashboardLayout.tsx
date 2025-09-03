// Panel-Based Dashboard Layout with React Resizable Panels
import React, { useEffect } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { ErrorBoundary } from 'react-error-boundary';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent } from '@dnd-kit/core';
import { useState } from 'react';

import { useDashboardStore } from '@/stores/dashboardStore';
import { useAuth } from '@/hooks/useAuth';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { ReactGridDashboard } from './ReactGridDashboard';
import { WidgetCatalogPanel } from './WidgetCatalogPanel';
import { WidgetPropertiesPanel } from './WidgetPropertiesPanel';
import { DashboardHeader } from './DashboardHeader';
import { CrossPanelDropZone } from './CrossPanelDropZone';
import { PipBoyErrorFallback } from '../ui/PipBoyErrorFallback';
import { cn } from '@/lib/utils';
import type { DragItem } from '@/types/dashboard';

export const PanelDashboardLayout: React.FC = () => {
  const { user } = useAuth();
  const { 
    currentLayout, 
    loadLayouts, 
    isLoading, 
    error,
    addWidget,
    moveWidget,
    setSelectedWidget,
  } = useDashboardStore();

  const [activeId, setActiveId] = useState<string | null>(null);
  const [dragItem, setDragItem] = useState<DragItem | null>(null);

  // Initialize keyboard shortcuts
  useKeyboardShortcuts();

  // Load layouts when user is available
  useEffect(() => {
    if (user?.id) {
      loadLayouts();
    }
  }, [user?.id, loadLayouts]);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);
    
    // Get drag item data from active element
    const dragData = active.data.current as DragItem;
    setDragItem(dragData);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || !dragItem) {
      setActiveId(null);
      setDragItem(null);
      return;
    }

    const overId = over.id as string;
    const overData = over.data.current;

    // Handle dropping widget from catalog or moving widgets
    if (dragItem.type === 'catalog-item') {
      const catalogItem = dragItem.data as any;
      // Drop on main dashboard area
      if (overId === 'main-dashboard' || overData?.panelId === 'main') {
        addWidget(catalogItem.id, 'main', {
          x: 0,
          y: 0,
          w: catalogItem.defaultSize?.w || 2,
          h: catalogItem.defaultSize?.h || 2,
        });
      }
    }

    // Handle cross-panel widget movement
    if (dragItem?.type === 'widget' && overData?.type === 'panel-drop') {
      const widget = dragItem.data as any;
      const newPanelId = overData.panelId;
      
      moveWidget(widget.id, {
        x: 0,
        y: 0,
        w: widget.position.w,
        h: widget.position.h,
      }, newPanelId);
    }

    setActiveId(null);
    setDragItem(null);
  };

  const handleDragCancel = () => {
    setActiveId(null);
    setDragItem(null);
  };

  if (isLoading) {
    return (
      <div className="h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-mono mb-4">INITIALIZING DASHBOARD</div>
          <div className="text-sm text-muted-foreground">Loading layout configurations...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center text-destructive">
          <div className="text-xl font-mono mb-2">SYSTEM ERROR</div>
          <div className="text-sm">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary FallbackComponent={PipBoyErrorFallback}>
      <div className="h-screen bg-background text-foreground font-mono pip-boy-scanlines overflow-hidden">
        <DndContext 
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          {/* Dashboard Header */}
          <DashboardHeader />

          {/* Main Panel Layout */}
          <div className="h-[calc(100vh-4rem)]">
            <PanelGroup 
              direction="horizontal" 
              autoSaveId="chimera-dashboard"
              className="h-full"
            >
              {/* Left Sidebar - Widget Catalog */}
              <Panel
                defaultSize={20}
                minSize={15}
                maxSize={30}
                collapsible
                className={cn(
                  "border-r border-border/50",
                  "bg-card/20 relative"
                )}
              >
                <ErrorBoundary FallbackComponent={PipBoyErrorFallback}>
                  <WidgetCatalogPanel />
                  <CrossPanelDropZone 
                    panelId="sidebar-left" 
                    panelName="Widget Catalog"
                    isActive={!!dragItem && dragItem.type === 'widget'}
                  />
                </ErrorBoundary>
              </Panel>

              <PanelResizeHandle className="w-1 bg-primary/30 hover:bg-primary/50 transition-colors" />

              {/* Main Dashboard Area */}
              <Panel
                defaultSize={60}
                minSize={40}
                className="bg-background relative"
              >
                <ErrorBoundary FallbackComponent={PipBoyErrorFallback}>
                  <ReactGridDashboard 
                    panelId="main"
                    className="h-full"
                  />
                </ErrorBoundary>
              </Panel>

              <PanelResizeHandle className="w-1 bg-primary/30 hover:bg-primary/50 transition-colors" />

              {/* Right Sidebar - Properties */}
              <Panel
                defaultSize={20}
                minSize={15}
                maxSize={30}
                collapsible
                className={cn(
                  "border-l border-border/50",
                  "bg-card/20 relative"
                )}
              >
                <ErrorBoundary FallbackComponent={PipBoyErrorFallback}>
                  <WidgetPropertiesPanel />
                  <CrossPanelDropZone 
                    panelId="sidebar-right" 
                    panelName="Properties Panel"
                    isActive={!!dragItem && dragItem.type === 'widget'}
                  />
                </ErrorBoundary>
              </Panel>
            </PanelGroup>
          </div>

          {/* Drag Overlay */}
          <DragOverlay>
          {activeId && dragItem ? (
            <div className="
              bg-card/90 border-2 border-primary/50 rounded-lg 
              shadow-[0_0_20px_rgba(var(--primary),0.3)] 
              p-4 pointer-events-none
              transform rotate-3 scale-105
            ">
              <div className="text-sm font-mono text-foreground">
                {(dragItem.data as any)?.name || (dragItem.data as any)?.title || 'Widget'}
              </div>
            </div>
          ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </ErrorBoundary>
  );
};