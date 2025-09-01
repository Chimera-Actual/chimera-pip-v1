import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Edit3, Save } from 'lucide-react';
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
  const [isEditingName, setIsEditingName] = useState(false);
  const [showIconSelector, setShowIconSelector] = useState(false);

  const handleWidgetNameChange = (value: string) => {
    setLocalWidgetName(value);
    onWidgetNameChange?.(value);
  };

  const handleSave = () => {
    onSave();
  };

  const handleIconDoubleClick = () => {
    setShowIconSelector(true);
    // TODO: Implement icon selector modal
    console.log('Opening icon selector...');
  };

  const handleNameEdit = () => {
    setIsEditingName(true);
  };

  const handleNameSave = () => {
    setIsEditingName(false);
    handleWidgetNameChange(localWidgetName);
  };

  const handleNameCancel = () => {
    setIsEditingName(false);
    setLocalWidgetName(initialWidgetName || widgetName);
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className={`bg-card border border-border rounded-lg shadow-lg w-full max-w-2xl h-[80vh] flex flex-col ${className}`}>
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-border bg-muted/30">
          <Button
            variant="outline"
            className="border-primary/50 bg-primary/10 hover:bg-primary/20 text-primary font-mono uppercase tracking-wider p-2 w-12 h-12"
            onDoubleClick={handleIconDoubleClick}
            title="Double-click to change icon"
          >
            {widgetIcon}
          </Button>
          
          <div className="flex-1 flex items-center gap-2">
            {isEditingName ? (
              <div className="flex items-center gap-2 flex-1">
                <Input
                  value={localWidgetName}
                  onChange={(e) => setLocalWidgetName(e.target.value)}
                  className="font-mono uppercase tracking-wider text-primary"
                  onBlur={handleNameCancel}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleNameSave();
                    if (e.key === 'Escape') handleNameCancel();
                  }}
                  autoFocus
                />
                <Button
                  size="sm"
                  onClick={handleNameSave}
                  className="h-6 w-6 p-0"
                >
                  <Save className="w-3 h-3" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h2 className={`font-mono text-primary uppercase tracking-wider ${isMobile ? 'text-sm' : 'text-base'}`}>
                  {localWidgetName} Settings
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleNameEdit}
                  className="h-6 w-6 p-0 hover:bg-primary/20"
                >
                  <Edit3 className="w-3 h-3" />
                </Button>
              </div>
            )}
          </div>
          
          <Button
            onClick={handleSave}
            className={`bg-primary hover:bg-primary/90 text-primary-foreground font-mono uppercase tracking-wider ${isMobile ? 'text-xs px-3 py-2 h-8' : 'text-sm px-4 py-2'}`}
          >
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        </div>

        {/* Content Area with Scroll */}
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className={`p-6 space-y-6 ${isMobile ? 'p-4' : ''}`}>
              {/* Widget-specific Settings */}
              <div className="space-y-6">
                <Label className="font-mono text-sm uppercase tracking-wider text-muted-foreground">
                  Widget Configuration
                </Label>
                {children}
              </div>
              
              {widgetInstanceId && (
                <div className="mt-8 p-4 bg-muted/50 rounded border">
                  <Label className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                    Debug Information
                  </Label>
                  <div className="mt-2 space-y-1 text-xs font-mono text-muted-foreground">
                    <div>Instance ID: {widgetInstanceId}</div>
                  </div>
                </div>
              )}
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