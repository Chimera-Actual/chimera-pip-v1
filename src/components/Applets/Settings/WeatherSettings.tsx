import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Thermometer, MapPin, Gauge, Wind } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

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
  const isMobile = useIsMobile();
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
    <div className={`space-y-4 md:space-y-6 max-h-[80vh] overflow-y-auto ${isMobile ? 'px-1' : ''}`}>
      {/* Temperature Unit */}
      <Card className="border-border">
        <CardHeader className={isMobile ? 'pb-2 px-4 py-3' : 'pb-3'}>
          <CardTitle className={`font-mono text-primary flex items-center gap-2 ${
            isMobile ? 'text-sm' : 'text-sm'
          }`}>
            <Thermometer className={isMobile ? 'w-3 h-3' : 'w-4 h-4'} />
            TEMPERATURE UNIT
          </CardTitle>
        </CardHeader>
        <CardContent className={isMobile ? 'px-4 pb-4' : ''}>
          <RadioGroup
            value={temperatureUnit}
            onValueChange={setTemperatureUnit}
            className={`grid gap-3 md:gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="celsius" id="celsius" className="touch-target" />
              <Label htmlFor="celsius" className={`font-mono ${isMobile ? 'text-sm' : 'text-xs'}`}>
                Celsius (°C)
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="fahrenheit" id="fahrenheit" className="touch-target" />
              <Label htmlFor="fahrenheit" className={`font-mono ${isMobile ? 'text-sm' : 'text-xs'}`}>
                Fahrenheit (°F)
              </Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Display Options */}
      <Card className="border-border">
        <CardHeader className={isMobile ? 'pb-2 px-4 py-3' : 'pb-3'}>
          <CardTitle className={`font-mono text-primary flex items-center gap-2 ${
            isMobile ? 'text-sm' : 'text-sm'
          }`}>
            <MapPin className={isMobile ? 'w-3 h-3' : 'w-4 h-4'} />
            DISPLAY OPTIONS
          </CardTitle>
        </CardHeader>
        <CardContent className={`space-y-3 md:space-y-4 ${isMobile ? 'px-4 pb-4' : ''}`}>
          <div className={`flex justify-between ${isMobile ? 'flex-col gap-2' : 'items-center'}`}>
            <Label className={`font-mono text-foreground ${isMobile ? 'text-sm' : 'text-xs'}`}>Show Location</Label>
            <Switch
              checked={showLocation}
              onCheckedChange={setShowLocation}
              className="touch-target"
            />
          </div>
          <div className={`flex justify-between ${isMobile ? 'flex-col gap-2' : 'items-center'}`}>
            <Label className={`font-mono text-foreground ${isMobile ? 'text-sm' : 'text-xs'}`}>Show 3-Day Forecast</Label>
            <Switch
              checked={showForecast}
              onCheckedChange={setShowForecast}
              className="touch-target"
            />
          </div>
          <div className={`flex justify-between ${isMobile ? 'flex-col gap-2' : 'items-center'}`}>
            <Label className={`font-mono text-foreground ${isMobile ? 'text-sm' : 'text-xs'}`}>Show Weather Details</Label>
            <Switch
              checked={showDetails}
              onCheckedChange={setShowDetails}
              className="touch-target"
            />
          </div>
        </CardContent>
      </Card>

      {/* Auto Refresh */}
      <Card className="border-border">
        <CardHeader className={isMobile ? 'pb-2 px-4 py-3' : 'pb-3'}>
          <CardTitle className={`font-mono text-primary flex items-center gap-2 ${
            isMobile ? 'text-sm' : 'text-sm'
          }`}>
            <Gauge className={isMobile ? 'w-3 h-3' : 'w-4 h-4'} />
            AUTO REFRESH
          </CardTitle>
        </CardHeader>
        <CardContent className={`space-y-3 md:space-y-4 ${isMobile ? 'px-4 pb-4' : ''}`}>
          <div className={`flex justify-between ${isMobile ? 'flex-col gap-2' : 'items-center'}`}>
            <Label className={`font-mono text-foreground ${isMobile ? 'text-sm' : 'text-xs'}`}>Enable Auto Refresh</Label>
            <Switch
              checked={autoRefresh}
              onCheckedChange={setAutoRefresh}
              className="touch-target"
            />
          </div>
          {autoRefresh && (
            <div>
              <Label className={`font-mono text-muted-foreground ${isMobile ? 'text-sm' : 'text-xs'}`}>Refresh Interval (minutes)</Label>
              <RadioGroup
                value={refreshInterval.toString()}
                onValueChange={(value) => setRefreshInterval(parseInt(value))}
                className={`grid gap-3 md:gap-4 mt-2 ${isMobile ? 'grid-cols-1' : 'grid-cols-3'}`}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="15" id="15min" className="touch-target" />
                  <Label htmlFor="15min" className={`font-mono ${isMobile ? 'text-sm' : 'text-xs'}`}>15</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="30" id="30min" className="touch-target" />
                  <Label htmlFor="30min" className={`font-mono ${isMobile ? 'text-sm' : 'text-xs'}`}>30</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="60" id="60min" className="touch-target" />
                  <Label htmlFor="60min" className={`font-mono ${isMobile ? 'text-sm' : 'text-xs'}`}>60</Label>
                </div>
              </RadioGroup>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Information Section */}
      <Card className="border-border bg-muted/20">
        <CardContent className={isMobile ? 'pt-4 px-4 pb-4' : 'pt-6'}>
          <div className={`space-y-3 font-mono text-muted-foreground ${isMobile ? 'text-xs' : 'text-xs'}`}>
            <div className="flex items-start gap-2">
              <Wind className={`mt-0.5 flex-shrink-0 ${isMobile ? 'w-3 h-3' : 'w-3 h-3'}`} />
              <div>
                <div className="text-foreground font-semibold">Weather Data</div>
                <div>Current weather data is simulated. Real API integration can be added later.</div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <MapPin className={`mt-0.5 flex-shrink-0 ${isMobile ? 'w-3 h-3' : 'w-3 h-3'}`} />
              <div>
                <div className="text-foreground font-semibold">Location Services</div>
                <div>Location data is sourced from user settings if enabled.</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className={`flex gap-3 pt-4 border-t border-border ${isMobile ? 'flex-col' : ''}`}>
        <Button
          onClick={onClose}
          variant="outline"
          className={`font-mono touch-target ${
            isMobile ? 'flex-1 h-10 text-sm' : 'flex-1 text-xs'
          }`}
        >
          CANCEL
        </Button>
        <Button
          onClick={handleSave}
          className={`font-mono touch-target ${
            isMobile ? 'flex-1 h-10 text-sm' : 'flex-1 text-xs'
          }`}
        >
          SAVE SETTINGS
        </Button>
      </div>
    </div>
  );
};