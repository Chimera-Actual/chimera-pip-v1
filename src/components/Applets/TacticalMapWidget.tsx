import React, { useState, useEffect } from 'react';
import { Map, Settings, Target, Navigation, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useResponsive } from '@/hooks/useResponsive';
import { useLocation } from '@/contexts/LocationContext';
import { useMapState, Placemark } from '@/hooks/useMapState';
import { StandardWidgetTemplate } from '@/components/Layout/StandardWidgetTemplate';
import { MapRenderer } from './MapComponents/MapRenderer';
import { MapControls } from './MapComponents/MapControls';
import { LocationSearch } from './MapComponents/LocationSearch';
import { CoordinateDisplay } from './MapComponents/CoordinateDisplay';
import { PlacemarksManager } from './MapComponents/PlacemarksManager';
import { LocationStatusBar } from '@/components/ui/location-status-bar';
import { MapWidgetSettings } from './Settings/MapWidgetSettings';

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
  const [bearing, setBearing] = useState(0);
  const [loading, setLoading] = useState(false);

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

  // Update map center when user location changes and follow mode is active
  useEffect(() => {
    if (location && mapState.followUser) {
      updateCenter([location.latitude, location.longitude]);
    }
  }, [location, mapState.followUser, updateCenter]);

  // Map control handlers
  const handleZoomIn = () => {
    const newZoom = Math.min(mapState.zoom + 1, 18);
    updateZoom(newZoom);
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(mapState.zoom - 1, 1);
    updateZoom(newZoom);
  };

  const handleResetBearing = () => {
    setBearing(0);
  };

  // Search handlers
  const handleSearchResultClick = (result: any) => {
    navigateToLocation(result.latitude, result.longitude, settings.autoZoom ? 15 : mapState.zoom);
  };

  const handleAddPlacemark = (result: any) => {
    const placemark = {
      name: result.name,
      latitude: result.latitude,
      longitude: result.longitude,
      description: result.display_name
    };
    addPlacemark(placemark);
    clearSearch();
  };

  // Placemark handlers
  const handlePlacemarkNavigation = (placemark: Placemark) => {
    navigateToLocation(placemark.latitude, placemark.longitude, settings.autoZoom ? 15 : mapState.zoom);
  };

  const handlePlacemarkClick = (placemark: Placemark) => {
    console.log('Placemark clicked:', placemark);
  };

  // Location handlers
  const handleRefreshLocation = async () => {
    setLoading(true);
    try {
      await refreshLocation();
    } finally {
      setLoading(false);
    }
  };

  const handleCenterOnUser = async () => {
    setLoading(true);
    try {
      await centerOnUser();
    } finally {
      setLoading(false);
    }
  };

  // Settings handlers
  const handleSettingsChange = (newSettings: any) => {
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
    return (
      <MapWidgetSettings
        settings={{
          defaultLayer: mapState.layer,
          placemarks: mapState.placemarks,
          showCenterpoint: settings.showCenterpoint ?? true,
          autoZoom: settings.autoZoom ?? true,
          followUser: mapState.followUser
        }}
        onSettingsChange={handleSettingsChange}
        onClose={() => setShowSettings(false)}
      />
    );
  }

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

        {/* Search and Controls Bar */}
        <div className={`flex-shrink-0 bg-card/50 border-b border-border ${isMobile ? 'p-3' : 'p-4'}`}>
          <div className={`flex ${isMobile ? 'flex-col gap-3' : 'items-center justify-between'}`}>
            {/* Search Bar */}
            <LocationSearch
              searchQuery={mapState.activeSearch}
              searchResults={mapState.searchResults}
              isSearching={mapState.isSearching}
              onSearchChange={searchLocations}
              onSearchResultClick={handleSearchResultClick}
              onAddPlacemark={handleAddPlacemark}
              onClearSearch={clearSearch}
              className="flex-1 max-w-md"
            />

            {/* Action Buttons */}
            <div className={`flex gap-2 ${isMobile ? 'flex-wrap' : ''}`}>
              <Button
                onClick={toggleFollowUser}
                variant={mapState.followUser ? "default" : "outline"}
                size="sm"
                className={`font-mono retro-button ${isMobile ? 'flex-1 h-9 text-xs' : 'h-8 px-3 text-xs'}`}
              >
                {mapState.followUser ? '🎯 FOLLOW' : '📍 MANUAL'}
              </Button>
              <Button
                onClick={handleCenterOnUser}
                disabled={loading}
                variant="ghost"
                size="sm"
                className={`font-mono bg-background/50 hover:bg-primary/20 retro-button ${isMobile ? 'flex-1 h-9 text-xs' : 'h-8 px-3 text-xs'}`}
              >
                {loading ? 'GPS...' : '📍 LOCATE'}
              </Button>
            </div>
          </div>
        </div>

        {/* Map Container */}
        <div className="flex-1 relative bg-background min-h-0">
          <MapRenderer
            center={mapState.center}
            zoom={mapState.zoom}
            layer={mapState.layer}
            placemarks={mapState.placemarks}
            userLocation={location}
            showCenterpoint={settings.showCenterpoint ?? true}
            followUser={mapState.followUser}
            onCenterChange={updateCenter}
            onZoomChange={updateZoom}
            onPlacemarkClick={handlePlacemarkClick}
            className="w-full h-full"
          />

          {/* Map Controls - Right Side */}
          <div className={`absolute ${isMobile ? 'top-4 right-4' : 'top-6 right-6'} z-10`}>
            <MapControls
              zoom={mapState.zoom}
              layer={mapState.layer}
              bearing={bearing}
              onZoomIn={handleZoomIn}
              onZoomOut={handleZoomOut}
              onLayerChange={updateLayer}
              onResetBearing={handleResetBearing}
            />
          </div>

          {/* Coordinate Display - Bottom Left */}
          <div className={`absolute ${isMobile ? 'bottom-4 left-4' : 'bottom-6 left-6'} z-10`}>
            <CoordinateDisplay
              center={mapState.center}
              userLocation={location}
            />
          </div>

          {/* Placemarks Manager - Bottom Right (Desktop Only) */}
          {!isMobile && mapState.placemarks.length > 0 && (
            <div className="absolute bottom-6 right-48 z-10 w-64">
              <PlacemarksManager
                placemarks={mapState.placemarks}
                onPlacemarkVisibilityToggle={togglePlacemarkVisibility}
                onPlacemarkDelete={removePlacemark}
                onNavigateToPlacemark={handlePlacemarkNavigation}
              />
            </div>
          )}
        </div>
      </div>
    </StandardWidgetTemplate>
  );
};