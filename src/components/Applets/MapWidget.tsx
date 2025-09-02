import React, { useEffect, useRef, useState } from 'react';
import { Map, Search, Layers, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { BaseWidgetTemplate } from '@/components/Layout/BaseWidgetTemplate';
import { BaseWidgetProps } from '@/types/widget';
import { MapWidgetSettings } from './MapWidgetSettings';
import { LocationStatusInline } from '@/components/ui/location-status-inline';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { useResponsive } from '@/hooks/useResponsive';
import { useLocationStatus } from '@/hooks/useLocationStatus';
import { useLocation } from '@/contexts/LocationContext';
import { useMapState, type MapLayer } from '@/hooks/useMapState';
import { MapStyleManager } from './Map/MapStyleManager';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

const MapWidget: React.FC<BaseWidgetProps> = ({
  widgetInstanceId,
  settings = {},
  onSettingsChange,
  widgetName
}) => {
  const { isMobile } = useResponsive();
  const { status } = useLocationStatus();
  const { location } = useLocation();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const userMarker = useRef<maplibregl.Marker | null>(null);
  
  const {
    mapState,
    updateLayer,
    updateZoom,
    searchLocations,
    navigateToLocation,
    clearSearch
  } = useMapState({
    defaultLayer: (settings.layer as MapLayer) || 'standard',
    defaultZoom: (settings.zoom as number) || 10,
    widgetInstanceId // Pass widget ID for state persistence
  });

  const title = settings.title || 'Open Source Map';

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current) return;

    const mapStyle = MapStyleManager.getStyle(mapState.layer);
    
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: mapStyle.style,
      center: mapState.center,
      zoom: mapState.zoom,
      attributionControl: false
    });

    // Add navigation controls
    map.current.addControl(new maplibregl.NavigationControl(), 'top-right');

    // Update zoom when map zoom changes
    map.current.on('zoom', () => {
      if (map.current) {
        updateZoom(map.current.getZoom());
      }
    });

    return () => {
      map.current?.remove();
    };
  }, []);

  // Update map style when layer changes
  useEffect(() => {
    if (map.current && mapState.layer) {
      const mapStyle = MapStyleManager.getStyle(mapState.layer);
      map.current.setStyle(mapStyle.style);
    }
  }, [mapState.layer]);

  // Update user location marker
  useEffect(() => {
    if (!map.current || !location) return;

    // Remove existing marker
    if (userMarker.current) {
      userMarker.current.remove();
    }

    // Add new user location marker
    userMarker.current = new maplibregl.Marker({ color: '#3b82f6' })
      .setLngLat([location.longitude, location.latitude])
      .addTo(map.current);

    // Center map on user if following
    if (mapState.followUser) {
      map.current.flyTo({
        center: [location.longitude, location.latitude],
        zoom: mapState.zoom
      });
    }
  }, [location, mapState.followUser, mapState.zoom]);

  const handleLayerChange = (layer: string) => {
    updateLayer(layer as MapLayer);
    if (onSettingsChange) {
      onSettingsChange({ ...settings, layer });
    }
  };

  const handleZoomIn = () => {
    if (map.current) {
      map.current.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (map.current) {
      map.current.zoomOut();
    }
  };

  const handleResetView = () => {
    if (map.current && location) {
      navigateToLocation(location.longitude, location.latitude, 15);
      map.current.flyTo({
        center: [location.longitude, location.latitude],
        zoom: 15
      });
    }
  };

  const handleSearch = async () => {
    if (!mapState.activeSearch.trim()) return;
    
    await searchLocations(mapState.activeSearch);
    
    // Navigate to first result if available
    if (mapState.searchResults.length > 0) {
      const result = mapState.searchResults[0];
      navigateToLocation(result.longitude, result.latitude, 15);
      
      if (map.current) {
        map.current.flyTo({ 
          center: [result.longitude, result.latitude], 
          zoom: 15 
        });
        
        // Add marker for search result
        new maplibregl.Marker({ color: '#ef4444' })
          .setLngLat([result.longitude, result.latitude])
          .addTo(map.current);
      }
    }
  };

  const primaryControls = (
    <LocationStatusInline 
      location={location} 
      status={status} 
      className="text-xs"
    />
  );


  return (
    <BaseWidgetTemplate
      icon={<Map size={isMobile ? 16 : 20} />}
      title={title}
      widgetInstanceId={widgetInstanceId}
      settings={settings}
      onSettingsChange={onSettingsChange}
      widgetName={widgetName}
      settingsComponent={MapWidgetSettings}
      primaryControls={primaryControls}
    >
      <div className="flex-1 relative overflow-hidden">
        {/* Map Container */}
        <div ref={mapContainer} className="absolute inset-0" />
        
        {/* Search Bar */}
        <Card className="absolute top-4 left-4 right-4 z-10 p-2">
          <div className="flex gap-2">
            <Input
              placeholder="Search locations..."
              value={mapState.activeSearch}
              onChange={(e) => searchLocations(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1 h-8 text-xs"
            />
            <Button size="sm" onClick={handleSearch} className="h-8 px-2">
              <Search size={14} />
            </Button>
          </div>
        </Card>

        {/* Map Controls */}
        <div className="absolute left-4 bottom-16 z-10 flex flex-col gap-2">
          <Card className="p-1">
            <div className="flex flex-col gap-1">
              <Button size="sm" variant="ghost" onClick={handleZoomIn} className="h-8 w-8 p-0">
                <ZoomIn size={14} />
              </Button>
              <Button size="sm" variant="ghost" onClick={handleZoomOut} className="h-8 w-8 p-0">
                <ZoomOut size={14} />
              </Button>
              <Button size="sm" variant="ghost" onClick={handleResetView} className="h-8 w-8 p-0">
                <RotateCcw size={14} />
              </Button>
            </div>
          </Card>
        </div>

        {/* Layer Selector */}
        <Card className="absolute right-4 bottom-16 z-10 p-2">
          <div className="flex items-center gap-2">
            <Layers size={14} />
            <Select value={mapState.layer} onValueChange={handleLayerChange}>
              <SelectTrigger className="w-24 h-6 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">Standard</SelectItem>
                <SelectItem value="satellite">Satellite</SelectItem>
                <SelectItem value="terrain">Terrain</SelectItem>
                <SelectItem value="transport">Transport</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="light">Light</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Crosshair */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          <div className="w-8 h-8 border-2 border-primary rounded-full bg-background/20 flex items-center justify-center">
            <div className="w-1 h-1 bg-primary rounded-full"></div>
          </div>
        </div>
      </div>
    </BaseWidgetTemplate>
  );
};

export default MapWidget;