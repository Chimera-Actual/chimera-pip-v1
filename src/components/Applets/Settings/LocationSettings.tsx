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
import { useIsMobile } from '@/hooks/use-mobile';

export const LocationSettings: React.FC = () => {
  const { settings, updateSettings } = useUserSettings();
  const { location, status, refreshLocation } = useLocation();
  const [loading, setLoading] = useState(false);
  const isMobile = useIsMobile();

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
    <Card className={isMobile ? 'mx-2' : ''}>
      <CardHeader className={isMobile ? 'pb-3 px-4 py-3' : ''}>
        <CardTitle className={`flex items-center gap-2 ${isMobile ? 'text-base' : ''}`}>
          <MapPin className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} />
          Location Services
        </CardTitle>
        <CardDescription className={isMobile ? 'text-sm' : ''}>
          Configure location tracking and update preferences
        </CardDescription>
      </CardHeader>
      <CardContent className={`space-y-4 md:space-y-6 ${isMobile ? 'px-4 pb-4' : ''}`}>
        {/* Location Enable/Disable */}
        <div className={`flex justify-between ${isMobile ? 'flex-col gap-3' : 'items-center'}`}>
          <div className="space-y-0.5">
            <Label htmlFor="location-enabled" className={isMobile ? 'text-sm' : ''}>Enable Location Services</Label>
            <div className={`text-muted-foreground ${isMobile ? 'text-sm' : 'text-sm'}`}>
              Allow the system to track your location for weather, maps, and other location-based features
            </div>
          </div>
          <Switch
            id="location-enabled"
            checked={settings.location_enabled}
            onCheckedChange={handleLocationToggle}
            disabled={loading}
            className="touch-target"
          />
        </div>

        <Separator />

        {/* Current Location Status */}
        <div className="space-y-4">
          <div className={`flex justify-between ${isMobile ? 'flex-col gap-3' : 'items-center'}`}>
            <Label className={isMobile ? 'text-sm' : ''}>Current Location Status</Label>
            <div className="flex items-center gap-2">
              <LocationStatusIndicator />
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefreshLocation}
                disabled={loading || !settings.location_enabled}
                className={`touch-target ${isMobile ? 'h-9 text-sm' : ''}`}
              >
                <RefreshCw className={`mr-2 ${loading ? 'animate-spin' : ''} ${isMobile ? 'w-3 h-3' : 'w-4 h-4'}`} />
                Refresh
              </Button>
            </div>
          </div>
          
          {location && (
            <div className={`bg-muted/50 p-3 rounded-lg space-y-2 ${isMobile ? 'text-sm' : ''}`}>
              <div className="font-mono">
                <div>Latitude: {location.latitude.toFixed(isMobile ? 4 : 6)}</div>
                <div>Longitude: {location.longitude.toFixed(isMobile ? 4 : 6)}</div>
              </div>
              {location.name && (
                <div className={`text-muted-foreground ${isMobile ? 'text-sm' : 'text-sm'}`}>
                  📍 {location.name}
                </div>
              )}
              <div className={`text-muted-foreground ${isMobile ? 'text-xs' : 'text-xs'}`}>
                Last updated: {new Date(location.timestamp).toLocaleString()}
              </div>
            </div>
          )}
        </div>

        <Separator />

        {/* Polling Frequency */}
        <div className="space-y-4">
          <div className="space-y-0.5">
            <Label className={`flex items-center gap-2 ${isMobile ? 'text-sm' : ''}`}>
              <Clock className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'}`} />
              Update Frequency
            </Label>
            <div className={`text-muted-foreground ${isMobile ? 'text-sm' : 'text-sm'}`}>
              How often to check for location changes
            </div>
          </div>
          
          <Select
            value={settings.location_polling_frequency?.toString() || '5'}
            onValueChange={handlePollingFrequencyChange}
            disabled={loading || !settings.location_enabled}
          >
            <SelectTrigger className={`touch-target ${isMobile ? 'h-10' : ''}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1" className="touch-target">Every minute</SelectItem>
              <SelectItem value="2" className="touch-target">Every 2 minutes</SelectItem>
              <SelectItem value="5" className="touch-target">Every 5 minutes</SelectItem>
              <SelectItem value="10" className="touch-target">Every 10 minutes</SelectItem>
              <SelectItem value="15" className="touch-target">Every 15 minutes</SelectItem>
              <SelectItem value="30" className="touch-target">Every 30 minutes</SelectItem>
              <SelectItem value="60" className="touch-target">Every hour</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* Privacy Notice */}
        <div className={`bg-muted/30 p-4 rounded-lg border border-muted ${isMobile ? 'p-3' : ''}`}>
          <div className="flex items-start gap-3">
            <Shield className={`text-muted-foreground mt-0.5 flex-shrink-0 ${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} />
            <div className="space-y-2">
              <div className={`font-medium ${isMobile ? 'text-sm' : 'text-sm'}`}>Privacy Notice</div>
              <div className={`text-muted-foreground leading-relaxed ${isMobile ? 'text-sm' : 'text-xs'}`}>
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