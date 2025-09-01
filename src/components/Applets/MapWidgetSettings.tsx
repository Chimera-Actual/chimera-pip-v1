import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

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
  const updateSetting = (key: string, value: any) => {
    onSettingsChange({
      ...settings,
      [key]: value
    });
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-card border border-border rounded-lg max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-mono text-primary uppercase tracking-wider">Map Settings</h3>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Content */}
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
          
          {/* Footer */}
          <div className="flex justify-end gap-2 pt-4 border-t border-border">
            <Button variant="outline" onClick={onClose} className="font-mono">
              CLOSE
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};