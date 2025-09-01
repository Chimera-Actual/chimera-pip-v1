import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clock, Globe, Settings, Plus, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useIsMobile } from '@/hooks/use-mobile';
import { StandardWidgetTemplate } from '@/components/Layout/StandardWidgetTemplate';
import { WidgetSettings } from '@/components/Layout/WidgetSettings';

interface WorldClock {
  id: string;
  label: string;
  timezone: string;
}

const COMMON_TIMEZONES = [{
  value: 'America/New_York',
  label: 'New York (EST/EDT)'
}, {
  value: 'America/Los_Angeles',
  label: 'Los Angeles (PST/PDT)'
}, {
  value: 'America/Chicago',
  label: 'Chicago (CST/CDT)'
}, {
  value: 'Europe/London',
  label: 'London (GMT/BST)'
}, {
  value: 'Europe/Paris',
  label: 'Paris (CET/CEST)'
}, {
  value: 'Europe/Berlin',
  label: 'Berlin (CET/CEST)'
}, {
  value: 'Asia/Tokyo',
  label: 'Tokyo (JST)'
}, {
  value: 'Asia/Shanghai',
  label: 'Shanghai (CST)'
}, {
  value: 'Asia/Dubai',
  label: 'Dubai (GST)'
}, {
  value: 'Australia/Sydney',
  label: 'Sydney (AEDT/AEST)'
}, {
  value: 'Pacific/Auckland',
  label: 'Auckland (NZDT/NZST)'
}];

interface ClockWidgetProps {
  settings?: Record<string, any>;
  widgetName?: string;
  widgetInstanceId?: string;
  onSettingsUpdate?: (newSettings: Record<string, any>) => void;
}

const ClockWidget: React.FC<ClockWidgetProps> = ({ settings, widgetName, widgetInstanceId, onSettingsUpdate }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [userTimezone, setUserTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [isAddingClock, setIsAddingClock] = useState(false);
  const [newTimezone, setNewTimezone] = useState('');
  const isMobile = useIsMobile();

  // Use settings from props, with defaults
  const is24Hour = settings?.displayFormat === '24h' || false;
  const clockStyle = settings?.clockStyle || 'modern';
  const clockSize = settings?.clockSize || 'large';
  
  // Convert timezone settings to WorldClock format if needed
  const worldClocks: WorldClock[] = settings?.timeZones 
    ? settings.timeZones.map((tz: any, index: number) => ({
        id: tz.id || String(index + 1),
        label: tz.name || tz.label || tz.timezone.split('/').pop()?.replace('_', ' ') || 'Unknown',
        timezone: tz.timezone
      }))
    : [{
        id: '1',
        label: 'UTC',
        timezone: 'UTC'
      }, {
        id: '2',
        label: 'London',
        timezone: 'Europe/London'
      }, {
        id: '3',
        label: 'Tokyo',
        timezone: 'Asia/Tokyo'
      }];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Try to get user's location for timezone
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(position => {
        // This is a simplified approach - in a real app you'd use a service to convert lat/lng to timezone
        const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        setUserTimezone(detectedTimezone);
      });
    }
  }, []);

  const formatTime = (time: Date, timezone: string, format24Hour: boolean) => {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: !format24Hour
    }).format(time);
  };

  const formatDate = (time: Date, timezone: string) => {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(time);
  };

  const addWorldClock = () => {
    if (newTimezone && worldClocks.length < 6 && onSettingsUpdate) {
      const timezone = COMMON_TIMEZONES.find(tz => tz.value === newTimezone);
      if (timezone) {
        const newClock: WorldClock = {
          id: Date.now().toString(),
          label: timezone.label.split(' ')[0],
          timezone: timezone.value
        };
        const updatedTimeZones = [...worldClocks, newClock];
        onSettingsUpdate({
          ...settings,
          timeZones: updatedTimeZones
        });
        setNewTimezone('');
        setIsAddingClock(false);
      }
    }
  };

  const removeWorldClock = (id: string) => {
    if (worldClocks.length > 1 && onSettingsUpdate) {
      const updatedTimeZones = worldClocks.filter(clock => clock.id !== id);
      onSettingsUpdate({
        ...settings,
        timeZones: updatedTimeZones
      });
    }
  };

  // Remove analog clock calculations as we're going digital-only
  const formatTimeWithoutSeconds = (time: Date, timezone: string, format24Hour: boolean) => {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: 'numeric',
      minute: '2-digit',
      hour12: !format24Hour
    }).format(time);
  };

  const getClockStyleClasses = (style: string, size: string) => {
    const sizeClasses = {
      small: {
        container: isMobile ? "text-xl px-2 py-1" : "text-2xl lg:text-4xl px-3 py-2",
        date: isMobile ? "text-xs mt-1" : "text-sm lg:text-base mt-1",
        timezone: "text-xs mt-1"
      },
      medium: {
        container: isMobile ? "text-2xl px-3 py-2" : "text-4xl lg:text-6xl px-4 py-2",
        date: isMobile ? "text-sm mt-1" : "text-base lg:text-lg mt-2",
        timezone: "text-xs mt-1"
      },
      large: {
        container: isMobile ? "text-4xl px-4 py-2" : "text-6xl lg:text-8xl px-6 py-3",
        date: isMobile ? "text-base mt-2" : "text-xl lg:text-2xl mt-3",
        timezone: "text-xs mt-1"
      },
      'extra-large': {
        container: isMobile ? "text-5xl px-4 py-3" : "text-8xl lg:text-9xl px-8 py-4",
        date: isMobile ? "text-lg mt-2" : "text-2xl lg:text-3xl mt-4",
        timezone: isMobile ? "text-xs mt-1" : "text-sm mt-2"
      }
    };

    const currentSize = sizeClasses[size as keyof typeof sizeClasses] || sizeClasses.large;

    switch (style) {
      case 'classic':
        return {
          container: `font-['VT323'] text-foreground ${currentSize.container} leading-none tracking-wider bg-card border-2 border-border rounded`,
          date: `font-['VT323'] text-muted-foreground ${currentSize.date} tracking-wider`,
          timezone: `font-mono ${currentSize.timezone} text-muted-foreground opacity-60 uppercase tracking-widest`
        };
      case 'neon':
        return {
          container: `font-['VT323'] text-primary ${currentSize.container} leading-none tracking-wider bg-primary/5 border-2 border-primary rounded-xl shadow-[0_0_80px_rgba(34,197,94,0.8)] animate-pulse`,
          date: `font-['VT323'] text-primary ${currentSize.date} tracking-wider drop-shadow-[0_0_10px_rgba(34,197,94,0.8)]`,
          timezone: `font-mono ${currentSize.timezone} text-primary opacity-80 uppercase tracking-widest drop-shadow-[0_0_5px_rgba(34,197,94,0.6)]`
        };
      case 'minimal':
        return {
          container: `font-sans text-foreground ${currentSize.container} font-light leading-none tracking-tight`,
          date: `font-sans text-muted-foreground ${currentSize.date} font-light tracking-normal`,
          timezone: `font-sans ${currentSize.timezone} text-muted-foreground opacity-50 uppercase tracking-wider font-medium`
        };
      case 'retro':
        return {
          container: `font-mono text-primary ${currentSize.container} leading-none tracking-widest bg-background border border-primary/50 rounded-none shadow-none`,
          date: `font-mono text-accent ${currentSize.date} tracking-widest uppercase`,
          timezone: `font-mono ${currentSize.timezone} text-muted-foreground opacity-75 uppercase tracking-[0.3em]`
        };
      case 'digital':
        return {
          container: `font-mono text-accent ${currentSize.container} font-bold leading-none tracking-wider bg-background/80 border border-accent/30 rounded-sm shadow-inner`,
          date: `font-mono text-muted-foreground ${currentSize.date} font-medium tracking-wide`,
          timezone: `font-mono ${currentSize.timezone} text-accent/70 opacity-80 uppercase tracking-widest font-bold`
        };
      default: // modern
        return {
          container: `font-['VT323'] text-primary ${currentSize.container} crt-glow leading-none tracking-wider bg-gradient-to-br from-primary/20 to-primary/10 border-2 border-primary/50 rounded-xl backdrop-blur-sm shadow-[0_0_50px_rgba(34,197,94,0.4)] animate-pulse`,
          date: `font-['VT323'] text-accent ${currentSize.date} tracking-wider opacity-90`,
          timezone: `font-mono ${currentSize.timezone} text-muted-foreground opacity-60 uppercase tracking-widest`
        };
    }
  };

  const [showSettings, setShowSettings] = useState(false);

  const headerControls = (
    <div className="flex items-center gap-2">
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <Globe className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add World Clock</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Select value={newTimezone} onValueChange={setNewTimezone}>
              <SelectTrigger>
                <SelectValue placeholder="Select timezone" />
              </SelectTrigger>
              <SelectContent>
                {COMMON_TIMEZONES.map(tz => (
                  <SelectItem key={tz.value} value={tz.value}>
                    {tz.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex justify-end gap-2">
              <Button onClick={addWorldClock} disabled={!newTimezone || worldClocks.length >= 6}>
                <Plus className="h-4 w-4" />
                Add Clock
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setShowSettings(true)}>
        <Settings className="h-4 w-4" />
      </Button>
    </div>
  );

  return (
    <StandardWidgetTemplate
      icon={<Clock className="h-5 w-5" />}
      title={widgetName || 'CHRONOMETER'}
      controls={headerControls}
    >
      {/* Main Clock Area - Digital Only */}
      <div className="flex-1 p-4 flex flex-col justify-center">
        {/* Large Digital Clock Display */}
        <div className="flex-1 flex flex-col justify-center items-center space-y-6">
          {/* Main Time Display */}
          <div className="text-center">
            <div className="relative">
              <div className={getClockStyleClasses(clockStyle, clockSize).container}>
                {formatTime(currentTime, userTimezone, is24Hour)}
              </div>
              {clockStyle === 'modern' && (
                <div className="absolute inset-0 bg-gradient-to-t from-transparent via-primary/5 to-primary/10 rounded-xl pointer-events-none"></div>
              )}
            </div>
            <div className={getClockStyleClasses(clockStyle, clockSize).date}>
              {formatDate(currentTime, userTimezone)}
            </div>
            <div className={getClockStyleClasses(clockStyle, clockSize).timezone}>
              {userTimezone.replace('_', ' ')}
            </div>
          </div>
        </div>
      </div>

      {/* World Clocks Strip */}
      <div className="flex-shrink-0 border-t border-border bg-background/50 p-3">
        <div className={`grid gap-3 ${isMobile ? 'grid-cols-1' : 'sm:grid-cols-2 lg:grid-cols-3'}`}>
          {worldClocks.map(clock => (
            <div key={clock.id} className="bg-background/20 border-2 border-primary/30 rounded p-3 text-center backdrop-blur-sm relative group">
              <div className="text-xs text-muted-foreground font-mono uppercase tracking-wider mb-1">{clock.label}</div>
              <div className="font-['VT323'] text-primary text-lg crt-glow">
                {formatTime(currentTime, clock.timezone, is24Hour)}
              </div>
              <div className="text-xs text-muted-foreground font-mono mt-1 opacity-75">
                {formatDate(currentTime, clock.timezone)}
              </div>
              {worldClocks.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute -top-2 -right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity bg-destructive text-destructive-foreground rounded-full"
                  onClick={() => removeWorldClock(clock.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>
      <WidgetSettings
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        widget={{
          id: widgetInstanceId || 'clock-widget',
          widget_definition: { component_name: 'ClockWidget' }
        } as any}
        onSettingsUpdate={(widgetId, newSettings) => onSettingsUpdate?.(newSettings)}
        currentSettings={settings || {}}
      />
    </StandardWidgetTemplate>
  );
};

export default ClockWidget;