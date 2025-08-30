import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { MapPin, Clock, Shield, RefreshCw } from 'lucide-react';
import { useUserSettings } from '@/hooks/useUserSettings';
import { useLocation } from '@/contexts/LocationContext';
import { LocationStatusIndicator } from '@/components/ui/location-status-indicator';
import { locationService } from '@/lib/locationService';
import { toast } from 'sonner';

export const LocationSettings: React.FC = () => {
  const { settings, updateSettings } = useUserSettings();
  const { location, status, refreshLocation } = useLocation();
  const [loading, setLoading] = useState(false);

  const handleLocationToggle = async (enabled: boolean) => {
    if (!settings) return;
    
    setLoading(true);
    try {
      await updateSettings({
        location_enabled: enabled,
      });
      
      if (enabled) {
        toast.success('Location services enabled');
      } else {
        toast.success('Location services disabled');
      }
    } catch (error) {
      console.error('Failed to update location settings:', error);
      toast.error('Failed to update location settings');
    } finally {
      setLoading(false);
    }
  };

  const handlePollingFrequencyChange = async (frequency: string) => {
    if (!settings) return;
    
    setLoading(true);
    try {
      await updateSettings({
        location_polling_frequency: parseInt(frequency),
      });
      toast.success('Polling frequency updated');
    } catch (error) {
      console.error('Failed to update polling frequency:', error);
      toast.error('Failed to update polling frequency');
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshLocation = async () => {
    setLoading(true);
    try {
      await refreshLocation();
      toast.success('Location refreshed');
    } catch (error) {
      console.error('Failed to refresh location:', error);
      toast.error('Failed to refresh location');
    } finally {
      setLoading(false);
    }
  };

  if (!settings) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center text-muted-foreground">Loading location settings...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          Location Services
        </CardTitle>
        <CardDescription>
          Configure location tracking and update preferences
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Location Enable/Disable */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="location-enabled">Enable Location Services</Label>
            <div className="text-sm text-muted-foreground">
              Allow the system to track your location for weather, maps, and other location-based features
            </div>
          </div>
          <Switch
            id="location-enabled"
            checked={settings.location_enabled}
            onCheckedChange={handleLocationToggle}
            disabled={loading}
          />
        </div>

        <Separator />

        {/* Current Location Status */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Current Location Status</Label>
            <div className="flex items-center gap-2">
              <LocationStatusIndicator />
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefreshLocation}
                disabled={loading || !settings.location_enabled}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
          
          {location && (
            <div className="bg-muted/50 p-3 rounded-lg space-y-2">
              <div className="text-sm font-mono">
                <div>Latitude: {location.latitude.toFixed(6)}</div>
                <div>Longitude: {location.longitude.toFixed(6)}</div>
              </div>
              {location.name && (
                <div className="text-sm text-muted-foreground">
                  📍 {location.name}
                </div>
              )}
              <div className="text-xs text-muted-foreground">
                Last updated: {new Date(location.timestamp).toLocaleString()}
              </div>
            </div>
          )}
        </div>

        <Separator />

        {/* Polling Frequency */}
        <div className="space-y-4">
          <div className="space-y-0.5">
            <Label className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Update Frequency
            </Label>
            <div className="text-sm text-muted-foreground">
              How often to check for location changes
            </div>
          </div>
          
          <Select
            value={settings.location_polling_frequency?.toString() || '5'}
            onValueChange={handlePollingFrequencyChange}
            disabled={loading || !settings.location_enabled}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Every minute</SelectItem>
              <SelectItem value="2">Every 2 minutes</SelectItem>
              <SelectItem value="5">Every 5 minutes</SelectItem>
              <SelectItem value="10">Every 10 minutes</SelectItem>
              <SelectItem value="15">Every 15 minutes</SelectItem>
              <SelectItem value="30">Every 30 minutes</SelectItem>
              <SelectItem value="60">Every hour</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* Privacy Notice */}
        <div className="bg-muted/30 p-4 rounded-lg border border-muted">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div className="space-y-2">
              <div className="font-medium text-sm">Privacy Notice</div>
              <div className="text-xs text-muted-foreground leading-relaxed">
                Your location data is stored securely and used only for providing location-based features. 
                Location tracking can be disabled at any time. We use OpenStreetMap for reverse geocoding, 
                which may involve sending coordinates to their service.
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};