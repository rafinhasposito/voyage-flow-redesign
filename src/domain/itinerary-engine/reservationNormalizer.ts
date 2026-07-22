import { FlightSegment, FixedAnchor, FlexibleReservation, Basecamp } from './contracts';

export interface NormalizedReservations {
  flightSegments: FlightSegment[];
  arrivalFlight?: FlightSegment;
  departureFlight?: FlightSegment;
  basecamp?: Basecamp;
  fixedAnchors: FixedAnchor[];
  flexibleReservations: FlexibleReservation[];
  unmapped: any[];
}

export class ReservationNormalizer {
  static normalize(rawReservations: any[], destinationIataCode?: string): NormalizedReservations {
    const flightSegments: FlightSegment[] = [];
    const fixedAnchors: FixedAnchor[] = [];
    const flexibleReservations: FlexibleReservation[] = [];
    const unmapped: any[] = [];
    let basecamp: Basecamp | undefined = undefined;

    for (const res of rawReservations) {
      if (res.type === 'flight') {
        const sd = res.structured_data || {};
        const segment: FlightSegment = {
          segmentId: res.id,
          flightNumber: sd.flight_number || res.title,
          departureAirport: sd.origin,
          departureLocalDateTime: res.start_at, // Expected ISO string without TZ conversion ideally, or TZ extracted.
          departureTimezone: sd.origin_timezone, // Future improvement
          arrivalAirport: sd.destination || res.location_name,
          arrivalLocalDateTime: res.end_at,
          arrivalTimezone: sd.destination_timezone,
          terminal: sd.terminal,
          confirmationCode: res.confirmation_code
        };
        flightSegments.push(segment);
      } else if (res.type === 'hotel' && res.structured_data?.is_basecamp) {
        basecamp = {
          id: res.id,
          name: res.title,
          lat: res.latitude,
          lng: res.longitude,
          neighborhood: res.location_name
        };
      } else if (res.is_fixed && res.start_at && res.end_at) {
        fixedAnchors.push({
          id: res.id,
          type: res.type,
          date: res.start_at.substring(0, 10),
          startTime: res.start_at.substring(11, 16),
          endTime: res.end_at.substring(11, 16),
          duration: (new Date(res.end_at).getTime() - new Date(res.start_at).getTime()) / 60000,
          location: res.location_name || res.address,
          coordinates: res.latitude && res.longitude ? { lat: res.latitude, lng: res.longitude } : undefined,
          isLocked: true,
          source: 'reservation',
          confirmationStatus: res.purchase_status
        });
      } else if (!res.is_fixed || !res.start_at) {
        flexibleReservations.push({
          id: res.id,
          type: res.type,
          title: res.title,
          location: res.location_name || res.address,
        });
      } else {
        unmapped.push(res);
      }
    }

    // Identify Arrival and Departure flights related to the destination
    let arrivalFlight: FlightSegment | undefined = undefined;
    let departureFlight: FlightSegment | undefined = undefined;
    
    // Sort flights by time
    flightSegments.sort((a, b) => new Date(a.departureLocalDateTime).getTime() - new Date(b.departureLocalDateTime).getTime());
    
    if (destinationIataCode) {
      arrivalFlight = flightSegments.find(f => f.arrivalAirport?.toUpperCase() === destinationIataCode.toUpperCase());
      departureFlight = flightSegments.find(f => f.departureAirport?.toUpperCase() === destinationIataCode.toUpperCase());
    } else if (flightSegments.length > 0) {
      arrivalFlight = flightSegments[0];
      departureFlight = flightSegments.length > 1 ? flightSegments[flightSegments.length - 1] : undefined;
    }

    return {
      flightSegments,
      arrivalFlight,
      departureFlight,
      basecamp,
      fixedAnchors,
      flexibleReservations,
      unmapped
    };
  }
}
