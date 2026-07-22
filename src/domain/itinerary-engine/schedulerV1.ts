import { TripEngineInputV1, FixedAnchor, FlightSegment, Basecamp } from './contracts';
import { SemanticRules } from './semanticRules';
import { GeoRoutingProvider, LocalDeterministicGeoProvider } from './geoProvider';
import { GeoPoint, RouteSegment, GeoHealthIssue } from './geoContracts';

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
  source: 'flight' | 'reservation' | 'engine' | 'logistics' | 'hotel' | 'transit' | 'catalog';
  reason?: string;
  clusterId?: string; // Phase C Geographic cluster
  routeEstimate?: RouteSegment; // If this is a transit activity
  sourceExperienceId?: string;
  geoSource?: string;
  geoConfidence?: string;
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
  geoHealthIssues: GeoHealthIssue[];
  temporalReadiness: boolean;
  semanticReadiness: boolean;
  semanticReadiness: boolean;
  geographicReadiness: 'READY' | 'PARTIAL' | 'INSUFFICIENT_DATA' | 'FAILED';
  integrationReadiness: boolean;
}

export class SchedulerV1 {
  static async generate(input: TripEngineInputV1, geoProvider?: GeoRoutingProvider): Promise<ItineraryDraftV1> {
    const draft: ItineraryDraftV1 = {
      tripId: input.tripId,
      days: [],
      unassigned: [],
      overallWarnings: [],
      geoHealthIssues: [],
      temporalReadiness: false,
      semanticReadiness: false,
      semanticReadiness: false,
      geographicReadiness: 'FAILED',
      integrationReadiness: false
    };


    let hasBasecampGps = false;
    if (input.basecamp) {
      if (input.basecamp.lat && input.basecamp.lng) hasBasecampGps = true;
      else draft.geoHealthIssues.push({ code: 'BASECAMP_GPS_MISSING', severity: 'warning', message: 'Basecamp não possui coordenadas GPS' });
    }

    input.fixedReservations.forEach(r => {
       if (!r.coordinates?.lat || !r.coordinates?.lng) {
          draft.geoHealthIssues.push({ code: 'FIXED_ANCHOR_GPS_MISSING', severity: 'warning', message: `Reserva fixa ${r.type} não possui GPS`, affectedIds: [r.id] });
       }
    });

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
    for (const day of draft.days) {
      let dayStartMs = 9 * 3600000;
      let dayEndMs = 21 * 3600000;

      const absoluteDayStart = new Date(day.date).getTime();
      const isFirstDay = tripStartMs !== -1 && tripStartMs >= absoluteDayStart && tripStartMs < absoluteDayStart + 86400000;

      // Strict pre-trip check
      if (tripStartMs !== -1 && absoluteDayStart + dayEndMs < tripStartMs) {
         day.warnings.push("Pré-viagem. Nenhuma atividade programada.");
         continue;
      }

      // Strict post-trip check
      if (tripEndMs !== -1 && absoluteDayStart >= tripEndMs) {
         day.warnings.push("Pós-viagem. Nenhuma atividade programada.");
         continue;
      }

      // Missing departure flight blocks the last day to prevent fake assumptions
      if (tripEndMs === -1 && absoluteDayStart === new Date(input.endDate).getTime()) {
         day.warnings.push("Planejamento incompleto: informe sua partida para liberar atividades com segurança.");
         continue;
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
           currentMs = await this.fillWindow(day, currentMs, actStartMs, priorityItems, secondaryItems, usedIds, usedGlobalCounts, dailyCounts, input, isFirstDay, geoProvider, day.activities);
        }

        const actEndMs = this.parseMs(act.endTime.split('T')[1]);
        currentMs = actEndMs + (30 * 60000); // 30 min buffer
      }

      if (currentMs < dayEndMs) {
        await this.fillWindow(day, currentMs, dayEndMs, priorityItems, secondaryItems, usedIds, usedGlobalCounts, dailyCounts, input, isFirstDay, geoProvider, day.activities);
      }
    }

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


    // 7. Inject Route Segments
    if (geoProvider) {
      for (const day of draft.days) {
         const newActs: ScheduledActivity[] = [];
         let lastGeoAct: ScheduledActivity | null = null;

         for (const act of day.activities) {
            if (act.isWindow) {
               newActs.push(act);
               continue;
            }

            let actGeo: GeoPoint | null = null;
            if (act.coordinates?.lat && act.coordinates?.lng) {
               actGeo = { latitude: act.coordinates.lat, longitude: act.coordinates.lng, source: 'unknown', confidence: 'low' };
            } else if (act.location && input.basecamp?.name && act.location === input.basecamp.name && input.basecamp.lat && input.basecamp.lng) {
               actGeo = { latitude: input.basecamp.lat, longitude: input.basecamp.lng, source: 'reservation', confidence: 'high' };
            }

            if (lastGeoAct && actGeo && lastGeoAct.coordinates) {
               // We need a segment
               const origin: GeoPoint = { latitude: lastGeoAct.coordinates.lat!, longitude: lastGeoAct.coordinates.lng!, source: 'unknown', confidence: 'low' };
               const estimate = await geoProvider.getEstimate(origin, actGeo);

               if (estimate.distanceMeters > 50) {
                 const travelMs = estimate.durationMinutes * 60000;
                 const gapMs = new Date(act.startTime).getTime() - new Date(lastGeoAct.endTime).getTime();

                 if (travelMs > gapMs) {
                     // Conflict detected!
                     draft.geoHealthIssues.push({
                        code: 'TRAVEL_TIME_DOES_NOT_FIT',
                        severity: 'critical',
                        message: `Deslocamento de ${estimate.durationMinutes} min excede intervalo de ${Math.round(gapMs / 60000)} min entre ${lastGeoAct.title} e ${act.title}.`
                     });

                     if (!act.isFixed) {
                         draft.overallWarnings.push(`Atividade removida por conflito geográfico (não cabe no tempo): ${act.title}`);
                         continue; // Skip adding this flexible activity
                     } else if (!lastGeoAct.isFixed) {
                         const idx = newActs.findIndex(x => x.id === lastGeoAct!.id);
                         if (idx >= 0) {
                             newActs.splice(idx, 1);
                             draft.overallWarnings.push(`Atividade removida por conflito geográfico com fixo: ${lastGeoAct.title}`);
                             // We skip adding the route segment because the origin was removed.
                             // We keep act, but without a transit segment to it from the now-deleted lastGeoAct.
                             newActs.push(act);
                             if (actGeo) {
                                act.coordinates = { lat: actGeo.latitude, lng: actGeo.longitude };
                                lastGeoAct = act;
                             }
                             continue;
                         }
                     } else {
                         // Unrepaired conflict (both are fixed)
                         draft.geoHealthIssues.push({
                             code: 'UNREPAIRED_TIME_CONFLICT',
                             severity: 'critical',
                             message: `Conflito temporal insuperável: ${lastGeoAct.title} e ${act.title} são fixos e o deslocamento de ${estimate.durationMinutes} min não cabe.`
                         });
                     }
                 }

                 const segment: RouteSegment = {
                    fromActivityId: lastGeoAct.id,
                    toActivityId: act.id,
                    estimate,
                    departureTime: lastGeoAct.endTime,
                    arrivalTime: act.startTime
                 };
                 newActs.push({
                    id: `transit-${lastGeoAct.id}-${act.id}`,
                    type: 'logistics',
                    title: `${lastGeoAct.title} → ${act.title}`,
                    startTime: lastGeoAct.endTime,
                    endTime: act.startTime, // Assuming flexible transit
                    isFixed: false,
                    isEstimatedTime: true,
                    source: 'transit',
                    reason: `Estimativa: ${estimate.durationMinutes} min / ${estimate.distanceMeters} m`,
                    routeEstimate: segment
                 });
               }
            }

            newActs.push(act);
            if (actGeo) {
               act.coordinates = { lat: actGeo.latitude, lng: actGeo.longitude };
               lastGeoAct = act;
            }
         }
         day.activities = newActs;
      }
    }

    // Quality Check: Duplicate Coordinates
    const coordsMap = new Map<string, string[]>();
    input.catalog.forEach(c => {
       const lat = c.coordinates?.lat || c.location_lat;
       const lng = c.coordinates?.lng || c.location_lng;
       if (lat && lng) {
          const key = `${lat},${lng}`;
          if (!coordsMap.has(key)) coordsMap.set(key, []);
          coordsMap.get(key)!.push(c.title);
       }
    });
    coordsMap.forEach((titles, key) => {
       if (titles.length > 1) {
          draft.geoHealthIssues.push({
             code: 'DUPLICATE_GEOPOINT_REVIEW_REQUIRED',
             severity: 'warning',
             message: `As seguintes experiências possuem exatamente as mesmas coordenadas (${key}): ${titles.join(', ')}.`
          });
       }
    });

    let hasBasecampWarning = draft.geoHealthIssues.some(g => g.code === 'BASECAMP_GPS_MISSING');
    let totalActsGeo = 0;
    let gpsActs = 0;
    let generatedSegments = 0;

    draft.days.forEach(day => {
      day.activities.forEach(act => {
        if (['experience', 'hotel', 'flight', 'reservation'].includes(act.type)) {
          totalActsGeo++;
          if (act.coordinates) gpsActs++;
        }
        if (act.source === 'transit') {
          generatedSegments++;
        }
      });
    });

    // We use the same getSituation logic to see if mapping failed
    let mappingFailed = false;
    draft.days.forEach(day => {
      day.activities.forEach(act => {
        if (act.type === 'experience') {
           const origItem = input.catalog.find(c => c.id === act.sourceExperienceId || c.id === act.id);
           if (!origItem) mappingFailed = true;
        }
      });
    });

    const hasUnrepairedConflict = draft.geoHealthIssues.some(g => g.code === 'UNREPAIRED_TIME_CONFLICT');

    if (mappingFailed || hasUnrepairedConflict) {
       draft.geographicReadiness = 'FAILED';
    } else if (gpsActs === 0 || totalActsGeo === 0) {
       draft.geographicReadiness = 'INSUFFICIENT_DATA';
    } else if (generatedSegments === 0 && totalActsGeo > 1) {
       draft.geographicReadiness = 'INSUFFICIENT_DATA';
    } else if (gpsActs < totalActsGeo || hasBasecampWarning) {
       draft.geographicReadiness = 'PARTIAL';
    } else {
       draft.geographicReadiness = 'READY';
    }

    draft.temporalReadiness = draft.overallWarnings.length === 0;
    draft.semanticReadiness = !draft.days.some(d => d.warnings.length > 0);
    draft.integrationReadiness = draft.temporalReadiness && draft.semanticReadiness && (draft.geographicReadiness === 'READY' || draft.geographicReadiness === 'PARTIAL');

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

  private static async fillWindow(
    day: DaySchedule,
    startMs: number,
    endMs: number,
    priority: any[],
    secondary: any[],
    usedIds: Set<string>,
    usedGlobal: { parent: Record<string, number>, semantic: Record<string, number>, food: Record<string, number> },
    dailyCounts: { parent: Record<string, number>, semantic: Record<string, number>, food: Record<string, number>, lastMealMs: number },
    input: TripEngineInputV1,
    isFirstDay: boolean,
    geoProvider: GeoRoutingProvider | undefined,
    currentActivities: ScheduledActivity[]
  ): Promise<number> {
    let curr = startMs;
    let maxPaceActs = input.pace === 'relaxed' ? 2 : input.pace === 'intense' ? 4 : 3;
    let added = 0;

    let lastGeoPoint: GeoPoint | null = null;

    // Find the last known location to use as origin
    for (let i = currentActivities.length - 1; i >= 0; i--) {
      const act = currentActivities[i];
      if (act.coordinates?.lat && act.coordinates?.lng) {
         lastGeoPoint = { latitude: act.coordinates.lat, longitude: act.coordinates.lng, source: 'unknown', confidence: 'low' };
         break;
      } else if (act.location && input.basecamp?.name && act.location === input.basecamp.name && input.basecamp.lat && input.basecamp.lng) {
         lastGeoPoint = { latitude: input.basecamp.lat, longitude: input.basecamp.lng, source: 'reservation', confidence: 'high' };
         break;
      }
    }

    if (!lastGeoPoint && input.basecamp?.lat && input.basecamp?.lng) {
       lastGeoPoint = { latitude: input.basecamp.lat, longitude: input.basecamp.lng, source: 'reservation', confidence: 'high' };
    }


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


      const sortCandidates = async (candidates: any[]) => {
         if (!geoProvider || !lastGeoPoint || candidates.length === 0) return candidates;

         const withDist = await Promise.all(candidates.map(async c => {
            const coords = c.coordinates || (c.location_lat && c.location_lng ? { lat: c.location_lat, lng: c.location_lng } : undefined);
            if (!coords) return { c, dist: 99999999 };
            const dest: GeoPoint = { latitude: Number(coords.lat), longitude: Number(coords.lng), source: 'unknown', confidence: 'low' };
            const est = await geoProvider.getEstimate(lastGeoPoint!, dest);
            return { c, dist: est.distanceMeters };
         }));

         withDist.sort((a, b) => a.dist - b.dist);
         return withDist.map(w => w.c);
      };

      let pCandidates = getCandidates(priority);
      pCandidates = await sortCandidates(pCandidates);
      let sCandidates: any[] = [];
      if (pCandidates.length > 0) candidate = pCandidates[0];
      else {
        sCandidates = getCandidates(secondary);
        sCandidates = await sortCandidates(sCandidates);
        if (sCandidates.length > 0) candidate = sCandidates[0];
      }

      if (!candidate) {
         curr += 30 * 60000;
         if (curr >= endMs) break;
         continue;
      }

      const durationMs = SemanticRules.getEstimatedDurationMs(candidate);

      let travelDurationMs = 0;
      const coords = candidate.coordinates || (candidate.location_lat && candidate.location_lng ? { lat: candidate.location_lat, lng: candidate.location_lng } : undefined);

      if (geoProvider && lastGeoPoint && coords) {
         const dest: GeoPoint = { latitude: Number(coords.lat), longitude: Number(coords.lng), source: 'unknown', confidence: 'low' };
         const travelEstimate = await geoProvider.getEstimate(lastGeoPoint, dest);
         travelDurationMs = (travelEstimate.durationMinutes || 0) * 60000;
      }

      let proposedStart = curr + travelDurationMs;
      const windows = SemanticRules.getValidWindows(candidate, day.date);
      let isValidTime = windows.some(w => proposedStart >= w.startMs && proposedStart + durationMs <= Math.min(w.endMs, endMs));

      if (!isValidTime) {
         const nextWindow = windows.find(w => w.startMs >= proposedStart && w.startMs + durationMs <= Math.min(w.endMs, endMs));
         if (nextWindow) {
             proposedStart = nextWindow.startMs;
             isValidTime = true;
         }
      }

      if (isValidTime && proposedStart + durationMs <= endMs) {
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
              dailyCounts.lastMealMs = proposedStart + durationMs;
           }
        }

        const vote = input.matchVotes[candidate.id];
        let reason = 'Sugestão estimada';
        if (vote === 'yes') reason = 'Match (Yes) - Estimativa';
        if (vote === 'love') reason = 'Match (Love) - Estimativa';

        curr = proposedStart; // Leave gap for travel

        day.activities.push({
          id: candidate.id,
          sourceExperienceId: candidate.id,
          type: 'experience',
          title: candidate.name || candidate.title,
          startTime: `${day.date}T${this.toTimeStr(curr)}`,
          endTime: `${day.date}T${this.toTimeStr(curr + durationMs)}`,
          location: candidate.address || candidate.neighborhood || candidate.location,
          coordinates: coords ? { lat: Number(coords.lat), lng: Number(coords.lng) } : undefined,
          isFixed: false,
          isEstimatedTime: true,
          source: 'engine',
          reason: reason,
          geoSource: coords ? 'database' : undefined,
          geoConfidence: coords ? 'high' : undefined
        });
        curr += durationMs + (30 * 60000); // 30 min buffer after activity
        added++;
        if (coords) {
           lastGeoPoint = { latitude: Number(coords.lat), longitude: Number(coords.lng), source: 'unknown', confidence: 'low' };
        }
      } else {
        // If candidate doesn't fit, just skip it this round.
        // We will push curr forward so we don't infinite loop on same spot if no candidates fit
        if (candidate === (pCandidates.length > 0 ? pCandidates[0] : null) || candidate === (sCandidates && sCandidates.length > 0 ? sCandidates[0] : null)) {
            // We just let the while loop fail to add anything, so break
            break;
        }
      }
    }

    return curr;
  }
}
