import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useResponsive } from '@/hooks/useResponsive';

interface BaseWidgetSettingsTemplateProps {
  /** Widget icon */
  widgetIcon: React.ReactNode;
  /** Widget name for the title */
  widgetName: string;
  /** Settings content */
  children: React.ReactNode;
  /** Save callback */
  onSave: () => void;
  /** Cancel callback */
  onCancel: () => void;
  /** Widget instance ID for identification */
  widgetInstanceId?: string;
  /** Initial widget name for editing */
  initialWidgetName?: string;
  /** Callback when widget name changes */
  onWidgetNameChange?: (name: string) => void;
  /** Custom className */
  className?: string;
}

export const BaseWidgetSettingsTemplate: React.FC<BaseWidgetSettingsTemplateProps> = ({
  widgetIcon,
  widgetName,
  children,
  onSave,
  onCancel,
  widgetInstanceId,
  initialWidgetName = '',
  onWidgetNameChange,
  className = ''
}) => {
  const { isMobile } = useResponsive();
  const [localWidgetName, setLocalWidgetName] = useState(initialWidgetName || widgetName);
  const [allowIconChange, setAllowIconChange] = useState(false);

  const handleWidgetNameChange = (value: string) => {
    setLocalWidgetName(value);
    onWidgetNameChange?.(value);
  };

  const handleSave = () => {
    onSave();
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className={`bg-card border border-border rounded-lg shadow-lg w-full max-w-2xl h-[80vh] flex flex-col ${className}`}>
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-border bg-muted/30">
          <Button
            variant="outline"
            className="bg-yellow-400 hover:bg-yellow-500 text-black border-yellow-500 font-mono uppercase tracking-wider"
            size={isMobile ? "sm" : "default"}
          >
            <div className="flex items-center gap-2">
              {widgetIcon}
              <span className={isMobile ? 'text-xs' : 'text-sm'}>Current Widget Icon</span>
            </div>
          </Button>
          <h2 className={`font-mono text-primary uppercase tracking-wider flex-1 ${isMobile ? 'text-sm' : 'text-base'}`}>
            [{widgetName}] Settings
          </h2>
          <Button
            onClick={handleSave}
            className={`bg-yellow-400 hover:bg-yellow-500 text-black font-mono uppercase tracking-wider border-yellow-500 ${isMobile ? 'text-xs px-3 py-2 h-8' : 'text-sm px-4 py-2'}`}
          >
            Save Changes
          </Button>
        </div>

        {/* Content Area with Scroll */}
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className={`p-6 space-y-6 ${isMobile ? 'p-4' : ''}`}>
              {/* Common Widget Name Section */}
              <div className="space-y-4 pb-6 border-b border-border">
                <div className="space-y-2">
                  <Label htmlFor="widget-name" className="font-mono text-sm uppercase tracking-wider text-muted-foreground">
                    Change Widget Name
                  </Label>
                  <Input
                    id="widget-name"
                    value={localWidgetName}
                    onChange={(e) => handleWidgetNameChange(e.target.value)}
                    className="font-mono"
                    placeholder="Enter widget name"
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="change-icon"
                    checked={allowIconChange}
                    onCheckedChange={(checked) => setAllowIconChange(checked === true)}
                  />
                  <Label
                    htmlFor="change-icon"
                    className="font-mono text-sm text-muted-foreground cursor-pointer"
                  >
                    Allow widget icon changes
                  </Label>
                </div>
                
                {widgetInstanceId && (
                  <div className="text-xs font-mono text-muted-foreground/70">
                    Instance ID: {widgetInstanceId}
                  </div>
                )}
              </div>

              {/* Widget-specific Settings */}
              <div className="space-y-6">
                <Label className="font-mono text-sm uppercase tracking-wider text-muted-foreground">
                  Widget Configuration
                </Label>
                {children}
              </div>
            </div>
          </ScrollArea>
        </div>

        {/* Footer (optional - can be hidden if not needed) */}
        <div className="p-4 border-t border-border bg-muted/30 flex justify-end">
          <Button
            variant="outline"
            onClick={onCancel}
            className={`font-mono uppercase tracking-wider ${isMobile ? 'text-xs px-3 py-2 h-8' : 'text-sm px-4 py-2'}`}
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};