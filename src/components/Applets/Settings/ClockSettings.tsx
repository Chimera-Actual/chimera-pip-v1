import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Plus, X, Save } from 'lucide-react';

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
    <div className="space-y-6 p-6">
      {/* Display Format */}
      <div className="space-y-3">
        <Label className="text-sm font-mono text-primary">TIME FORMAT</Label>
        <Select value={displayFormat} onValueChange={setDisplayFormat}>
          <SelectTrigger className="font-mono bg-background/50 border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-background border-border">
            <SelectItem value="12h" className="font-mono">12 Hour (AM/PM)</SelectItem>
            <SelectItem value="24h" className="font-mono">24 Hour (Military)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Clock Style */}
      <div className="space-y-3">
        <Label className="text-sm font-mono text-primary">CLOCK STYLE</Label>
        <Select value={clockStyle} onValueChange={setClockStyle}>
          <SelectTrigger className="font-mono bg-background/50 border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-background border-border">
            <SelectItem value="modern" className="font-mono">Modern (Gradient)</SelectItem>
            <SelectItem value="classic" className="font-mono">Classic (Simple)</SelectItem>
            <SelectItem value="neon" className="font-mono">Neon (Bright Glow)</SelectItem>
            <SelectItem value="minimal" className="font-mono">Minimal (Clean)</SelectItem>
            <SelectItem value="retro" className="font-mono">Retro (Terminal)</SelectItem>
            <SelectItem value="digital" className="font-mono">Digital (LCD)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Clock Size */}
      <div className="space-y-3">
        <Label className="text-sm font-mono text-primary">CLOCK SIZE</Label>
        <Select value={clockSize} onValueChange={setClockSize}>
          <SelectTrigger className="font-mono bg-background/50 border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-background border-border">
            <SelectItem value="small" className="font-mono">Small</SelectItem>
            <SelectItem value="medium" className="font-mono">Medium</SelectItem>
            <SelectItem value="large" className="font-mono">Large</SelectItem>
            <SelectItem value="extra-large" className="font-mono">Extra Large</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Display Options */}
      <div className="space-y-4">
        <Label className="text-sm font-mono text-primary">DISPLAY OPTIONS</Label>
        
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label className="text-sm font-mono text-foreground">Show Seconds</Label>
            <p className="text-xs text-muted-foreground font-mono">
              Display seconds in time readout
            </p>
          </div>
          <Switch checked={showSeconds} onCheckedChange={setShowSeconds} />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label className="text-sm font-mono text-foreground">Compact Mode</Label>
            <p className="text-xs text-muted-foreground font-mono">
              Reduce spacing for more time zones
            </p>
          </div>
          <Switch checked={compactMode} onCheckedChange={setCompactMode} />
        </div>
      </div>

      {/* Time Zones */}
      <div className="space-y-4">
        <Label className="text-sm font-mono text-primary">TIME ZONES ({timeZones.length}/6)</Label>
        
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {timeZones.map((tz, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-background/30 border border-border rounded">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-mono text-foreground truncate">{tz.name}</div>
                <div className="text-xs text-muted-foreground font-mono truncate">{tz.timezone}</div>
              </div>
              {timeZones.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeTimezone(index)}
                  className="ml-2 p-1 h-6 w-6 text-destructive hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          ))}
        </div>

        {/* Add New Timezone */}
        {timeZones.length < 6 && (
          <div className="space-y-3 p-4 bg-background/20 border border-border rounded">
            <Label className="text-xs font-mono text-muted-foreground">ADD TIME ZONE</Label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground font-mono">NAME</Label>
                <Input
                  placeholder="e.g., Tokyo"
                  value={newTimezoneName}
                  onChange={(e) => setNewTimezoneName(e.target.value)}
                  className="font-mono text-xs bg-background/50"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground font-mono">TIMEZONE</Label>
                <Select value={newTimezoneValue} onValueChange={setNewTimezoneValue}>
                  <SelectTrigger className="font-mono text-xs bg-background/50">
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border-border max-h-48">
                    <SelectItem value="Asia/Tokyo" className="font-mono text-xs">Asia/Tokyo</SelectItem>
                    <SelectItem value="Europe/London" className="font-mono text-xs">Europe/London</SelectItem>
                    <SelectItem value="America/New_York" className="font-mono text-xs">America/New_York</SelectItem>
                    <SelectItem value="America/Los_Angeles" className="font-mono text-xs">America/Los_Angeles</SelectItem>
                    <SelectItem value="America/Chicago" className="font-mono text-xs">America/Chicago</SelectItem>
                    <SelectItem value="Europe/Paris" className="font-mono text-xs">Europe/Paris</SelectItem>
                    <SelectItem value="Asia/Shanghai" className="font-mono text-xs">Asia/Shanghai</SelectItem>
                    <SelectItem value="Australia/Sydney" className="font-mono text-xs">Australia/Sydney</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button
              onClick={addTimezone}
              disabled={!newTimezoneName || !newTimezoneValue}
              variant="outline"
              size="sm"
              className="w-full font-mono text-xs"
            >
              <Plus className="w-3 h-3 mr-1" />
              ADD TIMEZONE
            </Button>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-border">
        <Button variant="outline" onClick={onClose} className="font-mono">
          CANCEL
        </Button>
        <Button onClick={handleSave} className="font-mono">
          <Save className="w-4 h-4 mr-2" />
          SAVE SETTINGS
        </Button>
      </div>
    </div>
  );
};