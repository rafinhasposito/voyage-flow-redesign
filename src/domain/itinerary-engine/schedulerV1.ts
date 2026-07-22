import { TripEngineInputV1, FixedAnchor, FlightSegment } from './contracts';

export interface ScheduledActivity {
  id: string;
  type: string;
  title: string;
  startTime: string; // ISO string local or UTC
  endTime: string; // ISO string
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

    const sDate = new Date(input.startDate);
    const eDate = new Date(input.endDate);
    const diffDays = Math.ceil((eDate.getTime() - sDate.getTime()) / (1000 * 3600 * 24)) + 1;

    for (let i = 0; i < diffDays; i++) {
      const current = new Date(sDate.getTime() + i * 86400000);
      draft.days.push({
        date: current.toISOString().split('T')[0],
        activities: [],
        warnings: []
      });
    }

    // Insert Flights
    if (input.arrivalFlight) {
      this.insertFlightAnchor(draft, input.arrivalFlight, 'arrival');
    }
    if (input.departureFlight) {
      this.insertFlightAnchor(draft, input.departureFlight, 'departure');
    }

    // Insert Fixed Reservations
    input.fixedReservations.forEach(res => {
      const day = draft.days.find(d => d.date === res.date);
      if (day) {
        day.activities.push({
          id: res.id,
          type: res.type,
          title: `Reserva: ${res.type}`,
          startTime: res.startTime,
          endTime: res.endTime,
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
      // Sort activities by start time
      day.activities.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    });

    // Fill gaps with Match 'yes' and 'maybe'
    const catalog = [...input.catalog];
    // Filter out avoidances / 'no' votes
    const validCatalog = catalog.filter(item => {
      const vote = input.matchVotes[item.id];
      if (vote === 'no') return false;
      // Also filter by avoidances if categories were mapped
      return true;
    });

    // Separate by yes/love and maybe/unknown
    const priorityItems = validCatalog.filter(item => ['yes', 'love'].includes(input.matchVotes[item.id]));
    const secondaryItems = validCatalog.filter(item => !['yes', 'love'].includes(input.matchVotes[item.id]));

    let priorityIdx = 0;
    let secondaryIdx = 0;

    // A simple deterministic pass
    // Start at 09:00, end at 21:00
    draft.days.forEach(day => {
      const dayStart = new Date(`${day.date}T09:00:00Z`); // Mocking local as Z for simple diff logic
      const dayEnd = new Date(`${day.date}T21:00:00Z`);

      let currentTime = dayStart.getTime();

      // We inject items between fixed activities
      for (const act of day.activities) {
        if (act.isFixed) {
          const actStart = new Date(act.startTime).getTime();
          // Fill from currentTime to actStart
          currentTime = this.fillWindow(day, currentTime, actStart, priorityItems, secondaryItems, priorityIdx, secondaryIdx, input);
          priorityIdx = this.updateIdx(day.activities, priorityItems);
          secondaryIdx = this.updateIdx(day.activities, secondaryItems);
          currentTime = new Date(act.endTime).getTime() + (30 * 60000); // 30 min buffer after
        }
      }

      // Fill remaining day
      if (currentTime < dayEnd.getTime()) {
        this.fillWindow(day, currentTime, dayEnd.getTime(), priorityItems, secondaryItems, priorityIdx, secondaryIdx, input);
        priorityIdx = this.updateIdx(day.activities, priorityItems);
        secondaryIdx = this.updateIdx(day.activities, secondaryItems);
      }
    });

    // Verify overlaps (simple check)
    draft.days.forEach(day => {
      day.activities.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
      for (let i = 0; i < day.activities.length - 1; i++) {
        const a = day.activities[i];
        const b = day.activities[i+1];
        if (new Date(a.endTime).getTime() > new Date(b.startTime).getTime()) {
           day.warnings.push(`Sobreposição detectada entre ${a.title} e ${b.title}`);
        }
      }
    });

    return draft;
  }

  private static insertFlightAnchor(draft: ItineraryDraftV1, flight: FlightSegment, type: 'arrival' | 'departure') {
    const datetimeStr = type === 'arrival' ? flight.arrivalLocalDateTime : flight.departureLocalDateTime;
    const instant = type === 'arrival' ? flight.arrivalInstant : flight.departureInstant;
    if (!datetimeStr && !instant) return;

    const dateObj = new Date(instant || datetimeStr);
    const dateStr = dateObj.toISOString().split('T')[0];

    const day = draft.days.find(d => d.date === dateStr);
    if (day) {
      const bufferMs = type === 'arrival' ? 2 * 3600000 : 3 * 3600000; // 2h after arrival, 3h before departure
      
      const st = type === 'arrival' ? dateObj.getTime() : dateObj.getTime() - bufferMs;
      const et = type === 'arrival' ? dateObj.getTime() + bufferMs : dateObj.getTime();

      day.activities.push({
        id: `flight-${type}`,
        type: 'flight',
        title: type === 'arrival' ? `Chegada do Voo ${flight.flightNumber}` : `Partida do Voo ${flight.flightNumber}`,
        startTime: new Date(st).toISOString(),
        endTime: new Date(et).toISOString(),
        isFixed: true,
        source: 'flight',
        reason: 'Restrição Logística Absoluta'
      });
    }
  }

  private static fillWindow(
    day: DaySchedule,
    startMs: number,
    endMs: number,
    priority: any[],
    secondary: any[],
    pIdx: number,
    sIdx: number,
    input: TripEngineInputV1
  ): number {
    let curr = startMs;
    const maxPaceActs = input.pace === 'relaxed' ? 2 : input.pace === 'intense' ? 4 : 3;
    let added = 0;

    while (curr < endMs && added < maxPaceActs) {
      let candidate = null;
      let isPriority = false;

      // Unassigned priority item
      const pCand = priority.find(p => !day.activities.some(a => a.id === p.id) && !input.flexibleReservations.some(r => r.id === p.id));
      if (pCand) {
        candidate = pCand;
        isPriority = true;
      } else {
        const sCand = secondary.find(s => !day.activities.some(a => a.id === s.id) && !input.flexibleReservations.some(r => r.id === s.id));
        if (sCand) candidate = sCand;
      }

      if (!candidate) break;

      // Assuming 2 hours duration for generated items
      const durationMs = 2 * 3600000; 
      if (curr + durationMs <= endMs) {
        day.activities.push({
          id: candidate.id,
          type: 'experience',
          title: candidate.name || candidate.title,
          startTime: new Date(curr).toISOString(),
          endTime: new Date(curr + durationMs).toISOString(),
          location: candidate.address,
          coordinates: candidate.lat && candidate.lng ? { lat: candidate.lat, lng: candidate.lng } : undefined,
          isFixed: false,
          source: 'engine',
          reason: isPriority ? 'Favoritado pelo usuário (Match Yes)' : 'Sugestão da IA (Talvez/Aberto)'
        });
        curr += durationMs + (30 * 60000); // 30m travel buffer
        added++;
      } else {
        break; // Doesn't fit
      }
    }

    return curr;
  }

  private static updateIdx(activities: ScheduledActivity[], sourceArr: any[]) {
     return 0; // The logic uses .find to exclude already added, so idx isn't strictly needed if we scan
  }
}
