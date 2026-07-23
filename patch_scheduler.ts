import fs from 'fs';

const path = 'src/domain/itinerary-engine/schedulerV1.ts';
let code = fs.readFileSync(path, 'utf8');

// 1. Fix Departure Missing block
code = code.replace(
  /if \(tripEndMs === -1 && absoluteDayStart === new Date\(input\.endDate\)\.getTime\(\)\) \{\n         day\.warnings\.push\("Planejamento incompleto: informe sua partida para liberar atividades com segurança\."\);\n         continue;\n      \}/g,
  `if (tripEndMs === -1 && absoluteDayStart === new Date(input.endDate).getTime()) {\n         day.warnings.push("DEPARTURE_MISSING");\n         // Do not continue. Allow scheduling.\n      }`
);

// 2. Fix injectArrivalLogistics timezone parsing
code = code.replace(
  /private static injectArrivalLogistics\(draft: ItineraryDraft, input: EngineInput\): number \{\n    const flight = input\.arrivalFlight;\n    if \(!flight\) return -1;\n    \n    let localStr = flight\.arrivalLocalDateTime;\n    if \(!localStr\) localStr = flight\.arrivalInstant; \/\/ fallback\n    if \(!localStr\) localStr = input\.startDate \+ "T10:00:00"; \/\/ super fallback\n\n    const dateStr = localStr\.split\('T'\)\[0\];\n    const flightMs = this\.parseMs\(localStr\.split\('T'\)\[1\]\);\n\n    const day = draft\.days\.find\(d => d\.date === dateStr\);\n    if \(!day\) return -1;\n\n    day\.activities\.push\(\{\n      id: flight\.segmentId,\n      type: 'flight',\n      title: \`Chegada do Voo \$\{flight\.flightNumber\}\`,\n      startTime: localStr,\n      endTime: this\.formatMs\(localStr, flightMs \+ 3600000\),/g,
  `private static injectArrivalLogistics(draft: ItineraryDraft, input: EngineInput): number {
    const flight = input.arrivalFlight;
    if (!flight) return -1;
    
    let localStr = flight.arrivalLocalDateTime;
    if (!localStr || localStr.includes('Z')) {
      const date = new Date(localStr || flight.arrivalInstant);
      if (!isNaN(date.getTime())) {
        const options: Intl.DateTimeFormatOptions = { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };
        const nyTime = new Intl.DateTimeFormat('en-US', options).format(date);
        const [d, t] = nyTime.split(', ');
        const [m, day, y] = d.split('/');
        localStr = \`\${y}-\${m}-\${day}T\${t}\`;
      } else {
        localStr = input.startDate + "T10:00:00";
      }
    }

    const dateStr = localStr.split('T')[0];
    const flightMs = this.parseMs(localStr.split('T')[1].replace('Z', ''));

    const day = draft.days.find(d => d.date === dateStr);
    if (!day) return -1;

    const flightName = flight.flightNumber !== 'UNKNOWN' ? flight.flightNumber : 'Chegada do Voo';
    const origin = flight.departureAirport !== 'UNKNOWN' ? flight.departureAirport : '';
    const originText = origin ? \` (de \${origin})\` : '';

    day.activities.push({
      id: flight.segmentId,
      type: 'flight',
      title: \`\${flightName}\${originText}\`,
      startTime: localStr,
      endTime: this.formatMs(localStr, flightMs + 3600000),`
);

fs.writeFileSync(path, code);
console.log("Patched SchedulerV1 successfully.");
