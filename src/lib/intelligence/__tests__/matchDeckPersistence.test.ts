import { describe, it, expect } from 'vitest';
import { MatchEngine } from '../MatchEngine';
import { TravelExperience } from '../../../repositories/ExperienceRepository';

describe('Match Deck Persistence and Reloading', () => {
  const fakeCatalog: TravelExperience[] = [
    { id: 'exp-1', name: 'Exp 1', type: 'experience', category: 'Museum', experienceRole: 'culture' } as any,
    { id: 'exp-2', name: 'Exp 2', type: 'experience', category: 'Museum', experienceRole: 'culture' } as any,
    { id: 'exp-3', name: 'Exp 3', type: 'experience', category: 'Park', experienceRole: 'nature' } as any,
  ];

  it('excludes seen items when rebuilding the deck (reload)', () => {
    const prefs1 = {
      match_votes: {},
      match_deck_state: { seen_ids: ['exp-1'], round: 1 }
    };

    const deck = MatchEngine.buildInitialDeck(prefs1, fakeCatalog, 10);
    const idsInDeck = deck.items.map(i => i.experience_id);

    expect(idsInDeck).not.toContain('exp-1'); // seen, should not repeat
    expect(idsInDeck).toContain('exp-2');
    expect(idsInDeck).toContain('exp-3');
  });

  it('excludes voted items', () => {
    const prefs2 = {
      match_votes: { 'exp-2': 'yes' },
      match_deck_state: { seen_ids: ['exp-2'], round: 1 }
    };

    const deck = MatchEngine.buildInitialDeck(prefs2, fakeCatalog, 10);
    const idsInDeck = deck.items.map(i => i.experience_id);

    expect(idsInDeck).not.toContain('exp-2'); // voted and seen
    expect(idsInDeck).toContain('exp-1');
  });

});
