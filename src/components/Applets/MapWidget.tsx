import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LocationStatusBar } from '@/components/ui/location-status-bar';
import { useLocation } from '@/contexts/LocationContext';
import { useToast } from '@/components/ui/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { StandardWidgetTemplate } from '@/components/Layout/StandardWidgetTemplate';
import { Map, Settings } from 'lucide-react';
import { MapWidgetSettings } from '@/components/Applets/Settings/MapWidgetSettings';

interface SearchResult {
  lat: number;
  lon: number;
  display_name: string;
  formatted_name: string;
  type: string;
  importance: number;
}

type MapLayer = 'standard' | 'satellite' | 'terrain' | 'transport';

const mapLayers = {
  standard: {
    name: 'STANDARD',
    url: (lat: number, lon: number) => `https://www.openstreetmap.org/export/embed.html?bbox=${lon-0.01},${lat-0.01},${lon+0.01},${lat+0.01}&layer=mapnik&marker=${lat},${lon}`
  },
  satellite: {
    name: 'CYCLING',
    url: (lat: number, lon: number) => `https://www.openstreetmap.org/export/embed.html?bbox=${lon-0.01},${lat-0.01},${lon+0.01},${lat+0.01}&layer=cyclemap&marker=${lat},${lon}`
  },
  terrain: {
    name: 'HUMANITARIAN', 
    url: (lat: number, lon: number) => `https://www.openstreetmap.org/export/embed.html?bbox=${lon-0.01},${lat-0.01},${lon+0.01},${lat+0.01}&layer=hot&marker=${lat},${lon}`
  },
  transport: {
    name: 'TRANSPORT',
    url: (lat: number, lon: number) => `https://www.openstreetmap.org/export/embed.html?bbox=${lon-0.01},${lat-0.01},${lon+0.01},${lat+0.01}&layer=transportmap&marker=${lat},${lon}`
  }
};

interface MapWidgetProps {
  settings?: Record<string, any>;
  widgetName?: string;
  widgetInstanceId?: string;
  onSettingsUpdate?: (newSettings: Record<string, any>) => void;
}

const MapWidget: React.FC<MapWidgetProps> = ({ settings, widgetName, widgetInstanceId, onSettingsUpdate }) => {
  const { location: contextLocation, autoFollow, setAutoFollow, getCurrentLocation, status, lastUpdate, refreshLocation, searchLocations } = useLocation();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  // Display location can be different from the tracked location when user searches or manually selects
  const [displayLocation, setDisplayLocation] = useState({ latitude: 37.7749, longitude: -122.4194 });
  const [loading, setLoading] = useState(false);
  const [activeLayer, setActiveLayer] = useState<MapLayer>(settings?.defaultLayer || 'standard');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  // Search function using the location service
  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setSearchLoading(true);
    try {
      const results = await searchLocations(query, 8);
      setSearchResults(results);
      setShowSearchResults(true);
    } catch (error) {
      console.error('Search failed:', error);
      toast({
        title: "Search Failed",
        description: "Could not search for locations. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSearchLoading(false);
    }
  }, [searchLocations, toast]);

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      performSearch(searchQuery);
    }, 500);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, performSearch]);

  useEffect(() => {
    if (contextLocation && autoFollow) {
      setDisplayLocation({
        latitude: contextLocation.latitude,
        longitude: contextLocation.longitude,
      });
    }
  }, [contextLocation, autoFollow]);

  useEffect(() => {
    if (contextLocation) {
      setDisplayLocation({
        latitude: contextLocation.latitude,
        longitude: contextLocation.longitude,
      });
    }
  }, [contextLocation]);

  const handleGetCurrentLocation = async () => {
    setLoading(true);
    try {
      const currentLocation = await getCurrentLocation();
      setDisplayLocation({
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
      });
      setAutoFollow(true);
    } catch (error) {
      console.error('Failed to get current location:', error);
      toast({
        title: "Location Error",
        description: "Could not get your current location. Please check permissions.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleAutoFollow = () => {
    setAutoFollow(!autoFollow);
  };

  const handleSearchResultSelect = (result: SearchResult) => {
    const newLocation = { latitude: result.lat, longitude: result.lon };
    setDisplayLocation(newLocation);
    setAutoFollow(false);
    setShowSearchResults(false);
    setSearchQuery('');
    
    toast({
      title: "Location Selected",
      description: result.formatted_name,
    });
  };

  const mapUrl = mapLayers[activeLayer].url(displayLocation.latitude, displayLocation.longitude);

  const settingsGear = (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setShowSettings(true)}
      className={`opacity-70 hover:opacity-100 ${isMobile ? 'p-2 h-8 w-8' : 'p-1 h-6 w-6'}`}
    >
      <Settings className={isMobile ? 'h-4 w-4' : 'h-3 w-3'} />
    </Button>
  );

  return (
    <>
      <StandardWidgetTemplate
        icon={<Map size={isMobile ? 16 : 20} />}
        title="TACTICAL MAP SYSTEM"
        controls={settingsGear}
      >
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Controls Bar */}
          <div className={`flex-shrink-0 bg-card/50 border-b border-border ${isMobile ? 'p-3' : 'p-4'}`}>
            {/* Location Status Bar - Top Right */}
            <div className={`absolute z-20 ${isMobile ? 'top-2 right-2' : 'top-2 right-4'}`}>
              <LocationStatusBar
                location={contextLocation}
                status={status}
                lastUpdate={lastUpdate || undefined}
                onRefresh={refreshLocation}
                compact={!isMobile}
                loading={loading}
              />
            </div>
            
            <div className={`flex ${isMobile ? 'flex-col gap-3' : 'items-center justify-between'}`}>
              {/* Search Bar */}
              <div className="relative flex-1 max-w-md">
                <Input
                  placeholder="Search location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-9 text-sm font-mono bg-background/50 border-border placeholder:text-muted-foreground/70"
                  disabled={searchLoading}
                />
                {searchLoading && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
                
                {/* Search Results */}
                {showSearchResults && searchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-md shadow-lg z-50 max-h-32 overflow-y-auto">
                    {searchResults.map((result, index) => (
                      <button
                        key={index}
                        onClick={() => handleSearchResultSelect(result)}
                        className="w-full px-3 py-2 text-left text-sm font-mono hover:bg-accent/10 border-b border-border/50 last:border-b-0"
                      >
                        <div className="truncate">{result.formatted_name}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {result.lat.toFixed(4)}, {result.lon.toFixed(4)}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              <div className={`flex items-center gap-2 ${isMobile ? 'w-full justify-between' : ''}`}>
                <Button
                  onClick={toggleAutoFollow}
                  variant={autoFollow ? "default" : "outline"}
                  size="sm"
                  className={`font-mono ${isMobile ? 'flex-1 h-9 text-xs' : 'h-8 px-3 text-xs'}`}
                >
                  {autoFollow ? '🎯 FOLLOW' : '📍 MANUAL'}
                </Button>
                <Button 
                  onClick={handleGetCurrentLocation} 
                  disabled={loading}
                  variant="ghost"
                  size="sm"
                  className={`font-mono bg-background/50 hover:bg-primary/20 ${isMobile ? 'flex-1 h-9 text-xs' : 'h-8 px-3 text-xs'}`}
                >
                  {loading ? 'GPS...' : '📍 LOCATE'}
                </Button>
              </div>
            </div>
          </div>
          
          {/* Map Area */}
          <div className="flex-1 relative w-full overflow-hidden">
            <iframe
              key={`${activeLayer}-${displayLocation.latitude}-${displayLocation.longitude}`}
              src={mapUrl}
              className="absolute inset-0 w-full h-full border-0"
              style={{ 
                filter: 'sepia(1) hue-rotate(85deg) saturate(0.8) brightness(0.7) contrast(1.3)',
                background: 'hsl(var(--background))'
              }}
              title="Tactical Map"
              allowFullScreen
            />
            
            {/* Overlay UI Elements */}
            <div className="absolute inset-0 pointer-events-none z-10">
              {/* Layer Selector - Bottom Right */}
              <div className={`absolute pointer-events-auto ${isMobile ? 'bottom-2 right-2' : 'bottom-3 right-3'}`}>
                <div className="bg-background/95 border border-border rounded px-2 md:px-3 py-2 backdrop-blur-sm">
                  <div className="text-xs font-mono text-muted-foreground mb-2">
                    {isMobile ? 'LAYER' : 'MAP LAYER'}
                  </div>
                  <Select value={activeLayer} onValueChange={(value: MapLayer) => setActiveLayer(value)}>
                    <SelectTrigger className={`bg-background/50 border-border text-xs font-mono ${isMobile ? 'w-24 h-9' : 'w-32 h-8'}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-background border-border">
                      {Object.entries(mapLayers).map(([key, layer]) => (
                        <SelectItem key={key} value={key} className="font-mono text-xs">
                          {layer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Bottom Status Bar */}
              <div className={`absolute ${isMobile ? 'bottom-2 left-2' : 'bottom-3 left-3'}`}>
                <div className="bg-background/95 border border-border rounded px-2 md:px-3 py-2 backdrop-blur-sm">
                  <div className={`font-mono text-primary space-y-1 ${isMobile ? 'text-xs' : 'text-xs'}`}>
                    <div>LAT: {displayLocation.latitude.toFixed(isMobile ? 4 : 6)}</div>
                    <div>LON: {displayLocation.longitude.toFixed(isMobile ? 4 : 6)}</div>
                  </div>
                </div>
              </div>
              
              {/* Mode Status - Bottom Center (Desktop Only) */}
              {contextLocation && !isMobile && (
                <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2">
                  <div className={`border rounded px-3 py-2 backdrop-blur-sm ${
                    autoFollow 
                      ? 'bg-primary/20 border-primary text-primary animate-pulse' 
                      : 'bg-background/95 border-border text-muted-foreground'
                  }`}>
                    <div className="text-xs font-mono font-bold text-center">
                      {autoFollow ? 'AUTO-TRACKING ACTIVE' : 'MANUAL MODE'}
                    </div>
                  </div>
                </div>
              )}

              {/* Crosshairs */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative">
                  <div className={`bg-primary absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 ${isMobile ? 'w-6 h-0.5' : 'w-8 h-0.5'}`}></div>
                  <div className={`bg-primary absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 ${isMobile ? 'h-6 w-0.5' : 'h-8 w-0.5'}`}></div>
                  <div className={`border-2 border-primary rounded-full absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 ${isMobile ? 'w-5 h-5' : 'w-6 h-6'} ${autoFollow ? 'animate-pulse' : ''}`}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </StandardWidgetTemplate>
      
      {showSettings && (
        <MapWidgetSettings
          settings={settings || {}}
          onSettingsChange={(newSettings) => {
            onSettingsUpdate?.(newSettings);
            setShowSettings(false);
          }}
          onClose={() => setShowSettings(false)}
        />
      )}
    </>
  );
};

export default MapWidget;
