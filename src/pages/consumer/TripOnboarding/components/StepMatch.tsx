import React, { useState, useEffect } from 'react';
import { Loader2, X, HelpCircle, Heart, CheckCircle2, ChevronRight, ChevronLeft } from 'lucide-react';
import OnboardingShell from './OnboardingShell';
import { ExperienceRepository } from '../../../../repositories/ExperienceRepository';
import { TravelExperience } from '../../../../repositories/ExperienceRepository';
import { TripWalletRepository } from '../../../../repositories/TripWalletRepository';

export default function StepMatch({
  trip,
  destination,
  displayStepNumber,
  onSave,
  onNext,
  onPrev
}: {
  trip: any,
  destination: any,
  displayStepNumber: number,
  onSave: (patch: any) => Promise<void>,
  onNext: () => void,
  onPrev: () => void
}) {
  const [loading, setLoading] = useState(true);
  const [experiences, setExperiences] = useState<TravelExperience[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [votes, setVotes] = useState<Record<string, string>>({}); // id -> vote
  const [isVoting, setIsVoting] = useState(false);

  useEffect(() => {
    async function loadExperiences() {
      if (!trip?.destination) return;
      try {
        setLoading(true);
        const data = await ExperienceRepository.getByDestination(trip.destination);
        if (data && data.length > 0) {
          // Keep a fixed slice so it doesn't reshuffle every reload
          const subset = data.slice(0, 10);
          setExperiences(subset);
          
          // Advance currentIndex to the first unvoted item
          const existingVotes = trip?.preferences?.match_votes || {};
          const firstUnvotedIndex = subset.findIndex(exp => !existingVotes[exp.id]);
          if (firstUnvotedIndex !== -1) {
            setCurrentIndex(firstUnvotedIndex);
          } else {
            setCurrentIndex(subset.length);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadExperiences();
  }, [trip]);

  // Load persisted votes from trip
  useEffect(() => {
    if (trip?.preferences?.match_votes) {
      setVotes(trip.preferences.match_votes);
    }
  }, [trip]);

  const handleVote = async (vote: string) => {
    if (experiences.length === 0 || currentIndex >= experiences.length) return;
    if (isVoting) return; // Prevent concurrent clicks
    
    setIsVoting(true);
    try {
      const currentExp = experiences[currentIndex];
      const newVotes = { ...votes, [currentExp.id]: vote };
      setVotes(newVotes);
      
      // Auto-save votes
      await onSave({ preferences: { ...trip.preferences, match_votes: newVotes } });

      // If 'bought', check wallet before creating a commitment
      if (vote === 'bought') {
        const existingWallet = await TripWalletRepository.getReservations(trip.id);
        const alreadyBooked = existingWallet.find(r => r.structured_data?.source_experience_id === currentExp.id);
        
        if (!alreadyBooked) {
          await TripWalletRepository.saveReservation({
            trip_id: trip.id,
            type: 'attraction',
            title: currentExp.name,
            purchase_status: 'booked',
            is_fixed: false,
            location_name: currentExp.neighborhood,
            price: currentExp.costUSD,
            structured_data: { source_experience_id: currentExp.id }
          });
        }
      }
      
      // Find the absolute first unvoted experience in the deck
      const nextUnvotedIndex = experiences.findIndex((exp) => !newVotes[exp.id]);
      
      if (nextUnvotedIndex !== -1) {
        setCurrentIndex(nextUnvotedIndex);
      } else {
        setCurrentIndex(experiences.length); // Done
      }
    } catch (err) {
      console.error("Failed to save vote", err);
    } finally {
      setIsVoting(false);
    }
  };

  const handleNextStep = async () => {
    // Save any pending changes and advance
    await onNext();
  };

  if (loading) {
    return (
      <OnboardingShell
        trip={trip}
        destination={destination}
        stepNumber={displayStepNumber}
        totalSteps={5}
        heroTitle={<>Match de<br/>Experiências</>}
        heroSubtitle="Carregando o catálogo da sua viagem..."
        onBack={onPrev}
      >
        <div className="flex justify-center p-20"><Loader2 className="w-8 h-8 animate-spin text-lime-500" /></div>
      </OnboardingShell>
    );
  }

  const currentExp = experiences[currentIndex];
  const isDone = experiences.length === 0 || currentIndex >= experiences.length;

  return (
    <OnboardingShell
      trip={trip}
      destination={destination}
      stepNumber={displayStepNumber}
      totalSteps={5}
      heroTitle={<>Match de<br/>Experiências</>}
      heroSubtitle="O que mais combina com você? Suas escolhas treinam a IA para o roteiro perfeito."
      onBack={onPrev}
      onContinue={handleNextStep}
      loading={false}
    >
      {isDone ? (
        <div className="p-12 bg-white border border-slate-200 rounded-[32px] text-center shadow-sm">
          <div className="w-16 h-16 bg-lime-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-8 h-8 text-lime-600" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-800">Match Concluído</h2>
          <p className="text-slate-500 mt-2 font-medium mb-8">Nossa inteligência artificial já entendeu as suas preferências baseada nos seus {Object.keys(votes).length} votos.</p>
          <button 
            onClick={handleNextStep}
            className="h-12 px-8 rounded-full bg-slate-900 text-white font-bold hover:bg-slate-800 transition-colors"
          >
            Avançar para DNA da Viagem
          </button>
        </div>
      ) : (
        <div className="max-w-md mx-auto">
          {/* Progress */}
          <div className="flex items-center justify-between mb-4">
             <span className="text-sm font-bold text-slate-500">Experiência {currentIndex + 1} de {experiences.length}</span>
             <div className="flex items-center gap-1">
               {experiences.map((_, idx) => (
                 <div key={idx} className={`h-1.5 rounded-full transition-all ${idx === currentIndex ? 'w-4 bg-slate-800' : idx < currentIndex ? 'w-1.5 bg-lime-500' : 'w-1.5 bg-slate-200'}`} />
               ))}
             </div>
          </div>

          {/* Card */}
          <div className="bg-white rounded-[32px] shadow-lg border border-slate-100 overflow-hidden mb-6 group relative">
            <div className="relative h-[300px] w-full bg-slate-100">
               {currentExp.image ? (
                 <img src={currentExp.image} alt={currentExp.name} className="w-full h-full object-cover" />
               ) : (
                 <div className="w-full h-full flex items-center justify-center text-slate-300">Sem Foto</div>
               )}
               <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
               <div className="absolute bottom-6 left-6 right-6 text-white">
                 <div className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[11px] font-bold tracking-widest uppercase mb-3">
                   {currentExp.categoryLabel}
                 </div>
                 <h3 className="text-2xl font-extrabold leading-tight mb-1 shadow-black">{currentExp.name}</h3>
                 <p className="text-sm font-medium text-white/80">{currentExp.neighborhood}</p>
               </div>
            </div>
            <div className="p-6 bg-white flex items-center justify-between border-t border-slate-100">
               <div className="text-center">
                 <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1">Duração</p>
                 <p className="font-bold text-slate-700">{currentExp.durationHours ? Math.round(currentExp.durationHours * 60) : 120} min</p>
               </div>
               <div className="w-px h-8 bg-slate-100" />
               <div className="text-center">
                 <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1">Custo</p>
                 <p className="font-bold text-slate-700">{currentExp.costLevel || 'Variável'}</p>
               </div>
               <div className="w-px h-8 bg-slate-100" />
               <div className="text-center">
                 <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1">Nota</p>
                 <p className="font-bold text-slate-700">★ {currentExp.rating || '4.5'}</p>
               </div>
            </div>
          </div>
          
          {/* Reason */}
          <div className="bg-lime-50 rounded-[20px] p-4 mb-6 border border-lime-100 flex items-start gap-3">
             <div className="w-8 h-8 rounded-full bg-lime-200 flex-shrink-0 flex items-center justify-center">
               <span className="text-lime-700 text-sm font-bold">IA</span>
             </div>
             <div>
               <p className="text-sm font-bold text-slate-800 mb-0.5">Por que recomendamos?</p>
               <p className="text-sm text-slate-600">Baseado no seu perfil de <span className="capitalize">{trip?.preferences?.travel_profile?.replace('_', ' ') || 'Explorador'}</span> e no seu interesse por <span className="lowercase">{trip?.preferences?.dimensions?.length ? trip.preferences.dimensions[0] : 'novas descobertas'}</span>, esta experiência se encaixa no seu ritmo.</p>
             </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-4 gap-3">
            <button onClick={() => handleVote('no')} className="flex flex-col items-center justify-center p-4 bg-white border border-slate-200 rounded-[20px] text-slate-400 hover:text-red-500 hover:border-red-500 transition-all hover:-translate-y-1">
              <X className="w-6 h-6 mb-2" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Não Combina</span>
            </button>
            <button onClick={() => handleVote('maybe')} className="flex flex-col items-center justify-center p-4 bg-white border border-slate-200 rounded-[20px] text-slate-400 hover:text-blue-500 hover:border-blue-500 transition-all hover:-translate-y-1">
              <HelpCircle className="w-6 h-6 mb-2" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Talvez</span>
            </button>
            <button onClick={() => handleVote('yes')} className="flex flex-col items-center justify-center p-4 bg-white border border-slate-200 rounded-[20px] text-slate-400 hover:text-pink-500 hover:border-pink-500 transition-all hover:-translate-y-1">
              <Heart className="w-6 h-6 mb-2" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Quero Muito</span>
            </button>
            <button onClick={() => handleVote('bought')} className="flex flex-col items-center justify-center p-4 bg-lime-100 border border-lime-200 rounded-[20px] text-lime-700 hover:bg-lime-200 transition-all hover:-translate-y-1">
              <CheckCircle2 className="w-6 h-6 mb-2" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Já Comprei</span>
            </button>
          </div>
        </div>
      )}
    </OnboardingShell>
  );
}
