import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Settings, Grid3x3 } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { StandardWidgetTemplate } from '@/components/Layout/StandardWidgetTemplate';
import { WidgetSettings } from '@/components/Layout/WidgetSettings';

interface TextDisplayWidgetProps {
  settings?: Record<string, any>;
  widgetName?: string;
  widgetInstanceId?: string;
  onSettingsUpdate?: (newSettings: Record<string, any>) => void;
}

export const TextDisplayWidget: React.FC<TextDisplayWidgetProps> = ({ settings, widgetName, widgetInstanceId, onSettingsUpdate }) => {
  const isMobile = useIsMobile();
  
  // Get current settings with defaults
  const containerCount = settings?.containerCount || 1;
  const layoutPattern = settings?.layoutPattern || '1';
  const containers = settings?.containers || [{
    id: '1',
    title: 'Welcome',
    content: 'This is your text display widget. Use the settings to configure multiple containers with different layouts.',
    layout: 'card',
    textSize: 'base',
    textAlign: 'left',
    colorTheme: 'default'
  }];

  const getTextSizeClass = (size: string) => {
    const sizeMap: Record<string, string> = {
      'sm': 'text-sm',
      'base': 'text-base',
      'lg': 'text-lg',
      'xl': 'text-xl',
      '2xl': 'text-2xl'
    };
    return sizeMap[size] || 'text-base';
  };

  const getTextAlignClass = (align: string) => {
    const alignMap: Record<string, string> = {
      'left': 'text-left',
      'center': 'text-center',
      'right': 'text-right'
    };
    return alignMap[align] || 'text-left';
  };

  const getColorThemeClasses = (theme: string) => {
    const themeMap: Record<string, string> = {
      'default': 'text-foreground',
      'primary': 'text-primary',
      'accent': 'text-accent-foreground',
      'muted': 'text-muted-foreground',
      'success': 'text-green-600 dark:text-green-400',
      'warning': 'text-yellow-600 dark:text-yellow-400',
      'destructive': 'text-destructive'
    };
    return themeMap[theme] || 'text-foreground';
  };

  const renderContainer = (container: any, index: number) => {
    const textClasses = `${getTextSizeClass(container.textSize)} ${getTextAlignClass(container.textAlign)} ${getColorThemeClasses(container.colorTheme)}`;
    
    switch (container.layout) {
      case 'minimal':
        return (
          <div key={container.id} className="p-4 space-y-3 h-full border border-border/50 rounded">
            <h3 className={`font-semibold ${textClasses}`}>{container.title}</h3>
            <p className={`${textClasses} leading-relaxed`}>{container.content}</p>
          </div>
        );

      case 'banner':
        return (
          <div key={container.id} className="bg-primary/10 border-l-4 border-primary p-4 space-y-3 h-full rounded">
            <h3 className={`font-bold ${textClasses}`}>{container.title}</h3>
            <p className={`${textClasses} leading-relaxed`}>{container.content}</p>
          </div>
        );

      case 'quote':
        return (
          <div key={container.id} className="p-4 space-y-3 border-l-4 border-muted-foreground/30 bg-muted/30 h-full rounded">
            <blockquote className={`italic ${textClasses} leading-relaxed`}>
              "{container.content}"
            </blockquote>
            <cite className={`text-sm font-medium ${getColorThemeClasses('muted')} block ${getTextAlignClass(container.textAlign)}`}>
              — {container.title}
            </cite>
          </div>
        );

      case 'highlight':
        return (
          <div key={container.id} className="p-4 bg-gradient-to-r from-primary/20 to-accent/20 rounded-lg border space-y-3 h-full">
            <h3 className={`font-bold ${textClasses} flex items-center gap-2`}>
              <span className="w-2 h-2 bg-primary rounded-full"></span>
              {container.title}
            </h3>
            <p className={`${textClasses} leading-relaxed`}>{container.content}</p>
          </div>
        );

      default: // card
        return (
          <Card key={container.id} className="h-full">
            <CardHeader className="pb-3">
              <CardTitle className={`${textClasses} text-lg`}>{container.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`${textClasses} leading-relaxed`}>{container.content}</p>
            </CardContent>
          </Card>
        );
    }
  };

  const getLayoutGrid = () => {
    // Define layout patterns
    const layoutConfigs: Record<string, { pattern: number[]; gridCols: string }> = {
      '1': { pattern: [1], gridCols: 'grid-cols-1' },
      '1-1': { pattern: [1, 1], gridCols: 'grid-cols-2' },
      '2': { pattern: [2], gridCols: 'grid-cols-1' },
      '1-1-1': { pattern: [1, 1, 1], gridCols: 'grid-cols-3' },
      '2-1': { pattern: [2, 1], gridCols: 'grid-cols-3' },
      '1-2': { pattern: [1, 2], gridCols: 'grid-cols-3' },
      '3': { pattern: [3], gridCols: 'grid-cols-1' },
      '1-1-1-1': { pattern: [1, 1, 1, 1], gridCols: 'grid-cols-4' },
      '2-2': { pattern: [2, 2], gridCols: 'grid-cols-4' },
      '3-1': { pattern: [3, 1], gridCols: 'grid-cols-4' },
      '1-3': { pattern: [1, 3], gridCols: 'grid-cols-4' },
      '2-1-1': { pattern: [2, 1, 1], gridCols: 'grid-cols-4' },
      '1-2-1': { pattern: [1, 2, 1], gridCols: 'grid-cols-4' },
      '1-1-2': { pattern: [1, 1, 2], gridCols: 'grid-cols-4' },
      '4': { pattern: [4], gridCols: 'grid-cols-1' },
      '1-1-1-1-1': { pattern: [1, 1, 1, 1, 1], gridCols: 'grid-cols-5' },
      '2-2-1': { pattern: [2, 2, 1], gridCols: 'grid-cols-5' },
      '2-1-2': { pattern: [2, 1, 2], gridCols: 'grid-cols-5' },
      '1-2-2': { pattern: [1, 2, 2], gridCols: 'grid-cols-5' },
      '3-2': { pattern: [3, 2], gridCols: 'grid-cols-5' },
      '2-3': { pattern: [2, 3], gridCols: 'grid-cols-5' },
      '5': { pattern: [5], gridCols: 'grid-cols-1' },
      '1-1-1-1-1-1': { pattern: [1, 1, 1, 1, 1, 1], gridCols: 'grid-cols-6' },
      '2-2-2': { pattern: [2, 2, 2], gridCols: 'grid-cols-6' },
      '3-3': { pattern: [3, 3], gridCols: 'grid-cols-6' },
      '4-2': { pattern: [4, 2], gridCols: 'grid-cols-6' },
      '2-4': { pattern: [2, 4], gridCols: 'grid-cols-6' },
      '6': { pattern: [6], gridCols: 'grid-cols-1' }
    };

    const config = layoutConfigs[layoutPattern] || layoutConfigs['1'];
    let containerIndex = 0;

    // Force single column layout on mobile for better readability
    if (isMobile) {
      return (
        <div className="space-y-3">
          {containers.map((container, index) => (
            <div key={container.id} className="w-full">
              {renderContainer(container, index)}
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {config.pattern.map((cols, rowIndex) => (
          <div key={rowIndex} className={`grid gap-4 ${cols === 1 ? 'grid-cols-1' : cols === 2 ? 'grid-cols-2' : cols === 3 ? 'grid-cols-3' : cols === 4 ? 'grid-cols-4' : cols === 5 ? 'grid-cols-5' : 'grid-cols-6'}`}>
            {Array.from({ length: cols }, (_, colIndex) => {
              const container = containers[containerIndex];
              containerIndex++;
              return container ? renderContainer(container, containerIndex - 1) : null;
            })}
          </div>
        ))}
      </div>
    );
  };

  const [showSettings, setShowSettings] = useState(false);

  const headerControls = (
    <div className="flex items-center gap-2">
      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
        <Grid3x3 className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setShowSettings(true)}>
        <Settings className="h-4 w-4" />
      </Button>
    </div>
  );

  return (
    <StandardWidgetTemplate
      icon={<FileText className="h-5 w-5" />}
      title={widgetName || 'TEXT DISPLAY'}
      controls={headerControls}
    >
      {/* Content Display */}
      <div className={`flex-1 overflow-auto ${isMobile ? 'p-2' : 'p-4'}`}>
        {getLayoutGrid()}
      </div>
      <WidgetSettings
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        widget={{
          id: widgetInstanceId || 'text-display-widget',
          widget_definition: { component_name: 'TextDisplayWidget' }
        } as any}
        onSettingsUpdate={(widgetId, newSettings) => onSettingsUpdate?.(newSettings)}
        currentSettings={settings || {}}
      />
    </StandardWidgetTemplate>
  );
};