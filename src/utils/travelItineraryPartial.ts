import { ItineraryDay, UserProfile, StopEditMetadata, RecommendedExperience, ExperienceMatchingEngine, RecommendationContext, getStoredAttractions, DEFAULT_ENGINE_WEIGHTS, migrateTrip, TravelExperience } from "./travelState";
import { LogisticsEngine } from "../lib/intelligence/logistics";

export function findSubstituteExperience(
  itinerary: ItineraryDay[],
  profile: UserProfile,
  dayNumber: number,
  attractionId: string
): RecommendedExperience | null {
  const allExperiences = getStoredAttractions();
  const currentIds = itinerary.flatMap(d => d.recommendations?.map(r => r.experience.id) || []);
  
  const dayIndex = itinerary.findIndex(d => d.dayNumber === dayNumber);
  if (dayIndex === -1) return null;
  const day = itinerary[dayIndex];
  const recs = day.recommendations || [];
  const idx = recs.findIndex(r => r.experience.id === attractionId);
  if (idx === -1) return null;

  // 1. Build context
  const context: RecommendationContext = {
    profile,
    trip: migrateTrip(profile),
    weights: DEFAULT_ENGINE_WEIGHTS,
    currentDate: profile.startDate || new Date().toISOString().split("T")[0]
  };

  // 2. Rank candidates (which includes EI-7 constraints)
  const rankedResults = ExperienceMatchingEngine.rankExperiences(allExperiences, context);
  const validRanked = rankedResults.filter(r => r.finalScore > -9000 && r.restrictions?.allowed !== false);

  // 3. Filter candidates logically (EI-8)
  const dayDate = new Date(new Date(profile.startDate || new Date()).getTime() + (day.dayNumber - 1) * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const maxMinutesPerDay = 22 * 60; // 22:00
  
  // Figure out the planned start time constraint for this slot
  // Start from the previous attraction's end time
  let currentDayMinutes = 9 * 60;
  let previousExp: TravelExperience | null = null;
  let previousEndTime: string | null = null;

  if (idx > 0) {
    const prevRec = recs[idx - 1];
    if (prevRec.experience.plannedEndTime) {
       const [h, m] = prevRec.experience.plannedEndTime.split(":").map(Number);
       currentDayMinutes = h * 60 + m;
    }
    previousExp = prevRec.experience;
    previousEndTime = prevRec.experience.plannedEndTime || null;
  }

  for (const candidate of validRanked) {
    // Already in itinerary?
    if (currentIds.includes(candidate.experience.id)) continue;

    // Evaluate logistics
    const durationHours = candidate.experience.durationHours || 2;
    let transitMins: number | null = null;
    if (previousExp && previousExp.transit_options_origin) {
      const option = previousExp.transit_options_origin.find((o: any) => o.destination_experience_id === candidate.experience.id);
      if (option && option.duration_minutes !== undefined && option.duration_minutes !== null) {
        transitMins = option.duration_minutes;
      }
    }
    const effectiveTransitMins = transitMins ?? 0;
    
    // Check if the original slot had a manually scheduled time
    let proposedStartMins = currentDayMinutes + effectiveTransitMins;
    const originalRec = recs[idx];
    if (originalRec.manualMetadata?.manuallyScheduled && originalRec.experience.plannedStartTime) {
       const [hh, mm] = originalRec.experience.plannedStartTime.split(":").map(Number);
       const manualStartMins = hh * 60 + mm;
       if (manualStartMins >= proposedStartMins) {
          proposedStartMins = manualStartMins;
       }
    }

    const proposedStart = `${String(Math.floor(proposedStartMins / 60)).padStart(2, '0')}:${String(proposedStartMins % 60).padStart(2, '0')}`;
    const windowEnd = `${String(Math.floor(maxMinutesPerDay / 60)).padStart(2, '0')}:${String(maxMinutesPerDay % 60).padStart(2, '0')}`;
    
    const evalRes = LogisticsEngine.evaluateFeasibility(
      dayDate,
      proposedStart,
      durationHours,
      candidate.experience.operating_hours,
      candidate.experience.operating_hour_exceptions,
      previousExp ? transitMins : null,
      windowEnd,
      previousEndTime
    );

    if (evalRes.feasible && evalRes.blockers.length === 0) {
      // Valid candidate!
      return {
        ...candidate,
        explanation: { ...candidate.explanation, humanJustification: "Substituição manual com filtro avançado." },
        manualMetadata: { source: "manual", locked: true }
      };
    }
  }

  return null;
}

export function recalculateAffectedSegment(
  itinerary: ItineraryDay[], 
  profile: UserProfile,
  affectedDayIndex: number,
  affectedStopIndex: number
): ItineraryDay[] {
  // Preserve structural equality for unaffected days
  const newItinerary = [...itinerary];
  if (affectedDayIndex < 0 || affectedDayIndex >= newItinerary.length) return newItinerary;

  const day = { ...newItinerary[affectedDayIndex] };
  const dayDate = new Date(new Date(profile.startDate || new Date()).getTime() + (day.dayNumber - 1) * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const maxMinutesPerDay = 22 * 60; // 22:00
  
  if (!day.recommendations) day.recommendations = [];
  const updatedRecommendations = [...day.recommendations];

  // We need to recalculate from affectedStopIndex - 1 (or 0) onwards, 
  // because the affected stop's start time depends on the previous stop's end time.
  // Actually, to be safe and simple within the day, we can just recalculate the day forwards from the affected stop or the one before it.
  // Since time ripples forward, recalculating from max(0, affectedStopIndex - 1) to the end of the day is necessary if times shift.
  
  const startIndex = Math.max(0, affectedStopIndex - 1);
  
  // Find the starting time
  let currentDayMinutes = 9 * 60; // 09:00
  let previousExp: any = null;
  let previousEndTime: string | null = null;
  
  if (startIndex > 0) {
    const prevRec = updatedRecommendations[startIndex - 1];
    if (prevRec.experience.plannedEndTime) {
       const [h, m] = prevRec.experience.plannedEndTime.split(":").map(Number);
       currentDayMinutes = h * 60 + m;
    }
    previousExp = prevRec.experience;
    previousEndTime = prevRec.experience.plannedEndTime || null;
  }

  for (let i = startIndex; i < updatedRecommendations.length; i++) {
    const rec = { ...updatedRecommendations[i] };
    const durationHours = rec.experience.durationHours || 2;
    
    let transitMins: number | null = null;
    if (previousExp && previousExp.transit_options_origin) {
      const option = previousExp.transit_options_origin.find((o: any) => o.destination_experience_id === rec.experience.id);
      if (option && option.duration_minutes !== undefined && option.duration_minutes !== null) {
        transitMins = option.duration_minutes;
      }
    }
    
    const effectiveTransitMins = transitMins ?? 0;
    
    // If the user manually scheduled this, try to respect their time if it's feasible, otherwise ripple
    // Wait, the requirement says "ajustar horários seguintes apenas quando necessário".
    // If the rec has a manually scheduled time, and it's LATER than arrivalMins, we can wait (gap).
    let proposedStartMins = currentDayMinutes + effectiveTransitMins;
    
    if (rec.manualMetadata?.manuallyScheduled && rec.experience.plannedStartTime) {
       const [hh, mm] = rec.experience.plannedStartTime.split(":").map(Number);
       const manualStartMins = hh * 60 + mm;
       if (manualStartMins >= proposedStartMins) {
          proposedStartMins = manualStartMins;
       }
    }

    const proposedStart = `${String(Math.floor(proposedStartMins / 60)).padStart(2, '0')}:${String(proposedStartMins % 60).padStart(2, '0')}`;
    const windowEnd = `${String(Math.floor(maxMinutesPerDay / 60)).padStart(2, '0')}:${String(maxMinutesPerDay % 60).padStart(2, '0')}`;
    
    // Re-evaluate logistics
    const evalRes = LogisticsEngine.evaluateFeasibility(
      dayDate,
      proposedStart,
      durationHours,
      rec.experience.operating_hours,
      rec.experience.operating_hour_exceptions,
      previousExp ? transitMins : null,
      windowEnd,
      previousEndTime
    );

    let conflict: StopEditMetadata["conflict"] = undefined;
    
    if (!evalRes.feasible || evalRes.blockers.length > 0) {
      conflict = conflict || {};
      conflict.logistics = {
        codes: evalRes.blockers.map(b => b.code),
        messages: evalRes.blockers.map(b => b.message)
      };
    }
    
    if (rec.restrictions && rec.restrictions.allowed === false) {
      conflict = conflict || {};
      conflict.restrictions = {
        codes: rec.restrictions.blockers.map(b => b.code),
        messages: rec.restrictions.blockers.map(b => b.message)
      };
    }

    const endMins = proposedStartMins + (durationHours * 60);
    const plannedEndTime = `${String(Math.floor(endMins / 60)).padStart(2, '0')}:${String(endMins % 60).padStart(2, '0')}`;

    rec.experience = {
      ...rec.experience,
      plannedStartTime: proposedStart,
      plannedEndTime: plannedEndTime,
      logisticsEvaluation: evalRes
    };
    
    if (rec.manualMetadata) {
      rec.manualMetadata = { ...rec.manualMetadata, conflict };
    } else {
      // Don't auto-classify as manual just because of conflict
      rec.manualMetadata = { source: "engine", locked: false, conflict };
    }
    
    updatedRecommendations[i] = rec;
    
    currentDayMinutes = endMins;
    previousExp = rec.experience;
    previousEndTime = plannedEndTime;
  }
  
  day.recommendations = updatedRecommendations;
  day.attractions = updatedRecommendations.map(r => r.experience);
  newItinerary[affectedDayIndex] = day;

  return newItinerary;
}
