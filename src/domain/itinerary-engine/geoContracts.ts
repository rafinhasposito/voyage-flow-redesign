export interface GeoPoint {
  latitude: number;
  longitude: number;
  source: GeoSource;
  confidence: 'high' | 'medium' | 'low';
  resolvedAt?: string;
}

export type GeoSource = 'curated' | 'reservation' | 'provider' | 'user' | 'inferred' | 'unknown' | 'local_fallback';

export interface TravelEstimate {
  origin: GeoPoint;
  destination: GeoPoint;
  distanceMeters: number;
  durationMinutes: number;
  mode: 'walk' | 'transit' | 'taxi_or_rideshare' | 'unknown';
  source: GeoSource;
  confidence: 'high' | 'medium' | 'low';
  isFallback: boolean;
}

export interface RouteSegment {
  fromActivityId: string;
  toActivityId: string;
  estimate: TravelEstimate;
  departureTime: string;
  arrivalTime: string;
}

export interface GeoCluster {
  id: string;
  activityIds: string[];
  centroid: GeoPoint;
  basecampDistance?: number;
  confidence: 'high' | 'medium' | 'low';
}

export interface GeoHealthIssue {
  code: 'BASECAMP_GPS_MISSING' | 'ACTIVITY_GPS_MISSING' | 'FIXED_ANCHOR_GPS_MISSING' | 'INVALID_COORDINATES' | 'INSUFFICIENT_GEO_COVERAGE' | 'LONG_DAILY_JUMP' | 'ROUTE_ESTIMATE_LOW_CONFIDENCE' | 'UNROUTABLE_ACTIVITY' | 'CLUSTER_CONFLICT_WITH_FIXED_ANCHOR';
  severity: 'warning' | 'critical';
  message: string;
  affectedIds?: string[];
}
