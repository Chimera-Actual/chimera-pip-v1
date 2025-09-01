import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapLayer, Placemark } from '@/hooks/useMapState';

// Fix default markers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Create custom user location marker
const createUserMarker = () => {
  return L.divIcon({
    className: 'user-location-marker',
    html: `
      <div class="relative">
        <div class="w-4 h-4 bg-primary rounded-full border-2 border-background shadow-lg animate-pulse"></div>
        <div class="absolute top-1/2 left-1/2 w-8 h-8 bg-primary/30 rounded-full -translate-x-1/2 -translate-y-1/2 animate-ping"></div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  });
};

// Create custom placemark marker
const createPlacemarkMarker = (placemark: Placemark) => {
  return L.divIcon({
    className: 'placemark-marker',
    html: `
      <div class="relative">
        <div class="w-6 h-6 bg-accent border-2 border-background rounded-full shadow-lg flex items-center justify-center">
          <div class="w-2 h-2 bg-background rounded-full"></div>
        </div>
        <div class="absolute -bottom-1 left-1/2 w-0 h-0 border-l-2 border-r-2 border-t-4 border-transparent border-t-accent -translate-x-1/2"></div>
      </div>
    `,
    iconSize: [24, 32],
    iconAnchor: [12, 32],
    popupAnchor: [0, -32]
  });
};

const mapLayers: Record<MapLayer, string> = {
  standard: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  terrain: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
  transport: 'https://{s}.tile2.opencyclemap.org/transport/{z}/{x}/{y}.png'
};

interface MapEventsHandlerProps {
  onCenterChange: (center: [number, number]) => void;
  onZoomChange: (zoom: number) => void;
}

const MapEventsHandler: React.FC<MapEventsHandlerProps> = ({ onCenterChange, onZoomChange }) => {
  const map = useMapEvents({
    moveend: () => {
      const center = map.getCenter();
      onCenterChange([center.lat, center.lng]);
    },
    zoomend: () => {
      onZoomChange(map.getZoom());
    }
  });

  return null;
};

interface MapUpdaterProps {
  center: [number, number];
  zoom: number;
  followUser: boolean;
}

const MapUpdater: React.FC<MapUpdaterProps> = ({ center, zoom, followUser }) => {
  const map = useMap();

  useEffect(() => {
    if (followUser) {
      map.setView(center, zoom);
    }
  }, [map, center, zoom, followUser]);

  return null;
};

interface MapRendererProps {
  center: [number, number];
  zoom: number;
  layer: MapLayer;
  placemarks: Placemark[];
  userLocation?: { latitude: number; longitude: number } | null;
  showCenterpoint: boolean;
  followUser: boolean;
  onCenterChange: (center: [number, number]) => void;
  onZoomChange: (zoom: number) => void;
  onPlacemarkClick?: (placemark: Placemark) => void;
  className?: string;
}

export const MapRenderer: React.FC<MapRendererProps> = ({
  center,
  zoom,
  layer,
  placemarks,
  userLocation,
  showCenterpoint,
  followUser,
  onCenterChange,
  onZoomChange,
  onPlacemarkClick,
  className = ""
}) => {
  console.log('MapRenderer: Rendering with props:', { center, zoom, layer, followUser });

  // Temporary: Test without MapContainer to isolate the context error
  return (
    <div className={`relative w-full h-full ${className}`}>
      <div className="absolute inset-0 flex items-center justify-center bg-background border border-border rounded">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 bg-primary/20 rounded-full mx-auto flex items-center justify-center">
            <div className="w-6 h-6 bg-primary/50 rounded-full"></div>
          </div>
          <div className="font-mono text-primary text-sm">
            ◈ MAP RENDERER ISOLATED TEST
          </div>
          <div className="text-xs text-muted-foreground font-mono space-y-1">
            <div>Center: [{center[0].toFixed(4)}, {center[1].toFixed(4)}]</div>
            <div>Zoom: {zoom}</div>
            <div>Layer: {layer}</div>
            <div>User Location: {userLocation ? '✓' : '✗'}</div>
            <div>Follow User: {followUser ? '✓' : '✗'}</div>
            <div>Placemarks: {placemarks.length}</div>
          </div>
        </div>
      </div>

      {/* Test centerpoint overlay */}
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
    </div>
  );
};