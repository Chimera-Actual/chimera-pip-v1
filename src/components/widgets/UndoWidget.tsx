import React from 'react';
import { Undo } from 'lucide-react';
import { Button } from '@/components/ui/button';
import WidgetAdapter from '@/components/dashboard/WidgetAdapter';
import { BaseWidgetProps } from '@/types/widget';

interface UndoWidgetProps extends BaseWidgetProps {
  onUndo: () => void;
  canUndo: boolean;
  undoCount: number;
}

export default function UndoWidget({ 
  widgetInstanceId, 
  settings = {}, 
  onSettingsChange, 
  widgetName,
  onUndo,
  canUndo,
  undoCount 
}: UndoWidgetProps) {
  return (
    <WidgetAdapter
      title="Layout History"
      widgetInstanceId={widgetInstanceId}
      settings={settings}
      onSettingsChange={onSettingsChange}
      widgetName={widgetName}
      icon={<Undo className="w-4 h-4" />}
    >
      <div className="flex flex-col items-center justify-center h-full space-y-3">
        <div className="text-center">
          <div className="text-2xl font-bold crt-accent">{undoCount}</div>
          <div className="text-xs crt-muted uppercase">Changes Available</div>
        </div>
        <Button
          onClick={onUndo}
          disabled={!canUndo}
          variant="outline"
          className="px-4 py-2 rounded flex items-center space-x-2"
          title={`Undo layout changes (${undoCount} available)`}
        >
          <Undo className="w-4 h-4" />
          <span>Undo</span>
        </Button>
      </div>
    </WidgetAdapter>
  );
}