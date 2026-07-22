import assert from 'assert';
import { normalizeFlightDateTime } from '../../../utils/timezoneNormalizer';

async function runTests() {
  console.log('--- Timezone Normalizer Tests ---');
  let result;

  // 1. GRU 22:00 -> JFK 06:30 no dia seguinte (without TZ offset but WITH timezone provided)
  result = normalizeFlightDateTime({ inputString: '2026-08-01T22:00:00', airportCode: 'GRU', timezone: 'America/Sao_Paulo' });
  assert.strictEqual(result.localDate, '2026-08-01');
  assert.strictEqual(result.localTime, '22:00:00');
  assert.strictEqual(result.utcInstant, '2026-08-02T01:00:00.000Z'); // BRT is UTC-3 in Aug
  assert.strictEqual(result.valid, true);
  console.log('Test 1 Passed: Local without offset resolved via Timezone');

  // 2. JFK 10:00 sem offset with New_York timezone (DST)
  result = normalizeFlightDateTime({ inputString: '2026-08-02T10:00:00', airportCode: 'JFK', timezone: 'America/New_York' });
  assert.strictEqual(result.localDate, '2026-08-02');
  assert.strictEqual(result.localTime, '10:00:00');
  assert.strictEqual(result.utcInstant, '2026-08-02T14:00:00.000Z'); // EDT is UTC-4 in Aug
  console.log('Test 2 Passed: JFK Local without offset resolved via Timezone (DST)');

  // 3. Horário com Z
  result = normalizeFlightDateTime({ inputString: '2026-08-02T14:00:00Z', airportCode: 'JFK', timezone: 'America/New_York' });
  assert.strictEqual(result.localDate, '2026-08-02');
  assert.strictEqual(result.localTime, '10:00:00'); // Note: it converts Z back to local time using timezone!
  assert.strictEqual(result.utcInstant, '2026-08-02T14:00:00.000Z');
  console.log('Test 3 Passed: Z offset parsed properly with timezone');

  // 4. Horário com -03:00 (GRU)
  result = normalizeFlightDateTime({ inputString: '2026-08-01T22:00:00-03:00', airportCode: 'GRU' });
  assert.strictEqual(result.localDate, '2026-08-01');
  assert.strictEqual(result.localTime, '22:00:00');
  assert.strictEqual(result.utcInstant, '2026-08-02T01:00:00.000Z');
  console.log('Test 4 Passed: -03:00 offset');

  // 5. Horário com -04:00 (JFK summer)
  result = normalizeFlightDateTime({ inputString: '2026-08-02T10:00:00-04:00', airportCode: 'JFK' });
  assert.strictEqual(result.localDate, '2026-08-02');
  assert.strictEqual(result.localTime, '10:00:00');
  assert.strictEqual(result.utcInstant, '2026-08-02T14:00:00.000Z');
  console.log('Test 5 Passed: -04:00 offset');

  // 6. Aeroporto sem timezone conhecido / absent
  result = normalizeFlightDateTime({ inputString: '2026-08-02T10:00:00' });
  assert.strictEqual(result.confidence, 'low');
  assert.strictEqual(result.utcInstant, undefined);
  assert.strictEqual(result.valid, false); // invalid because NO UTC instant!
  console.log('Test 6 Passed: Absent timezone info correctly invalidates flight');

  // 7. Empty string test
  result = normalizeFlightDateTime({ inputString: undefined });
  assert.strictEqual(result.valid, false);
  console.log('Test 7 Passed: undefined input is invalid');

  console.log('All timezone normalization tests passed successfully!');
}

runTests().catch(console.error);
