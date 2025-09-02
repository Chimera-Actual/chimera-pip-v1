import { useState, useCallback, useRef, useEffect } from 'react';
import { useLocation } from '@/contexts/LocationContext';
import { logger } from '@/lib/logger';

export interface Placemark {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  description?: string;
  visible: boolean;
}

export type MapLayer = 'standard' | 'satellite' | 'terrain' | 'transport';

export interface MapState {
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
}

export const useMapState = (config?: { 
  defaultLayer?: MapLayer; 
  defaultZoom?: number; 
  placemarks?: Placemark[]; 
  widgetInstanceId?: string;
}) => {
  const { location, getCurrentLocation, autoFollow, setAutoFollow } = useLocation();
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load initial state from localStorage if widgetInstanceId is provided
  const getInitialState = (): MapState => {
    const defaultState: MapState = {
      center: location ? [location.longitude, location.latitude] : [-122.4194, 37.7749],
      zoom: config?.defaultZoom || 10,
      layer: config?.defaultLayer || 'standard',
      placemarks: config?.placemarks || [],
      activeSearch: '',
      searchResults: [],
      isSearching: false,
      showCenterpoint: true,
      followUser: autoFollow
    };

    if (!config?.widgetInstanceId) return defaultState;

    try {
      const saved = localStorage.getItem(`widget-${config.widgetInstanceId}-mapState`);
      if (saved) {
        const savedState = JSON.parse(saved);
        return {
          ...defaultState,
          center: savedState.center || defaultState.center,
          zoom: savedState.zoom || defaultState.zoom,
          layer: savedState.layer || defaultState.layer,
          placemarks: savedState.placemarks || defaultState.placemarks,
          showCenterpoint: savedState.showCenterpoint !== undefined ? savedState.showCenterpoint : defaultState.showCenterpoint,
          followUser: savedState.followUser !== undefined ? savedState.followUser : defaultState.followUser
        };
      }
    } catch (error) {
      logger.warn('Failed to load map state from localStorage', error, 'MapState');
    }

    return defaultState;
  };

  const [mapState, setMapState] = useState<MapState>(getInitialState);

  // Save state to localStorage when it changes
  useEffect(() => {
    if (!config?.widgetInstanceId) return;
    
    const stateToSave = {
      center: mapState.center,
      zoom: mapState.zoom,
      layer: mapState.layer,
      placemarks: mapState.placemarks,
      showCenterpoint: mapState.showCenterpoint,
      followUser: mapState.followUser
    };
    
    try {
      localStorage.setItem(`widget-${config.widgetInstanceId}-mapState`, JSON.stringify(stateToSave));
    } catch (error) {
      logger.warn('Failed to save map state to localStorage', error, 'MapState');
    }
  }, [mapState.center, mapState.zoom, mapState.layer, mapState.placemarks, mapState.showCenterpoint, mapState.followUser, config?.widgetInstanceId]);

  const updateCenter = useCallback((center: [number, number]) => {
    setMapState(prev => ({ ...prev, center }));
  }, []);

  const updateZoom = useCallback((zoom: number) => {
    setMapState(prev => ({ ...prev, zoom }));
  }, []);

  const updateLayer = useCallback((layer: MapLayer) => {
    setMapState(prev => ({ ...prev, layer }));
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

  const searchLocations = useCallback(async (query: string) => {
    if (!query.trim()) {
      setMapState(prev => ({ ...prev, activeSearch: '', searchResults: [], isSearching: false }));
      return;
    }

    setMapState(prev => ({ ...prev, activeSearch: query, isSearching: true }));

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Debounce search
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`
        );
        const results = await response.json();
        
        const formattedResults = results.map((result: any) => ({
          id: result.place_id.toString(),
          name: result.display_name.split(',')[0],
          latitude: parseFloat(result.lat),
          longitude: parseFloat(result.lon),
          display_name: result.display_name
        }));

        setMapState(prev => ({
          ...prev,
          searchResults: formattedResults,
          isSearching: false
        }));
      } catch (error) {
        logger.error('Search error', error, 'MapState');
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

  const navigateToLocation = useCallback((lat: number, lng: number, zoom?: number) => {
    setMapState(prev => ({
      ...prev,
      center: [lat, lng],
      zoom: zoom || prev.zoom
    }));
  }, []);

  const toggleFollowUser = useCallback(() => {
    const newValue = !mapState.followUser;
    setMapState(prev => ({ ...prev, followUser: newValue }));
    setAutoFollow(newValue);
    if (newValue && location) {
      navigateToLocation(location.latitude, location.longitude);
    }
  }, [mapState.followUser, setAutoFollow, location, navigateToLocation]);

  const centerOnUser = useCallback(async () => {
    try {
      await getCurrentLocation();
      if (location) {
        navigateToLocation(location.latitude, location.longitude);
      }
    } catch (error) {
      logger.error('Failed to center on user', error, 'MapState');
    }
  }, [getCurrentLocation, location, navigateToLocation]);

  return {
    mapState,
    updateCenter,
    updateZoom,
    updateLayer,
    addPlacemark,
    removePlacemark,
    togglePlacemarkVisibility,
    updatePlacemark,
    searchLocations,
    clearSearch,
    navigateToLocation,
    toggleFollowUser,
    centerOnUser
  };
};