import React, { useState, useEffect } from 'react';
import { AppletType } from './PipBoyLayout';
import { Settings, X, Plus, Edit, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWidgetManager, UserWidgetInstance } from '@/hooks/useWidgetManager';
import { WIDGET_COMPONENTS, WidgetComponentName } from './WidgetRegistry';
import { WidgetLibrary } from './WidgetLibrary';
import { WidgetSettings } from './WidgetSettings';
import { WidgetRenameDialog } from './WidgetRenameDialog';
import { useToast } from '@/hooks/use-toast';

interface AppletContainerProps {
  activeApplet: string;
  tabName: string;
  tabId: string;
  onAppletChange: (appletId: string) => void;
}

export const AppletContainer: React.FC<AppletContainerProps> = ({
  activeApplet,
  tabName,
  tabId,
  onAppletChange,
}) => {
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
    loading,
    userWidgetInstances
  } = useWidgetManager();
  
  const { toast } = useToast();
  const [showWidgetLibrary, setShowWidgetLibrary] = useState(false);
  const [showWidgetSettings, setShowWidgetSettings] = useState(false);
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [selectedWidgetForSettings, setSelectedWidgetForSettings] = useState<UserWidgetInstance | null>(null);
  const [selectedWidgetForRename, setSelectedWidgetForRename] = useState<UserWidgetInstance | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [showSidebar, setShowSidebar] = useState(true);

  // Get widgets for current tab directly from the hook
  const widgets = getActiveWidgetsForTab(tabId);
  
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

  const handleOpenWidgetSettings = (widget: UserWidgetInstance) => {
    setSelectedWidgetForSettings(widget);
    setShowWidgetSettings(true);
  };

  const handleCloseWidgetSettings = () => {
    setShowWidgetSettings(false);
    setSelectedWidgetForSettings(null);
  };

  const handleOpenWidgetRename = (widget: UserWidgetInstance) => {
    setSelectedWidgetForRename(widget);
    setShowRenameDialog(true);
  };

  const handleCloseWidgetRename = () => {
    setShowRenameDialog(false);
    setSelectedWidgetForRename(null);
  };

  const handleWidgetRename = async (instanceId: string, newName: string) => {
    try {
      await updateWidgetName(instanceId, newName);
      toast({
        title: "Widget Renamed",
        description: "Widget name has been updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to rename widget",
        variant: "destructive"
      });
    }
  };

  const handleDragStart = (e: React.DragEvent, widget: UserWidgetInstance) => {
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

  const renderActiveWidget = () => {
    const activeWidget = widgets.find(w => w.id === activeApplet);
    if (!activeWidget?.widget_definition) {
      return (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <Plus className="w-12 h-12 mx-auto text-muted-foreground" />
            <div className="text-muted-foreground font-mono">
              No widgets available. Click the button below to add widgets.
            </div>
            <Button
              onClick={() => setShowWidgetLibrary(true)}
              variant="outline"
              className="font-mono text-sm border-dashed hover:border-primary/50 hover:bg-primary/10"
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
            <div className="text-muted-foreground font-mono">
              Widget component not found: {ComponentName}
            </div>
          </div>
        </div>
      );
    }

    const widgetSettings = getWidgetSettings(activeWidget.id);
    const widgetName = activeWidget.custom_name || activeWidget.widget_definition.name;
    return <WidgetComponent 
      settings={widgetSettings} 
      widgetName={widgetName}
      widgetInstanceId={activeWidget.id}
      onSettingsUpdate={(newSettings: Record<string, any>) => updateWidgetSettings(activeWidget.id, newSettings)}
    />;
  };

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


  return (
    <div 
      className="flex h-full overflow-hidden relative"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Toggle Button - Always Available */}
      <Button
        onClick={() => setShowSidebar(!showSidebar)}
        variant="ghost"
        size="sm"
        className={`${showSidebar ? 'absolute top-4 right-4 z-50' : 'absolute top-4 left-4 z-50'} bg-background/80 hover:bg-background border border-border`}
        title={showSidebar ? "Hide sidebar" : "Show sidebar"}
      >
        <Menu className="h-4 w-4" />
      </Button>

      {/* Sidebar */}
      {showSidebar && (
        <div className="w-72 bg-card border-r border-border flex flex-col overflow-hidden transition-all duration-300 ease-in-out">
        {/* Header */}
        <div className="flex-shrink-0 p-4 border-b border-border bg-background/50">
          <h2 className="text-lg font-mono text-primary uppercase tracking-wider crt-glow">
            {tabName} Widgets
          </h2>
        </div>

        {/* Widget List */}
        <div className="flex-1 overflow-y-auto">
          <div className="space-y-1 p-2">
            {widgets.map((widget, index) => (
              <div
                key={widget.id}
                draggable
                onDragStart={(e) => handleDragStart(e, widget)}
                onDragOver={(e) => handleWidgetDragOver(e, index)}
                onDrop={(e) => handleWidgetDrop(e, index)}
                onDragLeave={() => setDragOverIndex(null)}
                className={`rounded transition-all duration-200 cursor-grab active:cursor-grabbing hover:shadow-md relative ${
                  activeApplet === widget.id
                    ? 'bg-primary/20 border border-primary/50'
                    : 'border border-transparent hover:bg-muted/50 hover:border-primary/20'
                } ${
                  dragOverIndex === index ? 'border-t-2 border-t-primary' : ''
                }`}
                title="Drag to reorder or move to another tab"
              >
                <div
                  className="flex items-center justify-between p-3 cursor-pointer"
                  onClick={() => onAppletChange(widget.id)}
                >
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    <span className="text-lg">{widget.widget_definition?.icon}</span>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-mono font-medium text-foreground truncate">
                        {widget.custom_name || widget.widget_definition?.name}
                      </div>
                      <div className="text-xs text-muted-foreground font-mono truncate">
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
                        handleOpenWidgetRename(widget);
                      }}
                      className="opacity-70 hover:opacity-100 p-1 h-6 w-6"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenWidgetSettings(widget);
                      }}
                      className="opacity-70 hover:opacity-100 p-1 h-6 w-6"
                    >
                      <Settings className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveWidget(widget.id, widget.widget_id);
                      }}
                      className="opacity-70 hover:opacity-100 p-1 h-6 w-6 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Add Widget Button */}
            <Button
              onClick={() => setShowWidgetLibrary(true)}
              variant="outline"
              className="w-full mt-4 font-mono text-sm border-dashed hover:border-primary/50 hover:bg-primary/10"
            >
              <Plus className="w-4 h-4 mr-2" />
              ADD WIDGET
            </Button>
          </div>
        </div>
        </div>
      )}

      {/* Main Content */}
      <div className={`flex flex-col overflow-hidden transition-all duration-300 ease-in-out ${showSidebar ? 'flex-1' : 'w-full'} pt-16`}>
        {renderActiveWidget()}
      </div>

      {/* Widget Library Dialog */}
      <WidgetLibrary
        isOpen={showWidgetLibrary}
        onClose={() => setShowWidgetLibrary(false)}
        availableWidgets={getAvailableWidgetsForTab(tabId)}
        onAddWidget={handleAddWidget}
        tabCategory={tabName}
      />

      {/* Widget Settings Dialog */}
      <WidgetSettings
        isOpen={showWidgetSettings}
        onClose={handleCloseWidgetSettings}
        widget={selectedWidgetForSettings}
        onSettingsUpdate={updateWidgetSettings}
        onWidgetNameUpdate={updateWidgetName}
        currentSettings={selectedWidgetForSettings ? getWidgetSettings(selectedWidgetForSettings.id) : {}}
      />

      {/* Widget Rename Dialog */}
      <WidgetRenameDialog
        isOpen={showRenameDialog}
        onClose={handleCloseWidgetRename}
        widget={selectedWidgetForRename}
        onRename={handleWidgetRename}
      />
    </div>
  );
};