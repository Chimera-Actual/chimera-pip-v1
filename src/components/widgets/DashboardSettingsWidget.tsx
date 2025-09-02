import React, { useState } from 'react';
import { Settings, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import WidgetAdapter from '@/components/dashboard/WidgetAdapter';
import { BaseWidgetProps } from '@/types/widget';
import { useCRT } from '@/lib/CRTTheme';

export default function DashboardSettingsWidget({ 
  widgetInstanceId, 
  settings = {}, 
  onSettingsChange, 
  widgetName 
}: BaseWidgetProps) {
  const { theme, setTheme, scanlinesEnabled, setScanlinesEnabled } = useCRT();

  return (
    <WidgetAdapter
      title="Dashboard Settings"
      widgetInstanceId={widgetInstanceId}
      settings={settings}
      onSettingsChange={onSettingsChange}
      widgetName={widgetName}
      icon={<Settings className="w-4 h-4" />}
    >
      <div className="space-y-4 p-4">
        <div>
          <label className="block text-sm crt-muted uppercase mb-2">Theme</label>
          <select
            className="w-full crt-input px-3 py-2 rounded text-sm"
            value={theme}
            onChange={(e) => setTheme(e.target.value as any)}
          >
            <option value="green">Matrix Green</option>
            <option value="amber">Fallout Amber</option>
            <option value="blue">Cyberpunk Blue</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm crt-muted uppercase mb-2">Effects</label>
          <Button
            onClick={() => setScanlinesEnabled(!scanlinesEnabled)}
            variant="outline"
            className={`w-full flex items-center justify-between px-3 py-2 ${
              scanlinesEnabled ? 'crt-button' : 'opacity-50'
            }`}
          >
            <span className="flex items-center space-x-2">
              <Zap className="w-4 h-4" />
              <span>Scanlines</span>
            </span>
            <span className="text-xs">{scanlinesEnabled ? 'ON' : 'OFF'}</span>
          </Button>
        </div>
      </div>
    </WidgetAdapter>
  );
}