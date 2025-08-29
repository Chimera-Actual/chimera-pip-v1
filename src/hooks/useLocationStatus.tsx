import { useState, useEffect, useRef } from 'react';
import { useUserSettings } from './useUserSettings';

export type LocationStatus = 'active' | 'inactive' | 'error' | 'loading';

export const useLocationStatus = () => {
  const { settings } = useUserSettings();
  const [status, setStatus] = useState<LocationStatus>('inactive');
  const lastLocationRef = useRef<{ lat?: number; lng?: number }>({});
  const lastUpdateRef = useRef<number>(Date.now());

  useEffect(() => {
    if (!settings) {
      setStatus('inactive');
      return;
    }

    if (!settings.location_enabled) {
      setStatus('inactive');
      return;
    }

    if (!settings.location_latitude || !settings.location_longitude) {
      setStatus('loading');
      return;
    }

    // Check if location coordinates have changed (indicating new data)
    const currentLocation = {
      lat: settings.location_latitude,
      lng: settings.location_longitude,
    };

    const hasLocationChanged = 
      lastLocationRef.current.lat !== currentLocation.lat ||
      lastLocationRef.current.lng !== currentLocation.lng;

    if (hasLocationChanged) {
      lastLocationRef.current = currentLocation;
      lastUpdateRef.current = Date.now();
      setStatus('active');
      return;
    }

    // Check how long since last update
    const now = Date.now();
    const timeSinceUpdate = now - lastUpdateRef.current;

    if (timeSinceUpdate < 45000) { // 45 seconds - fresh data
      setStatus('active');
    } else if (timeSinceUpdate < 120000) { // 2 minutes - getting stale
      setStatus('loading');
    } else {
      setStatus('error'); // Too old
    }

  }, [settings]);

  return {
    status,
    isLocationEnabled: settings?.location_enabled || false,
    hasLocationData: !!(settings?.location_latitude && settings?.location_longitude),
    locationName: settings?.location_name,
  };
};