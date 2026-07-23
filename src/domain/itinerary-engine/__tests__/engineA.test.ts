import { describe, it, expect } from 'vitest';
import { InputHealthValidator } from '../inputHealth';
import { ReservationNormalizer } from '../reservationNormalizer';
import { TripEngineInputV1, CompanionshipType, PaceType, BudgetLevel } from '../contracts';

// Dummy builder for valid input
const createValidInput = (): TripEngineInputV1 => ({
  engineVersion: '1.0.0',
  tripId: 'test',
  destinationId: 'nyc',
  destinationTimezone: 'America/New_York',
  startDate: '2026-08-02',
  endDate: '2026-08-12',
  travelers: { count: 1, children: false, wheelchair: false },
  companionship: 'solo' as CompanionshipType,
  travelProfile: 'culture',
  pace: 'balanced' as PaceType,
  budget: 'balanced' as BudgetLevel,
  matchVotes: {},
  avoidances: [],
  accessibilityNeeds: [],
  basecamp: { id: 'h1', name: 'Hotel', lat: 40.71, lng: -74.00 },
  flightSegments: [{
    segmentId: 'f1',
    flightNumber: 'LA8180',
    departureAirport: 'GRU',
    departureLocalDateTime: '2026-08-01T22:00:00',
    departureTimezone: 'America/Sao_Paulo',
    arrivalAirport: 'JFK',
    arrivalLocalDateTime: '2026-08-02T06:00:00',
    arrivalTimezone: 'America/New_York'
  }],
  arrivalFlight: {
    segmentId: 'f1',
    flightNumber: 'LA8180',
    departureAirport: 'GRU',
    departureLocalDateTime: '2026-08-01T22:00:00',
    departureTimezone: 'America/Sao_Paulo',
    arrivalAirport: 'JFK',
    arrivalLocalDateTime: '2026-08-02T06:00:00',
    arrivalTimezone: 'America/New_York'
  },
  departureFlight: undefined,
  fixedReservations: [],
  flexibleReservations: [],
  catalog: []
});

describe('Engine A — InputHealth e ReservationNormalizer', () => {
  it('Test 1: Input válido completo não gera críticos', () => {
    const input = createValidInput();
    const health = InputHealthValidator.validate(input);
    expect(health.ready).toBe(true);
    expect(health.critical.length).toBe(0);
  });

  it('Test 3-4: Sem voos gera warning flights', () => {
    const input = createValidInput();
    input.flightSegments = [];
    const health = InputHealthValidator.validate(input);
    expect(health.warnings.some(w => w.field === 'flights')).toBe(true);
  });

  it('Test 5: Voo sem timezone gera warning flight.timezone', () => {
    const input = createValidInput();
    input.flightSegments[0].departureTimezone = undefined;
    const health = InputHealthValidator.validate(input);
    expect(health.warnings.some(w => w.field === 'flight.timezone')).toBe(true);
  });

  it('Test 9: Chegada ao destino identificada corretamente', () => {
    const rawReservations = [
      { type: 'flight', id: '1', title: 'LA8180', structured_data: { origin: 'GRU', destination: 'JFK' }, start_at: '2026-08-01T22:00:00', end_at: '2026-08-02T06:00:00' },
      { type: 'flight', id: '2', title: 'LA8181', structured_data: { origin: 'JFK', destination: 'GRU' }, start_at: '2026-08-12T18:00:00', end_at: '2026-08-13T06:00:00' }
    ];
    const normalized = ReservationNormalizer.normalize(rawReservations, 'JFK');
    expect(normalized.arrivalFlight?.arrivalAirport).toBe('JFK');
  });

  it('Test 10: Partida do destino identificada corretamente', () => {
    const rawReservations = [
      { type: 'flight', id: '1', title: 'LA8180', structured_data: { origin: 'GRU', destination: 'JFK' }, start_at: '2026-08-01T22:00:00', end_at: '2026-08-02T06:00:00' },
      { type: 'flight', id: '2', title: 'LA8181', structured_data: { origin: 'JFK', destination: 'GRU' }, start_at: '2026-08-12T18:00:00', end_at: '2026-08-13T06:00:00' }
    ];
    const normalized = ReservationNormalizer.normalize(rawReservations, 'JFK');
    expect(normalized.departureFlight?.departureAirport).toBe('JFK');
  });

  it('Test 11-12: Hotel sem coordenadas não inventa lat/lng', () => {
    const rawHotel = { type: 'hotel', id: 'h1', title: 'Hotel Test', latitude: null, longitude: null, structured_data: { is_basecamp: true } };
    const normalizedHotel = ReservationNormalizer.normalize([rawHotel]);
    expect(normalizedHotel.basecamp?.lat).toBeNull();
  });

  it('Test 13: Reserva fixa sem horário gera crítico fixedReservations.time', () => {
    const input = createValidInput();
    input.fixedReservations.push({
      id: 'res1', type: 'show', date: '2026-08-05', startTime: '', endTime: '', duration: 0, isLocked: true, source: 'reservation', confirmationStatus: 'booked'
    });
    const health = InputHealthValidator.validate(input);
    expect(health.critical.some(c => c.field === 'fixedReservations.time')).toBe(true);
  });

  it('Test 14: Viagem sem voo é ready mas com warning', () => {
    const input = createValidInput();
    input.flightSegments = [];
    const health = InputHealthValidator.validate(input);
    expect(health.ready).toBe(true);
    expect(health.warnings.some(w => w.field === 'flights')).toBe(true);
  });

  it('Test 15: Datas invertidas geram crítico dates e ready=false', () => {
    const input = createValidInput();
    input.startDate = '2026-08-12';
    input.endDate = '2026-08-02';
    const health = InputHealthValidator.validate(input);
    expect(health.critical.some(c => c.field === 'dates')).toBe(true);
    expect(health.ready).toBe(false);
  });
});
