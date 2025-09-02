import React, { useCallback } from "react";
import { WIDGET_COMPONENTS, WidgetComponentName } from "@/components/Layout/WidgetRegistry";
import OrphanedWidget from "@/components/dashboard/OrphanedWidget";
import { WidgetSettings } from "@/types/common";

interface WidgetInstance {
  id: string;
  widget_id: string;
  custom_name?: string;
  widget_definition?: {
    id: string;
    name: string;
    component_name: string;
    default_settings: WidgetSettings;
  };
}

interface WidgetRendererProps {
  widgetId: string;
  permanentWidgets: Array<{
    id: string;
    widgetType: string;
  }>;
  activeWidgetsForTab: WidgetInstance[];
  getWidgetSettings: (instanceId: string) => WidgetSettings;
  updateWidgetSettings: (params: { instanceId: string; settings: WidgetSettings }) => void;
  onRemoveWidget: (widgetId: string) => void;
  onCollapseChange?: (widgetId: string, collapsed: boolean) => void;
}

export const WidgetRenderer = React.memo<WidgetRendererProps>(({
  widgetId,
  permanentWidgets,
  activeWidgetsForTab,
  getWidgetSettings,
  updateWidgetSettings,
  onRemoveWidget,
  onCollapseChange
}) => {
  // Check if it's a permanent widget first
  const permanentWidget = permanentWidgets.find(w => w.id === widgetId);
  
  const renderPermanentWidget = useCallback(() => {
    if (!permanentWidget) return null;
    
    const WidgetComponent = WIDGET_COMPONENTS[permanentWidget.widgetType as WidgetComponentName];
    if (!WidgetComponent) return null;
    
    return (
      <WidgetComponent 
        widgetInstanceId={widgetId} 
        widgetName={permanentWidget.widgetType === 'AddWidgetWidget' ? 'Add Widget' : 'Dashboard Settings'}
        title={permanentWidget.widgetType === 'AddWidgetWidget' ? 'Add Widget' : 'Dashboard Settings'}
        widgetType={permanentWidget.widgetType}
        onCollapseChange={onCollapseChange}
      />
    );
  }, [permanentWidget, widgetId, onCollapseChange]);

  const renderTabWidget = useCallback(() => {
    const widgetInstance = activeWidgetsForTab.find(instance => instance.id === widgetId);
    
    if (!widgetInstance || !widgetInstance.widget_definition) {
      return (
        <OrphanedWidget
          widgetId={widgetId}
          onRemove={onRemoveWidget}
          reason="missing-type"
        />
      );
    }

    const ComponentName = widgetInstance.widget_definition.component_name as WidgetComponentName;
    const WidgetComponent = WIDGET_COMPONENTS[ComponentName];
    
    if (!WidgetComponent) {
      return (
        <OrphanedWidget
          widgetId={widgetId}
          widgetType={widgetInstance.widget_definition.component_name}
          onRemove={onRemoveWidget}
          reason="component-not-found"
        />
      );
    }

    const widgetSettings = getWidgetSettings(widgetInstance.id);
    
    return (
      <WidgetComponent
        key={widgetId}
        widgetInstanceId={widgetInstance.id}
        widgetType={widgetInstance.widget_definition.component_name}
        title={widgetInstance.widget_definition.name}
        widgetName={widgetInstance.custom_name || widgetInstance.widget_definition.name}
        settings={widgetSettings}
        defaultSettings={widgetInstance.widget_definition.default_settings}
        onSettingsChange={(newSettings) => updateWidgetSettings({ 
          instanceId: widgetInstance.id, 
          settings: newSettings 
        })}
        onCollapseChange={onCollapseChange}
      />
    );
  }, [widgetId, activeWidgetsForTab, getWidgetSettings, updateWidgetSettings, onRemoveWidget, onCollapseChange]);

  // Render permanent widget if found, otherwise render tab widget
  if (permanentWidget) {
    return renderPermanentWidget();
  }
  
  return renderTabWidget();
});

WidgetRenderer.displayName = "WidgetRenderer";