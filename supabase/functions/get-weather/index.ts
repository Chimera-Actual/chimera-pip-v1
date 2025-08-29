import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WeatherRequest {
  latitude: number;
  longitude: number;
  units?: 'metric' | 'imperial';
}

interface OpenWeatherResponse {
  main: {
    temp: number;
    humidity: number;
    pressure: number;
  };
  weather: Array<{
    main: string;
    description: string;
    icon: string;
  }>;
  wind: {
    speed: number;
  };
  name: string;
}

interface ForecastResponse {
  list: Array<{
    dt: number;
    main: {
      temp_max: number;
      temp_min: number;
      humidity: number;
    };
    weather: Array<{
      main: string;
      description: string;
      icon: string;
    }>;
    wind: {
      speed: number;
    };
  }>;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const openWeatherApiKey = Deno.env.get('OPENWEATHER_API_KEY');
    if (!openWeatherApiKey) {
      console.error('OpenWeather API key not found in environment variables');
      throw new Error('OpenWeather API key not configured');
    }

    const { latitude, longitude, units = 'metric' } = await req.json() as WeatherRequest;

    if (!latitude || !longitude) {
      throw new Error('Latitude and longitude are required');
    }

    console.log(`Fetching weather for coordinates: ${latitude}, ${longitude}, units: ${units}`);

    // Fetch current weather
    const currentWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${openWeatherApiKey}&units=${units}`;
    
    const currentWeatherResponse = await fetch(currentWeatherUrl);
    if (!currentWeatherResponse.ok) {
      console.error(`OpenWeather API error: ${currentWeatherResponse.status} ${currentWeatherResponse.statusText}`);
      throw new Error(`Weather API error: ${currentWeatherResponse.status}`);
    }
    
    const currentWeather: OpenWeatherResponse = await currentWeatherResponse.json();

    // Fetch 5-day forecast
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&appid=${openWeatherApiKey}&units=${units}`;
    
    const forecastResponse = await fetch(forecastUrl);
    if (!forecastResponse.ok) {
      console.error(`Forecast API error: ${forecastResponse.status} ${forecastResponse.statusText}`);
      throw new Error(`Forecast API error: ${forecastResponse.status}`);
    }
    
    const forecastData: ForecastResponse = await forecastResponse.json();

    // Map weather condition to emoji
    const getWeatherIcon = (iconCode: string): string => {
      const iconMap: Record<string, string> = {
        '01d': '☀️', '01n': '🌙', // clear sky
        '02d': '⛅', '02n': '☁️', // few clouds
        '03d': '☁️', '03n': '☁️', // scattered clouds
        '04d': '☁️', '04n': '☁️', // broken clouds
        '09d': '🌧️', '09n': '🌧️', // shower rain
        '10d': '🌦️', '10n': '🌧️', // rain
        '11d': '⛈️', '11n': '⛈️', // thunderstorm
        '13d': '❄️', '13n': '❄️', // snow
        '50d': '🌫️', '50n': '🌫️', // mist
      };
      return iconMap[iconCode] || '🌤️';
    };

    // Process forecast data (get next 3 days at noon)
    const dailyForecasts = [];
    const processedDays = new Set<string>();
    
    for (const item of forecastData.list) {
      const date = new Date(item.dt * 1000);
      const dateKey = date.toDateString();
      
      // Skip today and only process each day once, prefer noon readings
      if (processedDays.has(dateKey) || date.toDateString() === new Date().toDateString()) {
        continue;
      }
      
      // Prefer readings around noon (12:00)
      const hour = date.getHours();
      if (hour >= 11 && hour <= 13) {
        processedDays.add(dateKey);
        
        const dayName = dailyForecasts.length === 0 ? 'Tomorrow' : 
                       dailyForecasts.length === 1 ? 'Day 3' : 'Day 4';
        
        dailyForecasts.push({
          date: dayName,
          high: Math.round(item.main.temp_max),
          low: Math.round(item.main.temp_min),
          condition: item.weather[0].description,
          icon: getWeatherIcon(item.weather[0].icon),
          humidity: item.main.humidity,
          windSpeed: Math.round(item.wind.speed * (units === 'imperial' ? 2.237 : 3.6)) // Convert to mph or km/h
        });
        
        if (dailyForecasts.length >= 3) break;
      }
    }

    // If we don't have enough forecasts from noon readings, fill with available data
    if (dailyForecasts.length < 3) {
      processedDays.clear();
      dailyForecasts.length = 0;
      
      for (const item of forecastData.list) {
        const date = new Date(item.dt * 1000);
        const dateKey = date.toDateString();
        
        if (processedDays.has(dateKey) || date.toDateString() === new Date().toDateString()) {
          continue;
        }
        
        processedDays.add(dateKey);
        
        const dayName = dailyForecasts.length === 0 ? 'Tomorrow' : 
                       dailyForecasts.length === 1 ? 'Day 3' : 'Day 4';
        
        dailyForecasts.push({
          date: dayName,
          high: Math.round(item.main.temp_max),
          low: Math.round(item.main.temp_min),
          condition: item.weather[0].description,
          icon: getWeatherIcon(item.weather[0].icon),
          humidity: item.main.humidity,
          windSpeed: Math.round(item.wind.speed * (units === 'imperial' ? 2.237 : 3.6))
        });
        
        if (dailyForecasts.length >= 3) break;
      }
    }

    const weatherData = {
      current: {
        location: currentWeather.name,
        temperature: Math.round(currentWeather.main.temp),
        condition: currentWeather.weather[0].description,
        humidity: currentWeather.main.humidity,
        windSpeed: Math.round(currentWeather.wind.speed * (units === 'imperial' ? 2.237 : 3.6)),
        pressure: Math.round(currentWeather.main.pressure),
        icon: getWeatherIcon(currentWeather.weather[0].icon)
      },
      forecast: dailyForecasts
    };

    console.log('Successfully fetched weather data:', JSON.stringify(weatherData, null, 2));

    return new Response(JSON.stringify(weatherData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in get-weather function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to fetch weather data',
        details: error.toString()
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});