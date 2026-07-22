import { toZonedTime, formatInTimeZone } from 'date-fns-tz';
import { parseISO, format } from 'date-fns';

export interface NormalizedFlightDateTime {
  localDate: string; // YYYY-MM-DD
  localTime: string; // HH:mm:ss
  timezone?: string; // IANA Timezone (e.g. America/New_York)
  utcInstant?: string; // ISO 8601 UTC timestamp
  source: 'provider_offset' | 'airport_lookup' | 'local_only' | 'manual';
  confidence: 'high' | 'medium' | 'low';
  valid: boolean;
  error?: string;
}

export function normalizeFlightDateTime({
  inputString,
  airportCode,
  timezone,
  sourceOverride
}: {
  inputString?: string;
  airportCode?: string;
  timezone?: string;
  sourceOverride?: 'provider_offset' | 'airport_lookup' | 'local_only' | 'manual';
}): NormalizedFlightDateTime {
  if (!inputString) {
    return {
      localDate: '',
      localTime: '',
      source: 'local_only',
      confidence: 'low',
      valid: false,
      error: 'Data/Hora não fornecida'
    };
  }

  // Handle explicit offset (+HH:MM or -HH:MM) or Z
  const hasZ = inputString.endsWith('Z');
  const hasOffset = /[-+]\d{2}:\d{2}$/.test(inputString);

  let localDate = '';
  let localTime = '';
  let utcInstant: string | undefined;
  let source: 'provider_offset' | 'airport_lookup' | 'local_only' | 'manual' = sourceOverride || 'local_only';
  let confidence: 'high' | 'medium' | 'low' = 'low';

  if (hasZ || hasOffset) {
    const d = new Date(inputString);
    if (!isNaN(d.getTime())) {
      utcInstant = d.toISOString();
      if (timezone) {
         // Reconstruct local time strictly in the destination timezone
         localDate = formatInTimeZone(d, timezone, 'yyyy-MM-dd');
         localTime = formatInTimeZone(d, timezone, 'HH:mm:ss');
      } else {
         const timePart = inputString.substring(0, 19);
         const parts = timePart.split('T');
         localDate = parts[0];
         localTime = parts[1];
      }
      source = sourceOverride || 'provider_offset';
      confidence = 'high';
    }
  } else {
    // No Z, no offset. (e.g., "2026-08-02T10:00:00")
    let cleanInput = inputString;
    if (inputString.length === 16) {
      cleanInput += ':00'; // Append seconds if absent (from datetime-local)
    }

    const parts = cleanInput.split('T');
    if (parts.length === 2) {
      localDate = parts[0];
      localTime = parts[1];
    } else if (parts.length === 1 && cleanInput.includes(' ')) {
      const spaceParts = cleanInput.split(' ');
      localDate = spaceParts[0];
      localTime = spaceParts[1];
    } else {
      localDate = cleanInput;
    }

    if (timezone && localDate && localTime) {
      // Calculate UTC instant safely using date-fns-tz
      // parseISO handles ISO formats. But we must be careful not to let browser guess.
      // We append the IANA timezone indirectly, or use parse from date-fns-tz (which is removed in v3)
      // In date-fns-tz v3, we can create the local date string and parse it in the timezone? 
      // Actually, we can just construct a date from components and use `toZonedTime`? No.
      // Easiest is: string `2026-08-02T10:00:00` -> we know it's in `timezone`.
      // The offset can be found by formatting a dummy date, but DST makes it tricky.
      // There's a trick: Native Intl.DateTimeFormat can format to parts.
      // But let's use a simpler trick since we installed date-fns-tz.
      try {
        const dummyDate = new Date();
        const tzOffsetString = formatInTimeZone(`${localDate}T${localTime}Z`, timezone, 'xxx'); // e.g., "-04:00"
        // Wait, if we use Z, it thinks the input is UTC. We want the offset AT that local time.
        // JS Date parsing trick: 
        const dateStrWithOffset = `${localDate}T${localTime}${tzOffsetString}`;
        // Let's do a loop to converge because offset might change at that exact hour (DST boundary)
        let utcDate = new Date(dateStrWithOffset);
        let actualLocalTimeStr = formatInTimeZone(utcDate, timezone, "yyyy-MM-dd'T'HH:mm:ss");
        
        if (actualLocalTimeStr !== `${localDate}T${localTime}`) {
          // DST transition edge case.
          const offset2 = formatInTimeZone(utcDate, timezone, 'xxx');
          utcDate = new Date(`${localDate}T${localTime}${offset2}`);
        }
        utcInstant = utcDate.toISOString();
        confidence = sourceOverride === 'manual' ? 'high' : 'medium'; // if airport dataset, medium
      } catch (e) {
        console.error("Erro ao calcular UTC: ", e);
      }
    }
  }

  if (!utcInstant) {
    confidence = 'low';
  }

  return {
    localDate,
    localTime,
    timezone,
    utcInstant,
    source,
    confidence,
    valid: !!(localDate && localTime && utcInstant) // Must have UTC Instant to be valid now!
  };
}
