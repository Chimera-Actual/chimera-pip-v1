import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Settings, Layout, Grid, Eye, Palette, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DashboardSettingsWidgetProps {
  settings?: Record<string, any>;
  widgetName?: string;
  widgetInstanceId?: string;
  onSettingsUpdate?: (newSettings: Record<string, any>) => void;
}

export const DashboardSettingsWidget: React.FC<DashboardSettingsWidgetProps> = ({ 
  settings, 
  widgetName, 
  onSettingsUpdate 
}) => {
  const [dashboardSettings, setDashboardSettings] = useState({
    gridSize: settings?.gridSize || 'medium',
    showGrid: settings?.showGrid ?? true,
    snapToGrid: settings?.snapToGrid ?? true,
    animationsEnabled: settings?.animationsEnabled ?? true,
    compactMode: settings?.compactMode ?? false,
    backgroundOpacity: settings?.backgroundOpacity || [80],
    borderRadius: settings?.borderRadius || [8],
    spacing: settings?.spacing || [16],
    ...settings
  });

  const { toast } = useToast();

  const updateSetting = (key: string, value: any) => {
    setDashboardSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const saveDashboardSettings = () => {
    if (onSettingsUpdate) {
      onSettingsUpdate(dashboardSettings);
      toast({
        title: "Settings Saved",
        description: "Dashboard configuration has been updated.",
      });
    }
  };

  return (
    <div className="h-full flex flex-col bg-card border border-border overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-border bg-card p-3">
        <div className="flex items-center justify-between">
          <span className="text-primary font-mono text-sm uppercase tracking-wider crt-glow">
            ⚙️ {widgetName || 'DASHBOARD SETTINGS'}
          </span>
          <Button
            onClick={saveDashboardSettings}
            variant="ghost"
            size="sm"
            className="h-8 px-3 text-xs font-mono"
          >
            <Save className="w-3 h-3 mr-2" />
            SAVE
          </Button>
        </div>
      </div>

      {/* Settings Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        
        {/* Grid Settings */}
        <Card className="bg-card/50 border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-mono text-primary uppercase tracking-wider crt-glow flex items-center gap-2">
              <Grid className="w-4 h-4" />
              GRID CONFIGURATION
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-mono text-foreground">Grid Size</Label>
              <Select
                value={dashboardSettings.gridSize}
                onValueChange={(value) => updateSetting('gridSize', value)}
              >
                <SelectTrigger className="w-24 h-8 font-mono text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">SMALL</SelectItem>
                  <SelectItem value="medium">MEDIUM</SelectItem>
                  <SelectItem value="large">LARGE</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <Label className="text-xs font-mono text-foreground">Show Grid Lines</Label>
              <Switch
                checked={dashboardSettings.showGrid}
                onCheckedChange={(checked) => updateSetting('showGrid', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label className="text-xs font-mono text-foreground">Snap to Grid</Label>
              <Switch
                checked={dashboardSettings.snapToGrid}
                onCheckedChange={(checked) => updateSetting('snapToGrid', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Layout Settings */}
        <Card className="bg-card/50 border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-mono text-primary uppercase tracking-wider crt-glow flex items-center gap-2">
              <Layout className="w-4 h-4" />
              LAYOUT OPTIONS
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-mono text-foreground">Compact Mode</Label>
              <Switch
                checked={dashboardSettings.compactMode}
                onCheckedChange={(checked) => updateSetting('compactMode', checked)}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-mono text-foreground">
                Widget Spacing: {dashboardSettings.spacing[0]}px
              </Label>
              <Slider
                value={dashboardSettings.spacing}
                onValueChange={(value) => updateSetting('spacing', value)}
                max={32}
                min={4}
                step={4}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-mono text-foreground">
                Border Radius: {dashboardSettings.borderRadius[0]}px
              </Label>
              <Slider
                value={dashboardSettings.borderRadius}
                onValueChange={(value) => updateSetting('borderRadius', value)}
                max={24}
                min={0}
                step={2}
                className="w-full"
              />
            </div>
          </CardContent>
        </Card>

        {/* Visual Settings */}
        <Card className="bg-card/50 border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-mono text-primary uppercase tracking-wider crt-glow flex items-center gap-2">
              <Eye className="w-4 h-4" />
              VISUAL EFFECTS
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-mono text-foreground">Enable Animations</Label>
              <Switch
                checked={dashboardSettings.animationsEnabled}
                onCheckedChange={(checked) => updateSetting('animationsEnabled', checked)}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-mono text-foreground">
                Background Opacity: {dashboardSettings.backgroundOpacity[0]}%
              </Label>
              <Slider
                value={dashboardSettings.backgroundOpacity}
                onValueChange={(value) => updateSetting('backgroundOpacity', value)}
                max={100}
                min={10}
                step={10}
                className="w-full"
              />
            </div>
          </CardContent>
        </Card>

        {/* Info Panel */}
        <div className="bg-background/20 border border-border rounded p-3 text-xs font-mono space-y-1">
          <div className="text-muted-foreground">DASHBOARD INFO:</div>
          <div className="text-foreground">• Grid: {dashboardSettings.gridSize.toUpperCase()}</div>
          <div className="text-foreground">• Spacing: {dashboardSettings.spacing[0]}px</div>
          <div className="text-foreground">• Animations: {dashboardSettings.animationsEnabled ? 'ON' : 'OFF'}</div>
          <div className="text-foreground">• Compact: {dashboardSettings.compactMode ? 'ON' : 'OFF'}</div>
        </div>
      </div>
    </div>
  );
};

export default DashboardSettingsWidget;