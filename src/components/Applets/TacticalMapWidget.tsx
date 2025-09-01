import React, { useState, useEffect } from 'react';
import { Map, Settings, Target, Navigation, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useResponsive } from '@/hooks/useResponsive';
import { useLocation } from '@/contexts/LocationContext';
import { StandardWidgetTemplate } from '@/components/Layout/StandardWidgetTemplate';
import { LocationStatusBar } from '@/components/ui/location-status-bar';
import { useMapState } from '@/hooks/useMapState';
import { MapWidgetSettings } from './Settings/MapWidgetSettings';

// Gradually re-enable components to debug
import { MapRenderer } from './MapComponents/MapRenderer';
// import { MapControls } from './MapComponents/MapControls';
// import { LocationSearch } from './MapComponents/LocationSearch';
// import { CoordinateDisplay } from './MapComponents/CoordinateDisplay';
// import { PlacemarksManager } from './MapComponents/PlacemarksManager';

interface TacticalMapWidgetProps {
  settings?: any;
  onSettingsChange?: (settings: any) => void;
}

export const TacticalMapWidget: React.FC<TacticalMapWidgetProps> = ({
  settings = {},
  onSettingsChange
}) => {
  const { isMobile } = useResponsive();
  const { location, status, lastUpdate, refreshLocation } = useLocation();
  
  const [showSettings, setShowSettings] = useState(false);
  const [loading, setLoading] = useState(false);

  // Initialize map state
  const {
    mapState,
    updateCenter,
    updateZoom,
    updateLayer,
    addPlacemark,
    removePlacemark,
    togglePlacemarkVisibility,
    updatePlacemark,
    searchLocations,
    clearSearch,
    navigateToLocation,
    toggleFollowUser,
    centerOnUser
  } = useMapState(settings);

  console.log('TacticalMapWidget: Rendering with settings:', settings);
  console.log('TacticalMapWidget: Location data:', location);

  // Simplified handlers for debugging
  const handleRefreshLocation = async () => {
    console.log('TacticalMapWidget: Refresh location called');
    setLoading(true);
    try {
      await refreshLocation();
    } finally {
      setLoading(false);
    }
  };

  const handleSettingsChange = (newSettings: any) => {
    console.log('TacticalMapWidget: Settings changed:', newSettings);
    onSettingsChange?.(newSettings);
    setShowSettings(false);
  };

  // Settings button
  const settingsButton = (
    <Button
      onClick={() => setShowSettings(true)}
      variant="ghost"
      size="sm"
      className="h-8 w-8 p-0 retro-button"
    >
      <Settings size={14} />
    </Button>
  );

  if (showSettings) {
    console.log('TacticalMapWidget: Showing settings');
    return (
      <MapWidgetSettings
        settings={{
          defaultLayer: 'standard',
          placemarks: [],
          showCenterpoint: settings.showCenterpoint ?? true,
          autoZoom: settings.autoZoom ?? true,
          followUser: false
        }}
        onSettingsChange={handleSettingsChange}
        onClose={() => setShowSettings(false)}
      />
    );
  }

  console.log('TacticalMapWidget: Rendering main UI');

  return (
    <StandardWidgetTemplate
      icon={<Map size={isMobile ? 16 : 20} />}
      title="TACTICAL MAP SYSTEM"
      controls={
        <div className="flex items-center gap-2">
          {/* Desktop Location Status */}
          {!isMobile && (
            <LocationStatusBar
              location={location}
              status={status}
              lastUpdate={lastUpdate || undefined}
              onRefresh={handleRefreshLocation}
              compact={true}
              loading={loading}
              className="border border-border"
            />
          )}
          {settingsButton}
        </div>
      }
    >
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Location Status */}
        {isMobile && (
          <div className="flex-shrink-0 bg-card/30 border-b border-border p-3">
            <LocationStatusBar
              location={location}
              status={status}
              lastUpdate={lastUpdate || undefined}
              onRefresh={handleRefreshLocation}
              compact={false}
              loading={loading}
            />
          </div>
        )}

        {/* Map Renderer - Testing Phase 1 */}
        <div className="flex-1 bg-background relative">
          <MapRenderer
            center={mapState.center}
            zoom={mapState.zoom}
            layer={mapState.layer}
            placemarks={mapState.placemarks}
            userLocation={location}
            followUser={mapState.followUser}
            showCenterpoint={mapState.showCenterpoint}
            onCenterChange={updateCenter}
            onZoomChange={updateZoom}
          />
        </div>
      </div>
    </StandardWidgetTemplate>
  );
};