import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Plus, X, Save } from 'lucide-react';
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
    <div className={`space-y-4 md:space-y-6 ${isMobile ? 'p-4' : 'p-6'}`}>
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
          <Switch checked={showSeconds} onCheckedChange={setShowSeconds} className="touch-target" />
        </div>

        <div className={`flex justify-between ${isMobile ? 'flex-col gap-3' : 'items-center'}`}>
          <div className="space-y-1">
            <Label className={`font-mono text-foreground ${isMobile ? 'text-sm' : 'text-sm'}`}>Compact Mode</Label>
            <p className={`text-muted-foreground font-mono ${isMobile ? 'text-sm' : 'text-xs'}`}>
              Reduce spacing for more time zones
            </p>
          </div>
          <Switch checked={compactMode} onCheckedChange={setCompactMode} className="touch-target" />
        </div>
      </div>

      {/* Actions */}
      <div className={`flex gap-3 pt-4 border-t border-border ${isMobile ? 'flex-col' : 'justify-end'}`}>
        <Button variant="outline" onClick={onClose} className={`font-mono touch-target ${isMobile ? 'h-10' : ''}`}>
          CANCEL
        </Button>
        <Button onClick={handleSave} className={`font-mono touch-target ${isMobile ? 'h-10' : ''}`}>
          <Save className="w-4 h-4 mr-2" />
          SAVE SETTINGS
        </Button>
      </div>
    </div>
  );
};