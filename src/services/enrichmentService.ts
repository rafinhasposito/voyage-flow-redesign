"use client";

import { Attraction, UserProfile } from "@/utils/travelState";

// ============================================
// TIPOS PARA ENRIQUECIMENTO
// ============================================

export interface EnrichedAttractionData {
  // Dados básicos
  name: string;
  description: string;
  image: string;
  
  // Localização
  address: string;
  neighborhood: string;
  coordinates: { lat: number; lng: number };
  
  // Praticidades
  openingHours: Record<string, string>; // { "monday": "9:00-18:00", ... }
  priceLevel: 1 | 2 | 3 | 4; // Google Places style
  averageCostUSD: number;
  currency: "USD";
  
  // Transporte
  transitDirections: {
    fromMidtown: string;
    subwayLines: string[];
    walkTimeMinutes: number;
  };
  
  // Qualidade
  rating: number;
  reviewCount: number;
  photos: string[];
  
  // Afiliado
  affiliateLink?: string;
  bookingProvider?: "getyourguide" | "viator" | "tiqets" | "direct";
}

// ============================================
// MOCK DATA - SIMULA RESPOSTAS DE APIs REAIS
// ============================================

const MOCK_ENRICHED_DATA: Record<string, EnrichedAttractionData> = {
  "central-park": {
    name: "Central Park",
    description: "O coração verde de Manhattan com 341 hectares de natureza, lagos, trilhas e pontos icônicos como Bethesda Terrace e Bow Bridge.",
    image: "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800&q=80",
    address: "New York, NY 10024, USA",
    neighborhood: "Midtown / Upper West Side",
    coordinates: { lat: 40.7829, lng: -73.9654 },
    openingHours: {
      monday: "6:00-1:00",
      tuesday: "6:00-1:00",
      wednesday: "6:00-1:00",
      thursday: "6:00-1:00",
      friday: "6:00-1:00",
      saturday: "6:00-1:00",
      sunday: "6:00-1:00"
    },
    priceLevel: 1,
    averageCostUSD: 0,
    currency: "USD",
    transitDirections: {
      fromMidtown: "Linha B/C até 81st St ou 59th St-Columbus Circle",
      subwayLines: ["A", "B", "C", "D", "1", "N", "Q", "R", "W"],
      walkTimeMinutes: 10
    },
    rating: 4.8,
    reviewCount: 245000,
    photos: [
      "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800&q=80",
      "https://images.unsplash.com/photo-1534270804882-6b5048b1c1fc?w=800&q=80"
    ],
    affiliateLink: "https://www.getyourguide.com/new-york-l57/central-park-bike-tour-tickets-r123456.html",
    bookingProvider: "getyourguide"
  },
  "the-met": {
    name: "The Metropolitan Museum of Art",
    description: "Um dos maiores museus de arte do mundo com mais de 2 milhões de obras abrangendo 5.000 anos de cultura global.",
    image: "https://images.unsplash.com/photo-1601887389937-0b02c26b6c3c?w=800&q=80",
    address: "1000 5th Ave, New York, NY 10028, USA",
    neighborhood: "Upper East Side",
    coordinates: { lat: 40.7794, lng: -73.9632 },
    openingHours: {
      monday: "Fechado",
      tuesday: "10:00-17:00",
      wednesday: "10:00-17:00",
      thursday: "10:00-17:00",
      friday: "10:00-21:00",
      saturday: "10:00-21:00",
      sunday: "10:00-17:00"
    },
    priceLevel: 2,
    averageCostUSD: 30,
    currency: "USD",
    transitDirections: {
      fromMidtown: "Linha 4/5/6 até 86th St + caminhada 10 min ou ônibus M1/M2/M3/M4",
      subwayLines: ["4", "5", "6"],
      walkTimeMinutes: 10
    },
    rating: 4.8,
    reviewCount: 52000,
    photos: [
      "https://images.unsplash.com/photo-1601887389937-0b02c26b6c3c?w=800&q=80",
      "https://images.unsplash.com/photo-1544967082-d9d25d867d66?w=800&q=80"
    ],
    affiliateLink: "https://www.getyourguide.com/new-york-l57/met-museum-priority-ticket-tickets-r234567.html",
    bookingProvider: "getyourguide"
  },
  "top-of-the-rock": {
    name: "Top of the Rock Observation Deck",
    description: "Observatório no 70º andar do Rockefeller Center com vista 360° de Manhattan, Central Park e Empire State Building.",
    image: "https://images.unsplash.com/photo-1534430480872-3498386e7856?w=800&q=80",
    address: "30 Rockefeller Plaza, New York, NY 10112, USA",
    neighborhood: "Midtown",
    coordinates: { lat: 40.7590, lng: -73.9791 },
    openingHours: {
      monday: "9:00-23:00",
      tuesday: "9:00-23:00",
      wednesday: "9:00-23:00",
      thursday: "9:00-23:00",
      friday: "9:00-23:00",
      saturday: "9:00-23:00",
      sunday: "9:00-23:00"
    },
    priceLevel: 3,
    averageCostUSD: 45,
    currency: "USD",
    transitDirections: {
      fromMidtown: "Já está no Midtown! Caminhada de 5 min da Times Square",
      subwayLines: ["B", "D", "F", "M", "1"],
      walkTimeMinutes: 5
    },
    rating: 4.7,
    reviewCount: 68000,
    photos: [
      "https://images.unsplash.com/photo-1534430480872-3498386e7856?w=800&q=80",
      "https://images.unsplash.com/photo-1519121785383-3229633bb75b?w=800&q=80"
    ],
    affiliateLink: "https://www.getyourguide.com/new-york-l57/top-of-the-rock-skip-the-line-tickets-r345678.html",
    bookingProvider: "getyourguide"
  }
};

// ============================================
// CÁLCULO AUTOMÁTICO DE MATCH SCORE
// ============================================

export interface MatchScoreBreakdown {
  total: number;
  factors: {
    interestMatch: number;      // 0-30 pontos
    budgetCompatibility: number; // 0-25 pontos
    styleFit: number;           // 0-20 pontos
    ratingQuality: number;      // 0-15 pontos
    logisticsEase: number;      // 0-10 pontos
  };
  explanation: string[];
}

export function calculateMatchScore(
  attraction: EnrichedAttractionData,
  profile: UserProfile,
  category: string
): MatchScoreBreakdown {
  const factors = {
    interestMatch: 0,
    budgetCompatibility: 0,
    styleFit: 0,
    ratingQuality: 0,
    logisticsEase: 0
  };
  const explanations: string[] = [];

  // 1. INTEREST MATCH (0-30 pts)
  const interestMap: Record<string, string[]> = {
    culture: ["culture", "museum"],
    food: ["food", "restaurant"],
    views: ["view", "observation"],
    nature: ["park", "nature"],
    shopping: ["shopping", "shop"],
    classic: ["classic", "landmark"]
  };
  
  const userInterests = profile.interests || [];
  const attractionCategories = interestMap[category] || [category];
  
  if (userInterests.some(i => attractionCategories.includes(i))) {
    factors.interestMatch = 30;
    explanations.push("✓ Combina perfeitamente com seus interesses");
  } else if (category === "classic") {
    factors.interestMatch = 20;
    explanations.push("✓ Clássico imperdível de Nova York");
  } else {
    factors.interestMatch = 10;
    explanations.push("○ Fora dos interesses principais, mas pode surpreender");
  }

  // 2. BUDGET COMPATIBILITY (0-25 pts)
  const budgetMultipliers: Record<string, { min: number; max: number }> = {
    "$": { min: 0, max: 15 },
    "$$": { min: 0, max: 50 },
    "$$$": { min: 20, max: 150 },
    "$$$$": { min: 50, max: 500 }
  };
  
  const budgetRange = budgetMultipliers[profile.budget] || budgetMultipliers["$$"];
  const cost = attraction.averageCostUSD;
  
  if (cost >= budgetRange.min && cost <= budgetRange.max) {
    factors.budgetCompatibility = 25;
    explanations.push(`✓ Custo (U$ ${cost}) dentro do seu orçamento ${profile.budget}`);
  } else if (cost < budgetRange.min) {
    factors.budgetCompatibility = 20;
    explanations.push(`✓ Mais barato que seu orçamento (U$ ${cost})`);
  } else {
    const overage = ((cost - budgetRange.max) / budgetRange.max) * 100;
    if (overage < 50) {
      factors.budgetCompatibility = 15;
      explanations.push(`⚠ Ligeiramente acima do orçamento (U$ ${cost})`);
    } else {
      factors.budgetCompatibility = 5;
      explanations.push(`✗ Muito acima do orçamento (U$ ${cost} vs max U$ ${budgetRange.max})`);
    }
  }

  // 3. STYLE FIT (0-20 pts)
  const stylePreferences: Record<string, { prefers: string[]; avoids: string[] }> = {
    solo: { prefers: ["museum", "park", "view"], avoids: [] },
    couple: { prefers: ["view", "restaurant", "classic"], avoids: [] },
    family: { prefers: ["park", "museum", "classic"], avoids: ["bar", "nightlife"] },
    friends: { prefers: ["view", "bar", "food", "shopping"], avoids: [] }
  };
  
  const stylePref = stylePreferences[profile.style] || stylePreferences.couple;
  const isPreferred = stylePref.prefers.some(p => attractionCategories.includes(p));
  const isAvoided = stylePref.avoids.some(a => attractionCategories.includes(a));
  
  if (isPreferred && !isAvoided) {
    factors.styleFit = 20;
    explanations.push(`✓ Ideal para viagem ${profile.style === "couple" ? "em casal" : profile.style}`);
  } else if (isAvoided) {
    factors.styleFit = 5;
    explanations.push(`⚠ Pode não é menos recomendado para ${profile.style}`);
  } else {
    factors.styleFit = 12;
    explanations.push(`○ Adequado para seu estilo de viagem`);
  }

  // 4. RATING QUALITY (0-15 pts)
  if (attraction.rating >= 4.7) {
    factors.ratingQuality = 15;
    explanations.push(`✓ Avaliação excepcional (${attraction.rating}/5)`);
  } else if (attraction.rating >= 4.5) {
    factors.ratingQuality = 12;
    explanations.push(`✓ Muito bem avaliado (${attraction.rating}/5)`);
  } else if (attraction.rating >= 4.0) {
    factors.ratingQuality = 8;
    explanations.push(`○ Boa avaliação (${attraction.rating}/5)`);
  } else {
    factors.ratingQuality = 3;
    explanations.push(`⚠ Avaliação mista (${attraction.rating}/5)`);
  }

  // 5. LOGISTICS EASE (0-10 pts)
  const transitScore = attraction.transitDirections.subwayLines.length;
  if (transitScore >= 3 && attraction.transitDirections.walkTimeMinutes <= 10) {
    factors.logisticsEase = 10;
    explanations.push("✓ Fácil acesso por metrô");
  } else if (transitScore >= 1) {
    factors.logisticsEase = 7;
    explanations.push("○ Acesso razoável por transporte público");
  } else {
    factors.logisticsEase = 3;
    explanations.push("⚠ Acesso mais complicado");
  }

  const total = Object.values(factors).reduce((a, b) => a + b, 0);
  
  return {
    total: Math.min(100, total),
    factors,
    explanation: explanations
  };
}

// ============================================
// SERVIÇO PRINCIPAL DE ENRIQUECIMENTO
// ============================================

export class AttractionEnrichmentService {
  private cache: Map<string, EnrichedAttractionData> = new Map();
  private apiKeys: Record<string, string> = {};

  constructor() {
    // Carregar cache do localStorage se existir
    this.loadCache();
  }

  private loadCache() {
    try {
      const cached = localStorage.getItem("attraction_enrichment_cache");
      if (cached) {
        const parsed = JSON.parse(cached);
        this.cache = new Map(Object.entries(parsed));
      }
    } catch (e) {
      console.warn("Erro ao carregar cache de enriquecimento", e);
    }
  }

  private saveCache() {
    try {
      const obj = Object.fromEntries(this.cache);
      localStorage.setItem("attraction_enrichment_cache", JSON.stringify(obj));
    } catch (e) {
      console.warn("Erro ao salvar cache de enriquecimento", e);
    }
  }

  // Configurar API keys (chamado pelo backend em produção)
  setApiKeys(keys: Record<string, string>) {
    this.apiKeys = keys;
  }

  // Buscar dados enriquecidos (mock ou real)
  async enrichAttraction(name: string, category: string): Promise<EnrichedAttractionData | null> {
    const cacheKey = `${category}:${name.toLowerCase().replace(/\s+/g, "-")}`;
    
    // 1. Verificar cache
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    // 2. Tentar mock data
    const mockData = MOCK_ENRICHED_DATA[cacheKey];
    if (mockData) {
      this.cache.set(cacheKey, mockData);
      this.saveCache();
      return mockData;
    }

    // 3. Em produção, aqui faria chamadas reais às APIs:
    // - Google Places API (place details, photos, reviews)
    // - GetYourGuide API (preços, disponibilidade, affiliate links)
    // - OpenStreetMap/Overpass (endereços, coordenadas)
    // - Transit APIs (direções)
    
    // Simular delay de API
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Gerar dados básicos baseados no nome/categoria
    const generated = this.generateBasicEnrichment(name, category);
    this.cache.set(cacheKey, generated);
    this.saveCache();
    
    return generated;
  }

  private generateBasicEnrichment(name: string, category: string): EnrichedAttractionData {
    // Dados base por categoria
    const categoryDefaults: Record<string, Partial<EnrichedAttractionData>> = {
      culture: { priceLevel: 2, averageCostUSD: 25, rating: 4.5 },
      food: { priceLevel: 2, averageCostUSD: 35, rating: 4.4 },
      views: { priceLevel: 3, averageCostUSD: 45, rating: 4.6 },
      nature: { priceLevel: 1, averageCostUSD: 0, rating: 4.7 },
      shopping: { priceLevel: 3, averageCostUSD: 50, rating: 4.3 },
      classic: { priceLevel: 2, averageCostUSD: 20, rating: 4.5 }
    };

    const defaults = categoryDefaults[category] || categoryDefaults.culture;

    return {
      name,
      description: `Experiência incrível de ${category} em Nova York. Detalhes serão preenchidos automaticamente.`,
      image: `https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&q=80`,
      address: "Endereço a ser preenchido via Google Places API",
      neighborhood: "Bairro a ser determinado",
      coordinates: { lat: 40.7580, lng: -73.9855 },
      openingHours: {},
      priceLevel: defaults.priceLevel!,
      averageCostUSD: defaults.averageCostUSD!,
      currency: "USD",
      transitDirections: {
        fromMidtown: "Direções a serem calculadas via Google Directions API",
        subwayLines: [],
        walkTimeMinutes: 15
      },
      rating: defaults.rating!,
      reviewCount: 0,
      photos: [],
      affiliateLink: undefined,
      bookingProvider: undefined
    };
  }

  // Enriquecer múltiplas atrações em lote
  async enrichMultiple(attractions: Array<{ name: string; category: string }>): Promise<EnrichedAttractionData[]> {
    const results = await Promise.all(
      attractions.map(a => this.enrichAttraction(a.name, a.category))
    );
    return results.filter((r): r is EnrichedAttractionData => r !== null);
  }

  // Calcular match scores para uma lista de atrações
  calculateMatchScores(
    attractions: EnrichedAttractionData[],
    profile: UserProfile,
    categories: string[]
  ): Map<string, MatchScoreBreakdown> {
    const scores = new Map<string, MatchScoreBreakdown>();
    
    attractions.forEach((attr, idx) => {
      const category = categories[idx] || "culture";
      const score = calculateMatchScore(attr, profile, category);
      scores.set(attr.name, score);
    });
    
    return scores;
  }

  // Limpar cache
  clearCache() {
    this.cache.clear();
    localStorage.removeItem("attraction_enrichment_cache");
  }
}

// Instância singleton
export const enrichmentService = new AttractionEnrichmentService();

// ============================================
// FUNÇÕES AUXILIARES PARA O ADMIN
// ============================================

export async function autoFillAttractionForm(
  name: string,
  category: string
): Promise<Partial<EnrichedAttractionData> | null> {
  const enriched = await enrichmentService.enrichAttraction(name, category);
  if (!enriched) return null;

  return {
    name: enriched.name,
    description: enriched.description,
    image: enriched.image,
    neighborhood: enriched.neighborhood,
    averageCostUSD: enriched.averageCostUSD,
    priceLevel: enriched.priceLevel,
    bestTime: getBestTimeFromHours(enriched.openingHours),
    durationHours: estimateDuration(category),
    affiliateLink: enriched.affiliateLink
  };
}

function getBestTimeFromHours(hours: Record<string, string>): string {
  // Lógica simples: se abre cedo, manhã; se fecha tarde, pôr do sol/noite
  const friday = hours.friday || "";
  if (friday.includes("21:00") || friday.includes("22:00") || friday.includes("23:00")) {
    return "Noite";
  }
  if (friday.includes("17:00") || friday.includes("18:00") || friday.includes("19:00")) {
    return "Pôr do sol";
  }
  return "Tarde";
}

function estimateDuration(category: string): number {
  const durations: Record<string, number> = {
    culture: 3,
    food: 1.5,
    views: 2,
    nature: 2.5,
    shopping: 2,
    classic: 2
  };
  return durations[category] || 2;
}