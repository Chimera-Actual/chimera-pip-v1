// Grid Controls - Layout density and snap options
import React from 'react';
import { Grid3x3, Maximize2, RotateCcw, Layout, Zap } from 'lucide-react';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';
import { Badge } from '../ui/badge';
import { useDashboardStore } from '@/stores/dashboardStore';
import { cn } from '@/lib/utils';

export const GridControls: React.FC = () => {
  const { 
    clearAllWidgets, 
    widgets, 
    autoArrangeWidgets,
    gridDensity,
    setGridDensity 
  } = useDashboardStore();

  const widgetCount = Array.from(widgets.values()).filter(w => w.panelId === 'main').length;

  const handleAutoArrange = () => {
    if (autoArrangeWidgets) {
      autoArrangeWidgets('main');
    }
  };

  const densityOptions = [
    { key: 'compact', label: 'Compact', icon: Grid3x3 },
    { key: 'comfortable', label: 'Comfort', icon: Maximize2 },
    { key: 'spacious', label: 'Spacious', icon: Layout },
  ] as const;

  return (
    <div className="flex items-center gap-2">
      {/* Widget Count */}
      <Badge variant="outline" className="text-xs font-mono">
        {widgetCount} widgets
      </Badge>

      <Separator orientation="vertical" className="h-6" />

      {/* Grid Density */}
      <div className="flex items-center gap-1">
        {densityOptions.map(({ key, label, icon: Icon }) => (
          <Button
            key={key}
            variant={gridDensity === key ? "default" : "ghost"}
            size="sm"
            onClick={() => setGridDensity?.(key)}
            className={cn(
              "text-xs px-2 h-7",
              gridDensity === key && "bg-primary/20 text-primary"
            )}
          >
            <Icon className="w-3 h-3 mr-1" />
            {label}
          </Button>
        ))}
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* Auto Arrange */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleAutoArrange}
        disabled={widgetCount === 0}
        className="text-xs px-2 h-7"
      >
        <Zap className="w-3 h-3 mr-1" />
        Auto Arrange
      </Button>

      {/* Clear All */}
      <Button
        variant="ghost"
        size="sm"
        onClick={clearAllWidgets}
        disabled={widgetCount === 0}
        className="text-xs px-2 h-7 text-destructive hover:text-destructive hover:bg-destructive/20"
      >
        <RotateCcw className="w-3 h-3 mr-1" />
        Clear All
      </Button>
    </div>
  );
};