import React, { useState, useEffect } from 'react';

interface SampleClockProps {
  settings?: Record<string, any>;
  widgetName?: string;
  widgetInstanceId?: string;
  onSettingsUpdate?: (newSettings: Record<string, any>) => void;
}

const SampleClock: React.FC<SampleClockProps> = ({ settings, widgetName }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  
  const is24Hour = settings?.format24Hour || false;
  const showSeconds = settings?.showSeconds ?? true;
  const showDate = settings?.showDate ?? true;

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      ...(showSeconds && { second: '2-digit' }),
      hour12: !is24Hour
    }).format(date);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };

  return (
    <div className="h-full flex flex-col bg-card border border-border overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-border bg-card p-3">
        <span className="text-primary font-mono text-sm uppercase tracking-wider crt-glow">
          ⏰ {widgetName || 'SYSTEM CLOCK'}
        </span>
      </div>

      {/* Main Clock Display */}
      <div className="flex-1 flex flex-col justify-center items-center p-4">
        <div className="text-center">
          <div className="font-['VT323'] text-4xl lg:text-6xl text-primary crt-glow leading-none tracking-wider">
            {formatTime(currentTime)}
          </div>
          {showDate && (
            <div className="font-['VT323'] text-lg text-accent mt-2 tracking-wider">
              {formatDate(currentTime)}
            </div>
          )}
          <div className="font-mono text-xs text-muted-foreground mt-2 uppercase tracking-widest">
            {Intl.DateTimeFormat().resolvedOptions().timeZone.replace('_', ' ')}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SampleClock;