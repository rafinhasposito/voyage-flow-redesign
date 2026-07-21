import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useConsumerAuth } from '../../../contexts/ConsumerAuthProvider';
import { TripRepository } from '../../../repositories/TripRepository';
import { TripWalletRepository, TripReservation, TripDocument } from '../../../repositories/TripWalletRepository';
import { DestinationRepository, DestinationRow } from '../../../repositories/DestinationRepository';
import { Loader2 } from 'lucide-react';

import OnboardingShell from './components/OnboardingShell';
import StepTripStart from './components/StepTripStart';
import StepTravelStyle from './components/StepTravelStyle';
import StepReservations from './components/StepReservations';
import StepMatch from './components/StepMatch';
import StepDNA from './components/StepDNA';
import { GeneratingScreen } from './components/GeneratingScreen';

export type OnboardingStepId = 'start' | 'travel_style' | 'reservations' | 'match' | 'dna' | 'generating';

export default function TripOnboardingContainer() {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const { user } = useConsumerAuth();

  const [trip, setTrip] = useState<any>(null);
  const [destination, setDestination] = useState<DestinationRow | null>(null);
  const [reservations, setReservations] = useState<TripReservation[]>([]);
  const [documents, setDocuments] = useState<TripDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dynamic flow calculation based on startMode
  const startMode = trip?.preferences?.startMode || 'zero';

  const flow: OnboardingStepId[] = useMemo(() => {
    if (startMode === 'zero') {
      return ['start', 'travel_style', 'reservations', 'match', 'dna'];
    }
    // "reservas" mode
    return ['start', 'reservations', 'travel_style', 'match', 'dna'];
  }, [startMode]);

  // Read current step from DB or default to 'start' if not found
  const currentStepId = trip?.preferences?.current_step || 'start';
  const currentStepIndex = flow.indexOf(currentStepId) !== -1 ? flow.indexOf(currentStepId) : 0;

  // Step number is purely visual based on the array order (1 to 5)
  const displayStepNumber = currentStepIndex + 1;

  const loadAll = async () => {
    if (!tripId || !user) return;
    try {
      setLoading(true);
      setError(null);
      const data = await TripRepository.getTripById(tripId);
      if (data && data.user_id === user.id) {
        setTrip(data);

        // Fetch destination details
        if (data.destination) {
           DestinationRepository.sync((dests) => {
             const found = dests.find(d => d.id === data.destination);
             if (found) setDestination(found);
           });
        }

        const res = await TripWalletRepository.getReservations(tripId);
        setReservations(res);
        const docs = await TripWalletRepository.getDocuments(tripId);
        setDocuments(docs);
      } else {
        setError("Viagem não encontrada ou acesso negado.");
      }
    } catch (err) {
      console.error(err);
      setError("Erro ao carregar a viagem.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, [tripId, user]);

  const handleUpdateTrip = async (patch: any) => {
    try {
      await TripRepository.updateTripOnboarding(trip.id, patch);
      await loadAll();
    } catch (err) {
      console.error("Falha ao salvar", err);
      throw err;
    }
  };

  const goToNextStep = async () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < flow.length) {
       const nextId = flow[nextIndex];
       await handleUpdateTrip({ preferences: { current_step: nextId } });
    } else {
       await handleUpdateTrip({ preferences: { current_step: 'generating' } });
    }
  };

  const goToPrevStep = async () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
       const prevId = flow[prevIndex];
       await handleUpdateTrip({ preferences: { current_step: prevId } });
    } else {
       // Se estiver no Start, pode voltar pra lista de viagens
       navigate('/minhas-viagens');
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-[#FDFCF8]"><Loader2 className="w-8 h-8 animate-spin text-lime-500" /></div>;
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FDFCF8] p-6 text-center">
        <h1 className="text-2xl font-bold mb-4">{error}</h1>
        <button onClick={() => navigate('/minhas-viagens')} className="text-lime-600 font-bold hover:underline">Voltar para Minhas Viagens</button>
      </div>
    );
  }

  if (!trip) return null;

  // Render Step 1 (Start)
  if (currentStepId === 'start') {
    return (
      <OnboardingShell
        trip={trip}
        destination={destination}
        stepNumber={1}
        totalSteps={5}
        heroTitle={<>Como sua próxima<br />viagem começa?</>}
        heroSubtitle="Selecione o destino, as datas e quem vai com você. O resto deixa com a gente."
        onBack={() => navigate('/minhas-viagens')}
        onContinue={async () => {
          // Quando estiver na etapa Start já criada, e clicar em Continuar,
          // nós apenas navegamos para a próxima etapa visual.
          await goToNextStep();
        }}
      >
        <StepTripStart
          initialData={trip}
          onChange={async (data) => {
             // Autosave do formulário caso ele mude coisas no Start
             if (
               data.destination !== trip.destination ||
               data.start_date !== trip.start_date ||
               data.end_date !== trip.end_date ||
               data.companionship !== trip.companionship ||
               data.preferences.startMode !== trip.preferences?.startMode
             ) {
                TripRepository.updateTripOnboarding(trip.id, data).then(() => {
                  loadAll(); // Atualizar o shell
                });
             }
          }}
          onDestinationSelect={setDestination}
        />
      </OnboardingShell>
    );
  }

  // Render Step 2 (Travel Style)
  if (currentStepId === 'travel_style') {
    return (
      <StepTravelStyle
        trip={trip}
        destination={destination}
        displayStepNumber={displayStepNumber}
        onSave={handleUpdateTrip}
        onNext={goToNextStep}
        onPrev={goToPrevStep}
      />
    );
  }

  // Render Reservations
  if (currentStepId === 'reservations') {
    return (
      <StepReservations
        trip={trip}
        destination={destination}
        displayStepNumber={displayStepNumber}
        onSave={handleUpdateTrip}
        onNext={goToNextStep}
        onPrev={goToPrevStep}
      />
    );
  }

  // Render Match
  if (currentStepId === 'match') {
    return (
      <StepMatch
        trip={trip}
        destination={destination}
        displayStepNumber={displayStepNumber}
        onSave={handleUpdateTrip}
        onNext={goToNextStep}
        onPrev={goToPrevStep}
      />
    );
  }

  // Render DNA
  if (currentStepId === 'dna') {
    return (
      <StepDNA
        trip={trip}
        destination={destination}
        displayStepNumber={displayStepNumber}
        onSave={handleUpdateTrip}
        onNext={goToNextStep}
        onPrev={goToPrevStep}
      />
    );
  }

  // Render Generating / Workspace
  if (currentStepId === 'generating' || currentStepId === 'workspace') {
    return (
      <GeneratingScreen
        trip={trip}
        destination={destination}
        onError={() => handleUpdateTrip({ preferences: { current_step: 'dna' } })}
      />
    );
  }

  // Fallback para etapas verdadeiramente desconhecidas
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#FDFCF8] p-6 text-center">
      <h1 className="text-xl font-bold text-slate-800 mb-2">Não foi possível identificar esta etapa da viagem.</h1>
      <p className="text-sm text-slate-500 mb-6">A etapa "{currentStepId}" é inválida ou não foi reconhecida.</p>
      <button
        onClick={() => navigate('/minhas-viagens')}
        className="bg-slate-900 text-white px-6 py-2.5 rounded-full font-medium hover:bg-slate-800 transition-colors"
      >
        Voltar para Minhas Viagens
      </button>
    </div>
  );
}
