import { PersistedTripItineraryV2, PersistedDayV2, EngineActivity, MetadataHeader } from './contracts';
import { TripReservation } from './reservationNormalizer';
import { scheduleItinerary, SchedulerV1 } from './schedulerV1';

export type EditAction = 'MOVE' | 'REMOVE' | 'REPLACE' | 'ADD';

export interface ItineraryEditIntent {
  tripId: string;
  activityId?: string;
  sourceExperienceId?: string;
  reservationId?: string;
  action: EditAction;
  sourceDay?: number;
  targetDay?: number;
  targetPosition?: number;
  expectedVersion?: string;
  manualLockUpdates?: Record<string, boolean>;
}

export type EditResultStatus = 
  | 'APPLIED'
  | 'ALREADY_APPLIED'
  | 'ITINERARY_CHANGED_SINCE_PREVIEW'
  | 'BLOCKED_FIXED_ITEM'
  | 'BLOCKED_MANUAL_LOCK'
  | 'READBACK_MISMATCH'
  | 'PERSISTENCE_FAILED';

export interface ItineraryEditDraft {
  newItinerary: PersistedTripItineraryV2;
  status: EditResultStatus;
  warnings: string[];
}

export function applyEditIntentDraft(
  currentItinerary: PersistedTripItineraryV2,
  intent: ItineraryEditIntent,
  reservations: TripReservation[] = []
): ItineraryEditDraft {
  const draftItinerary = JSON.parse(JSON.stringify(currentItinerary)) as PersistedTripItineraryV2;
  
  if (!draftItinerary || draftItinerary.length === 0) {
    return { newItinerary: draftItinerary, status: 'PERSISTENCE_FAILED', warnings: ['Empty itinerary'] };
  }

  const metadata = draftItinerary.find((d: any) => d._isMetadata) as MetadataHeader | undefined;
  if (intent.expectedVersion && metadata?.version && metadata.version !== intent.expectedVersion) {
    return { newItinerary: currentItinerary, status: 'ITINERARY_CHANGED_SINCE_PREVIEW', warnings: [] };
  }

  let warnings: string[] = [];

  // Helper to find an activity
  const findActivityInfo = (id: string) => {
    for (let dIdx = 0; dIdx < draftItinerary.length; dIdx++) {
      const day = draftItinerary[dIdx] as PersistedDayV2;
      if (!day._isMetadata && day.activities) {
        const aIdx = day.activities.findIndex(a => a.id === id);
        if (aIdx !== -1) return { day, dIdx, aIdx, activity: day.activities[aIdx] };
      }
    }
    return null;
  };

  if (intent.action === 'MOVE') {
    if (!intent.activityId || intent.targetDay === undefined || intent.targetPosition === undefined) {
      return { newItinerary: currentItinerary, status: 'PERSISTENCE_FAILED', warnings: ['Missing move parameters'] };
    }
    const info = findActivityInfo(intent.activityId);
    if (!info) return { newItinerary: currentItinerary, status: 'PERSISTENCE_FAILED', warnings: ['Activity not found'] };

    if (info.activity.isFixed) {
      return { newItinerary: currentItinerary, status: 'BLOCKED_FIXED_ITEM', warnings: [] };
    }

    // Remove from old
    info.day.activities.splice(info.aIdx, 1);
    
    // Insert to new
    const targetDayObj = draftItinerary.find((d: any) => !d._isMetadata && d.dayNumber === intent.targetDay) as PersistedDayV2;
    if (targetDayObj && targetDayObj.activities) {
      targetDayObj.activities.splice(intent.targetPosition, 0, info.activity);
    }
  }

  if (intent.action === 'REMOVE') {
    if (!intent.activityId) return { newItinerary: currentItinerary, status: 'PERSISTENCE_FAILED', warnings: [] };
    const info = findActivityInfo(intent.activityId);
    if (!info) return { newItinerary: currentItinerary, status: 'PERSISTENCE_FAILED', warnings: [] };
    
    if (info.activity.isFixed) return { newItinerary: currentItinerary, status: 'BLOCKED_FIXED_ITEM', warnings: [] };
    if (info.activity.manualLock) return { newItinerary: currentItinerary, status: 'BLOCKED_MANUAL_LOCK', warnings: [] };

    info.day.activities.splice(info.aIdx, 1);
  }

  // Update expectedVersion
  if (metadata) {
    metadata.version = new Date().toISOString();
  }

  // --- Partial Recalculation ---
  // A intenção entra na camada de domínio da Engine V2 e reutiliza: SchedulerV1 e Repair Pass
  
  const catalog = (intent as any).catalogContext || []; // We need to inject catalog if we want strict semantic rules
  
  const recalculateDay = (day: PersistedDayV2) => {
    // Map EngineActivity back to DaySchedule format for SchedulerV1
    const daySchedule = {
      date: day.dateStr || '2025-01-01',
      warnings: [],
      activities: day.activities?.map(a => ({
        id: a.id,
        type: a.type,
        title: a.title,
        startTime: a.startTime || '10:00',
        endTime: a.endTime || '11:00',
        duration: a.duration,
        isFixed: a.isFixed || a.manualLock || false,
        sourceExperienceId: a.sourceExperienceId,
        source: a.source as any
      })) || []
    };
    
    SchedulerV1.recalculatePartialDay(daySchedule, catalog);
    
    // Map back
    if (day.activities) {
        day.activities = daySchedule.activities.map((sa: any, i: number) => ({
           ...day.activities![i], // preserve non-schedule props
           id: sa.id,
           startTime: sa.startTime,
           endTime: sa.endTime
        }));
    }
    
    if (daySchedule.warnings && daySchedule.warnings.length > 0) {
        warnings.push(...daySchedule.warnings.map((w: string) => `Dia ${day.dayNumber}: ${w}`));
    }
  };

  if (intent.action === 'MOVE' && intent.targetDay !== undefined) {
    const targetDayObj = draftItinerary.find((d: any) => !d._isMetadata && d.dayNumber === intent.targetDay) as PersistedDayV2;
    if (targetDayObj) recalculateDay(targetDayObj);
    if (intent.sourceDay !== undefined && intent.sourceDay !== intent.targetDay) {
        const sourceDayObj = draftItinerary.find((d: any) => !d._isMetadata && d.dayNumber === intent.sourceDay) as PersistedDayV2;
        if (sourceDayObj) recalculateDay(sourceDayObj);
    }
  }

  if (intent.action === 'REMOVE') {
    const info = findActivityInfo(intent.activityId!);
    if (info) recalculateDay(info.day);
  }

  if (intent.action === 'ADD') {
    if (!intent.sourceExperienceId || intent.targetDay === undefined) {
      return { newItinerary: currentItinerary, status: 'PERSISTENCE_FAILED', warnings: ['Missing add parameters'] };
    }
    const targetDayObj = draftItinerary.find((d: any) => !d._isMetadata && d.dayNumber === intent.targetDay) as PersistedDayV2;
    if (targetDayObj && targetDayObj.activities) {
      const addedItem = catalog.find((c: any) => c.id === intent.sourceExperienceId);
      const newAct: EngineActivity = {
        id: 'new_' + Math.random().toString(36).substr(2, 9),
        title: addedItem ? addedItem.name || addedItem.title : 'Nova Atividade',
        type: 'attraction',
        sourceExperienceId: intent.sourceExperienceId,
        source: 'catalog',
        duration: addedItem?.duration?.toString() || '90'
      };
      targetDayObj.activities.push(newAct);
      recalculateDay(targetDayObj);
    }
  }

  return { newItinerary: draftItinerary, status: 'APPLIED', warnings };
}
