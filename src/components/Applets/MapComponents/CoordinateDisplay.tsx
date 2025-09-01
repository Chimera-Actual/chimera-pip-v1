import React from 'react';
import { Crosshair } from 'lucide-react';

interface CoordinateDisplayProps {
  center: [number, number];
  userLocation?: { latitude: number; longitude: number } | null;
  className?: string;
}

export const CoordinateDisplay: React.FC<CoordinateDisplayProps> = ({
  center,
  userLocation,
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

  const distance = userLocation ? 
    Math.sqrt(
      Math.pow(center[0] - userLocation.latitude, 2) + 
      Math.pow(center[1] - userLocation.longitude, 2)
    ) * 111 : null; // Rough conversion to km

  return (
    <div className={`bg-card/80 backdrop-blur-sm border border-border rounded-md p-2 ${className}`}>
      <div className="flex items-center gap-2 mb-2">
        <Crosshair size={12} className="text-primary" />
        <span className="text-xs font-mono text-primary font-bold">CROSSHAIRS</span>
      </div>
      
      <div className="space-y-1 text-xs font-mono">
        <div className="text-muted-foreground">
          LAT: <span className="text-foreground">{formatCoordinate(center[0], 'lat')}</span>
        </div>
        <div className="text-muted-foreground">
          LNG: <span className="text-foreground">{formatCoordinate(center[1], 'lng')}</span>
        </div>
        
        {userLocation && distance !== null && distance > 0.01 && (
          <div className="text-muted-foreground pt-1 border-t border-border/50">
            DIST: <span className="text-accent">{distance.toFixed(2)}km</span>
          </div>
        )}
      </div>
    </div>
  );
};