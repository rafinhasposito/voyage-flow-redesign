export interface FlightSearchResult {
  airline: string;
  flightNumber: string;
  originIata: string;
  destinationIata: string;
  departureTime: string;
  arrivalTime: string;
  terminal?: string;
  gate?: string;
  status?: string;
  duration?: string;
}

export class FlightDataProvider {
  static async searchByFlightNumber(input: { flightNumber: string; departureDate: string }): Promise<FlightSearchResult[]> {
    // V1 Fallback manual - Mocking behavior
    console.warn("FlightDataProvider: API externa não configurada. Fallback ativado.");
    return [];
  }
}
