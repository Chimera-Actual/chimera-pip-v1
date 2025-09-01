import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { LocationStatusBar } from '@/components/ui/location-status-bar';
import { useLocation } from '@/contexts/LocationContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';
import { StandardWidgetTemplate } from '@/components/Layout/StandardWidgetTemplate';
import { WidgetSettings } from '@/components/Layout/WidgetSettings';
import { Settings, CloudSun } from 'lucide-react';

interface WeatherData {
  current: {
    location: string;
    temperature: number;
    condition: string;
    humidity: number;
    windSpeed: number;
    pressure: number;
    icon: string;
  };
  forecast: Array<{
    date: string;
    high: number;
    low: number;
    condition: string;
    icon: string;
    humidity: number;
    windSpeed: number;
  }>;
}

// Fetch weather data from OpenWeather API via edge function
const fetchWeatherData = async (
  location?: { latitude: number; longitude: number; name?: string }, 
  tempUnit: string = 'celsius'
): Promise<WeatherData> => {
  try {
    const units = tempUnit === 'fahrenheit' ? 'imperial' : 'metric';
    
    // Use provided location or default coordinates (San Francisco)
    const lat = location?.latitude || 37.7749;
    const lon = location?.longitude || -122.4194;
    
    const { data, error } = await supabase.functions.invoke('get-weather', {
      body: {
        latitude: lat,
        longitude: lon,
        units: units
      }
    });

    if (error) {
      console.error('Error calling weather function:', error);
      throw new Error(error.message || 'Failed to fetch weather data');
    }

    // If we have a custom location name from user settings, use it
    if (location?.name && data.current) {
      data.current.location = location.name;
    }

    return data;
  } catch (error) {
    console.error('Weather API error:', error);
    // Return mock data as fallback
    return getMockWeatherData(location, tempUnit);
  }
};

// Mock weather data as fallback
const getMockWeatherData = (location?: { latitude: number; longitude: number; name?: string }, tempUnit: string = 'celsius'): WeatherData => {
  const tempCelsius = 18;
  const tempFahrenheit = Math.round((tempCelsius * 9/5) + 32);
  
  return {
    current: {
      location: location?.name || "San Francisco, CA",
      temperature: tempUnit === 'fahrenheit' ? tempFahrenheit : tempCelsius,
      condition: "Partly Cloudy",
      humidity: 65,
      windSpeed: 12,
      pressure: 1013,
      icon: "⛅"
    },
    forecast: [
    {
      date: "Today",
      high: 20,
      low: 14,
      condition: "Partly Cloudy",
      icon: "⛅",
      humidity: 65,
      windSpeed: 12
    },
    {
      date: "Tomorrow",
      high: 22,
      low: 16,
      condition: "Sunny",
      icon: "☀️",
      humidity: 45,
      windSpeed: 8
    },
    {
      date: "Day 3",
      high: 19,
      low: 13,
      condition: "Light Rain",
      icon: "🌦️",
      humidity: 80,
      windSpeed: 15
    }
    ]
  };
};

interface WeatherWidgetProps {
  settings?: Record<string, any>;
  widgetName?: string;
  widgetInstanceId?: string;
  onSettingsUpdate?: (newSettings: Record<string, any>) => void;
}

export const WeatherWidget: React.FC<WeatherWidgetProps> = ({ settings, widgetName, widgetInstanceId, onSettingsUpdate }) => {
  const { location, status, lastUpdate, refreshLocation } = useLocation();
  const isMobile = useIsMobile();
  const temperatureUnit = settings?.temperatureUnit || 'celsius';
  const showLocation = settings?.showLocation !== false;
  const showForecast = settings?.showForecast !== false;
  const showDetails = settings?.showDetails !== false;
  
  const [weather, setWeather] = useState<WeatherData>(getMockWeatherData(undefined, temperatureUnit));
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  // Update weather data when location or settings change
  useEffect(() => {
    const updateWeatherData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const locationData = location ? {
          latitude: location.latitude,
          longitude: location.longitude,
          name: location.name
        } : undefined;
        
        const weatherData = await fetchWeatherData(locationData, temperatureUnit);
        setWeather(weatherData);
        setLastUpdated(new Date());
      } catch (err) {
        console.error('Failed to update weather data:', err);
        setError('Failed to load weather data');
      } finally {
        setLoading(false);
      }
    };
    
    updateWeatherData();
  }, [location, temperatureUnit]);

  const refreshWeather = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Refresh location first, then weather
      await refreshLocation();
      
      const locationData = location ? {
        latitude: location.latitude,
        longitude: location.longitude,
        name: location.name
      } : undefined;
      
      const weatherData = await fetchWeatherData(locationData, temperatureUnit);
      setWeather(weatherData);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to refresh weather data:', err);
      setError('Failed to refresh weather data');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  const headerControls = (
    <div className="flex items-center gap-2">
      <div className="text-xs font-mono text-muted-foreground">
        LAST UPDATE: {formatTime(lastUpdated)}
      </div>
      {error && (
        <div className="text-xs font-mono text-destructive">
          ⚠ {error}
        </div>
      )}
      <Button 
        onClick={refreshWeather} 
        disabled={loading}
        variant="ghost"
        size="sm"
        className="h-8 px-3 text-xs font-mono bg-background/50 hover:bg-primary/20"
      >
        {loading ? 'SYNC...' : '🔄 REFRESH'}
      </Button>
      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setShowSettings(true)}>
        <Settings className="h-4 w-4" />
      </Button>
    </div>
  );

  return (
    <StandardWidgetTemplate
      icon={<CloudSun className="h-5 w-5" />}
      title={widgetName || 'WEATHER MONITORING'}
      controls={headerControls}
    >
      <div className="flex-1 p-4 overflow-y-auto">
        {/* Location Status Bar */}
        <div className="mb-4">
          <LocationStatusBar
            location={location}
            status={status}
            lastUpdate={lastUpdate || undefined}
            onRefresh={refreshLocation}
            compact
            loading={loading}
          />
        </div>
        <div className="space-y-4">
          
          {/* Current Conditions */}
          <Card className="bg-card/50 border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-mono text-primary uppercase tracking-wider crt-glow">
                  CURRENT CONDITIONS
                </h2>
                {showLocation && (
                  <div className="text-xs font-mono text-muted-foreground">
                    {weather.current.location}
                  </div>
                )}
              </div>
              
              <div className={`grid gap-6 ${isMobile ? 'grid-cols-1' : 'md:grid-cols-2'}`}>
                {/* Temperature and Condition */}
                <div className={`flex items-center ${isMobile ? 'justify-center' : ''} space-x-4`}>
                  <div className={isMobile ? 'text-4xl' : 'text-6xl'}>{weather.current.icon}</div>
                  <div className={isMobile ? 'text-center' : ''}>
                    <div className={`font-mono text-primary crt-glow ${isMobile ? 'text-3xl' : 'text-4xl'}`}>
                      {weather.current.temperature}°{temperatureUnit === 'fahrenheit' ? 'F' : 'C'}
                    </div>
                    <div className={`font-mono text-secondary-foreground ${isMobile ? 'text-base' : 'text-lg'}`}>
                      {weather.current.condition}
                    </div>
                  </div>
                </div>
                
                {/* Weather Details */}
                {showDetails && (
                  <div className={`grid gap-4 font-mono ${isMobile ? 'grid-cols-1 text-sm' : 'grid-cols-2 text-sm'}`}>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">HUMIDITY:</span>
                        <span className="text-primary">{weather.current.humidity}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">WIND:</span>
                        <span className="text-primary">{weather.current.windSpeed} km/h</span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">PRESSURE:</span>
                        <span className="text-primary">{weather.current.pressure} hPa</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">STATUS:</span>
                        <span className="text-accent animate-pulse">ACTIVE</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 3-Day Forecast */}
          {showForecast && (
            <Card className="bg-card/50 border-border">
              <CardContent className="p-6">
                <h2 className="text-xl font-mono text-primary uppercase tracking-wider crt-glow mb-4">
                  3-DAY FORECAST
                </h2>
                
                <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'md:grid-cols-3'}`}>
                  {weather.forecast.map((day, index) => {
                    const dayTemp = temperatureUnit === 'fahrenheit' 
                      ? { high: Math.round((day.high * 9/5) + 32), low: Math.round((day.low * 9/5) + 32) }
                      : { high: day.high, low: day.low };
                    
                    return (
                      <div 
                        key={index}
                        className="bg-background/30 border border-border rounded p-4 space-y-3"
                      >
                        <div className="text-center">
                          <div className="text-sm font-mono text-primary uppercase tracking-wider">
                            {day.date}
                          </div>
                          <div className="text-3xl my-2">{day.icon}</div>
                          <div className="text-sm font-mono text-secondary-foreground">
                            {day.condition}
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <div className="text-center">
                            <div className="text-xs text-muted-foreground font-mono">HIGH</div>
                            <div className="text-lg font-mono text-primary">{dayTemp.high}°</div>
                          </div>
                          <div className="text-center">
                            <div className="text-xs text-muted-foreground font-mono">LOW</div>
                            <div className="text-lg font-mono text-secondary-foreground">{dayTemp.low}°</div>
                          </div>
                        </div>
                        
                        {showDetails && (
                          <div className="space-y-2 text-xs font-mono">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">HUMIDITY:</span>
                              <span className="text-primary">{day.humidity}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">WIND:</span>
                              <span className="text-primary">{day.windSpeed} km/h</span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* System Status */}
          <div className={`grid gap-4 text-xs font-mono ${isMobile ? 'grid-cols-1' : 'md:grid-cols-3'}`}>
            <div className="bg-background/30 border border-border rounded p-3">
              <div className="text-muted-foreground mb-1">WEATHER RADAR:</div>
              <div className="text-accent animate-pulse">OPERATIONAL</div>
            </div>
            <div className="bg-background/30 border border-border rounded p-3">
              <div className="text-muted-foreground mb-1">SATELLITE LINK:</div>
              <div className="text-accent animate-pulse">CONNECTED</div>
            </div>
            <div className="bg-background/30 border border-border rounded p-3">
              <div className="text-muted-foreground mb-1">DATA STREAM:</div>
              <div className="text-accent animate-pulse">REAL-TIME</div>
            </div>
          </div>
        </div>
      </div>
      <WidgetSettings
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        widget={{
          id: widgetInstanceId || 'weather-widget',
          widget_definition: { component_name: 'WeatherWidget' }
        } as any}
        onSettingsUpdate={(widgetId, newSettings) => onSettingsUpdate?.(newSettings)}
        currentSettings={settings || {}}
      />
    </StandardWidgetTemplate>
  );
};