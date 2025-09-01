import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Placemark, MapLayer } from '@/hooks/useMapboxState';
import { supabase } from '@/integrations/supabase/client';

interface MapboxRendererProps {
  center: [number, number]; // [lng, lat] for Mapbox
  zoom: number;
  bearing: number;
  pitch: number;
  mapStyle: string;
  placemarks: Placemark[];
  userLocation?: { latitude: number; longitude: number } | null;
  showCenterpoint: boolean;
  followUser: boolean;
  onCenterChange: (center: [number, number]) => void;
  onZoomChange: (zoom: number) => void;
  onBearingChange: (bearing: number) => void;
  onPitchChange: (pitch: number) => void;
  onPlacemarkClick?: (placemark: Placemark) => void;
  className?: string;
}

export const MapboxRenderer: React.FC<MapboxRendererProps> = ({
  center,
  zoom,
  bearing,
  pitch,
  mapStyle,
  placemarks,
  userLocation,
  showCenterpoint,
  followUser,
  onCenterChange,
  onZoomChange,
  onBearingChange,
  onPitchChange,
  onPlacemarkClick,
  className = ""
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapboxToken, setMapboxToken] = useState<string | null>(null);
  const userMarker = useRef<mapboxgl.Marker | null>(null);
  const placemarkMarkers = useRef<{ [key: string]: mapboxgl.Marker }>({});

  // Fetch Mapbox token on mount
  useEffect(() => {
    const fetchMapboxToken = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-mapbox-token');
        if (error) throw error;
        setMapboxToken(data.token);
      } catch (error) {
        console.error('Failed to fetch Mapbox token:', error);
      }
    };

    fetchMapboxToken();
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || !mapboxToken || map.current) return;

    mapboxgl.accessToken = mapboxToken;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: mapStyle,
      center: center,
      zoom: zoom,
      bearing: bearing,
      pitch: pitch,
      attributionControl: false
    });

    // Add event listeners
    map.current.on('load', () => {
      setMapLoaded(true);
    });

    map.current.on('moveend', () => {
      if (map.current) {
        const mapCenter = map.current.getCenter();
        onCenterChange([mapCenter.lng, mapCenter.lat]);
      }
    });

    map.current.on('zoomend', () => {
      if (map.current) {
        onZoomChange(map.current.getZoom());
      }
    });

    map.current.on('rotateend', () => {
      if (map.current) {
        onBearingChange(map.current.getBearing());
      }
    });

    map.current.on('pitchend', () => {
      if (map.current) {
        onPitchChange(map.current.getPitch());
      }
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [mapboxToken]);

  // Update map style
  useEffect(() => {
    if (map.current && mapLoaded) {
      map.current.setStyle(mapStyle);
    }
  }, [mapStyle, mapLoaded]);

  // Update map view when props change
  useEffect(() => {
    if (map.current && followUser) {
      map.current.easeTo({
        center: center,
        zoom: zoom,
        bearing: bearing,
        pitch: pitch,
        duration: 1000
      });
    }
  }, [center, zoom, bearing, pitch, followUser]);

  // Update user location marker
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    if (userMarker.current) {
      userMarker.current.remove();
      userMarker.current = null;
    }

    if (userLocation) {
      const el = document.createElement('div');
      el.className = 'user-location-marker';
      el.innerHTML = `
        <div class="relative w-6 h-6">
          <div class="absolute inset-0 bg-primary rounded-full border-2 border-background shadow-lg animate-pulse"></div>
          <div class="absolute inset-0 bg-primary/30 rounded-full animate-ping"></div>
        </div>
      `;

      userMarker.current = new mapboxgl.Marker(el)
        .setLngLat([userLocation.longitude, userLocation.latitude])
        .addTo(map.current);
    }
  }, [userLocation, mapLoaded]);

  // Update placemark markers
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Remove existing markers
    Object.values(placemarkMarkers.current).forEach(marker => {
      marker.remove();
    });
    placemarkMarkers.current = {};

    // Add visible placemarks
    placemarks
      .filter(placemark => placemark.visible)
      .forEach(placemark => {
        const el = document.createElement('div');
        el.className = 'placemark-marker cursor-pointer';
        el.innerHTML = `
          <div class="relative">
            <div class="w-8 h-8 bg-accent border-2 border-background rounded-full shadow-lg flex items-center justify-center">
              <div class="w-3 h-3 bg-background rounded-full"></div>
            </div>
            <div class="absolute -bottom-1 left-1/2 w-0 h-0 border-l-2 border-r-2 border-t-4 border-transparent border-t-accent -translate-x-1/2"></div>
          </div>
        `;

        el.addEventListener('click', () => {
          onPlacemarkClick?.(placemark);
        });

        const marker = new mapboxgl.Marker(el)
          .setLngLat([placemark.longitude, placemark.latitude])
          .addTo(map.current!);

        // Add popup
        const popup = new mapboxgl.Popup({ offset: 25 })
          .setHTML(`
            <div class="text-xs font-mono p-2">
              <div class="text-accent font-bold">◈ ${placemark.name}</div>
              ${placemark.description ? `<div class="text-muted-foreground mt-1">${placemark.description}</div>` : ''}
              <div class="text-muted-foreground mt-1">
                LAT: ${placemark.latitude.toFixed(6)}<br/>
                LNG: ${placemark.longitude.toFixed(6)}
              </div>
            </div>
          `);

        marker.setPopup(popup);
        placemarkMarkers.current[placemark.id] = marker;
      });
  }, [placemarks, mapLoaded, onPlacemarkClick]);

  if (!mapboxToken) {
    return (
      <div className={`relative w-full h-full ${className}`}>
        <div className="absolute inset-0 flex items-center justify-center bg-background border border-border rounded">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 bg-primary/20 rounded-full mx-auto flex items-center justify-center">
              <div className="w-6 h-6 bg-primary/50 rounded-full animate-pulse"></div>
            </div>
            <div className="font-mono text-primary text-sm">
              ◈ LOADING MAP TOKEN...
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative w-full h-full ${className}`}>
      <div 
        ref={mapContainer} 
        className="absolute inset-0 rounded"
        style={{
          filter: 'sepia(0.1) hue-rotate(calc(var(--theme-hue, 120) * 1deg)) saturate(0.9) brightness(0.95) contrast(1.1)'
        }}
      />
      
      {/* Centerpoint crosshairs */}
      {showCenterpoint && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10">
          <div className="relative w-8 h-8">
            <div className="absolute top-1/2 left-0 w-full h-px bg-primary shadow-lg -translate-y-px"></div>
            <div className="absolute left-1/2 top-0 h-full w-px bg-primary shadow-lg -translate-x-px"></div>
            <div className="absolute top-1/2 left-1/2 w-1 h-1 bg-primary rounded-full -translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute top-1/2 left-1/2 w-6 h-6 border border-primary/50 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
          </div>
        </div>
      )}

      {/* Loading overlay */}
      {!mapLoaded && (
        <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-20">
          <div className="text-center space-y-2">
            <div className="w-8 h-8 bg-primary/30 rounded-full mx-auto animate-pulse"></div>
            <div className="font-mono text-primary text-xs">◈ LOADING MAP...</div>
          </div>
        </div>
      )}
    </div>
  );
};