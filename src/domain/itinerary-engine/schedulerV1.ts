import { TripEngineInputV1, FixedAnchor, FlightSegment } from './contracts';
import { SemanticRules } from './semanticRules';

export interface ScheduledActivity {
  id: string;
  type: string;
  title: string;
  startTime: string; // "YYYY-MM-DDTHH:mm:00" local format
  endTime: string; // "YYYY-MM-DDTHH:mm:00" local format
  location?: string;
  coordinates?: { lat: number; lng: number };
  isFixed: boolean;
  source: 'flight' | 'reservation' | 'engine' | 'logistics';
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

    // Identify Arrival and Departure Time Boundaries
    let tripStartMs = -1; // -1 means no strict start
    let tripEndMs = -1;

    // 1. Insert Logistics Chains for Flights
    if (input.arrivalFlight) {
      tripStartMs = this.injectArrivalLogistics(draft, input);
    } else {
      draft.overallWarnings.push("Voo de chegada não identificado. Confiança reduzida.");
    }
    
    if (input.departureFlight) {
      tripEndMs = this.injectDepartureLogistics(draft, input);
    } else {
      draft.overallWarnings.push("Voo de partida não identificado. Confiança reduzida.");
    }

    // 2. Insert Fixed Reservations
    input.fixedReservations.forEach(res => {
      const day = draft.days.find(d => d.date === res.date);
      if (day) {
        let sTime = res.startTime;
        let eTime = res.endTime;
        if (sTime.includes('Z')) sTime = sTime.replace('Z', '');
        if (eTime.includes('Z')) eTime = eTime.replace('Z', '');

        // Check bounds
        const actStartMs = this.parseMs(sTime.split('T')[1]);
        const absoluteActMs = new Date(day.date).getTime() + actStartMs;
        
        if (tripStartMs !== -1 && absoluteActMs < tripStartMs) {
           day.warnings.push(`Reserva fixa '${res.type}' ocorre antes da chegada no destino.`);
        }
        if (tripEndMs !== -1 && absoluteActMs > tripEndMs) {
           day.warnings.push(`Reserva fixa '${res.type}' ocorre após a partida do destino.`);
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
      day.activities.sort((a, b) => a.startTime.localeCompare(b.startTime));
    });

    // 3. Prepare Catalog and Filters
    const catalog = [...input.catalog];
    const validCatalog = catalog.filter(item => {
      const vote = input.matchVotes[item.id];
      if (vote === 'no' || vote === 'dislike') return false;
      return true;
    });

    const priorityItems = validCatalog.filter(item => ['yes', 'love'].includes(input.matchVotes[item.id]));
    const secondaryItems = validCatalog.filter(item => !['yes', 'love'].includes(input.matchVotes[item.id]));

    const usedIds = new Set<string>();

    // 4. Fill gaps with Semantic Rules
    draft.days.forEach(day => {
      // Find valid operational window for the day
      let dayStartMs = 9 * 3600000;
      let dayEndMs = 21 * 3600000;

      // If it's a day before arrival flight, SKIP entirely
      const absoluteDayStart = new Date(day.date).getTime();
      if (tripStartMs !== -1 && absoluteDayStart + dayEndMs < tripStartMs) {
         day.warnings.push("Pré-viagem. Nenhuma atividade programada.");
         return; // Skip day
      }
      
      if (tripEndMs !== -1 && absoluteDayStart > tripEndMs) {
         day.warnings.push("Pós-viagem. Nenhuma atividade programada.");
         return;
      }

      // If arrival day, dayStartMs becomes the end of the arrival logistics
      if (tripStartMs !== -1 && tripStartMs >= absoluteDayStart && tripStartMs < absoluteDayStart + 86400000) {
         const arrivalEndMsOfDay = tripStartMs - absoluteDayStart;
         if (arrivalEndMsOfDay > dayStartMs) dayStartMs = arrivalEndMsOfDay;
      }

      // If departure day, dayEndMs becomes the start of the departure logistics
      if (tripEndMs !== -1 && tripEndMs >= absoluteDayStart && tripEndMs < absoluteDayStart + 86400000) {
         const depStartMsOfDay = tripEndMs - absoluteDayStart;
         if (depStartMsOfDay < dayEndMs) dayEndMs = depStartMsOfDay;
      }

      let currentMs = dayStartMs;

      for (const act of day.activities) {
        if (act.isFixed || act.source === 'logistics' || act.source === 'flight') {
          const actStartMs = this.parseMs(act.startTime.split('T')[1]);
          
          if (currentMs < actStartMs) {
             this.fillWindow(day, currentMs, actStartMs, priorityItems, secondaryItems, usedIds, input);
          }
          
          const actEndMs = this.parseMs(act.endTime.split('T')[1]);
          currentMs = actEndMs + (30 * 60000); // 30 min buffer after any fixed act
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

  private static parseMs(timeStr: string): number {
     const [h, m] = (timeStr || "00:00:00").split(':').map(Number);
     return (h * 3600000) + ((m || 0) * 60000);
  }

  private static toTimeStr(ms: number): string {
     const pad = (n: number) => n.toString().padStart(2, '0');
     const hrs = Math.floor(ms / 3600000);
     const mins = Math.floor((ms % 3600000) / 60000);
     return `${pad(Math.max(0, Math.min(23, hrs)))}:${pad(Math.max(0, Math.min(59, mins)))}:00`;
  }

  private static injectArrivalLogistics(draft: ItineraryDraftV1, input: TripEngineInputV1): number {
    const flight = input.arrivalFlight!;
    const localStr = flight.arrivalLocalDateTime;
    if (!localStr) return -1;
    
    const dateStr = localStr.split('T')[0];
    const day = draft.days.find(d => d.date === dateStr);
    
    if (!day) return -1;

    const flightMs = this.parseMs(localStr.split('T')[1]);
    
    // Chain: 
    // 1. Flight Landing
    day.activities.push({
      id: `arr-flight`, type: 'flight', title: `Chegada do Voo ${flight.flightNumber}`,
      startTime: `${dateStr}T${this.toTimeStr(flightMs)}`,
      endTime: `${dateStr}T${this.toTimeStr(flightMs + 1800000)}`, // 30m block for UI
      isFixed: true, source: 'flight', reason: 'Aterrissagem'
    });

    // 2. Immigration & Baggage
    const immEndMs = flightMs + (90 * 60000); // +1.5h
    day.activities.push({
      id: `arr-imm`, type: 'logistics', title: `Imigração e Desembarque`,
      startTime: `${dateStr}T${this.toTimeStr(flightMs + 1800000)}`,
      endTime: `${dateStr}T${this.toTimeStr(immEndMs)}`,
      isFixed: true, source: 'logistics', reason: 'Estimativa'
    });

    // 3. Transit to Basecamp
    const transitEndMs = immEndMs + (60 * 60000); // +1h
    day.activities.push({
      id: `arr-transit`, type: 'logistics', title: `Deslocamento para ${input.basecamp?.name || 'Hospedagem'}`,
      startTime: `${dateStr}T${this.toTimeStr(immEndMs)}`,
      endTime: `${dateStr}T${this.toTimeStr(transitEndMs)}`,
      isFixed: true, source: 'logistics', reason: 'Estimativa'
    });

    // 4. Drop Luggage / Checkin
    const hotelEndMs = transitEndMs + (30 * 60000); // +30m
    const isAfter3pm = transitEndMs >= 15 * 3600000;
    day.activities.push({
      id: `arr-hotel`, type: 'hotel', title: isAfter3pm ? 'Check-in e Acomodação' : 'Guarda de Bagagem',
      location: input.basecamp?.name,
      coordinates: input.basecamp?.lat ? { lat: input.basecamp.lat, lng: input.basecamp.lng } : undefined,
      startTime: `${dateStr}T${this.toTimeStr(transitEndMs)}`,
      endTime: `${dateStr}T${this.toTimeStr(hotelEndMs)}`,
      isFixed: true, source: 'hotel', 
      reason: input.basecamp ? (isAfter3pm ? 'Janela de Check-in liberada' : 'Confirmar política de lockers') : 'Hospedagem desconhecida, locker sugerido'
    });

    // Return absolute MS when the traveler is finally free to do activities
    const absoluteMs = new Date(dateStr).getTime() + hotelEndMs;
    return absoluteMs;
  }

  private static injectDepartureLogistics(draft: ItineraryDraftV1, input: TripEngineInputV1): number {
    const flight = input.departureFlight!;
    const localStr = flight.departureLocalDateTime;
    if (!localStr) return -1;
    
    const dateStr = localStr.split('T')[0];
    const day = draft.days.find(d => d.date === dateStr);
    
    if (!day) return -1;

    const flightMs = this.parseMs(localStr.split('T')[1]);
    
    // Departure Chain (backwards)
    // 1. Flight Departure
    day.activities.push({
      id: `dep-flight`, type: 'flight', title: `Partida do Voo ${flight.flightNumber}`,
      startTime: `${dateStr}T${this.toTimeStr(flightMs - 1800000)}`,
      endTime: `${dateStr}T${this.toTimeStr(flightMs)}`,
      isFixed: true, source: 'flight', reason: 'Decolagem'
    });

    // 2. Airport Anticipation (3 hours prior)
    const airportArrivalMs = flightMs - (3 * 3600000);
    day.activities.push({
      id: `dep-airport`, type: 'logistics', title: `Procedimentos de Embarque`,
      startTime: `${dateStr}T${this.toTimeStr(airportArrivalMs)}`,
      endTime: `${dateStr}T${this.toTimeStr(flightMs - 1800000)}`,
      isFixed: true, source: 'logistics', reason: 'Antecedência recomendada'
    });

    // 3. Transit to Airport (1h)
    const transitStartMs = airportArrivalMs - (60 * 60000);
    day.activities.push({
      id: `dep-transit`, type: 'logistics', title: `Deslocamento para Aeroporto`,
      startTime: `${dateStr}T${this.toTimeStr(transitStartMs)}`,
      endTime: `${dateStr}T${this.toTimeStr(airportArrivalMs)}`,
      isFixed: true, source: 'logistics', reason: 'Estimativa'
    });

    // 4. Luggage Retrieval from Hotel (30m)
    const luggageStartMs = transitStartMs - (30 * 60000);
    day.activities.push({
      id: `dep-luggage`, type: 'hotel', title: `Recuperação de Bagagens`,
      location: input.basecamp?.name,
      coordinates: input.basecamp?.lat ? { lat: input.basecamp.lat, lng: input.basecamp.lng } : undefined,
      startTime: `${dateStr}T${this.toTimeStr(luggageStartMs)}`,
      endTime: `${dateStr}T${this.toTimeStr(transitStartMs)}`,
      isFixed: true, source: 'hotel', reason: 'Retorno ao Basecamp'
    });

    // Also add mandatory Check-out at 11:00 AM (if the user departs after 11AM)
    if (luggageStartMs > 11 * 3600000) {
      day.activities.push({
        id: `dep-checkout`, type: 'hotel', title: `Check-out Obrigatório`,
        location: input.basecamp?.name,
        startTime: `${dateStr}T11:00:00`,
        endTime: `${dateStr}T11:30:00`,
        isFixed: true, source: 'hotel', reason: 'Limite padrão de hospedagem'
      });
    }

    // Return absolute MS of when the traveler must STOP doing activities to start departure logistics
    const absoluteMs = new Date(dateStr).getTime() + luggageStartMs;
    return absoluteMs;
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
    let maxPaceActs = input.pace === 'relaxed' ? 2 : input.pace === 'intense' ? 4 : 3;
    let added = 0;

    // Filter available candidates by SEMANTIC TIME MATCH
    const getCandidates = (list: any[]) => {
      return list.filter(item => {
        if (usedIds.has(item.id)) return false;
        
        const windows = SemanticRules.getValidWindows(item, day.date);
        const duration = SemanticRules.getEstimatedDurationMs(item);
        
        // Check if the current time 'curr' fits within any of the valid semantic windows
        return windows.some(w => curr >= w.startMs && curr + duration <= Math.min(w.endMs, endMs));
      });
    };

    while (curr < endMs && added < maxPaceActs) {
      let candidate = null;
      let isPriority = false;

      // Unused priority that FITS semantically
      const pCandidates = getCandidates(priority);
      if (pCandidates.length > 0) {
        candidate = pCandidates[0]; // naive pick, could be sorted by matchScore
        isPriority = true;
      } else {
        const sCandidates = getCandidates(secondary);
        if (sCandidates.length > 0) candidate = sCandidates[0];
      }

      if (!candidate) {
         // No semantic match fits in this current gap. Advance time by 30 mins to seek next window.
         curr += 30 * 60000;
         if (curr >= endMs) break;
         continue; 
      }

      const durationMs = SemanticRules.getEstimatedDurationMs(candidate);

      if (curr + durationMs <= endMs) {
        usedIds.add(candidate.id); // Mark globally used
        
        const vote = input.matchVotes[candidate.id];
        let reason = 'Sugestão (Horário Compatível)';
        if (vote === 'yes') reason = 'Match (Yes) - Horário Ideal';
        if (vote === 'love') reason = 'Match (Love) - Horário Ideal';

        day.activities.push({
          id: candidate.id,
          type: 'experience',
          title: candidate.name || candidate.title,
          startTime: `${day.date}T${this.toTimeStr(curr)}`,
          endTime: `${day.date}T${this.toTimeStr(curr + durationMs)}`,
          location: candidate.address,
          coordinates: candidate.lat && candidate.lng ? { lat: candidate.lat, lng: candidate.lng } : undefined,
          isFixed: false,
          source: 'engine',
          reason: reason
        });
        curr += durationMs + (30 * 60000); // 30m travel buffer
        added++;
      } else {
        break; 
      }
    }

    return curr;
  }
}
