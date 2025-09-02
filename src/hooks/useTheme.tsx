import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type ColorScheme = 'green' | 'amber' | 'blue' | 'red' | 'cyan' | 'purple';

export interface ThemeConfig {
  name: string;
  hue: number;
  displayName: string;
}

export const THEME_CONFIGS: Record<ColorScheme, ThemeConfig> = {
  green: { name: 'green', hue: 120, displayName: 'Terminal Green' },
  amber: { name: 'amber', hue: 45, displayName: 'Amber Glow' },
  blue: { name: 'blue', hue: 210, displayName: 'Plasma Blue' },
  red: { name: 'red', hue: 0, displayName: 'Alert Red' },
  cyan: { name: 'cyan', hue: 180, displayName: 'Cyan Matrix' },
  purple: { name: 'purple', hue: 270, displayName: 'Neon Purple' },
};

interface ThemeContextType {
  colorScheme: ColorScheme;
  setColorScheme: (scheme: ColorScheme) => Promise<void>;
  themeConfig: ThemeConfig;
  loading: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  const [colorScheme, setColorSchemeState] = useState<ColorScheme>('green');
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Load theme from database
  useEffect(() => {
    const loadTheme = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_settings')
          .select('color_scheme')
          .eq('user_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error loading theme:', error);
        } else if (data?.color_scheme) {
          setColorSchemeState(data.color_scheme as ColorScheme);
        }
      } catch (error) {
        console.error('Error loading theme:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTheme();
  }, [user]);

  // Apply theme to CSS variables
  useEffect(() => {
    const themeConfig = THEME_CONFIGS[colorScheme];
    document.documentElement.style.setProperty('--theme-hue', themeConfig.hue.toString());
  }, [colorScheme]);

  const setColorScheme = async (scheme: ColorScheme) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          color_scheme: scheme,
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('Error saving theme:', error);
        return;
      }

      setColorSchemeState(scheme);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  const themeConfig = THEME_CONFIGS[colorScheme];

  return (
    <ThemeContext.Provider
      value={{
        colorScheme,
        setColorScheme,
        themeConfig,
        loading,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};