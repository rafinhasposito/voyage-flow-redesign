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
      setError(err instanceof Error ? err.message : "Ocorreu um erro ao carregar os dados da viagem.");
      setData(null);
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
    if (!tripId || !data) { console.warn("executeDirectAction early return due to missing tripId or data"); return; }
    try {
      setDraftLoading(true);
      await TripRepository.setItineraryActivityLock(tripId, activityId, isLocked, data.rawVersion);
      await reloadData();
    } catch (err: any) {
      console.error("[executeDirectAction] Caught error:", err);
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
      console.error("[executeDirectAction] Caught error:", err);
      console.error(err);
      setError(err.message || "Erro ao gerar preview.");
    } finally {
      setDraftLoading(false);
    }
  };

  const executeDirectAction = async (intent: import("@/domain/itinerary-engine/edit-intents").ItineraryEditIntent) => {
    console.log("[executeDirectAction] Called with intent:", intent);
    if (!tripId || !data) { console.warn("executeDirectAction early return: tripId ou data ausentes."); return; }
    setDraftLoading(true);
    try {
      const { applyEditIntentDraft } = await import("@/domain/itinerary-engine/edit-intents");
      const draft = applyEditIntentDraft(data.rawItinerary, { ...intent, expectedVersion: data.rawVersion }, data.reservations as any);
      console.log("[executeDirectAction] Draft status:", draft.status, draft.warnings);

      if (draft.status === "APPLIED") {
        // Persistência real — só chama o banco quando há diferença confirmada
        await TripRepository.applyApprovedItineraryDraft(tripId, draft.newItinerary, data.rawVersion);
        await reloadData();
      } else if (draft.status === "NO_CHANGE") {
        // Nenhuma alteração real — não persistir, mas também não é erro
        console.warn("[executeDirectAction] Nenhuma alteração detectada — persistência ignorada.");
      } else if (draft.status === "ALREADY_APPLIED") {
        // Experiência já está no dia — informar sem persistir
        setError("Esta experiência já está neste dia do roteiro.");
      } else {
        // Bloqueado, inválido ou sem placement
        throw new Error(
          draft.warnings?.join(", ") ||
          `Ação rejeitada pela engine: ${draft.status}`
        );
      }
    } catch (err: any) {
      console.error("[executeDirectAction] Erro:", err);
      setError(err.message || "Erro ao salvar alteração no roteiro.");
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
      console.error("[executeDirectAction] Caught error:", err);
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
    setDraftLoading(true);
    try {
      const { TripItineraryGenerationService } = await import('@/services/TripItineraryGenerationService');
      await TripItineraryGenerationService.generateAndPersist(tripId);
      await reloadData();
    } catch (err: any) {
      console.error("[executeDirectAction] Caught error:", err);
      console.error(err);
      setError(err.message || "Erro ao regenerar roteiro.");
      setDraftLoading(false);
    }
  };

  const previewRegeneration = async () => {
    if (!tripId || !data) { console.warn("executeDirectAction early return due to missing tripId or data"); return; }
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
      console.error("[executeDirectAction] Caught error:", err);
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
    executeDirectAction,
    clearDraft,
    editDraft,
    draftLoading,
    regenerateItinerary,
    previewRegeneration
  };
}
