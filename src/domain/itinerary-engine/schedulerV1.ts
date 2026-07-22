import { TripEngineInputV1, FixedAnchor, FlightSegment } from './contracts';

export interface ScheduledActivity {
  id: string;
  type: string;
  title: string;
  startTime: string; // "YYYY-MM-DDTHH:mm:00" local format
  endTime: string; // "YYYY-MM-DDTHH:mm:00" local format
  location?: string;
  coordinates?: { lat: number; lng: number };
  isFixed: boolean;
  source: 'flight' | 'reservation' | 'engine';
  reason?: string;
}

export interface DaySchedule {
  date: string; // YYYY-MM-DD
  activities: ScheduledActivity[];
  warnings: string[];
}

export interface ItineraryDraftV1 {
  tripId: string;
  days: DaySchedule[];
  unassigned: any[];
  overallWarnings: string[];
}

export class SchedulerV1 {
  static generate(input: TripEngineInputV1): ItineraryDraftV1 {
    const draft: ItineraryDraftV1 = {
      tripId: input.tripId,
      days: [],
      unassigned: [],
      overallWarnings: []
    };

    if (!input.startDate || !input.endDate) {
      draft.overallWarnings.push("Datas da viagem indefinidas. Roteiro não gerado.");
      return draft;
    }

    const [sYear, sMonth, sDay] = input.startDate.split('-').map(Number);
    const [eYear, eMonth, eDay] = input.endDate.split('-').map(Number);
    const sDateObj = new Date(sYear, sMonth - 1, sDay);
    const eDateObj = new Date(eYear, eMonth - 1, eDay);
    const diffDays = Math.round((eDateObj.getTime() - sDateObj.getTime()) / (1000 * 3600 * 24)) + 1;

    for (let i = 0; i < diffDays; i++) {
      const current = new Date(sYear, sMonth - 1, sDay + i);
      const pad = (n: number) => n.toString().padStart(2, '0');
      const dateStr = `${current.getFullYear()}-${pad(current.getMonth() + 1)}-${pad(current.getDate())}`;
      draft.days.push({
        date: dateStr,
        activities: [],
        warnings: []
      });
    }

    // Insert Flights
    if (input.arrivalFlight) {
      this.insertFlightAnchor(draft, input.arrivalFlight, 'arrival');
    } else {
      draft.overallWarnings.push("Voo de chegada não identificado. O roteiro não possui âncora inicial.");
    }
    
    if (input.departureFlight) {
      this.insertFlightAnchor(draft, input.departureFlight, 'departure');
    } else {
      draft.overallWarnings.push("Voo de partida não identificado. O roteiro não possui âncora final.");
    }

    // Insert Fixed Reservations
    input.fixedReservations.forEach(res => {
      const day = draft.days.find(d => d.date === res.date);
      if (day) {
        // Parse local hour from start time
        let sTime = res.startTime;
        let eTime = res.endTime;
        if (sTime.includes('Z')) {
           // Basic fallback if still in ISO UTC
           sTime = sTime.replace('Z', '');
        }
        if (eTime.includes('Z')) {
           eTime = eTime.replace('Z', '');
        }

        day.activities.push({
          id: res.id,
          type: res.type,
          title: `Reserva: ${res.type}`,
          startTime: sTime,
          endTime: eTime,
          location: res.location,
          coordinates: res.coordinates,
          isFixed: true,
          source: 'reservation',
          reason: 'Reserva confirmada preexistente'
        });
      } else {
        draft.overallWarnings.push(`Reserva fixa ${res.id} está fora do período da viagem.`);
      }
    });

    // Determine availability windows per day
    draft.days.forEach(day => {
      // Sort activities by start time alphabetically since they are YYYY-MM-DDTHH:mm:ss
      day.activities.sort((a, b) => a.startTime.localeCompare(b.startTime));
    });

    // Fill gaps with Match 'yes' and 'maybe'
    const catalog = [...input.catalog];
    // Filter out avoidances / 'no' votes
    const validCatalog = catalog.filter(item => {
      const vote = input.matchVotes[item.id];
      if (vote === 'no' || vote === 'dislike') return false;
      return true;
    });

    // Separate by yes/love and maybe/unknown
    const priorityItems = validCatalog.filter(item => ['yes', 'love'].includes(input.matchVotes[item.id]));
    const secondaryItems = validCatalog.filter(item => !['yes', 'love'].includes(input.matchVotes[item.id]));

    // Global Used IDs
    const usedIds = new Set<string>();

    const pad = (n: number) => n.toString().padStart(2, '0');

    // A simple deterministic pass
    // Start at 09:00, end at 21:00 (Local semantics)
    draft.days.forEach(day => {
      const [dy, dm, dd] = day.date.split('-').map(Number);
      // We will use local MS counter for the day from 00:00 to 23:59 purely for gap math
      // 09:00 is 9 * 3600000 ms from start of day
      const dayStartMs = 9 * 3600000;
      const dayEndMs = 21 * 3600000;

      let currentMs = dayStartMs;

      for (const act of day.activities) {
        if (act.isFixed) {
          // parse act.startTime local string to ms from 00:00
          const timePart = act.startTime.split('T')[1] || "00:00:00";
          const [h, m, s] = timePart.split(':').map(Number);
          const actStartMs = (h * 3600000) + (m * 60000);
          
          currentMs = this.fillWindow(day, currentMs, actStartMs, priorityItems, secondaryItems, usedIds, input);
          
          const endPart = act.endTime.split('T')[1] || "00:00:00";
          const [eh, em, es] = endPart.split(':').map(Number);
          const actEndMs = (eh * 3600000) + (em * 60000);
          
          currentMs = actEndMs + (30 * 60000); // 30 min buffer after
        }
      }

      if (currentMs < dayEndMs) {
        this.fillWindow(day, currentMs, dayEndMs, priorityItems, secondaryItems, usedIds, input);
      }
    });

    // Verify overlaps
    draft.days.forEach(day => {
      day.activities.sort((a, b) => a.startTime.localeCompare(b.startTime));
      for (let i = 0; i < day.activities.length - 1; i++) {
        const a = day.activities[i];
        const b = day.activities[i+1];
        if (a.endTime > b.startTime) {
           day.warnings.push(`Sobreposição detectada entre ${a.title} e ${b.title}`);
        }
      }
    });

    return draft;
  }

  private static insertFlightAnchor(draft: ItineraryDraftV1, flight: FlightSegment, type: 'arrival' | 'departure') {
    // Determine the local datetime string
    // departureLocalDateTime is often YYYY-MM-DDTHH:mm:00
    const localStr = type === 'arrival' ? flight.arrivalLocalDateTime : flight.departureLocalDateTime;
    if (!localStr) {
      draft.overallWarnings.push(`Voo ${flight.flightNumber} sem horário local definido. Omissão de âncora.`);
      return;
    }
    
    // localStr format: YYYY-MM-DDTHH:mm:00 (no Z)
    const dateStr = localStr.split('T')[0];
    const day = draft.days.find(d => d.date === dateStr);

    if (day) {
      // Calculate buffer purely via string math or simple hour math
      const timePart = localStr.split('T')[1] || "00:00:00";
      const [h, m] = timePart.split(':').map(Number);
      const flightMs = (h * 3600000) + (m * 60000);

      const bufferMs = type === 'arrival' ? 2 * 3600000 : 3 * 3600000;
      
      const stMs = type === 'arrival' ? flightMs : flightMs - bufferMs;
      const etMs = type === 'arrival' ? flightMs + bufferMs : flightMs;

      const pad = (n: number) => n.toString().padStart(2, '0');
      const toTime = (ms: number) => {
         const d = new Date(ms); // using unix epoch just for formatting 00:00 UTC
         const hrs = Math.floor(ms / 3600000);
         const mins = Math.floor((ms % 3600000) / 60000);
         return `${pad(Math.max(0, Math.min(23, hrs)))}:${pad(Math.max(0, Math.min(59, mins)))}:00`;
      };

      day.activities.push({
        id: `flight-${type}`,
        type: 'flight',
        title: type === 'arrival' ? `Chegada do Voo ${flight.flightNumber}` : `Partida do Voo ${flight.flightNumber}`,
        startTime: `${dateStr}T${toTime(stMs)}`,
        endTime: `${dateStr}T${toTime(etMs)}`,
        isFixed: true,
        source: 'flight',
        reason: 'Restrição Logística Absoluta'
      });
    } else {
       draft.overallWarnings.push(`O voo ${flight.flightNumber} ocorre em ${dateStr}, que está fora das datas da viagem.`);
    }
  }

  private static fillWindow(
    day: DaySchedule,
    startMs: number,
    endMs: number,
    priority: any[],
    secondary: any[],
    usedIds: Set<string>,
    input: TripEngineInputV1
  ): number {
    let curr = startMs;
    const maxPaceActs = input.pace === 'relaxed' ? 2 : input.pace === 'intense' ? 4 : 3;
    let added = 0;

    const [dy, dm, dd] = day.date.split('-');

    while (curr < endMs && added < maxPaceActs) {
      let candidate = null;
      let isPriority = false;

      // Find unused priority
      const pCand = priority.find(p => !usedIds.has(p.id));
      if (pCand) {
        candidate = pCand;
        isPriority = true;
      } else {
        const sCand = secondary.find(s => !usedIds.has(s.id));
        if (sCand) candidate = sCand;
      }

      if (!candidate) break;

      const durationMins = candidate.durationHours ? candidate.durationHours * 60 : 120;
      const durationMs = durationMins * 60000;

      if (curr + durationMs <= endMs) {
        usedIds.add(candidate.id); // Mark globally used
        
        const pad = (n: number) => n.toString().padStart(2, '0');
        const toTime = (ms: number) => {
           const hrs = Math.floor(ms / 3600000);
           const mins = Math.floor((ms % 3600000) / 60000);
           return `${pad(Math.max(0, Math.min(23, hrs)))}:${pad(Math.max(0, Math.min(59, mins)))}:00`;
        };

        const vote = input.matchVotes[candidate.id];
        let reason = 'Sugestão da IA';
        if (vote === 'yes') reason = 'Match Confirmado (Yes)';
        if (vote === 'love') reason = 'Match Favorito (Love)';
        if (vote === 'maybe') reason = 'Sugestão Aberta (Maybe)';

        day.activities.push({
          id: candidate.id,
          type: 'experience',
          title: candidate.name || candidate.title,
          startTime: `${day.date}T${toTime(curr)}`,
          endTime: `${day.date}T${toTime(curr + durationMs)}`,
          location: candidate.address,
          coordinates: candidate.lat && candidate.lng ? { lat: candidate.lat, lng: candidate.lng } : undefined,
          isFixed: false,
          source: 'engine',
          reason: reason
        });
        curr += durationMs + (30 * 60000); // 30m travel buffer
        added++;
      } else {
        break; // Doesn't fit
      }
    }

    return curr;
  }
}
