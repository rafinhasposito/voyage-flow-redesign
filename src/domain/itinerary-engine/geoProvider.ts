import { GeoPoint, TravelEstimate, GeoSource } from './geoContracts';

export interface GeoRoutingProvider {
  getEstimate(origin: GeoPoint, destination: GeoPoint): Promise<TravelEstimate>;
  getDistanceMatrix(origins: GeoPoint[], destinations: GeoPoint[]): Promise<TravelEstimate[][]>;
}

export class LocalDeterministicGeoProvider implements GeoRoutingProvider {
  // Haversine formula
  private getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371; // Radius of the earth in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d;
  }

  private deg2rad(deg: number) {
    return deg * (Math.PI / 180);
  }

  async getEstimate(origin: GeoPoint, destination: GeoPoint): Promise<TravelEstimate> {
    const distanceKm = this.getDistanceFromLatLonInKm(
      origin.latitude, origin.longitude,
      destination.latitude, destination.longitude
    );
    const distanceMeters = distanceKm * 1000;

    // Local determinism assumptions:
    // Walking speed ~ 1.4 m/s (approx 5 km/h)
    // Transit speed ~ 5 m/s (approx 18 km/h) in city
    let mode: 'walk' | 'transit' | 'taxi_or_rideshare' | 'unknown' = 'walk';
    let durationMinutes = Math.ceil(distanceMeters / 1.4 / 60);

    if (distanceMeters > 2000) {
      mode = 'transit';
      durationMinutes = Math.ceil(distanceMeters / 5.0 / 60);
    }
    
    // Add base buffer for non-zero distances to account for leaving/entering buildings
    if (distanceMeters > 100) {
       durationMinutes += 5;
    }

    return {
      origin,
      destination,
      distanceMeters: Math.round(distanceMeters),
      durationMinutes,
      mode,
      source: 'local_fallback',
      confidence: 'low',
      isFallback: true
    };
  }

  async getDistanceMatrix(origins: GeoPoint[], destinations: GeoPoint[]): Promise<TravelEstimate[][]> {
    const matrix: TravelEstimate[][] = [];
    for (const origin of origins) {
      const row: TravelEstimate[] = [];
      for (const destination of destinations) {
        row.push(await this.getEstimate(origin, destination));
      }
      matrix.push(row);
    }
    return matrix;
  }
}
