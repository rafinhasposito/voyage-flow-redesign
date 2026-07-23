import { describe, it, expect } from 'vitest';
import { normalizeMatchVote } from '../contracts';

describe('matchVoteNormalization', () => {
  it('should normalize known values correctly', () => {
    expect(normalizeMatchVote('yes').value).toBe('LOVE');
    expect(normalizeMatchVote('no').value).toBe('REJECT');
    expect(normalizeMatchVote('maybe').value).toBe('MAYBE');
    expect(normalizeMatchVote('bought').value).toBe('PURCHASED');
  });

  it('should normalize legacy values correctly', () => {
    expect(normalizeMatchVote('love').value).toBe('LOVE');
    expect(normalizeMatchVote('loved').value).toBe('LOVE');
    expect(normalizeMatchVote('like').value).toBe('LIKE');
    expect(normalizeMatchVote('liked').value).toBe('LIKE');
    expect(normalizeMatchVote('dislike').value).toBe('REJECT');
    expect(normalizeMatchVote('reject').value).toBe('REJECT');
    expect(normalizeMatchVote('pass').value).toBe('REJECT');
    expect(normalizeMatchVote('purchased').value).toBe('PURCHASED');
    expect(normalizeMatchVote('reserved').value).toBe('PURCHASED');
  });

  it('should return MISSING for empty values', () => {
    expect(normalizeMatchVote('').status).toBe('MISSING');
    expect(normalizeMatchVote(null).status).toBe('MISSING');
    expect(normalizeMatchVote(undefined).status).toBe('MISSING');
  });

  it('should return UNKNOWN for unrecognized values', () => {
    const result = normalizeMatchVote('unknown_vote_string');
    expect(result.status).toBe('UNKNOWN');
    if (result.status === 'UNKNOWN') {
      expect(result.rawValue).toBe('unknown_vote_string');
    }
  });
});
