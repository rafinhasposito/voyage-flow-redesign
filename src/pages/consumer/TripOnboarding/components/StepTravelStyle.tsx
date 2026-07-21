import React, { useState } from 'react';
import { ArrowRight, ArrowLeft, RefreshCw, Star, Info, TrendingUp, Check, Camera, Utensils, ShoppingBag, Wine, Landmark, Palette, Trees, Sparkles, Palmtree, Tent, Coffee, Ticket, HeartHandshake, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import OnboardingShell from './OnboardingShell';

const QUIZ_QUESTIONS = [
  {
    id: 'q1',
    title: 'Em uma manhã livre, você prefere...',
    options: [
      { id: 'cedo', label: 'Sair cedo para aproveitar tudo', impact: { pace: 1 }, image: 'https://images.unsplash.com/photo-1542204165-65bf26472b9b?q=80&w=600&auto=format&fit=crop' },
      { id: 'sem_pressa', label: 'Começar sem pressa', impact: { pace: -1 }, image: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?q=80&w=600&auto=format&fit=crop' }
    ]
  },
  {
    id: 'q2',
    title: 'Em um destino novo...',
    options: [
      { id: 'classicos', label: 'Ver os clássicos imperdíveis', impact: { classic: 1 }, image: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?q=80&w=600&auto=format&fit=crop' },
      { id: 'fora_obvio', label: 'Descobrir lugares fora do óbvio', impact: { classic: -1 }, image: 'https://images.unsplash.com/photo-1518105779142-d975f22f1b0a?q=80&w=600&auto=format&fit=crop' }
    ]
  },
  {
    id: 'q3',
    title: 'O roteiro ideal...',
    options: [
      { id: 'planejado', label: 'Tem horários bem organizados', impact: { planned: 1 }, image: 'https://images.unsplash.com/photo-1506784365847-bbad939e9335?q=80&w=600&auto=format&fit=crop' },
      { id: 'improviso', label: 'Deixa espaço para improvisar', impact: { planned: -1 }, image: 'https://images.unsplash.com/photo-1511497584788-876760111969?q=80&w=600&auto=format&fit=crop' }
    ]
  },
  {
    id: 'q4',
    title: 'Na hora de gastar...',
    options: [
      { id: 'economiza', label: 'Economizo no básico', impact: { comfort: -1 }, image: 'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?q=80&w=600&auto=format&fit=crop' },
      { id: 'conforto', label: 'Prefiro mais conforto', impact: { comfort: 1 }, image: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?q=80&w=600&auto=format&fit=crop' }
    ]
  },
  {
    id: 'q5',
    title: 'O que mais marca uma viagem?',
    options: [
      { id: 'muitos', label: 'Conhecer muitos lugares', impact: { immersive: -1 }, image: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=600&auto=format&fit=crop' },
      { id: 'profundidade', label: 'Viver poucos momentos intensamente', impact: { immersive: 1 }, image: 'https://images.unsplash.com/photo-1513279922550-250c2129b13a?q=80&w=600&auto=format&fit=crop' }
    ]
  },
  {
    id: 'q6',
    title: 'Quando algo interessante aparece...',
    options: [
      { id: 'segue', label: 'Sigo o planejamento', impact: { planned: 1 }, image: 'https://images.unsplash.com/photo-1455390582262-044cdead27d8?q=80&w=600&auto=format&fit=crop' },
      { id: 'adapta', label: 'Adapto o dia na hora', impact: { planned: -1 }, image: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=600&auto=format&fit=crop' }
    ]
  }
];

const EXPERIENCES = [
  { id: 'turismo', title: 'Pontos turísticos', desc: 'Cartões-postais e ícones', icon: Camera },
  { id: 'restaurantes', title: 'Restaurantes', desc: 'Gastronomia famosa', icon: Utensils },
  { id: 'compras', title: 'Compras', desc: 'Lojas e shoppings', icon: ShoppingBag },
  { id: 'noite', title: 'Vida noturna', desc: 'Bares e baladas', icon: Wine },
  { id: 'cultura', title: 'Cultura', desc: 'História e tradição', icon: Landmark },
  { id: 'museus', title: 'Museus', desc: 'Arte e exposições', icon: Palette },
  { id: 'natureza', title: 'Natureza', desc: 'Ar livre e aventura', icon: Trees },
  { id: 'relaxar', title: 'Relaxar', desc: 'Sem pressa', icon: Sparkles },
  { id: 'praias', title: 'Praias', desc: 'Sol e mar', icon: Palmtree },
  { id: 'parques', title: 'Parques', desc: 'Passeios verdes', icon: Tent },
  { id: 'cafes', title: 'Cafés', desc: 'Pausas gostosas', icon: Coffee },
  { id: 'shows', title: 'Shows', desc: 'Música e espetáculos', icon: Ticket },
  { id: 'instagram', title: 'Lugares instagramáveis', desc: 'Fotos perfeitas', icon: Camera },
  { id: 'local', title: 'Experiências locais', desc: 'Fora da rota', icon: HeartHandshake }
];

const AVOIDS = [
  'Acordar muito cedo',
  'Filas longas',
  'Caminhadas extensas',
  'Muitos deslocamentos',
  'Lugares lotados',
  'Restaurantes caros',
  'Transporte público',
  'Atrações muito turísticas',
  'Agenda apertada',
  'Atividades noturnas'
];

export default function StepTravelStyle({ trip, destination, displayStepNumber, onSave, onNext, onPrev }: any) {
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Game state
  const [quizAnswers, setQuizAnswers] = useState<Record<string, any>>({});
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [showResult, setShowResult] = useState(trip?.preferences?.travel_profile ? true : false);

  // Profile Dimensions (range 0 to 100, where 50 is neutral)
  const [dimensions, setDimensions] = useState({
    classic: 50,
    pace: 50,
    planned: 50,
    comfort: 50,
    immersive: 50,
    ...trip?.preferences?.dimensions
  });

  // Budget state
  const currency = destination?.currency || 'USD';
  const [budgetType, setBudgetType] = useState(trip?.preferences?.budget_type || '');
  const [budgetValue, setBudgetValue] = useState<number | string>(trip?.preferences?.budget_value || '');

  // Priorities and avoids
  const [selectedExperiences, setSelectedExperiences] = useState<string[]>(() => {
    const saved = trip?.preferences?.selected_experiences || trip?.preferences?.priorities || [];
    return saved.filter((id: string) => EXPERIENCES.some(e => e.id === id)).slice(0, 5);
  });

  const [rankedPriorities, setRankedPriorities] = useState<string[]>(() => {
    const saved = trip?.preferences?.ranked_priorities || trip?.preferences?.priorities || [];
    return saved.filter((id: string) => EXPERIENCES.some(e => e.id === id)).slice(0, 3);
  });

  const [avoids, setAvoids] = useState<string[]>(trip?.preferences?.avoids || []);

  const handleAnswer = (questionId: string, option: any) => {
    const newAnswers = { ...quizAnswers, [questionId]: option };
    setQuizAnswers(newAnswers);

    if (currentQIndex < QUIZ_QUESTIONS.length - 1) {
      setCurrentQIndex(currentQIndex + 1);
    } else {
      calculateProfile(newAnswers);
      setShowResult(true);
    }
  };

  const calculateProfile = (answers: Record<string, any>) => {
    let dims = { classic: 50, pace: 50, planned: 50, comfort: 50, immersive: 50 };
    Object.values(answers).forEach((opt: any) => {
      if (opt.impact.classic) dims.classic += opt.impact.classic * 25;
      if (opt.impact.pace) dims.pace += opt.impact.pace * 25;
      if (opt.impact.planned) dims.planned += opt.impact.planned * 25;
      if (opt.impact.comfort) dims.comfort += opt.impact.comfort * 25;
      if (opt.impact.immersive) dims.immersive += opt.impact.immersive * 25;
    });
    // clamp
    Object.keys(dims).forEach(k => {
       const key = k as keyof typeof dims;
       if (dims[key] < 0) dims[key] = 0;
       if (dims[key] > 100) dims[key] = 100;
    });
    setDimensions(dims);
  };

  const getProfileName = () => {
    if (dimensions.pace > 60 && dimensions.classic > 60) return "Explorador Clássico";
    if (dimensions.immersive > 60 && dimensions.pace < 40) return "Contemplador Profundo";
    if (dimensions.comfort > 60 && dimensions.planned > 60) return "Estrategista de Conforto";
    if (dimensions.planned < 40 && dimensions.classic < 40) return "Aventureiro Espontâneo";
    return "Descobridor Equilibrado";
  };

  const toggleExperience = (item: string) => {
    setSelectedExperiences(prev => {
      if (prev.includes(item)) {
        // If unselected, also remove from ranked
        setRankedPriorities(rp => rp.filter(r => r !== item));
        return prev.filter(i => i !== item);
      }
      if (prev.length >= 5) return prev;

      const newSelected = [...prev, item];
      // Auto-add to ranked if there's space
      if (rankedPriorities.length < 3) {
        setRankedPriorities(rp => [...rp, item]);
      }
      return newSelected;
    });
  };

  const toggleRanking = (item: string) => {
    setRankedPriorities(prev => {
      if (prev.includes(item)) return prev.filter(i => i !== item);
      if (prev.length >= 3) return prev;
      return [...prev, item];
    });
  };

  const moveRanked = (index: number, direction: 'up' | 'down') => {
    setRankedPriorities(prev => {
      const newArr = [...prev];
      if (direction === 'up' && index > 0) {
        [newArr[index - 1], newArr[index]] = [newArr[index], newArr[index - 1]];
      } else if (direction === 'down' && index < prev.length - 1) {
        [newArr[index + 1], newArr[index]] = [newArr[index], newArr[index + 1]];
      }
      return newArr;
    });
  };

  const toggleAvoid = (item: string) => {
    setAvoids(prev => {
      if (prev.includes(item)) return prev.filter(i => i !== item);
      return [...prev, item];
    });
  };

  const handleSave = async () => {
    setErrorMsg(null);
    if (!budgetValue) {
      setErrorMsg("Defina o orçamento diário.");
      return;
    }
    if (selectedExperiences.length === 0) {
      setErrorMsg("Selecione ao menos uma experiência.");
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        preferences: {
          ...trip.preferences,
          travel_profile: getProfileName(),
          dimensions,
          budget_type: budgetType,
          budget_value: budgetValue,
          budget_currency: currency,
          selected_experiences: selectedExperiences,
          ranked_priorities: rankedPriorities,
          avoids
        }
      });
      await onNext();
    } catch (e) {
      console.error(e);
      setErrorMsg("Não foi possível salvar esta etapa. Tente novamente.");
    } finally {
      setIsSaving(false);
    }
  };

  const isValid = showResult && budgetValue && selectedExperiences.length > 0;

  if (!showResult) {
    const q = QUIZ_QUESTIONS[currentQIndex];
    return (
      <OnboardingShell
        trip={trip}
        destination={destination}
        stepNumber={displayStepNumber}
        heroTitle={<>Descubra seu<br/>jeito de viajar</>}
        heroSubtitle="Vamos jogar um jogo rápido de 6 perguntas para alinhar o roteiro com a sua energia."
        onBack={onPrev}
      >
        <div className="max-w-xl mx-auto py-12">
          <div className="flex justify-between items-center mb-8">
            <span className="text-sm font-bold text-slate-400">Pergunta {currentQIndex + 1} de 6</span>
            <div className="flex gap-2">
              {QUIZ_QUESTIONS.map((_, i) => (
                <div key={i} className={`h-2 rounded-full transition-all ${i === currentQIndex ? 'w-8 bg-lime-500' : i < currentQIndex ? 'w-2 bg-lime-200' : 'w-2 bg-slate-200'}`} />
              ))}
            </div>
          </div>
          <h2 className="text-2xl lg:text-3xl font-extrabold text-slate-800 mb-10 leading-tight">{q.title}</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[400px]">
            {q.options.map((opt) => (
               <button
                 key={opt.id}
                 onClick={() => handleAnswer(q.id, opt)}
                 className="relative group rounded-[24px] overflow-hidden border-4 border-transparent hover:border-[#D7F24B] transition-all shadow-md hover:shadow-xl hover:-translate-y-1"
               >
                 <img src={opt.image} alt={opt.label} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                 <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                 <div className="absolute bottom-0 left-0 p-6 w-full text-left">
                    <span className="font-extrabold text-2xl text-white leading-tight drop-shadow-md">{opt.label}</span>
                 </div>
               </button>
            ))}
          </div>
        </div>
      </OnboardingShell>
    );
  }

  const budgetPresets = [
    { id: 'Essencial', val: 50 },
    { id: 'Equilibrado', val: 100 },
    { id: 'Confortável', val: 200 },
    { id: 'Premium', val: 500 },
  ];

  return (
    <OnboardingShell
      trip={trip}
      destination={destination}
      stepNumber={displayStepNumber}
      heroTitle={<>Seu perfil<br/>está pronto</>}
      heroSubtitle="Baseado nas suas respostas, este é o seu estilo. Você pode ajustar o que quiser."
      onBack={onPrev}
      onContinue={handleSave}
      loading={isSaving}
    >
      <div className="space-y-16">

        {/* PERFIL */}
        <section className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm relative overflow-hidden">
           <div className="absolute top-0 right-0 w-64 h-64 bg-lime-100 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 opacity-50" />
           <div className="relative z-10">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">Seu perfil inicial</h3>
              <h2 className="text-3xl font-extrabold text-slate-800 mb-8">{getProfileName()}</h2>

              <div className="space-y-6">
                {[
                  { key: 'classic', left: 'Fora do óbvio', right: 'Clássicos' },
                  { key: 'pace', left: 'Ritmo leve', right: 'Ritmo intenso' },
                  { key: 'planned', left: 'Espontâneo', right: 'Planejado' },
                  { key: 'comfort', left: 'Essencial', right: 'Confortável' },
                  { key: 'immersive', left: 'Muitos lugares', right: 'Imersivo' }
                ].map(dim => (
                  <div key={dim.key}>
                    <div className="flex justify-between text-xs font-bold text-slate-500 mb-2">
                       <span>{dim.left}</span>
                       <span>{dim.right}</span>
                    </div>
                    <div className="relative h-2 bg-slate-100 rounded-full">
                       <input
                         type="range"
                         min="0" max="100"
                         value={dimensions[dim.key as keyof typeof dimensions]}
                         onChange={e => setDimensions({...dimensions, [dim.key]: parseInt(e.target.value)})}
                         className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                       />
                       <div
                         className="absolute top-0 left-0 h-full bg-lime-400 rounded-full transition-all pointer-events-none"
                         style={{ width: `${dimensions[dim.key as keyof typeof dimensions]}%` }}
                       />
                       <div
                         className="absolute top-1/2 -mt-2 w-4 h-4 bg-white border-2 border-lime-500 rounded-full pointer-events-none shadow-sm transition-all"
                         style={{ left: `calc(${dimensions[dim.key as keyof typeof dimensions]}% - 8px)` }}
                       />
                    </div>
                  </div>
                ))}
              </div>
           </div>
        </section>

        {/* ORÇAMENTO */}
        <section>
          <h3 className="text-2xl font-extrabold text-[#171717] mb-2">Quanto você pretende gastar por dia, por pessoa?</h3>
          <p className="text-slate-500 font-medium text-sm mb-6">Considere alimentação, transporte local, atrações e compras. Voo e hotel ficam fora deste valor.</p>

          <div className="bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm">
             <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
               {budgetPresets.map(b => (
                 <button
                   key={b.id}
                   onClick={() => {
                     setBudgetType(b.id);
                     setBudgetValue(b.val);
                   }}
                   className={`p-3 rounded-xl border-2 text-center transition-all ${budgetType === b.id ? 'border-lime-500 bg-lime-50/50' : 'border-slate-100 hover:border-slate-200'}`}
                 >
                   <p className={`text-xs font-bold mb-1 ${budgetType === b.id ? 'text-lime-700' : 'text-slate-500'}`}>{b.id}</p>
                   <p className="text-sm font-extrabold text-slate-800">{currency} {b.val}</p>
                 </button>
               ))}
             </div>
             <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Valor Personalizado ({currency})</label>
                <div className="relative max-w-xs">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">{currency}</span>
                  <Input
                    type="number"
                    value={budgetValue}
                    onChange={e => {
                      setBudgetValue(e.target.value);
                      setBudgetType('Personalizado');
                    }}
                    className="pl-14 h-14 bg-slate-50 border-slate-200 rounded-xl text-lg font-bold"
                  />
                </div>
                {currency !== 'BRL' && budgetValue && !isNaN(Number(budgetValue)) && (
                   <p className="text-xs text-slate-500 font-medium mt-2">
                     ≈ R$ {Math.round(Number(budgetValue) * 5.5).toLocaleString('pt-BR')} por dia (Conversão aproximada, atualizada hoje)
                   </p>
                )}
             </div>
          </div>
        </section>

        {/* PRIORIDADES (SUBSTITUINDO PÓDIO) */}
        <section>
          <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
             <div>
               <h3 className="text-2xl font-extrabold text-[#171717] mb-2">O que você realmente quer viver nesta viagem?</h3>
               <p className="text-slate-500 font-medium text-sm">Escolha até 5 experiências.</p>
             </div>
             <div className="bg-slate-100 text-slate-600 font-bold text-xs px-3 py-1.5 rounded-full inline-flex w-fit">
               {selectedExperiences.length} de 5 escolhidas
             </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-12">
            {EXPERIENCES.map(exp => {
              const idx = selectedExperiences.indexOf(exp.id);
              const isSelected = idx !== -1;
              const isDisabled = !isSelected && selectedExperiences.length >= 5;

              return (
                <button
                  key={exp.id}
                  onClick={() => toggleExperience(exp.id)}
                  disabled={isDisabled}
                  className={`p-4 rounded-[20px] border-2 transition-all flex flex-col items-center text-center h-36 ${isSelected ? 'bg-lime-50 border-lime-500 shadow-sm relative' : isDisabled ? 'opacity-50 cursor-not-allowed bg-slate-50 border-slate-200' : 'bg-white border-slate-100 hover:border-lime-300 hover:shadow-md'}`}
                >
                  {isSelected && (
                    <div className="absolute top-2 right-2 w-5 h-5 bg-lime-500 rounded-full flex items-center justify-center shadow-sm">
                       <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                  <div className={`w-12 h-12 rounded-full mb-3 flex items-center justify-center transition-colors ${isSelected ? 'bg-lime-200/50' : 'bg-slate-100'}`}>
                     <exp.icon className={`w-6 h-6 ${isSelected ? 'text-lime-700' : 'text-slate-500'}`} />
                  </div>
                  <span className={`text-sm font-extrabold leading-tight ${isSelected ? 'text-slate-900' : 'text-slate-700'}`}>
                    {exp.title}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 mt-1 line-clamp-1">{exp.desc}</span>
                </button>
              )
            })}
          </div>

          {/* LISTA DE PRIORIDADES E RANKING */}
          {selectedExperiences.length > 0 && (
            <div className="bg-slate-900 p-8 rounded-[32px] mb-12 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-64 h-64 bg-lime-500 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 opacity-20" />
               <div className="relative z-10">
                 <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
                   <div>
                     <h3 className="text-xl font-extrabold text-white mb-2">Agora defina seu Top 3</h3>
                     <p className="text-slate-400 font-medium text-sm">Selecione até 3 e use as setas para ordenar a importância.</p>
                   </div>
                   <div className="bg-slate-800 text-slate-300 font-bold text-xs px-3 py-1.5 rounded-full inline-flex border border-slate-700 w-fit">
                     {rankedPriorities.length} de 3 ranqueadas
                   </div>
                 </div>

                 <div className="space-y-3">
                   {selectedExperiences.map(pid => {
                     const exp = EXPERIENCES.find(e => e.id === pid);
                     if (!exp) return null;

                     const rankIdx = rankedPriorities.indexOf(pid);
                     const isRanked = rankIdx !== -1;
                     const isRankDisabled = !isRanked && rankedPriorities.length >= 3;

                     return (
                       <div key={pid} className={`flex items-center gap-4 p-4 rounded-2xl border transition-colors ${isRanked ? 'bg-slate-800 border-lime-500/50' : 'bg-slate-800/50 border-slate-700/50'}`}>
                         <button
                           onClick={() => toggleRanking(pid)}
                           disabled={isRankDisabled}
                           className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center border transition-all ${isRanked ? 'bg-lime-500 border-lime-600 text-slate-900 shadow-sm' : isRankDisabled ? 'bg-slate-800 border-slate-700 text-slate-600 opacity-50 cursor-not-allowed' : 'bg-slate-800 border-slate-600 text-slate-400 hover:border-slate-500 hover:text-white'}`}
                         >
                            {isRanked ? <span className="font-extrabold text-lg">{rankIdx + 1}º</span> : <Star className="w-5 h-5" />}
                         </button>
                         <div className="flex-1 flex items-center gap-3 min-w-0">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isRanked ? 'bg-lime-500/20 text-lime-400' : 'bg-slate-700 text-slate-400'}`}>
                               <exp.icon className="w-4 h-4" />
                            </div>
                            <div className="truncate">
                               <p className={`font-bold truncate ${isRanked ? 'text-white' : 'text-slate-300'}`}>{exp.title}</p>
                               <p className="text-xs text-slate-400 truncate">{exp.desc}</p>
                            </div>
                         </div>
                         {isRanked && (
                           <div className="flex flex-col gap-1 shrink-0">
                             <button
                               onClick={() => moveRanked(rankIdx, 'up')}
                               disabled={rankIdx === 0}
                               className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-700 text-slate-300 hover:bg-slate-600 disabled:opacity-30 disabled:hover:bg-slate-700 transition-colors"
                             >
                               <ChevronUp className="w-5 h-5" />
                             </button>
                             <button
                               onClick={() => moveRanked(rankIdx, 'down')}
                               disabled={rankIdx === rankedPriorities.length - 1}
                               className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-700 text-slate-300 hover:bg-slate-600 disabled:opacity-30 disabled:hover:bg-slate-700 transition-colors"
                             >
                               <ChevronDown className="w-5 h-5" />
                             </button>
                           </div>
                         )}
                       </div>
                     );
                   })}
                 </div>
               </div>
            </div>
          )}

          <h3 className="text-2xl font-extrabold text-[#171717] mb-2">O que você prefere evitar?</h3>
          <p className="text-slate-500 font-medium text-sm mb-6">Marque o que te incomoda em viagens.</p>

          <div className="flex flex-wrap gap-2">
            {AVOIDS.map(av => {
              const isSelected = avoids.includes(av);
              return (
                <button
                  key={av}
                  onClick={() => toggleAvoid(av)}
                  className={`px-4 py-2 rounded-full border-2 transition-all text-sm font-bold ${isSelected ? 'bg-red-50 border-red-500 text-red-700 shadow-sm' : 'bg-white border-slate-200 text-slate-600 hover:border-red-200'}`}
                >
                  {isSelected && <span className="mr-1 text-red-500">✕</span>} {av}
                </button>
              )
            })}
          </div>
        </section>

        {errorMsg && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-200 font-bold mt-8 animate-in fade-in">
            {errorMsg}
          </div>
        )}
      </div>
    </OnboardingShell>
  );
}
