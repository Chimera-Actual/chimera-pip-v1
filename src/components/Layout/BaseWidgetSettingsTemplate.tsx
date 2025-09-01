import React from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  /** Custom className */
  className?: string;
}

export const BaseWidgetSettingsTemplate: React.FC<BaseWidgetSettingsTemplateProps> = ({
  widgetIcon,
  widgetName,
  children,
  onSave,
  onCancel,
  className = ''
}) => {
  const { isMobile } = useResponsive();

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className={`bg-card border border-border rounded-lg shadow-lg w-full max-w-2xl h-[80vh] flex flex-col ${className}`}>
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-border bg-muted/30">
          <div className="flex items-center justify-center w-8 h-8 rounded bg-primary/10 text-primary">
            {widgetIcon}
          </div>
          <h2 className={`font-mono text-primary uppercase tracking-wider flex-1 ${isMobile ? 'text-sm' : 'text-base'}`}>
            {widgetName} Settings
          </h2>
          <Button
            onClick={onSave}
            className={`bg-primary hover:bg-primary/90 text-primary-foreground font-mono uppercase tracking-wider ${isMobile ? 'text-xs px-3 py-2 h-8' : 'text-sm px-4 py-2'}`}
          >
            Save Changes
          </Button>
        </div>

        {/* Content Area with Scroll */}
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className={`p-6 ${isMobile ? 'p-4' : ''}`}>
              {children}
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