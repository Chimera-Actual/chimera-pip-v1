import React, { useState } from 'react';
import { Map } from 'lucide-react';
import { BaseWidgetSettingsTemplate } from '@/components/Layout/BaseWidgetSettingsTemplate';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';

interface MapWidgetSettingsProps {
  widgetInstanceId: string;
  settings: Record<string, any>;
  onSettingsChange: (settings: Record<string, any>) => void;
  onClose: () => void;
}

export const MapWidgetSettings: React.FC<MapWidgetSettingsProps> = ({
  widgetInstanceId,
  settings,
  onSettingsChange,
  onClose
}) => {
  const [localSettings, setLocalSettings] = useState({
    title: settings.title || 'Open Source Map',
    layer: settings.layer || 'standard',
    zoom: settings.zoom || 10,
    showControls: settings.showControls !== false,
    followUser: settings.followUser || false,
    showCrosshair: settings.showCrosshair !== false,
    customIcon: settings.customIcon || 'Map',
    ...settings
  });

  const handleSave = () => {
    onSettingsChange(localSettings);
    onClose();
  };

  const updateSetting = (key: string, value: any) => {
    setLocalSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleWidgetNameChange = (name: string) => {
    updateSetting('title', name);
  };

  return (
    <BaseWidgetSettingsTemplate
      widgetIcon={<Map className="w-4 h-4" />}
      widgetName="Map Widget"
      widgetInstanceId={widgetInstanceId}
      initialWidgetName={localSettings.title}
      currentIconName={localSettings.customIcon}
      onWidgetNameChange={handleWidgetNameChange}
      onIconChange={(iconName) => updateSetting('customIcon', iconName)}
      onSave={handleSave}
      onCancel={onClose}
    >
      <div className="space-y-6">
        {/* Default Map Layer */}
        <div className="space-y-2">
          <Label htmlFor="layer" className="font-mono text-sm uppercase tracking-wider text-muted-foreground">
            Default Map Layer
          </Label>
          <Select
            value={localSettings.layer}
            onValueChange={(value) => updateSetting('layer', value)}
          >
            <SelectTrigger className="font-mono">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="standard">Standard</SelectItem>
              <SelectItem value="satellite">Satellite</SelectItem>
              <SelectItem value="terrain">Terrain</SelectItem>
              <SelectItem value="transport">Transport</SelectItem>
              <SelectItem value="dark">Dark</SelectItem>
              <SelectItem value="light">Light</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Zoom Level */}
        <div className="space-y-2">
          <Label className="font-mono text-sm uppercase tracking-wider text-muted-foreground">
            Default Zoom Level: {localSettings.zoom}
          </Label>
          <Slider
            value={[localSettings.zoom]}
            onValueChange={(value) => updateSetting('zoom', value[0])}
            max={20}
            min={1}
            step={1}
            className="w-full"
          />
        </div>

        {/* Map Controls Toggle */}
        <div className="flex items-center justify-between">
          <Label htmlFor="showControls" className="font-mono text-sm uppercase tracking-wider text-muted-foreground">
            Show Map Controls
          </Label>
          <Switch
            id="showControls"
            checked={localSettings.showControls}
            onCheckedChange={(checked) => updateSetting('showControls', checked)}
          />
        </div>

        {/* Follow User Toggle */}
        <div className="flex items-center justify-between">
          <Label htmlFor="followUser" className="font-mono text-sm uppercase tracking-wider text-muted-foreground">
            Follow User Location
          </Label>
          <Switch
            id="followUser"
            checked={localSettings.followUser}
            onCheckedChange={(checked) => updateSetting('followUser', checked)}
          />
        </div>

        {/* Crosshair Toggle */}
        <div className="flex items-center justify-between">
          <Label htmlFor="showCrosshair" className="font-mono text-sm uppercase tracking-wider text-muted-foreground">
            Show Center Crosshair
          </Label>
          <Switch
            id="showCrosshair"
            checked={localSettings.showCrosshair}
            onCheckedChange={(checked) => updateSetting('showCrosshair', checked)}
          />
        </div>

        {/* Debug Info */}
        <div className="mt-8 p-4 bg-muted/50 rounded border">
          <Label className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
            Map Configuration
          </Label>
          <div className="mt-2 space-y-1 text-xs font-mono text-muted-foreground">
            <div>Layer: {localSettings.layer}</div>
            <div>Zoom: {localSettings.zoom}x</div>
            <div>Controls: {localSettings.showControls ? 'Enabled' : 'Disabled'}</div>
          </div>
        </div>
      </div>
    </BaseWidgetSettingsTemplate>
  );
};