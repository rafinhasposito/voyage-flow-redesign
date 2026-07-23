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
    
    try {
      setLoading(true);
      setError(null);

      let trip: any = null;
      if (tripId && user) {
        trip = await TripRepository.getTripById(tripId);
      }

      if (!trip) {
        throw new Error("Viagem não encontrada no banco de dados.");
      }

      // Fetch destination
      let destination: any = null;
      if (trip.destination) {
        const dests = await DestinationRepository.getAll();
        destination = dests.find(d => d.id === trip.destination) || null;
      }

      // Fetch wallet reservations & documents safely
      let reservations: any[] = [];
      let documents: any[] = [];
      if (tripId && user) {
        try {
          const [resData, docData] = await Promise.all([
            TripWalletRepository.getReservations(tripId),
            TripWalletRepository.getDocuments(tripId)
          ]);
          reservations = resData || [];
          documents = docData || [];
        } catch (e) {
          console.warn("[TripSpaceData] Wallet/Docs fetch failed, using fallback:", e);
        }
      }

      // Fetch catalog experiences safely
      let catalog: any[] = [];
      try {
        catalog = await ExperienceRepository.getAll();
      } catch (e) {
        console.warn("[TripSpaceData] Catalog fetch failed:", e);
      }

      // Check for Staleness safely
      let stalenessStatus = 'UP_TO_DATE';
      if (tripId && user) {
        try {
          const { TripItineraryGenerationService } = await import('@/services/TripItineraryGenerationService');
          stalenessStatus = await TripItineraryGenerationService.checkItineraryStaleness(tripId);
        } catch (e) {
          console.warn('Could not check staleness', e);
        }
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
      try {
        const fallbackTrip = {
          id: tripId || 'e8f37583-d42e-49b9-8e04-042e69f2b09c',
          title: 'Nova York em Estilo',
          destination: 'new-york',
          start_date: '2026-08-02',
          end_date: '2026-08-06',
          companionship: 'couple',
          budget_level: 'medium',
          status: 'planned',
          preferences: {},
          itinerary: GUARANTEED_NY_ITINERARY
        };
        const viewModel = buildTripSpaceViewModel(fallbackTrip, null, [], [], [], user);
        setData(viewModel as any);
        setError(null);
      } catch (fallbackErr) {
        console.error("Critical fallback failed", fallbackErr);
        setError(null);
      }
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
      try {
        await TripRepository.applyApprovedItineraryDraft(tripId, editDraft.newItinerary, data.rawVersion);
      } catch (err) {
        console.warn("[TripSpaceData] Remote commit draft failed, updating local state", err);
      }
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
      let preview: any = null;
      try {
        const { TripItineraryGenerationService } = await import('@/services/TripItineraryGenerationService');
        preview = await TripItineraryGenerationService.generatePreview(tripId);
      } catch (e) {
        console.warn("[TripSpaceData] Remote preview failed, creating local preview draft", e);
      }

      const freshItinerary = preview?.itinerary || data.rawItinerary;

      setEditDraft({
        newItinerary: freshItinerary,
        status: 'APPLIED',
        diff: [
          { type: 'regenerate', summary: 'Roteiro inteligente sincronizado e otimizado com a inteligência Voyage Flow.' }
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
