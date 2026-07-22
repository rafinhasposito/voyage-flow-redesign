import { describe, it, expect, vi } from 'vitest';
import { TripItineraryMapper } from '../mapper';
import { TripRepository } from '../../../repositories/TripRepository';
import { supabase } from '../../../lib/supabase';

vi.mock('../../../lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'test-user-123' } } })
    },
    from: vi.fn()
  }
}));

describe('Itinerary Persistence & Validation (Bloco D0)', () => {
  it('should map TripDraft to PersistedTripItineraryV2 preserving nulls and keys', () => {
    const draft: any = {
      tripId: 'trip-1',
      geographicReadiness: 'PARTIAL',
      overallWarnings: [],
      days: [
        {
          date: '2026-10-10',
          activities: [
            {
              id: 'act-1',
              type: 'experience',
              title: 'Museum',
              startTime: '2026-10-10T10:00:00',
              endTime: '2026-10-10T12:00:00',
              isFixed: true,
              source: 'reservation',
              location: null // Ensuring null is preserved or handled properly
            }
          ]
        }
      ]
    };

    const payload = TripItineraryMapper.toPersistedV2(draft);
    expect(payload.length).toBe(2);
    expect(payload[0]._isMetadata).toBe(true);
    expect((payload[0] as any).tripId).toBe('trip-1');
    expect((payload[0] as any).geographicReadiness).toBe('PARTIAL');
    
    const day = payload[1] as any;
    expect(day.activities.length).toBe(1);
    expect(day.activities[0].id).toBe('act-1');
    expect(day.activities[0].isFixed).toBe(true);
    expect(day.activities[0].location).toBeUndefined(); // Assuming mapper strips null or handles it
  });

  it('should block if ITINERARY_CHANGED_SINCE_PREVIEW', async () => {
    vi.spyOn(TripRepository, 'getTripById').mockResolvedValueOnce({
      id: 'trip-1',
      updated_at: '2026-07-22T10:00:00Z',
      itinerary: []
    } as any);

    await expect(TripRepository.applyApprovedItineraryDraft('trip-1', [], '2026-07-22T09:00:00Z'))
      .rejects
      .toThrow('ITINERARY_CHANGED_SINCE_PREVIEW');
  });

  it('should block if protected items (reservas fixas) are removed', async () => {
    vi.spyOn(TripRepository, 'getTripById').mockResolvedValueOnce({
      id: 'trip-1',
      updated_at: '2026-07-22T10:00:00Z',
      itinerary: [
        {
          dayNumber: 1,
          activities: [
            { id: 'protected-1', isFixed: true }
          ]
        }
      ]
    } as any);

    await expect(TripRepository.applyApprovedItineraryDraft('trip-1', [{ dayNumber: 1, activities: [] }], '2026-07-22T10:00:00Z'))
      .rejects
      .toThrow('BLOCKED_BY_CONFLICT');
  });

  it('should return ALREADY_APPLIED if idempotency hash matches', async () => {
    const payload = [
      { _isMetadata: true }
    ];
    // Hash is deterministic based on payload
    const payloadStr = JSON.stringify(payload);
    let draftHash = 0;
    for (let i = 0; i < payloadStr.length; i++) {
        const char = payloadStr.charCodeAt(i);
        draftHash = ((draftHash << 5) - draftHash) + char;
        draftHash = draftHash & draftHash;
    }
    const hashStr = draftHash.toString();

    vi.spyOn(TripRepository, 'getTripById').mockResolvedValueOnce({
      id: 'trip-1',
      updated_at: '2026-07-22T10:00:00Z',
      itinerary: [
        { _isMetadata: true, draftHash: hashStr }
      ]
    } as any);

    const result = await TripRepository.applyApprovedItineraryDraft('trip-1', payload, '2026-07-22T10:00:00Z');
    expect(result.status).toBe('ALREADY_APPLIED');
  });
});
