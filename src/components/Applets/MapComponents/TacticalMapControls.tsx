import React from 'react';
import { Button } from '@/components/ui/button';
import { Settings, MapPin, Target, RotateCcw } from 'lucide-react';
import { LocationStatusInline } from '@/components/ui/location-status-inline';
import { useResponsive } from '@/hooks/useResponsive';

interface TacticalMapControlsProps {
  location?: { latitude: number; longitude: number; name?: string } | null;
  status: 'active' | 'inactive' | 'error' | 'loading';
  followUser: boolean;
  onSettingsClick: () => void;
  onToggleFollow: () => void;
  onCenterOnUser: () => void;
  onRefreshLocation: () => void;
  loading?: boolean;
}

export const TacticalMapControls: React.FC<TacticalMapControlsProps> = ({
  location,
  status,
  followUser,
  onSettingsClick,
  onToggleFollow,
  onCenterOnUser,
  onRefreshLocation,
  loading = false
}) => {
  const { isMobile } = useResponsive();

  return (
    <div className="flex items-center gap-2">
      {/* Location Status Display - Desktop only */}
      <div className="hidden md:block">
        <LocationStatusInline
          location={location}
          status={status}
          className="border border-border rounded px-2 py-1 bg-card/50 backdrop-blur-sm"
        />
      </div>

      {/* Primary Controls */}
      <div className="flex items-center gap-1">
        {/* Follow Toggle */}
        <Button
          variant={followUser ? "default" : "ghost"}
          size="sm"
          onClick={onToggleFollow}
          className="retro-button w-8 h-8 p-0"
          title={followUser ? "Stop following location" : "Follow user location"}
        >
          <Target size={14} className={followUser ? "animate-pulse" : ""} />
        </Button>

        {/* Center on User */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onCenterOnUser}
          disabled={loading || !location}
          className="retro-button w-8 h-8 p-0"
          title="Center on current location"
        >
          <MapPin size={14} />
        </Button>

        {/* Refresh Location */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onRefreshLocation}
          disabled={loading}
          className="retro-button w-8 h-8 p-0"
          title="Refresh location"
        >
          <RotateCcw size={14} className={loading ? "animate-spin" : ""} />
        </Button>
      </div>

      {/* Settings Gear */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onSettingsClick}
        className="retro-button w-8 h-8 p-0 ml-1"
        title="Open settings"
      >
        <Settings size={14} />
      </Button>
    </div>
  );
};