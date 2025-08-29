import { useEffect, useRef, useCallback } from 'react';
import { useUserSettings, UserSettings } from './useUserSettings';
import { toast } from 'sonner';

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: number;
}

export const useLocationService = () => {
  const { settings, updateSettings } = useUserSettings();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const lastLocationRef = useRef<LocationData | null>(null);

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

  const reverseGeocode = useCallback(async (lat: number, lng: number): Promise<string | null> => {
    try {
      // Using a simple reverse geocoding approach with OpenStreetMap Nominatim
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`
      );
      
      if (!response.ok) {
        throw new Error('Geocoding request failed');
      }
      
      const data = await response.json();
      
      // Extract a readable location name
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

  const updateLocationData = useCallback(async (locationData: LocationData) => {
    if (!settings) return;
    
    try {
      // Check if location has changed significantly (more than ~100 meters)
      const hasLocationChanged = !lastLocationRef.current ||
        Math.abs(lastLocationRef.current.latitude - locationData.latitude) > 0.001 ||
        Math.abs(lastLocationRef.current.longitude - locationData.longitude) > 0.001;

      let locationName = settings.location_name;
      
      // Only reverse geocode if location changed significantly
      if (hasLocationChanged) {
        locationName = await reverseGeocode(locationData.latitude, locationData.longitude);
      }

      // Update settings with new location data
      await updateSettings({
        location_latitude: locationData.latitude,
        location_longitude: locationData.longitude,
        location_name: locationName || settings.location_name,
      });

      lastLocationRef.current = locationData;

      // Only show toast for significant location changes
      if (hasLocationChanged && locationName) {
        toast.success(`Location updated: ${locationName}`);
      }

    } catch (error) {
      console.error('Failed to update location data:', error);
    }
  }, [settings, updateSettings, reverseGeocode]);

  const pollLocation = useCallback(async () => {
    try {
      const locationData = await getCurrentLocation();
      await updateLocationData(locationData);
    } catch (error) {
      console.error('Location polling error:', error);
      
      // Show error toast only occasionally to avoid spam
      if (Math.random() < 0.1) { // Show error 10% of the time
        toast.error('Failed to update location');
      }
    }
  }, [getCurrentLocation, updateLocationData]);

  const startLocationService = useCallback(async () => {
    if (!settings) return;
    
    console.log('Starting location service...');

    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    try {
      // Get initial location
      await pollLocation();

      // Set up polling interval (15 seconds)
      intervalRef.current = setInterval(() => {
        pollLocation();
      }, 15000);

      toast.success('Location tracking started');
    } catch (error) {
      console.error('Failed to start location service:', error);
      toast.error('Failed to start location tracking');
    }
  }, [settings, pollLocation]);

  const stopLocationService = useCallback(() => {
    console.log('Stopping location service...');

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    toast.info('Location tracking stopped');
  }, []);

  // Effect to start/stop location service based on settings
  useEffect(() => {
    if (settings?.location_enabled) {
      startLocationService();
    } else {
      stopLocationService();
    }

    // Cleanup on unmount
    return () => {
      stopLocationService();
    };
  }, [settings?.location_enabled, startLocationService, stopLocationService]);

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  // Return early if settings are not loaded yet, but after all hooks are called
  if (!settings) {
    return {
      isLocationEnabled: false,
      currentLocation: null,
      startLocationService: () => {},
      stopLocationService: () => {},
    };
  }

  return {
    isLocationEnabled: settings.location_enabled,
    currentLocation: {
      latitude: settings.location_latitude,
      longitude: settings.location_longitude,
      name: settings.location_name,
    },
    startLocationService,
    stopLocationService,
  };
};