export type TimezoneConfidence = 'high' | 'medium' | 'low';
export type TimezoneSource = 'provider' | 'airport_dataset' | 'manual' | 'missing';

export interface TimezoneResolution {
  timezone: string | null;
  source: TimezoneSource;
  confidence: TimezoneConfidence;
}

export class AirportTimezoneProvider {
  // Limited controlled dataset for initial implementation.
  // Returns 'missing' for unknown airports to prevent silent fallback.
  static dataset: Record<string, string> = {
    'GRU': 'America/Sao_Paulo',
    'CGH': 'America/Sao_Paulo',
    'GIG': 'America/Sao_Paulo',
    'SDU': 'America/Sao_Paulo',
    'JFK': 'America/New_York',
    'LGA': 'America/New_York',
    'EWR': 'America/New_York',
    'MIA': 'America/New_York',
    'MCO': 'America/New_York',
    'LAX': 'America/Los_Angeles',
    'SFO': 'America/Los_Angeles',
    'LHR': 'Europe/London',
    'CDG': 'Europe/Paris'
  };

  static resolveTimezone(airportCode: string | undefined, providerTimezone?: string, manualTimezone?: string): TimezoneResolution {
    if (manualTimezone) {
      return { timezone: manualTimezone, source: 'manual', confidence: 'high' };
    }

    if (providerTimezone) {
      return { timezone: providerTimezone, source: 'provider', confidence: 'high' };
    }
    
    if (!airportCode) {
      return { timezone: null, source: 'missing', confidence: 'low' };
    }

    const tz = this.dataset[airportCode.toUpperCase()];
    if (tz) {
      return { timezone: tz, source: 'airport_dataset', confidence: 'medium' };
    }

    return { timezone: null, source: 'missing', confidence: 'low' };
  }
}
