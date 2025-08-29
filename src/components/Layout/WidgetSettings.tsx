import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Settings } from 'lucide-react';
import { UserWidgetInstance } from '@/hooks/useWidgetManager';
import { ClockSettings } from '@/components/Applets/Settings/ClockSettings';
import { CustomAssistantSettings } from '@/components/Applets/Settings/CustomAssistantSettings';
import { TextDisplaySettings } from '@/components/Applets/Settings/TextDisplaySettings';
import { ImageDisplaySettings } from '@/components/Applets/Settings/ImageDisplaySettings';
import { MapWidgetSettings } from '@/components/Applets/Settings/MapWidgetSettings';
import { AudioPlayerSettings } from '@/components/Applets/Settings/AudioPlayerSettings';
import { WeatherSettings } from '@/components/Applets/Settings/WeatherSettings';

interface WidgetSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  widget: UserWidgetInstance | null;
  onSettingsUpdate: (widgetId: string, settings: Record<string, any>) => void;
  currentSettings: Record<string, any>;
}

export const WidgetSettings: React.FC<WidgetSettingsProps> = ({
  isOpen,
  onClose,
  widget,
  onSettingsUpdate,
  currentSettings,
}) => {
  if (!widget?.widget_definition) return null;

  const renderSettingsComponent = () => {
    switch (widget.widget_definition.component_name) {
      case 'ClockWidget':
        return (
          <ClockSettings
            settings={currentSettings}
            onSettingsChange={(settings) => onSettingsUpdate(widget.id, settings)}
            onClose={onClose}
          />
        );
      case 'CustomAssistantWidget':
        return (
          <CustomAssistantSettings
            settings={currentSettings}
            onSettingsChange={(settings) => onSettingsUpdate(widget.id, settings)}
            onClose={onClose}
          />
        );
      case 'TextDisplayWidget':
        return (
          <TextDisplaySettings
            settings={currentSettings}
            onSettingsChange={(settings) => onSettingsUpdate(widget.id, settings)}
            onClose={onClose}
          />
        );
      case 'ImageDisplayWidget':
        return (
          <ImageDisplaySettings
            settings={currentSettings}
            onSettingsChange={(settings) => onSettingsUpdate(widget.id, settings)}
            onClose={onClose}
            widgetInstanceId={widget.id}
          />
        );
      case 'MapWidget':
        return (
          <MapWidgetSettings
            settings={currentSettings}
            onSettingsChange={(settings) => onSettingsUpdate(widget.id, settings)}
            onClose={onClose}
          />
        );
      case 'AudioPlayerWidget':
        return (
          <AudioPlayerSettings
            settings={currentSettings}
            onSettingsChange={(settings) => onSettingsUpdate(widget.id, settings)}
            onClose={onClose}
          />
        );

      case 'WeatherWidget':
        return (
          <WeatherSettings
            settings={currentSettings}
            onSettingsChange={(settings) => onSettingsUpdate(widget.id, settings)}
            onClose={onClose}
          />
        );
      
      default:
        return (
          <div className="p-6 text-center">
            <div className="text-muted-foreground font-mono text-sm">
              No settings available for this widget.
            </div>
          </div>
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-xl font-mono text-primary uppercase tracking-wider crt-glow flex items-center gap-2">
            <Settings className="w-5 h-5" />
            {widget.widget_definition.name} Settings
          </DialogTitle>
        </DialogHeader>
        
        {renderSettingsComponent()}
      </DialogContent>
    </Dialog>
  );
};