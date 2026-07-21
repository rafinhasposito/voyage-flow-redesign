import React, { useState, useEffect } from 'react';
import { Loader2, X, HelpCircle, Heart, CheckCircle2, ChevronRight, ChevronLeft, MapPin, Star } from 'lucide-react';
import OnboardingShell from './OnboardingShell';
import { ExperienceRepository, TravelExperience } from '../../../../repositories/ExperienceRepository';
import { TripWalletRepository } from '../../../../repositories/TripWalletRepository';
import { MatchEngine, MatchDeck } from '../../../../lib/intelligence/MatchEngine';

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

  const [matchDeck, setMatchDeck] = useState<MatchDeck | null>(null);

  useEffect(() => {
    async function loadExperiences() {
      if (!trip?.destination) return;
      try {
        setLoading(true);
        const data = await ExperienceRepository.getByDestination(trip.destination);
        if (data && data.length > 0) {

          let deck = trip?.preferences?.match_deck as MatchDeck;

          if (!deck || !deck.items) {
            // Generate initial deck using MatchEngine
            deck = MatchEngine.buildInitialDeck(trip.preferences, data, 10);

            // Persist the new deck
            await onSave({
              preferences: { ...trip.preferences, match_deck: deck }
            });
          }

          setMatchDeck(deck);

          // Map deck items to actual experiences
          const deckExps = deck.items.map(item => data.find(e => e.id === item.experience_id)).filter(e => !!e) as TravelExperience[];
          setExperiences(deckExps);

          // Advance currentIndex to the first unvoted item
          const existingVotes = trip?.preferences?.match_votes || {};
          const firstUnvotedIndex = deckExps.findIndex(exp => !existingVotes[exp.id]);
          if (firstUnvotedIndex !== -1) {
            setCurrentIndex(firstUnvotedIndex);
          } else {
            setCurrentIndex(deckExps.length);
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

      // If 'bought', check wallet before creating a commitment
      if (vote === 'bought') {
        try {
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
        } catch (walletErr) {
          console.error("Failed to save to wallet:", walletErr);
        }
      }

      // Apply dynamic rules via MatchEngine
      if (matchDeck) {
        const votedIds = new Set(Object.keys(newVotes));
        const currentItem = matchDeck.items.find(i => i.experience_id === currentExp.id);

        if (currentItem) {
          const allData = await ExperienceRepository.getByDestination(trip.destination);
          const updatedDeck = MatchEngine.handleVote(vote as any, currentItem, matchDeck, allData, votedIds);

          setMatchDeck(updatedDeck);

          // Persist both votes and the new deck state
          await onSave({
            preferences: {
              ...trip.preferences,
              match_votes: newVotes,
              match_deck: updatedDeck
            }
          });

          // Refresh the rendered experiences to match the updated deck
          const deckExps = updatedDeck.items.map(item => allData.find(e => e.id === item.experience_id)).filter(e => !!e) as TravelExperience[];
          setExperiences(deckExps);

          // Find next unvoted
          const nextUnvotedIndex = deckExps.findIndex((exp) => !newVotes[exp.id]);
          if (nextUnvotedIndex !== -1) {
            setCurrentIndex(nextUnvotedIndex);
          } else {
            setCurrentIndex(deckExps.length); // Done
          }
          return;
        }
      }

      // Fallback save if MatchEngine fails
      await onSave({ preferences: { ...trip.preferences, match_votes: newVotes } });
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

  // Retrieve reasoning for the current experience
  const currentDeckItem = matchDeck?.items?.find(i => i.experience_id === currentExp?.id);
  const dynamicReason = currentDeckItem ? MatchEngine.getReasonPhrase(currentDeckItem.reasons) : "Selecionado pela curadoria do destino.";

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
      {experiences.length === 0 ? (
        <div className="p-12 bg-white border border-slate-200 rounded-[32px] text-center shadow-sm">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
             <HelpCircle className="w-8 h-8 text-slate-400" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-800">Sem experiências disponíveis</h2>
          <p className="text-slate-500 mt-2 font-medium mb-8">Não encontramos experiências suficientes cadastradas para este destino no momento.</p>
          <div className="flex flex-col gap-3">
             <button onClick={handleNextStep} className="h-12 px-8 rounded-full bg-slate-900 text-white font-bold hover:bg-slate-800 transition-colors">
               Continuar para DNA da Viagem
             </button>
             <button onClick={onPrev} className="h-12 px-8 rounded-full bg-white text-slate-600 border border-slate-200 font-bold hover:bg-slate-50 transition-colors">
               Voltar e ajustar preferências
             </button>
          </div>
        </div>
      ) : isDone ? (
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
          <div className="bg-white rounded-[32px] shadow-lg border border-slate-100 overflow-hidden mb-6 group">
            {/* Top Image Section */}
            <div className="relative aspect-video max-h-[220px] w-full bg-slate-100">
               {currentExp.image ? (
                 <img src={currentExp.image} alt={currentExp.name} className="w-full h-full object-cover" />
               ) : (
                 <div className="w-full h-full flex items-center justify-center text-slate-300">Sem Foto</div>
               )}
               {/* Chips (Top Left) */}
               <div className="absolute top-4 left-4 flex gap-2">
                 {currentExp.categoryLabel && (
                   <div className="inline-block px-3 py-1.5 bg-white/90 backdrop-blur-md rounded-full text-[11px] font-bold tracking-widest uppercase text-slate-800 shadow-sm">
                     {currentExp.categoryLabel}
                   </div>
                 )}
                 {currentExp.is_must_see && (
                   <div className="inline-block px-3 py-1.5 bg-lime-100 backdrop-blur-md border border-lime-200 rounded-full text-[11px] font-bold tracking-widest uppercase text-lime-900 shadow-sm">
                     Must See
                   </div>
                 )}
               </div>
            </div>

            {/* Info Section (Solid block below image) */}
            <div className="p-6 bg-white flex flex-col gap-3">
               <div>
                 <h3 className="text-2xl font-extrabold leading-tight mb-1 text-slate-900">{currentExp.name}</h3>
                 <p className="text-sm font-medium text-slate-500 flex items-center gap-1.5">
                   <MapPin className="w-4 h-4 text-slate-400" />
                   {currentExp.neighborhood || 'Localização não informada'}
                 </p>
               </div>

               {currentExp.emotionalDescription && (
                 <p className="text-slate-600 font-medium text-sm leading-relaxed line-clamp-3">
                   {currentExp.emotionalDescription}
                 </p>
               )}
            </div>

            {/* Metrics Section */}
            {(currentExp.durationHours || currentExp.costLevel || currentExp.rating) && (
              <div className="px-6 py-4 bg-slate-50 flex items-center justify-center gap-4 border-t border-slate-100">
                 {currentExp.durationHours && (
                   <>
                     <div className="text-center flex-1">
                       <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1">Duração</p>
                       <p className="font-bold text-slate-700">{Math.round(currentExp.durationHours * 60)} min</p>
                     </div>
                     {(currentExp.costLevel || currentExp.rating) && <div className="w-px h-8 bg-slate-200" />}
                   </>
                 )}

                 {currentExp.costLevel && (
                   <>
                     <div className="text-center flex-1">
                       <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1">Custo</p>
                       <p className="font-bold text-slate-700">{currentExp.costLevel}</p>
                     </div>
                     {currentExp.rating && <div className="w-px h-8 bg-slate-200" />}
                   </>
                 )}

                 {currentExp.rating && (
                   <div className="text-center flex-1">
                     <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1">Nota</p>
                     <p className="font-bold text-slate-700 flex items-center justify-center gap-1">
                       <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                       {currentExp.rating}
                     </p>
                   </div>
                 )}
              </div>
            )}
          </div>

          {/* Reason (Collapsible) */}
          <details className="mb-6 group/reason">
            <summary className="text-sm font-bold text-slate-500 cursor-pointer list-none flex items-center justify-center gap-2 hover:text-slate-700 transition-colors">
              <span className="border-b border-dashed border-slate-400 group-hover/reason:border-slate-600">Por que entrou no Match?</span>
            </summary>
            <div className="mt-3 bg-slate-50 rounded-2xl p-4 border border-slate-200 text-center text-sm font-medium text-slate-600">
              {dynamicReason}
            </div>
          </details>

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
