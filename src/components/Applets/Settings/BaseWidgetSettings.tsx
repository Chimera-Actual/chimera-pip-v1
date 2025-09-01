import React, { useState } from 'react';
import { Cpu } from 'lucide-react';
import { BaseWidgetSettingsTemplate } from '@/components/Layout/BaseWidgetSettingsTemplate';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

interface BaseWidgetSettingsProps {
  widgetInstanceId: string;
  settings: Record<string, any>;
  onSettingsChange: (settings: Record<string, any>) => void;
  onClose: () => void;
}

export const BaseWidgetSettings: React.FC<BaseWidgetSettingsProps> = ({
  widgetInstanceId,
  settings,
  onSettingsChange,
  onClose
}) => {
  const [localSettings, setLocalSettings] = useState({
    title: settings.title || 'Base Widget',
    message: settings.message || 'This is a base widget template.',
    showTitle: settings.showTitle ?? true,
    variant: settings.variant || 'default',
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

  return (
    <BaseWidgetSettingsTemplate
      widgetIcon={<Cpu className="w-4 h-4" />}
      widgetName="Base Widget"
      onSave={handleSave}
      onCancel={onClose}
    >
      <div className="space-y-6">
        {/* Widget Title */}
        <div className="space-y-2">
          <Label htmlFor="title" className="font-mono text-sm uppercase tracking-wider text-muted-foreground">
            Widget Title
          </Label>
          <Input
            id="title"
            value={localSettings.title}
            onChange={(e) => updateSetting('title', e.target.value)}
            className="font-mono"
            placeholder="Enter widget title"
          />
        </div>

        {/* Message */}
        <div className="space-y-2">
          <Label htmlFor="message" className="font-mono text-sm uppercase tracking-wider text-muted-foreground">
            Display Message
          </Label>
          <Textarea
            id="message"
            value={localSettings.message}
            onChange={(e) => updateSetting('message', e.target.value)}
            className="font-mono min-h-[80px]"
            placeholder="Enter display message"
          />
        </div>

        {/* Show Title Toggle */}
        <div className="flex items-center justify-between">
          <Label htmlFor="show-title" className="font-mono text-sm uppercase tracking-wider text-muted-foreground">
            Show Title
          </Label>
          <Switch
            id="show-title"
            checked={localSettings.showTitle}
            onCheckedChange={(checked) => updateSetting('showTitle', checked)}
          />
        </div>

        {/* Variant Selection */}
        <div className="space-y-2">
          <Label htmlFor="variant" className="font-mono text-sm uppercase tracking-wider text-muted-foreground">
            Widget Variant
          </Label>
          <Select
            value={localSettings.variant}
            onValueChange={(value) => updateSetting('variant', value)}
          >
            <SelectTrigger className="font-mono">
              <SelectValue placeholder="Select variant" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Default</SelectItem>
              <SelectItem value="minimal">Minimal</SelectItem>
              <SelectItem value="compact">Compact</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Debug Info */}
        <div className="mt-8 p-4 bg-muted/50 rounded border">
          <Label className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
            Debug Information
          </Label>
          <div className="mt-2 space-y-1 text-xs font-mono text-muted-foreground">
            <div>Instance ID: {widgetInstanceId}</div>
            <div>Settings Count: {Object.keys(localSettings).length}</div>
            <div>Current Variant: {localSettings.variant}</div>
          </div>
        </div>
      </div>
    </BaseWidgetSettingsTemplate>
  );
};