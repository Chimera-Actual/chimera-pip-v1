import React from 'react';
import { Settings, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import WidgetAdapter from '@/components/dashboard/WidgetAdapter';
import { BaseWidgetProps } from '@/types/widget';
import { useCRT } from '@/lib/CRTTheme';

const DashboardSettingsWidget: React.FC<BaseWidgetProps> = ({
  widgetInstanceId,
  widgetName
}) => {
  const { theme, setTheme, scanlinesEnabled, setScanlinesEnabled } = useCRT();

  return (
    <WidgetAdapter
      title="Dashboard Settings"
      widgetInstanceId={widgetInstanceId}
      widgetName={widgetName}
      icon={<Settings className="w-4 h-4" />}
    >
      <div className="h-full p-4 space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Theme Settings
            </CardTitle>
            <CardDescription>
              Customize your dashboard appearance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="theme-select">CRT Theme</Label>
              <Select value={theme} onValueChange={(value: any) => setTheme(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select theme" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="green">Matrix Green</SelectItem>
                  <SelectItem value="amber">Fallout Amber</SelectItem>
                  <SelectItem value="blue">Cyberpunk Blue</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="scanlines-toggle" className="flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Scanlines Effect
                </Label>
                <p className="text-sm text-muted-foreground">
                  Add retro CRT scanlines to the display
                </p>
              </div>
              <Switch
                id="scanlines-toggle"
                checked={scanlinesEnabled}
                onCheckedChange={setScanlinesEnabled}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </WidgetAdapter>
  );
};

export default DashboardSettingsWidget;