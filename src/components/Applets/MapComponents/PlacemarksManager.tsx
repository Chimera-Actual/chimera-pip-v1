import React from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Eye, EyeOff, MapPin, Trash2, Navigation } from 'lucide-react';
import { Placemark } from '@/hooks/useMapState';

interface PlacemarksManagerProps {
  placemarks: Placemark[];
  onPlacemarkVisibilityToggle: (id: string) => void;
  onPlacemarkDelete: (id: string) => void;
  onNavigateToPlacemark: (placemark: Placemark) => void;
  className?: string;
}

export const PlacemarksManager: React.FC<PlacemarksManagerProps> = ({
  placemarks,
  onPlacemarkVisibilityToggle,
  onPlacemarkDelete,
  onNavigateToPlacemark,
  className = ""
}) => {
  const visibleCount = placemarks.filter(p => p.visible).length;

  return (
    <div className={`bg-card/80 backdrop-blur-sm border border-border rounded-md ${className}`}>
      <div className="p-3 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin size={14} className="text-accent" />
            <span className="text-xs font-mono text-accent font-bold">PLACEMARKS</span>
          </div>
          <div className="text-xs font-mono text-muted-foreground">
            {visibleCount}/{placemarks.length} VISIBLE
          </div>
        </div>
      </div>

      <ScrollArea className="max-h-40">
        <div className="p-2 space-y-2">
          {placemarks.length === 0 ? (
            <div className="p-4 text-center text-xs font-mono text-muted-foreground">
              NO PLACEMARKS DEFINED
              <br />
              <span className="text-2xs">Use search to add locations</span>
            </div>
          ) : (
            placemarks.map((placemark) => (
              <div
                key={placemark.id}
                className={`flex items-center gap-2 p-2 rounded-sm border transition-colors ${
                  placemark.visible 
                    ? 'border-accent/30 bg-accent/10' 
                    : 'border-border bg-muted/30'
                }`}
              >
                <Switch
                  checked={placemark.visible}
                  onCheckedChange={() => onPlacemarkVisibilityToggle(placemark.id)}
                  className="scale-75"
                />
                
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-mono text-foreground font-bold truncate">
                    {placemark.name}
                  </div>
                  {placemark.description && (
                    <div className="text-2xs text-muted-foreground truncate">
                      {placemark.description}
                    </div>
                  )}
                  <div className="text-2xs font-mono text-muted-foreground">
                    {placemark.latitude.toFixed(4)}, {placemark.longitude.toFixed(4)}
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    onClick={() => onNavigateToPlacemark(placemark)}
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 retro-button"
                    title="Navigate to placemark"
                  >
                    <Navigation size={10} />
                  </Button>
                  <Button
                    onClick={() => onPlacemarkDelete(placemark.id)}
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-destructive hover:bg-destructive/20 retro-button"
                    title="Delete placemark"
                  >
                    <Trash2 size={10} />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};