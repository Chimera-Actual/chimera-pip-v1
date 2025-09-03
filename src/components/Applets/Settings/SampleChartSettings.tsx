import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { BarChart3, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SampleChartSettingsProps {
  settings: Record<string, any>;
  onSettingsChange: (settings: Record<string, any>) => void;
  onClose: () => void;
}

export const SampleChartSettings: React.FC<SampleChartSettingsProps> = ({
  settings,
  onSettingsChange,
  onClose
}) => {
  const { toast } = useToast();
  const [localSettings, setLocalSettings] = useState({
    chartType: settings.chartType || 'line',
    showGrid: settings.showGrid ?? true,
    dataPoints: settings.dataPoints || 20,
    ...settings
  });

  const handleSave = () => {
    onSettingsChange(localSettings);
    toast({
      title: "Settings Saved",
      description: "System monitor settings have been updated.",
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
          <BarChart3 className="w-5 h-5" />
          System Monitor Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Chart Type</Label>
            <Select 
              value={localSettings.chartType} 
              onValueChange={(value) => updateSetting('chartType', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="line">Line Chart</SelectItem>
                <SelectItem value="area">Area Chart</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="showGrid">Show Grid</Label>
            <Switch
              id="showGrid"
              checked={localSettings.showGrid}
              onCheckedChange={(checked) => updateSetting('showGrid', checked)}
            />
          </div>

          <div className="space-y-2">
            <Label>Data Points: {localSettings.dataPoints}</Label>
            <Slider
              value={[localSettings.dataPoints]}
              onValueChange={([value]) => updateSetting('dataPoints', value)}
              min={10}
              max={50}
              step={5}
              className="w-full"
            />
            <div className="text-xs text-muted-foreground">
              Number of data points to display in the chart
            </div>
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