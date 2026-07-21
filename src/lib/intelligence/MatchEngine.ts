import { TravelExperience } from '../../repositories/ExperienceRepository';

export interface MatchReason {
  type: 'must_see' | 'priority_match' | 'budget_match' | 'pace_match' | 'discovery' | 'curation';
  weight: number;
  value?: string;
}

export interface MatchDeckItem {
  experience_id: string;
  reasons: MatchReason[];
  score: number;
  category: string;
  subcategory?: string;
}

export interface MatchDeck {
  version: number;
  generated_at: string;
  items: MatchDeckItem[];
}

export class MatchEngine {
  /**
   * Constructs the initial deterministic Match Deck based on 3 layers: Must See, Affinity, Discovery.
   */
  public static buildInitialDeck(
    tripPreferences: any,
    allExperiences: TravelExperience[],
    limit: number = 10
  ): MatchDeck {
    // We don't want hotels in the deck!
    const available = allExperiences.filter(e => e.type !== 'hotel' && e.category !== 'Hotel' && e.category !== 'Hospedagem');
    
    const items: MatchDeckItem[] = [];
    const usedIds = new Set<string>();
    const categoryCount: Record<string, number> = {};
    let mustSeeCount = 0;

    const addToDeck = (exp: TravelExperience, reasons: MatchReason[], score: number) => {
      // Deduplication: using canonical rule
      // 1. place_id
      // 2. normalize title
      let canonicalName = exp.id;
      if ((exp as any).place_id) canonicalName = (exp as any).place_id;
      else {
        canonicalName = exp.name
          .normalize('NFD').replace(/[\u0300-\u036f]/g, "") // remove accents
          .toLowerCase()
          .replace(/\s*\(.*?\)\s*/g, '') // remove parentheticals
          .replace(/\b(especial|vip|pôr do sol|sunset)\b/g, '') // remove common suffixes
          .trim();
      }

      if (usedIds.has(canonicalName)) return false;
      
      let cat = exp.categoryLabel || exp.category;
      
      // Normalize similar categories to prevent flooding
      if (cat && ['Shows & Musicais', 'Shows & Musicals', 'Entertainment', 'Teatro'].includes(cat)) {
        cat = 'Teatro/Musical';
      }
      if (cat && ['Park', 'Nature', 'Aventura'].includes(cat)) {
        cat = 'Natureza';
      }
      if (cat && ['Observation Deck', 'Views & Observatories'].includes(cat)) {
        cat = 'Mirante';
      }
      
      // Diversity rules
      // Max 1 musical initially
      if (cat === 'Teatro/Musical' && (categoryCount[cat] || 0) >= 1) return false;
      // Max 1 mirante initially
      if (cat === 'Mirante' && (categoryCount[cat] || 0) >= 1) return false;
      // Max 2 of the same macro-category initially
      if (cat && (categoryCount[cat] || 0) >= 2) return false;

      // Max 4 Must Sees globally
      if (exp.is_must_see && mustSeeCount >= 4) return false;

      items.push({
        experience_id: exp.id,
        reasons,
        score,
        category: cat || 'Desconhecida',
        subcategory: exp.category || 'Desconhecida'
      });
      usedIds.add(exp.id);
      usedIds.add(canonicalName); // track canonical to prevent variants
      if (cat) categoryCount[cat] = (categoryCount[cat] || 0) + 1;
      if (exp.is_must_see) mustSeeCount++;
      return true;
    };

    const priorities = tripPreferences?.must_have || [];
    const budget = tripPreferences?.budget; // ex: 'economic', 'comfortable', 'luxury'
    const pace = tripPreferences?.pace;

    // Helper to score an experience based on affinity
    const scoreExperience = (exp: TravelExperience): { score: number, reasons: MatchReason[] } => {
      let score = 0;
      const reasons: MatchReason[] = [];

      if (exp.is_must_see) {
        score += 30;
        reasons.push({ type: 'must_see', weight: 30 });
      }

      // Priorities match
      priorities.forEach((p: string) => {
        const pLower = p.toLowerCase();
        // Simple mapping for common terms
        const isCulture = pLower === 'cultura' && ['Museum', 'Monument', 'Teatro', 'Classic', 'Shows & Musicais', 'Shows & Musicals'].includes(exp.category);
        const isNature = pLower === 'natureza' && ['Park', 'Nature', 'Aventura', 'Views & Observatories'].includes(exp.category);
        const isGastronomy = (pLower === 'gastronomia' || pLower === 'food') && ['Restaurant', 'Cafe', 'Street Food', 'Food Market', 'Rooftop'].includes(exp.category);
        
        if (isCulture || isNature || isGastronomy || exp.tags?.includes(p) || exp.category.toLowerCase().includes(pLower)) {
          score += 20;
          reasons.push({ type: 'priority_match', value: p, weight: 20 });
        }
      });

      // Budget match
      if (budget === 'economic' && exp.costLevel === '$') {
        score += 10;
        reasons.push({ type: 'budget_match', value: 'Econômico', weight: 10 });
      } else if (budget === 'luxury' && (exp.costLevel === '$$$' || exp.costLevel === '$$$$')) {
         score += 10;
         reasons.push({ type: 'budget_match', value: 'Luxo', weight: 10 });
      }

      // Pace match
      if (pace === 'relaxed' && exp.physicalEnergyRequired === 'low') {
        score += 10;
        reasons.push({ type: 'pace_match', value: 'Ritmo leve', weight: 10 });
      }

      if (reasons.length === 0) {
        reasons.push({ type: 'curation', weight: 5 });
      }

      return { score, reasons };
    };

    // Score all and enforce complete records
    const scored = available
      .filter(exp => exp.category) // Do not fallback empty category, just skip or it won't be prioritized
      .map(exp => {
      const { score, reasons } = scoreExperience(exp);
      return { exp, score, reasons };
    });

    // Sort by score descending, tiebreaker by rating
    scored.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return (b.exp.rating || 0) - (a.exp.rating || 0);
    });

    // LAYER A: Must See (take max 4)
    const mustSees = scored.filter(s => s.exp.is_must_see);
    let mustSeeAdded = 0;
    for (const item of mustSees) {
      if (mustSeeAdded >= 4) break;
      if (addToDeck(item.exp, item.reasons, item.score)) {
        mustSeeAdded++;
      }
    }

    // LAYER B: Affinity
    for (const item of scored) {
      if (items.length >= limit - 1) break; // leave 1 space for discovery
      addToDeck(item.exp, item.reasons, item.score);
    }

    // LAYER C: Discovery (take 1 high rated)
    const discoveries = available
      .filter(exp => exp.rating && exp.rating >= 4.5)
      .sort((a, b) => (b.rating || 0) - (a.rating || 0));
    
    for (const exp of discoveries) {
      if (items.length >= limit) break;
      const added = addToDeck(exp, [{ type: 'discovery', weight: 15 }], 15);
      if (added) break;
    }

    // Fallback: fill the rest
    for (const item of scored) {
      if (items.length >= limit) break;
      addToDeck(item.exp, item.reasons, item.score);
    }

    // Final Validation
    if (mustSeeCount > 4) {
      console.warn("MatchEngine Final Validation Failed: mustSeeCount > 4");
    }

    return {
      version: 1,
      generated_at: new Date().toISOString(),
      items
    };
  }

  /**
   * Handles a vote, dynamically updating the upcoming deck.
   * Modifies the pending items in the deck based on rules (e.g. anti-repetition for Broadway).
   */
  public static handleVote(
    vote: 'yes' | 'no' | 'maybe' | 'bought',
    votedItem: MatchDeckItem,
    deck: MatchDeck,
    allExperiences: TravelExperience[],
    votedIds: Set<string>
  ): MatchDeck {
    const newItems = [...deck.items];

    const isTheater = (c: string) => ['Shows & Musicais', 'Shows & Musicals', 'Entertainment', 'Teatro', 'Teatro/Musical'].includes(c);

    // If 'no' to a Musical/Event, remove upcoming Musicals from the deck
    if (vote === 'no' && isTheater(votedItem.category)) {
      return {
        ...deck,
        items: newItems.filter(item => {
          if (votedIds.has(item.experience_id)) return true; // keep already voted
          if (isTheater(item.category)) return false; // drop upcoming
          return true;
        })
      };
    }

    // If 'yes' or 'bought', we might want to inject a new one of the same category
    if ((vote === 'yes' || vote === 'bought') && isTheater(votedItem.category)) {
      const upcomingSimilar = newItems.find(item => !votedIds.has(item.experience_id) && isTheater(item.category));
      if (!upcomingSimilar && newItems.length < 15) { // Ensure deck doesn't grow infinitely
        const candidates = allExperiences.filter(e => isTheater(e.category) && !votedIds.has(e.id) && !newItems.find(i => i.experience_id === e.id));
        if (candidates.length > 0) {
          const newCand = candidates[0];
          newItems.push({
            experience_id: newCand.id,
            category: newCand.category,
            subcategory: newCand.category,
            reasons: [{ type: 'priority_match', value: 'Afinidade descoberta', weight: 20 }],
            score: 20
          });
        }
      }
    }

    return { ...deck, items: newItems };
  }

  /**
   * Converts the structured reasons into a human-readable UI phrase.
   */
  public static getReasonPhrase(reasons: MatchReason[]): string {
    if (!reasons || reasons.length === 0) return "Selecionado pela curadoria do destino.";

    // Sort by weight
    const sorted = [...reasons].sort((a, b) => b.weight - a.weight);
    const top = sorted[0];

    switch (top.type) {
      case 'must_see':
        return "É uma das experiências essenciais escolhidas pela curadoria.";
      case 'priority_match':
        return `Combina com seu interesse por ${top.value?.toLowerCase() || 'suas prioridades'}.`;
      case 'budget_match':
        return `Fica perfeitamente dentro do seu orçamento ${top.value || ''}.`;
      case 'pace_match':
        return `Ideal para o seu ${top.value || 'ritmo'}.`;
      case 'discovery':
        return "Foi selecionada como descoberta fora das escolhas mais óbvias.";
      default:
        return "Selecionado pela curadoria do destino.";
    }
  }
}
