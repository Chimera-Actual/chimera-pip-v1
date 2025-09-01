import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RectangularSwitch } from '@/components/ui/rectangular-switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MapPin, RefreshCw, Save, AlertCircle, Monitor, Volume2, Bell, Database, Palette, Zap, Settings as SettingsIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useTheme, THEME_CONFIGS, type ColorScheme } from '@/hooks/useTheme';
import { useLocation } from '@/contexts/LocationContext';
import { locationService } from '@/lib/locationService';
import { useIsMobile } from '@/hooks/use-mobile';
import { StandardWidgetTemplate } from '@/components/Layout/StandardWidgetTemplate';

interface UserSettings {
  location_enabled: boolean;
  location_latitude?: number;
  location_longitude?: number;
  location_name?: string;
  theme_mode: 'auto' | 'dark' | 'light';
  color_scheme: ColorScheme;
  crt_effects_enabled: boolean;
  sound_enabled: boolean;
  notifications_enabled: boolean;
  auto_save_enabled: boolean;
  data_backup_enabled: boolean;
}

const SystemSettingsWidget: React.FC = () => {
  const { location, getCurrentLocation } = useLocation();
  const isMobile = useIsMobile();
  const [settings, setSettings] = useState<UserSettings>({
    location_enabled: false,
    theme_mode: 'auto',
    color_scheme: 'green',
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
  const { colorScheme, setColorScheme, themeConfig } = useTheme();

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

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setSettings({
          location_enabled: data.location_enabled || false,
          location_latitude: data.location_latitude || undefined,
          location_longitude: data.location_longitude || undefined,
          location_name: data.location_name || undefined,
          theme_mode: (data as any).theme_mode || 'auto',
          color_scheme: (data.color_scheme as ColorScheme) || 'green',
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
          color_scheme: settings.color_scheme,
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

  const handleGetCurrentLocation = async () => {
    setGettingLocation(true);
    
    try {
      const currentLocation = await getCurrentLocation();
      setSettings(prev => ({
        ...prev,
        location_latitude: currentLocation.latitude,
        location_longitude: currentLocation.longitude,
        location_name: `${currentLocation.latitude.toFixed(6)}, ${currentLocation.longitude.toFixed(6)}`
      }));
      
      toast({
        title: "Success",
        description: "Location updated successfully",
      });
    } catch (error) {
      console.error('Failed to get current location:', error);
      toast({
        title: "Error",
        description: "Failed to get location. Please check your browser permissions.",
        variant: "destructive"
      });
    } finally {
      setGettingLocation(false);
    }
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
      <StandardWidgetTemplate
        icon={<SettingsIcon size={isMobile ? 16 : 20} />}
        title="SYSTEM CONFIGURATION"
      >
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-2">
            <RefreshCw className="w-8 h-8 animate-spin text-primary mx-auto" />
            <div className="text-sm font-mono text-muted-foreground">Loading settings...</div>
          </div>
        </div>
      </StandardWidgetTemplate>
    );
  }

  const saveButton = (
    <Button 
      onClick={saveSettings} 
      disabled={saving}
      variant="ghost"
      size="sm"
      className={`font-mono bg-background/50 hover:bg-primary/20 retro-button ${isMobile ? 'h-8 px-3 text-xs' : 'h-10 px-4 text-sm'}`}
    >
      {saving ? <RefreshCw className={`animate-spin mr-2 ${isMobile ? 'w-3 h-3' : 'w-4 h-4'}`} /> : <Save className={`mr-2 ${isMobile ? 'w-3 h-3' : 'w-4 h-4'}`} />}
      {saving ? 'SAVING...' : 'SAVE'}
    </Button>
  );

  return (
    <StandardWidgetTemplate
      icon={<SettingsIcon size={isMobile ? 16 : 20} />}
      title="SYSTEM CONFIGURATION"
      controls={saveButton}
    >
      <ScrollArea className="flex-1">
        <div className={`space-y-3 md:space-y-4 ${isMobile ? 'p-3' : 'p-4'}`}>
        {/* Location Settings Card */}
        <Card className="bg-card/50 border-border">
          <CardHeader className={isMobile ? 'pb-3 px-4 py-3' : ''}>
            <CardTitle className={`font-mono text-primary uppercase tracking-wider crt-glow flex items-center gap-2 ${isMobile ? 'text-base' : 'text-xl'}`}>
              <MapPin className={`icon-primary icon-glow ${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} />
              LOCATION SERVICES
            </CardTitle>
          </CardHeader>
          <CardContent className={`space-y-4 md:space-y-6 ${isMobile ? 'px-4 pb-4' : ''}`}>
            {/* Enable Location Toggle */}
            <div className={`flex justify-between ${isMobile ? 'flex-col gap-3' : 'items-center'}`}>
              <div className="space-y-1">
                <Label className={`font-mono text-foreground ${isMobile ? 'text-sm' : 'text-sm'}`}>
                  Enable Persistent Location
                </Label>
                <p className={`text-muted-foreground font-mono ${isMobile ? 'text-xs' : 'text-xs'}`}>
                  Automatically update location every 15 seconds for weather, maps, and other services
                </p>
              </div>
              <RectangularSwitch
                checked={settings.location_enabled}
                onCheckedChange={(checked) => 
                  setSettings(prev => ({ ...prev, location_enabled: checked }))
                }
              />
            </div>

            {/* Location Configuration */}
            {settings.location_enabled && (
              <div className={`space-y-3 md:space-y-4 border-t border-border ${isMobile ? 'pt-3' : 'pt-4'}`}>
                <div className="space-y-2">
                  <Label className={`font-mono text-foreground ${isMobile ? 'text-sm' : 'text-sm'}`}>
                    Current Location
                  </Label>
                  
                  {settings.location_latitude && settings.location_longitude ? (
                    <div className="space-y-2">
                      <div className={`grid gap-3 md:gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
                        <div>
                          <Label className={`text-muted-foreground font-mono ${isMobile ? 'text-xs' : 'text-xs'}`}>LATITUDE</Label>
                          <Input
                            value={settings.location_latitude.toFixed(6)}
                            readOnly
                            className={`font-mono bg-background/30 ${isMobile ? 'text-xs h-9' : 'text-xs'}`}
                          />
                        </div>
                        <div>
                          <Label className={`text-muted-foreground font-mono ${isMobile ? 'text-xs' : 'text-xs'}`}>LONGITUDE</Label>
                          <Input
                            value={settings.location_longitude.toFixed(6)}
                            readOnly
                            className={`font-mono bg-background/30 ${isMobile ? 'text-xs h-9' : 'text-xs'}`}
                          />
                        </div>
                      </div>
                      
                      <div className={`flex gap-2 ${isMobile ? 'flex-col' : ''}`}>
                        <Button 
                          onClick={handleGetCurrentLocation}
                          disabled={gettingLocation}
                          variant="outline"
                          size="sm"
                          className={`font-mono text-xs retro-button ${isMobile ? 'w-full h-9' : ''}`}
                        >
                          {gettingLocation ? <RefreshCw className="w-3 h-3 animate-spin mr-1" /> : <MapPin className="w-3 h-3 mr-1" />}
                          UPDATE
                        </Button>
                        <Button 
                          onClick={clearLocation}
                          variant="outline"
                          size="sm"
                          className={`font-mono text-xs retro-button ${isMobile ? 'w-full h-9' : ''}`}
                        >
                          CLEAR
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      <div className={`flex items-center gap-2 font-mono text-muted-foreground p-3 bg-background/20 border border-border rounded ${isMobile ? 'text-xs' : 'text-xs'}`}>
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        No location configured. Click below to set your current location.
                      </div>
                      <Button 
                        onClick={handleGetCurrentLocation}
                        disabled={gettingLocation}
                        variant="outline"
                        className={`w-fit font-mono retro-button ${isMobile ? 'text-xs h-9' : 'text-sm'}`}
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
            <div className={`bg-background/20 border border-border rounded p-3 font-mono space-y-1 ${
              isMobile ? 'text-xs' : 'text-xs'
            }`}>
              <div className="text-muted-foreground">PRIVACY NOTICE:</div>
               <div className="text-foreground">
                 • Location updates automatically every 15 seconds when enabled
               </div>
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

        {/* Display & Interface Settings Card */}
        <Card className="bg-card/50 border-border">
          <CardHeader className={isMobile ? 'pb-3 px-4 py-3' : ''}>
            <CardTitle className={`font-mono text-primary uppercase tracking-wider crt-glow flex items-center gap-2 ${isMobile ? 'text-base' : 'text-xl'}`}>
              <Monitor className={`icon-primary icon-glow ${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} />
              DISPLAY & INTERFACE
            </CardTitle>
          </CardHeader>
          <CardContent className={`space-y-4 md:space-y-6 ${isMobile ? 'px-4 pb-4' : ''}`}>
            {/* Theme Mode */}
            <div className={`flex justify-between ${isMobile ? 'flex-col gap-3' : 'items-center'}`}>
              <div className="space-y-1">
                <Label className={`font-mono text-foreground ${isMobile ? 'text-sm' : 'text-sm'}`}>
                  Theme Mode
                </Label>
                <p className={`text-muted-foreground font-mono ${isMobile ? 'text-xs' : 'text-xs'}`}>
                  Control the visual appearance of the interface
                </p>
              </div>
              <Select
                value={settings.theme_mode}
                onValueChange={(value: 'auto' | 'dark' | 'light') =>
                  setSettings(prev => ({ ...prev, theme_mode: value }))
                }
              >
                <SelectTrigger className={`font-mono bg-background/50 border-border ${isMobile ? 'w-full h-9' : 'w-32'}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background border-border">
                  <SelectItem value="auto" className="font-mono">AUTO</SelectItem>
                  <SelectItem value="dark" className="font-mono">DARK</SelectItem>
                  <SelectItem value="light" className="font-mono">LIGHT</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Color Scheme */}
            <div className={`flex justify-between ${isMobile ? 'flex-col gap-3' : 'items-center'}`}>
              <div className="space-y-1">
                <Label className={`font-mono text-foreground ${isMobile ? 'text-sm' : 'text-sm'}`}>
                  Color Scheme
                </Label>
                <p className={`text-muted-foreground font-mono ${isMobile ? 'text-xs' : 'text-xs'}`}>
                  Choose your preferred monochrome color theme
                </p>
              </div>
              <Select
                value={settings.color_scheme}
                onValueChange={async (value: ColorScheme) => {
                  setSettings(prev => ({ ...prev, color_scheme: value }));
                  await setColorScheme(value);
                }}
              >
                <SelectTrigger className={`font-mono bg-background/50 border-border ${isMobile ? 'w-full h-9' : 'w-40'}`}>
                  <SelectValue>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded border border-border"
                        style={{ backgroundColor: `hsl(${THEME_CONFIGS[settings.color_scheme].hue} 100% 50%)` }}
                      />
                      {THEME_CONFIGS[settings.color_scheme].displayName}
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-background border-border">
                  {Object.entries(THEME_CONFIGS).map(([key, config]) => (
                    <SelectItem key={key} value={key} className="font-mono">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded border border-border"
                          style={{ backgroundColor: `hsl(${config.hue} 100% 50%)` }}
                        />
                        {config.displayName}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* CRT Effects */}
            <div className={`flex justify-between ${isMobile ? 'flex-col gap-3' : 'items-center'}`}>
              <div className="space-y-1">
                <Label className={`font-mono text-foreground ${isMobile ? 'text-sm' : 'text-sm'}`}>
                  CRT Visual Effects
                </Label>
                <p className={`text-muted-foreground font-mono ${isMobile ? 'text-xs' : 'text-xs'}`}>
                  Enable retro CRT scanlines and glow effects
                </p>
              </div>
              <RectangularSwitch
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
          <CardHeader className={isMobile ? 'pb-3 px-4 py-3' : ''}>
            <CardTitle className={`font-mono text-primary uppercase tracking-wider crt-glow flex items-center gap-2 ${
              isMobile ? 'text-base' : 'text-xl'
            }`}>
              <Volume2 className={`icon-primary icon-glow ${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} />
              AUDIO & NOTIFICATIONS
            </CardTitle>
          </CardHeader>
          <CardContent className={`space-y-4 md:space-y-6 ${isMobile ? 'px-4 pb-4' : ''}`}>
            {/* Sound Effects */}
            <div className={`flex justify-between ${isMobile ? 'flex-col gap-3' : 'items-center'}`}>
              <div className="space-y-1">
                <Label className={`font-mono text-foreground ${isMobile ? 'text-sm' : 'text-sm'}`}>
                  System Sound Effects
                </Label>
                <p className={`text-muted-foreground font-mono ${isMobile ? 'text-xs' : 'text-xs'}`}>
                  Enable audio feedback for interactions
                </p>
              </div>
              <RectangularSwitch
                checked={settings.sound_enabled}
                onCheckedChange={(checked) =>
                  setSettings(prev => ({ ...prev, sound_enabled: checked }))
                }
              />
            </div>

            {/* Notifications */}
            <div className={`flex justify-between ${isMobile ? 'flex-col gap-3' : 'items-center'}`}>
              <div className="space-y-1">
                <Label className={`font-mono text-foreground ${isMobile ? 'text-sm' : 'text-sm'}`}>
                  Desktop Notifications
                </Label>
                <p className={`text-muted-foreground font-mono ${isMobile ? 'text-xs' : 'text-xs'}`}>
                  Show browser notifications for important events
                </p>
              </div>
              <RectangularSwitch
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
          <CardHeader className={isMobile ? 'pb-3 px-4 py-3' : ''}>
            <CardTitle className={`font-mono text-primary uppercase tracking-wider crt-glow flex items-center gap-2 ${
              isMobile ? 'text-base' : 'text-xl'
            }`}>
              <Zap className={`icon-primary icon-glow ${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} />
              PERFORMANCE
            </CardTitle>
          </CardHeader>
          <CardContent className={isMobile ? 'px-4 pb-4' : ''}>
            <div className={`bg-background/20 border border-border rounded p-3 font-mono space-y-2 ${
              isMobile ? 'text-xs' : 'text-xs'
            }`}>
              <div className="text-primary font-bold">SYSTEM STATUS:</div>
              <div className={`grid gap-3 md:gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
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
        <div className={`grid gap-3 md:gap-4 font-mono ${
          isMobile ? 'grid-cols-1 text-xs' : 'grid-cols-1 md:grid-cols-3 text-xs'
        }`}>
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
      </ScrollArea>
    </StandardWidgetTemplate>
  );
};

export default SystemSettingsWidget;
