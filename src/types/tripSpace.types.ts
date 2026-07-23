export interface TripSpaceStop {
  id: string;
  title: string;
  category: string;
  neighborhood: string;
  description: string;
  duration: string;
  cost: string;
  imageUrl?: string;
  lat?: number;
  lng?: number;
  time?: string;
  isBooked?: boolean;
  isLocked?: boolean;
  isFixed?: boolean;
  matchScore?: number;
}

export interface TripSpaceDay {
  dayNumber: number;
  dateStr: string;
  theme: string;
  stops: TripSpaceStop[];
}

export interface TripSpaceReservation {
  id: string;
  title: string;
  type: string; // 'hotel' | 'flight' | 'activity' | 'transport' | 'other'
  details: string;
  status: string;
  dateStr?: string;
  photoUrl?: string;
}

export interface TripSpaceBasecamp {
  name: string;
  address: string;
  checkIn: string;
  checkOut: string;
  photoUrl?: string;
  lat?: number;
  lng?: number;
}

export interface TripSpaceIdea {
  id: string;
  title: string;
  category: string;
  neighborhood: string;
  photoUrl?: string;
  reason?: string;
}

export interface TripSpaceChecklistItem {
  id: string;
  text: string;
  completed: boolean;
  category?: string;
}

export interface TripSpaceDocument {
  id: string;
  name: string;
  type: string;
  validUntil?: string;
  status: string;
  fileUrl?: string;
}

export interface TripSpaceProfile {
  name: string;
  email: string;
  avatarUrl?: string;
  isPremium?: boolean;
}

export interface TripSpaceViewModel {
  tripId: string;
  title: string;
  destinationId: string;
  destinationName: string;
  destinationCountry: string;
  heroImageUrl: string;
  startDate: string;
  endDate: string;
  nightsCount: number;
  daysCount: number;
  travelersCount: number;
  travelStyle: string;
  isCollaborative: boolean;
  budgetLevel: string;
  
  days: TripSpaceDay[];
  basecamp?: TripSpaceBasecamp;
  reservations: TripSpaceReservation[];
  savedIdeas: TripSpaceIdea[];
  maybeIdeas: TripSpaceIdea[];
  recommendations: TripSpaceIdea[];
  checklist: TripSpaceChecklistItem[];
  documents: TripSpaceDocument[];
  profile: TripSpaceProfile;
  
  // Overview metrics
  totalBudgetLimit: number;
  spentSoFar: number;
  
  // Raw engine state
  rawItinerary: any[];
  rawVersion: string;
  
  estimatedBudget: { spent: number; total: number };
  bookedItemsCount: { booked: number; total: number };
  pace: string;
}
