import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Types
export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: number;
  name?: string;
}

export type LocationStatus = 'active' | 'inactive' | 'error' | 'loading';

export interface LocationSettings {
  location_enabled: boolean;
  location_latitude?: number;
  location_longitude?: number;
  location_name?: string;
  location_polling_frequency: number;
}

export interface SearchResult {
  lat: number;
  lon: number;
  display_name: string;
  formatted_name: string;
  type: string;
  importance: number;
}

// Location Service Class
export class LocationService {
  private static instance: LocationService;
  private intervalRef: NodeJS.Timeout | null = null;
  private watchIdRef: number | null = null;
  private lastLocationRef: LocationData | null = null;
  private lastUpdateRef: number = Date.now();
  private settings: LocationSettings | null = null;
  private listeners: Set<(location: LocationData | null, status: LocationStatus) => void> = new Set();

  private constructor() {}

  static getInstance(): LocationService {
    if (!LocationService.instance) {
      LocationService.instance = new LocationService();
    }
    return LocationService.instance;
  }

  // Event subscription
  subscribe(callback: (location: LocationData | null, status: LocationStatus) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notifyListeners(location: LocationData | null, status: LocationStatus) {
    this.listeners.forEach(callback => callback(location, status));
  }

  // Settings management
  updateSettings(newSettings: LocationSettings) {
    const wasEnabled = this.settings?.location_enabled;
    this.settings = newSettings;

    // Initialize location from settings if available
    if (newSettings.location_latitude && newSettings.location_longitude) {
      const locationData: LocationData = {
        latitude: newSettings.location_latitude,
        longitude: newSettings.location_longitude,
        timestamp: Date.now(),
        name: newSettings.location_name || undefined,
      };
      this.lastLocationRef = locationData;
      this.notifyListeners(locationData, newSettings.location_enabled ? 'active' : 'inactive');
    }

    // Start or stop service based on enabled state
    if (newSettings.location_enabled && !wasEnabled) {
      this.startLocationService();
    } else if (!newSettings.location_enabled && wasEnabled) {
      this.stopLocationService();
    } else if (newSettings.location_enabled && wasEnabled) {
      // Restart with new frequency if it changed
      this.restartLocationService();
    }
  }

  // Get current location from browser
  async getCurrentLocation(): Promise<LocationData> {
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
  }

  // Reverse geocoding
  async reverseGeocode(lat: number, lng: number): Promise<string | null> {
    try {
      // Try using Supabase edge function first
      try {
        const { data, error } = await supabase.functions.invoke('geocoding', {
          body: { type: 'reverse', lat, lon: lng }
        });

        if (!error && data?.success && data?.location_name) {
          return data.location_name;
        }
      } catch (supabaseError) {
        console.log('Supabase geocoding failed, falling back to OpenStreetMap');
      }

      // Fallback to OpenStreetMap Nominatim
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
  }

  // Forward geocoding (search)
  async searchLocations(query: string, limit: number = 8): Promise<SearchResult[]> {
    if (!query.trim()) {
      return [];
    }

    try {
      // Try using Supabase edge function first
      try {
        const { data, error } = await supabase.functions.invoke('geocoding', {
          body: { type: 'forward', query, limit }
        });

        if (!error && data?.success && data?.results) {
          return data.results;
        }
      } catch (supabaseError) {
        console.log('Supabase search failed, falling back to OpenStreetMap');
      }

      // Fallback to OpenStreetMap Nominatim
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=${limit}&addressdetails=1`
      );
      
      if (!response.ok) {
        throw new Error('Search request failed');
      }
      
      const data = await response.json();
      return data.map((item: any) => ({
        lat: parseFloat(item.lat),
        lon: parseFloat(item.lon),
        display_name: item.display_name,
        formatted_name: item.name || item.display_name.split(',')[0],
        type: item.type || 'location',
        importance: item.importance || 0,
      }));
    } catch (error) {
      console.error('Location search failed:', error);
      throw error;
    }
  }

  // Update location data with background processing
  private async updateLocationData(locationData: LocationData, updateSettings?: (settings: Partial<LocationSettings>) => Promise<void>) {
    if (!this.settings) return;
    
    try {
      // Check if location has changed significantly (more than ~100 meters)
      const hasLocationChanged = !this.lastLocationRef ||
        Math.abs(this.lastLocationRef.latitude - locationData.latitude) > 0.001 ||
        Math.abs(this.lastLocationRef.longitude - locationData.longitude) > 0.001;

      if (!hasLocationChanged) return;

      // Update local state immediately
      this.lastLocationRef = locationData;
      this.lastUpdateRef = Date.now();
      this.notifyListeners(locationData, 'active');

      // Update settings with coordinates immediately (background task)
      if (updateSettings) {
        // Use background task for settings update
        const backgroundUpdate = async () => {
          try {
            await updateSettings({
              location_latitude: locationData.latitude,
              location_longitude: locationData.longitude,
              location_name: this.settings?.location_name, // Keep existing name for now
            });

            // Try reverse geocoding in background (non-blocking)
            try {
              const locationName = await this.reverseGeocode(locationData.latitude, locationData.longitude);
              if (locationName) {
                const updatedLocationData = { ...locationData, name: locationName };
                this.lastLocationRef = updatedLocationData;
                this.notifyListeners(updatedLocationData, 'active');
                
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
            console.error('Failed to update location settings:', error);
          }
        };

        // Execute as background task if available, otherwise run normally
        if (typeof globalThis !== 'undefined' && 
            typeof (globalThis as any).EdgeRuntime !== 'undefined' && 
            (globalThis as any).EdgeRuntime.waitUntil) {
          (globalThis as any).EdgeRuntime.waitUntil(backgroundUpdate());
        } else {
          backgroundUpdate();
        }
      }

    } catch (error) {
      console.error('Failed to update location data:', error);
      this.notifyListeners(this.lastLocationRef, 'error');
    }
  }

  // Polling logic
  private async pollLocation(updateSettings?: (settings: Partial<LocationSettings>) => Promise<void>) {
    if (!this.settings?.location_enabled) return;
    
    this.notifyListeners(this.lastLocationRef, 'loading');
    
    try {
      const locationData = await this.getCurrentLocation();
      await this.updateLocationData(locationData, updateSettings);
    } catch (error) {
      console.warn('Location polling failed:', error);
      
      // If we have stored location data, that's sufficient
      if (this.settings.location_latitude && this.settings.location_longitude) {
        this.notifyListeners(this.lastLocationRef, 'active');
        return;
      }
      
      this.notifyListeners(this.lastLocationRef, 'error');
      
      // Show error toast very rarely to avoid spam
      if (Math.random() < 0.01) {
        toast.error('Location services unavailable');
      }
    }
  }

  // Service lifecycle
  async startLocationService(updateSettings?: (settings: Partial<LocationSettings>) => Promise<void>) {
    if (!this.settings?.location_enabled) return;
    
    console.log('Starting location service...');

    // Clear any existing interval
    this.stopLocationService();

    try {
      // Get initial location
      await this.pollLocation(updateSettings);

      // Set up polling interval using user preference (default 5 minutes)
      const pollFrequency = (this.settings.location_polling_frequency || 5) * 60 * 1000;
      this.intervalRef = setInterval(() => {
        this.pollLocation(updateSettings);
      }, pollFrequency);

      console.log('Location tracking started');
    } catch (error) {
      console.error('Failed to start location service:', error);
    }
  }

  private restartLocationService() {
    if (this.settings?.location_enabled) {
      this.stopLocationService();
      // Restart will be handled by the settings update
    }
  }

  stopLocationService() {
    console.log('Stopping location service...');

    if (this.intervalRef) {
      clearInterval(this.intervalRef);
      this.intervalRef = null;
    }

    if (this.watchIdRef !== null) {
      navigator.geolocation.clearWatch(this.watchIdRef);
      this.watchIdRef = null;
    }

    this.notifyListeners(this.lastLocationRef, 'inactive');
    console.log('Location tracking stopped');
  }

  // Status management
  getStatus(): LocationStatus {
    if (!this.settings?.location_enabled) {
      return 'inactive';
    }

    if (!this.lastLocationRef) {
      return 'loading';
    }

    // Check how long since last update
    const now = Date.now();
    const timeSinceUpdate = now - this.lastUpdateRef;

    if (timeSinceUpdate < 45000) { // 45 seconds - fresh data
      return 'active';
    } else if (timeSinceUpdate < 120000) { // 2 minutes - getting stale
      return 'loading';
    } else {
      return 'error'; // Too old
    }
  }

  // Getters
  getCurrentLocationData(): LocationData | null {
    return this.lastLocationRef;
  }

  getSettings(): LocationSettings | null {
    return this.settings;
  }

  isLocationEnabled(): boolean {
    return this.settings?.location_enabled || false;
  }

  // Manual refresh
  async refreshLocation(updateSettings?: (settings: Partial<LocationSettings>) => Promise<void>) {
    await this.pollLocation(updateSettings);
  }

  // Cleanup
  destroy() {
    this.stopLocationService();
    this.listeners.clear();
  }
}

// Export singleton instance
export const locationService = LocationService.getInstance();