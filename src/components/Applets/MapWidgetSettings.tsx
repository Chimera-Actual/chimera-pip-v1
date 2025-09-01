import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';

interface MapWidgetSettingsProps {
  settings: Record<string, any>;
  onSettingsChange: (settings: Record<string, any>) => void;
}

export const MapWidgetSettings: React.FC<MapWidgetSettingsProps> = ({
  settings,
  onSettingsChange
}) => {
  const updateSetting = (key: string, value: any) => {
    onSettingsChange({
      ...settings,
      [key]: value
    });
  };

  return (
    <div className="space-y-6 p-4">
      <div className="space-y-4">
        <div>
          <Label htmlFor="title" className="text-sm font-medium">
            Widget Title
          </Label>
          <Input
            id="title"
            value={settings.title || 'Tactical Map'}
            onChange={(e) => updateSetting('title', e.target.value)}
            placeholder="Enter widget title"
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="layer" className="text-sm font-medium">
            Default Map Layer
          </Label>
          <Select
            value={settings.layer || 'standard'}
            onValueChange={(value) => updateSetting('layer', value)}
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="standard">Standard</SelectItem>
              <SelectItem value="satellite">Satellite</SelectItem>
              <SelectItem value="terrain">Terrain</SelectItem>
              <SelectItem value="transport">Transport</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-sm font-medium">
            Default Zoom Level: {settings.zoom || 10}
          </Label>
          <Slider
            value={[settings.zoom || 10]}
            onValueChange={(value) => updateSetting('zoom', value[0])}
            max={20}
            min={1}
            step={1}
            className="mt-2"
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="showControls" className="text-sm font-medium">
            Show Map Controls
          </Label>
          <Switch
            id="showControls"
            checked={settings.showControls !== false}
            onCheckedChange={(checked) => updateSetting('showControls', checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="followUser" className="text-sm font-medium">
            Follow User Location
          </Label>
          <Switch
            id="followUser"
            checked={settings.followUser || false}
            onCheckedChange={(checked) => updateSetting('followUser', checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="showCrosshair" className="text-sm font-medium">
            Show Center Crosshair
          </Label>
          <Switch
            id="showCrosshair"
            checked={settings.showCrosshair !== false}
            onCheckedChange={(checked) => updateSetting('showCrosshair', checked)}
          />
        </div>
      </div>
    </div>
  );
};