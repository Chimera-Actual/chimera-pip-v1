import React from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useResponsive } from '@/hooks/useResponsive';
import { cn } from '@/lib/utils';

interface StandardSettingsTemplateProps {
  widgetIcon: React.ReactNode;
  widgetName: string;
  children: React.ReactNode;
  onSave: () => void;
  onCancel: () => void;
  className?: string;
}

export const StandardSettingsTemplate: React.FC<StandardSettingsTemplateProps> = ({
  widgetIcon,
  widgetName,
  children,
  onSave,
  onCancel,
  className = ""
}) => {
  const { isMobile } = useResponsive();

  return (
    <div className={cn("flex flex-col h-full max-h-[80vh]", className)}>
      {/* Header */}
      <div className={cn(
        "flex-shrink-0 border-b border-border bg-card/50",
        isMobile ? "px-4 py-3" : "px-6 py-4"
      )}>
        <div className="flex items-center gap-3">
          <span className="icon-primary crt-glow text-primary">
            {widgetIcon}
          </span>
          <h2 className={cn(
            "font-mono text-primary uppercase tracking-wider crt-glow",
            isMobile ? "text-sm" : "text-base"
          )}>
            {widgetName} Settings
          </h2>
        </div>
      </div>

      {/* Content Area with Single Scroll */}
      <ScrollArea className="flex-1">
        <div className={cn(
          "space-y-6",
          isMobile ? "p-4" : "p-6"
        )}>
          {children}
        </div>
      </ScrollArea>

      {/* Footer Actions */}
      <div className={cn(
        "flex-shrink-0 border-t border-border bg-card/30",
        isMobile ? "p-4" : "p-6"
      )}>
        <div className={cn(
          "flex gap-3",
          isMobile ? "flex-col" : "justify-end"
        )}>
          <Button
            variant="outline"
            onClick={onCancel}
            className={cn(
              "font-mono touch-target retro-button",
              isMobile ? "h-12" : "min-w-24"
            )}
          >
            CANCEL
          </Button>
          <Button
            onClick={onSave}
            className={cn(
              "font-mono touch-target retro-button",
              isMobile ? "h-12" : "min-w-32"
            )}
          >
            SAVE CHANGES
          </Button>
        </div>
      </div>
    </div>
  );
};