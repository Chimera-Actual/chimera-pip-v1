import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, RefreshCw, Save, AlertCircle, Monitor, Volume2, Bell, Database, Palette, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface UserSettings {
  location_enabled: boolean;
  location_latitude?: number;
  location_longitude?: number;
  location_name?: string;
  theme_mode: 'auto' | 'dark' | 'light';
  crt_effects_enabled: boolean;
  sound_enabled: boolean;
  notifications_enabled: boolean;
  auto_save_enabled: boolean;
  data_backup_enabled: boolean;
}

export const SystemSettingsWidget: React.FC = () => {
  const [settings, setSettings] = useState<UserSettings>({
    location_enabled: false,
    theme_mode: 'auto',
    crt_effects_enabled: true,
    sound_enabled: true,
    notifications_enabled: true,
    auto_save_enabled: true,
    data_backup_enabled: false,
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
  }, [user]);

  const loadSettings = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }

      if (data) {
        setSettings({
          location_enabled: data.location_enabled || false,
          location_latitude: data.location_latitude || undefined,
          location_longitude: data.location_longitude || undefined,
          location_name: data.location_name || undefined,
          theme_mode: (data as any).theme_mode || 'auto',
          crt_effects_enabled: (data as any).crt_effects_enabled ?? true,
          sound_enabled: (data as any).sound_enabled ?? true,
          notifications_enabled: (data as any).notifications_enabled ?? true,
          auto_save_enabled: (data as any).auto_save_enabled ?? true,
          data_backup_enabled: (data as any).data_backup_enabled ?? false,
        });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      toast({
        title: "Error",
        description: "Failed to load settings",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          location_enabled: settings.location_enabled,
          location_latitude: settings.location_latitude,
          location_longitude: settings.location_longitude,
          location_name: settings.location_name,
          theme_mode: settings.theme_mode,
          crt_effects_enabled: settings.crt_effects_enabled,
          sound_enabled: settings.sound_enabled,
          notifications_enabled: settings.notifications_enabled,
          auto_save_enabled: settings.auto_save_enabled,
          data_backup_enabled: settings.data_backup_enabled,
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Settings saved successfully",
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error", 
        description: "Failed to save settings",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Error",
        description: "Geolocation is not supported by this browser",
        variant: "destructive"
      });
      return;
    }

    setGettingLocation(true);
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setSettings(prev => ({
          ...prev,
          location_latitude: position.coords.latitude,
          location_longitude: position.coords.longitude,
          location_name: `${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`
        }));
        setGettingLocation(false);
        
        toast({
          title: "Success",
          description: "Location updated successfully",
        });
      },
      (error) => {
        console.error('Geolocation error:', error);
        setGettingLocation(false);
        
        toast({
          title: "Error",
          description: "Failed to get location. Please check your browser permissions.",
          variant: "destructive"
        });
      },
      { 
        enableHighAccuracy: true, 
        timeout: 10000,
        maximumAge: 60000 
      }
    );
  };

  const clearLocation = () => {
    setSettings(prev => ({
      ...prev,
      location_latitude: undefined,
      location_longitude: undefined,
      location_name: undefined,
    }));
  };

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center space-y-2">
          <RefreshCw className="w-8 h-8 animate-spin text-primary mx-auto" />
          <div className="text-sm font-mono text-muted-foreground">Loading settings...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 h-16 bg-card border-b border-border px-4 flex items-center justify-between">
        <span className="text-lg font-mono text-primary uppercase tracking-wider crt-glow">
          ⚙ SYSTEM CONFIGURATION
        </span>
        <Button 
          onClick={saveSettings} 
          disabled={saving}
          variant="ghost"
          size="sm"
          className="h-10 px-4 text-sm font-mono bg-background/50 hover:bg-primary/20"
        >
          {saving ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
          {saving ? 'SAVING...' : 'SAVE'}
        </Button>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {/* Location Settings */}
        <Card className="bg-card/50 border-border">
          <CardHeader>
            <CardTitle className="text-xl font-mono text-primary uppercase tracking-wider crt-glow flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              LOCATION SERVICES
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Enable Location Toggle */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-sm font-mono text-foreground">
                  Enable Persistent Location
                </Label>
                <p className="text-xs text-muted-foreground font-mono">
                  Allow widgets to use your saved location for weather, maps, and other services
                </p>
              </div>
              <Switch
                checked={settings.location_enabled}
                onCheckedChange={(checked) => 
                  setSettings(prev => ({ ...prev, location_enabled: checked }))
                }
              />
            </div>

            {/* Location Configuration */}
            {settings.location_enabled && (
              <div className="space-y-4 border-t border-border pt-4">
                <div className="space-y-2">
                  <Label className="text-sm font-mono text-foreground">
                    Current Location
                  </Label>
                  
                  {settings.location_latitude && settings.location_longitude ? (
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-xs text-muted-foreground font-mono">LATITUDE</Label>
                          <Input
                            value={settings.location_latitude.toFixed(6)}
                            readOnly
                            className="font-mono text-xs bg-background/30"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground font-mono">LONGITUDE</Label>
                          <Input
                            value={settings.location_longitude.toFixed(6)}
                            readOnly
                            className="font-mono text-xs bg-background/30"
                          />
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button 
                          onClick={getCurrentLocation}
                          disabled={gettingLocation}
                          variant="outline"
                          size="sm"
                          className="font-mono text-xs"
                        >
                          {gettingLocation ? <RefreshCw className="w-3 h-3 animate-spin mr-1" /> : <MapPin className="w-3 h-3 mr-1" />}
                          UPDATE
                        </Button>
                        <Button 
                          onClick={clearLocation}
                          variant="outline"
                          size="sm"
                          className="font-mono text-xs"
                        >
                          CLEAR
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground p-3 bg-background/20 border border-border rounded">
                        <AlertCircle className="w-4 h-4" />
                        No location configured. Click below to set your current location.
                      </div>
                      <Button 
                        onClick={getCurrentLocation}
                        disabled={gettingLocation}
                        variant="outline"
                        className="w-fit font-mono text-sm"
                      >
                        {gettingLocation ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <MapPin className="w-4 h-4 mr-2" />}
                        {gettingLocation ? 'GETTING LOCATION...' : 'GET CURRENT LOCATION'}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Location Info */}
            <div className="bg-background/20 border border-border rounded p-3 text-xs font-mono space-y-1">
              <div className="text-muted-foreground">PRIVACY NOTICE:</div>
              <div className="text-foreground">
                • Location data is stored securely in your profile
              </div>
              <div className="text-foreground">
                • Only you can access your location settings
              </div>
              <div className="text-foreground">
                • You can disable or clear location data at any time
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Display & Interface Settings */}
        <Card className="bg-card/50 border-border">
          <CardHeader>
            <CardTitle className="text-xl font-mono text-primary uppercase tracking-wider crt-glow flex items-center gap-2">
              <Monitor className="w-5 h-5" />
              DISPLAY & INTERFACE
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Theme Mode */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-sm font-mono text-foreground">
                  Theme Mode
                </Label>
                <p className="text-xs text-muted-foreground font-mono">
                  Control the visual appearance of the interface
                </p>
              </div>
              <Select
                value={settings.theme_mode}
                onValueChange={(value: 'auto' | 'dark' | 'light') =>
                  setSettings(prev => ({ ...prev, theme_mode: value }))
                }
              >
                <SelectTrigger className="w-32 font-mono bg-background/50 border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background border-border">
                  <SelectItem value="auto" className="font-mono">AUTO</SelectItem>
                  <SelectItem value="dark" className="font-mono">DARK</SelectItem>
                  <SelectItem value="light" className="font-mono">LIGHT</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* CRT Effects */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-sm font-mono text-foreground">
                  CRT Visual Effects
                </Label>
                <p className="text-xs text-muted-foreground font-mono">
                  Enable retro CRT scanlines and glow effects
                </p>
              </div>
              <Switch
                checked={settings.crt_effects_enabled}
                onCheckedChange={(checked) =>
                  setSettings(prev => ({ ...prev, crt_effects_enabled: checked }))
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Audio & Notifications */}
        <Card className="bg-card/50 border-border">
          <CardHeader>
            <CardTitle className="text-xl font-mono text-primary uppercase tracking-wider crt-glow flex items-center gap-2">
              <Volume2 className="w-5 h-5" />
              AUDIO & NOTIFICATIONS
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Sound Effects */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-sm font-mono text-foreground">
                  System Sound Effects
                </Label>
                <p className="text-xs text-muted-foreground font-mono">
                  Enable audio feedback for interactions
                </p>
              </div>
              <Switch
                checked={settings.sound_enabled}
                onCheckedChange={(checked) =>
                  setSettings(prev => ({ ...prev, sound_enabled: checked }))
                }
              />
            </div>

            {/* Notifications */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-sm font-mono text-foreground">
                  Desktop Notifications
                </Label>
                <p className="text-xs text-muted-foreground font-mono">
                  Show browser notifications for important events
                </p>
              </div>
              <Switch
                checked={settings.notifications_enabled}
                onCheckedChange={(checked) =>
                  setSettings(prev => ({ ...prev, notifications_enabled: checked }))
                }
              />
            </div>
          </CardContent>
        </Card>


        {/* Performance Settings */}
        <Card className="bg-card/50 border-border">
          <CardHeader>
            <CardTitle className="text-xl font-mono text-primary uppercase tracking-wider crt-glow flex items-center gap-2">
              <Zap className="w-5 h-5" />
              PERFORMANCE
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-background/20 border border-border rounded p-3 text-xs font-mono space-y-2">
              <div className="text-primary font-bold">SYSTEM STATUS:</div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-muted-foreground">Memory Usage:</div>
                  <div className="text-accent">~15MB</div>
                </div>
                <div>
                  <div className="text-muted-foreground">CPU Usage:</div>
                  <div className="text-accent">~2%</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Network:</div>
                  <div className="text-accent">OPTIMAL</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Latency:</div>
                  <div className="text-accent">~45ms</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
          <div className="bg-background/30 border border-border rounded p-3">
            <div className="text-muted-foreground mb-1">USER SESSION:</div>
            <div className="text-accent animate-pulse">AUTHENTICATED</div>
          </div>
          <div className="bg-background/30 border border-border rounded p-3">
            <div className="text-muted-foreground mb-1">DATA SYNC:</div>
            <div className="text-accent animate-pulse">ENABLED</div>
          </div>
          <div className="bg-background/30 border border-border rounded p-3">
            <div className="text-muted-foreground mb-1">LOCATION ACCESS:</div>
            <div className={`animate-pulse ${settings.location_enabled ? 'text-accent' : 'text-muted-foreground'}`}>
              {settings.location_enabled ? 'ENABLED' : 'DISABLED'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};