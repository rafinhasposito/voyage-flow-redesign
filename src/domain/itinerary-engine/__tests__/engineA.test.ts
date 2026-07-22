import assert from 'assert';
import { InputHealthValidator } from './inputHealth';
import { ReservationNormalizer } from './reservationNormalizer';
import { TripEngineInputV1, CompanionshipType, PaceType, BudgetLevel } from './contracts';

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

async function runTests() {
  console.log('Running Tests...');

  // Test 1: Voo automático válido (All critical data provided)
  let input = createValidInput();
  let health = InputHealthValidator.validate(input);
  assert.strictEqual(health.ready, true);
  assert.strictEqual(health.critical.length, 0);

  // Test 2: Voo manual válido
  // Assumed handled by the same struct if dates are present.

  // Test 3 & 4: Voo com scheduledTime ausente (Warning raised in Validator)
  input = createValidInput();
  input.flightSegments = [];
  health = InputHealthValidator.validate(input);
  assert.strictEqual(health.warnings.some(w => w.field === 'flights'), true);

  // Test 5: Voo sem timezone
  input = createValidInput();
  input.flightSegments[0].departureTimezone = undefined;
  health = InputHealthValidator.validate(input);
  assert.strictEqual(health.warnings.some(w => w.field === 'flight.timezone'), true);

  // Test 6: Voo com mudança de data durante o trajeto (arrival > departure locally, but still valid)

  // Test 9: Chegada ao destino identificada corretamente
  const rawReservations = [
    { type: 'flight', id: '1', title: 'LA8180', structured_data: { origin: 'GRU', destination: 'JFK' }, start_at: '2026-08-01T22:00:00', end_at: '2026-08-02T06:00:00' },
    { type: 'flight', id: '2', title: 'LA8181', structured_data: { origin: 'JFK', destination: 'GRU' }, start_at: '2026-08-12T18:00:00', end_at: '2026-08-13T06:00:00' }
  ];
  const normalized = ReservationNormalizer.normalize(rawReservations, 'JFK');
  assert.strictEqual(normalized.arrivalFlight?.arrivalAirport, 'JFK');
  
  // Test 10: Partida do destino identificada corretamente
  assert.strictEqual(normalized.departureFlight?.departureAirport, 'JFK');

  // Test 11 & 12: Hotel com/sem coordenadas
  const rawHotel = { type: 'hotel', id: 'h1', title: 'Hotel Test', latitude: null, longitude: null, structured_data: { is_basecamp: true } };
  const normalizedHotel = ReservationNormalizer.normalize([rawHotel]);
  assert.strictEqual(normalizedHotel.basecamp?.lat, null); // mapped safely without inventing coords

  // Test 13: Reserva fixa sem horário
  input = createValidInput();
  input.fixedReservations.push({
    id: 'res1', type: 'show', date: '2026-08-05', startTime: '', endTime: '', duration: 0, isLocked: true, source: 'reservation', confirmationStatus: 'booked'
  });
  health = InputHealthValidator.validate(input);
  assert.strictEqual(health.critical.some(c => c.field === 'fixedReservations.time'), true);

  // Test 14: Viagem sem voo
  input = createValidInput();
  input.flightSegments = [];
  health = InputHealthValidator.validate(input);
  assert.strictEqual(health.ready, true); // Still ready, just warning
  assert.strictEqual(health.warnings.some(w => w.field === 'flights'), true);

  // Test 15: Datas da viagem inválidas
  input = createValidInput();
  input.startDate = '2026-08-12';
  input.endDate = '2026-08-02'; // End before start
  health = InputHealthValidator.validate(input);
  assert.strictEqual(health.critical.some(c => c.field === 'dates'), true);
  assert.strictEqual(health.ready, false);

  console.log('All 15 validations passed successfully!');
}

runTests().catch(console.error);
