import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useConsumerAuth } from "@/contexts/ConsumerAuthProvider";
import { TripRepository } from "@/repositories/TripRepository";
import { DestinationRow } from "@/repositories/DestinationRepository";
import OnboardingShell from "./consumer/TripOnboarding/components/OnboardingShell";
import StepTripStart from "./consumer/TripOnboarding/components/StepTripStart";

export default function NewTrip() {
  const navigate = useNavigate();
  const { user } = useConsumerAuth();

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Local state for live summary before Trip creation
  const [tripData, setTripData] = useState<any>({
    start_date: '',
    end_date: '',
    companionship: '',
    preferences: { startMode: '' }
  });
  const [selectedDestination, setSelectedDestination] = useState<DestinationRow | null>(null);

  const isValid = tripData.destination && tripData.start_date && tripData.end_date && tripData.companionship && tripData.preferences?.startMode;

  const handleSave = async () => {
    if (!isValid) return;
    setIsSaving(true);
    setError(null);
    try {
      if (!user) {
        throw new Error("Você precisa estar logado para criar uma viagem.");
      }

      const title = `Viagem para ${selectedDestination?.name || 'Destino Incrível'}`;

      const newTrip = await TripRepository.createTrip({
        title,
        destination: tripData.destination,
        start_date: tripData.start_date,
        end_date: tripData.end_date,
        companionship: tripData.companionship,
        status: 'draft',
      });

      const nextStep = tripData.preferences.startMode === 'zero' ? 'travel_style' : 'reservations';

      // Save startMode and current_step explicitly
      await TripRepository.updateTripOnboarding(newTrip.id, {
        preferences: {
           startMode: tripData.preferences.startMode,
           current_step: nextStep
        }
      });

      // After Trip is created, navigate to the onboarding container
      navigate(`/viagens/${newTrip.id}/onboarding`);

    } catch (err: any) {
      console.error(err);
      setError(err.message || "Não foi possível iniciar o planejamento.");
      setIsSaving(false);
    }
  };

  return (
    <OnboardingShell
      trip={tripData}
      destination={selectedDestination}
      stepNumber={1}
      totalSteps={5}
      heroTitle={<>Como sua próxima<br />viagem começa?</>}
      heroSubtitle="Selecione o destino, as datas e quem vai com você. O resto deixa com a gente."
      onContinue={handleSave}
      loading={isSaving}
      disabled={!isValid}
    >
      <StepTripStart
        onChange={setTripData}
        onDestinationSelect={setSelectedDestination}
        error={error}
      />
    </OnboardingShell>
  );
}
