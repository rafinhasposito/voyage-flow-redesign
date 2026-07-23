import { TripEngineInputV1, FlightSegment, FixedAnchor, FlexibleReservation, Basecamp, normalizeMatchVote } from './contracts';
import { TripReservation } from '../../repositories/TripWalletRepository';

export class EngineInputBuilder {
  static build(
    trip: any,
    reservations: TripReservation[],
    catalog: any[]
  ): TripEngineInputV1 {
    const preferences = trip.preferences || {};
    
    // Basecamp mapping
    let basecamp: Basecamp | undefined = undefined;
    
    // Tenta encontrar um hotel salvo nas reservas
    const hotelRes = reservations.find(r => r.type === 'hotel');
    if (hotelRes) {
      basecamp = {
        id: hotelRes.id!,
        name: hotelRes.title || hotelRes.location_name || 'Hotel Reservado',
        lat: hotelRes.latitude,
        lng: hotelRes.longitude,
      };
    } else if (trip.hotel_name) {
      // Fallback para o preenchimento antigo
      basecamp = {
        id: 'legacy-hotel',
        name: trip.hotel_name,
        lat: trip.hotel_lat,
        lng: trip.hotel_lng,
      };
    }

    // Flights mapping
    const flightSegments: FlightSegment[] = [];
    reservations.filter(r => r.type === 'flight').forEach(r => {
      const s = r.structured_data || {};
      flightSegments.push({
        segmentId: r.id!,
        flightNumber: s.flight_number || 'UNKNOWN',
        departureAirport: s.origin_airport || s.origin || 'UNKNOWN',
        departureLocalDateTime: s.departure_local_datetime || r.start_at || '',
        departureTimezone: s.departure_timezone,
        departureInstant: r.start_at,
        arrivalAirport: s.destination_airport || s.destination || 'UNKNOWN',
        arrivalLocalDateTime: s.arrival_local_datetime || r.end_at || '',
        arrivalTimezone: s.arrival_timezone,
        arrivalInstant: r.end_at,
        confirmationCode: r.confirmation_code
      });
    });

    // A better flight mapping logic
    let arrivalFlight: FlightSegment | undefined = undefined;
    let departureFlight: FlightSegment | undefined = undefined;

    if (flightSegments.length > 0) {
      // Find the flight that arrives closest to startDate
      const sDate = trip.start_date; // YYYY-MM-DD
      const eDate = trip.end_date;
      
      arrivalFlight = flightSegments.find(f => f.arrivalLocalDateTime.startsWith(sDate));
      if (!arrivalFlight && flightSegments.length > 0) arrivalFlight = flightSegments[0]; // Fallback

      departureFlight = flightSegments.find(f => f.departureLocalDateTime.startsWith(eDate));
      if (!departureFlight && flightSegments.length > 1) departureFlight = flightSegments[flightSegments.length - 1]; // Fallback
    }

    // Fixed & Flexible Reservations
    const fixedReservations: FixedAnchor[] = [];
    const flexibleReservations: FlexibleReservation[] = [];

    reservations.forEach(r => {
      if (['flight', 'hotel'].includes(r.type)) return;
      
      if (r.is_fixed && r.start_at && r.end_at) {
        let sTime = r.structured_data?.start_local_datetime || r.start_at;
        let eTime = r.structured_data?.end_local_datetime || r.end_at;
        
        fixedReservations.push({
          id: r.id!,
          type: r.type,
          date: sTime.split('T')[0],
          startTime: sTime,
          endTime: eTime,
          duration: (new Date(eTime.replace('Z','')).getTime() - new Date(sTime.replace('Z','')).getTime()) / 60000,
          location: r.location_name,
          coordinates: r.latitude && r.longitude ? { lat: r.latitude, lng: r.longitude } : undefined,
          isLocked: true,
          source: 'reservation',
          confirmationStatus: r.purchase_status
        });
      } else {
        flexibleReservations.push({
          id: r.id!,
          type: r.type,
          title: r.title || 'Reserva',
          location: r.location_name
        });
      }
    });

    const rawMatchVotes = preferences.matchVotes || preferences.match_votes || trip.match_votes || {};
    const matchVotes: Record<string, string> = {};
    for (const [k, v] of Object.entries(rawMatchVotes)) {
      const result = normalizeMatchVote(v as string);
      if (result.status === 'NORMALIZED') {
        matchVotes[k] = result.value;
      } else if (result.status === 'UNKNOWN') {
        console.warn(`[EngineInputBuilder] Unknown match vote value for item ${k}: ${result.rawValue}`);
      }
    }

    return {
      engineVersion: '1.0.0',
      tripId: trip.id,
      destinationId: trip.destination,
      destinationTimezone: 'America/New_York', // TODO: Resolve from destination DB
      startDate: trip.start_date,
      endDate: trip.end_date,
      travelers: {
        count: preferences.travelersCount || 2,
        children: !!preferences.hasChildren,
        wheelchair: !!preferences.needsAccessibility
      },
      companionship: trip.companionship || 'couple',
      travelProfile: preferences.travelProfile || 'classic',
      pace: trip.pace || 'balanced',
      budget: trip.budget_level || 'balanced',
      matchVotes: matchVotes,
      avoidances: preferences.avoidances || [],
      accessibilityNeeds: [],
      basecamp,
      flightSegments,
      arrivalFlight,
      departureFlight,
      fixedReservations,
      flexibleReservations,
      catalog
    };
  }
}
