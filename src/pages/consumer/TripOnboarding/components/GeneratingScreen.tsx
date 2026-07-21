import React from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import OnboardingShell from './OnboardingShell';
import { TripRepository } from '@/repositories/TripRepository';
import { TripWalletRepository } from '@/repositories/TripWalletRepository';
import { ExperienceRepository } from '@/repositories';
import { buildTripEngineDTO } from '@/utils/engineMapper';
import { generateSmartItinerary, UserProfile } from '@/utils/travelState';
import { useNavigate } from 'react-router-dom';

export function GeneratingScreen({ trip, destination, onError }: { trip: any, destination: any, onError: () => void }) {
  const navigate = useNavigate();
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [retryCount, setRetryCount] = React.useState(0);
  const [isSuccess, setIsSuccess] = React.useState(false);
  const [isNavigating, setIsNavigating] = React.useState(false);
  const isGeneratingRef = React.useRef(false);

  const handleOpenSpace = async () => {
    if (isNavigating) return;
    try {
      setIsNavigating(true);
      const freshTrip = await TripRepository.getTripById(trip.id);
      if (
        freshTrip &&
        Array.isArray(freshTrip.itinerary) &&
        freshTrip.itinerary.length > 0 &&
        freshTrip.preferences?.current_step === 'workspace'
      ) {
        navigate(`/viagens/${trip.id}/roteiro`, { replace: true });
      } else {
        setErrorMsg("Não foi possível confirmar a persistência do seu roteiro antes de abrir o espaço da viagem.");
        setIsSuccess(false);
        setIsNavigating(false);
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
      setIsSuccess(false);
      setIsNavigating(false);
    }
  };

  React.useEffect(() => {
    let isMounted = true;

    // Se o roteiro já existe e o step é workspace, ativa o sucesso imediatamente sem regenerar
    if (trip?.preferences?.current_step === 'workspace' && Array.isArray(trip.itinerary) && trip.itinerary.length > 0) {
      setIsSuccess(true);
      return;
    }
    
    async function doGenerate() {
      if (isGeneratingRef.current) return;
      isGeneratingRef.current = true;
      let stage = 'load_trip';
      let catalogCount = 0;
      let reservationCount = 0;
      
      try {
        if (!trip || !trip.id) {
           stage = 'validate_trip';
           throw new Error("Trip ID não encontrado.");
        }
        
        setErrorMsg(null);
        const start = Date.now();

        stage = 'load_wallet';
        const reservations = await TripWalletRepository.getReservations(trip.id);
        reservationCount = reservations.length;

        stage = 'load_catalog';
        const catalog = await ExperienceRepository.getAll();
        catalogCount = catalog.length;

        if (catalogCount === 0) {
           throw new Error("Não foram encontradas experiências publicadas para este destino.");
        }

        stage = 'build_profile';
        const dto = buildTripEngineDTO(trip, reservations);

        // Fluxo Arquitetural Canônico:
        // 1. MatchEngine -> produz match_deck, votos e afinidades (já armazenados no perfil/dto)
        // 2. generateSmartItinerary -> produz ItineraryDay[]
        // 3. TripRepository -> persiste diretamente em trips.itinerary (JSONB)

        // Cálculo seguro de dias usando UTC explícito (YYYY-MM-DD):
        let calculatedDays = 3;
        if (trip.start_date && trip.end_date) {
          const partsStart = trip.start_date.split('-').map(Number);
          const partsEnd = trip.end_date.split('-').map(Number);

          if (partsStart.length !== 3 || partsEnd.length !== 3 || partsStart.some(isNaN) || partsEnd.some(isNaN)) {
            throw new Error("Data de viagem inválida.");
          }

          const utcStart = Date.UTC(partsStart[0], partsStart[1] - 1, partsStart[2]);
          const utcEnd = Date.UTC(partsEnd[0], partsEnd[1] - 1, partsEnd[2]);

          if (utcEnd < utcStart) {
            throw new Error("A data de término não pode ser anterior à data de início.");
          }

          const diffDays = Math.floor((utcEnd - utcStart) / (1000 * 60 * 60 * 24));
          calculatedDays = diffDays + 1; // Inclui datas de chegada e partida (dias de calendário)
        }

        const userProfile: UserProfile = {
          style: dto.companionship as any,
          interests: [],
          budget: dto.budget_level === 'high' ? '$$$$' : dto.budget_level === 'low' ? '$' : '$$',
          days: calculatedDays,
          startDate: trip.start_date || new Date().toISOString().split('T')[0],
          passengerName: "Viajante",
          personaAffinity: { explorador_visual: 0.5, curador_experiencias: 0.5, descobridor: 0.5, aproveitador: 0.5, slow_traveler: 0.5 },
          tagAffinity: {}, pace: dto.pace as any, companionship: dto.companionship as any, transport: 'public', financial: 'balanced',
          swipedRightIds: Object.keys(dto.tinder_votes || {}).filter(k => dto.tinder_votes[k] === 'love'),
          swipedLeftIds: Object.keys(dto.tinder_votes || {}).filter(k => dto.tinder_votes[k] === 'reject'),
          interactions: []
        };

        stage = 'run_engine';
        const itinerary = generateSmartItinerary(userProfile, catalog);

        stage = 'validate_itinerary';
        if (!itinerary || itinerary.length === 0) {
          throw new Error("Roteiro vazio retornado pela Engine.");
        }

        stage = 'persist_itinerary';
        
        const serializedItinerary = JSON.stringify(itinerary);
        if (!serializedItinerary) {
          throw new Error('O roteiro não pôde ser serializado.');
        }
        const cleanItinerary = JSON.parse(serializedItinerary);
        
        console.info('[ITINERARY_PAYLOAD_SUMMARY]', {
          tripId: trip.id,
          isArray: Array.isArray(cleanItinerary),
          dayCount: Array.isArray(cleanItinerary) ? cleanItinerary.length : null,
          firstDayKeys: Array.isArray(cleanItinerary) && cleanItinerary[0] ? Object.keys(cleanItinerary[0]) : [],
          serializedBytes: new Blob([serializedItinerary]).size,
        });

        await TripRepository.updateTripOnboarding(trip.id, { 
          itinerary: cleanItinerary, 
          status: 'planning', // Status deve ser canonico de acordo com a migration
          preferences: { 
            current_step: 'workspace',
            is_generating_locked: false,
            generating_locked_at: null,
            generation_error: null
          } 
        });

        stage = 'confirm_persistence';
        const verifyTrip = await TripRepository.getTripById(trip.id);
        if (!verifyTrip?.itinerary || !Array.isArray(verifyTrip.itinerary) || verifyTrip.itinerary.length === 0) {
           throw new Error("O roteiro foi salvo mas não está preenchido no banco (falha silenciosa).");
        }

        const elapsed = Date.now() - start;
        if (elapsed < 2000) {
          await new Promise(resolve => setTimeout(resolve, 2000 - elapsed));
        }

        stage = 'navigate';
        if (isMounted) {
           isGeneratingRef.current = false;
           setIsSuccess(true);
        }
      } catch (error) {
        const getErrorDetails = (err: unknown) => {
          if (err && typeof err === 'object') {
            const value = err as Record<string, unknown>;
            return {
              name: value.name,
              message: value.message,
              code: value.code,
              details: value.details,
              hint: value.hint,
              status: value.status,
              statusCode: value.statusCode,
            };
          }
          return { message: String(err) };
        };
        
        const errorDetails = getErrorDetails(error);
        
        console.error('[PERSIST_ITINERARY_FAILED]', {
          stage,
          error: errorDetails,
          tripId: trip?.id,
          destinationId: destination?.id,
          catalogCount,
          reservationCount
        });
        
        if (isMounted) {
          setErrorMsg(`Erro técnico: ${stage} — ${errorDetails.code || 'N/A'} — ${errorDetails.message || 'N/A'} — ${errorDetails.details || 'N/A'} — ${errorDetails.hint || 'N/A'}`);
          isGeneratingRef.current = false;
        }
      }
    }

    doGenerate();

    return () => { isMounted = false; };
  }, [trip, navigate, retryCount]);

  return (
    <OnboardingShell
      trip={trip}
      destination={destination}
      stepNumber={5}
      totalSteps={5}
      heroTitle={<>Gerando<br/>Roteiro</>}
      heroSubtitle={isSuccess ? "Roteiro gerado com sucesso!" : (errorMsg ? "Tivemos um problema" : "Nossa inteligência está montando seus dias.")}
      onBack={onError}
      loading={!errorMsg && !isSuccess}
    >
      <div className="max-w-md mx-auto py-12">
        <div className="bg-white rounded-[32px] p-8 border border-slate-200 shadow-xl shadow-slate-200/50 relative overflow-hidden text-center">
          <div className={`absolute top-0 right-0 w-32 h-32 ${errorMsg ? 'bg-red-100' : 'bg-lime-100'} rounded-full blur-3xl -translate-y-1/2 translate-x-1/2`} />
          
          <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-6 relative z-10">
             <Sparkles className={`w-8 h-8 ${errorMsg ? 'text-red-400' : 'text-lime-400 animate-pulse'}`} />
          </div>

          <h3 className="text-xl font-extrabold text-slate-800 mb-2 relative z-10">
             {isSuccess ? "Roteiro criado com sucesso." : (errorMsg ? errorMsg : "Estamos criando seu roteiro")}
          </h3>
          <p className="text-sm text-slate-500 font-medium mb-8 relative z-10">
             {isSuccess ? "Seu planejamento foi salvo. Agora seu espaço da viagem está pronto para ganhar vida." : (errorMsg ? "Não foi possível criar seu roteiro agora. Seus dados foram preservados." : "Cruzando suas preferências com o DNA do destino...")}
          </p>

          {isSuccess ? (
            <div className="flex gap-3 justify-center relative z-10 flex-col">
              <button 
                onClick={handleOpenSpace}
                disabled={isNavigating}
                className="bg-lime-500 text-slate-900 px-6 py-3.5 rounded-full font-extrabold hover:bg-lime-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-lime-500/20 disabled:opacity-50"
              >
                {isNavigating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Abrindo espaço...</span>
                  </>
                ) : (
                  <>
                    <span>Abrir meu espaço da viagem</span>
                    <Sparkles className="w-5 h-5" />
                  </>
                )}
              </button>

              <button 
                onClick={onError}
                disabled={isNavigating}
                className="bg-slate-100 text-slate-600 px-6 py-2.5 rounded-full font-medium hover:bg-slate-200 transition-colors text-sm"
              >
                Revisar DNA da viagem
              </button>
            </div>
          ) : errorMsg ? (
            <div className="flex gap-4 justify-center relative z-10 flex-col">
              <button 
                onClick={() => setRetryCount(prev => prev + 1)}
                className="bg-lime-500 text-slate-900 px-6 py-2.5 rounded-full font-medium hover:bg-lime-600 transition-colors"
              >
                Tentar novamente
              </button>

              <button 
                onClick={onError}
                className="bg-slate-100 text-slate-700 px-6 py-2.5 rounded-full font-medium hover:bg-slate-200 transition-colors"
              >
                Revisar DNA da viagem
              </button>
            </div>
          ) : (
            <div className="flex justify-center relative z-10 h-8">
               <Loader2 className="w-8 h-8 text-lime-500 animate-spin" />
            </div>
          )}
        </div>
      </div>
    </OnboardingShell>
  );
}
