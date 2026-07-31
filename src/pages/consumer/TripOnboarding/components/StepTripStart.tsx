import React, { useState, useEffect } from 'react';
import { Sparkles, Briefcase, ChevronRight, Check, Loader2, Lightbulb } from 'lucide-react';
import { DestinationRepository, DestinationRow } from '@/repositories/DestinationRepository';
import TripPeriodCard from './TripPeriodCard';

interface StepTripStartProps {
  initialData?: any;
  onDestinationSelect?: (dest: DestinationRow | null) => void;
  onChange?: (data: any) => void;
  error?: string | null;
}

export default function StepTripStart({ initialData, onDestinationSelect, onChange, error }: StepTripStartProps) {
  const [destinations, setDestinations] = useState<DestinationRow[]>([]);
  const [isLoadingDestinations, setIsLoadingDestinations] = useState(true);

  // Form State
  const [selectedDestinationId, setSelectedDestinationId] = useState<string>(initialData?.destination || '');
  const [selectedDestination, setSelectedDestination] = useState<DestinationRow | null>(null);
  const [startDate, setStartDate] = useState<string>(initialData?.start_date || '');
  const [endDate, setEndDate] = useState<string>(initialData?.end_date || '');
  const [companionship, setCompanionship] = useState<string>(initialData?.companionship || '');
  const [budgetLevel, setBudgetLevel] = useState<string>(initialData?.budget_level || '');
  const [startMode, setStartMode] = useState<string>(initialData?.preferences?.startMode || '');

  useEffect(() => {
    DestinationRepository.sync((dests) => {
      const active = dests.filter(d => d.is_active);
      setDestinations(active);
      setIsLoadingDestinations(false);
      
      if (selectedDestinationId) {
        const found = active.find(d => d.id === selectedDestinationId);
        if (found) {
          setSelectedDestination(found);
          if (onDestinationSelect) onDestinationSelect(found);
        }
      }
    });
  }, []);

  useEffect(() => {
    if (selectedDestinationId && destinations.length > 0) {
      const found = destinations.find(d => d.id === selectedDestinationId);
      if (found) {
        setSelectedDestination(found);
        if (onDestinationSelect) onDestinationSelect(found);
      }
    }
  }, [selectedDestinationId, destinations]);

  // Notify parent of changes
  useEffect(() => {
    if (onChange) {
      onChange({
        destination: selectedDestinationId,
        start_date: startDate,
        end_date: endDate,
        companionship,
        budget_level: budgetLevel,
        currency: 'USD',
        preferences: { startMode }
      });
    }
  }, [selectedDestinationId, startDate, endDate, companionship, budgetLevel, startMode]);

  const handleStartDateChange = (val: string) => {
    if (!val) { setStartDate(''); return; }
    // Ensure we store it as a stable YYYY-MM-DD to avoid timezone shifting
    const dateOnly = val.split('T')[0];
    setStartDate(dateOnly);
    
    // Auto-adjust end date if it becomes invalid
    if (endDate) {
       const endOnly = endDate.split('T')[0];
       if (endOnly <= dateOnly) {
         setEndDate('');
       }
    }
  };

  const handleEndDateChange = (val: string) => {
    if (!val) { setEndDate(''); return; }
    const dateOnly = val.split('T')[0];
    const startOnly = startDate ? startDate.split('T')[0] : '';
    
    if (startOnly && dateOnly <= startOnly) {
       // Ignore invalid date
       return;
    }
    setEndDate(dateOnly);
  };

  const calculatedNights = React.useMemo(() => {
    if (!startDate || !endDate) return null;
    const s = new Date(startDate);
    const e = new Date(endDate);
    if (isNaN(s.getTime()) || isNaN(e.getTime())) return null;
    
    // Use UTC to calculate exactly the difference in days regardless of local timezone DST
    const utc1 = Date.UTC(s.getFullYear(), s.getMonth(), s.getDate());
    const utc2 = Date.UTC(e.getFullYear(), e.getMonth(), e.getDate());
    const diff = Math.floor((utc2 - utc1) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : null;
  }, [startDate, endDate]);

  const startModeOptions = [
    { id: 'zero', title: 'Planejar do zero', desc: 'Ainda não tenho nada comprado', icon: Sparkles },
    { id: 'reservas', title: 'Já tenho reservas', desc: 'Quero organizar voo, hotel, etc', icon: Briefcase }
  ];

  const companionshipOptions = [
    { id: 'Só eu',   emoji: '🧍', label: 'Solo',    desc: 'Aventura solo, total liberdade' },
    { id: 'Casal',   emoji: '👫', label: 'Casal',   desc: 'A dois, romance e cumplicidade' },
    { id: 'Família', emoji: '👨‍👩‍👧‍👦', label: 'Família', desc: 'Diversão para todas as idades' },
    { id: 'Amigos',  emoji: '👥', label: 'Amigos',  desc: 'Grupo unido, energia total' },
  ];

  const budgetOptions = [
    { id: 'budget',   emoji: '🎒', label: 'Econômico',   desc: 'Aproveitar muito gastando pouco' },
    { id: 'moderate', emoji: '✈️', label: 'Equilibrado',  desc: 'Conforto sem exageros' },
    { id: 'luxury',   emoji: '🏆', label: 'Premium',      desc: 'O melhor de cada experiência' },
  ];

  if (isLoadingDestinations) {
    return <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-lime-500" /></div>;
  }

  return (
    <div className="space-y-14">
      {/* 1. MODO DE ENTRADA */}
      <section>
        <h2 className="text-2xl font-extrabold text-[#171717] mb-6">Como sua próxima viagem começa?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {startModeOptions.map(opt => {
            const isSelected = startMode === opt.id;
            const Icon = opt.icon;
            return (
              <button
                key={opt.id}
                onClick={() => setStartMode(opt.id)}
                className={`relative flex items-center gap-4 p-5 rounded-[24px] border-2 transition-all duration-300 text-left ${isSelected ? 'border-[#D7F24B] bg-lime-50/50 shadow-md ring-4 ring-[#D7F24B]/10' : 'border-slate-100 bg-white hover:border-slate-200 hover:-translate-y-0.5 shadow-sm'}`}
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${isSelected ? 'bg-white shadow-sm' : 'bg-slate-50 border border-slate-100'}`}>
                  <Icon className={`w-6 h-6 ${isSelected ? 'text-[#171717]' : 'text-slate-400'}`} />
                </div>
                <div className="flex-1">
                  <h3 className="font-extrabold text-[#171717] text-lg leading-tight mb-1">{opt.title}</h3>
                  <p className="text-xs text-slate-500 font-medium">{opt.desc}</p>
                </div>
                {isSelected && (
                  <div className="absolute top-3 right-3 bg-[#D7F24B] w-6 h-6 rounded-full flex items-center justify-center animate-in zoom-in">
                    <Check className="w-3.5 h-3.5 text-[#171717]" />
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </section>

      {/* 2. DESTINO */}
      <section>
        <h2 className="text-2xl font-extrabold text-[#171717] mb-6">Para onde você quer ir?</h2>
        <div className="flex overflow-x-auto pb-4 -mx-6 px-6 lg:mx-0 lg:px-0 lg:overflow-visible lg:grid lg:grid-cols-4 gap-4 snap-x">
          {destinations.slice(0, 4).map(dest => {
            const isSelected = selectedDestinationId === dest.id;
            return (
              <button
                key={dest.id}
                onClick={() => setSelectedDestinationId(dest.id)}
                className={`relative shrink-0 snap-start w-[200px] lg:w-full flex flex-col p-2.5 rounded-[20px] border-2 transition-all duration-300 text-left ${isSelected ? 'border-[#D7F24B] bg-white shadow-lg scale-[1.02]' : 'border-slate-100 bg-white hover:border-slate-200'}`}
              >
                <div className="w-full h-[120px] rounded-[14px] overflow-hidden mb-3 relative">
                  <img src={dest.cover_image_url || ''} className="w-full h-full object-cover" alt={dest.name} />
                  <div className="absolute inset-0 bg-black/10"></div>
                  {isSelected && (
                    <div className="absolute top-2 right-2 bg-[#D7F24B] w-7 h-7 rounded-full flex items-center justify-center animate-in zoom-in shadow-sm">
                      <Check className="w-4 h-4 text-[#171717]" />
                    </div>
                  )}
                  {dest.is_active && !isSelected && (
                    <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-widest text-[#171717] shadow-sm">
                      Popular
                    </div>
                  )}
                </div>
                <h3 className="font-bold text-[#171717] text-base mb-0.5 px-1">{dest.name}</h3>
                <p className="text-xs text-slate-500 font-medium px-1 pb-1">{dest.country}</p>
              </button>
            )
          })}
        </div>
        <button className="flex items-center gap-2 text-sm font-bold text-slate-500 mt-4 hover:text-slate-900 transition-colors">
          Ver todos os destinos <ChevronRight className="w-4 h-4" />
        </button>
      </section>

      {/* 3. DATAS */}
      <section>
        <h2 className="text-2xl font-extrabold text-[#171717] mb-6">Quando vai ser sua viagem?</h2>
        <TripPeriodCard 
          startDate={startDate}
          endDate={endDate}
          destinationName={selectedDestination?.name || ''}
          calculatedNights={calculatedNights}
          onStartDateChange={handleStartDateChange}
          onEndDateChange={handleEndDateChange}
        />
      </section>

      {/* 4. QUEM EMBARCA COM VOCÊ? */}
      <section>
        <h2 className="text-2xl font-extrabold text-[#171717] mb-6">Com quem você vai?</h2>
        <div className="grid grid-cols-2 gap-3">
          {companionshipOptions.map(opt => {
            const isSelected = companionship === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => setCompanionship(opt.id)}
                className={`relative flex items-center gap-3 p-4 rounded-[20px] border-2 transition-all duration-300 text-left ${isSelected ? 'border-[#D7F24B] bg-lime-50/50 shadow-sm' : 'border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50'}`}
              >
                {isSelected && (
                  <div className="absolute top-2 right-2 bg-[#D7F24B] w-5 h-5 rounded-full flex items-center justify-center animate-in zoom-in">
                    <Check className="w-3 h-3 text-[#171717]" />
                  </div>
                )}
                <span className="text-2xl shrink-0">{opt.emoji}</span>
                <div>
                  <p className={`font-bold text-sm leading-tight ${isSelected ? 'text-[#171717]' : 'text-slate-700'}`}>{opt.label}</p>
                  <p className="text-[11px] text-slate-400 font-medium mt-0.5 leading-snug">{opt.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* 5. ORÇAMENTO */}
      <section>
        <h2 className="text-2xl font-extrabold text-[#171717] mb-6">Qual é o seu estilo de gasto?</h2>
        <div className="grid grid-cols-3 gap-3">
          {budgetOptions.map(opt => {
            const isSelected = budgetLevel === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => setBudgetLevel(opt.id)}
                className={`relative flex flex-col items-center text-center p-4 lg:p-5 rounded-[20px] border-2 transition-all duration-300 ${isSelected ? 'border-[#D7F24B] bg-lime-50/50 shadow-sm' : 'border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50'}`}
              >
                {isSelected && (
                  <div className="absolute top-2 right-2 bg-[#D7F24B] w-5 h-5 rounded-full flex items-center justify-center animate-in zoom-in">
                    <Check className="w-3 h-3 text-[#171717]" />
                  </div>
                )}
                <span className="text-3xl mb-2">{opt.emoji}</span>
                <p className={`font-bold text-sm leading-tight ${isSelected ? 'text-[#171717]' : 'text-slate-700'}`}>{opt.label}</p>
                <p className="text-[11px] text-slate-400 font-medium mt-1 leading-snug">{opt.desc}</p>
              </button>
            );
          })}
        </div>
      </section>

      {error && <p className="text-red-500 text-sm font-bold bg-red-50 p-4 rounded-xl">{error}</p>}

      {/* 5. DICA */}
      <div className="bg-amber-50 border border-amber-100 rounded-[20px] p-5 flex items-start gap-4">
        <div className="bg-amber-100 rounded-full p-2 shrink-0">
          <Lightbulb className="w-6 h-6 text-amber-600" />
        </div>
        <div>
          <h4 className="font-bold text-amber-900 text-sm mb-1">Dica Voyage Flow</h4>
          <p className="text-xs text-amber-700/80 leading-relaxed font-medium">Você poderá ajustar todos os detalhes, adicionar preferências e personalizar cada etapa do roteiro nas próximas fases do planejamento.</p>
        </div>
      </div>
    </div>
  );
}
