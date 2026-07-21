import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function getAmadeusToken(apiKey: string, apiSecret: string) {
  const response = await fetch('https://test.api.amadeus.com/v1/security/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: `grant_type=client_credentials&client_id=${apiKey}&client_secret=${apiSecret}`,
  });
  if (!response.ok) {
    throw new Error('Failed to get Amadeus token');
  }
  const data = await response.json();
  return data.access_token;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { flightNumber, date } = await req.json();

    if (!flightNumber || !date) {
      return new Response(JSON.stringify({ error: 'Missing flightNumber or date' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const carrierCode = flightNumber.substring(0, 2).toUpperCase();
    const flightNo = flightNumber.substring(2).replace(/\s/g, '');

    const amadeusKey = Deno.env.get('AMADEUS_API_KEY');
    const amadeusSecret = Deno.env.get('AMADEUS_API_SECRET');

    if (!amadeusKey || !amadeusSecret) {
      return new Response(JSON.stringify({ 
        error: 'Missing Amadeus API Secrets on server', 
        message: 'Por favor, configure AMADEUS_API_KEY e AMADEUS_API_SECRET no Supabase.'
      }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const token = await getAmadeusToken(amadeusKey, amadeusSecret);

    const amadeusUrl = `https://test.api.amadeus.com/v2/schedule/flights?carrierCode=${carrierCode}&flightNumber=${flightNo}&scheduledDepartureDate=${date}`;
    
    const response = await fetch(amadeusUrl, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      if (response.status === 404) {
         return new Response(JSON.stringify({ data: [] }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      throw new Error(`Amadeus API error: ${response.statusText}`);
    }

    const json = await response.json();
    
    const results = (json.data || []).map((flight: any) => {
      const departure = flight.flightPoints[0];
      const arrival = flight.flightPoints[flight.flightPoints.length - 1];

      return {
        flightNumber: flightNumber,
        airlineName: carrierCode, // Amadeus v2 usually requires a dict mapping to get name, fallback to code
        airlineCode: carrierCode,
        departure: {
          iataCode: departure.iataCode,
          terminal: departure.departure?.terminal?.code || '',
          gate: departure.departure?.gate?.code || '',
          scheduledTime: departure.departure?.timings[0]?.value || '',
        },
        arrival: {
          iataCode: arrival.iataCode,
          terminal: arrival.arrival?.terminal?.code || '',
          gate: arrival.arrival?.gate?.code || '',
          scheduledTime: arrival.arrival?.timings[0]?.value || '',
        },
        status: 'SCHEDULED',
        sandbox: true
      };
    });

    return new Response(JSON.stringify({ data: results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
