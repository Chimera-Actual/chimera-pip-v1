import React from 'react';
import { Crosshair, Navigation } from 'lucide-react';

interface MapboxCoordinateDisplayProps {
  center: [number, number]; // [lng, lat]
  userLocation?: { latitude: number; longitude: number } | null;
  bearing: number;
  zoom: number;
  className?: string;
}

export const MapboxCoordinateDisplay: React.FC<MapboxCoordinateDisplayProps> = ({
  center,
  userLocation,
  bearing,
  zoom,
  className = ""
}) => {
  const formatCoordinate = (value: number, type: 'lat' | 'lng') => {
    const direction = type === 'lat' 
      ? (value >= 0 ? 'N' : 'S')
      : (value >= 0 ? 'E' : 'W');
    
    const absValue = Math.abs(value);
    const degrees = Math.floor(absValue);
    const minutes = ((absValue - degrees) * 60).toFixed(4);
    
    return `${degrees}°${minutes}'${direction}`;
  };

  const formatDecimal = (value: number) => {
    return value.toFixed(6);
  };

  // Calculate distance from user location
  const distance = userLocation ? 
    Math.sqrt(
      Math.pow(center[1] - userLocation.latitude, 2) + 
      Math.pow(center[0] - userLocation.longitude, 2)
    ) * 111 : null; // Rough conversion to km

  return (
    <div className={`bg-card/80 backdrop-blur-sm border border-border rounded-md p-3 ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border/50">
        <Crosshair size={14} className="text-primary" />
        <span className="text-xs font-mono text-primary font-bold">CROSSHAIRS</span>
      </div>
      
      {/* Coordinates */}
      <div className="space-y-2 text-xs font-mono">
        {/* Decimal Degrees */}
        <div className="space-y-1">
          <div className="text-muted-foreground">
            LAT: <span className="text-foreground">{formatDecimal(center[1])}</span>
          </div>
          <div className="text-muted-foreground">
            LNG: <span className="text-foreground">{formatDecimal(center[0])}</span>
          </div>
        </div>

        {/* Degrees/Minutes */}
        <div className="space-y-1 pt-2 border-t border-border/50">
          <div className="text-muted-foreground">
            LAT: <span className="text-foreground">{formatCoordinate(center[1], 'lat')}</span>
          </div>
          <div className="text-muted-foreground">
            LNG: <span className="text-foreground">{formatCoordinate(center[0], 'lng')}</span>
          </div>
        </div>

        {/* Additional Info */}
        <div className="space-y-1 pt-2 border-t border-border/50">
          <div className="text-muted-foreground">
            ZOOM: <span className="text-foreground">{zoom.toFixed(1)}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Navigation size={10} style={{ transform: `rotate(${bearing}deg)` }} />
            BRG: <span className="text-foreground">{bearing.toFixed(1)}°</span>
          </div>
        </div>
        
        {/* Distance from user location */}
        {userLocation && distance !== null && distance > 0.01 && (
          <div className="text-muted-foreground pt-2 border-t border-border/50">
            DIST: <span className="text-accent">{distance.toFixed(2)}km</span>
          </div>
        )}
      </div>
    </div>
  );
};