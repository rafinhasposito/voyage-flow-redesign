import { describe, it, expect } from 'vitest';
import { normalizeFlightDateTime } from '../../../utils/timezoneNormalizer';

describe('Timezone Normalizer — normalizeFlightDateTime', () => {
  it('Test 1: GRU 22:00 sem offset, com timezone America/Sao_Paulo', () => {
    const result = normalizeFlightDateTime({ inputString: '2026-08-01T22:00:00', airportCode: 'GRU', timezone: 'America/Sao_Paulo' });
    expect(result.localDate).toBe('2026-08-01');
    expect(result.localTime).toBe('22:00:00');
    expect(result.utcInstant).toBe('2026-08-02T01:00:00.000Z');
    expect(result.valid).toBe(true);
  });

  it('Test 2: JFK 10:00 sem offset, com America/New_York (DST)', () => {
    const result = normalizeFlightDateTime({ inputString: '2026-08-02T10:00:00', airportCode: 'JFK', timezone: 'America/New_York' });
    expect(result.localDate).toBe('2026-08-02');
    expect(result.localTime).toBe('10:00:00');
    expect(result.utcInstant).toBe('2026-08-02T14:00:00.000Z');
  });

  it('Test 3: Horário Z com timezone America/New_York', () => {
    const result = normalizeFlightDateTime({ inputString: '2026-08-02T14:00:00Z', airportCode: 'JFK', timezone: 'America/New_York' });
    expect(result.localDate).toBe('2026-08-02');
    expect(result.localTime).toBe('10:00:00');
    expect(result.utcInstant).toBe('2026-08-02T14:00:00.000Z');
  });

  it('Test 4: Horário com offset -03:00 (GRU)', () => {
    const result = normalizeFlightDateTime({ inputString: '2026-08-01T22:00:00-03:00', airportCode: 'GRU' });
    expect(result.localDate).toBe('2026-08-01');
    expect(result.localTime).toBe('22:00:00');
    expect(result.utcInstant).toBe('2026-08-02T01:00:00.000Z');
  });

  it('Test 5: Horário com offset -04:00 (JFK verão)', () => {
    const result = normalizeFlightDateTime({ inputString: '2026-08-02T10:00:00-04:00', airportCode: 'JFK' });
    expect(result.localDate).toBe('2026-08-02');
    expect(result.localTime).toBe('10:00:00');
    expect(result.utcInstant).toBe('2026-08-02T14:00:00.000Z');
  });

  it('Test 6: Sem timezone e sem offset — confidence low e valid false', () => {
    const result = normalizeFlightDateTime({ inputString: '2026-08-02T10:00:00' });
    expect(result.confidence).toBe('low');
    expect(result.utcInstant).toBeUndefined();
    expect(result.valid).toBe(false);
  });

  it('Test 7: Input undefined — valid false', () => {
    const result = normalizeFlightDateTime({ inputString: undefined });
    expect(result.valid).toBe(false);
  });
});
