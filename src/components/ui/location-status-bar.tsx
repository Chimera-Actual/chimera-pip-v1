import React from 'react';
import { Button } from '@/components/ui/button';
import { LocationStatusIndicator } from '@/components/ui/location-status-indicator';
import { cn } from '@/lib/utils';

interface LocationStatusBarProps {
  location?: { latitude: number; longitude: number; name?: string } | null;
  status: 'active' | 'inactive' | 'error' | 'loading';
  lastUpdate?: number;
  onRefresh: () => Promise<void>;
  className?: string;
  compact?: boolean;
  loading?: boolean;
}

export const LocationStatusBar: React.FC<LocationStatusBarProps> = ({
  location,
  status,
  lastUpdate,
  onRefresh,
  className,
  compact = false,
  loading = false
}) => {
  const formatTime = (timestamp?: number) => {
    if (!timestamp) return '--:--';
    return new Date(timestamp).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  const formatCoordinates = (lat?: number, lon?: number) => {
    if (lat === undefined || lon === undefined) return 'NO POSITION';
    return `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
  };

  return (
    <div className={cn(
      "bg-background/95 rounded px-3 py-2 backdrop-blur-sm",
      compact ? "text-xs" : "text-xs",
      className
    )}>
      <div className="flex items-center gap-3">
        <LocationStatusIndicator size={14} />
        
        <div className="font-mono space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">POS:</span>
            <span className="text-primary font-mono">
              {formatCoordinates(location?.latitude, location?.longitude)}
            </span>
          </div>
          
          {!compact && location?.name && (
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">LOC:</span>
              <span className="text-primary font-mono truncate max-w-32">
                {location.name}
              </span>
            </div>
          )}
          
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">UPD:</span>
            <span className="text-primary font-mono">
              {formatTime(lastUpdate)}
            </span>
            <span className={cn(
              "font-mono text-xs",
              status === 'active' ? 'text-accent' : 
              status === 'loading' ? 'text-yellow-400' :
              status === 'error' ? 'text-destructive' : 'text-muted-foreground'
            )}>
              {status.toUpperCase()}
            </span>
          </div>
        </div>

        <Button
          onClick={onRefresh}
          disabled={loading}
          variant="ghost"
          size="sm"
          className="h-8 px-2 text-xs font-mono bg-background/50 hover:bg-primary/20 shrink-0"
        >
          {loading ? '...' : '↻'}
        </Button>
      </div>
    </div>
  );
};