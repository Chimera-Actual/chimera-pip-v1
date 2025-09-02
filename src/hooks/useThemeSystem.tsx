import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

export interface ThemePreset {
  id: string;
  name: string;
  hue: number;
  description: string;
  category: 'classic' | 'modern' | 'custom';
}

export interface CustomTheme {
  id: string;
  user_id: string;
  name: string;
  hue: number;
  accent_intensity: number;
  glow_intensity: number;
  scanline_opacity: number;
  created_at: string;
}

const THEME_PRESETS: ThemePreset[] = [
  { id: 'classic-green', name: 'Classic Green', hue: 120, description: 'Traditional terminal green', category: 'classic' },
  { id: 'amber', name: 'Amber', hue: 45, description: 'Warm amber glow', category: 'classic' },
  { id: 'blue', name: 'Electric Blue', hue: 200, description: 'Cool electric blue', category: 'modern' },
  { id: 'cyan', name: 'Cyan', hue: 180, description: 'Bright cyan terminal', category: 'modern' },
  { id: 'purple', name: 'Neon Purple', hue: 270, description: 'Vibrant purple glow', category: 'modern' },
  { id: 'red', name: 'Alert Red', hue: 0, description: 'Emergency red theme', category: 'classic' },
  { id: 'orange', name: 'Nuclear Orange', hue: 30, description: 'Radioactive orange', category: 'modern' },
  { id: 'pink', name: 'Hot Pink', hue: 320, description: 'Bright pink energy', category: 'modern' },
];

export const useThemeSystem = () => {
  const { user } = useAuth();
  const [currentTheme, setCurrentTheme] = useState<ThemePreset>(THEME_PRESETS[0]);
  const [customThemes, setCustomThemes] = useState<CustomTheme[]>([]);
  const [loading, setLoading] = useState(true);

  // Load user's theme preference
  useEffect(() => {
    if (user) {
      loadUserTheme();
      loadCustomThemes();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadUserTheme = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('color_scheme')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data?.color_scheme) {
        const theme = THEME_PRESETS.find(t => t.id === data.color_scheme) || THEME_PRESETS[0];
        setCurrentTheme(theme);
        applyTheme(theme.hue);
      }
    } catch (error) {
      console.error('Error loading user theme:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCustomThemes = async () => {
    if (!user) return;

    try {
      // For now, use localStorage to store custom themes
      const stored = localStorage.getItem(`custom-themes-${user.id}`);
      if (stored) {
        setCustomThemes(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading custom themes:', error);
    }
  };

  const applyTheme = useCallback((hue: number, intensity?: number, glow?: number, scanlines?: number) => {
    const root = document.documentElement;
    root.style.setProperty('--theme-hue', hue.toString());
    
    if (intensity !== undefined) {
      root.style.setProperty('--accent-intensity', intensity.toString());
    }
    if (glow !== undefined) {
      root.style.setProperty('--glow-intensity', glow.toString());
    }
    if (scanlines !== undefined) {
      root.style.setProperty('--scanline-opacity', scanlines.toString());
    }
  }, []);

  const changeTheme = async (theme: ThemePreset) => {
    setCurrentTheme(theme);
    applyTheme(theme.hue);

    if (user) {
      try {
        const { error } = await supabase
          .from('user_settings')
          .upsert({
            user_id: user.id,
            color_scheme: theme.id,
          });

        if (error) throw error;
      } catch (error) {
        console.error('Error saving theme preference:', error);
      }
    }
  };

  const createCustomTheme = async (
    name: string,
    hue: number,
    accentIntensity: number = 100,
    glowIntensity: number = 100,
    scanlineOpacity: number = 10
  ) => {
    if (!user) return null;

    try {
      const newTheme: CustomTheme = {
        id: crypto.randomUUID(),
        user_id: user.id,
        name,
        hue,
        accent_intensity: accentIntensity,
        glow_intensity: glowIntensity,
        scanline_opacity: scanlineOpacity,
        created_at: new Date().toISOString(),
      };

      const updatedThemes = [newTheme, ...customThemes];

      // Store in localStorage for now
      localStorage.setItem(`custom-themes-${user.id}`, JSON.stringify(updatedThemes));
      setCustomThemes(updatedThemes);
      return newTheme;
    } catch (error) {
      console.error('Error creating custom theme:', error);
      throw error;
    }
  };

  const deleteCustomTheme = async (themeId: string) => {
    if (!user) return;

    try {
      const updatedThemes = customThemes.filter(t => t.id !== themeId);

      // Store in localStorage for now
      localStorage.setItem(`custom-themes-${user.id}`, JSON.stringify(updatedThemes));
      setCustomThemes(updatedThemes);
    } catch (error) {
      console.error('Error deleting custom theme:', error);
      throw error;
    }
  };

  const applyCustomTheme = async (customTheme: CustomTheme) => {
    applyTheme(
      customTheme.hue,
      customTheme.accent_intensity,
      customTheme.glow_intensity,
      customTheme.scanline_opacity
    );

    if (user) {
      try {
        const { error } = await supabase
          .from('user_settings')
          .upsert({
            user_id: user.id,
            color_scheme: `custom-${customTheme.id}`,
          });

        if (error) throw error;
      } catch (error) {
        console.error('Error saving custom theme preference:', error);
      }
    }
  };

  return {
    currentTheme,
    customThemes,
    themePresets: THEME_PRESETS,
    loading,
    changeTheme,
    createCustomTheme,
    deleteCustomTheme,
    applyCustomTheme,
    applyTheme,
  };
};