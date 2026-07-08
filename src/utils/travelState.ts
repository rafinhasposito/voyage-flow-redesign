"use client";

export interface Attraction {
  id: string;
  name: string;
  category: "culture" | "food" | "views" | "nature" | "shopping" | "classic";
  categoryLabel: string;
  description: string;
  image: string;
  costLevel: "$" | "$$" | "$$$" | "$$$$";
  costUSD: number;
  neighborhood: string;
  matchScore: number;
  durationHours: number;
  bestTime: string;
  affiliateLink?: string;
}

export interface UserProfile {
  style: "solo" | "couple" | "family" | "friends";
  interests: string[];
  budget: "$" | "$$" | "$$$" | "$$$$";
  days: number;
  startDate: string;
}

export interface ItineraryDay {
  dayNumber: number;
  attractions: Attraction[];
}

export interface TravelState {
  profile: UserProfile;
  itinerary: ItineraryDay[];
  checklist: { id: string; text: string; done: boolean }[];
  customExpenses: { id: string; category: string; amountUSD: number; description: string }[];
}

export const DEFAULT_ATTRACTIONS: Attraction[] = [
  {
    id: "central-park",
    name: "Central Park & Bethesda Terrace",
    category: "nature",
    categoryLabel: "Natureza & Parques",
    description: "O coração verde de Manhattan. Perfeito para uma caminhada matinal, piquenique ou passeio de barco a remo.",
    image: "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=600&q=80",
    costLevel: "$",
    costUSD: 0,
    neighborhood: "Midtown / Upper Side",
    matchScore: 98,
    durationHours: 3,
    bestTime: "Manhã",
    affiliateLink: "https://www.getyourguide.com/new-york-l57/central-park-bike-tour-tickets-r123456.html"
  },
  {
    id: "the-met",
    name: "The Metropolitan Museum of Art (The Met)",
    category: "culture",
    categoryLabel: "Arte & Cultura",
    description: "Um dos maiores e melhores museus de arte do mundo, cobrindo mais de 5.000 anos de cultura global.",
    image: "https://images.unsplash.com/photo-1601887389937-0b02c26b6c3c?w=600&q=80",
    costLevel: "$$",
    costUSD: 30,
    neighborhood: "Upper East Side",
    matchScore: 95,
    durationHours: 4,
    bestTime: "Tarde",
    affiliateLink: "https://www.getyourguide.com/new-york-l57/met-museum-priority-ticket-tickets-r234567.html"
  },
  {
    id: "top-of-the-rock",
    name: "Top of the Rock Observation Deck",
    category: "views",
    categoryLabel: "Vistas & Mirantes",
    description: "A melhor vista panorâmica de Nova York, incluindo o Central Park e o imponente Empire State Building.",
    image: "https://images.unsplash.com/photo-1534430480872-3498386e7856?w=600&q=80",
    costLevel: "$$$",
    costUSD: 45,
    neighborhood: "Midtown",
    matchScore: 94,
    durationHours: 2,
    bestTime: "Pôr do sol",
    affiliateLink: "https://www.getyourguide.com/new-york-l57/top-of-the-rock-skip-the-line-tickets-r345678.html"
  },
  {
    id: "high-line",
    name: "The High Line Park",
    category: "nature",
    categoryLabel: "Natureza & Parques",
    description: "Um parque linear suspenso construído em uma antiga linha ferroviária de carga, cercado de arte e arquitetura.",
    image: "https://images.unsplash.com/photo-1516912403163-f782a1593817?w=600&q=80",
    costLevel: "$",
    costUSD: 0,
    neighborhood: "Chelsea",
    matchScore: 92,
    durationHours: 2,
    bestTime: "Manhã"
  },
  {
    id: "chelsea-market",
    name: "Chelsea Market",
    category: "food",
    categoryLabel: "Gastronomia",
    description: "Um mercado gastronômico vibrante famoso por seus frutos do mar frescos, tacos artesanais e doces incríveis.",
    image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&q=80",
    costLevel: "$$",
    costUSD: 25,
    neighborhood: "Meatpacking District",
    matchScore: 89,
    durationHours: 1.5,
    bestTime: "Almoço"
  },
  {
    id: "brooklyn-bridge",
    name: "Travessia da Brooklyn Bridge",
    category: "classic",
    categoryLabel: "Clássicos Imperdíveis",
    description: "Caminhe pela icônica ponte suspensa de madeira e aço ao entardecer para fotos inesquecíveis do skyline.",
    image: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=600&q=80",
    costLevel: "$",
    costUSD: 0,
    neighborhood: "DUMBO / Financial District",
    matchScore: 96,
    durationHours: 2,
    bestTime: "Fim de tarde"
  },
  {
    id: "summit-one",
    name: "SUMMIT One Vanderbilt",
    category: "views",
    categoryLabel: "Vistas & Mirantes",
    description: "Uma experiência imersiva de espelhos, arte e tecnologia com vistas deslumbrantes de Manhattan.",
    image: "https://images.unsplash.com/photo-1541185933-ef5d8ed016c2?w=600&q=80",
    costLevel: "$$$",
    costUSD: 48,
    neighborhood: "Midtown East",
    matchScore: 93,
    durationHours: 2,
    bestTime: "Tarde"
  },
  {
    id: "moma",
    name: "Museum of Modern Art (MoMA)",
    category: "culture",
    categoryLabel: "Arte & Cultura",
    description: "Lar de obras-primas como 'A Noite Estrelada' de Van Gogh e as 'Latinhas de Sopa Campbell' de Warhol.",
    image: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=600&q=80",
    costLevel: "$$",
    costUSD: 28,
    neighborhood: "Midtown",
    matchScore: 91,
    durationHours: 3,
    bestTime: "Manhã"
  },
  {
    id: "joes-pizza",
    name: "Joe's Pizza Greenwich Village",
    category: "food",
    categoryLabel: "Gastronomia",
    description: "A clássica fatia de pizza nova-iorquina de massa fina. Rápida, barata e amada por celebridades.",
    image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&q=80",
    costLevel: "$",
    costUSD: 5,
    neighborhood: "Greenwich Village",
    matchScore: 97,
    durationHours: 0.5,
    bestTime: "Noite"
  },
  {
    id: "katzs-delicatessen",
    name: "Katz's Delicatessen",
    category: "food",
    categoryLabel: "Gastronomia",
    description: "O sanduíche de pastrami mais famoso do mundo, servido generosamente desde 1888 no Lower East Side.",
    image: "https://images.unsplash.com/photo-1509722747041-616f39b57569?w=600&q=80",
    costLevel: "$$",
    costUSD: 32,
    neighborhood: "Lower East Side",
    matchScore: 92,
    durationHours: 1,
    bestTime: "Almoço"
  },
  {
    id: "le-bernardin",
    name: "Le Bernardin (3 Estrelas Michelin)",
    category: "food",
    categoryLabel: "Gastronomia",
    description: "Uma das experiências gastronômicas mais refinadas do mundo, especializada em frutos do mar de alta costura.",
    image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=600&q=80",
    costLevel: "$$$$",
    costUSD: 220,
    neighborhood: "Midtown West",
    matchScore: 88,
    durationHours: 3,
    bestTime: "Noite"
  },
  {
    id: "broadway-show",
    name: "Espetáculo da Broadway",
    category: "culture",
    categoryLabel: "Arte & Cultura",
    description: "Assista a musicais lendários como O Rei Leão, Wicked ou Hamilton nos teatros mais famosos do mundo.",
    image: "https://images.unsplash.com/photo-1514306191717-452ec28c7814?w=600&q=80",
    costLevel: "$$$$",
    costUSD: 120,
    neighborhood: "Theater District",
    matchScore: 95,
    durationHours: 3,
    bestTime: "Noite"
  },
  {
    id: "statue-liberty",
    name: "Estátua da Liberdade & Ellis Island",
    category: "classic",
    categoryLabel: "Clássicos Imperdíveis",
    description: "Pegue o balsa para visitar de perto o maior símbolo de liberdade e esperança da América.",
    image: "https://images.unsplash.com/photo-1605130284535-11dd9eedc58a?w=600&q=80",
    costLevel: "$$",
    costUSD: 25,
    neighborhood: "Battery Park (Partida)",
    matchScore: 90,
    durationHours: 4,
    bestTime: "Manhã"
  },
  {
    id: "soho-shopping",
    name: "Compras e Arquitetura no SoHo",
    category: "shopping",
    categoryLabel: "Compras",
    description: "Explore as ruas de paralelepípedos, edifícios de ferro fundido e as melhores boutiques de moda e design.",
    image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&q=80",
    costLevel: "$$$",
    costUSD: 50,
    neighborhood: "SoHo",
    matchScore: 87,
    durationHours: 3,
    bestTime: "Tarde"
  }
];

export function getStoredAttractions(): Attraction[] {
  const saved = localStorage.getItem("viagem_dos_sonhos_attractions");
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error("Erro ao carregar atrações", e);
    }
  }
  localStorage.setItem("viagem_dos_sonhos_attractions", JSON.stringify(DEFAULT_ATTRACTIONS));
  return DEFAULT_ATTRACTIONS;
}

export function saveStoredAttractions(attractions: Attraction[]) {
  localStorage.setItem("viagem_dos_sonhos_attractions", JSON.stringify(attractions));
}

const DEFAULT_PROFILE: UserProfile = {
  style: "couple",
  interests: ["culture", "food", "views", "classic"],
  budget: "$$",
  days: 4,
  startDate: new Date().toISOString().split("T")[0]
};

const DEFAULT_CHECKLIST = [
  { id: "1", text: "Emitir o visto americano ou autorização ESTA", done: true },
  { id: "2", text: "Contratar seguro viagem internacional", done: false },
  { id: "3", text: "Comprar chip de internet eSIM", done: false },
  { id: "4", text: "Reservar ingressos antecipados para os mirantes", done: false },
  { id: "5", text: "Trocar dólares em espécie ou carregar cartão global", done: false }
];

const DEFAULT_EXPENSES = [
  { id: "e1", category: "Hospedagem", amountUSD: 800, description: "Hotel em Midtown Manhattan" },
  { id: "e2", category: "Passagens Aéreas", amountUSD: 1200, description: "Voo ida e volta para casal" },
  { id: "e3", category: "Alimentação", amountUSD: 400, description: "Estimativa de refeições diárias" },
  { id: "e4", category: "Transporte", amountUSD: 70, description: "MetroCard ilimitado de 7 dias" }
];

export function getTravelState(): TravelState {
  const saved = localStorage.getItem("viagem_dos_sonhos_state");
  const attractions = getStoredAttractions();

  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error("Erro ao carregar estado", e);
    }
  }

  // Se não houver estado salvo, gera um roteiro padrão de 4 dias usando as atrações dinâmicas
  const defaultItinerary: ItineraryDay[] = [
    {
      dayNumber: 1,
      attractions: [
        attractions.find(a => a.id === "central-park")!,
        attractions.find(a => a.id === "the-met")!,
        attractions.find(a => a.id === "top-of-the-rock")!
      ].filter(Boolean)
    },
    {
      dayNumber: 2,
      attractions: [
        attractions.find(a => a.id === "high-line")!,
        attractions.find(a => a.id === "chelsea-market")!,
        attractions.find(a => a.id === "moma")!
      ].filter(Boolean)
    },
    {
      dayNumber: 3,
      attractions: [
        attractions.find(a => a.id === "statue-liberty")!,
        attractions.find(a => a.id === "brooklyn-bridge")!,
        attractions.find(a => a.id === "joes-pizza")!
      ].filter(Boolean)
    },
    {
      dayNumber: 4,
      attractions: [
        attractions.find(a => a.id === "soho-shopping")!,
        attractions.find(a => a.id === "katzs-delicatessen")!,
        attractions.find(a => a.id === "broadway-show")!
      ].filter(Boolean)
    }
  ];

  const state: TravelState = {
    profile: DEFAULT_PROFILE,
    itinerary: defaultItinerary,
    checklist: DEFAULT_CHECKLIST,
    customExpenses: DEFAULT_EXPENSES
  };

  localStorage.setItem("viagem_dos_sonhos_state", JSON.stringify(state));
  return state;
}

export function saveTravelState(state: TravelState) {
  localStorage.setItem("viagem_dos_sonhos_state", JSON.stringify(state));
}

export function generateSmartItinerary(profile: UserProfile): ItineraryDay[] {
  const attractions = getStoredAttractions();

  // Filtra atrações compatíveis com os interesses do usuário
  const matched = attractions.filter(attr => {
    // Se o orçamento for $, remove atrações $$$$
    if (profile.budget === "$" && attr.costLevel === "$$$$") return false;
    return profile.interests.includes(attr.category) || attr.category === "classic";
  });

  // Ordena por match score
  const sorted = [...matched].sort((a, b) => b.matchScore - a.matchScore);

  const itinerary: ItineraryDay[] = [];
  let attractionIndex = 0;

  for (let d = 1; d <= profile.days; d++) {
    const dayAttractions: Attraction[] = [];
    
    // Tenta colocar até 3 atrações por dia para não ficar cansativo
    for (let i = 0; i < 3; i++) {
      if (attractionIndex < sorted.length) {
        dayAttractions.push(sorted[attractionIndex]);
        attractionIndex++;
      } else {
        // Se acabarem as atrações personalizadas, pega do banco geral dinâmico
        const fallback = attractions[Math.floor(Math.random() * attractions.length)];
        if (fallback && !dayAttractions.some(a => a.id === fallback.id)) {
          dayAttractions.push(fallback);
        }
      }
    }

    itinerary.push({
      dayNumber: d,
      attractions: dayAttractions
    });
  }

  return itinerary;
}