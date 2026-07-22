import { TripEngineInputV1, FixedAnchor, FlightSegment } from './contracts';
import { SemanticRules } from './semanticRules';

export interface ScheduledActivity {
  id: string;
  type: string; // 'flight' | 'logistics' | 'hotel' | 'experience'
  title: string;
  startTime: string; // "YYYY-MM-DDTHH:mm:00" local format
  endTime: string; // "YYYY-MM-DDTHH:mm:00" local format
  location?: string;
  coordinates?: { lat: number; lng: number };
  isFixed: boolean;
  isEstimatedTime?: boolean; // For engine-suggested times
  isDecisionPending?: boolean; // For luggage decisions
  isWindow?: boolean; // Represents a flexible threshold, e.g. "From 15:00"
  source: 'flight' | 'reservation' | 'engine' | 'logistics' | 'hotel';
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
      draft.overallWarnings.push("Voo de chegada não identificado.");
    }
    
    if (input.departureFlight) {
      tripEndMs = this.injectDepartureLogistics(draft, input);
    } else {
      draft.overallWarnings.push("Voo de partida não identificado. Último dia bloqueado por segurança.");
    }

    // 2. Insert Fixed Reservations
    input.fixedReservations.forEach(res => {
      const day = draft.days.find(d => d.date === res.date);
      if (day) {
        let sTime = res.startTime;
        let eTime = res.endTime;
        if (sTime.includes('Z')) sTime = sTime.replace('Z', '');
        if (eTime.includes('Z')) eTime = eTime.replace('Z', '');

        const actStartMs = this.parseMs(sTime.split('T')[1]);
        const absoluteActMs = new Date(day.date).getTime() + actStartMs;
        
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
    const usedParentRoles: Record<string, number> = {};
    const usedSemanticRoles: Record<string, number> = {};
    const usedFoodSubtypes: Record<string, number> = {};
    const usedGlobalCounts = { parent: usedParentRoles, semantic: usedSemanticRoles, food: usedFoodSubtypes };

    // 4. Fill gaps with Semantic Rules
    draft.days.forEach(day => {
      let dayStartMs = 9 * 3600000;
      let dayEndMs = 21 * 3600000;

      const absoluteDayStart = new Date(day.date).getTime();
      const isFirstDay = tripStartMs !== -1 && tripStartMs >= absoluteDayStart && tripStartMs < absoluteDayStart + 86400000;
      
      // Strict pre-trip check
      if (tripStartMs !== -1 && absoluteDayStart + dayEndMs < tripStartMs) {
         day.warnings.push("Pré-viagem. Nenhuma atividade programada.");
         return; 
      }
      
      // Strict post-trip check
      if (tripEndMs !== -1 && absoluteDayStart >= tripEndMs) {
         day.warnings.push("Pós-viagem. Nenhuma atividade programada.");
         return;
      }
      
      // Missing departure flight blocks the last day to prevent fake assumptions
      if (tripEndMs === -1 && absoluteDayStart === new Date(input.endDate).getTime()) {
         day.warnings.push("Planejamento incompleto: informe sua partida para liberar atividades com segurança.");
         return;
      }

      // Arrival day adjustment
      if (isFirstDay) {
         const arrivalEndMsOfDay = tripStartMs - absoluteDayStart;
         if (arrivalEndMsOfDay > dayStartMs) dayStartMs = arrivalEndMsOfDay;
      }

      // Departure day adjustment
      if (tripEndMs !== -1 && tripEndMs >= absoluteDayStart && tripEndMs < absoluteDayStart + 86400000) {
         const depStartMsOfDay = tripEndMs - absoluteDayStart;
         if (depStartMsOfDay < dayEndMs) dayEndMs = depStartMsOfDay;
      }

      let currentMs = dayStartMs;
      const usedParentRolesPerDay: Record<string, number> = {};
      const usedSemanticRolesPerDay: Record<string, number> = {};
      const usedFoodSubtypesPerDay: Record<string, number> = {};
      let lastMealMs = 0;

      const dailyCounts = { parent: usedParentRolesPerDay, semantic: usedSemanticRolesPerDay, food: usedFoodSubtypesPerDay, lastMealMs };

      // Extract only blocking activities for the loop
      const blockingActs = day.activities.filter(a => !a.isWindow && (a.isFixed || a.source === 'logistics' || a.source === 'hotel'));
      blockingActs.sort((a, b) => a.startTime.localeCompare(b.startTime));

      for (const act of blockingActs) {
        const actStartMs = this.parseMs(act.startTime.split('T')[1]);
        
        if (currentMs < actStartMs) {
           currentMs = this.fillWindow(day, currentMs, actStartMs, priorityItems, secondaryItems, usedIds, usedGlobalCounts, dailyCounts, input, isFirstDay);
        }
        
        const actEndMs = this.parseMs(act.endTime.split('T')[1]);
        currentMs = actEndMs + (30 * 60000); // 30 min buffer
      }

      if (currentMs < dayEndMs) {
        this.fillWindow(day, currentMs, dayEndMs, priorityItems, secondaryItems, usedIds, usedGlobalCounts, dailyCounts, input, isFirstDay);
      }
    });

    // 5. Final Sorting and Overlap Detection
    draft.days.forEach(day => {
      day.activities.sort((a, b) => {
        // If times are exactly equal, Windows go first
        if (a.startTime === b.startTime) {
           if (a.isWindow && !b.isWindow) return -1;
           if (!a.isWindow && b.isWindow) return 1;
        }
        return a.startTime.localeCompare(b.startTime);
      });

      // Overlap check ignores isWindow
      const nonWindowActs = day.activities.filter(a => !a.isWindow);
      for (let i = 0; i < nonWindowActs.length - 1; i++) {
        const a = nonWindowActs[i];
        const b = nonWindowActs[i+1];
        if (a.endTime > b.startTime) {
           day.warnings.push(`[TEMPORAL_OVERLAP] Conflito detectado entre ${a.title} e ${b.title}`);
        }
      }
    });

    draft.days.forEach(day => {
       const dailyRoles: Record<string, number> = {};
       const meals = ['lunch', 'dinner', 'pizza', 'fast_food', 'brunch'];
       let mealCount = 0;
       
       day.activities.forEach(act => {
          if (act.isWindow && act.endTime && !act.id.includes('checkin')) {
             // We allow checkin to have endTime internally for buffer calculation, but UI will hide it
          }

          if (act.type === 'experience' && act.source !== 'logistics' && act.source !== 'hotel') {
             // Find original item to check role
             const originalItem = input.catalog.find(c => c.id === act.id);
             if (originalItem) {
                const classif = SemanticRules.getClassification(originalItem);
                const role = classif?.semanticRole;
                const parentRole = classif?.parentRole;
                const [h, m] = act.startTime.split('T')[1].split(':').map(Number);
                const startMs = h * 3600000 + m * 60000;
                
                if (role === 'dinner' && startMs < 17 * 3600000) {
                   day.warnings.push(`[INVALID_MEAL_PERIOD] ${act.title} agendado antes do período de jantar`);
                }
                if (role === 'nightlife' && startMs < 18 * 3600000) {
                   day.warnings.push(`[INVALID_NIGHTLIFE_PERIOD] ${act.title} agendado antes da noite`);
                }
                
                if (role && parentRole) {
                   dailyRoles[role] = (dailyRoles[role] || 0) + 1;
                   if (dailyRoles[role] > 1 && !['panoramic_view'].includes(role)) {
                      day.warnings.push(`[DAILY_ROLE_OVERLOAD] Múltiplas experiências do tipo ${role} no mesmo dia`);
                   }
                   if (meals.includes(role)) {
                      mealCount++;
                      if (mealCount > 2) {
                         day.warnings.push(`[DUPLICATE_FOOD_SUBTYPE] Excesso de refeições no mesmo dia`);
                      }
                   }
                }
             }
          }
       });
       
       if (day.date === input.tripStartDate && mealCount > 2) {
          day.warnings.push(`[ARRIVAL_DAY_OVERLOAD] Excesso de refeições no dia da chegada`);
       }
    });

    // 6. Repair Pass
    draft.days.forEach(day => {
       const hasRepairableWarning = day.warnings.some(w => 
          w.includes('DAILY_ROLE_OVERLOAD') || 
          w.includes('GLOBAL_ROLE_OVERLOAD') || 
          w.includes('DUPLICATE_FOOD_SUBTYPE') || 
          w.includes('ARRIVAL_DAY_OVERLOAD')
       );
       
       if (hasRepairableWarning) {
          // Identify lowest priority item (engine source / maybe)
          let toRemoveIdx = -1;
          for (let i = day.activities.length - 1; i >= 0; i--) {
             const a = day.activities[i];
             if (a.type === 'experience' && a.source !== 'logistics' && a.source !== 'hotel') {
                const originalItem = input.catalog.find(c => c.id === a.id);
                if (originalItem) {
                   const classif = SemanticRules.getClassification(originalItem);
                   if (classif?.parentRole === 'rooftop' || classif?.parentRole === 'food') {
                      toRemoveIdx = i;
                      break; // Just remove the last conflicting item for now
                   }
                }
             }
          }
          if (toRemoveIdx !== -1) {
             const removed = day.activities.splice(toRemoveIdx, 1)[0];
             day.warnings = day.warnings.filter(w => 
                !w.includes('DAILY_ROLE_OVERLOAD') && 
                !w.includes('DUPLICATE_FOOD_SUBTYPE') && 
                !w.includes('ARRIVAL_DAY_OVERLOAD')
             );
             day.warnings.push(`[REPAIR_PASS] Atividade removida devido a violação semântica: ${removed.title}`);
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
    
    day.activities.push({
      id: `arr-flight`, type: 'flight', title: `Chegada do Voo ${flight.flightNumber}`,
      startTime: `${dateStr}T${this.toTimeStr(flightMs)}`,
      endTime: `${dateStr}T${this.toTimeStr(flightMs + 1800000)}`, 
      isFixed: true, source: 'flight', reason: 'Aterrissagem confirmada'
    });

    const immEndMs = flightMs + (90 * 60000);
    day.activities.push({
      id: `arr-imm`, type: 'logistics', title: `Imigração e Desembarque`,
      startTime: `${dateStr}T${this.toTimeStr(flightMs + 1800000)}`,
      endTime: `${dateStr}T${this.toTimeStr(immEndMs)}`,
      isFixed: false, isEstimatedTime: true, source: 'logistics', reason: 'Estimativa base'
    });

    const transitEndMs = immEndMs + (60 * 60000);
    day.activities.push({
      id: `arr-transit`, type: 'logistics', title: `Deslocamento para ${input.basecamp?.name || 'Região Central'}`,
      startTime: `${dateStr}T${this.toTimeStr(immEndMs)}`,
      endTime: `${dateStr}T${this.toTimeStr(transitEndMs)}`,
      isFixed: false, isEstimatedTime: true, source: 'logistics', reason: 'Estimativa base'
    });

    const isAfter3pm = transitEndMs >= 15 * 3600000;
    
    // Luggage Decision
    const hotelEndMs = transitEndMs + (30 * 60000);
    if (!isAfter3pm) {
       day.activities.push({
         id: `arr-luggage`, type: 'hotel', title: 'Decisão: Guarda de Bagagem',
         location: input.basecamp?.name,
         startTime: `${dateStr}T${this.toTimeStr(transitEndMs)}`,
         endTime: `${dateStr}T${this.toTimeStr(hotelEndMs)}`,
         isFixed: false, isDecisionPending: true, source: 'hotel', 
         reason: input.basecamp ? 'Opção sugerida: consultar hotel. Alternativa: locker externo.' : 'Decisão pendente: locker ou hotel?'
       });
       // Optional Rest Block
       const restEndMs = hotelEndMs + (60 * 60000);
       day.activities.push({
         id: `arr-rest`, type: 'logistics', title: 'Pausa / Café / Descanso',
         startTime: `${dateStr}T${this.toTimeStr(hotelEndMs)}`,
         endTime: `${dateStr}T${this.toTimeStr(restEndMs)}`,
         isFixed: false, isEstimatedTime: true, source: 'logistics', reason: 'Recuperação de energia sugerida'
       });
       
       // Add Check-in Window Reminder
       day.activities.push({
         id: `arr-checkin`, type: 'hotel', title: 'Check-in disponível (Estimado)',
         location: input.basecamp?.name,
         startTime: `${dateStr}T15:00:00`,
         endTime: `${dateStr}T15:30:00`,
         isFixed: false, isEstimatedTime: true, isWindow: true, source: 'hotel', reason: 'A partir das 15:00'
       });
       
       return new Date(dateStr).getTime() + restEndMs;
    } else {
       day.activities.push({
         id: `arr-hotel`, type: 'hotel', title: 'Check-in e Acomodação',
         location: input.basecamp?.name,
         startTime: `${dateStr}T${this.toTimeStr(transitEndMs)}`,
         endTime: `${dateStr}T${this.toTimeStr(hotelEndMs)}`,
         isFixed: false, isEstimatedTime: true, source: 'hotel', 
         reason: 'Horário compatível com check-in'
       });
       return new Date(dateStr).getTime() + hotelEndMs;
    }
  }

  private static injectDepartureLogistics(draft: ItineraryDraftV1, input: TripEngineInputV1): number {
    const flight = input.departureFlight!;
    const localStr = flight.departureLocalDateTime;
    if (!localStr) return -1;
    
    const dateStr = localStr.split('T')[0];
    const day = draft.days.find(d => d.date === dateStr);
    if (!day) return -1;

    const flightMs = this.parseMs(localStr.split('T')[1]);
    
    day.activities.push({
      id: `dep-flight`, type: 'flight', title: `Partida do Voo ${flight.flightNumber}`,
      startTime: `${dateStr}T${this.toTimeStr(flightMs - 1800000)}`,
      endTime: `${dateStr}T${this.toTimeStr(flightMs)}`,
      isFixed: true, source: 'flight', reason: 'Decolagem'
    });

    const airportArrivalMs = flightMs - (3 * 3600000);
    day.activities.push({
      id: `dep-airport`, type: 'logistics', title: `Procedimentos de Embarque`,
      startTime: `${dateStr}T${this.toTimeStr(airportArrivalMs)}`,
      endTime: `${dateStr}T${this.toTimeStr(flightMs - 1800000)}`,
      isFixed: false, isEstimatedTime: true, source: 'logistics', reason: 'Antecedência recomendada (3h)'
    });

    const transitStartMs = airportArrivalMs - (60 * 60000);
    day.activities.push({
      id: `dep-transit`, type: 'logistics', title: `Deslocamento para Aeroporto`,
      startTime: `${dateStr}T${this.toTimeStr(transitStartMs)}`,
      endTime: `${dateStr}T${this.toTimeStr(airportArrivalMs)}`,
      isFixed: false, isEstimatedTime: true, source: 'logistics', reason: 'Estimativa base'
    });

    const luggageStartMs = transitStartMs - (30 * 60000);
    day.activities.push({
      id: `dep-luggage`, type: 'hotel', title: `Recuperação de Bagagens`,
      location: input.basecamp?.name,
      startTime: `${dateStr}T${this.toTimeStr(luggageStartMs)}`,
      endTime: `${dateStr}T${this.toTimeStr(transitStartMs)}`,
      isFixed: false, isDecisionPending: true, source: 'hotel', reason: 'Decisão: retornar à base ou locker?'
    });

    if (luggageStartMs > 11 * 3600000) {
      day.activities.push({
        id: `dep-checkout`, type: 'hotel', title: `Janela de Check-out`,
        location: input.basecamp?.name,
        startTime: `${dateStr}T11:00:00`,
        endTime: `${dateStr}T11:30:00`,
        isFixed: false, isEstimatedTime: true, isWindow: true, source: 'hotel', reason: 'Até as 11:00'
      });
    }

    return new Date(dateStr).getTime() + luggageStartMs;
  }

  private static fillWindow(
    day: DaySchedule,
    startMs: number,
    endMs: number,
    priority: any[],
    secondary: any[],
    usedIds: Set<string>,
    usedGlobal: { parent: Record<string, number>, semantic: Record<string, number>, food: Record<string, number> },
    dailyCounts: { parent: Record<string, number>, semantic: Record<string, number>, food: Record<string, number>, lastMealMs: number },
    input: TripEngineInputV1,
    isFirstDay: boolean
  ): number {
    let curr = startMs;
    let maxPaceActs = input.pace === 'relaxed' ? 2 : input.pace === 'intense' ? 4 : 3;
    let added = 0;

    const getCandidates = (list: any[]) => {
      return list.filter(item => {
        if (usedIds.has(item.id)) return false;
        
        if (isFirstDay && SemanticRules.isHighFriction(item)) return false;
        
        const classif = SemanticRules.getClassification(item);
        if (classif) {
           const { parentRole, semanticRole, foodSubtype } = classif;
           const isMeal = ['lunch', 'dinner', 'flexible_food', 'brunch', 'breakfast'].includes(semanticRole);
           const vote = input.matchVotes[item.id];
           const isLoved = vote === 'love';
           
           // Global Diversity Check
           if (usedGlobal.parent[parentRole] >= SemanticRules.getMaxInstancesPerRole(parentRole) && !isLoved) return false;
           if (foodSubtype && usedGlobal.food[foodSubtype] >= SemanticRules.getMaxInstancesPerFoodSubtype(foodSubtype) && !isLoved) return false;
           
           // Daily Diversity Check
           if (dailyCounts.semantic[semanticRole] >= 1 && !isLoved) return false;
           
           if (parentRole === 'rooftop' && dailyCounts.parent['rooftop'] >= 1) return false; // Max 1 rooftop per day
           
           if (isMeal) {
              // Spacing check
              if (dailyCounts.lastMealMs > 0 && (curr - dailyCounts.lastMealMs) < 3.5 * 3600000) return false; // 3.5 hours between meals
              
              if (isFirstDay) {
                 const mealsToday = ['lunch', 'dinner', 'flexible_food', 'brunch', 'breakfast'].reduce((acc, r) => acc + (dailyCounts.semantic[r] || 0), 0);
                 if (mealsToday >= 1) return false; // Max 1 main meal on arrival day
              }
           }
        }
        
        const windows = SemanticRules.getValidWindows(item, day.date);
        const duration = SemanticRules.getEstimatedDurationMs(item);
        return windows.some(w => curr >= w.startMs && curr + duration <= Math.min(w.endMs, endMs));
      });
    };

    while (curr < endMs && added < maxPaceActs) {
      let candidate = null;

      const pCandidates = getCandidates(priority);
      if (pCandidates.length > 0) candidate = pCandidates[0]; 
      else {
        const sCandidates = getCandidates(secondary);
        if (sCandidates.length > 0) candidate = sCandidates[0];
      }

      if (!candidate) {
         curr += 30 * 60000;
         if (curr >= endMs) break;
         continue; 
      }

      const durationMs = SemanticRules.getEstimatedDurationMs(candidate);

      if (curr + durationMs <= endMs) {
        usedIds.add(candidate.id); 
        
        const classif = SemanticRules.getClassification(candidate);
        if (classif) {
           usedGlobal.parent[classif.parentRole] = (usedGlobal.parent[classif.parentRole] || 0) + 1;
           usedGlobal.semantic[classif.semanticRole] = (usedGlobal.semantic[classif.semanticRole] || 0) + 1;
           if (classif.foodSubtype) usedGlobal.food[classif.foodSubtype] = (usedGlobal.food[classif.foodSubtype] || 0) + 1;
           
           dailyCounts.parent[classif.parentRole] = (dailyCounts.parent[classif.parentRole] || 0) + 1;
           dailyCounts.semantic[classif.semanticRole] = (dailyCounts.semantic[classif.semanticRole] || 0) + 1;
           if (classif.foodSubtype) dailyCounts.food[classif.foodSubtype] = (dailyCounts.food[classif.foodSubtype] || 0) + 1;
           
           const isMeal = ['lunch', 'dinner', 'flexible_food', 'brunch', 'breakfast'].includes(classif.semanticRole);
           if (isMeal) {
              dailyCounts.lastMealMs = curr + durationMs;
           }
        }
        
        const vote = input.matchVotes[candidate.id];
        let reason = 'Sugestão estimada';
        if (vote === 'yes') reason = 'Match (Yes) - Estimativa';
        if (vote === 'love') reason = 'Match (Love) - Estimativa';

        day.activities.push({
          id: candidate.id,
          type: 'experience',
          title: candidate.name || candidate.title,
          startTime: `${day.date}T${this.toTimeStr(curr)}`,
          endTime: `${day.date}T${this.toTimeStr(curr + durationMs)}`,
          location: candidate.address || candidate.location,
          isFixed: false,
          isEstimatedTime: true,
          source: 'engine',
          reason: reason
        });
        curr += durationMs + (30 * 60000);
        added++;
      } else {
        break; 
      }
    }

    return curr;
  }
}
