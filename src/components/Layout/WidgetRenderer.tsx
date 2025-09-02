// Widget Renderer Component - Maps widget types to components
import React from 'react';
import { WidgetRegistry } from './WidgetRegistry';
import type { WidgetSettings } from '@/types/widget';

interface WidgetRendererProps {
  widgetInstanceId: string;
  widgetType: string;
  settings: WidgetSettings;
  widgetName: string;
  onSettingsUpdate: (newSettings: WidgetSettings) => void;
}

export const WidgetRenderer: React.FC<WidgetRendererProps> = ({
  widgetInstanceId,
  widgetType,
  settings,
  widgetName,
  onSettingsUpdate,
}) => {
  const component = WidgetRegistry.get(widgetType);
  
  if (!component) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <div className="text-lg font-mono mb-2">WIDGET NOT FOUND</div>
          <div className="text-sm">Type: {widgetType}</div>
        </div>
      </div>
    );
  }

  const Component = component.component;

  return (
    <Component
      settings={settings}
      widgetName={widgetName}
      widgetInstanceId={widgetInstanceId}
      onSettingsUpdate={onSettingsUpdate}
    />
  );
};