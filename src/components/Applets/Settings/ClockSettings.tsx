import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RectangularSwitch } from '@/components/ui/rectangular-switch';
import { StandardSettingsTemplate } from '@/components/Layout/StandardSettingsTemplate';
import { Plus, X, Save, Clock } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface TimeZone {
  name: string;
  timezone: string;
}

interface ClockSettingsProps {
  settings: Record<string, any>;
  onSettingsChange: (settings: Record<string, any>) => void;
  onClose: () => void;
}

export const ClockSettings: React.FC<ClockSettingsProps> = ({
  settings,
  onSettingsChange,
  onClose
}) => {
  const isMobile = useIsMobile();
  const [timeZones, setTimeZones] = useState<TimeZone[]>(
    settings.timeZones || [
      { name: 'Local Time', timezone: Intl.DateTimeFormat().resolvedOptions().timeZone }
    ]
  );
  const [displayFormat, setDisplayFormat] = useState(settings.displayFormat || '12h');
  const [showSeconds, setShowSeconds] = useState(settings.showSeconds ?? true);
  const [compactMode, setCompactMode] = useState(settings.compactMode ?? false);
  const [clockStyle, setClockStyle] = useState(settings.clockStyle || 'modern');
  const [clockSize, setClockSize] = useState(settings.clockSize || 'large');
  const [newTimezoneName, setNewTimezoneName] = useState('');
  const [newTimezoneValue, setNewTimezoneValue] = useState('');

  const addTimezone = () => {
    if (newTimezoneName && newTimezoneValue && timeZones.length < 6) {
      setTimeZones([...timeZones, { name: newTimezoneName, timezone: newTimezoneValue }]);
      setNewTimezoneName('');
      setNewTimezoneValue('');
    }
  };

  const removeTimezone = (index: number) => {
    if (timeZones.length > 1) {
      setTimeZones(timeZones.filter((_, i) => i !== index));
    }
  };

  const handleSave = () => {
    const newSettings = {
      timeZones,
      displayFormat,
      showSeconds,
      compactMode,
      clockStyle,
      clockSize
    };
    onSettingsChange(newSettings);
    onClose();
  };

  return (
    <StandardSettingsTemplate
      widgetIcon={<Clock className={isMobile ? 'w-4 h-4' : 'w-5 h-5'} />}
      widgetName="Clock"
      onSave={handleSave}
      onCancel={onClose}
    >
      {/* Display Format */}
      <div className="space-y-3">
        <Label className={`font-mono text-primary ${isMobile ? 'text-sm' : 'text-sm'}`}>TIME FORMAT</Label>
        <Select value={displayFormat} onValueChange={setDisplayFormat}>
          <SelectTrigger className={`font-mono bg-background/50 border-border touch-target ${isMobile ? 'h-10' : ''}`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-background border-border">
            <SelectItem value="12h" className="font-mono touch-target">12 Hour (AM/PM)</SelectItem>
            <SelectItem value="24h" className="font-mono touch-target">24 Hour (Military)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Clock Style */}
      <div className="space-y-3">
        <Label className={`font-mono text-primary ${isMobile ? 'text-sm' : 'text-sm'}`}>CLOCK STYLE</Label>
        <Select value={clockStyle} onValueChange={setClockStyle}>
          <SelectTrigger className={`font-mono bg-background/50 border-border touch-target ${isMobile ? 'h-10' : ''}`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-background border-border">
            <SelectItem value="modern" className="font-mono touch-target">Modern</SelectItem>
            <SelectItem value="classic" className="font-mono touch-target">Classic</SelectItem>
            <SelectItem value="minimal" className="font-mono touch-target">Minimal</SelectItem>
            <SelectItem value="digital" className="font-mono touch-target">Digital</SelectItem>
            <SelectItem value="retro" className="font-mono touch-target">Retro</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Clock Size */}
      <div className="space-y-3">
        <Label className={`font-mono text-primary ${isMobile ? 'text-sm' : 'text-sm'}`}>CLOCK SIZE</Label>
        <Select value={clockSize} onValueChange={setClockSize}>
          <SelectTrigger className={`font-mono bg-background/50 border-border touch-target ${isMobile ? 'h-10' : ''}`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-background border-border">
            <SelectItem value="small" className="font-mono touch-target">Small</SelectItem>
            <SelectItem value="medium" className="font-mono touch-target">Medium</SelectItem>
            <SelectItem value="large" className="font-mono touch-target">Large</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Display Options */}
      <div className="space-y-4">
        <Label className={`font-mono text-primary ${isMobile ? 'text-sm' : 'text-sm'}`}>DISPLAY OPTIONS</Label>
        
        <div className={`flex justify-between ${isMobile ? 'flex-col gap-3' : 'items-center'}`}>
          <div className="space-y-1">
            <Label className={`font-mono text-foreground ${isMobile ? 'text-sm' : 'text-sm'}`}>Show Seconds</Label>
            <p className={`text-muted-foreground font-mono ${isMobile ? 'text-sm' : 'text-xs'}`}>
              Display seconds in time readout
            </p>
          </div>
          <RectangularSwitch checked={showSeconds} onCheckedChange={setShowSeconds} className="touch-target" />
        </div>

        <div className={`flex justify-between ${isMobile ? 'flex-col gap-3' : 'items-center'}`}>
          <div className="space-y-1">
            <Label className={`font-mono text-foreground ${isMobile ? 'text-sm' : 'text-sm'}`}>Compact Mode</Label>
            <p className={`text-muted-foreground font-mono ${isMobile ? 'text-sm' : 'text-xs'}`}>
              Reduce spacing for more time zones
            </p>
          </div>
          <RectangularSwitch checked={compactMode} onCheckedChange={setCompactMode} className="touch-target" />
        </div>
      </div>

      {/* World Clocks */}
      <div className="space-y-4">
        <Label className={`font-mono text-primary ${isMobile ? 'text-sm' : 'text-sm'}`}>WORLD CLOCKS</Label>
        
        {/* Current Time Zones */}
        <div className="space-y-2">
          {timeZones.map((tz, index) => (
            <div key={index} className={`flex items-center justify-between p-3 bg-background/30 border border-border/50 rounded ${isMobile ? 'flex-col gap-2' : ''}`}>
              <div className={`${isMobile ? 'w-full text-center' : ''}`}>
                <div className="font-mono text-foreground text-sm">{tz.name}</div>
                <div className="font-mono text-muted-foreground text-xs">{tz.timezone}</div>
              </div>
              {timeZones.length > 1 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeTimezone(index)}
                  className={`text-destructive hover:text-destructive touch-target retro-button ${isMobile ? 'w-full' : ''}`} 
                >
                  <X className="w-3 h-3 mr-1" />
                  Remove
                </Button>
              )}
            </div>
          ))}
        </div>

        {/* Add New Time Zone */}
        {timeZones.length < 6 && (
          <div className="space-y-3 p-4 border border-dashed border-border/50 rounded">
            <Label className="font-mono text-foreground text-sm">ADD NEW TIME ZONE</Label>
            
            <div className={`grid gap-3 ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
              <div className="space-y-2">
                <Label className="font-mono text-muted-foreground text-xs">Display Name</Label>
                <Input
                  placeholder="e.g., Tokyo"
                  value={newTimezoneName}
                  onChange={(e) => setNewTimezoneName(e.target.value)}
                  className={`font-mono bg-background/50 border-border touch-target ${isMobile ? 'h-10' : ''}`}
                />
              </div>
              
              <div className="space-y-2">
                <Label className="font-mono text-muted-foreground text-xs">Time Zone</Label>
                <Select value={newTimezoneValue} onValueChange={setNewTimezoneValue}>
                  <SelectTrigger className={`font-mono bg-background/50 border-border touch-target ${isMobile ? 'h-10' : ''}`}>
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border-border max-h-48">
                    <SelectItem value="America/New_York" className="font-mono touch-target">Eastern Time (NYC)</SelectItem>
                    <SelectItem value="America/Chicago" className="font-mono touch-target">Central Time (Chicago)</SelectItem>
                    <SelectItem value="America/Denver" className="font-mono touch-target">Mountain Time (Denver)</SelectItem>
                    <SelectItem value="America/Los_Angeles" className="font-mono touch-target">Pacific Time (LA)</SelectItem>
                    <SelectItem value="Europe/London" className="font-mono touch-target">GMT (London)</SelectItem>
                    <SelectItem value="Europe/Paris" className="font-mono touch-target">CET (Paris)</SelectItem>
                    <SelectItem value="Europe/Moscow" className="font-mono touch-target">MSK (Moscow)</SelectItem>
                    <SelectItem value="Asia/Tokyo" className="font-mono touch-target">JST (Tokyo)</SelectItem>
                    <SelectItem value="Asia/Shanghai" className="font-mono touch-target">CST (Shanghai)</SelectItem>
                    <SelectItem value="Asia/Dubai" className="font-mono touch-target">GST (Dubai)</SelectItem>
                    <SelectItem value="Australia/Sydney" className="font-mono touch-target">AEDT (Sydney)</SelectItem>
                    <SelectItem value="Pacific/Auckland" className="font-mono touch-target">NZDT (Auckland)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <Button
              onClick={addTimezone}
              disabled={!newTimezoneName || !newTimezoneValue}
              className={`w-full font-mono touch-target retro-button ${isMobile ? 'h-10' : ''}`}
            >
              <Plus className="w-4 h-4 mr-2" />
              ADD TIME ZONE
            </Button>
          </div>
        )}
      </div>
    </StandardSettingsTemplate>
  );
};