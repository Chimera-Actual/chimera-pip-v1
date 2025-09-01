import React from 'react';
import { Cpu } from 'lucide-react';
import { BaseWidgetTemplate } from '@/components/Layout/BaseWidgetTemplate';
import { BaseWidgetProps } from '@/types/widget';
import { BaseWidgetSettings } from './Settings/BaseWidgetSettings';
import { useResponsive } from '@/hooks/useResponsive';

const BaseWidget: React.FC<BaseWidgetProps> = ({
  widgetInstanceId,
  settings = {},
  onSettingsChange,
  widgetName
}) => {
  const { isMobile } = useResponsive();

  const title = settings.title || 'Base Widget';
  const message = settings.message || 'This is a base widget template demonstrating the standard widget pattern.';

  return (
    <BaseWidgetTemplate
      icon={<Cpu size={isMobile ? 16 : 20} />}
      title={title}
      widgetInstanceId={widgetInstanceId}
      settings={settings}
      onSettingsChange={onSettingsChange}
      widgetName={widgetName}
      settingsComponent={BaseWidgetSettings}
    >
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-md">
          <div className={`opacity-50 ${isMobile ? 'text-4xl' : 'text-6xl'}`}>⚙️</div>
          <div className={`text-muted-foreground font-mono ${isMobile ? 'text-sm' : ''}`}>
            {message}
          </div>
          <div className={`text-xs text-muted-foreground/70 font-mono space-y-1 ${isMobile ? 'px-4' : ''}`}>
            <div>Instance ID: {widgetInstanceId}</div>
            <div>Settings: {Object.keys(settings).length} properties</div>
          </div>
        </div>
      </div>
    </BaseWidgetTemplate>
  );
};

export default BaseWidget;