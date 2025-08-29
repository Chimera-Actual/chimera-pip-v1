import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LocationStatusIndicator } from '@/components/ui/location-status-indicator';
import { useUserSettings } from '@/hooks/useUserSettings';
import { useAuth } from '@/hooks/useAuth';

interface LocationData {
  latitude: number;
  longitude: number;
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
  const { user } = useAuth();
  const { settings: userSettings } = useUserSettings();
  const [location, setLocation] = useState<LocationData>({ latitude: 37.7749, longitude: -122.4194 });
  const [userLocation, setUserLocation] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeLayer, setActiveLayer] = useState<MapLayer>('standard');
  const [autoFollow, setAutoFollow] = useState(true);

  // Update map location when user settings change (real-time location updates)
  useEffect(() => {
    if (userSettings?.location_enabled && 
        userSettings.location_latitude && 
        userSettings.location_longitude) {
      
      const newLocation = {
        latitude: userSettings.location_latitude,
        longitude: userSettings.location_longitude
      };
      
      // Only update if location actually changed significantly (> ~10 meters)
      const hasLocationChanged = !userLocation ||
        Math.abs(userLocation.latitude - newLocation.latitude) > 0.0001 ||
        Math.abs(userLocation.longitude - newLocation.longitude) > 0.0001;

      if (hasLocationChanged) {
        setUserLocation(newLocation);
        
        // Auto-follow: update map center if auto-follow is enabled
        if (autoFollow) {
          setLocation(newLocation);
        }
      }
    }
  }, [userSettings?.location_latitude, userSettings?.location_longitude, userSettings?.location_enabled, autoFollow]);

  // Initialize location on mount
  useEffect(() => {
    if (userSettings?.location_enabled && 
        userSettings.location_latitude && 
        userSettings.location_longitude) {
      const savedLocation = {
        latitude: userSettings.location_latitude,
        longitude: userSettings.location_longitude
      };
      setLocation(savedLocation);
      setUserLocation(savedLocation);
    }
  }, [userSettings?.location_enabled]);

  const getCurrentLocation = () => {
    setLoading(true);
    
    if (!navigator.geolocation) {
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        setUserLocation(newLocation);
        setLocation(newLocation);
        setAutoFollow(true); // Re-enable auto-follow when manually getting location
        setLoading(false);
      },
      () => {
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const toggleAutoFollow = () => {
    const newAutoFollow = !autoFollow;
    setAutoFollow(newAutoFollow);
    
    // If enabling auto-follow and we have a user location, center on it
    if (newAutoFollow && userLocation) {
      setLocation(userLocation);
    }
  };

  const mapUrl = mapLayers[activeLayer].url(location.latitude, location.longitude);

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      {/* Header Controls */}
      <div className="flex-shrink-0 h-16 bg-card border-b border-border px-4 flex items-center justify-between">
        <span className="text-lg font-mono text-primary uppercase tracking-wider crt-glow">
          ◈ TACTICAL MAP SYSTEM
        </span>
        <div className="flex items-center gap-4">
          <LocationStatusIndicator className="mr-2" />
          <Button
            onClick={toggleAutoFollow}
            variant={autoFollow ? "default" : "outline"}
            size="sm"
            className="h-10 px-3 text-xs font-mono"
          >
            {autoFollow ? '🎯 FOLLOW' : '📍 MANUAL'}
          </Button>
          <Select value={activeLayer} onValueChange={(value: MapLayer) => setActiveLayer(value)}>
            <SelectTrigger className="w-40 h-10 bg-background/50 border-border text-sm font-mono">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-background border-border">
              {Object.entries(mapLayers).map(([key, layer]) => (
                <SelectItem key={key} value={key} className="font-mono text-sm">
                  {layer.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button 
            onClick={getCurrentLocation} 
            disabled={loading}
            variant="ghost"
            size="sm"
            className="h-10 px-4 text-sm font-mono bg-background/50 hover:bg-primary/20"
          >
            {loading ? 'GPS...' : '📍 LOCATE'}
          </Button>
        </div>
      </div>
      
      {/* Main Map Area - Fill all remaining space */}
      <div className="flex-1 relative w-full overflow-hidden">
        <iframe
          key={`${activeLayer}-${location.latitude}-${location.longitude}`}
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
          {/* Bottom Status Bar */}
          <div className="absolute bottom-3 left-3">
            <div className="bg-background/95 border border-border rounded px-3 py-2 backdrop-blur-sm">
              <div className="text-xs font-mono text-primary space-y-1">
                <div>LAT: {location.latitude.toFixed(6)}</div>
                <div>LON: {location.longitude.toFixed(6)}</div>
                {userSettings?.location_name && (
                  <div className="text-xs text-muted-foreground">
                    {userSettings.location_name}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {userLocation && (
            <div className="absolute bottom-3 right-3">
              <div className={`border rounded px-3 py-2 backdrop-blur-sm ${
                autoFollow 
                  ? 'bg-primary/20 border-primary text-primary animate-pulse' 
                  : 'bg-background/95 border-border text-muted-foreground'
              }`}>
                <div className="text-xs font-mono font-bold">
                  {autoFollow ? 'AUTO-TRACKING ACTIVE' : 'USER POSITION LOCKED'}
                </div>
              </div>
            </div>
          )}

          {/* Crosshairs */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative">
              <div className="w-8 h-0.5 bg-primary absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
              <div className="h-8 w-0.5 bg-primary absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
              <div className={`w-6 h-6 border-2 border-primary rounded-full absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 ${autoFollow ? 'animate-pulse' : ''}`}></div>
            </div>
          </div>

          {/* Grid Overlay */}
          <div className="absolute inset-0 opacity-[0.03]">
            <div className="grid grid-cols-20 grid-rows-15 h-full">
              {Array.from({ length: 300 }, (_, i) => (
                <div key={i} className="border border-primary"></div>
              ))}
            </div>
          </div>

          {/* Radar Sweep */}
          <div className="absolute top-4 right-4 w-16 h-16">
            <div className="relative w-full h-full border border-primary/40 rounded-full bg-background/20 backdrop-blur-sm">
              <div className="absolute inset-1 border border-primary/20 rounded-full"></div>
              <div className="absolute top-1/2 left-1/2 w-6 h-0.5 bg-gradient-to-r from-primary to-transparent transform -translate-y-0.5 origin-left animate-spin" 
                   style={{ animationDuration: '3s' }}></div>
              <div className="absolute top-1/2 left-1/2 w-1 h-1 bg-primary rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};