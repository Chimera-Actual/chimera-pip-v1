import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Clock, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SampleClockSettingsProps {
  settings: Record<string, any>;
  onSettingsChange: (settings: Record<string, any>) => void;
  onClose: () => void;
}

export const SampleClockSettings: React.FC<SampleClockSettingsProps> = ({
  settings,
  onSettingsChange,
  onClose
}) => {
  const { toast } = useToast();
  const [localSettings, setLocalSettings] = useState({
    format24Hour: settings.format24Hour || false,
    showSeconds: settings.showSeconds ?? true,
    showDate: settings.showDate ?? true,
    ...settings
  });

  const handleSave = () => {
    onSettingsChange(localSettings);
    toast({
      title: "Settings Saved",
      description: "Clock display settings have been updated.",
    });
    onClose();
  };

  const updateSetting = (key: string, value: any) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Clock Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="format24Hour">24-Hour Format</Label>
            <Switch
              id="format24Hour"
              checked={localSettings.format24Hour}
              onCheckedChange={(checked) => updateSetting('format24Hour', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="showSeconds">Show Seconds</Label>
            <Switch
              id="showSeconds"
              checked={localSettings.showSeconds}
              onCheckedChange={(checked) => updateSetting('showSeconds', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="showDate">Show Date</Label>
            <Switch
              id="showDate"
              checked={localSettings.showDate}
              onCheckedChange={(checked) => updateSetting('showDate', checked)}
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={handleSave} className="flex-1">
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};