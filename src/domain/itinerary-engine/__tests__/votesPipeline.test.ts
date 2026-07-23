import { describe, it, expect } from 'vitest';
import { normalizeMatchVote } from '../contracts';
import { EngineInputBuilder } from '../inputBuilder';

describe('Match Votes Pipeline', () => {
  it('normalizes votes correctly according to contracts', () => {
    // Current
    expect(normalizeMatchVote('yes').value).toBe('LOVE');
    expect(normalizeMatchVote('no').value).toBe('REJECT');
    expect(normalizeMatchVote('maybe').value).toBe('MAYBE');
    expect(normalizeMatchVote('bought').value).toBe('PURCHASED');

    // Legacy
    expect(normalizeMatchVote('love').value).toBe('LOVE');
    expect(normalizeMatchVote('like').value).toBe('LIKE');
    expect(normalizeMatchVote('reject').value).toBe('REJECT');
    expect(normalizeMatchVote('dislike').value).toBe('REJECT');
    expect(normalizeMatchVote('pass').value).toBe('REJECT');
    expect(normalizeMatchVote('purchased').value).toBe('PURCHASED');
    expect(normalizeMatchVote('reserved').value).toBe('PURCHASED');

    // Unknown
    expect(normalizeMatchVote('unknown').status).toBe('UNKNOWN');
  });

  it('EngineInputBuilder passes normalized votes downstream', () => {
    const fakeTrip = {
      id: "trip-votes-123",
      preferences: {
        match_votes: {
          'exp-yes': 'yes',
          'exp-no': 'no',
          'exp-reject': 'reject',
          'exp-love': 'love',
          'exp-bought': 'bought',
          'exp-unknown': 'unknown'
        }
      }
    } as any;

    const input = EngineInputBuilder.build(fakeTrip, [], []);
    
    expect(input.matchVotes['exp-yes']).toBe('LOVE');
    expect(input.matchVotes['exp-no']).toBe('REJECT');
    expect(input.matchVotes['exp-reject']).toBe('REJECT');
    expect(input.matchVotes['exp-love']).toBe('LOVE');
    expect(input.matchVotes['exp-bought']).toBe('PURCHASED');
    expect(input.matchVotes['exp-unknown']).toBeUndefined(); // Unknown should probably be dropped or handled
  });
});
