import { TripEngineDTO } from '../lib/engineContracts';
import { TripReservation } from '../repositories/TripWalletRepository';

export function buildTripEngineDTO(
  trip: any,
  reservations: TripReservation[]
): TripEngineDTO {
  
  // Isola hotel para extrair basecamp
  const hotel = reservations.find(r => r.type === 'hotel');
  
  // Todos os itens que são is_fixed (Voos, Hoteis, etc)
  const fixedCommitments = reservations.filter(r => r.is_fixed);

  return {
    trip_id: trip.id,
    destination: trip.destination,
    start_date: trip.start_date,
    end_date: trip.end_date,
    companionship: trip.companionship || 'solo',
    budget_level: trip.budget_level || 'medium',
    pace: trip.pace || 'balanced',
    basecamp: hotel ? {
      title: hotel.title || 'Hospedagem Confirmada',
      address: hotel.address || '',
      latitude: hotel.latitude,
      longitude: hotel.longitude
    } : undefined,
    fixed_commitments: fixedCommitments,
    tinder_votes: trip.preferences?.tinder_votes || {},
    preferences: {
      trip_reason: trip.preferences?.trip_reason,
      currency: trip.preferences?.currency,
      restrictions: trip.preferences?.restrictions || []
    }
  };
}
