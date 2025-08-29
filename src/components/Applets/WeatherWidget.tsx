import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useUserSettings } from '@/hooks/useUserSettings';

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

// Mock weather data - will be replaced with API data later
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
  const { getUserLocation } = useUserSettings();
  const temperatureUnit = settings?.temperatureUnit || 'celsius';
  const showLocation = settings?.showLocation !== false;
  const showForecast = settings?.showForecast !== false;
  const showDetails = settings?.showDetails !== false;
  
  const [weather, setWeather] = useState<WeatherData>(getMockWeatherData(undefined, temperatureUnit));
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Update weather data when user location or settings change
  useEffect(() => {
    const updateWeatherData = async () => {
      const persistentLocation = await getUserLocation();
      setWeather(getMockWeatherData(persistentLocation, temperatureUnit));
    };
    updateWeatherData();
  }, [temperatureUnit]);

  const refreshWeather = () => {
    setLoading(true);
    // Simulate API call delay
    setTimeout(() => {
      setLastUpdated(new Date());
      setLoading(false);
    }, 1000);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      {/* Header Controls */}
      <div className="flex-shrink-0 h-16 bg-card border-b border-border px-4 flex items-center justify-between">
        <span className="text-lg font-mono text-primary uppercase tracking-wider crt-glow">
          ☰ WEATHER MONITORING
        </span>
        <div className="flex items-center gap-4">
          <div className="text-xs font-mono text-muted-foreground">
            LAST UPDATE: {formatTime(lastUpdated)}
          </div>
          <Button 
            onClick={refreshWeather} 
            disabled={loading}
            variant="ghost"
            size="sm"
            className="h-10 px-4 text-sm font-mono bg-background/50 hover:bg-primary/20"
          >
            {loading ? 'SYNC...' : '🔄 REFRESH'}
          </Button>
        </div>
      </div>
      
      {/* Main Weather Content */}
      <div className="flex-1 p-4 overflow-y-auto">
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
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Temperature and Condition */}
                <div className="flex items-center space-x-4">
                  <div className="text-6xl">{weather.current.icon}</div>
                  <div>
                    <div className="text-4xl font-mono text-primary crt-glow">
                      {weather.current.temperature}°{temperatureUnit === 'fahrenheit' ? 'F' : 'C'}
                    </div>
                    <div className="text-lg font-mono text-secondary-foreground">
                      {weather.current.condition}
                    </div>
                  </div>
                </div>
                
                {/* Weather Details */}
                {showDetails && (
                  <div className="grid grid-cols-2 gap-4 text-sm font-mono">
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
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
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
    </div>
  );
};