import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ReverseGeocodeRequest {
  lat: number;
  lon: number;
}

interface ForwardGeocodeRequest {
  query: string;
  limit?: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, ...params } = await req.json();

    if (type === 'reverse') {
      const { lat, lon } = params as ReverseGeocodeRequest;
      
      console.log(`Reverse geocoding for coordinates: ${lat}, ${lon}`);
      
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'TacticalMapWidget/1.0',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Geocoding API error: ${response.status}`);
      }

      const data = await response.json();
      
      // Format the response
      const formattedLocation = formatLocationName(data);
      
      return new Response(JSON.stringify({ 
        success: true,
        location_name: formattedLocation,
        raw_data: data 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
      
    } else if (type === 'forward') {
      const { query, limit = 5 } = params as ForwardGeocodeRequest;
      
      console.log(`Forward geocoding for query: "${query}"`);
      
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=${limit}&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'TacticalMapWidget/1.0',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Geocoding API error: ${response.status}`);
      }

      const data = await response.json();
      
      // Format the search results
      const formattedResults = data.map((item: any) => ({
        lat: parseFloat(item.lat),
        lon: parseFloat(item.lon),
        display_name: item.display_name,
        formatted_name: formatLocationName(item),
        type: item.type,
        importance: item.importance,
      }));
      
      return new Response(JSON.stringify({ 
        success: true,
        results: formattedResults 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else {
      throw new Error('Invalid geocoding type. Use "forward" or "reverse".');
    }

  } catch (error) {
    console.error('Geocoding error:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function formatLocationName(data: any): string {
  if (!data || !data.address) {
    return data.display_name || 'Unknown Location';
  }

  const address = data.address;
  const parts = [];

  // Add city/town/village
  if (address.city) parts.push(address.city);
  else if (address.town) parts.push(address.town);
  else if (address.village) parts.push(address.village);

  // Add state/region
  if (address.state) parts.push(address.state);
  else if (address.region) parts.push(address.region);

  // Add country
  if (address.country) parts.push(address.country);

  return parts.length > 0 ? parts.join(', ') : data.display_name || 'Unknown Location';
}