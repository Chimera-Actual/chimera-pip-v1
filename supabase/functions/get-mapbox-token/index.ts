import { serve } from "https://deno.land/std@0.208.0/http/server.ts"
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('=== get-mapbox-token function called ===');
    console.log('Environment check:');
    
    // List all available env vars (for debugging)
    const envKeys = Object.keys(Deno.env.toObject());
    console.log('Available env keys:', envKeys.filter(key => key.includes('MAPBOX')));
    
    const mapboxToken = Deno.env.get('MAPBOX_PUBLIC_TOKEN')
    console.log('MAPBOX_PUBLIC_TOKEN exists:', !!mapboxToken);
    console.log('Token length:', mapboxToken ? mapboxToken.length : 0);
    
    if (!mapboxToken) {
      console.error('❌ MAPBOX_PUBLIC_TOKEN not found in environment variables');
      return new Response(
        JSON.stringify({ error: 'Mapbox token not configured', debug: 'MAPBOX_PUBLIC_TOKEN env var missing' }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('✅ Returning token successfully');
    return new Response(
      JSON.stringify({ token: mapboxToken }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('💥 Error in get-mapbox-token function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
})