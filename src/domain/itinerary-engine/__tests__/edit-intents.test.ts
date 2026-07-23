import { expect, test, describe } from 'vitest';
import { applyEditIntentDraft, ItineraryEditIntent } from '../edit-intents';
import { PersistedTripItineraryV2, PersistedDayV2 } from '../contracts';

describe('Edit Intents & Partial Recalculation', () => {
  const mockItinerary: PersistedTripItineraryV2 = [
    { _isMetadata: true, version: 'v1', draftHash: 'h1', engineVersion: '2.0.0' } as any,
    {
      _isMetadata: false,
      dayNumber: 1,
      dateStr: '2025-01-01',
      activities: [
        { id: 'act1', type: 'attraction', title: 'Museum', startTime: '10:00', duration: '60', isFixed: false },
        { id: 'act2', type: 'attraction', title: 'Fixed Tour', startTime: '12:00', duration: '60', isFixed: true },
        { id: 'act3', type: 'attraction', title: 'Park', startTime: '14:00', duration: '60', manualLock: true }
      ]
    } as PersistedDayV2,
    {
      _isMetadata: false,
      dayNumber: 2,
      dateStr: '2025-01-02',
      activities: [
        { id: 'act4', type: 'attraction', title: 'Beach', startTime: '10:00', duration: '60', isFixed: false }
      ]
    } as PersistedDayV2
  ];

  test('MOVE: should move flexible activity within same day', () => {
    const intent: ItineraryEditIntent = {
      tripId: 'trip1',
      action: 'MOVE',
      activityId: 'act1',
      sourceDay: 1,
      targetDay: 1,
      targetPosition: 2 // after fixed tour
    };
    
    const draft = applyEditIntentDraft(mockItinerary, intent);
    expect(draft.status).toBe('APPLIED');
    const day1 = draft.newItinerary.find((d: any) => d.dayNumber === 1) as PersistedDayV2;
    expect(day1.activities![0].id).toBe('act2');
    expect(day1.activities![2].id).toBe('act1');
    
    // Partial Recalculation verify: times should be updated but act2 is fixed
    expect(day1.activities![0].startTime).toBe('12:00'); // Fixed preserved
    expect(day1.activities![2].startTime).toBe('15:00'); // Recalculated
  });

  test('MOVE: should reject moving fixed activity', () => {
    const intent: ItineraryEditIntent = {
      tripId: 'trip1',
      action: 'MOVE',
      activityId: 'act2',
      sourceDay: 1,
      targetDay: 1,
      targetPosition: 0
    };
    const draft = applyEditIntentDraft(mockItinerary, intent);
    expect(draft.status).toBe('BLOCKED_FIXED_ITEM');
  });

  test('REMOVE: should remove flexible activity and recalculate', () => {
    const intent: ItineraryEditIntent = {
      tripId: 'trip1',
      action: 'REMOVE',
      activityId: 'act1'
    };
    const draft = applyEditIntentDraft(mockItinerary, intent);
    expect(draft.status).toBe('APPLIED');
    const day1 = draft.newItinerary.find((d: any) => d.dayNumber === 1) as PersistedDayV2;
    expect(day1.activities!.length).toBe(2);
    expect(day1.activities![0].id).toBe('act2');
  });

  test('REMOVE: should block removing fixed activity', () => {
    const intent: ItineraryEditIntent = {
      tripId: 'trip1',
      action: 'REMOVE',
      activityId: 'act2'
    };
    const draft = applyEditIntentDraft(mockItinerary, intent);
    expect(draft.status).toBe('BLOCKED_FIXED_ITEM');
  });

  test('REMOVE: should block removing manualLock activity', () => {
    const intent: ItineraryEditIntent = {
      tripId: 'trip1',
      action: 'REMOVE',
      activityId: 'act3'
    };
    const draft = applyEditIntentDraft(mockItinerary, intent);
    expect(draft.status).toBe('BLOCKED_MANUAL_LOCK');
  });

  test('ADD: should append activity and run semantic repair pass', () => {
    const intent: ItineraryEditIntent = {
      tripId: 'trip1',
      action: 'ADD',
      sourceExperienceId: 'cat1',
      targetDay: 2
    };
    
    const draft = applyEditIntentDraft(mockItinerary, intent);
    expect(draft.status).toBe('APPLIED');
    const day2 = draft.newItinerary.find((d: any) => d.dayNumber === 2) as PersistedDayV2;
    expect(day2.activities!.length).toBe(2);
    expect(day2.activities![1].sourceExperienceId).toBe('cat1');
  });

  test('Concurrency: should detect ITINERARY_CHANGED_SINCE_PREVIEW', () => {
    const intent: ItineraryEditIntent = {
      tripId: 'trip1',
      action: 'REMOVE',
      activityId: 'act1',
      expectedVersion: 'v0' // Mismatch
    };
    const draft = applyEditIntentDraft(mockItinerary, intent);
    expect(draft.status).toBe('ITINERARY_CHANGED_SINCE_PREVIEW');
  });
  
  test('MOVE: to another day should preserve unaffected days', () => {
    const intent: ItineraryEditIntent = {
      tripId: 'trip1',
      action: 'MOVE',
      activityId: 'act1',
      sourceDay: 1,
      targetDay: 2,
      targetPosition: 0
    };
    const draft = applyEditIntentDraft(mockItinerary, intent);
    expect(draft.status).toBe('APPLIED');
    
    const day1 = draft.newItinerary.find((d: any) => d.dayNumber === 1) as PersistedDayV2;
    const day2 = draft.newItinerary.find((d: any) => d.dayNumber === 2) as PersistedDayV2;
    
    expect(day1.activities!.length).toBe(2);
    expect(day2.activities!.length).toBe(2);
    expect(day2.activities![0].id).toBe('act1');
    expect(day2.activities![1].id).toBe('act4');
  });
});
