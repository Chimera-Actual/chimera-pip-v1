import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface LocationData {
  latitude: number;
  longitude: number;
  name?: string;
}

export interface UserSettings {
  location_enabled: boolean;
  location_latitude?: number;
  location_longitude?: number;
  location_name?: string;
  color_scheme?: 'green' | 'amber' | 'blue' | 'red' | 'cyan' | 'purple';
}

export const useUserSettings = () => {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadSettings();
    } else {
      setSettings(null);
      setLoading(false);
    }
  }, [user]);

  const loadSettings = async () => {
    if (!user) return;
    
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
          color_scheme: (data.color_scheme as 'green' | 'amber' | 'blue' | 'red' | 'cyan' | 'purple') || 'green',
        });
      } else {
        setSettings({
          location_enabled: false,
          color_scheme: 'green',
        });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      setSettings({
        location_enabled: false,
      });
    } finally {
      setLoading(false);
    }
  };

  const getUserLocation = (): LocationData | null => {
    if (!settings?.location_enabled || !settings.location_latitude || !settings.location_longitude) {
      return null;
    }

    return {
      latitude: settings.location_latitude,
      longitude: settings.location_longitude,
      name: settings.location_name,
    };
  };

  const updateSettings = async (updatedSettings: Partial<UserSettings>) => {
    if (!user || !settings) return;

    try {
      const { data, error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          ...settings,
          ...updatedSettings,
        }, {
          onConflict: 'user_id'
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setSettings({
          location_enabled: data.location_enabled || false,
          location_latitude: data.location_latitude || undefined,
          location_longitude: data.location_longitude || undefined,
          location_name: data.location_name || undefined,
          color_scheme: (data.color_scheme as 'green' | 'amber' | 'blue' | 'red' | 'cyan' | 'purple') || 'green',
        });
      }
    } catch (error) {
      console.error('Error updating settings:', error);
      throw error;
    }
  };

  const refreshSettings = () => {
    if (user) {
      loadSettings();
    }
  };

  return {
    settings,
    loading,
    getUserLocation,
    updateSettings,
    refreshSettings,
  };
};