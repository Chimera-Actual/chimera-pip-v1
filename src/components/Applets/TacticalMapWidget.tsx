import React, { useState, useEffect } from 'react';
import { Map, Settings, Crosshair } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StandardWidgetTemplate } from '@/components/Layout/StandardWidgetTemplate';
import { LocationStatusInline } from '@/components/ui/location-status-inline';
import { useMapboxState } from '@/hooks/useMapboxState';
import { useLocation } from '@/contexts/LocationContext';
import { useResponsive } from '@/hooks/useResponsive';
import { useLocationStatus } from '@/hooks/useLocationStatus';
import { MapboxRenderer } from './MapComponents/MapboxRenderer';
import { MapboxControls } from './MapComponents/MapboxControls';
import { MapboxLocationSearch } from './MapComponents/MapboxLocationSearch';
import { MapboxLayerSelector } from './MapComponents/MapboxLayerSelector';
import { MapWidgetSettings } from './Settings/MapWidgetSettings';
import { supabase } from '@/integrations/supabase/client';

interface TacticalMapWidgetProps {
  settings?: any;
  onSettingsChange?: (settings: any) => void;
}

export const TacticalMapWidget: React.FC<TacticalMapWidgetProps> = ({
  settings = {},
  onSettingsChange
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const [mapboxToken, setMapboxToken] = useState<string | null>(null);
  const { location, getCurrentLocation } = useLocation();
  const { isMobile } = useResponsive();
  const { status: locationStatus } = useLocationStatus();

  const {
    mapState,
    updateCenter,
    updateZoom,
    updateLayer,
    updateBearing,
    addPlacemark,
    navigateToLocation,
    searchLocations,
    clearSearch,
    getMapStyle
  } = useMapboxState(settings);

  // Fetch Mapbox token
  useEffect(() => {
    const fetchMapboxToken = async () => {
      try {
        const { data } = await supabase.functions.invoke('get-mapbox-token');
        setMapboxToken(data?.token || null);
      } catch (error) {
        console.error('Failed to fetch Mapbox token:', error);
      }
    };
    fetchMapboxToken();
  }, []);

  const handleAddPlacemark = (result: any) => {
    addPlacemark({
      name: result.name,
      latitude: result.latitude,
      longitude: result.longitude,
      description: result.display_name
    });
    clearSearch();
  };

  if (showSettings) {
    return (
      <MapWidgetSettings
        settings={settings}
        onSettingsChange={(newSettings) => {
          onSettingsChange?.(newSettings);
          setShowSettings(false);
        }}
        onClose={() => setShowSettings(false)}
      />
    );
  }

  return (
    <StandardWidgetTemplate
      icon={<Map size={16} />}
      title="TACTICAL MAP"
      statusDisplay={
        <LocationStatusInline
          location={location}
          status={locationStatus}
        />
      }
      controls={
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowSettings(true)}
          className="retro-button w-8 h-8 p-0"
        >
          <Settings size={14} />
        </Button>
      }
    >
      <div className="relative flex flex-col h-full overflow-hidden">
        <div className="absolute top-2 left-2 right-16 z-20">
          <MapboxLocationSearch
            value={mapState.activeSearch}
            results={mapState.searchResults}
            isSearching={mapState.isSearching}
            onSearchChange={(query) => searchLocations(query, mapboxToken || undefined)}
            onResultSelect={(result) => navigateToLocation(result.longitude, result.latitude, 15)}
            onAddPlacemark={handleAddPlacemark}
            onClear={clearSearch}
          />
        </div>

        <div className="flex-1 relative">
          {!mapboxToken ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <div className="text-center">
                <Crosshair size={48} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm font-mono">LOADING MAP...</p>
              </div>
            </div>
          ) : (
            <MapboxRenderer
              center={mapState.center}
              zoom={mapState.zoom}
              bearing={mapState.bearing}
              pitch={mapState.pitch}
              mapStyle={getMapStyle(mapState.layer)}
              placemarks={mapState.placemarks}
              userLocation={location}
              showCenterpoint={mapState.showCenterpoint}
              followUser={mapState.followUser}
              onCenterChange={updateCenter}
              onZoomChange={updateZoom}
              onBearingChange={updateBearing}
              onPitchChange={() => {}}
            />
          )}

          <MapboxControls
            zoom={mapState.zoom}
            bearing={mapState.bearing}
            onZoomIn={() => updateZoom(Math.min(mapState.zoom + 1, 22))}
            onZoomOut={() => updateZoom(Math.max(mapState.zoom - 1, 0))}
            onResetBearing={() => updateBearing(0)}
            onResetView={() => location && navigateToLocation(location.longitude, location.latitude)}
          />

          <div className="absolute bottom-2 right-2 z-10">
            <MapboxLayerSelector
              selectedLayer={mapState.layer}
              onLayerChange={updateLayer}
            />
          </div>
        </div>
      </div>
    </StandardWidgetTemplate>
  );
};