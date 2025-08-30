import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useUserSettings } from '@/hooks/useUserSettings';
import { locationService, LocationData, LocationStatus } from '@/lib/locationService';

interface LocationContextType {
  location: LocationData | null;
  status: LocationStatus;
  isLocationEnabled: boolean;
  autoFollow: boolean;
  setAutoFollow: (enabled: boolean) => void;
  getCurrentLocation: () => Promise<LocationData>;
  refreshLocation: () => Promise<void>;
  searchLocations: (query: string, limit?: number) => Promise<any[]>;
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

  // Subscribe to location service updates
  useEffect(() => {
    const unsubscribe = locationService.subscribe((newLocation, newStatus) => {
      setLocation(newLocation);
      setStatus(newStatus);
    });

    return unsubscribe;
  }, []);

  // Update location service when settings change
  useEffect(() => {
    if (!settings) return;

    console.log('Settings changed, updating location service:', {
      enabled: settings.location_enabled,
      hasCoordinates: !!(settings.location_latitude && settings.location_longitude),
      frequency: settings.location_polling_frequency
    });

    locationService.updateSettings({
      location_enabled: settings.location_enabled || false,
      location_latitude: settings.location_latitude,
      location_longitude: settings.location_longitude,
      location_name: settings.location_name,
      location_polling_frequency: settings.location_polling_frequency || 5,
    });

    // Only start the service if location is enabled
    if (settings.location_enabled) {
      locationService.startLocationService(updateSettings);
    } else {
      locationService.stopLocationService();
    }
  }, [
    settings?.location_enabled, 
    settings?.location_polling_frequency,
    updateSettings
  ]); // Removed latitude/longitude from dependencies to prevent cycling

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      locationService.stopLocationService();
    };
  }, []);

  const getCurrentLocation = useCallback(async () => {
    return await locationService.getCurrentLocation();
  }, []);

  const refreshLocation = useCallback(async () => {
    await locationService.refreshLocation(updateSettings);
  }, [updateSettings]);

  const searchLocations = useCallback(async (query: string, limit: number = 8) => {
    return await locationService.searchLocations(query, limit);
  }, []);

  const value: LocationContextType = {
    location,
    status,
    isLocationEnabled: settings?.location_enabled || false,
    autoFollow,
    setAutoFollow,
    getCurrentLocation,
    refreshLocation,
    searchLocations,
  };

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
};