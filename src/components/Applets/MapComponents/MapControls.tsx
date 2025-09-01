import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ZoomIn, ZoomOut, Navigation, Layers } from 'lucide-react';
import { MapLayer } from '@/hooks/useMapState';

const mapLayerOptions = [
  { value: 'standard' as MapLayer, label: 'STANDARD', icon: '🗺️' },
  { value: 'satellite' as MapLayer, label: 'SATELLITE', icon: '🛰️' },
  { value: 'terrain' as MapLayer, label: 'TERRAIN', icon: '🏔️' },
  { value: 'transport' as MapLayer, label: 'TRANSPORT', icon: '🚌' }
];

interface MapControlsProps {
  zoom: number;
  layer: MapLayer;
  bearing: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onLayerChange: (layer: MapLayer) => void;
  onResetBearing?: () => void;
  className?: string;
}

export const MapControls: React.FC<MapControlsProps> = ({
  zoom,
  layer,
  bearing,
  onZoomIn,
  onZoomOut,
  onLayerChange,
  onResetBearing,
  className = ""
}) => {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {/* Zoom Controls */}
      <div className="flex flex-col bg-card/80 backdrop-blur-sm border border-border rounded-md overflow-hidden">
        <Button
          onClick={onZoomIn}
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 rounded-none border-b border-border font-mono retro-button"
          disabled={zoom >= 18}
        >
          <ZoomIn size={14} />
        </Button>
        <div className="px-2 py-1 text-xs font-mono text-center text-muted-foreground bg-background/50">
          {zoom.toFixed(0)}
        </div>
        <Button
          onClick={onZoomOut}
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 rounded-none border-t border-border font-mono retro-button"
          disabled={zoom <= 1}
        >
          <ZoomOut size={14} />
        </Button>
      </div>

      {/* Compass */}
      <div className="bg-card/80 backdrop-blur-sm border border-border rounded-md p-2">
        <Button
          onClick={onResetBearing}
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 font-mono retro-button relative"
          disabled={bearing === 0}
        >
          <Navigation 
            size={16} 
            style={{ transform: `rotate(${bearing}deg)` }}
            className="transition-transform duration-300"
          />
          {bearing !== 0 && (
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-accent rounded-full animate-pulse"></div>
          )}
        </Button>
        <div className="text-xs font-mono text-center text-muted-foreground mt-1">
          {bearing.toFixed(0)}°
        </div>
      </div>

      {/* Layer Selector */}
      <div className="bg-card/80 backdrop-blur-sm border border-border rounded-md p-2">
        <div className="text-xs font-mono text-muted-foreground mb-2 text-center">
          <Layers size={12} className="inline mr-1" />
          LAYER
        </div>
        <Select value={layer} onValueChange={onLayerChange}>
          <SelectTrigger className="h-8 text-xs font-mono bg-background/50 border-border retro-button">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            {mapLayerOptions.map((option) => (
              <SelectItem 
                key={option.value} 
                value={option.value} 
                className="font-mono text-xs hover:bg-accent/20"
              >
                <span className="flex items-center gap-2">
                  <span>{option.icon}</span>
                  <span>{option.label}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};