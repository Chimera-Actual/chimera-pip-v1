import React from 'react';
import { MapPin, MapPinOff, Loader2, AlertTriangle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useLocationStatus, LocationStatus } from '@/hooks/useLocationStatus';
import { cn } from '@/lib/utils';

interface LocationStatusIndicatorProps {
  className?: string;
  size?: number;
}

const getStatusConfig = (status: LocationStatus, isEnabled: boolean, hasData: boolean) => {
  if (!isEnabled) {
    return {
      icon: MapPinOff,
      color: 'text-muted-foreground',
      bgColor: 'bg-muted-foreground/10',
      tooltip: 'Location services disabled',
    };
  }

  switch (status) {
    case 'active':
      return {
        icon: MapPin,
        color: 'text-green-500',
        bgColor: 'bg-green-500/10',
        tooltip: 'Location active - receiving updates',
      };
    case 'loading':
      return {
        icon: Loader2,
        color: 'text-yellow-500',
        bgColor: 'bg-yellow-500/10',
        tooltip: 'Getting location data...',
        animate: true,
      };
    case 'error':
      return {
        icon: AlertTriangle,
        color: 'text-red-500',
        bgColor: 'bg-red-500/10',
        tooltip: 'Location data unavailable',
      };
    case 'inactive':
    default:
      return {
        icon: MapPinOff,
        color: 'text-muted-foreground',
        bgColor: 'bg-muted-foreground/10',
        tooltip: 'Location inactive',
      };
  }
};

export const LocationStatusIndicator: React.FC<LocationStatusIndicatorProps> = ({
  className,
  size = 16,
}) => {
  const { status, isLocationEnabled, hasLocationData, locationName } = useLocationStatus();
  const config = getStatusConfig(status, isLocationEnabled, hasLocationData);
  const IconComponent = config.icon;

  const tooltipText = locationName 
    ? `${config.tooltip} - ${locationName}`
    : config.tooltip;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              'flex items-center justify-center rounded-full p-1.5 transition-all duration-200',
              config.bgColor,
              'border border-border/50',
              className
            )}
          >
            <IconComponent
              size={size}
              className={cn(
                config.color,
                config.animate && 'animate-spin'
              )}
            />
          </div>
        </TooltipTrigger>
        <TooltipContent
          side="bottom"
          className="text-xs font-mono bg-background border-border"
        >
          {tooltipText}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};