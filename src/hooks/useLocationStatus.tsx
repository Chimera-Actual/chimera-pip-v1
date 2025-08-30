import { useLocation } from '@/contexts/LocationContext';
import { locationService } from '@/lib/locationService';

export type LocationStatus = 'active' | 'inactive' | 'error' | 'loading';

export const useLocationStatus = () => {
  const { status, isLocationEnabled, location } = useLocation();

  return {
    status,
    isLocationEnabled,
    hasLocationData: !!location,
    locationName: location?.name,
  };
};