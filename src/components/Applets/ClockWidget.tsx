import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clock, Globe, Settings, Plus, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

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

export const ClockWidget: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [is24Hour, setIs24Hour] = useState(false);
  const [userTimezone, setUserTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [worldClocks, setWorldClocks] = useState<WorldClock[]>([
    { id: '1', label: 'UTC', timezone: 'UTC' },
    { id: '2', label: 'London', timezone: 'Europe/London' },
    { id: '3', label: 'Tokyo', timezone: 'Asia/Tokyo' },
  ]);
  const [isAddingClock, setIsAddingClock] = useState(false);
  const [newTimezone, setNewTimezone] = useState('');

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
    return new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: !format24Hour,
    }).format(time);
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

  const addWorldClock = () => {
    if (newTimezone && worldClocks.length < 6) {
      const timezone = COMMON_TIMEZONES.find(tz => tz.value === newTimezone);
      if (timezone) {
        const newClock: WorldClock = {
          id: Date.now().toString(),
          label: timezone.label.split(' ')[0],
          timezone: timezone.value,
        };
        setWorldClocks([...worldClocks, newClock]);
        setNewTimezone('');
        setIsAddingClock(false);
      }
    }
  };

  const removeWorldClock = (id: string) => {
    if (worldClocks.length > 1) {
      setWorldClocks(worldClocks.filter(clock => clock.id !== id));
    }
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
            <Button
              variant={is24Hour ? "default" : "outline"}
              size="sm"
              onClick={() => setIs24Hour(!is24Hour)}
              className="font-mono text-xs"
            >
              {is24Hour ? '24H' : '12H'}
            </Button>
            <Dialog open={isAddingClock} onOpenChange={setIsAddingClock}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="font-mono text-xs">
                  <Settings className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border">
                <DialogHeader>
                  <DialogTitle className="text-primary font-mono">Manage World Clocks</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Select value={newTimezone} onValueChange={setNewTimezone}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select timezone..." />
                      </SelectTrigger>
                      <SelectContent>
                        {COMMON_TIMEZONES.map((tz) => (
                          <SelectItem key={tz.value} value={tz.value}>
                            {tz.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button onClick={addWorldClock} disabled={!newTimezone || worldClocks.length >= 6}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {worldClocks.map((clock) => (
                      <div key={clock.id} className="flex items-center justify-between p-2 border border-border rounded">
                        <span className="font-mono text-sm">{clock.label}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeWorldClock(clock.id)}
                          disabled={worldClocks.length <= 1}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
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
          {worldClocks.map((clock) => (
            <div key={clock.id} className="bg-background/20 border-2 border-primary/30 rounded p-2 text-center backdrop-blur-sm">
              <div className="text-xs text-muted-foreground font-mono uppercase tracking-wider">{clock.label}</div>
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