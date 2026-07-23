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

      // Check for Staleness
      let stalenessStatus = 'UP_TO_DATE';
      try {
        const { TripItineraryGenerationService } = await import('@/services/TripItineraryGenerationService');
        stalenessStatus = await TripItineraryGenerationService.checkItineraryStaleness(tripId);
      } catch (e) {
        console.warn('Could not check staleness', e);
      }

      const viewModel = buildTripSpaceViewModel(
        trip,
        destination,
        reservations,
        documents,
        catalog,
        user
      );

      setData({ ...viewModel, stalenessStatus } as any);
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

  const [editDraft, setEditDraft] = useState<any>(null); // To hold the ItineraryEditDraft
  const [draftLoading, setDraftLoading] = useState(false);

  // Implement editing logic
  const handleToggleLock = async (activityId: string, isLocked: boolean) => {
    if (!tripId || !data) return;
    try {
      setDraftLoading(true);
      await TripRepository.setItineraryActivityLock(tripId, activityId, isLocked, data.rawVersion);
      await reloadData();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Erro ao trancar atividade.");
    } finally {
      setDraftLoading(false);
    }
  };

  const createDraft = async (intent: import('@/domain/itinerary-engine/edit-intents').ItineraryEditIntent) => {
    if (!data) return;
    setDraftLoading(true);
    try {
      const { applyEditIntentDraft } = await import('@/domain/itinerary-engine/edit-intents');
      const draft = applyEditIntentDraft(data.rawItinerary, { ...intent, expectedVersion: data.rawVersion }, data.reservations as any);
      setEditDraft(draft);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Erro ao gerar preview.");
    } finally {
      setDraftLoading(false);
    }
  };

  const commitDraft = async () => {
    if (!tripId || !editDraft || !data) return;
    setDraftLoading(true);
    try {
      await TripRepository.applyApprovedItineraryDraft(tripId, editDraft.newItinerary, data.rawVersion);
      setEditDraft(null);
      await reloadData();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Erro ao atualizar roteiro.");
    } finally {
      setDraftLoading(false);
    }
  };

  const clearDraft = () => {
    setEditDraft(null);
  };

  const regenerateItinerary = async () => {
    if (!tripId) return;
    setLoading(true);
    try {
      const { TripItineraryGenerationService } = await import('@/services/TripItineraryGenerationService');
      await TripItineraryGenerationService.generateAndPersist(tripId);
      await reloadData();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Erro ao regenerar roteiro.");
      setLoading(false);
    }
  };

  const previewRegeneration = async () => {
    if (!tripId || !data) return;
    setDraftLoading(true);
    try {
      const { TripItineraryGenerationService } = await import('@/services/TripItineraryGenerationService');
      const preview = await TripItineraryGenerationService.generatePreview(tripId);

      setEditDraft({
        newItinerary: preview.itinerary,
        status: 'APPLIED',
        diff: [
          { type: 'regenerate', summary: 'Roteiro completamente regenerado com as preferências atuais.' }
        ]
      });
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Erro ao gerar preview.");
    } finally {
      setDraftLoading(false);
    }
  };

  return {
    data,
    loading,
    error,
    activeDay,
    setActiveDay,
    reloadData,
    handleToggleLock,
    createDraft,
    commitDraft,
    clearDraft,
    editDraft,
    draftLoading,
    regenerateItinerary,
    previewRegeneration
  };
}
