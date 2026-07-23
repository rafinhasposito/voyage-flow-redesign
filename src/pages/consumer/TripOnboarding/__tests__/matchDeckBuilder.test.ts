import { describe, it, expect } from 'vitest';
import { MatchEngine } from '../../../../lib/intelligence/MatchEngine';
import { TravelExperience } from '../../../../repositories/ExperienceRepository';

describe('MatchDeckBuilder', () => {
  it('should exclude hotels and already voted items', () => {
    const catalog: TravelExperience[] = [
      { id: '1', name: 'Museum', category: 'Museum', is_published: true, type: 'attraction' } as TravelExperience,
      { id: '2', name: 'Hotel A', category: 'Hotel', type: 'hotel', is_published: true } as TravelExperience,
      { id: '3', name: 'Park', category: 'Natureza', is_published: true, type: 'attraction' } as TravelExperience,
      { id: '4', name: 'Already Voted', category: 'Museum', is_published: true, type: 'attraction' } as TravelExperience
    ];

    const preferences = {
      match_votes: {
        '4': 'yes'
      }
    };

    const deck = MatchEngine.buildInitialDeck(preferences, catalog, 10);
    
    // Should exclude hotel (id: 2) and voted item (id: 4)
    const itemIds = deck.items.map(i => i.experience_id);
    expect(itemIds).toContain('1');
    expect(itemIds).toContain('3');
    expect(itemIds).not.toContain('2');
    expect(itemIds).not.toContain('4');
  });

  it('should not repeat items and should diversify categories', () => {
    const catalog = Array.from({ length: 20 }).map((_, i) => ({
      id: `${i}`,
      name: `Attraction ${i}`,
      category: i % 2 === 0 ? 'Museum' : 'Park', // Alternating categories
      is_published: true,
      type: 'attraction',
      rating: 4.8
    })) as TravelExperience[];

    const deck = MatchEngine.buildInitialDeck({}, catalog, 10);
    
    // No repeats
    const itemIds = deck.items.map(i => i.experience_id);
    expect(new Set(itemIds).size).toBe(itemIds.length);
    
    // Check diversity limits logic in buildInitialDeck (e.g. max 2 per macro category)
    // The deck shouldn't be 100% museums
    const museums = deck.items.filter(i => i.subcategory === 'Museum').length;
    const parks = deck.items.filter(i => i.subcategory === 'Park').length;
    
    expect(museums).toBeGreaterThan(0);
    expect(parks).toBeGreaterThan(0);
  });
});
