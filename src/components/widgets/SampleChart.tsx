import React, { useEffect, useState } from "react";
import { Activity, TrendingUp } from "lucide-react";
import WidgetFrame from "@/components/dashboard/WidgetFrame";
import WidgetSettingsModal from "@/components/dashboard/WidgetSettingsModal";
import { motion } from "framer-motion";
import { BaseWidgetProps } from "@/types/widget";

interface DataPoint {
  time: number;
  value: number;
}

export default function SampleChart({ 
  widgetInstanceId, 
  settings: externalSettings, 
  onSettingsChange,
  widgetName,
  title = "System Monitor",
  onCollapseChange
}: BaseWidgetProps) {
  const [data, setData] = useState<DataPoint[]>([]);
  const [isActive, setIsActive] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // Default settings for this widget type
  const defaultSettings = {
    name: title || "System Monitor",
    autoRefresh: true,
    refreshRate: 1,
    opacity: 100,
    theme: 'default' as 'default' | 'accent' | 'muted',
    fontSize: 'medium' as 'small' | 'medium' | 'large',
    showBorder: true,
    dataPoints: 50,
    showGrid: true,
    showStats: true,
    animateChart: true
  };

  // Instance-specific storage key
  const getSettingsStorageKey = () => `widget-${widgetInstanceId}-settings`;
  
  // Load settings from external props or localStorage with instance-specific key  
  const [settings, setSettings] = useState(() => {
    if (externalSettings) return { ...defaultSettings, ...externalSettings };
    
    try {
      const saved = localStorage.getItem(getSettingsStorageKey());
      return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
    } catch {
      return defaultSettings;
    }
  });

  // Save settings to localStorage when they change
  useEffect(() => {
    try {
      localStorage.setItem(getSettingsStorageKey(), JSON.stringify(settings)); 
      onSettingsChange?.(settings);
    } catch (error) {
      console.warn('Failed to save widget settings:', error);
    }
  }, [settings, widgetInstanceId, onSettingsChange]);

  useEffect(() => {
    // Generate initial data points
    const initialData = Array.from({ length: settings.dataPoints }, (_, i) => ({
      time: Date.now() - (settings.dataPoints - i) * 1000,
      value: Math.random() * 100
    }));
    setData(initialData);

    // Update data every second when active
    const interval = setInterval(() => {
      if (isActive && settings.autoRefresh) {
        setData(prev => {
          const newPoint = {
            time: Date.now(),
            value: Math.random() * 100
          };
          return [...prev.slice(1), newPoint];
        });
      }
    }, (settings.refreshRate || 1) * 1000);

    return () => clearInterval(interval);
  }, [isActive, settings.autoRefresh, settings.refreshRate, settings.dataPoints]);

  const toggleActive = () => setIsActive(!isActive);

  // Generate SVG path from data points
  const generatePath = () => {
    if (data.length === 0) return "";
    
    const width = 100;
    const height = 60;
    
    const points = data.map((point, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = height - (point.value / 100) * height;
      return `${x},${y}`;
    });
    
    return `M ${points.join(" L ")}`;
  };

  const currentValue = data[data.length - 1]?.value || 0;
  const previousValue = data[data.length - 2]?.value || 0;
  const trend = currentValue > previousValue ? "up" : "down";

  const getFontSizeClass = () => {
    if (settings.fontSize === 'small') return 'text-sm';
    if (settings.fontSize === 'large') return 'text-xl';
    return 'text-lg';
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
        onSettings={() => setIsSettingsOpen(true)}
        className={!settings.showBorder ? 'border-none' : ''}
        style={{ opacity: settings.opacity / 100 }}
        widgetId={widgetInstanceId}
        onCollapseChange={onCollapseChange}
        right={
          <div className="flex items-center space-x-2">
            <button 
              onClick={toggleActive}
              className={`text-xs px-2 py-1 rounded ${isActive ? 'crt-button' : 'opacity-50'}`}
            >
              {isActive ? "ACTIVE" : "PAUSED"}
            </button>
            <Activity className={`w-4 h-4 ${isActive ? 'crt-accent animate-pulse' : 'crt-muted'}`} />
          </div>
        }
      >
        <div className="flex flex-col h-full space-y-4">
          {/* Chart */}
          <div className="flex-1 relative">
            <svg 
              className="w-full h-full" 
              viewBox="0 0 100 60" 
              preserveAspectRatio="none"
              style={{ minHeight: '120px' }}
            >
              {/* Grid lines */}
              {settings.showGrid && (
                <>
                  <defs>
                    <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                      <path d="M 10 0 L 0 0 0 10" fill="none" stroke="var(--crt-border)" strokeWidth="0.2" opacity="0.3"/>
                    </pattern>
                  </defs>
                  <rect width="100" height="60" fill="url(#grid)" />
                </>
              )}
              
              {/* Data line */}
              {settings.animateChart ? (
                <motion.path
                  d={generatePath()}
                  fill="none"
                  stroke="var(--crt-accent)"
                  strokeWidth="1.5"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                />
              ) : (
                <path
                  d={generatePath()}
                  fill="none"
                  stroke="var(--crt-accent)"
                  strokeWidth="1.5"
                />
              )}
              
              {/* Glow effect */}
              <path
                d={generatePath()}
                fill="none"
                stroke="var(--crt-accent)"
                strokeWidth="3"
                opacity="0.3"
                filter="blur(1px)"
              />
            </svg>
            
            {/* Overlay indicators */}
            {isActive && (
              <motion.div 
                className="absolute top-2 right-2 w-2 h-2 bg-[var(--crt-accent)] rounded-full"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
            )}
          </div>
          
          {/* Stats */}
          {settings.showStats && (
            <div className="grid grid-cols-3 gap-4 text-center border-t crt-border pt-3">
              <div>
                <div className={`${getFontSizeClass()} font-mono ${getThemeClass()} font-bold`}>
                  {currentValue.toFixed(1)}
                </div>
                <div className="text-xs crt-muted uppercase">Current</div>
              </div>
              
              <div>
                <div className={`${getFontSizeClass()} font-mono font-bold flex items-center justify-center space-x-1 ${
                  trend === 'up' ? 'crt-accent' : 'text-red-400'
                }`}>
                  <TrendingUp className={`w-4 h-4 ${trend === 'down' ? 'rotate-180' : ''}`} />
                  <span>{Math.abs(currentValue - previousValue).toFixed(1)}</span>
                </div>
                <div className="text-xs crt-muted uppercase">Change</div>
              </div>
              
              <div>
                <div className={`${getFontSizeClass()} font-mono ${getThemeClass()} font-bold`}>
                  {data.length > 0 ? (data.reduce((sum, p) => sum + p.value, 0) / data.length).toFixed(1) : '0.0'}
                </div>
                <div className="text-xs crt-muted uppercase">Average</div>
              </div>
            </div>
          )}
        </div>
      </WidgetFrame>

      <WidgetSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSave={setSettings}
        onReset={() => setSettings(defaultSettings)}
        widgetType="SampleChart"
        currentSettings={settings}
        widgetName="System Monitor"
      />
    </>
  );
}