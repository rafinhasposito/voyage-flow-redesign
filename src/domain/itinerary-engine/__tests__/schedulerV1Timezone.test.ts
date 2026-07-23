import { describe, it, expect } from 'vitest';
import { SchedulerV1 } from '../schedulerV1';
import { TripEngineInputV1, ItineraryDraftV1 } from '../contracts';

describe('SchedulerV1 - Arrival and Departure Time Parsing', () => {
  it('Test 1: Normalizes time components properly without inventing time', () => {
    const input = {
      arrivalFlight: { arrivalLocalDateTime: '2026-08-01' }, // NO TIME!
      departureFlight: { departureLocalDateTime: '2026-08-05' } // NO TIME!
    } as TripEngineInputV1;

    const draft = {
      overallWarnings: [],
      days: [
        { date: '2026-08-01', activities: [], warnings: [] },
        { date: '2026-08-05', activities: [], warnings: [] }
      ]
    } as unknown as ItineraryDraftV1;

    // We can test the private static methods by accessing them any-typed
    const scheduler: any = SchedulerV1;
    
    const arrResult = scheduler.injectArrivalLogistics(draft, input);
    expect(arrResult).toBe(-1);
    expect(draft.overallWarnings).toContain('FLIGHT_ARRIVAL_TIME_UNKNOWN');

    const depResult = scheduler.injectDepartureLogistics(draft, input);
    expect(depResult).toBe(-1);
    expect(draft.overallWarnings).toContain('FLIGHT_DEPARTURE_TIME_UNKNOWN');
  });
});
