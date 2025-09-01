import React, { useState } from 'react';
import { Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StandardWidgetTemplate } from './StandardWidgetTemplate';
import { BaseWidgetProps } from '@/types/widget';
import { useResponsive } from '@/hooks/useResponsive';

interface BaseWidgetTemplateProps extends BaseWidgetProps {
  /** Widget icon */
  icon: React.ReactNode;
  /** Widget title */
  title: string;
  /** Widget content */
  children: React.ReactNode;
  /** Primary action controls */
  primaryControls?: React.ReactNode;
  /** Status display for header */
  statusDisplay?: React.ReactNode;
  /** Settings component */
  settingsComponent?: React.ComponentType<{
    widgetInstanceId: string;
    settings: Record<string, any>;
    onSettingsChange: (settings: Record<string, any>) => void;
    onClose: () => void;
  }>;
  /** Content layout type */
  contentLayout?: 'default' | 'split' | 'stack';
  /** Custom className */
  className?: string;
}

export const BaseWidgetTemplate: React.FC<BaseWidgetTemplateProps> = ({
  icon,
  title,
  children,
  primaryControls,
  statusDisplay,
  settingsComponent: SettingsComponent,
  contentLayout = 'default',
  className,
  widgetInstanceId,
  settings = {},
  onSettingsChange,
  widgetName
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const { isMobile } = useResponsive();

  // Use custom name if provided, otherwise use title
  const displayTitle = widgetName || title;

  // Create controls array with primary controls + settings gear
  const allControls = (
    <div className="flex items-center gap-1">
      {primaryControls && (
        <>
          {primaryControls}
          <div className="w-px h-4 bg-border mx-1" />
        </>
      )}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowSettings(true)}
        className={`opacity-70 hover:opacity-100 ${isMobile ? 'p-2 h-8 w-8' : 'p-1 h-6 w-6'}`}
      >
        <Settings className={isMobile ? 'h-4 w-4' : 'h-3 w-3'} />
      </Button>
    </div>
  );

  return (
    <>
      <StandardWidgetTemplate
        icon={icon}
        title={displayTitle.toUpperCase()}
        controls={allControls}
        statusDisplay={statusDisplay}
        contentLayout={contentLayout}
        className={className}
      >
        {children}
      </StandardWidgetTemplate>

      {/* Settings Modal */}
      {showSettings && SettingsComponent && onSettingsChange ? (
        <SettingsComponent
          widgetInstanceId={widgetInstanceId}
          settings={settings}
          onSettingsChange={onSettingsChange}
          onClose={() => setShowSettings(false)}
        />
      ) : showSettings && (
        /* Fallback settings modal if no custom settings component */
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-card border border-border rounded-lg p-6 max-w-md mx-4">
            <h3 className="font-mono text-primary uppercase tracking-wider mb-4">Widget Settings</h3>
            <p className="text-muted-foreground font-mono text-sm mb-4">
              Settings for this widget are not yet configured.
            </p>
            <Button 
              onClick={() => setShowSettings(false)}
              variant="outline"
              className="w-full font-mono"
            >
              CLOSE
            </Button>
          </div>
        </div>
      )}
    </>
  );
};