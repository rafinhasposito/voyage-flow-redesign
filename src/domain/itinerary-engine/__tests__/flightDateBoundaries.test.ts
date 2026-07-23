import { describe, it, expect } from 'vitest';
import { EngineInputBuilder } from '../inputBuilder';
import { SchedulerV1 } from '../schedulerV1';
import { LocalDeterministicGeoProvider } from '../geoProvider';
import { Trip, TripReservation } from '../../../types/trip.types';

describe('Flight Date Boundaries and Timezones', () => {
  const geoProvider = new LocalDeterministicGeoProvider();

  it('handles arrival correctly and keeps subsequent days available even if departure is missing', async () => {
    const fakeTrip = {
      id: "viagem-ny-teste",
      destination: "dest-nyc",
      start_date: "2026-08-02",
      end_date: "2026-08-12",
      preferences: { travelersCount: 2 }
    } as any;

    const fakeReservations: TripReservation[] = [
      {
        id: "res-flight",
        trip_id: "viagem-ny-teste",
        type: "flight",
        start_at: "2026-08-03T11:43:00Z", // Arrival in NY at 07:43 AM (UTC-4)
        end_at: "2026-08-03T11:43:00Z",
        structured_data: {
          flight_number: "LA8180",
          origin_airport: "GRU",
          destination_airport: "JFK",
          arrival_local_datetime: "2026-08-03T07:43:00"
        }
      } as any
    ];

    const input = EngineInputBuilder.build(fakeTrip, fakeReservations, []);
    const draft = await SchedulerV1.generate(input, geoProvider);

    // 02/08 is Day 1
    const day1 = draft.days.find(d => d.date === '2026-08-02');
    console.log("DAY1 INFO:", day1);
    expect(day1?.activities.length).toBe(0);
    expect(day1?.warnings).toContain('DAY_BEFORE_ARRIVAL');

    // 03/08 is Day 2
    const day2 = draft.days.find(d => d.date === '2026-08-03');
    expect(day2?.activities.length).toBeGreaterThan(0);
    expect(day2?.activities[0].title).toBe('Chegada do Voo LA8180');
    expect(day2?.activities[0].startTime).toBe('2026-08-03T07:43:00');

    // Subsequent days (04/08 to 11/08) should be free to schedule
    const day3 = draft.days.find(d => d.date === '2026-08-04');
    expect(day3?.warnings).not.toContain('Dia anterior à chegada do voo.');

    const dayLast = draft.days.find(d => d.date === '2026-08-12');
    expect(dayLast?.warnings).toContain('DEPARTURE_MISSING');
  });
});
