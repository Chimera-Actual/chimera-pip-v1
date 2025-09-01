import React from 'react';
import { Map, Satellite, Mountain, Navigation } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapLayer } from '@/hooks/useMapboxState';

const layerOptions = [
  { value: 'standard', label: 'Standard', icon: Map },
  { value: 'satellite', label: 'Satellite', icon: Satellite },
  { value: 'terrain', label: 'Terrain', icon: Mountain },
  { value: 'transport', label: 'Transport', icon: Navigation }
] as const;

interface MapboxLayerSelectorProps {
  selectedLayer: MapLayer;
  onLayerChange: (layer: MapLayer) => void;
  className?: string;
}

export const MapboxLayerSelector: React.FC<MapboxLayerSelectorProps> = ({
  selectedLayer,
  onLayerChange,
  className = ""
}) => {
  const selectedOption = layerOptions.find(option => option.value === selectedLayer);
  const SelectedIcon = selectedOption?.icon || Map;

  return (
    <div className={`bg-card/80 backdrop-blur-sm border border-border rounded-md ${className}`}>
      <Select value={selectedLayer} onValueChange={onLayerChange}>
        <SelectTrigger className="w-32 bg-transparent border-none font-mono text-xs">
          <div className="flex items-center gap-2">
            <SelectedIcon size={14} className="text-primary" />
            <SelectValue />
          </div>
        </SelectTrigger>
        
        <SelectContent className="bg-card/95 backdrop-blur-sm border-border">
          {layerOptions.map((option) => {
            const Icon = option.icon;
            return (
              <SelectItem 
                key={option.value} 
                value={option.value}
                className="font-mono text-xs hover:bg-muted/50"
              >
                <div className="flex items-center gap-2">
                  <Icon size={14} className="text-primary" />
                  <span>{option.label}</span>
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
};