import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clock, Globe } from 'lucide-react';

interface WorldClock {
  id: string;
  label: string;
  timezone: string;
}

const COMMON_TIMEZONES = [
  { value: 'America/New_York', label: 'New York (EST/EDT)' },
  { value: 'America/Los_Angeles', label: 'Los Angeles (PST/PDT)' },
  { value: 'America/Chicago', label: 'Chicago (CST/CDT)' },
  { value: 'Europe/London', label: 'London (GMT/BST)' },
  { value: 'Europe/Paris', label: 'Paris (CET/CEST)' },
  { value: 'Europe/Berlin', label: 'Berlin (CET/CEST)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  { value: 'Asia/Shanghai', label: 'Shanghai (CST)' },
  { value: 'Asia/Dubai', label: 'Dubai (GST)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEDT/AEST)' },
  { value: 'Pacific/Auckland', label: 'Auckland (NZDT/NZST)' },
];

interface ClockWidgetProps {
  settings?: Record<string, any>;
}

export const ClockWidget: React.FC<ClockWidgetProps> = ({ settings = {} }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [userTimezone, setUserTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);
  
  // Use settings or defaults
  const is24Hour = settings.displayFormat === '24h';
  const showSeconds = settings.showSeconds ?? true;
  const worldClocks = settings.timeZones || [
    { name: 'UTC', timezone: 'UTC' },
    { name: 'London', timezone: 'Europe/London' },
    { name: 'Tokyo', timezone: 'Asia/Tokyo' },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Try to get user's location for timezone
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        // This is a simplified approach - in a real app you'd use a service to convert lat/lng to timezone
        const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        setUserTimezone(detectedTimezone);
      });
    }
  }, []);

  const formatTime = (time: Date, timezone: string, format24Hour: boolean) => {
    const options: Intl.DateTimeFormatOptions = {
      timeZone: timezone,
      hour: 'numeric',
      minute: '2-digit',
      hour12: !format24Hour,
    };
    
    if (showSeconds) {
      options.second = '2-digit';
    }
    
    return new Intl.DateTimeFormat('en-US', options).format(time);
  };

  const formatDate = (time: Date, timezone: string) => {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(time);
  };


  // Remove analog clock calculations as we're going digital-only
  const formatTimeWithoutSeconds = (time: Date, timezone: string, format24Hour: boolean) => {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: 'numeric',
      minute: '2-digit',
      hour12: !format24Hour,
    }).format(time);
  };

  return (
    <div className="h-full flex flex-col bg-card border border-border overflow-hidden">
      {/* Header Controls */}
      <div className="flex-shrink-0 border-b border-border bg-card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary crt-glow" />
            <span className="text-primary font-mono text-lg uppercase tracking-wider crt-glow">
              ◐ CHRONOMETER
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="font-mono text-xs text-muted-foreground px-2 py-1 bg-background/30 rounded border">
              {is24Hour ? '24H' : '12H'}
            </div>
          </div>
        </div>
      </div>

      {/* Main Clock Area - Digital Only */}
      <div className="flex-1 p-4 flex flex-col justify-center">
        {/* Large Digital Clock Display */}
        <div className="flex-1 flex flex-col justify-center items-center space-y-6">
          {/* Main Time Display */}
          <div className="text-center">
            <div className="font-['VT323'] text-primary text-7xl lg:text-9xl crt-glow leading-none tracking-wider bg-background/20 border-2 border-primary/30 rounded-lg px-8 py-4 backdrop-blur-sm shadow-[0_0_30px_rgba(34,197,94,0.3)]">
              {formatTime(currentTime, userTimezone, is24Hour)}
            </div>
            <div className="font-['VT323'] text-muted-foreground text-2xl lg:text-3xl mt-4 tracking-wider">
              {formatDate(currentTime, userTimezone)}
            </div>
            <div className="font-mono text-sm text-muted-foreground mt-2 opacity-75">
              {userTimezone.replace('_', ' ').toUpperCase()}
            </div>
          </div>

        </div>
      </div>

      {/* World Clocks Strip */}
      <div className="flex-shrink-0 border-b border-border bg-background/50 p-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {worldClocks.map((clock, index) => (
            <div key={`${clock.timezone}-${index}`} className="bg-background/20 border-2 border-primary/30 rounded p-2 text-center backdrop-blur-sm">
              <div className="text-xs text-muted-foreground font-mono uppercase tracking-wider">{clock.name}</div>
              <div className="font-['VT323'] text-primary text-lg crt-glow">
                {formatTime(currentTime, clock.timezone, is24Hour)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};