import React, { useState, useEffect } from 'react';
import { Settings, X, Plus, Menu } from 'lucide-react';
import * as Icons from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useWidgetManager, UserWidgetInstance } from '@/hooks/useWidgetManager';
import { WIDGET_COMPONENTS, WidgetComponentName } from './WidgetRegistry';
import { WidgetLibrary } from './WidgetLibrary';
import { useToast } from '@/hooks/use-toast';

interface AppletContainerProps {
  activeApplet: string;
  tabName: string;
  tabId: string;
  onAppletChange: (appletId: string) => void;
}

export const AppletContainer: React.FC<AppletContainerProps> = React.memo(({
  activeApplet,
  tabName,
  tabId,
  onAppletChange,
}) => {
  const isMobile = useIsMobile();
  const {
    getActiveWidgetsForTab,
    getAvailableWidgetsForTab,
    addWidgetToTab,
    removeWidgetFromTab,
    updateWidgetSettings,
    getWidgetSettings,
    updateWidgetName,
    updateWidgetPosition,
    moveWidgetToTab,
    addTagToWidget,
    removeTagFromWidget,
    getAllUserTags,
    loading,
    userWidgetInstances
  } = useWidgetManager();
  
  const { toast } = useToast();
  const [showWidgetLibrary, setShowWidgetLibrary] = useState(false);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [showSidebar, setShowSidebar] = useState(true);

  // Get widgets for current tab with proper state dependency
  const [widgets, setWidgets] = useState<UserWidgetInstance[]>([]);
  
  // Update widgets when userWidgetInstances changes
  useEffect(() => {
    const currentTabWidgets = getActiveWidgetsForTab(tabId);
    setWidgets(currentTabWidgets);
  }, [userWidgetInstances, tabId]);
  
  // Initialize sidebar visibility state
  useEffect(() => {
    // Auto-hide sidebar when there's only one widget, but allow manual control
    if (widgets.length <= 1) {
      setShowSidebar(false);
    }
  }, [widgets.length]);

  // Set first widget as active if none selected or current doesn't exist
  useEffect(() => {
    if (!loading && widgets.length > 0 && !widgets.find(w => w.id === activeApplet)) {
      onAppletChange(widgets[0].id);
    }
  }, [widgets, activeApplet, onAppletChange, loading]);

  const handleRemoveWidget = async (instanceId: string, widgetId: string) => {
    try {
      await removeWidgetFromTab(instanceId);
      
      // If we removed the active widget, switch to another one
      if (instanceId === activeApplet) {
        const remainingWidgets = getActiveWidgetsForTab(tabId);
        if (remainingWidgets.length > 0) {
          onAppletChange(remainingWidgets[0].id);
        }
      }
      
      toast({
        title: "Widget Removed",
        description: "Widget has been removed from this tab",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove widget",
        variant: "destructive"
      });
    }
  };

  const handleAddWidget = async (widgetId: string) => {
    try {
      await addWidgetToTab(widgetId, tabId);
      toast({
        title: "Widget Added",
        description: "Widget has been added to this tab",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add widget",
        variant: "destructive"
      });
    }
  };

  const handleDragStart = (e: React.DragEvent, widget: UserWidgetInstance) => {
    // Disable drag on mobile
    if (isMobile) {
      e.preventDefault();
      return;
    }
    
    // Add a semi-transparent drag image
    const dragImage = e.currentTarget.cloneNode(true) as HTMLElement;
    dragImage.style.opacity = '0.7';
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 0, 0);
    setTimeout(() => document.body.removeChild(dragImage), 0);
    
    // Set data for both tab transfer and reordering
    e.dataTransfer.setData('application/json', JSON.stringify({
      instanceId: widget.id,
      widgetId: widget.widget_id,
      widgetName: widget.custom_name || widget.widget_definition?.name,
      sourceTabId: tabId,
      currentPosition: widget.position
    }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverIndex(null);
    
    try {
      const dragData = JSON.parse(e.dataTransfer.getData('application/json'));
      
      // Don't allow dropping on the same tab
      if (dragData.sourceTabId === tabId) {
        return;
      }

      await moveWidgetToTab(dragData.instanceId, tabId);
      
      toast({
        title: "Widget Moved",
        description: `"${dragData.widgetName}" has been moved to this tab`,
      });
    } catch (error) {
      console.error('Error moving widget:', error);
      toast({
        title: "Error",
        description: "Failed to move widget between tabs",
        variant: "destructive"
      });
    }
  };

  const handleWidgetDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverIndex(index);
    e.dataTransfer.dropEffect = 'move';
  };

  const handleWidgetDrop = async (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverIndex(null);
    
    try {
      const dragData = JSON.parse(e.dataTransfer.getData('application/json'));
      
      // Only handle reordering within the same tab
      if (dragData.sourceTabId === tabId) {
        const sourceIndex = widgets.findIndex(w => w.id === dragData.instanceId);
        if (sourceIndex !== -1 && sourceIndex !== targetIndex) {
          // Calculate new positions
          const targetPosition = widgets[targetIndex].position;
          await updateWidgetPosition(dragData.instanceId, targetPosition);
          
          // Update all affected positions
          if (sourceIndex < targetIndex) {
            // Moving down - shift items up
            for (let i = sourceIndex + 1; i <= targetIndex; i++) {
              await updateWidgetPosition(widgets[i].id, widgets[i].position - 1);
            }
          } else {
            // Moving up - shift items down
            for (let i = targetIndex; i < sourceIndex; i++) {
              await updateWidgetPosition(widgets[i].id, widgets[i].position + 1);
            }
          }
          
          toast({
            title: "Widget Reordered",
            description: "Widget position updated successfully",
          });
        }
      }
    } catch (error) {
      console.error('Error reordering widget:', error);
      toast({
        title: "Error",
        description: "Failed to reorder widget",
        variant: "destructive"
      });
    }
  };

  const renderActiveWidget = React.useMemo(() => {
    const activeWidget = widgets.find(w => w.id === activeApplet);
    if (!activeWidget?.widget_definition) {
      return (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <Plus className="w-12 h-12 mx-auto text-muted-foreground" />
            <div className="text-responsive-base text-muted-foreground font-mono">
              No widgets available. Click the button below to add widgets.
            </div>
            <Button
              onClick={() => setShowWidgetLibrary(true)}
              variant="outline"
              className="font-mono text-responsive-sm border-dashed hover:border-primary/50 hover:bg-primary/10"
            >
              <Plus className="w-4 h-4 mr-2" />
              ADD WIDGET
            </Button>
          </div>
        </div>
      );
    }

    const ComponentName = activeWidget.widget_definition.component_name as WidgetComponentName;
    const WidgetComponent = WIDGET_COMPONENTS[ComponentName];
    
    if (!WidgetComponent) {
      return (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="text-6xl opacity-50">⚠</div>
            <div className="text-responsive-base text-muted-foreground font-mono">
              Widget component not found: {ComponentName}
            </div>
          </div>
        </div>
      );
    }

    const widgetSettings = getWidgetSettings(activeWidget.id);
    const widgetName = activeWidget.custom_name || activeWidget.widget_definition.name;
    return (
      <div className={`widget-container w-full h-full ${isMobile ? 'mobile-widget' : ''}`}>
        <WidgetComponent 
          settings={widgetSettings} 
          widgetName={widgetName}
          widgetInstanceId={activeWidget.id}
          onSettingsChange={(newSettings: Record<string, any>) => updateWidgetSettings(activeWidget.id, newSettings)}
        />
      </div>
    );
  }, [widgets, activeApplet, getWidgetSettings, updateWidgetSettings]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto"></div>
          <div className="text-sm font-mono text-muted-foreground">Loading widgets...</div>
        </div>
      </div>
    );
  }


  // Render sidebar content function to avoid duplication
  const renderSidebarContent = () => (
    <>
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-border bg-background/50">
        <h2 className={`${isMobile ? 'text-base' : 'text-lg'} font-mono text-primary uppercase tracking-wider crt-glow`}>
          {tabName} Widgets
        </h2>
      </div>

      {/* Widget List */}
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-1 p-2">
          {widgets.map((widget, index) => (
            <div
              key={widget.id}
              draggable={!isMobile}
              onDragStart={!isMobile ? (e) => handleDragStart(e, widget) : undefined}
              onDragOver={!isMobile ? (e) => handleWidgetDragOver(e, index) : undefined}
              onDrop={!isMobile ? (e) => handleWidgetDrop(e, index) : undefined}
              onDragLeave={!isMobile ? () => setDragOverIndex(null) : undefined}
              className={`rounded transition-all duration-200 hover:shadow-md relative touch-target ${
                !isMobile ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'
              } ${
                activeApplet === widget.id
                  ? 'bg-primary/20 border border-primary/50'
                  : 'border border-transparent hover:bg-muted/50 hover:border-primary/20'
              } ${
                !isMobile && dragOverIndex === index ? 'border-t-2 border-t-primary' : ''
              }`}
              title={isMobile ? "Tap to select widget" : "Drag to reorder or move to another tab"}
            >
              <div
                className={`flex items-center justify-between ${isMobile ? 'p-4' : 'p-3'} cursor-pointer`}
                onClick={() => {
                  onAppletChange(widget.id);
                  if (isMobile) {
                    setShowSidebar(false); // Auto-close sidebar on mobile after selection
                  }
                }}
              >
                <div className="flex items-center space-x-3 min-w-0 flex-1">
                  <span className={`${isMobile ? 'text-xl' : 'text-lg'}`}>
                    {(() => {
                      const widgetSettings = getWidgetSettings(widget.id);
                      const customIconName = widgetSettings?.customIcon;
                      if (customIconName && typeof customIconName === 'string') {
                        const IconComponent = (Icons as any)[customIconName] as React.ComponentType<any>;
                        if (IconComponent && typeof IconComponent === 'function') {
                          return React.createElement(IconComponent, { 
                            className: `${isMobile ? 'w-5 h-5' : 'w-4 h-4'}` 
                          });
                        }
                      }
                      return widget.widget_definition?.icon;
                    })()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className={`${isMobile ? 'text-sm' : 'text-responsive-sm'} font-mono font-medium text-foreground truncate`}>
                      {widget.custom_name || widget.widget_definition?.name}
                    </div>
                    <div className={`${isMobile ? 'text-xs' : 'text-responsive-xs'} text-muted-foreground font-mono truncate`}>
                      {widget.widget_definition?.description}
                    </div>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveWidget(widget.id, widget.widget_id);
                    }}
                    className={`opacity-70 hover:opacity-100 hover:text-destructive ${isMobile ? 'p-2 h-8 w-8 touch-target' : 'p-1 h-6 w-6'}`}
                  >
                    <X className={`${isMobile ? 'h-4 w-4' : 'h-3 w-3'}`} />
                  </Button>
                </div>
              </div>
            </div>
          ))}
          
          {/* Add Widget Button */}
          <Button
            onClick={() => {
              setShowWidgetLibrary(true);
              if (isMobile) {
                setShowSidebar(false); // Auto-close sidebar on mobile
              }
            }}
            variant="outline"
            className={`w-full mt-4 font-mono border-dashed hover:border-primary/50 hover:bg-primary/10 touch-target ${isMobile ? 'text-sm py-3' : 'text-sm'}`}
          >
            <Plus className="w-4 h-4 mr-2" />
            ADD WIDGET
          </Button>
        </div>
      </div>
    </>
  );

  return (
    <div 
      className="flex h-full overflow-hidden relative"
      onDragOver={!isMobile ? handleDragOver : undefined}
      onDrop={!isMobile ? handleDrop : undefined}
    >
      {isMobile ? (
        // Mobile: Sheet-based drawer with optimized widget display
        <>
          <Sheet open={showSidebar} onOpenChange={setShowSidebar}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-2 left-2 z-50 bg-background/90 hover:bg-background border border-border touch-target backdrop-blur-sm"
                title="Show widgets"
              >
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-full sm:w-80 bg-card border-border p-0">
              <div className="flex flex-col h-full">
                {renderSidebarContent()}
              </div>
            </SheetContent>
          </Sheet>
          
          {/* Main Content - Optimized for Mobile */}
          <div className="w-full h-full flex flex-col overflow-hidden">
            <div className="flex-1 pt-12 px-1 pb-1 min-h-0">
              <div className="w-full h-full rounded-lg overflow-hidden bg-background/50 backdrop-blur-sm border border-border/50">
                {renderActiveWidget}
              </div>
            </div>
          </div>
        </>
      ) : (
        // Desktop: Original sidebar behavior
        <>
          {/* Toggle Button - Always Available */}
          <Button
            onClick={() => setShowSidebar(!showSidebar)}
            variant="ghost"
            size="sm"
            className={`${showSidebar ? 'absolute top-4 left-56 z-50' : 'absolute top-4 left-4 z-50'} bg-background/80 hover:bg-background border border-border`}
            title={showSidebar ? "Hide sidebar" : "Show sidebar"}
          >
            <Menu className="h-4 w-4" />
          </Button>

          {/* Sidebar */}
          {showSidebar && (
            <div className="w-72 bg-card border-r border-border flex flex-col overflow-hidden transition-all duration-300 ease-in-out">
              {renderSidebarContent()}
            </div>
          )}

          {/* Main Content */}
          <div className={`flex flex-col overflow-hidden transition-all duration-300 ease-in-out ${showSidebar ? 'flex-1' : 'w-full pt-16'}`}>
            {renderActiveWidget}
          </div>
        </>
      )}

      {/* Widget Library Dialog */}
      <WidgetLibrary
        isOpen={showWidgetLibrary}
        onClose={() => setShowWidgetLibrary(false)}
        availableWidgets={getAvailableWidgetsForTab(tabId)}
        onAddWidget={handleAddWidget}
        tabCategory={tabName}
        onAddTag={addTagToWidget}
        onRemoveTag={removeTagFromWidget}
        allUserTags={getAllUserTags()}
      />
    </div>
  );
});