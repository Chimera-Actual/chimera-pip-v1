import React from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import WidgetAdapter from '@/components/dashboard/WidgetAdapter';
import { BaseWidgetProps } from '@/types/widget';

interface AddWidgetWidgetProps extends BaseWidgetProps {
  onAddWidget: () => void;
}

export default function AddWidgetWidget({ 
  widgetInstanceId, 
  settings = {}, 
  onSettingsChange, 
  widgetName,
  onAddWidget 
}: AddWidgetWidgetProps) {
  return (
    <WidgetAdapter
      title="Add Widget"
      widgetInstanceId={widgetInstanceId}
      settings={settings}
      onSettingsChange={onSettingsChange}
      widgetName={widgetName}
      icon={<Plus className="w-4 h-4" />}
    >
      <div className="flex items-center justify-center h-full">
        <Button
          onClick={onAddWidget}
          className="crt-button px-6 py-3 rounded-lg flex items-center space-x-3 text-base"
        >
          <Plus className="w-5 h-5" />
          <span>Add Widget</span>
        </Button>
      </div>
    </WidgetAdapter>
  );
}