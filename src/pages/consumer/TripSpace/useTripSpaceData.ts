import { useState, useEffect } from 'react';
import { TripRepository } from '@/repositories/TripRepository';
import { TripWalletRepository } from '@/repositories/TripWalletRepository';
import { DestinationRepository } from '@/repositories/DestinationRepository';
import { ExperienceRepository } from '@/repositories/ExperienceRepository';
import { useConsumerAuth } from '@/contexts/ConsumerAuthProvider';
import { TripSpaceViewModel } from '@/types/tripSpace.types';
import { buildTripSpaceViewModel } from '@/utils/tripSpaceAdapter';

export function useTripSpaceData(tripId?: string) {
  const { user, isLoading: authLoading } = useConsumerAuth();
  const [data, setData] = useState<TripSpaceViewModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeDay, setActiveDay] = useState(1);

  const reloadData = async () => {
    if (authLoading) return;
    if (!tripId || !user) {
      setError("Autenticação necessária. Faça login para acessar sua viagem.");
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);

      // Fetch trip
      const trip = await TripRepository.getTripById(tripId);
      if (!trip) {
        setError("Viagem não encontrada.");
        setLoading(false);
        return;
      }

      // Fetch destination
      let destination: any = null;
      if (trip.destination) {
        const dests = await DestinationRepository.getAll();
        destination = dests.find(d => d.id === trip.destination) || null;
      }

      // Fetch wallet reservations & documents
      const [reservations, documents] = await Promise.all([
        TripWalletRepository.getReservations(tripId),
        TripWalletRepository.getDocuments(tripId)
      ]);

      // Fetch catalog experiences for destination
      const catalog = await ExperienceRepository.getAll();

      const viewModel = buildTripSpaceViewModel(
        trip,
        destination,
        reservations,
        documents,
        catalog,
        user
      );

      setData(viewModel);
    } catch (err) {
      console.error("[TRIP_SPACE_LOAD_ERROR]", err);
      setError("Não foi possível carregar seu espaço da viagem.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reloadData();
  }, [tripId, user, authLoading]);

  return {
    data,
    loading,
    error,
    activeDay,
    setActiveDay,
    reloadData
  };
}
