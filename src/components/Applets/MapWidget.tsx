import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LocationStatusBar } from '@/components/ui/location-status-bar';
import { useLocation } from '@/contexts/LocationContext';
import { useToast } from '@/components/ui/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';

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

export const MapWidget: React.FC<MapWidgetProps> = ({ settings, widgetName, widgetInstanceId, onSettingsUpdate }) => {
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

  // Debounced search
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

  // Update display location when context location changes and auto-follow is enabled
  useEffect(() => {
    if (contextLocation && autoFollow) {
      setDisplayLocation({
        latitude: contextLocation.latitude,
        longitude: contextLocation.longitude,
      });
    }
  }, [contextLocation, autoFollow]);

  // Initialize display location from context on mount
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
      setAutoFollow(true); // Enable auto-follow when manually getting location
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
    setAutoFollow(false); // Disable auto-follow when manually selecting location
    setShowSearchResults(false);
    setSearchQuery('');
    
    toast({
      title: "Location Selected",
      description: result.formatted_name,
    });
  };

  const mapUrl = mapLayers[activeLayer].url(displayLocation.latitude, displayLocation.longitude);

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      {/* Header Controls */}
      <div className={`flex-shrink-0 bg-card border-b border-border px-3 md:px-4 py-2 relative ${
        isMobile ? 'h-auto min-h-24' : 'h-20'
      }`}>
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
          <span className={`font-mono text-primary uppercase tracking-wider crt-glow ${
            isMobile ? 'text-sm' : 'text-lg'
          }`}>
            ◈ TACTICAL MAP SYSTEM
          </span>
          
          {/* Search Bar - Mobile Priority */}
          {isMobile && (
            <div className="relative w-full">
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
              
              {/* Mobile Search Results */}
              {showSearchResults && searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-md shadow-lg z-50 max-h-32 overflow-y-auto">
                  {searchResults.map((result, index) => (
                    <button
                      key={index}
                      onClick={() => handleSearchResultSelect(result)}
                      className="w-full px-3 py-2 text-left text-sm font-mono hover:bg-accent/10 border-b border-border/50 last:border-b-0 touch-target"
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
          )}
          
          <div className={`flex items-center gap-2 ${isMobile ? 'w-full justify-between' : 'gap-3 mt-6'}`}>
            <Button
              onClick={toggleAutoFollow}
              variant={autoFollow ? "default" : "outline"}
              size={isMobile ? "default" : "sm"}
              className={`font-mono touch-target ${
                isMobile ? 'flex-1 h-9 text-xs' : 'h-8 px-3 text-xs'
              }`}
            >
              {autoFollow ? '🎯 FOLLOW' : '📍 MANUAL'}
            </Button>
            <Button 
              onClick={handleGetCurrentLocation} 
              disabled={loading}
              variant="ghost"
              size={isMobile ? "default" : "sm"}
              className={`font-mono bg-background/50 hover:bg-primary/20 touch-target ${
                isMobile ? 'flex-1 h-9 text-xs' : 'h-8 px-3 text-xs'
              }`}
            >
              {loading ? 'GPS...' : '📍 LOCATE'}
            </Button>
          </div>
        </div>
        
      </div>
      
      {/* Main Map Area - Fill all remaining space */}
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
          <div className={`absolute pointer-events-auto ${
            isMobile ? 'bottom-2 right-2' : 'bottom-3 right-3'
          }`}>
            <div className="bg-background/95 border border-border rounded px-2 md:px-3 py-2 backdrop-blur-sm">
              <div className="text-xs font-mono text-muted-foreground mb-2">
                {isMobile ? 'LAYER' : 'MAP LAYER'}
              </div>
              <Select value={activeLayer} onValueChange={(value: MapLayer) => setActiveLayer(value)}>
                <SelectTrigger className={`bg-background/50 border-border text-xs font-mono touch-target ${
                  isMobile ? 'w-24 h-9' : 'w-32 h-8'
                }`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background border-border">
                  {Object.entries(mapLayers).map(([key, layer]) => (
                    <SelectItem key={key} value={key} className="font-mono text-xs touch-target">
                      {layer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Bottom Status Bar */}
          <div className={`absolute ${
            isMobile ? 'bottom-2 left-2' : 'bottom-3 left-3'
          }`}>
            <div className="bg-background/95 border border-border rounded px-2 md:px-3 py-2 backdrop-blur-sm">
              <div className={`font-mono text-primary space-y-1 ${isMobile ? 'text-xs' : 'text-xs'}`}>
                <div>LAT: {displayLocation.latitude.toFixed(isMobile ? 4 : 6)}</div>
                <div>LON: {displayLocation.longitude.toFixed(isMobile ? 4 : 6)}</div>
                {contextLocation?.name && !isMobile && (
                  <div className="text-xs text-muted-foreground">
                    📍 {contextLocation.name}
                  </div>
                )}
                {contextLocation && !isMobile && (
                  <div className="text-xs text-muted-foreground border-t border-border/50 pt-1 mt-1">
                    GPS: {contextLocation.latitude.toFixed(4)}, {contextLocation.longitude.toFixed(4)}
                  </div>
                )}
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
                <div className="text-xs font-mono text-center">
                  Status: {status.toUpperCase()}
                </div>
              </div>
            </div>
          )}

          {/* Crosshairs */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative">
              <div className={`bg-primary absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 ${
                isMobile ? 'w-6 h-0.5' : 'w-8 h-0.5'
              }`}></div>
              <div className={`bg-primary absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 ${
                isMobile ? 'h-6 w-0.5' : 'h-8 w-0.5'
              }`}></div>
              <div className={`border-2 border-primary rounded-full absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 ${
                isMobile ? 'w-5 h-5' : 'w-6 h-6'
              } ${autoFollow ? 'animate-pulse' : ''}`}></div>
            </div>
          </div>

          {/* Grid Overlay - Reduced on Mobile */}
          {!isMobile && (
            <div className="absolute inset-0 opacity-[0.03]">
              <div className="grid grid-cols-20 grid-rows-15 h-full">
                {Array.from({ length: 300 }, (_, i) => (
                  <div key={i} className="border border-primary"></div>
                ))}
              </div>
            </div>
          )}

          {/* Radar Sweep */}
          <div className={`absolute ${
            isMobile ? 'top-2 right-2 w-12 h-12' : 'top-4 right-4 w-16 h-16'
          }`}>
            <div className="relative w-full h-full border border-primary/40 rounded-full bg-background/20 backdrop-blur-sm">
              <div className="absolute inset-1 border border-primary/20 rounded-full"></div>
              <div className={`absolute top-1/2 left-1/2 bg-gradient-to-r from-primary to-transparent transform -translate-y-0.5 origin-left animate-spin ${
                isMobile ? 'w-4 h-0.5' : 'w-6 h-0.5'
              }`} style={{ animationDuration: '3s' }}></div>
              <div className="absolute top-1/2 left-1/2 w-1 h-1 bg-primary rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};