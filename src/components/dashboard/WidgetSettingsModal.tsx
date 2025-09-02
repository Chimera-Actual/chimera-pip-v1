import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Settings, Palette, Monitor, Type, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';

interface WidgetSettings {
  name?: string;
  refreshRate?: number;
  opacity?: number;
  theme?: 'default' | 'accent' | 'muted';
  showBorder?: boolean;
  autoRefresh?: boolean;
  customColor?: string;
  fontSize?: 'small' | 'medium' | 'large';
  [key: string]: any;
}

interface WidgetSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (settings: WidgetSettings) => void;
  onReset: () => void;
  widgetType: string;
  currentSettings: WidgetSettings;
  widgetName: string;
}

export default function WidgetSettingsModal({
  isOpen,
  onClose,
  onSave,
  onReset,
  widgetType,
  currentSettings,
  widgetName
}: WidgetSettingsModalProps) {
  const [settings, setSettings] = useState<WidgetSettings>(currentSettings);

  const handleSave = () => {
    onSave(settings);
    onClose();
  };

  const handleReset = () => {
    onReset();
    onClose();
  };

  const updateSetting = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="crt-card w-[500px] max-w-[90vw] max-h-[85vh] overflow-hidden mx-auto"
        onClick={(e) => e.stopPropagation()}
      >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b crt-border">
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5 crt-accent" />
              <div>
                <h2 className="text-lg font-bold crt-text">Widget Settings</h2>
                <p className="text-sm crt-muted">{widgetName}</p>
              </div>
            </div>
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Settings Content */}
          <div className="p-4 max-h-96 overflow-y-auto space-y-6">
            {/* General Settings */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Monitor className="w-4 h-4 crt-accent" />
                <h3 className="font-medium crt-text">General</h3>
              </div>

              <div className="space-y-2">
                <Label htmlFor="widget-name" className="text-sm crt-text">Widget Name</Label>
                <Input
                  id="widget-name"
                  value={settings.name || widgetName}
                  onChange={(e) => updateSetting('name', e.target.value)}
                  placeholder="Enter widget name"
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="auto-refresh" className="text-sm crt-text">Auto Refresh</Label>
                <Switch
                  id="auto-refresh"
                  checked={settings.autoRefresh ?? true}
                  onCheckedChange={(checked) => updateSetting('autoRefresh', checked)}
                />
              </div>

              {settings.autoRefresh !== false && (
                <div className="space-y-2">
                  <Label className="text-sm crt-text">Refresh Rate (seconds)</Label>
                  <div className="px-2">
                    <Slider
                      value={[settings.refreshRate ?? 1]}
                      onValueChange={([value]) => updateSetting('refreshRate', value)}
                      max={60}
                      min={1}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs crt-muted mt-1">
                      <span>1s</span>
                      <span>{settings.refreshRate ?? 1}s</span>
                      <span>60s</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Appearance Settings */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Palette className="w-4 h-4 crt-accent" />
                <h3 className="font-medium crt-text">Appearance</h3>
              </div>

              <div className="space-y-2">
                <Label className="text-sm crt-text">Theme</Label>
                <Select
                  value={settings.theme ?? 'default'}
                  onValueChange={(value: 'default' | 'accent' | 'muted') => updateSetting('theme', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default</SelectItem>
                    <SelectItem value="accent">Accent</SelectItem>
                    <SelectItem value="muted">Muted</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm crt-text">Font Size</Label>
                <Select
                  value={settings.fontSize ?? 'medium'}
                  onValueChange={(value: 'small' | 'medium' | 'large') => updateSetting('fontSize', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Small</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="large">Large</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm crt-text">Opacity</Label>
                <div className="px-2">
                  <Slider
                    value={[settings.opacity ?? 100]}
                    onValueChange={([value]) => updateSetting('opacity', value)}
                    max={100}
                    min={20}
                    step={5}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs crt-muted mt-1">
                    <span>20%</span>
                    <span>{settings.opacity ?? 100}%</span>
                    <span>100%</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="show-border" className="text-sm crt-text">Show Border</Label>
                <Switch
                  id="show-border"
                  checked={settings.showBorder ?? true}
                  onCheckedChange={(checked) => updateSetting('showBorder', checked)}
                />
              </div>
            </div>

            {/* Widget-specific settings based on type */}
            {widgetType === 'SampleClock' && (
              <>
                <Separator />
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Type className="w-4 h-4 crt-accent" />
                    <h3 className="font-medium crt-text">Clock Settings</h3>
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="show-seconds" className="text-sm crt-text">Show Seconds</Label>
                    <Switch
                      id="show-seconds"
                      checked={settings.showSeconds ?? true}
                      onCheckedChange={(checked) => updateSetting('showSeconds', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="24-hour" className="text-sm crt-text">24 Hour Format</Label>
                    <Switch
                      id="24-hour"
                      checked={settings.format24h ?? true}
                      onCheckedChange={(checked) => updateSetting('format24h', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="show-date" className="text-sm crt-text">Show Date</Label>
                    <Switch
                      id="show-date"
                      checked={settings.showDate ?? true}
                      onCheckedChange={(checked) => updateSetting('showDate', checked)}
                    />
                  </div>
                </div>
              </>
            )}

            {widgetType === 'SampleChart' && (
              <>
                <Separator />
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Type className="w-4 h-4 crt-accent" />
                    <h3 className="font-medium crt-text">Chart Settings</h3>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm crt-text">Data Points</Label>
                    <div className="px-2">
                      <Slider
                        value={[settings.dataPoints ?? 20]}
                        onValueChange={([value]) => updateSetting('dataPoints', value)}
                        max={100}
                        min={10}
                        step={5}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs crt-muted mt-1">
                        <span>10</span>
                        <span>{settings.dataPoints ?? 20}</span>
                        <span>100</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="show-grid" className="text-sm crt-text">Show Grid</Label>
                    <Switch
                      id="show-grid"
                      checked={settings.showGrid ?? true}
                      onCheckedChange={(checked) => updateSetting('showGrid', checked)}
                    />
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center p-4 border-t crt-border">
            <Button
              onClick={handleReset}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </Button>
            <div className="flex gap-2">
              <Button onClick={onClose} variant="outline" size="sm">
                Cancel
              </Button>
              <Button onClick={handleSave} size="sm">
                Save
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}