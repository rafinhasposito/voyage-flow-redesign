import { test, expect } from 'vitest';
import { SchedulerV1 } from '../schedulerV1';
import { TripEngineInputV1, FixedAnchor } from '../contracts';
import { LocalDeterministicGeoProvider } from '../geoProvider';

test('Geographic clustering groups nearest items', async () => {
  const geoProvider = new LocalDeterministicGeoProvider();
  
  const input: TripEngineInputV1 = {
    engineVersion: '1.0.0',
    tripId: 'geo-test-1',
    destinationId: 'nyc',
    destinationTimezone: 'America/New_York',
    startDate: '2024-05-10',
    endDate: '2024-05-11',
    travelers: { count: 2, children: false, wheelchair: false },
    companionship: 'couple',
    travelProfile: 'Classic NYC',
    pace: 'intense',
    budget: 'balanced',
    matchVotes: {
      'c1': 'yes',
      'c2': 'yes',
      'c3': 'yes',
    },
    avoidances: [],
    accessibilityNeeds: [],
    basecamp: {
      id: 'h1',
      name: 'Central Park Hotel',
      lat: 40.768,
      lng: -73.981
    },
    flightSegments: [],
    fixedReservations: [],
    flexibleReservations: [],
    catalog: [
      { id: 'c1', name: 'Far Museum', location_lat: 40.700, location_lng: -74.015, experienceRole: 'panoramic_view', duration_minutes: 60, opening_hours: [{ open: '09:00', close: '18:00' }] }, // Far from basecamp
      { id: 'c2', name: 'Near Museum', location_lat: 40.765, location_lng: -73.980, experienceRole: 'culture', duration_minutes: 60, opening_hours: [{ open: '09:00', close: '18:00' }] }, // Close to basecamp
      { id: 'c3', name: 'Medium Museum', location_lat: 40.730, location_lng: -73.995, experienceRole: 'park', duration_minutes: 60, opening_hours: [{ open: '09:00', close: '18:00' }] }
    ]
  };

  const draft = await SchedulerV1.generate(input, geoProvider);
  const day1 = draft.days[0].activities.filter(a => a.type === 'experience');
  
  // Basecamp is at 40.768, Near Museum is at 40.765 (Very close).
  // Therefore, 'Near Museum' should be scheduled first!
  expect(day1[0].title).toBe('Near Museum');
  
  const hasTransit = draft.days[0].activities.some(a => a.source === 'transit');
  expect(hasTransit).toBe(true);
});

test('GeoHealth Issues are generated when missing GPS', async () => {
  const geoProvider = new LocalDeterministicGeoProvider();
  
  const input: TripEngineInputV1 = {
    engineVersion: '1.0.0',
    tripId: 'geo-test-2',
    destinationId: 'nyc',
    destinationTimezone: 'America/New_York',
    startDate: '2024-05-10',
    endDate: '2024-05-10',
    travelers: { count: 1, children: false, wheelchair: false },
    companionship: 'solo',
    travelProfile: 'Classic NYC',
    pace: 'relaxed',
    budget: 'balanced',
    matchVotes: {},
    avoidances: [],
    accessibilityNeeds: [],
    basecamp: {
      id: 'h1',
      name: 'Hotel Without GPS',
      // No lat, lng
    },
    flightSegments: [],
    fixedReservations: [
      { id: 'r1', type: 'dinner', date: '2024-05-10', startTime: '19:00:00', endTime: '21:00:00', duration: 120, isLocked: true, source: 'reservation', confirmationStatus: 'confirmed' }
    ],
    flexibleReservations: [],
    catalog: []
  };

  const draft = await SchedulerV1.generate(input, geoProvider);
  
  const codes = draft.geoHealthIssues.map(g => g.code);
  expect(codes).toContain('BASECAMP_GPS_MISSING');
  expect(codes).toContain('FIXED_ANCHOR_GPS_MISSING');
});
