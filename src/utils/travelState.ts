"use client";
import { LogisticsEngine } from "../lib/intelligence/logistics";

export interface TravelExperience {
  id: string;
  name: string;
  category: "culture" | "food" | "views" | "nature" | "shopping" | "classic" | "nightlife" | "hidden_gem";
  categoryLabel: string;
  description: string;
  emotionalDescription?: string;
  image: string;
  images?: string[];
  costLevel: "$" | "$$" | "$$$" | "$$$$";
  costUSD: number;
  neighborhood: string;
  coordinates?: { lat: number; lng: number };
  matchScore: number;
  durationHours: number;
  bestTime: string;
  bestTimeOfDay?: ("morning" | "afternoon" | "evening" | "night")[];
  recommendedSeasons?: ("winter" | "spring" | "summer" | "autumn" | "all")[];
  isIndoor?: boolean;
  weatherCompatibility?: ("rain" | "snow" | "heat" | "all")[];
  physicalEnergyRequired?: "low" | "medium" | "high";
  exclusivityLevel?: "accessible" | "premium" | "exclusive" | "invite_only";
  dressCode?: "casual" | "smart_casual" | "elegant" | "formal";
  reservationRequired?: boolean;
  availability?: string;
  accessibility?: ("wheelchair" | "stroller" | "none")[];
  min_age?: number | null;
  adult_only?: boolean | null;
  family_with_children_allowed?: boolean | null;
  requires_companion?: boolean | null;
  minimum_group_size?: number | null;
  maximum_group_size?: number | null;
  wheelchair_accessible?: boolean | null;
  stairs_required?: boolean | null;
  accessibility_notes?: string | null;
  restrictions_provenance?: any | null;
  operating_hours?: {
    day_of_week: number;
    opens_at: string | null;
    closes_at: string | null;
    is_closed: boolean;
    is_24_hours: boolean;
  }[];
  operating_hour_exceptions?: {
    exception_date: string;
    is_closed: boolean;
    opens_at: string | null;
    closes_at: string | null;
  }[];
  rating?: number;
  affiliateLink?: string;
  provider?: string;
  tags?: string[];
  personaWeights?: {
    explorador_visual: number;
    curador_experiencias: number;
    descobridor: number;
    aproveitador: number;
    slow_traveler: number;
  };
  companionshipCompatibility?: {
    solo: number;
    couple: number;
    family: number;
    friends: number;
  };
  plannedStartTime?: string;
  plannedEndTime?: string;
  transit_options_origin?: any[]; // Array of transit_options starting from this experience
  logisticsEvaluation?: import("../lib/intelligence/logistics").LogisticsEvaluation;
}

// Para manter compatibilidade com o código atual
export type Attraction = TravelExperience;

export interface UserPreferenceSignal {
  experienceId: string;
  action: "like" | "dislike" | "save" | "detail_view";
  timestamp: string;
  context: {
    companionship: TravelCompanionship;
    season: "winter" | "spring" | "summer" | "autumn" | "all";
    budget: "$" | "$$" | "$$$" | "$$$$";
  };
}

export interface EngineWeights {
  personaAffinity: number;
  tagAffinity: number;
  seasonalMatch: number;
  budgetCompatibility: number;
  companionshipMatch: number;
  behavioralLearning: number;
}

export const DEFAULT_ENGINE_WEIGHTS: EngineWeights = {
  personaAffinity: 0.35,
  tagAffinity: 0.25,
  seasonalMatch: 0.15,
  budgetCompatibility: 0.15,
  companionshipMatch: 0.10,
  behavioralLearning: 0.05
};

export interface RecommendationContext {
  profile: UserProfile;
  trip: TripContext;
  weights: EngineWeights;
  currentDate: string;
}

export interface MatchExplanation {
  reasons: string[];
  warnings: string[];
  humanJustification: string;
}

export type RestrictionReason = {
  code: string;
  message: string;
};

export type RestrictionEvaluation = {
  allowed: boolean;
  blockers: RestrictionReason[];
  warnings: RestrictionReason[];
  information: RestrictionReason[];
};

export type StopEditMetadata = {
  source: "engine" | "manual";
  locked: boolean;
  manuallyMoved?: boolean;
  manuallyScheduled?: boolean;
  conflict?: {
    logistics?: { codes: string[]; messages: string[] };
    restrictions?: { codes: string[]; messages: string[] };
  };
};

export interface RecommendedExperience {
  experience: TravelExperience;
  finalScore: number;
  confidence: number;
  explanation: MatchExplanation;
  restrictions?: RestrictionEvaluation;
  manualMetadata?: StopEditMetadata;
}

export type TravelerPersona = 
  | "explorador_visual"
  | "curador_experiencias"
  | "descobridor"
  | "aproveitador"
  | "slow_traveler";

export type TravelPace = "relaxado" | "equilibrado" | "intenso";

export type TravelCompanionship = 
  | "solo" 
  | "couple" 
  | "family" 
  | "friends" 
  | "romantic" 
  | "celebration";

export type TransportPreference = 
  | "walk" 
  | "metro" 
  | "uber" 
  | "rent_car" 
  | "public_transit";

export interface PersonaAffinity {
  explorador_visual: number;
  curador_experiencias: number;
  descobridor: number;
  aproveitador: number;
  slow_traveler: number;
}

export interface TagAffinity {
  [tag: string]: number;
}

export type TravelAtmosphereTheme = 
  | "winter_magic" 
  | "romantic_spring" 
  | "sunny_summer" 
  | "golden_autumn" 
  | "classic_default";

export interface TravelAtmosphere {
  theme: TravelAtmosphereTheme;
  title: string;
  primaryColor: string;
  textColor: string;
  backgroundImage: string;
  greetings: string[];
}

export interface BoardingPassState {
  currentStep: "empty" | "passenger_added" | "destination_selected" | "dates_locked" | "flight_linked" | "fully_completed";
  ticketNumber: string;
  seatNumber: string;
  gate: string;
  boardingGroup: string;
  isUnlocked: {
    passenger: boolean;
    destination: boolean;
    dates: boolean;
    atmosphere: boolean;
  };
}

export interface FlightInfo {
  flightNumber?: string;
  reservationCode?: string;
  airline?: string;
  departureTime?: string;
  arrivalTime?: string;
}

export interface FinancialBehavior {
  investmentProfile: "save_explore" | "balanced" | "unique_experiences" | "no_limits";
  spendingPriorities: ("gastronomy" | "hotels" | "tours" | "shopping" | "savings")[];
  maxBudgetUSD?: number;
}

export interface ExperienceInteraction {
  tripId: string;
  attractionId: string;
  action: "liked" | "disliked";
  timestamp: string;
  reason?: string;
  scoreImpact?: number;
}

export interface UserProfile {
  style: "solo" | "couple" | "family" | "friends";
  interests: string[];
  budget: "$" | "$$" | "$$$" | "$$$$";
  days: number;
  startDate: string;

  passengerName: string;
  passengerAge?: number;
  hasChildren?: boolean;
  groupSize?: number;
  wheelchairRequired?: boolean;
  
  personaAffinity: PersonaAffinity;
  tagAffinity: TagAffinity;
  pace: TravelPace;
  companionship: TravelCompanionship;
  transport: TransportPreference;
  financial: FinancialBehavior;
  swipedRightIds: string[];
  swipedLeftIds: string[];
  interactions: ExperienceInteraction[];
}

export interface TripContext {
  id: string;
  destination: string;
  startDate: string;
  endDate: string;
  days: number;
  hasFlightBought: boolean;
  flightInfo?: FlightInfo;
  boardingPass: BoardingPassState;
  atmosphere: TravelAtmosphere;
  tripBudgetUSD?: number;
}

export interface ItineraryDay {
  dayNumber: number;
  attractions: Attraction[]; 
  recommendations?: RecommendedExperience[]; 
}

export interface TravelState {
  profile: UserProfile;
  trip: TripContext;
  itinerary: ItineraryDay[];
  itineraryHistory: ItineraryDay[][]; // Max 1 previous state for Undo
  checklist: { id: string; text: string; done: boolean }[];
  customExpenses: { id: string; category: string; amountUSD: number; description: string }[];
}

export const DEFAULT_ATTRACTIONS: TravelExperience[] = [
  {
    id: "central-park",
    name: "Central Park & Bethesda Terrace",
    category: "nature",
    categoryLabel: "Natureza & Parques",
    description: "O coração verde de Manhattan. Perfeito para uma caminhada matinal, piquenique ou passeio de barco a remo.",
    emotionalDescription: "Sinta a pulsação de Nova York desacelerar enquanto você caminha sob o dossel de árvores centenárias. A Bethesda Terrace, com sua arquitetura majestosa, evoca o romance atemporal da cidade, sendo o cenário perfeito para criar memórias inesquecíveis.",
    image: "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=600&q=80",
    images: ["https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=600&q=80"],
    costLevel: "$",
    costUSD: 0,
    neighborhood: "Midtown / Upper Side",
    coordinates: { lat: 40.7829, lng: -73.9654 },
    matchScore: 98,
    durationHours: 3,
    bestTime: "Manhã",
    bestTimeOfDay: ["morning", "afternoon"],
    recommendedSeasons: ["all"],
    isIndoor: false,
    weatherCompatibility: ["all"],
    physicalEnergyRequired: "medium",
    exclusivityLevel: "accessible",
    dressCode: "casual",
    reservationRequired: false,
    availability: "Aberto das 6h à 1h",
    accessibility: ["wheelchair", "stroller"],
    rating: 4.9,
    affiliateLink: "https://www.getyourguide.com/new-york-l57/central-park-bike-tour-tickets-r123456.html",
    provider: "NYC Parks",
    tags: ["nature", "parks", "romance", "photography", "walking"],
    personaWeights: {
      explorador_visual: 0.9,
      curador_experiencias: 0.6,
      descobridor: 0.8,
      aproveitador: 0.9,
      slow_traveler: 1.0
    },
    companionshipCompatibility: {
      solo: 0.9,
      couple: 1.0,
      family: 1.0,
      friends: 0.9
    }
  },
  {
    id: "the-met",
    name: "The Metropolitan Museum of Art (The Met)",
    category: "culture",
    categoryLabel: "Arte & Cultura",
    description: "Um dos maiores e melhores museus de arte do mundo, cobrindo mais de 5.000 anos de cultura global.",
    emotionalDescription: "Percorra corredores que abrigam a grandiosidade da criatividade humana ao longo de milênios. Cada sala do The Met é um portal para outra era, oferecendo uma imersão cultural que expande a mente e enriquece a alma.",
    image: "https://images.unsplash.com/photo-1601887389937-0b02c26b6c3c?w=600&q=80",
    images: ["https://images.unsplash.com/photo-1601887389937-0b02c26b6c3c?w=600&q=80"],
    costLevel: "$$",
    costUSD: 30,
    neighborhood: "Upper East Side",
    coordinates: { lat: 40.7794, lng: -73.9632 },
    matchScore: 95,
    durationHours: 4,
    bestTime: "Tarde",
    bestTimeOfDay: ["morning", "afternoon"],
    recommendedSeasons: ["all"],
    isIndoor: true,
    weatherCompatibility: ["all", "rain", "snow"],
    physicalEnergyRequired: "medium",
    exclusivityLevel: "premium",
    dressCode: "smart_casual",
    reservationRequired: true,
    availability: "Fechado às quartas-feiras",
    accessibility: ["wheelchair"],
    rating: 4.8,
    affiliateLink: "https://www.getyourguide.com/new-york-l57/met-museum-priority-ticket-tickets-r234567.html",
    provider: "The Met",
    tags: ["art", "history", "museum", "indoor", "culture"],
    personaWeights: {
      explorador_visual: 0.8,
      curador_experiencias: 1.0,
      descobridor: 0.7,
      aproveitador: 0.6,
      slow_traveler: 0.8
    },
    companionshipCompatibility: {
      solo: 1.0,
      couple: 0.9,
      family: 0.7,
      friends: 0.8
    }
  },
  {
    id: "top-of-the-rock",
    name: "Top of the Rock Observation Deck",
    category: "views",
    categoryLabel: "Vistas & Mirantes",
    description: "A melhor vista panorâmica de Nova York, incluindo o Central Park e o imponente Empire State Building.",
    emotionalDescription: "Sinta-se no topo do mundo. Quando o sol se põe e as luzes da cidade começam a brilhar, estar no Top of the Rock proporciona uma perspectiva cinematográfica de Nova York, onde você realmente se sente parte da 'cidade que nunca dorme'.",
    image: "https://images.unsplash.com/photo-1534430480872-3498386e7856?w=600&q=80",
    images: ["https://images.unsplash.com/photo-1534430480872-3498386e7856?w=600&q=80"],
    costLevel: "$$$",
    costUSD: 45,
    neighborhood: "Midtown",
    coordinates: { lat: 40.7593, lng: -73.9794 },
    matchScore: 94,
    durationHours: 2,
    bestTime: "Pôr do sol",
    bestTimeOfDay: ["afternoon", "evening"],
    recommendedSeasons: ["all"],
    isIndoor: false,
    weatherCompatibility: ["all"],
    physicalEnergyRequired: "low",
    exclusivityLevel: "premium",
    dressCode: "casual",
    reservationRequired: true,
    availability: "Diariamente",
    accessibility: ["wheelchair"],
    rating: 4.7,
    affiliateLink: "https://www.getyourguide.com/new-york-l57/top-of-the-rock-skip-the-line-tickets-r345678.html",
    provider: "Rockefeller Center",
    tags: ["views", "photography", "iconic", "romance"],
    personaWeights: {
      explorador_visual: 1.0,
      curador_experiencias: 0.6,
      descobridor: 0.5,
      aproveitador: 1.0,
      slow_traveler: 0.4
    },
    companionshipCompatibility: {
      solo: 0.7,
      couple: 1.0,
      family: 0.9,
      friends: 0.9
    }
  },
  {
    id: "high-line",
    name: "The High Line Park",
    category: "nature",
    categoryLabel: "Natureza & Parques",
    description: "Um parque linear suspenso construído em uma antiga linha ferroviária de carga, cercado de arte e arquitetura.",
    emotionalDescription: "Caminhe flutuando sobre as ruas vibrantes de Chelsea. A justaposição da natureza crescendo em trilhos de trem abandonados contra a arquitetura hipermoderna de Manhattan oferece uma experiência de renovação urbana fascinante.",
    image: "https://images.unsplash.com/photo-1516912403163-f782a1593817?w=600&q=80",
    images: ["https://images.unsplash.com/photo-1516912403163-f782a1593817?w=600&q=80"],
    costLevel: "$",
    costUSD: 0,
    neighborhood: "Chelsea",
    coordinates: { lat: 40.7480, lng: -74.0048 },
    matchScore: 92,
    durationHours: 2,
    bestTime: "Manhã",
    bestTimeOfDay: ["morning", "afternoon"],
    recommendedSeasons: ["spring", "summer", "autumn"],
    isIndoor: false,
    weatherCompatibility: ["all"],
    physicalEnergyRequired: "medium",
    exclusivityLevel: "accessible",
    dressCode: "casual",
    reservationRequired: false,
    availability: "Aberto diariamente",
    accessibility: ["wheelchair"],
    rating: 4.8,
    provider: "Friends of the High Line",
    tags: ["nature", "architecture", "walking", "art"],
    personaWeights: {
      explorador_visual: 0.9,
      curador_experiencias: 0.7,
      descobridor: 0.8,
      aproveitador: 0.7,
      slow_traveler: 0.9
    },
    companionshipCompatibility: {
      solo: 1.0,
      couple: 0.9,
      family: 0.8,
      friends: 0.9
    }
  },
  {
    id: "chelsea-market",
    name: "Chelsea Market",
    category: "food",
    categoryLabel: "Gastronomia",
    description: "Um mercado gastronômico vibrante famoso por seus frutos do mar frescos, tacos artesanais e doces incríveis.",
    emotionalDescription: "Siga o aroma hipnotizante das diversas cozinhas mundiais neste charmoso mercado industrial. O Chelsea Market é um labirinto de sabores autênticos que despertam a curiosidade e o paladar.",
    image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&q=80",
    images: ["https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&q=80"],
    costLevel: "$$",
    costUSD: 25,
    neighborhood: "Meatpacking District",
    coordinates: { lat: 40.7423, lng: -74.0061 },
    matchScore: 89,
    durationHours: 1.5,
    bestTime: "Almoço",
    bestTimeOfDay: ["morning", "afternoon", "evening"],
    recommendedSeasons: ["all"],
    isIndoor: true,
    weatherCompatibility: ["all", "rain", "snow"],
    physicalEnergyRequired: "low",
    exclusivityLevel: "accessible",
    dressCode: "casual",
    reservationRequired: false,
    availability: "Aberto diariamente",
    accessibility: ["wheelchair"],
    rating: 4.6,
    tags: ["food", "indoor", "market", "shopping"],
    personaWeights: {
      explorador_visual: 0.7,
      curador_experiencias: 0.9,
      descobridor: 0.8,
      aproveitador: 0.6,
      slow_traveler: 0.6
    },
    companionshipCompatibility: {
      solo: 0.8,
      couple: 0.9,
      family: 0.9,
      friends: 1.0
    }
  },
  {
    id: "brooklyn-bridge",
    name: "Travessia da Brooklyn Bridge",
    category: "classic",
    categoryLabel: "Clássicos Imperdíveis",
    description: "Caminhe pela icônica ponte suspensa de madeira e aço ao entardecer para fotos inesquecíveis do skyline.",
    emotionalDescription: "Atravessar esta maravilha da engenharia sobre o East River sentindo a brisa e observando a grandeza de Manhattan no horizonte é um ritual quase espiritual para qualquer viajante em Nova York.",
    image: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=600&q=80",
    images: ["https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=600&q=80"],
    costLevel: "$",
    costUSD: 0,
    neighborhood: "DUMBO / Financial District",
    coordinates: { lat: 40.7061, lng: -73.9969 },
    matchScore: 96,
    durationHours: 2,
    bestTime: "Fim de tarde",
    bestTimeOfDay: ["morning", "afternoon", "evening"],
    recommendedSeasons: ["spring", "summer", "autumn"],
    isIndoor: false,
    weatherCompatibility: ["all"],
    physicalEnergyRequired: "high",
    exclusivityLevel: "accessible",
    dressCode: "casual",
    reservationRequired: false,
    availability: "Aberto 24h",
    accessibility: ["wheelchair"],
    rating: 4.9,
    tags: ["iconic", "views", "walking", "photography", "architecture"],
    personaWeights: {
      explorador_visual: 1.0,
      curador_experiencias: 0.6,
      descobridor: 0.8,
      aproveitador: 0.9,
      slow_traveler: 0.6
    },
    companionshipCompatibility: {
      solo: 0.9,
      couple: 1.0,
      family: 0.8,
      friends: 0.9
    }
  },
  {
    id: "summit-one",
    name: "SUMMIT One Vanderbilt",
    category: "views",
    categoryLabel: "Vistas & Mirantes",
    description: "Uma experiência imersiva de espelhos, arte e tecnologia com vistas deslumbrantes de Manhattan.",
    emotionalDescription: "Prepare-se para ter seus sentidos desafiados. Mais do que uma vista espetacular, o Summit é uma instalação de arte onde reflexos infinitos e a cidade aos seus pés criam uma sensação vertiginosa e libertadora.",
    image: "https://images.unsplash.com/photo-1541185933-ef5d8ed016c2?w=600&q=80",
    images: ["https://images.unsplash.com/photo-1541185933-ef5d8ed016c2?w=600&q=80"],
    costLevel: "$$$",
    costUSD: 48,
    neighborhood: "Midtown East",
    coordinates: { lat: 40.7527, lng: -73.9772 },
    matchScore: 93,
    durationHours: 2,
    bestTime: "Tarde",
    bestTimeOfDay: ["afternoon", "evening"],
    recommendedSeasons: ["all"],
    isIndoor: true,
    weatherCompatibility: ["all", "rain", "snow"],
    physicalEnergyRequired: "low",
    exclusivityLevel: "premium",
    dressCode: "smart_casual",
    reservationRequired: true,
    availability: "Diariamente com horário agendado",
    accessibility: ["wheelchair"],
    rating: 4.8,
    tags: ["views", "art", "immersive", "photography", "modern"],
    personaWeights: {
      explorador_visual: 1.0,
      curador_experiencias: 0.8,
      descobridor: 0.7,
      aproveitador: 0.8,
      slow_traveler: 0.4
    },
    companionshipCompatibility: {
      solo: 0.8,
      couple: 0.9,
      family: 0.9,
      friends: 1.0
    }
  },
  {
    id: "moma",
    name: "Museum of Modern Art (MoMA)",
    category: "culture",
    categoryLabel: "Arte & Cultura",
    description: "Lar de obras-primas como 'A Noite Estrelada' de Van Gogh e as 'Latinhas de Sopa Campbell' de Warhol.",
    emotionalDescription: "Inspire-se na vanguarda da criação. Estar frente a frente com obras que definiram a arte moderna é uma experiência de pura conexão criativa em um ambiente impecavelmente projetado.",
    image: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=600&q=80",
    images: ["https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=600&q=80"],
    costLevel: "$$",
    costUSD: 28,
    neighborhood: "Midtown",
    coordinates: { lat: 40.7614, lng: -73.9776 },
    matchScore: 91,
    durationHours: 3,
    bestTime: "Manhã",
    bestTimeOfDay: ["morning", "afternoon"],
    recommendedSeasons: ["all"],
    isIndoor: true,
    weatherCompatibility: ["all", "rain", "snow"],
    physicalEnergyRequired: "low",
    exclusivityLevel: "accessible",
    dressCode: "casual",
    reservationRequired: true,
    availability: "Aberto diariamente",
    accessibility: ["wheelchair"],
    rating: 4.7,
    tags: ["art", "modern", "museum", "indoor"],
    personaWeights: {
      explorador_visual: 0.9,
      curador_experiencias: 0.9,
      descobridor: 0.6,
      aproveitador: 0.5,
      slow_traveler: 0.8
    },
    companionshipCompatibility: {
      solo: 1.0,
      couple: 0.9,
      family: 0.7,
      friends: 0.8
    }
  },
  {
    id: "joes-pizza",
    name: "Joe's Pizza Greenwich Village",
    category: "food",
    categoryLabel: "Gastronomia",
    description: "A clássica fatia de pizza nova-iorquina de massa fina. Rápida, barata e amada por celebridades.",
    emotionalDescription: "A verdadeira essência do street food nova-iorquino. Morder uma fatia quente de queijo dobrada ao meio na calçada iluminada por néon é sentir o espírito apressado e autêntico de Nova York.",
    image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&q=80",
    images: ["https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&q=80"],
    costLevel: "$",
    costUSD: 5,
    neighborhood: "Greenwich Village",
    coordinates: { lat: 40.7306, lng: -74.0021 },
    matchScore: 97,
    durationHours: 0.5,
    bestTime: "Noite",
    bestTimeOfDay: ["afternoon", "evening", "night"],
    recommendedSeasons: ["all"],
    isIndoor: true,
    weatherCompatibility: ["all"],
    physicalEnergyRequired: "low",
    exclusivityLevel: "accessible",
    dressCode: "casual",
    reservationRequired: false,
    availability: "Aberto até altas horas",
    accessibility: ["none"],
    rating: 4.8,
    tags: ["food", "pizza", "iconic", "budget", "nightlife"],
    personaWeights: {
      explorador_visual: 0.4,
      curador_experiencias: 0.8,
      descobridor: 0.8,
      aproveitador: 0.9,
      slow_traveler: 0.3
    },
    companionshipCompatibility: {
      solo: 1.0,
      couple: 0.8,
      family: 0.9,
      friends: 1.0
    }
  },
  {
    id: "katzs-delicatessen",
    name: "Katz's Delicatessen",
    category: "food",
    categoryLabel: "Gastronomia",
    description: "O sanduíche de pastrami mais famoso do mundo, servido generosamente desde 1888 no Lower East Side.",
    emotionalDescription: "Volte no tempo neste lendário deli judaico. O caos organizado, as fotos vintage nas paredes e o sabor incomparável do pastrami cortado à mão compõem uma experiência cultural irreplicável.",
    image: "https://images.unsplash.com/photo-1509722747041-616f39b57569?w=600&q=80",
    images: ["https://images.unsplash.com/photo-1509722747041-616f39b57569?w=600&q=80"],
    costLevel: "$$",
    costUSD: 32,
    neighborhood: "Lower East Side",
    coordinates: { lat: 40.7222, lng: -73.9874 },
    matchScore: 92,
    durationHours: 1,
    bestTime: "Almoço",
    bestTimeOfDay: ["afternoon", "evening"],
    recommendedSeasons: ["all"],
    isIndoor: true,
    weatherCompatibility: ["all", "rain", "snow"],
    physicalEnergyRequired: "low",
    exclusivityLevel: "accessible",
    dressCode: "casual",
    reservationRequired: false,
    availability: "Diariamente",
    accessibility: ["wheelchair"],
    rating: 4.6,
    tags: ["food", "history", "iconic", "meat"],
    personaWeights: {
      explorador_visual: 0.5,
      curador_experiencias: 0.9,
      descobridor: 0.7,
      aproveitador: 0.8,
      slow_traveler: 0.5
    },
    companionshipCompatibility: {
      solo: 0.9,
      couple: 0.8,
      family: 0.8,
      friends: 0.9
    }
  },
  {
    id: "le-bernardin",
    name: "Le Bernardin (3 Estrelas Michelin)",
    category: "food",
    categoryLabel: "Gastronomia",
    description: "Uma das experiências gastronômicas mais refinadas do mundo, especializada em frutos do mar de alta costura.",
    emotionalDescription: "O auge absoluto do requinte. Um serviço quase coreografado, uma atmosfera de serena elegância e pratos que são verdadeiras obras de arte oferecem o epítome do luxo em Nova York.",
    image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=600&q=80",
    images: ["https://images.unsplash.com/photo-1544025162-d76694265947?w=600&q=80"],
    costLevel: "$$$$",
    costUSD: 220,
    neighborhood: "Midtown West",
    coordinates: { lat: 40.7615, lng: -73.9818 },
    matchScore: 88,
    durationHours: 3,
    bestTime: "Noite",
    bestTimeOfDay: ["evening", "night"],
    recommendedSeasons: ["all"],
    isIndoor: true,
    weatherCompatibility: ["all", "rain", "snow"],
    physicalEnergyRequired: "low",
    exclusivityLevel: "exclusive",
    dressCode: "formal",
    reservationRequired: true,
    availability: "Reservas com 30 dias de antecedência",
    accessibility: ["wheelchair"],
    rating: 4.9,
    tags: ["food", "fine_dining", "michelin", "luxury", "romance", "seafood"],
    personaWeights: {
      explorador_visual: 0.7,
      curador_experiencias: 1.0,
      descobridor: 0.5,
      aproveitador: 0.4,
      slow_traveler: 0.9
    },
    companionshipCompatibility: {
      solo: 0.6,
      couple: 1.0,
      family: 0.2,
      friends: 0.7
    }
  },
  {
    id: "broadway-show",
    name: "Espetáculo da Broadway",
    category: "culture",
    categoryLabel: "Arte & Cultura",
    description: "Assista a musicais lendários como O Rei Leão, Wicked ou Hamilton nos teatros mais famosos do mundo.",
    emotionalDescription: "Sinta a cortina se abrir e deixe-se levar pela magia contagiante das luzes, vozes poderosas e cenários imensos. É um êxtase cultural eletrizante que transcende o tempo.",
    image: "https://images.unsplash.com/photo-1514306191717-452ec28c7814?w=600&q=80",
    images: ["https://images.unsplash.com/photo-1514306191717-452ec28c7814?w=600&q=80"],
    costLevel: "$$$$",
    costUSD: 120,
    neighborhood: "Theater District",
    coordinates: { lat: 40.7590, lng: -73.9845 },
    matchScore: 95,
    durationHours: 3,
    bestTime: "Noite",
    bestTimeOfDay: ["evening", "night"],
    recommendedSeasons: ["all"],
    isIndoor: true,
    weatherCompatibility: ["all", "rain", "snow"],
    physicalEnergyRequired: "low",
    exclusivityLevel: "premium",
    dressCode: "smart_casual",
    reservationRequired: true,
    availability: "Agendamento antecipado recomendado",
    accessibility: ["wheelchair"],
    rating: 4.9,
    tags: ["theater", "culture", "indoor", "entertainment"],
    personaWeights: {
      explorador_visual: 0.8,
      curador_experiencias: 0.9,
      descobridor: 0.6,
      aproveitador: 0.9,
      slow_traveler: 0.5
    },
    companionshipCompatibility: {
      solo: 0.8,
      couple: 1.0,
      family: 1.0,
      friends: 0.9
    }
  },
  {
    id: "statue-liberty",
    name: "Estátua da Liberdade & Ellis Island",
    category: "classic",
    categoryLabel: "Clássicos Imperdíveis",
    description: "Pegue o balsa para visitar de perto o maior símbolo de liberdade e esperança da América.",
    emotionalDescription: "Contemplar de perto este colossal ícone de esperança evoca uma reflexão profunda sobre o passado. Um passeio sereno de barco e uma imersão na história de imigrantes que construíram o país.",
    image: "https://images.unsplash.com/photo-1605130284535-11dd9eedc58a?w=600&q=80",
    images: ["https://images.unsplash.com/photo-1605130284535-11dd9eedc58a?w=600&q=80"],
    costLevel: "$$",
    costUSD: 25,
    neighborhood: "Battery Park (Partida)",
    coordinates: { lat: 40.6892, lng: -74.0445 },
    matchScore: 90,
    durationHours: 4,
    bestTime: "Manhã",
    bestTimeOfDay: ["morning", "afternoon"],
    recommendedSeasons: ["spring", "summer", "autumn"],
    isIndoor: false,
    weatherCompatibility: ["all"],
    physicalEnergyRequired: "medium",
    exclusivityLevel: "accessible",
    dressCode: "casual",
    reservationRequired: true,
    availability: "Partidas de hora em hora",
    accessibility: ["wheelchair", "stroller"],
    rating: 4.6,
    tags: ["history", "iconic", "views", "boat"],
    personaWeights: {
      explorador_visual: 0.8,
      curador_experiencias: 0.7,
      descobridor: 0.8,
      aproveitador: 0.8,
      slow_traveler: 0.5
    },
    companionshipCompatibility: {
      solo: 0.7,
      couple: 0.8,
      family: 1.0,
      friends: 0.8
    }
  },
  {
    id: "soho-shopping",
    name: "Compras e Arquitetura no SoHo",
    category: "shopping",
    categoryLabel: "Compras",
    description: "Explore as ruas de paralelepípedos, edifícios de ferro fundido e as melhores boutiques de moda e design.",
    emotionalDescription: "Inspire o estilo e a sofisticação caminhando por este deslumbrante distrito histórico. O som de saltos nos paralelepípedos e vitrines perfeitamente curadas compõem uma experiência de luxo e beleza urbana inigualável.",
    image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&q=80",
    images: ["https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&q=80"],
    costLevel: "$$$",
    costUSD: 50,
    neighborhood: "SoHo",
    coordinates: { lat: 40.7233, lng: -74.0030 },
    matchScore: 87,
    durationHours: 3,
    bestTime: "Tarde",
    bestTimeOfDay: ["morning", "afternoon"],
    recommendedSeasons: ["all"],
    isIndoor: false,
    weatherCompatibility: ["all"],
    physicalEnergyRequired: "medium",
    exclusivityLevel: "premium",
    dressCode: "smart_casual",
    reservationRequired: false,
    availability: "Diariamente (Lojas geralmente 10h-19h)",
    accessibility: ["wheelchair", "stroller"],
    rating: 4.7,
    tags: ["shopping", "architecture", "fashion", "luxury", "walking"],
    personaWeights: {
      explorador_visual: 0.8,
      curador_experiencias: 0.9,
      descobridor: 0.6,
      aproveitador: 0.5,
      slow_traveler: 0.8
    },
    companionshipCompatibility: {
      solo: 0.8,
      couple: 0.9,
      family: 0.6,
      friends: 1.0
    }
  }
];

export function getStoredAttractions(): TravelExperience[] {
  const saved = localStorage.getItem("viagem_dos_sonhos_attractions");
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (parsed.length > 0 && !parsed[0].emotionalDescription) {
        console.warn("Dados legados detectados nas atrações. Atualizando para TravelExperiences ricas.");
        localStorage.setItem("viagem_dos_sonhos_attractions", JSON.stringify(DEFAULT_ATTRACTIONS));
        return DEFAULT_ATTRACTIONS;
      }
      return parsed;
    } catch (e) {
      console.error("Erro ao carregar atrações", e);
    }
  }
  localStorage.setItem("viagem_dos_sonhos_attractions", JSON.stringify(DEFAULT_ATTRACTIONS));
  return DEFAULT_ATTRACTIONS;
}

export function saveStoredAttractions(attractions: TravelExperience[]) {
  localStorage.setItem("viagem_dos_sonhos_attractions", JSON.stringify(attractions));
}

export function migrateProfile(oldProfile: any): UserProfile {
  if (oldProfile && oldProfile.personaAffinity) {
    return oldProfile as UserProfile;
  }

  const style = oldProfile?.style || "couple";
  const interests = oldProfile?.interests || ["culture", "food", "views", "classic"];
  const budget = oldProfile?.budget || "$$";
  const days = oldProfile?.days || 4;
  const startDate = oldProfile?.startDate || new Date().toISOString().split("T")[0];

  let companionship: TravelCompanionship = "couple";
  if (style === "solo") companionship = "solo";
  else if (style === "family") companionship = "family";
  else if (style === "friends") companionship = "friends";

  const personaAffinity: PersonaAffinity = {
    explorador_visual: interests.includes("views") ? 0.8 : 0.4,
    curador_experiencias: interests.includes("food") || interests.includes("culture") ? 0.8 : 0.4,
    descobridor: interests.includes("nature") ? 0.7 : 0.3,
    aproveitador: interests.includes("classic") ? 0.8 : 0.3,
    slow_traveler: 0.5
  };

  let investmentProfile = "balanced";
  if (budget === "$") investmentProfile = "save_explore";
  else if (budget === "$$$") investmentProfile = "unique_experiences";
  else if (budget === "$$$$") investmentProfile = "no_limits";

  return {
    style,
    interests,
    budget,
    days,
    startDate,
    passengerName: "Viajante",
    personaAffinity,
    tagAffinity: {},
    pace: "equilibrado",
    companionship,
    transport: "metro",
    financial: {
      investmentProfile: investmentProfile as any,
      spendingPriorities: interests.includes("food") ? ["gastronomy"] : ["tours"]
    },
    swipedRightIds: [],
    swipedLeftIds: [],
    interactions: []
  };
}

export function migrateTrip(profile: UserProfile): TripContext {
  return {
    id: `trip-${Date.now().toString().slice(-4)}`,
    destination: "Nova York",
    startDate: profile.startDate,
    endDate: new Date(new Date(profile.startDate).getTime() + (profile.days - 1) * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    days: profile.days,
    hasFlightBought: false,
    flightInfo: {},
    boardingPass: {
      currentStep: "destination_selected",
      ticketNumber: `VF-${Date.now().toString().slice(-4)}`,
      seatNumber: "12A",
      gate: "G-4",
      boardingGroup: "Group A",
      isUnlocked: { passenger: true, destination: true, dates: true, atmosphere: true }
    },
    atmosphere: AtmosphereEngine.getAtmosphere("Nova York", profile.startDate)
  };
}

export class AtmosphereEngine {
  static getAtmosphere(destination: string, dateStr: string): TravelAtmosphere {
    const month = new Date(dateStr).getMonth();
    
    if (destination.toLowerCase().includes("york") && (month === 11 || month === 0 || month === 1)) {
      return {
        theme: "winter_magic",
        title: "Winter Magic",
        primaryColor: "#4A7BB0",
        textColor: "#FFFFFF",
        backgroundImage: "",
        greetings: ["Bem-vindo à Nova York sob a magia do inverno!"]
      };
    }

    return {
      theme: "classic_default",
      title: "Classic Voyage",
      primaryColor: "#C5A85C",
      textColor: "#FFFFFF",
      backgroundImage: "",
      greetings: ["Bem-vindo à sua jornada dos sonhos!"]
    };
  }
}

export function getTravelState(): TravelState {
  const saved = localStorage.getItem("viagem_dos_sonhos_state");
  const attractions = getStoredAttractions();

  const DEFAULT_PROFILE: UserProfile = {
    style: "couple",
    interests: ["culture", "food", "views", "classic"],
    budget: "$$",
    days: 4,
    startDate: new Date().toISOString().split("T")[0],
    passengerName: "Viajante",
    personaAffinity: { explorador_visual: 0.7, curador_experiencias: 0.8, descobridor: 0.4, aproveitador: 0.5, slow_traveler: 0.6 },
    tagAffinity: {},
    pace: "equilibrado",
    companionship: "couple",
    transport: "metro",
    financial: { investmentProfile: "balanced", spendingPriorities: ["tours", "gastronomy"] },
    swipedRightIds: [],
    swipedLeftIds: [],
    interactions: []
  };

  const DEFAULT_TRIP: TripContext = {
    id: "trip-default",
    destination: "Nova York",
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date(new Date().getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    days: 4,
    hasFlightBought: false,
    flightInfo: {},
    boardingPass: {
      currentStep: "empty",
      ticketNumber: "VF-2026-NY",
      seatNumber: "12A",
      gate: "GATE B3",
      boardingGroup: "Group A",
      isUnlocked: { passenger: false, destination: false, dates: false, atmosphere: false }
    },
    atmosphere: {
      theme: "classic_default",
      title: "Classic Voyage",
      primaryColor: "#C5A85C",
      textColor: "#FFFFFF",
      backgroundImage: "",
      greetings: ["Bem-vindo à sua jornada!"]
    }
  };

  if (saved) {
    try {
      const state = JSON.parse(saved) as any;
      state.profile = migrateProfile(state.profile);
      if (!state.trip) {
        state.trip = migrateTrip(state.profile);
      }
      return state as TravelState;
    } catch (e) {
      console.error("Erro ao carregar estado", e);
    }
  }

  const defaultItinerary: ItineraryDay[] = [
    { dayNumber: 1, attractions: [ attractions.find(a => a.id === "central-park")!, attractions.find(a => a.id === "the-met")!, attractions.find(a => a.id === "top-of-the-rock")! ].filter(Boolean) },
    { dayNumber: 2, attractions: [ attractions.find(a => a.id === "high-line")!, attractions.find(a => a.id === "chelsea-market")!, attractions.find(a => a.id === "moma")! ].filter(Boolean) },
    { dayNumber: 3, attractions: [ attractions.find(a => a.id === "statue-liberty")!, attractions.find(a => a.id === "brooklyn-bridge")!, attractions.find(a => a.id === "joes-pizza")! ].filter(Boolean) },
    { dayNumber: 4, attractions: [ attractions.find(a => a.id === "soho-shopping")!, attractions.find(a => a.id === "katzs-delicatessen")!, attractions.find(a => a.id === "broadway-show")! ].filter(Boolean) }
  ];

  const state: TravelState = {
    profile: DEFAULT_PROFILE,
    trip: DEFAULT_TRIP,
    itinerary: defaultItinerary,
    checklist: [
      { id: "1", text: "Emitir o visto americano ou autorização ESTA", done: true },
      { id: "2", text: "Contratar seguro viagem internacional", done: false },
      { id: "3", text: "Comprar chip de internet eSIM", done: false },
      { id: "4", text: "Reservar ingressos antecipados para os mirantes", done: false },
      { id: "5", text: "Trocar dólares em espécie ou carregar cartão global", done: false }
    ],
    customExpenses: [
      { id: "e1", category: "Hospedagem", amountUSD: 800, description: "Hotel em Midtown Manhattan" },
      { id: "e2", category: "Passagens Aéreas", amountUSD: 1200, description: "Voo ida e volta para casal" },
      { id: "e3", category: "Alimentação", amountUSD: 400, description: "Estimativa de refeições diárias" },
      { id: "e4", category: "Transporte", amountUSD: 70, description: "MetroCard ilimitado de 7 dias" }
    ]
  };

  localStorage.setItem("viagem_dos_sonhos_state", JSON.stringify(state));
  return state;
}

export function saveTravelState(state: TravelState) {
  localStorage.setItem("viagem_dos_sonhos_state", JSON.stringify(state));
}

// ==========================================
// EXPERIENCE MATCHING ENGINE (PURE DOMAIN)
// ==========================================
export class ExperienceMatchingEngine {
  static evaluateRestrictions(
    experience: TravelExperience,
    profile: UserProfile
  ): RestrictionEvaluation {
    const blockers: RestrictionReason[] = [];
    const warnings: RestrictionReason[] = [];
    const information: RestrictionReason[] = [];

    const age = profile.passengerAge;
    const hasChildren = profile.hasChildren; // undefined se não preenchido
    const groupSize = profile.groupSize; // undefined se não preenchido
    const wheelchair = profile.wheelchairRequired; // undefined se não preenchido

    // 1. Min Age
    if (experience.min_age !== undefined && experience.min_age !== null) {
      if (age !== undefined && age < experience.min_age) {
        blockers.push({ code: "BELOW_MINIMUM_AGE", message: `Idade mínima exigida é ${experience.min_age} anos.` });
      } else if (age === undefined) {
        information.push({ code: "AGE_UNKNOWN", message: `Experiência exige idade mínima de ${experience.min_age} anos.` });
      }
    }

    // 2. Adult Only
    if (experience.adult_only === true) {
      if (hasChildren === true) {
        blockers.push({ code: "ADULT_ONLY", message: "Experiência exclusiva para adultos, incompatível com viagem com crianças." });
      } else if (hasChildren === undefined) {
        information.push({ code: "CHILDREN_UNKNOWN", message: "Experiência exclusiva para adultos. Confirme se há crianças no grupo." });
      }
    }

    // 3. Family with children allowed
    if (experience.family_with_children_allowed === false) {
      if (hasChildren === true) {
        blockers.push({ code: "CHILDREN_NOT_ALLOWED", message: "Crianças não são permitidas nesta experiência." });
      } else if (hasChildren === undefined) {
        information.push({ code: "CHILDREN_UNKNOWN", message: "Crianças não são permitidas. Confirme se há crianças no grupo." });
      }
    }

    // 4. Companion Required
    if (experience.requires_companion === true) {
      if (groupSize === 1) {
        blockers.push({ code: "COMPANION_REQUIRED", message: "Esta experiência exige pelo menos um acompanhante." });
      } else if (groupSize === undefined && profile.style === "solo") {
        warnings.push({ code: "COMPANION_REQUIRED_WARN", message: "Esta experiência exige acompanhante. Você informou viagem solo, mas não definiu o tamanho do grupo." });
      }
    }

    // 5. Minimum Group Size
    if (experience.minimum_group_size !== undefined && experience.minimum_group_size !== null) {
      if (groupSize !== undefined && groupSize < experience.minimum_group_size) {
        blockers.push({ code: "GROUP_TOO_SMALL", message: `Tamanho mínimo do grupo é de ${experience.minimum_group_size} pessoas.` });
      } else if (groupSize === undefined) {
        information.push({ code: "GROUP_SIZE_UNKNOWN", message: `Tamanho mínimo do grupo é de ${experience.minimum_group_size} pessoas.` });
      }
    }

    // 6. Maximum Group Size
    if (experience.maximum_group_size !== undefined && experience.maximum_group_size !== null) {
      if (groupSize !== undefined && groupSize > experience.maximum_group_size) {
        blockers.push({ code: "GROUP_TOO_LARGE", message: `Tamanho máximo do grupo é de ${experience.maximum_group_size} pessoas.` });
      }
    }

    // 7. Wheelchair Accessible
    if (wheelchair === true) {
      if (experience.wheelchair_accessible === false) {
        blockers.push({ code: "NOT_WHEELCHAIR_ACCESSIBLE", message: "Local não possui acessibilidade para cadeira de rodas." });
      } else if (experience.wheelchair_accessible === null || experience.wheelchair_accessible === undefined) {
        warnings.push({ code: "WHEELCHAIR_ACCESS_UNKNOWN", message: "Não há confirmação se o local possui acessibilidade para cadeira de rodas." });
      }
    }

    // 8. Stairs Required
    if (experience.stairs_required === true) {
      const msg = "O percurso exige uso de escadas.";
      if (wheelchair === true) blockers.push({ code: "STAIRS_REQUIRED_BLOCK", message: msg });
      else warnings.push({ code: "STAIRS_REQUIRED", message: msg });
    }

    // 9. Accessibility Notes
    if (experience.accessibility_notes) {
      information.push({ code: "ACCESSIBILITY_NOTE", message: experience.accessibility_notes });
    }

    // 10. Provenance checks
    if (experience.restrictions_provenance) {
      let isVerified = false;
      const prov: any = experience.restrictions_provenance;
      Object.values(prov).forEach((entry: any) => {
         if (entry?.verified_by) isVerified = true;
      });
      if (!isVerified) {
        information.push({ code: "UNVERIFIED_RESTRICTIONS", message: "As restrições de acessibilidade baseiam-se em informações não oficiais." });
      }
    }

    return {
      allowed: blockers.length === 0,
      blockers,
      warnings,
      information
    };
  }

  static calculateScore(
    experience: TravelExperience,
    context: RecommendationContext
  ): RecommendedExperience {
    const { profile, trip, weights } = context;
    const reasons: string[] = [];
    const warnings: string[] = [];

    // 1. PERSONA MATCH (0.0 a 1.0)
    let personaScore = 0;
    if (experience.personaWeights && profile.personaAffinity) {
      let weightSum = 0;
      let userSum = 0;
      for (const key in experience.personaWeights) {
        const p = key as TravelerPersona;
        const eWeight = experience.personaWeights[p] || 0;
        const uAff = profile.personaAffinity[p] || 0;
        personaScore += eWeight * uAff;
        weightSum += eWeight;
        userSum += uAff;
      }
      if (weightSum > 0 && userSum > 0) {
        personaScore = personaScore / Math.min(weightSum, userSum);
      }
    }
    personaScore = Math.max(0, Math.min(1, personaScore));
    if (personaScore > 0.75) {
      reasons.push("Alinhado com o seu perfil psicográfico");
    }

    // 2. TAG MATCH (0.0 a 1.0)
    let tagScore = 0.5;
    if (experience.tags && experience.tags.length > 0) {
      let sum = 0;
      let count = 0;
      experience.tags.forEach(tag => {
        const aff = profile.tagAffinity[tag] !== undefined ? profile.tagAffinity[tag] : 0.5;
        sum += aff;
        count++;
      });
      tagScore = sum / count;
    }
    if (tagScore > 0.75) {
      reasons.push("Compatível com seu histórico de interesses");
    }

    // 3. SEASON MATCH (0.0 a 1.0)
    let seasonScore = 0.7;
    const tripSeason = trip.atmosphere.theme;
    const mappingSeason: Record<string, string> = {
      winter_magic: "winter",
      romantic_spring: "spring",
      sunny_summer: "summer",
      golden_autumn: "autumn"
    };
    const currentSeasonStr = mappingSeason[tripSeason] || "all";

    if (experience.recommendedSeasons) {
      if (experience.recommendedSeasons.includes("all") || experience.recommendedSeasons.includes(currentSeasonStr as any)) {
        seasonScore = 1.0;
        reasons.push("Excelente opção para esta estação do ano");
      } else if (!experience.isIndoor && currentSeasonStr === "winter") {
        seasonScore = 0.25;
        warnings.push("Atividade ao ar livre recomendada para clima quente");
      } else {
        seasonScore = 0.6;
      }
    }

    // 4. BUDGET MATCH (0.0 a 1.0)
    let budgetScore = 1.0;
    const budgetMap: Record<string, number> = { "$": 1, "$$": 2, "$$$": 3, "$$$$": 4 };
    const userBudgetLevel = budgetMap[profile.budget] || 2;
    const expBudgetLevel = budgetMap[experience.costLevel] || 2;

    if (userBudgetLevel < expBudgetLevel) {
      const diff = expBudgetLevel - userBudgetLevel;
      if (diff === 1) {
        budgetScore = 0.6;
        warnings.push("Experiência com custo ligeiramente acima do seu orçamento usual");
      } else {
        budgetScore = 0.2;
        warnings.push("Custo significativamente acima do seu perfil de gastos");
      }
    } else {
      budgetScore = 1.0;
      if (experience.costLevel === "$") {
        reasons.push("Ótima alternativa para economizar no orçamento");
      }
    }

    // 5. COMPANIONSHIP MATCH (0.0 a 1.0)
    let companionshipScore = 0.7;
    let compKey: "couple" | "family" | "solo" | "friends" = "friends";
    if (profile.companionship === "solo") compKey = "solo";
    else if (profile.companionship === "couple" || profile.companionship === "romantic") compKey = "couple";
    else if (profile.companionship === "family") compKey = "family";
    else compKey = "friends";

    if (experience.companionshipCompatibility && experience.companionshipCompatibility[compKey] !== undefined) {
      companionshipScore = experience.companionshipCompatibility[compKey];
    }
    if (companionshipScore > 0.85) {
      if (compKey === "couple") reasons.push("Perfeito para uma viagem a dois");
      else if (compKey === "family") reasons.push("Muito bem recomendado para famílias");
      else if (compKey === "solo") reasons.push("Altamente recomendado para viajantes solo");
    }

    // 6. EXCLUSIVITY & PREFERENCES
    if (experience.exclusivityLevel === "exclusive" || experience.exclusivityLevel === "invite_only") {
      if (profile.financial.investmentProfile === "unique_experiences" || profile.financial.investmentProfile === "no_limits") {
        reasons.push("Uma experiência VIP altamente exclusiva");
      } else {
        warnings.push("Experiência de alto padrão com acesso restrito/reservado");
      }
    }
    if (experience.reservationRequired) {
      warnings.push("Necessita de reserva antecipada");
    }

    // PESOS GLOBAIS DO ENGINEWEIGHTS (Sem hardcoding na fórmula)
    const wPersona = weights.personaAffinity;
    const wTag = weights.tagAffinity;
    const wSeason = weights.seasonalMatch;
    const wBudget = weights.budgetCompatibility;
    const wCompanionship = weights.companionshipMatch;

    const totalWeight = wPersona + wTag + wSeason + wBudget + wCompanionship;
    const rawScore = 
      (personaScore * wPersona +
       tagScore * wTag +
       seasonScore * wSeason +
       budgetScore * wBudget +
       companionshipScore * wCompanionship) / (totalWeight || 1);

    let finalScore = Math.round(rawScore * 1000);

    // Sobrescritas por Swipes
    if (profile.swipedRightIds && profile.swipedRightIds.includes(experience.id)) {
      finalScore = 10000;
    } else if (profile.swipedLeftIds && profile.swipedLeftIds.includes(experience.id)) {
      finalScore = -10000;
    }

    // Nível de Confiança
    const interactionCount = (profile.swipedRightIds?.length || 0) + (profile.swipedLeftIds?.length || 0);
    const confidence = Math.min(0.95, 0.5 + (interactionCount * 0.05));

    // Storytelling dinâmico
    let humanJustification = "";
    if (finalScore >= 10000) {
      humanJustification = `Esta experiência foi selecionada e favoritada por você no Tinder de Viagens.`;
    } else if (finalScore <= -10000) {
      humanJustification = `Experiência removida do seu roteiro por decisão de swipe.`;
    } else {
      const positiveTraits: string[] = [];
      if (personaScore > 0.75) positiveTraits.push("combina com sua vibe");
      if (companionshipScore > 0.85) {
        if (compKey === "couple") positiveTraits.push("é fantástica para curtir a dois");
        else if (compKey === "family") positiveTraits.push("é ideal para aproveitar com a família");
        else positiveTraits.push("se encaixa muito bem com seu grupo de viagem");
      }
      if (seasonScore > 0.8) {
        if (currentSeasonStr === "winter") positiveTraits.push("é uma ótima pedida para o inverno nova-iorquino");
        else positiveTraits.push("combina demais com o clima atual");
      }

      if (positiveTraits.length > 0) {
        humanJustification = `Escolhemos o ${experience.name} porque ele ${positiveTraits.join(", ")}. Uma curadoria pensada para seu momento.`;
      } else {
        humanJustification = `Recomendamos o ${experience.name} por possuir boa sinergia de localização e custo-benefício para seu estilo.`;
      }
    }

    // Aplicação das Restrições e Bloqueios
    const restrictions = ExperienceMatchingEngine.evaluateRestrictions(experience, profile);
    
    // Se não for permitido (blocker), o match score cai para 0 e a experiência não é recomendada
    if (!restrictions.allowed) {
      finalScore = 0;
      restrictions.blockers.forEach(b => warnings.push(b.message));
    } else {
      restrictions.warnings.forEach(w => warnings.push(w.message));
      restrictions.information.forEach(i => warnings.push(i.message));
    }

    return {
      experience,
      finalScore: Math.round(finalScore * 100),
      confidence: Math.round(confidence * 100),
      explanation: {
        reasons,
        warnings,
        humanJustification: ExperienceMatchingEngine.generateHumanJustification(reasons, warnings, Math.round(finalScore * 100))
      },
      restrictions
    };
  }

  static generateHumanJustification(reasons: string[], warnings: string[], score: number): string {
    if (score >= 9000) return "Esta experiência foi selecionada e favoritada por você.";
    if (score <= -9000) return "Experiência removida do seu roteiro por decisão manual.";
    if (reasons.length > 0) return `Escolhemos esta experiência porque: ${reasons.join(", ")}.`;
    return "Recomendamos esta experiência por possuir boa sinergia de localização e custo-benefício.";
  }

  static rankExperiences(
    experiences: TravelExperience[],
    context: RecommendationContext
  ): RecommendedExperience[] {
    return experiences
      .map(exp => this.calculateScore(exp, context))
      .sort((a, b) => b.finalScore - a.finalScore);
  }

  // Aprendizado Comportamental Suave (EMA)
  static processSwipe(
    signal: UserPreferenceSignal,
    profile: UserProfile,
    weights: EngineWeights
  ): UserProfile {
    const newProfile = { ...profile };
    newProfile.tagAffinity = { ...profile.tagAffinity };
    newProfile.personaAffinity = { ...profile.personaAffinity };

    const experience = DEFAULT_ATTRACTIONS.find(a => a.id === signal.experienceId);
    if (!experience) return newProfile;

    const L = weights.behavioralLearning || 0.05;

    // EMA para tagAffinity
    if (experience.tags) {
      experience.tags.forEach(tag => {
        const currentAff = newProfile.tagAffinity[tag] !== undefined ? newProfile.tagAffinity[tag] : 0.5;
        const targetValue = signal.action === "like" || signal.action === "save" ? 1.0 : 0.0;
        newProfile.tagAffinity[tag] = parseFloat(
          (currentAff * (1 - L) + targetValue * L).toFixed(4)
        );
      });
    }

    // EMA extremamente suave para PersonaAffinity (Dampened Update)
    if (experience.personaWeights && newProfile.personaAffinity) {
      const Lp = L / 2;
      for (const key in experience.personaWeights) {
        const p = key as TravelerPersona;
        const eWeight = experience.personaWeights[p] || 0;
        const uAff = newProfile.personaAffinity[p] || 0.5;
        newProfile.personaAffinity[p] = parseFloat(
          (uAff * (1 - Lp) + eWeight * Lp).toFixed(4)
        );
      }
    }

    // Registra a interação no histórico
    if (!newProfile.interactions) {
      newProfile.interactions = [];
    }
    newProfile.interactions.push({
      tripId: "active-trip",
      attractionId: signal.experienceId,
      action: signal.action === "like" || signal.action === "save" ? "liked" : "disliked",
      timestamp: signal.timestamp
    });

    // Listas de Swipes para exclusão / atração determinística
    if (signal.action === "like" || signal.action === "save") {
      if (!newProfile.swipedRightIds.includes(signal.experienceId)) {
        newProfile.swipedRightIds.push(signal.experienceId);
      }
      newProfile.swipedLeftIds = newProfile.swipedLeftIds.filter(id => id !== signal.experienceId);
    } else if (signal.action === "dislike") {
      if (!newProfile.swipedLeftIds.includes(signal.experienceId)) {
        newProfile.swipedLeftIds.push(signal.experienceId);
      }
      newProfile.swipedRightIds = newProfile.swipedRightIds.filter(id => id !== signal.experienceId);
    }

    return newProfile;
  }

  // Suite de diagnósticos offline (executável localmente)
  static runDiagnostics(): string {
    const mockTrip: TripContext = {
      id: "trip-test",
      destination: "Nova York",
      startDate: "2026-12-25",
      endDate: "2026-12-29",
      days: 4,
      hasFlightBought: false,
      boardingPass: {
        currentStep: "destination_selected",
        ticketNumber: "VF-TEST",
        seatNumber: "12A",
        gate: "GATE B3",
        boardingGroup: "Group A",
        isUnlocked: { passenger: true, destination: true, dates: true, atmosphere: true }
      },
      atmosphere: {
        theme: "winter_magic",
        title: "Winter Magic",
        primaryColor: "#4A7BB0",
        textColor: "#FFFFFF",
        backgroundImage: "",
        greetings: []
      }
    };

    const mockWeights = DEFAULT_ENGINE_WEIGHTS;

    // Cenário 1: Viajante Econômico Solo em busca de Natureza
    const profileEconomicSolo: UserProfile = {
      style: "solo",
      interests: ["nature", "classic"],
      budget: "$",
      days: 4,
      startDate: "2026-12-25",
      passengerName: "Bob Econômico",
      personaAffinity: { explorador_visual: 0.4, curador_experiencias: 0.2, descobridor: 0.9, aproveitador: 0.5, slow_traveler: 0.8 },
      tagAffinity: {},
      pace: "equilibrado",
      companionship: "solo",
      transport: "metro",
      financial: { investmentProfile: "save_explore", spendingPriorities: ["tours"] },
      swipedRightIds: [],
      swipedLeftIds: [],
      interactions: []
    };

    // Cenário 2: Casal Premium/Luxo (Rooftops, Fine Dining)
    const profilePremiumCouple: UserProfile = {
      style: "couple",
      interests: ["food", "views"],
      budget: "$$$$",
      days: 4,
      startDate: "2026-12-25",
      passengerName: "Alice & Carlos Premium",
      personaAffinity: { explorador_visual: 0.9, curador_experiencias: 1.0, descobridor: 0.3, aproveitador: 0.7, slow_traveler: 0.5 },
      tagAffinity: {},
      pace: "relaxado",
      companionship: "couple",
      transport: "uber",
      financial: { investmentProfile: "no_limits", spendingPriorities: ["gastronomy", "hotels"] },
      swipedRightIds: [],
      swipedLeftIds: [],
      interactions: []
    };

    const ctxEconomic = { profile: profileEconomicSolo, trip: mockTrip, weights: mockWeights, currentDate: "2026-12-25" };
    const ctxPremium = { profile: profilePremiumCouple, trip: mockTrip, weights: mockWeights, currentDate: "2026-12-25" };

    const rankEco = this.rankExperiences(DEFAULT_ATTRACTIONS, ctxEconomic);
    const rankPre = this.rankExperiences(DEFAULT_ATTRACTIONS, ctxPremium);

    let output = "=== DIAGNÓSTICO DO ENGINE DE CURADORIA ===\n\n";

    output += `VIAJANTE: ${profileEconomicSolo.passengerName} (Orçamento $, Solo, Foco Natureza/Slow)\n`;
    output += "TOP 3 RECOMENDAÇÕES:\n";
    rankEco.slice(0, 3).forEach((r, i) => {
      output += `${i+1}. ${r.experience.name} | Score: ${r.finalScore} | Justificativa: ${r.explanation.humanJustification}\n`;
    });
    output += "\n";

    output += `VIAJANTE: ${profilePremiumCouple.passengerName} (Orçamento $$$$, Casal, Foco Luxo/Visual)\n`;
    output += "TOP 3 RECOMENDAÇÕES:\n";
    rankPre.slice(0, 3).forEach((r, i) => {
      output += `${i+1}. ${r.experience.name} | Score: ${r.finalScore} | Justificativa: ${r.explanation.humanJustification}\n`;
    });

    return output;
  }
}

// ==========================================
// ROTEIRO INTELIGENTE (INTEGRADO À ENGINE)
// ==========================================
export function generateSmartItinerary(profile: UserProfile, catalog?: TravelExperience[]): ItineraryDay[] {
  const experiences = catalog || getStoredAttractions();

  // 1. Constrói o contexto dinâmico da viagem a partir do perfil do viajante
  const trip = migrateTrip(profile);
  const context: RecommendationContext = {
    profile,
    trip,
    weights: DEFAULT_ENGINE_WEIGHTS,
    currentDate: profile.startDate || new Date().toISOString().split("T")[0]
  };

  // 2. Classifica e ordena todas as experiências disponíveis no catálogo
  const rankedResults = ExperienceMatchingEngine.rankExperiences(experiences, context);

  // Filtra as experiências ativas (não rejeitadas por swipe left) e não bloqueadas por restrições
  const availableRanked = rankedResults.filter(r => r.finalScore > -9000 && r.restrictions?.allowed !== false);

  // 3. Auditoria de Log Temporário para calibração fina da inteligência
  console.log(`=== [AUDITORIA] GERAÇÃO DE ROTEIRO PARA: ${profile.passengerName} ===`);
  availableRanked.forEach((r, idx) => {
    console.log(
      `Rank ${idx + 1}: ${r.experience.name} | Score: ${r.finalScore} | Confiança: ${r.confidence.toFixed(2)} | ` +
      `Fatores: [${r.explanation.reasons.join(", ")}] | Alertas: [${r.explanation.warnings.join(", ")}] | ` +
      `Justificativa: "${r.explanation.humanJustification}"`
    );
  });
  console.log(`================================================================`);

  const itinerary: ItineraryDay[] = [];
  
  // Clone array to modify and schedule
  const unassigned = [...availableRanked];

  for (let d = 1; d <= profile.days; d++) {
    const dayRecommendations: RecommendedExperience[] = [];
    const dayAttractionsLegacy: TravelExperience[] = [];
    
    const dayDate = new Date(new Date(profile.startDate || new Date()).getTime() + (d - 1) * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    
    let currentDayMinutes = 9 * 60; // Start at 09:00 AM
    const maxMinutesPerDay = 22 * 60; // End at 22:00 (10 PM)
    
    let previousExp: TravelExperience | null = null;
    let previousEndTime: string | null = null;

    // We aim for 3 experiences per day
    while (dayRecommendations.length < 3 && unassigned.length > 0 && currentDayMinutes < maxMinutesPerDay) {
      
      let selectedIndex = -1;
      let logisticsRes: import("../lib/intelligence/logistics").LogisticsEvaluation | null = null;
      let proposedStart = "";
      let durationHours = 0;
      
      // Look for the highest ranked experience that fits logistically
      for (let i = 0; i < unassigned.length; i++) {
        const candidate = unassigned[i];
        durationHours = candidate.experience.durationHours || 2;
        
        let transitMins: number | null = null;
        if (previousExp) {
          if (previousExp.transit_options_origin && previousExp.transit_options_origin.length > 0) {
            const option = previousExp.transit_options_origin.find(o => o.destination_experience_id === candidate.experience.id);
            if (option && option.duration_minutes !== undefined && option.duration_minutes !== null) {
              transitMins = option.duration_minutes;
            }
          }
        }
        const effectiveTransitMins = transitMins ?? 0; // Para calcular arrivalMins usamos 0 se desconhecido, mas avaliamos como nulo
        const arrivalMins = currentDayMinutes + effectiveTransitMins;
        
        proposedStart = `${String(Math.floor(arrivalMins / 60)).padStart(2, '0')}:${String(arrivalMins % 60).padStart(2, '0')}`;
        const windowEnd = `${String(Math.floor(maxMinutesPerDay / 60)).padStart(2, '0')}:${String(maxMinutesPerDay % 60).padStart(2, '0')}`;
        
        const evalRes = LogisticsEngine.evaluateFeasibility(
          dayDate,
          proposedStart,
          durationHours,
          candidate.experience.operating_hours,
          candidate.experience.operating_hour_exceptions,
          previousExp ? transitMins : null,
          windowEnd,
          previousEndTime
        );
        
        if (evalRes.feasible) {
           selectedIndex = i;
           logisticsRes = evalRes;
           break;
        }
      }
      
      if (selectedIndex !== -1 && logisticsRes) {
        const selected = unassigned.splice(selectedIndex, 1)[0];
        
        let transitMins: number | null = null;
        if (previousExp) {
          if (previousExp.transit_options_origin && previousExp.transit_options_origin.length > 0) {
            const option = previousExp.transit_options_origin.find(o => o.destination_experience_id === selected.experience.id);
            if (option && option.duration_minutes !== undefined && option.duration_minutes !== null) {
              transitMins = option.duration_minutes;
            }
          }
        }
        const effectiveTransitMins = transitMins ?? 0;
        const arrivalMins = currentDayMinutes + effectiveTransitMins;
        const endMins = arrivalMins + (durationHours * 60);
        
        const plannedEndTime = `${String(Math.floor(endMins / 60)).padStart(2, '0')}:${String(endMins % 60).padStart(2, '0')}`;
        
        selected.experience = {
          ...selected.experience,
          plannedStartTime: proposedStart,
          plannedEndTime: plannedEndTime,
          logisticsEvaluation: logisticsRes
        };
        
        dayRecommendations.push(selected);
        dayAttractionsLegacy.push(selected.experience);
        
        currentDayMinutes = endMins;
        previousExp = selected.experience;
        previousEndTime = plannedEndTime;
      } else {
        // No feasible experience found for the rest of this day's time window, break out to next day
        break;
      }
    }
    

    // Fallback determinístico para preencher dias extras (viagens longas ou catálogo curto):
    // Reinicia o ponteiro circulando pelas experiências recomendadas do usuário,
    // garantindo que não duplicamos a mesma experiência NO MESMO DIA.
    if (dayRecommendations.length < 3 && availableRanked.length > 0) {
      let fallbackIndex = 0;
      while (dayRecommendations.length < 3 && currentDayMinutes < maxMinutesPerDay) {
        const fallbackRec = availableRanked[fallbackIndex % availableRanked.length];
        fallbackIndex++;
        
        if (fallbackIndex > availableRanked.length * 2) {
          break;
        }
        
        if (!dayRecommendations.some(r => r.experience.id === fallbackRec.experience.id)) {
          const durationHours = fallbackRec.experience.durationHours || 2;
          let transitMins: number | null = null;
          if (previousExp) {
            if (previousExp.transit_options_origin && previousExp.transit_options_origin.length > 0) {
              const option = previousExp.transit_options_origin.find(o => o.destination_experience_id === fallbackRec.experience.id);
              if (option && option.duration_minutes !== undefined && option.duration_minutes !== null) {
                transitMins = option.duration_minutes;
              }
            }
          }
          const effectiveTransitMins = transitMins ?? 0;
          const arrivalMins = currentDayMinutes + effectiveTransitMins;
          const windowEnd = `${String(Math.floor(maxMinutesPerDay / 60)).padStart(2, '0')}:${String(maxMinutesPerDay % 60).padStart(2, '0')}`;
          
          const proposedStart = `${String(Math.floor(arrivalMins / 60)).padStart(2, '0')}:${String(arrivalMins % 60).padStart(2, '0')}`;
          
          const evalRes = LogisticsEngine.evaluateFeasibility(
            dayDate,
            proposedStart,
            durationHours,
            fallbackRec.experience.operating_hours,
            fallbackRec.experience.operating_hour_exceptions,
            previousExp ? transitMins : null,
            windowEnd,
            previousEndTime
          );
          
          if (!evalRes.feasible) {
            continue;
          }
          
          const endMins = arrivalMins + (durationHours * 60);
          const plannedEndTime = `${String(Math.floor(endMins / 60)).padStart(2, '0')}:${String(endMins % 60).padStart(2, '0')}`;

          const clonedRec = { ...fallbackRec };
          clonedRec.experience = {
            ...clonedRec.experience,
            plannedStartTime: proposedStart,
            plannedEndTime: plannedEndTime,
            logisticsEvaluation: evalRes
          };

          dayRecommendations.push(clonedRec);
          dayAttractionsLegacy.push(clonedRec.experience);
          
          currentDayMinutes = endMins;
          previousExp = clonedRec.experience;
          previousEndTime = plannedEndTime;
        }
      }
    }

    itinerary.push({
      dayNumber: d,
      attractions: dayAttractionsLegacy, // Compatibilidade visual (Dashboard legado)
      recommendations: dayRecommendations // Nova camada rica com justificativas e scores
    });
  }

  return itinerary;
}