export type CompanionshipType = 'solo' | 'couple' | 'family' | 'friends';
export type PaceType = 'relaxed' | 'balanced' | 'intense';
export type BudgetLevel = 'economic' | 'balanced' | 'luxury';

export interface Basecamp {
  id: string;
  name: string;
  lat?: number;
  lng?: number;
  neighborhood?: string;
}

export interface FlightSegment {
  segmentId: string;
  flightNumber: string;
  departureAirport: string;
  departureLocalDateTime: string; // ISO local time without Z
  departureTimezone?: string;
  departureInstant?: string; // UTC ISO string
  arrivalAirport: string;
  arrivalLocalDateTime: string;
  arrivalTimezone?: string;
  arrivalInstant?: string;
  terminal?: string;
  confirmationCode?: string;
}

export interface FixedAnchor {
  id: string;
  type: string;
  date: string; // YYYY-MM-DD
  startTime: string; // Local time HH:MM
  endTime: string;
  duration: number; // minutes
  location?: string;
  coordinates?: { lat: number; lng: number };
  isLocked: boolean;
  source: 'reservation' | 'manual';
  confirmationStatus: string;
}

export interface FlexibleReservation {
  id: string;
  type: string;
  title: string;
  date?: string; // May just be a preferred day
  duration?: number;
  location?: string;
}

// Representa a entrada DTO fortemente tipada sem 'any'
export interface TripEngineInputV1 {
  engineVersion: '1.0.0';
  tripId: string;
  destinationId: string;
  destinationTimezone: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  travelers: {
    count: number;
    ages?: number[];
    children: boolean;
    wheelchair: boolean;
  };
  companionship: CompanionshipType;
  travelProfile: string; // DNA (ex: "Classic NYC")
  pace: PaceType;
  budget: BudgetLevel;
  matchVotes: Record<string, 'yes' | 'love' | 'maybe' | 'no'>;
  avoidances: string[]; // List of categories or IDs to avoid
  accessibilityNeeds: string[];
  basecamp?: Basecamp;
  flightSegments: FlightSegment[];
  arrivalFlight?: FlightSegment;
  departureFlight?: FlightSegment;
  fixedReservations: FixedAnchor[];
  flexibleReservations: FlexibleReservation[];
  catalog: any[]; // Temporarily any, should map to Experience DTO
}

export type MatchVote = 'LOVE' | 'LIKE' | 'MAYBE' | 'REJECT' | 'PURCHASED';

export type MatchVoteNormalizationResult =
  | { status: 'NORMALIZED'; value: MatchVote }
  | { status: 'UNKNOWN'; rawValue: string }
  | { status: 'MISSING' };

export function normalizeMatchVote(rawValue: string | undefined | null): MatchVoteNormalizationResult {
  if (!rawValue) return { status: 'MISSING' };
  
  const val = String(rawValue).toLowerCase().trim();
  
  // Current values
  if (val === 'yes') return { status: 'NORMALIZED', value: 'LOVE' };
  if (val === 'no') return { status: 'NORMALIZED', value: 'REJECT' };
  if (val === 'maybe') return { status: 'NORMALIZED', value: 'MAYBE' };
  if (val === 'bought') return { status: 'NORMALIZED', value: 'PURCHASED' };
  
  // Legacy/other possible values found in previous code bases
  if (['love', 'loved'].includes(val)) return { status: 'NORMALIZED', value: 'LOVE' };
  if (['like', 'liked'].includes(val)) return { status: 'NORMALIZED', value: 'LIKE' };
  if (['dislike', 'reject', 'pass'].includes(val)) return { status: 'NORMALIZED', value: 'REJECT' };
  if (['purchased', 'reserved'].includes(val)) return { status: 'NORMALIZED', value: 'PURCHASED' };
  
  return { status: 'UNKNOWN', rawValue: String(rawValue) };
}
