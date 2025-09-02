// Widget Properties Panel for Right Sidebar
import React from 'react';
import { Settings, Info, Trash2 } from 'lucide-react';

import { useDashboardStore } from '@/stores/dashboardStore';
import { WidgetSettings } from '../Layout/WidgetSettings';
import { ScrollArea } from '../ui/scroll-area';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';
import { cn } from '@/lib/utils';

export const WidgetPropertiesPanel: React.FC = () => {
  const { 
    currentLayout, 
    selectedWidget, 
    selectWidget, 
    removeWidget,
    updateWidgetSettings 
  } = useDashboardStore();

  const widget = currentLayout?.widgets.find(w => w.id === selectedWidget);

  if (!widget) {
    return (
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-border/50">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary" />
            <h2 className="font-mono text-lg font-semibold">PROPERTIES</h2>
          </div>
        </div>

        {/* Empty State */}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <Info className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <div className="font-mono text-sm">NO WIDGET SELECTED</div>
            <div className="text-xs mt-1">
              Select a widget to view its properties
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleSettingsUpdate = (newSettings: any) => {
    updateWidgetSettings(widget.id, newSettings);
  };

  const handleRemoveWidget = () => {
    removeWidget(widget.id);
    selectWidget(null);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary" />
            <h2 className="font-mono text-lg font-semibold">PROPERTIES</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRemoveWidget}
            className="text-destructive hover:text-destructive hover:bg-destructive/20"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Widget Info */}
          <div>
            <h3 className="font-mono text-sm font-semibold mb-3 text-foreground">
              WIDGET INFO
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Name:</span>
                <span className="font-mono">{widget.customName || widget.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Type:</span>
                <span className="font-mono">{widget.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Panel:</span>
                <span className="font-mono">{widget.panelId}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Position & Size */}
          <div>
            <h3 className="font-mono text-sm font-semibold mb-3 text-foreground">
              POSITION & SIZE
            </h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground block">X:</span>
                <span className="font-mono">{widget.position.x}</span>
              </div>
              <div>
                <span className="text-muted-foreground block">Y:</span>
                <span className="font-mono">{widget.position.y}</span>
              </div>
              <div>
                <span className="text-muted-foreground block">Width:</span>
                <span className="font-mono">{widget.position.width}</span>
              </div>
              <div>
                <span className="text-muted-foreground block">Height:</span>
                <span className="font-mono">{widget.position.height}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Widget Settings */}
          <div>
            <h3 className="font-mono text-sm font-semibold mb-3 text-foreground">
              SETTINGS
            </h3>
            <div className="space-y-4">
              <div className="text-sm font-mono text-muted-foreground">
                Widget-specific settings will be displayed here
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};