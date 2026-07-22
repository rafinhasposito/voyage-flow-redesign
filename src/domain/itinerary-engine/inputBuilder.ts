import { TripEngineInputV1, FlightSegment, FixedAnchor, FlexibleReservation, Basecamp } from './contracts';
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

    const arrivalFlight = flightSegments.length > 0 ? flightSegments[0] : undefined;
    const departureFlight = flightSegments.length > 1 ? flightSegments[flightSegments.length - 1] : undefined;

    // Fixed & Flexible Reservations
    const fixedReservations: FixedAnchor[] = [];
    const flexibleReservations: FlexibleReservation[] = [];

    reservations.forEach(r => {
      if (['flight', 'hotel'].includes(r.type)) return;
      
      if (r.is_fixed && r.start_at && r.end_at) {
        // Extract local time (HH:MM) from start_at for the anchor
        // Note: For a robust system, we should use local_datetime if available in structured_data
        const sTime = new Date(r.start_at).toISOString(); // Fallback, we'll refine this in scheduler
        const eTime = new Date(r.end_at).toISOString();
        
        fixedReservations.push({
          id: r.id!,
          type: r.type,
          date: sTime.split('T')[0],
          startTime: sTime,
          endTime: eTime,
          duration: (new Date(eTime).getTime() - new Date(sTime).getTime()) / 60000,
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
      matchVotes: preferences.matchVotes || {},
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
