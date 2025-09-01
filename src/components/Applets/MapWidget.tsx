import React, { useEffect, useRef, useState } from 'react';
import { Map, Search, Settings, MapPin, Layers, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
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
import { supabase } from '@/integrations/supabase/client';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

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
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapboxToken, setMapboxToken] = useState<string>('');
  const [tokenInputMode, setTokenInputMode] = useState<boolean>(false);
  const [manualToken, setManualToken] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLayer, setSelectedLayer] = useState<string>(settings.layer || 'standard');
  const [zoom, setZoom] = useState<number>(settings.zoom || 10);

  const title = settings.title || 'Tactical Map';

  // Fetch Mapbox token
  useEffect(() => {
    // First try to get from localStorage
    const storedToken = localStorage.getItem('mapbox_token');
    if (storedToken) {
      console.log('Using stored token from localStorage');
      setMapboxToken(storedToken);
      return;
    }

    // Fallback to edge function
    const fetchToken = async () => {
      try {
        console.log('Fetching Mapbox token from edge function...');
        const { data, error } = await supabase.functions.invoke('get-mapbox-token');
        console.log('Token response:', { data, error });
        
        if (error) {
          console.error('Edge function failed, switching to manual input mode');
          setTokenInputMode(true);
          return;
        }
        if (data && data.token) {
          console.log('Token received successfully');
          setMapboxToken(data.token);
          localStorage.setItem('mapbox_token', data.token);
        } else {
          console.error('No token in response, switching to manual input mode');
          setTokenInputMode(true);
        }
      } catch (error) {
        console.error('Failed to fetch Mapbox token, switching to manual input mode');
        setTokenInputMode(true);
      }
    };
    fetchToken();
  }, []);

  const handleManualTokenSubmit = () => {
    if (manualToken.trim()) {
      setMapboxToken(manualToken.trim());
      localStorage.setItem('mapbox_token', manualToken.trim());
      setTokenInputMode(false);
      setManualToken('');
    }
  };

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) return;

    mapboxgl.accessToken = mapboxToken;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: getMapStyle(selectedLayer),
      center: location ? [location.longitude, location.latitude] : [-74.0059, 40.7128],
      zoom: zoom,
      attributionControl: false
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Add user location marker if available
    if (location) {
      new mapboxgl.Marker({ color: '#3b82f6' })
        .setLngLat([location.longitude, location.latitude])
        .addTo(map.current);
    }

    return () => {
      map.current?.remove();
    };
  }, [mapboxToken, selectedLayer, location, zoom]);

  const getMapStyle = (layer: string) => {
    switch (layer) {
      case 'satellite': return 'mapbox://styles/mapbox/satellite-v9';
      case 'terrain': return 'mapbox://styles/mapbox/outdoors-v12';
      case 'transport': return 'mapbox://styles/mapbox/navigation-day-v1';
      default: return 'mapbox://styles/mapbox/streets-v12';
    }
  };

  const handleLayerChange = (layer: string) => {
    setSelectedLayer(layer);
    if (map.current) {
      map.current.setStyle(getMapStyle(layer));
    }
    if (onSettingsChange) {
      onSettingsChange({ ...settings, layer });
    }
  };

  const handleZoomIn = () => {
    if (map.current) {
      map.current.zoomIn();
      setZoom(map.current.getZoom());
    }
  };

  const handleZoomOut = () => {
    if (map.current) {
      map.current.zoomOut();
      setZoom(map.current.getZoom());
    }
  };

  const handleResetView = () => {
    if (map.current && location) {
      map.current.flyTo({
        center: [location.longitude, location.latitude],
        zoom: 15
      });
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    try {
      // Use Mapbox Geocoding API or fallback to Nominatim
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchQuery)}.json?access_token=${mapboxToken}&limit=1`
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.features && data.features.length > 0) {
          const [lng, lat] = data.features[0].center;
          map.current?.flyTo({ center: [lng, lat], zoom: 15 });
          
          // Add marker for search result
          new mapboxgl.Marker({ color: '#ef4444' })
            .setLngLat([lng, lat])
            .addTo(map.current!);
        }
      }
    } catch (error) {
      console.error('Search failed:', error);
    }
  };

  const controls = (
    <div className="flex items-center gap-2">
      <LocationStatusInline 
        location={location} 
        status={status} 
        className="text-xs"
      />
    </div>
  );

  const primaryControls = (
    <LocationStatusInline 
      location={location} 
      status={status} 
      className="text-xs"
    />
  );

  if (!mapboxToken) {
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
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center space-y-4 max-w-md">
            <div className="text-4xl opacity-50">🗺️</div>
            {tokenInputMode ? (
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground font-mono">
                  Please enter your Mapbox public token:
                </div>
                <div className="space-y-2">
                  <Input
                    value={manualToken}
                    onChange={(e) => setManualToken(e.target.value)}
                    placeholder="pk.eyJ1Ijoi..."
                    className="font-mono text-xs"
                  />
                  <div className="flex gap-2">
                    <Button 
                      onClick={handleManualTokenSubmit}
                      disabled={!manualToken.trim()}
                      className="font-mono text-xs"
                      size="sm"
                    >
                      Set Token
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => window.open('https://account.mapbox.com/access-tokens/', '_blank')}
                      className="font-mono text-xs"
                      size="sm"
                    >
                      Get Token
                    </Button>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground/70 font-mono">
                  Get your free public token from mapbox.com
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground font-mono">
                  Loading map...
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setTokenInputMode(true)}
                  className="font-mono"
                >
                  Enter Token Manually
                </Button>
              </div>
            )}
          </div>
        </div>
      </BaseWidgetTemplate>
    );
  }

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
              placeholder="Location Search input component"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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
            <Select value={selectedLayer} onValueChange={handleLayerChange}>
              <SelectTrigger className="w-24 h-6 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">Standard</SelectItem>
                <SelectItem value="satellite">Satellite</SelectItem>
                <SelectItem value="terrain">Terrain</SelectItem>
                <SelectItem value="transport">Transport</SelectItem>
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