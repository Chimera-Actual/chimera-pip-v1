import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useUserSettings } from '@/hooks/useUserSettings';
import { toast } from 'sonner';

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: number;
  name?: string;
}

export type LocationStatus = 'active' | 'inactive' | 'error' | 'loading';

interface LocationContextType {
  location: LocationData | null;
  status: LocationStatus;
  isLocationEnabled: boolean;
  autoFollow: boolean;
  setAutoFollow: (enabled: boolean) => void;
  getCurrentLocation: () => Promise<LocationData>;
  refreshLocation: () => Promise<void>;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};

interface LocationProviderProps {
  children: React.ReactNode;
}

export const LocationProvider: React.FC<LocationProviderProps> = ({ children }) => {
  const { settings, updateSettings } = useUserSettings();
  const [location, setLocation] = useState<LocationData | null>(null);
  const [status, setStatus] = useState<LocationStatus>('inactive');
  const [autoFollow, setAutoFollow] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastLocationRef = useRef<LocationData | null>(null);
  const lastUpdateRef = useRef<number>(Date.now());

  const reverseGeocode = useCallback(async (lat: number, lng: number): Promise<string | null> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`
      );
      
      if (!response.ok) {
        throw new Error('Geocoding request failed');
      }
      
      const data = await response.json();
      const address = data.address;
      
      if (address) {
        const parts = [];
        if (address.city) parts.push(address.city);
        else if (address.town) parts.push(address.town);
        else if (address.village) parts.push(address.village);
        
        if (address.state) parts.push(address.state);
        if (address.country) parts.push(address.country);
        
        return parts.join(', ') || data.display_name;
      }
      
      return data.display_name || null;
    } catch (error) {
      console.warn('Reverse geocoding failed:', error);
      return null;
    }
  }, []);

  const getCurrentLocation = useCallback((): Promise<LocationData> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const locationData: LocationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: Date.now(),
          };
          resolve(locationData);
        },
        (error) => {
          let errorMessage = 'Failed to get location';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location access denied by user';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information unavailable';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out';
              break;
          }
          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 5000,
        }
      );
    });
  }, []);

  const updateLocationData = useCallback(async (locationData: LocationData) => {
    if (!settings) return;
    
    try {
      // Check if location has changed significantly (more than ~100 meters)
      const hasLocationChanged = !lastLocationRef.current ||
        Math.abs(lastLocationRef.current.latitude - locationData.latitude) > 0.001 ||
        Math.abs(lastLocationRef.current.longitude - locationData.longitude) > 0.001;

      if (!hasLocationChanged) return;

      // Update local state immediately
      setLocation(locationData);
      setStatus('active');
      lastLocationRef.current = locationData;
      lastUpdateRef.current = Date.now();

      // Update settings with coordinates immediately
      await updateSettings({
        location_latitude: locationData.latitude,
        location_longitude: locationData.longitude,
        location_name: settings.location_name, // Keep existing name for now
      });

      // Try reverse geocoding in background (non-blocking)
      try {
        const locationName = await reverseGeocode(locationData.latitude, locationData.longitude);
        if (locationName) {
          const updatedLocationData = { ...locationData, name: locationName };
          setLocation(updatedLocationData);
          
          await updateSettings({
            location_latitude: locationData.latitude,
            location_longitude: locationData.longitude,
            location_name: locationName,
          });
        }
      } catch (geocodeError) {
        // Silently ignore geocoding errors - coordinates are already updated
        console.log('Reverse geocoding failed, continuing with coordinates only');
      }

    } catch (error) {
      console.error('Failed to update location data:', error);
      setStatus('error');
    }
  }, [settings, updateSettings, reverseGeocode]);

  const pollLocation = useCallback(async () => {
    if (!settings?.location_enabled) return;
    
    setStatus('loading');
    
    try {
      const locationData = await getCurrentLocation();
      await updateLocationData(locationData);
    } catch (error) {
      console.warn('Location polling failed:', error);
      
      // If we have stored location data, that's sufficient
      if (settings.location_latitude && settings.location_longitude) {
        setStatus('active');
        return;
      }
      
      setStatus('error');
      
      // Show error toast very rarely to avoid spam
      if (Math.random() < 0.01) {
        toast.error('Location services unavailable');
      }
    }
  }, [getCurrentLocation, updateLocationData, settings]);

  const refreshLocation = useCallback(async () => {
    await pollLocation();
  }, [pollLocation]);

  // Initialize location from settings
  useEffect(() => {
    if (settings?.location_latitude && settings?.location_longitude) {
      const locationData: LocationData = {
        latitude: settings.location_latitude,
        longitude: settings.location_longitude,
        timestamp: Date.now(),
        name: settings.location_name || undefined,
      };
      setLocation(locationData);
      lastLocationRef.current = locationData;
      
      if (settings.location_enabled) {
        setStatus('active');
      } else {
        setStatus('inactive');
      }
    }
  }, [settings]);

  // Manage location polling
  useEffect(() => {
    if (!settings) return;

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (settings.location_enabled) {
      // Get initial location
      pollLocation();

      // Set up polling interval
      const pollFrequency = (settings.location_polling_frequency || 5) * 60 * 1000;
      intervalRef.current = setInterval(pollLocation, pollFrequency);
    } else {
      setStatus('inactive');
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [settings?.location_enabled, settings?.location_polling_frequency, pollLocation]);

  // Status monitoring
  useEffect(() => {
    if (!settings?.location_enabled) {
      setStatus('inactive');
      return;
    }

    if (!location) {
      setStatus('loading');
      return;
    }

    // Check how long since last update
    const now = Date.now();
    const timeSinceUpdate = now - lastUpdateRef.current;

    if (timeSinceUpdate < 45000) {
      setStatus('active');
    } else if (timeSinceUpdate < 120000) {
      setStatus('loading');
    } else {
      setStatus('error');
    }
  }, [settings?.location_enabled, location]);

  const value: LocationContextType = {
    location,
    status,
    isLocationEnabled: settings?.location_enabled || false,
    autoFollow,
    setAutoFollow,
    getCurrentLocation,
    refreshLocation,
  };

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
};