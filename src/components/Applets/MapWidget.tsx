import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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

export const MapWidget: React.FC = () => {
  const [location, setLocation] = useState<LocationData>({ latitude: 37.7749, longitude: -122.4194 });
  const [userLocation, setUserLocation] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeLayer, setActiveLayer] = useState<MapLayer>('standard');

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
        setLoading(false);
      },
      () => {
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const mapUrl = mapLayers[activeLayer].url(location.latitude, location.longitude);

  return (
    <div className="w-full h-full flex flex-col overflow-hidden p-3 md:p-4">
      {/* Header Controls */}
      <div className="flex-shrink-0 h-16 bg-card border-b border-border px-4 flex items-center justify-between">
        <span className="text-lg font-mono text-primary uppercase tracking-wider crt-glow">
          ◈ TACTICAL MAP SYSTEM
        </span>
        <div className="flex items-center gap-4">
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
          {/* Top Status Bar */}
          <div className="absolute top-3 left-3 right-3 flex justify-between">
            <div className="bg-background/95 border border-border rounded px-3 py-2 backdrop-blur-sm">
              <div className="text-xs font-mono text-primary space-y-1">
                <div>LAT: {location.latitude.toFixed(6)}</div>
                <div>LON: {location.longitude.toFixed(6)}</div>
              </div>
            </div>
            
            {userLocation && (
              <div className="bg-primary/20 border border-primary rounded px-3 py-2 backdrop-blur-sm">
                <div className="text-xs font-mono text-primary font-bold animate-pulse">
                  USER POSITION LOCKED
                </div>
              </div>
            )}
          </div>

          {/* Crosshairs */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative">
              <div className="w-8 h-0.5 bg-primary absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
              <div className="h-8 w-0.5 bg-primary absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
              <div className="w-6 h-6 border-2 border-primary rounded-full absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse"></div>
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