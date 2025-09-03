import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Thermometer, MapPin, Gauge, Wind } from 'lucide-react';

interface WeatherSettingsProps {
  settings: Record<string, any>;
  onSettingsChange: (newSettings: Record<string, any>) => void;
  onClose: () => void;
}

export const WeatherSettings: React.FC<WeatherSettingsProps> = ({
  settings,
  onSettingsChange,
  onClose
}) => {
  const [temperatureUnit, setTemperatureUnit] = useState(settings.temperatureUnit || 'celsius');
  const [showLocation, setShowLocation] = useState(settings.showLocation !== false);
  const [showForecast, setShowForecast] = useState(settings.showForecast !== false);
  const [showDetails, setShowDetails] = useState(settings.showDetails !== false);
  const [autoRefresh, setAutoRefresh] = useState(settings.autoRefresh !== false);
  const [refreshInterval, setRefreshInterval] = useState(settings.refreshInterval || 30);

  const handleSave = () => {
    const newSettings = {
      temperatureUnit,
      showLocation,
      showForecast,
      showDetails,
      autoRefresh,
      refreshInterval
    };
    
    onSettingsChange(newSettings);
    onClose();
  };

  return (
    <div className="space-y-6 max-h-[80vh] overflow-y-auto">
      {/* Temperature Unit */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-mono text-primary flex items-center gap-2">
            <Thermometer className="w-4 h-4" />
            TEMPERATURE UNIT
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={temperatureUnit}
            onValueChange={setTemperatureUnit}
            className="grid grid-cols-2 gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="celsius" id="celsius" />
              <Label htmlFor="celsius" className="font-mono text-xs">
                Celsius (°C)
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="fahrenheit" id="fahrenheit" />
              <Label htmlFor="fahrenheit" className="font-mono text-xs">
                Fahrenheit (°F)
              </Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Display Options */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-mono text-primary flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            DISPLAY OPTIONS
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-mono text-foreground">Show Location</Label>
            <Switch
              checked={showLocation}
              onCheckedChange={setShowLocation}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-xs font-mono text-foreground">Show 3-Day Forecast</Label>
            <Switch
              checked={showForecast}
              onCheckedChange={setShowForecast}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-xs font-mono text-foreground">Show Weather Details</Label>
            <Switch
              checked={showDetails}
              onCheckedChange={setShowDetails}
            />
          </div>
        </CardContent>
      </Card>

      {/* Auto Refresh */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-mono text-primary flex items-center gap-2">
            <Gauge className="w-4 h-4" />
            AUTO REFRESH
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-mono text-foreground">Enable Auto Refresh</Label>
            <Switch
              checked={autoRefresh}
              onCheckedChange={setAutoRefresh}
            />
          </div>
          {autoRefresh && (
            <div>
              <Label className="text-xs font-mono text-muted-foreground">Refresh Interval (minutes)</Label>
              <RadioGroup
                value={refreshInterval.toString()}
                onValueChange={(value) => setRefreshInterval(parseInt(value))}
                className="grid grid-cols-3 gap-4 mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="15" id="15min" />
                  <Label htmlFor="15min" className="font-mono text-xs">15</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="30" id="30min" />
                  <Label htmlFor="30min" className="font-mono text-xs">30</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="60" id="60min" />
                  <Label htmlFor="60min" className="font-mono text-xs">60</Label>
                </div>
              </RadioGroup>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Information Section */}
      <Card className="border-border bg-muted/20">
        <CardContent className="pt-6">
          <div className="space-y-3 text-xs font-mono text-muted-foreground">
            <div className="flex items-start gap-2">
              <Wind className="w-3 h-3 mt-0.5 flex-shrink-0" />
              <div>
                <div className="text-foreground font-semibold">Weather Data</div>
                <div>Current weather data is simulated. Real API integration can be added later.</div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0" />
              <div>
                <div className="text-foreground font-semibold">Location Services</div>
                <div>Location data is sourced from user settings if enabled.</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4 border-t border-border">
        <Button
          onClick={onClose}
          variant="outline"
          className="flex-1 font-mono text-xs"
        >
          CANCEL
        </Button>
        <Button
          onClick={handleSave}
          className="flex-1 font-mono text-xs"
        >
          SAVE SETTINGS
        </Button>
      </div>
    </div>
  );
};