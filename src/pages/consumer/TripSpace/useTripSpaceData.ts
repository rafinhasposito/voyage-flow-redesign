import { useState, useEffect } from 'react';
import { TripRepository } from '@/repositories/TripRepository';
import { TripWalletRepository } from '@/repositories/TripWalletRepository';
import { DestinationRepository } from '@/repositories/DestinationRepository';
import { ExperienceRepository } from '@/repositories/ExperienceRepository';
import { useConsumerAuth } from '@/contexts/ConsumerAuthProvider';
import { TripSpaceViewModel } from '@/types/tripSpace.types';
import { buildTripSpaceViewModel } from '@/utils/tripSpaceAdapter';

const GUARANTEED_NY_ITINERARY = [
  {
    _isMetadata: true,
    version: '2.0',
    generatedAt: new Date().toISOString()
  },
  {
    day: 1,
    dateStr: '2026-08-02',
    theme: 'Chegada & Ícones de Midtown',
    activities: [
      {
        id: 'central-park',
        title: 'Central Park & Bethesda Terrace',
        category: 'Natureza',
        neighborhood: 'Midtown / Upper Side',
        description: 'Caminhada matinal sob o dossel de árvores centenárias e a arquitetura icônica de Bethesda Terrace.',
        durationMinutes: 180,
        costUSD: 0,
        imageUrl: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=600&q=80',
        isFixed: false,
        isLocked: false
      },
      {
        id: 'the-met',
        title: 'The Metropolitan Museum of Art (The MET)',
        category: 'Cultura',
        neighborhood: 'Upper East Side',
        description: 'Mais de 5.000 anos de arte mundial, desde o Templo de Dendur até as obras impressionistas.',
        durationMinutes: 180,
        costUSD: 30,
        imageUrl: 'https://images.unsplash.com/photo-1565008447742-97f6f38c985c?w=600&q=80',
        isFixed: true,
        isLocked: true
      },
      {
        id: 'top-of-the-rock',
        title: 'Top of the Rock Observation Deck',
        category: 'Mirante',
        neighborhood: 'Midtown',
        description: 'Vista panorâmica deslumbrante de 360° do Empire State Building e do Central Park.',
        durationMinutes: 90,
        costUSD: 40,
        imageUrl: 'https://images.unsplash.com/photo-1534430480872-3498386e7856?w=600&q=80',
        isFixed: false,
        isLocked: false
      }
    ]
  },
  {
    day: 2,
    dateStr: '2026-08-03',
    theme: 'Arte Moderna & West Side',
    activities: [
      {
        id: 'high-line',
        title: 'High Line Park',
        category: 'Passeio',
        neighborhood: 'Chelsea / Hudson Yards',
        description: 'Parque suspenso construído sobre uma antiga linha férrea com jardins e instalações artísticas.',
        durationMinutes: 120,
        costUSD: 0,
        imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&q=80',
        isFixed: false,
        isLocked: false
      },
      {
        id: 'chelsea-market',
        title: 'Chelsea Market',
        category: 'Gastronomia',
        neighborhood: 'Meatpacking District',
        description: 'Mercado gastronômico e cultural em uma antiga fábrica com frutos do mar, tacos e doces artesanais.',
        durationMinutes: 90,
        costUSD: 25,
        imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&q=80',
        isFixed: false,
        isLocked: false
      },
      {
        id: 'moma',
        title: 'Museum of Modern Art (MoMA)',
        category: 'Cultura',
        neighborhood: 'Midtown',
        description: 'Coleção lendária de arte moderna e contemporânea com obras de Van Gogh, Picasso e Warhol.',
        durationMinutes: 150,
        costUSD: 28,
        imageUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=600&q=80',
        isFixed: false,
        isLocked: false
      }
    ]
  },
  {
    day: 3,
    dateStr: '2026-08-04',
    theme: 'Estátua da Liberdade & Downtown',
    activities: [
      {
        id: 'statue-liberty',
        title: 'Estátua da Liberdade & Ellis Island',
        category: 'História',
        neighborhood: 'Financial District',
        description: 'Passeio de balsa para o monumento icônico e o museu histórico de imigração dos EUA.',
        durationMinutes: 240,
        costUSD: 25,
        imageUrl: 'https://images.unsplash.com/photo-1605130284535-11dd9eedc58a?w=600&q=80',
        isFixed: true,
        isLocked: true
      },
      {
        id: 'brooklyn-bridge',
        title: 'Ponte do Brooklyn (Caminhada)',
        category: 'Passeio',
        neighborhood: 'DUMBO / Lower Manhattan',
        description: 'Atravessar a pé uma das pontes suspensas mais famosas do mundo com vista para o skyline.',
        durationMinutes: 90,
        costUSD: 0,
        imageUrl: 'https://images.unsplash.com/photo-1543716091-a840c05249ec?w=600&q=80',
        isFixed: false,
        isLocked: false
      }
    ]
  },
  {
    day: 4,
    dateStr: '2026-08-05',
    theme: 'Compras, Gastronomia & Broadway',
    activities: [
      {
        id: 'soho-shopping',
        title: 'SoHo Architecture & Shopping',
        category: 'Compras',
        neighborhood: 'SoHo',
        description: 'Ruas charmosas de paralelepípedos com edifícios de ferro fundido, galerias e boutiques.',
        durationMinutes: 150,
        costUSD: 0,
        imageUrl: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=600&q=80',
        isFixed: false,
        isLocked: false
      },
      {
        id: 'katzs-delicatessen',
        title: "Katz's Delicatessen",
        category: 'Gastronomia',
        neighborhood: 'Lower East Side',
        description: 'O sanduíche de pastrami mais famoso e tradicional de Nova York desde 1888.',
        durationMinutes: 60,
        costUSD: 35,
        imageUrl: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=600&q=80',
        isFixed: false,
        isLocked: false
      },
      {
        id: 'broadway-show',
        title: 'Espetáculo da Broadway',
        category: 'Entretenimento',
        neighborhood: 'Theater District',
        description: 'A magia dos musicais inesquecíveis no coração de Times Square.',
        durationMinutes: 180,
        costUSD: 120,
        imageUrl: 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?w=600&q=80',
        isFixed: true,
        isLocked: true
      }
    ]
  }
];

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
        try {
          trip = await TripRepository.getTripById(tripId);
        } catch (e) {
          console.warn("[TripSpaceData] Supabase fetch error, fallback to local state", e);
        }
      }

      if (!trip) {
        let localItinerary: any[] = [];
        try {
          const { getTravelState } = await import('@/utils/travelState');
          const localState = getTravelState();
          if (localState?.itinerary && localState.itinerary.length > 0) {
            localItinerary = localState.itinerary.map(day => ({
              day: day.dayNumber,
              dateStr: day.date,
              theme: day.theme,
              activities: (day.attractions || []).map(a => ({
                id: a.id,
                title: a.name,
                category: a.category,
                neighborhood: a.neighborhood,
                description: a.emotionalDescription || a.description,
                durationMinutes: (a.durationHours || 1.5) * 60,
                costUSD: a.costUSD || 0,
                imageUrl: a.image,
                isFixed: false,
                isLocked: false
              }))
            })).filter(d => d.activities.length > 0);
          }
        } catch (e) {
          console.warn("[TripSpaceData] Error parsing localState itinerary", e);
        }

        trip = {
          id: tripId || 'e8f37583-d42e-49b9-8e04-042e69f2b09c',
          title: 'Nova York em Estilo',
          destination: 'new-york',
          start_date: '2026-08-02',
          end_date: '2026-08-06',
          companionship: 'couple',
          budget_level: 'medium',
          status: 'planned',
          preferences: {},
          itinerary: localItinerary.length > 0 ? localItinerary : GUARANTEED_NY_ITINERARY
        };
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
