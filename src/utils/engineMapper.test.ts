import { describe, it, expect } from 'vitest';
import { buildTripEngineDTO } from './engineMapper';

describe('engineMapper - buildTripEngineDTO', () => {
  it('deve montar o DTO base', () => {
    const trip = {
      id: 'trip-1',
      destination: 'Kyoto',
      start_date: '2026-08-01',
      end_date: '2026-08-10',
      companionship: 'couple',
      preferences: { tinder_votes: { 'exp-1': 'love' }, trip_reason: 'vacation' }
    };
    
    const dto = buildTripEngineDTO(trip, []);
    expect(dto.trip_id).toBe('trip-1');
    expect(dto.tinder_votes['exp-1']).toBe('love');
    expect(dto.fixed_commitments).toHaveLength(0);
    expect(dto.basecamp).toBeUndefined();
  });

  it('hotel define Basecamp', () => {
    const trip = { id: 'trip-1' };
    const hotel = {
      id: 'res-1',
      type: 'hotel',
      title: 'Ryokan test',
      address: 'Street A',
      is_fixed: true,
      purchase_status: 'booked'
    } as any;
    
    const dto = buildTripEngineDTO(trip, [hotel]);
    expect(dto.basecamp).toBeDefined();
    expect(dto.basecamp?.title).toBe('Ryokan test');
    expect(dto.fixed_commitments).toHaveLength(1);
  });

  it('voo e item comprado se tornam fixos', () => {
    const trip = { id: 'trip-1' };
    const flight = {
      id: 'res-2',
      type: 'flight',
      is_fixed: true,
      purchase_status: 'booked'
    } as any;
    const optionalEvent = {
      id: 'res-3',
      type: 'show',
      is_fixed: false,
      purchase_status: 'undecided'
    } as any;
    
    const dto = buildTripEngineDTO(trip, [flight, optionalEvent]);
    expect(dto.fixed_commitments).toHaveLength(1);
    expect(dto.fixed_commitments[0].type).toBe('flight');
  });

  it('campos ausentes são tratados sem dados inventados', () => {
    const trip = { id: 'trip-empty' };
    const dto = buildTripEngineDTO(trip, []);
    expect(dto.budget_level).toBe('medium');
    expect(dto.pace).toBe('balanced');
    expect(dto.preferences.restrictions).toEqual([]);
    expect(dto.basecamp).toBeUndefined();
  });
});
