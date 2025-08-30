import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserWidgetInstance } from '@/hooks/useWidgetManager';
import { RotateCcw } from 'lucide-react';

interface WidgetNameSectionProps {
  widget: UserWidgetInstance;
  onNameChange: (name: string) => void;
}

export const WidgetNameSection: React.FC<WidgetNameSectionProps> = ({
  widget,
  onNameChange
}) => {
  const [customName, setCustomName] = useState('');

  useEffect(() => {
    setCustomName(widget.custom_name || widget.widget_definition?.name || '');
  }, [widget]);

  const handleReset = () => {
    const defaultName = widget.widget_definition?.name || '';
    setCustomName(defaultName);
    onNameChange(defaultName);
  };

  const handleNameChange = (value: string) => {
    setCustomName(value);
    onNameChange(value);
  };

  return (
    <div className="space-y-4 p-4 border-b border-border bg-muted/30">
      <div className="flex items-center gap-3">
        <span className="text-2xl">{widget.widget_definition?.icon}</span>
        <div>
          <div className="text-sm font-mono font-medium text-foreground">
            {widget.widget_definition?.name}
          </div>
          <div className="text-xs text-muted-foreground">
            {widget.widget_definition?.description}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="widget-name" className="text-sm font-mono">
          Widget Name
        </Label>
        <div className="flex gap-2">
          <Input
            id="widget-name"
            value={customName}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="Enter custom widget name..."
            className="font-mono flex-1"
            maxLength={50}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="font-mono text-xs px-3"
            title="Reset to default name"
          >
            <RotateCcw className="w-3 h-3" />
          </Button>
        </div>
        <div className="text-xs text-muted-foreground">
          Leave empty to use default name
        </div>
      </div>
    </div>
  );
};