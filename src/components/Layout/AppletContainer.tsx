import React, { useState, useEffect } from 'react';
import { AppletType } from './PipBoyLayout';
import { Settings, X, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWidgetManager, UserWidgetInstance } from '@/hooks/useWidgetManager';
import { WIDGET_COMPONENTS, WidgetComponentName } from './WidgetRegistry';
import { WidgetLibrary } from './WidgetLibrary';
import { useToast } from '@/hooks/use-toast';
import { ChatInterface } from '../Applets/ChatInterface';

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
    loading
  } = useWidgetManager();
  
  const { toast } = useToast();
  const [widgets, setWidgets] = useState<UserWidgetInstance[]>([]);
  const [showWidgetLibrary, setShowWidgetLibrary] = useState(false);

  // Load widgets when tab ID changes
  useEffect(() => {
    if (!loading) {
      const activeWidgets = getActiveWidgetsForTab(tabId);
      setWidgets(activeWidgets);
      
      // Set first widget as active if none selected or current doesn't exist
      if (activeWidgets.length > 0 && !activeWidgets.find(w => w.widget_id === activeApplet)) {
        onAppletChange(activeWidgets[0].widget_id);
      }
    }
  }, [tabId, loading]);

  const handleRemoveWidget = async (instanceId: string, widgetId: string) => {
    try {
      await removeWidgetFromTab(instanceId);
      
      // If we removed the active widget, switch to another one
      if (widgetId === activeApplet) {
        const remainingWidgets = widgets.filter(w => w.id !== instanceId);
        if (remainingWidgets.length > 0) {
          onAppletChange(remainingWidgets[0].widget_id);
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

  const renderActiveWidget = () => {
    const activeWidget = widgets.find(w => w.widget_id === activeApplet);
    if (!activeWidget?.widget_definition) {
      return (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <Plus className="w-12 h-12 mx-auto text-muted-foreground" />
            <div className="text-muted-foreground font-mono">
              No widgets available. Click the + button to add widgets.
            </div>
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

    const widgetSettings = getWidgetSettings(activeApplet);
    return <WidgetComponent />;
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
    <div className="flex h-full overflow-hidden">
      {/* Sidebar */}
      <div className="w-72 bg-card border-r border-border flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex-shrink-0 p-4 border-b border-border bg-background/50">
          <h2 className="text-lg font-mono text-primary uppercase tracking-wider crt-glow">
            {tabName} Widgets
          </h2>
        </div>

        {/* Widget List */}
        <div className="flex-1 overflow-y-auto">
          <div className="space-y-1 p-2">
            {widgets.map((widget) => (
              <div
                key={widget.id}
                className={`rounded transition-colors ${
                  activeApplet === widget.widget_id
                    ? 'bg-primary/20 border border-primary/50'
                    : 'border border-transparent hover:bg-muted/50'
                }`}
              >
                <div
                  className="flex items-center justify-between p-3 cursor-pointer"
                  onClick={() => onAppletChange(widget.widget_id)}
                >
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    <span className="text-lg">{widget.widget_definition?.icon}</span>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-mono font-medium text-foreground truncate">
                        {widget.widget_definition?.name}
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
                        // TODO: Implement widget settings
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

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
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
    </div>
  );
};