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
  private failureCount: number = 0;
  private maxFailures: number = 3;
  private isCircuitBreakerOpen: boolean = false;
  private lastFailureTime: number = 0;
  private isServiceRunning: boolean = false;
  private serviceLock: boolean = false;

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

  // Settings management with proper async handling
  async updateSettings(newSettings: LocationSettings) {
    if (this.serviceLock) {
      console.log('Service update already in progress, skipping...');
      return;
    }

    const wasEnabled = this.settings?.location_enabled;
    const oldFrequency = this.settings?.location_polling_frequency;
    this.settings = newSettings;

    console.log('Updating location service settings:', { 
      wasEnabled, 
      nowEnabled: newSettings.location_enabled,
      oldFrequency,
      newFrequency: newSettings.location_polling_frequency
    });

    // Always initialize location from settings if available - this ensures widgets have data immediately
    if (newSettings.location_latitude && newSettings.location_longitude) {
      const locationData: LocationData = {
        latitude: newSettings.location_latitude,
        longitude: newSettings.location_longitude,
        timestamp: Date.now(),
        name: newSettings.location_name || undefined,
        accuracy: 1000, // Mark as stored location
      };
      this.lastLocationRef = locationData;
      console.log('Providing stored location to widgets immediately:', locationData);
      this.notifyListeners(locationData, newSettings.location_enabled ? 'active' : 'inactive');
    }

    // Handle service state changes
    if (newSettings.location_enabled && !wasEnabled) {
      // Service was disabled, now enabled
      console.log('Starting location service (was disabled)');
      await this.startLocationService();
    } else if (!newSettings.location_enabled && wasEnabled) {
      // Service was enabled, now disabled
      console.log('Stopping location service (now disabled)');
      this.stopLocationService();
    } else if (newSettings.location_enabled && wasEnabled && 
               oldFrequency !== newSettings.location_polling_frequency) {
      // Frequency changed, restart polling
      console.log('Restarting location service (frequency changed)');
      await this.restartLocationService();
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
          let userFriendlyMessage = '';
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location access denied by user';
              userFriendlyMessage = 'Please allow location access in your browser settings and try again.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information unavailable';
              userFriendlyMessage = 'Location services may be disabled or unavailable. Using stored location.';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out';
              userFriendlyMessage = 'Location request took too long. Using stored location.';
              break;
          }
          
          const errorWithUserMessage = new Error(errorMessage);
          (errorWithUserMessage as any).userMessage = userFriendlyMessage;
          reject(errorWithUserMessage);
        },
        {
          enableHighAccuracy: false,
          timeout: 30000, // 30 second timeout for better GPS acquisition
          maximumAge: 300000, // Accept 5-minute old position
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

      // Update local state immediately
      this.lastLocationRef = locationData;
      this.lastUpdateRef = Date.now();
      this.notifyListeners(locationData, 'active');

      // Only update settings if location actually changed and we have updateSettings function
      if (hasLocationChanged && updateSettings) {
        // Background task for settings update
        const backgroundUpdate = async () => {
          try {
            await updateSettings({
              location_latitude: locationData.latitude,
              location_longitude: locationData.longitude,
              location_name: this.settings?.location_name,
            });

            // Try reverse geocoding in background
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
              // Silently ignore geocoding errors
              console.log('Reverse geocoding failed, continuing with coordinates only');
            }
          } catch (error) {
            console.error('Failed to update location settings:', error);
          }
        };

        // Execute as background task if available
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

  // Improved circuit breaker logic
  private shouldAttemptLocation(): boolean {
    const now = Date.now();
    
    if (this.isCircuitBreakerOpen) {
      const timeSinceLastFailure = now - this.lastFailureTime;
      // Progressive backoff: 1 minute, then 5 minutes, then 15 minutes
      const backoffTime = this.failureCount > 5 ? 900000 : // 15 minutes for persistent failures
                         this.failureCount > 3 ? 300000 : // 5 minutes for multiple failures  
                         60000; // 1 minute for initial failures
      
      if (timeSinceLastFailure > backoffTime) {
        console.log('Circuit breaker: Attempting to close circuit breaker after backoff');
        this.isCircuitBreakerOpen = false;
        // Don't reset failure count completely - keep some memory
        this.failureCount = Math.max(0, this.failureCount - 1);
        return true;
      }
      return false;
    }
    
    return true;
  }

  private handleLocationFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    if (this.failureCount >= this.maxFailures) {
      console.log(`Circuit breaker: Opening circuit breaker after ${this.failureCount} failures`);
      this.isCircuitBreakerOpen = true;
      
      // Only show error toast once when circuit breaker first opens
      if (this.failureCount === this.maxFailures) {
        toast.error('Location services temporarily unavailable. Using stored location.');
      }
    }
  }

  private handleLocationSuccess() {
    // Only fully reset on success after circuit breaker was open
    if (this.isCircuitBreakerOpen || this.failureCount > 0) {
      console.log('Circuit breaker: Location success, resetting failure count');
      this.failureCount = 0;
      this.isCircuitBreakerOpen = false;
    }
  }

  // Polling logic
  private async pollLocation(updateSettings?: (settings: Partial<LocationSettings>) => Promise<void>) {
    if (!this.settings?.location_enabled || !this.isServiceRunning) {
      return;
    }
    
    // Check circuit breaker
    if (!this.shouldAttemptLocation()) {
      // Use stored location as fallback when circuit breaker is open
      if (this.settings.location_latitude && this.settings.location_longitude) {
        const storedLocation: LocationData = {
          latitude: this.settings.location_latitude,
          longitude: this.settings.location_longitude,
          timestamp: Date.now(),
          name: this.settings.location_name
        };
        this.lastLocationRef = storedLocation;
        this.notifyListeners(storedLocation, 'active');
      }
      return;
    }
    
    this.notifyListeners(this.lastLocationRef, 'loading');
    
    try {
      const locationData = await this.getCurrentLocation();
      this.handleLocationSuccess();
      await this.updateLocationData(locationData, updateSettings);
    } catch (error: any) {
      console.warn('Location polling failed:', error);
      this.handleLocationFailure();
      
      // Use stored location as fallback
      if (this.settings.location_latitude && this.settings.location_longitude) {
        const storedLocation: LocationData = {
          latitude: this.settings.location_latitude,
          longitude: this.settings.location_longitude,
          timestamp: Date.now(),
          name: this.settings.location_name
        };
        this.lastLocationRef = storedLocation;
        this.notifyListeners(storedLocation, 'active');
        return;
      }
      
      this.notifyListeners(this.lastLocationRef, 'error');
    }
  }

  // Service lifecycle with proper async handling
  async startLocationService(updateSettings?: (settings: Partial<LocationSettings>) => Promise<void>) {
    if (!this.settings?.location_enabled || this.serviceLock) {
      console.log('Location service start skipped - disabled or locked');
      return;
    }
    
    this.serviceLock = true;
    
    try {
      console.log('Starting location service...');
      
      // Stop any existing service first
      this.stopLocationService(false); // Don't release lock yet
      
      this.isServiceRunning = true;

      // Emit stored location immediately if available before trying to get current location
      if (this.settings.location_latitude && this.settings.location_longitude) {
        const storedLocation: LocationData = {
          latitude: this.settings.location_latitude,
          longitude: this.settings.location_longitude,
          timestamp: Date.now(),
          name: this.settings.location_name,
          accuracy: 1000 // Mark as stored location
        };
        this.lastLocationRef = storedLocation;
        this.notifyListeners(storedLocation, 'active');
        console.log('Emitted stored location to widgets on service start');
      }
      
      // Get initial location (this will try to get fresh GPS data)
      await this.pollLocation(updateSettings);

      // Set up polling interval if service is still running and not in circuit breaker
      if (this.isServiceRunning && !this.isCircuitBreakerOpen) {
        const pollFrequency = (this.settings.location_polling_frequency || 5) * 60 * 1000;
        console.log(`Setting up location polling every ${pollFrequency / 1000} seconds`);
        
        this.intervalRef = setInterval(() => {
          this.pollLocation(updateSettings);
        }, pollFrequency);
      }

      console.log('Location service started successfully');
    } catch (error) {
      console.error('Failed to start location service:', error);
    } finally {
      this.serviceLock = false;
    }
  }

  private async restartLocationService() {
    if (!this.settings?.location_enabled) {
      return;
    }
    
    console.log('Restarting location service...');
    this.stopLocationService();
    // Add small delay to prevent race conditions
    setTimeout(() => {
      if (this.settings?.location_enabled) {
        this.startLocationService();
      }
    }, 100);
  }

  stopLocationService(releaseLock: boolean = true) {
    console.log('Stopping location service...');

    this.isServiceRunning = false;

    if (this.intervalRef) {
      clearInterval(this.intervalRef);
      this.intervalRef = null;
    }

    if (this.watchIdRef !== null) {
      navigator.geolocation.clearWatch(this.watchIdRef);
      this.watchIdRef = null;
    }

    if (releaseLock) {
      this.serviceLock = false;
    }

    this.notifyListeners(this.lastLocationRef, this.settings?.location_enabled ? 'inactive' : 'inactive');
    console.log('Location service stopped');
  }

  // Manual refresh with proper error handling
  async refreshLocation(updateSettings?: (settings: Partial<LocationSettings>) => Promise<void>) {
    if (!this.settings?.location_enabled) {
      throw new Error('Location services are disabled');
    }

    try {
      this.notifyListeners(this.lastLocationRef, 'loading');
      const locationData = await this.getCurrentLocation();
      this.handleLocationSuccess();
      await this.updateLocationData(locationData, updateSettings);
    } catch (error: any) {
      this.handleLocationFailure();
      
      // Use stored location as fallback for manual refresh too
      if (this.settings.location_latitude && this.settings.location_longitude) {
        const storedLocation: LocationData = {
          latitude: this.settings.location_latitude,
          longitude: this.settings.location_longitude,
          timestamp: Date.now(),
          name: this.settings.location_name
        };
        this.lastLocationRef = storedLocation;
        this.notifyListeners(storedLocation, 'active');
        return;
      }
      
      throw error;
    }
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

  // Cleanup
  destroy() {
    this.stopLocationService();
    this.listeners.clear();
    this.settings = null;
    this.lastLocationRef = null;
  }
}

// Export singleton instance
export const locationService = LocationService.getInstance();
