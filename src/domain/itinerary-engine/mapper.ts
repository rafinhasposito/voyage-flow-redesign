import { ItineraryDraftV1, DaySchedule, ScheduledActivity } from './schedulerV1';
import { GeoHealthIssue } from './geoContracts';

export interface PersistedActivityV2 {
  id: string;
  type: string;
  title: string;
  startTime: string;
  endTime: string;
  location?: string;
  coordinates?: { lat: number; lng: number };
  isFixed: boolean;
  source: string;
  sourceExperienceId?: string;
  reservationId?: string;
  provenance?: string;
  confidence?: string;
  routeEstimate?: any;
  semanticRole?: string;
  parentRole?: string;
  manualLock?: boolean;
}

export interface PersistedDayV2 {
  date: string;
  dayNumber: number;
  activities: PersistedActivityV2[];
  warnings: string[];
}

export interface PersistedMetadataV2 {
  _isMetadata: true;
  engineVersion: string;
  generatedAt: string;
  tripId: string;
  startDate?: string;
  endDate?: string;
  geographicReadiness: string;
  overallWarnings: string[];
  geoHealthIssues: GeoHealthIssue[];
  inputHealth?: any;
}

export type PersistedTripItineraryV2 = (PersistedMetadataV2 | PersistedDayV2)[];

export class TripItineraryMapper {
  static toPersistedV2(draft: ItineraryDraftV1, inputHealth?: any): PersistedTripItineraryV2 {
    const startDate = draft.days.length > 0 ? draft.days[0].date : undefined;
    const endDate = draft.days.length > 0 ? draft.days[draft.days.length - 1].date : undefined;

    const metadata: PersistedMetadataV2 = {
      _isMetadata: true,
      engineVersion: '2.0.0', // V2 as per phase
      generatedAt: new Date().toISOString(),
      tripId: draft.tripId,
      startDate,
      endDate,
      geographicReadiness: draft.geographicReadiness,
      overallWarnings: draft.overallWarnings || [],
      geoHealthIssues: draft.geoHealthIssues || [],
      inputHealth
    };

    const days: PersistedDayV2[] = draft.days.map((day, index) => ({
      date: day.date,
      dayNumber: index + 1,
      warnings: day.warnings || [],
      activities: day.activities.map(act => this.mapActivity(act))
    }));

    return [metadata, ...days];
  }

  private static mapActivity(act: ScheduledActivity): PersistedActivityV2 {
    return {
      id: act.id,
      type: act.type,
      title: act.title,
      startTime: act.startTime,
      endTime: act.endTime,
      location: act.location ?? undefined,
      coordinates: act.coordinates ?? undefined,
      isFixed: act.isFixed,
      source: act.source,
      sourceExperienceId: act.sourceExperienceId ?? undefined,
      // mapping any additional fields if they exist in the incoming draft
      reservationId: (act as any).reservationId ?? undefined,
      provenance: act.geoSource ?? (act as any).provenance ?? undefined,
      confidence: act.geoConfidence ?? (act as any).confidence ?? undefined,
      routeEstimate: act.routeEstimate ?? undefined,
      semanticRole: (act as any).semanticRole ?? undefined,
      parentRole: (act as any).parentRole ?? undefined,
      manualLock: (act as any).manualLock ?? undefined
    };
  }
}
