import React from 'react';
import { Plus, Minus, Navigation, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MapboxControlsProps {
  zoom: number;
  bearing: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetBearing: () => void;
  onResetView: () => void;
  className?: string;
}

export const MapboxControls: React.FC<MapboxControlsProps> = ({
  zoom,
  bearing,
  onZoomIn,
  onZoomOut,
  onResetBearing,
  onResetView,
  className = ""
}) => {
  return (
    <div className={`absolute right-4 top-4 flex flex-col gap-2 z-10 ${className}`}>
      {/* Zoom Controls */}
      <div className="bg-card/80 backdrop-blur-sm border border-border rounded-md overflow-hidden">
        <Button
          variant="ghost"
          size="sm"
          className="retro-button w-8 h-8 p-0 rounded-none border-b border-border"
          onClick={onZoomIn}
          disabled={zoom >= 22}
        >
          <Plus size={14} />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="retro-button w-8 h-8 p-0 rounded-none"
          onClick={onZoomOut}
          disabled={zoom <= 0}
        >
          <Minus size={14} />
        </Button>
      </div>

      {/* Compass Indicator */}
      <div className="bg-card/80 backdrop-blur-sm border border-border rounded-md p-2">
        <Button
          variant="ghost"
          size="sm"
          className="retro-button w-8 h-8 p-0 relative"
          onClick={onResetBearing}
          title={`Bearing: ${bearing.toFixed(1)}°`}
        >
          <Navigation 
            size={16} 
            className="text-primary"
            style={{ transform: `rotate(${bearing}deg)` }}
          />
          {bearing !== 0 && (
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-accent rounded-full"></div>
          )}
        </Button>
      </div>

      {/* Reset View */}
      <div className="bg-card/80 backdrop-blur-sm border border-border rounded-md">
        <Button
          variant="ghost"
          size="sm"
          className="retro-button w-8 h-8 p-0"
          onClick={onResetView}
          title="Reset View"
        >
          <RotateCcw size={14} />
        </Button>
      </div>

      {/* Zoom Level Indicator */}
      <div className="bg-card/80 backdrop-blur-sm border border-border rounded-md px-2 py-1">
        <div className="text-xs font-mono text-primary text-center">
          Z{zoom.toFixed(1)}
        </div>
      </div>
    </div>
  );
};