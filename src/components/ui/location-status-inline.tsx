import React from 'react';
import { LocationStatusIndicator } from '@/components/ui/location-status-indicator';
import { cn } from '@/lib/utils';

interface LocationStatusInlineProps {
  location?: { latitude: number; longitude: number; name?: string } | null;
  status: 'active' | 'inactive' | 'error' | 'loading';
  className?: string;
}

export const LocationStatusInline: React.FC<LocationStatusInlineProps> = ({
  location,
  status,
  className
}) => {
  const formatCoordinates = (lat?: number, lon?: number) => {
    if (lat === undefined || lon === undefined) return 'NO POS';
    return `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
  };

  return (
    <div className={cn(
      "flex items-center gap-2 text-xs font-mono text-muted-foreground",
      className
    )}>
      <LocationStatusIndicator size={12} />
      <span className="text-primary">
        {formatCoordinates(location?.latitude, location?.longitude)}
      </span>
      <span className={cn(
        "text-xs",
        status === 'active' ? 'text-accent' : 
        status === 'loading' ? 'text-yellow-400' :
        status === 'error' ? 'text-destructive' : 'text-muted-foreground'
      )}>
        {status === 'active' ? 'LOCK' : status.toUpperCase()}
      </span>
    </div>
  );
};