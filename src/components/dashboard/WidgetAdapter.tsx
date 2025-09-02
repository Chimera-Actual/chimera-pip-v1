import React from 'react';
import WidgetFrame from './WidgetFrame';
import { BaseWidgetProps } from '@/types/widget';

interface WidgetAdapterProps extends BaseWidgetProps {
  title: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  onSettings?: () => void;
  className?: string;
}

export default function WidgetAdapter({
  title,
  children,
  widgetInstanceId,
  settings = {},
  onSettingsChange,
  widgetName,
  icon,
  onSettings,
  onCollapseChange,
  className = ""
}: WidgetAdapterProps) {
  return (
    <WidgetFrame
      title={widgetName || title}
      widgetId={widgetInstanceId}
      onSettings={onSettings}
      onCollapseChange={onCollapseChange}
      right={icon}
      className={className}
    >
      {children}
    </WidgetFrame>
  );
}