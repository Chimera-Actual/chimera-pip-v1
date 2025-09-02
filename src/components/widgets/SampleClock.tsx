import React, { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import WidgetFrame from "@/components/dashboard/WidgetFrame";
import WidgetSettingsModal from "@/components/dashboard/WidgetSettingsModal";
import { motion } from "framer-motion";
import { BaseWidgetProps } from "@/types/widget";

export default function SampleClock({ 
  widgetInstanceId, 
  settings: externalSettings, 
  onSettingsChange,
  widgetName,
  title = "System Clock"
}: BaseWidgetProps) {
  const [time, setTime] = useState(new Date());
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // Default settings for this widget type
  const defaultSettings = {
    name: title || "System Clock",
    showSeconds: true,
    format24h: true,
    showDate: true,
    autoRefresh: true,
    refreshRate: 1,
    opacity: 100,
    theme: 'default' as 'default' | 'accent' | 'muted',
    fontSize: 'medium' as 'small' | 'medium' | 'large',
    showBorder: true
  };

  // Load settings from external props or localStorage with instance-specific key
  const getStorageKey = () => `widget-${widgetInstanceId}-settings`;
  
  const [settings, setSettings] = useState(() => {
    if (externalSettings) return { ...defaultSettings, ...externalSettings };
    
    try {
      const saved = localStorage.getItem(getStorageKey());
      return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
    } catch {
      return defaultSettings;
    }
  });

  // Save settings to localStorage when they change
  useEffect(() => {
    try {
      localStorage.setItem(getStorageKey(), JSON.stringify(settings));
      onSettingsChange?.(settings);
    } catch (error) {
      console.warn('Failed to save widget settings:', error);
    }
  }, [settings, widgetInstanceId, onSettingsChange]);

  useEffect(() => {
    if (!settings.autoRefresh) return;
    
    const interval = setInterval(() => {
      setTime(new Date());
    }, (settings.refreshRate || 1) * 1000);

    return () => clearInterval(interval);
  }, [settings.autoRefresh, settings.refreshRate]);

  const timeString = time.toLocaleTimeString([], { 
    hour12: !settings.format24h,
    hour: '2-digit',
    minute: '2-digit',
    second: settings.showSeconds ? '2-digit' : undefined
  });

  const dateString = time.toLocaleDateString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  const getFontSizeClass = () => {
    if (settings.fontSize === 'small') return 'text-2xl lg:text-3xl';
    if (settings.fontSize === 'large') return 'text-5xl lg:text-6xl';
    return 'text-4xl lg:text-5xl';
  };

  const getThemeClass = () => {
    if (settings.theme === 'accent') return 'crt-accent';
    if (settings.theme === 'muted') return 'crt-muted';
    return 'crt-text';
  };

  return (
    <>
      <WidgetFrame 
        title={settings.name}
        right={<Clock className="w-4 h-4 crt-accent" />}
        onSettings={() => setIsSettingsOpen(true)}
        className={!settings.showBorder ? 'border-none' : ''}
        style={{ opacity: settings.opacity / 100 }}
        widgetId={widgetInstanceId}
      >
        <div className="flex flex-col items-center justify-center h-full space-y-4">
          <motion.div 
            className={`${getFontSizeClass()} font-mono ${getThemeClass()} font-bold tracking-wider`}
            key={timeString}
            initial={{ scale: 1 }}
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ duration: 0.1 }}
          >
            {timeString}
          </motion.div>
          
          {settings.showDate && (
            <div className="text-sm font-mono crt-muted uppercase tracking-wide">
              {dateString}
            </div>
          )}
          
          <div className="flex items-center space-x-4 text-xs font-mono crt-accent">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-current rounded-full animate-pulse" />
              <span>ONLINE</span>
            </div>
            <div>UTC{time.getTimezoneOffset() > 0 ? '-' : '+'}{Math.abs(time.getTimezoneOffset() / 60)}</div>
          </div>
        </div>
      </WidgetFrame>

      <WidgetSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSave={setSettings}
        onReset={() => setSettings(defaultSettings)}
        widgetType="SampleClock"
        currentSettings={settings}
        widgetName="System Clock"
      />
    </>
  );
}