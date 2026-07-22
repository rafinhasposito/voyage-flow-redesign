import { supabase } from '@/lib/supabase';

export interface FlightSearchResult {
  flightNumber: string;
  airlineName: string;
  airlineCode: string;
  departure: {
    iataCode: string;
    terminal?: string;
    gate?: string;
    scheduledTime: string;
    timezone?: string;
  };
  arrival: {
    iataCode: string;
    terminal?: string;
    gate?: string;
    scheduledTime: string;
    timezone?: string;
  };
  status: 'SCHEDULED' | 'ACTIVE' | 'DELAYED' | 'CANCELLED' | 'LANDED' | 'UNKNOWN';
  duration?: string;
  sandbox?: boolean;
}

export class FlightDataProvider {
  static async searchByFlightNumber(input: { flightNumber: string; departureDate: string }): Promise<FlightSearchResult[]> {
    try {
      const { data, error } = await supabase.functions.invoke('flight-lookup', {
        body: { 
          flightNumber: input.flightNumber, 
          date: input.departureDate 
        }
      });
      
      if (error) {
        // Here we handle HTTP and network errors from the invoke itself
        console.error('Edge Function HTTP Error:', error);
        if (error.message.includes('Failed to send a request')) {
            throw new Error('NETWORK_ERROR: ' + error.message);
        }
        throw new Error('INVOKE_ERROR: ' + error.message);
      }
      
      if (data?.error) {
        throw new Error(data.error); // Can be "NOT_FOUND", "MISSING_SECRETS", "RATE_LIMIT"
      }
      
      return data.data || [];
    } catch (e: any) {
      console.error('FlightDataProvider Error:', e);
      // We wrap the raw error so the UI can catch it nicely
      const errMessage = e.message || '';
      throw new Error(errMessage);
    }
  }
}
