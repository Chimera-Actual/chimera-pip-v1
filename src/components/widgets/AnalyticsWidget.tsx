import React from 'react';
import { AnalyticsDashboard } from '@/components/Applets/AnalyticsDashboard';
import WidgetAdapter from '@/components/dashboard/WidgetAdapter';
import { BaseWidgetProps } from '@/types/widget';
import { BarChart3 } from 'lucide-react';

const AnalyticsWidget: React.FC<BaseWidgetProps> = ({
  widgetInstanceId,
  settings = {},
  onSettingsChange,
  widgetName
}) => {
  return (
    <WidgetAdapter
      title="Analytics Dashboard"
      widgetInstanceId={widgetInstanceId}
      settings={settings}
      onSettingsChange={onSettingsChange}
      widgetName={widgetName}
      icon={<BarChart3 className="w-4 h-4" />}
    >
      <AnalyticsDashboard />
    </WidgetAdapter>
  );
};

export default AnalyticsWidget;