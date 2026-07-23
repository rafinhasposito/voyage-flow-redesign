import { describe, it, expect } from 'vitest';
import { EngineInputBuilder } from '../inputBuilder';
import { TripReservation } from '../../../repositories/TripWalletRepository';

describe('EngineInputBuilder', () => {
  it('should construct personalization completely and correctly', () => {
    const trip = {
      id: 'trip-1',
      destination: 'dest-1',
      start_date: '2024-01-01',
      end_date: '2024-01-05',
      pace: 'intense',
      budget_level: 'luxury',
      companionship: 'solo',
      preferences: {
        travelersCount: 1,
        hasChildren: false,
        needsAccessibility: true,
        travelProfile: 'adventurer',
        avoidances: ['crowds'],
        matchVotes: {
          'exp-love': 'love',
          'exp-reject': 'no',
          'exp-legacy-reject': 'reject',
          'exp-bought': 'bought',
          'exp-unknown': 'something_weird'
        }
      }
    };

    const reservations: TripReservation[] = [
      {
        id: 'res-hotel',
        type: 'hotel',
        title: 'Hilton',
        latitude: 40.7128,
        longitude: -74.0060,
        trip_id: 'trip-1',
        purchase_status: 'booked',
        is_fixed: true
      },
      {
        id: 'res-fixed',
        type: 'attraction',
        title: 'Broadway',
        trip_id: 'trip-1',
        purchase_status: 'booked',
        is_fixed: true,
        start_at: '2024-01-02T20:00:00Z',
        end_at: '2024-01-02T22:30:00Z'
      }
    ];

    const catalog: any[] = [];

    const input = EngineInputBuilder.build(trip, reservations, catalog);

    expect(input.pace).toBe('intense');
    expect(input.budget).toBe('luxury');
    expect(input.companionship).toBe('solo');
    expect(input.travelers.wheelchair).toBe(true);
    expect(input.avoidances).toContain('crowds');
    
    // Check votes
    expect(input.matchVotes['exp-love']).toBe('LOVE');
    expect(input.matchVotes['exp-reject']).toBe('REJECT');
    expect(input.matchVotes['exp-legacy-reject']).toBe('REJECT');
    expect(input.matchVotes['exp-bought']).toBe('PURCHASED');
    expect(input.matchVotes['exp-unknown']).toBeUndefined(); // Should be dropped or not normalized

    // Check basecamp
    expect(input.basecamp?.name).toBe('Hilton');

    // Check fixed
    expect(input.fixedReservations.length).toBe(1);
    expect(input.fixedReservations[0].type).toBe('attraction');
  });
});
