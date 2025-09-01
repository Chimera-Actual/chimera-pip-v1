import { useState, useCallback, useRef } from 'react';
import { useLocation } from '@/contexts/LocationContext';

export interface Placemark {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  description?: string;
  visible: boolean;
}

export type MapLayer = 'standard' | 'satellite' | 'terrain' | 'transport';

export interface MapboxState {
  center: [number, number];
  zoom: number;
  layer: MapLayer;
  placemarks: Placemark[];
  activeSearch: string;
  searchResults: Array<{
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    display_name: string;
  }>;
  isSearching: boolean;
  showCenterpoint: boolean;
  followUser: boolean;
  bearing: number;
  pitch: number;
}

const mapboxStyles = {
  standard: 'mapbox://styles/mapbox/streets-v12',
  satellite: 'mapbox://styles/mapbox/satellite-v9',
  terrain: 'mapbox://styles/mapbox/outdoors-v12',
  transport: 'mapbox://styles/mapbox/navigation-day-v1'
};

export const useMapboxState = (initialSettings?: any) => {
  const { location, getCurrentLocation, autoFollow, setAutoFollow } = useLocation();
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [mapState, setMapState] = useState<MapboxState>({
    center: location ? [location.longitude, location.latitude] : [-122.4194, 37.7749], // Mapbox uses lng, lat
    zoom: initialSettings?.defaultZoom || 10,
    layer: initialSettings?.defaultLayer || 'standard',
    placemarks: initialSettings?.placemarks || [],
    activeSearch: '',
    searchResults: [],
    isSearching: false,
    showCenterpoint: true,
    followUser: autoFollow,
    bearing: 0,
    pitch: 0
  });

  const updateCenter = useCallback((center: [number, number]) => {
    setMapState(prev => ({ ...prev, center }));
  }, []);

  const updateZoom = useCallback((zoom: number) => {
    setMapState(prev => ({ ...prev, zoom }));
  }, []);

  const updateLayer = useCallback((layer: MapLayer) => {
    setMapState(prev => ({ ...prev, layer }));
  }, []);

  const updateBearing = useCallback((bearing: number) => {
    setMapState(prev => ({ ...prev, bearing }));
  }, []);

  const updatePitch = useCallback((pitch: number) => {
    setMapState(prev => ({ ...prev, pitch }));
  }, []);

  const addPlacemark = useCallback((placemark: Omit<Placemark, 'id' | 'visible'>) => {
    const newPlacemark: Placemark = {
      ...placemark,
      id: `placemark-${Date.now()}`,
      visible: true
    };
    setMapState(prev => ({
      ...prev,
      placemarks: [...prev.placemarks, newPlacemark]
    }));
    return newPlacemark.id;
  }, []);

  const removePlacemark = useCallback((id: string) => {
    setMapState(prev => ({
      ...prev,
      placemarks: prev.placemarks.filter(p => p.id !== id)
    }));
  }, []);

  const togglePlacemarkVisibility = useCallback((id: string) => {
    setMapState(prev => ({
      ...prev,
      placemarks: prev.placemarks.map(p => 
        p.id === id ? { ...p, visible: !p.visible } : p
      )
    }));
  }, []);

  const updatePlacemark = useCallback((id: string, updates: Partial<Placemark>) => {
    setMapState(prev => ({
      ...prev,
      placemarks: prev.placemarks.map(p => 
        p.id === id ? { ...p, ...updates } : p
      )
    }));
  }, []);

  const searchLocations = useCallback(async (query: string, mapboxToken?: string) => {
    if (!query.trim()) {
      setMapState(prev => ({ ...prev, activeSearch: '', searchResults: [], isSearching: false }));
      return;
    }

    setMapState(prev => ({ ...prev, activeSearch: query, isSearching: true }));

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        let results = [];
        
        // Try Mapbox Geocoding if token is available
        if (mapboxToken) {
          const response = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${mapboxToken}&limit=5`
          );
          
          if (response.ok) {
            const data = await response.json();
            results = data.features.map((feature: any, index: number) => ({
              id: feature.id || index.toString(),
              name: feature.text || feature.place_name.split(',')[0],
              latitude: feature.center[1],
              longitude: feature.center[0],
              display_name: feature.place_name
            }));
          }
        }
        
        // Fallback to Nominatim if Mapbox fails or no token
        if (results.length === 0) {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`
          );
          const data = await response.json();
          
          results = data.map((result: any) => ({
            id: result.place_id.toString(),
            name: result.display_name.split(',')[0],
            latitude: parseFloat(result.lat),
            longitude: parseFloat(result.lon),
            display_name: result.display_name
          }));
        }

        setMapState(prev => ({
          ...prev,
          searchResults: results,
          isSearching: false
        }));
      } catch (error) {
        console.error('Search error:', error);
        setMapState(prev => ({
          ...prev,
          searchResults: [],
          isSearching: false
        }));
      }
    }, 300);
  }, []);

  const clearSearch = useCallback(() => {
    setMapState(prev => ({
      ...prev,
      activeSearch: '',
      searchResults: [],
      isSearching: false
    }));
  }, []);

  const navigateToLocation = useCallback((lng: number, lat: number, zoom?: number) => {
    setMapState(prev => ({
      ...prev,
      center: [lng, lat],
      zoom: zoom || prev.zoom
    }));
  }, []);

  const toggleFollowUser = useCallback(() => {
    const newValue = !mapState.followUser;
    setMapState(prev => ({ ...prev, followUser: newValue }));
    setAutoFollow(newValue);
    if (newValue && location) {
      navigateToLocation(location.longitude, location.latitude);
    }
  }, [mapState.followUser, setAutoFollow, location, navigateToLocation]);

  const centerOnUser = useCallback(async () => {
    try {
      await getCurrentLocation();
      if (location) {
        navigateToLocation(location.longitude, location.latitude);
      }
    } catch (error) {
      console.error('Failed to center on user:', error);
    }
  }, [getCurrentLocation, location, navigateToLocation]);

  const getMapStyle = useCallback((layer: MapLayer) => {
    return mapboxStyles[layer];
  }, []);

  return {
    mapState,
    updateCenter,
    updateZoom,
    updateLayer,
    updateBearing,
    updatePitch,
    addPlacemark,
    removePlacemark,
    togglePlacemarkVisibility,
    updatePlacemark,
    searchLocations,
    clearSearch,
    navigateToLocation,
    toggleFollowUser,
    centerOnUser,
    getMapStyle
  };
};