import React from 'react';
import { Loader2, Sparkles, Navigation, Calendar, Users, Wallet, Target, Heart, Briefcase, MapPin, CheckCircle2 } from 'lucide-react';
import OnboardingShell from './OnboardingShell';

export default function StepDNA({
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
  const [loading, setLoading] = React.useState(false);

  const handleCreateItinerary = async () => {
    setLoading(true);
    try {
      await onNext();
    } finally {
      setLoading(false);
    }
  };

  // Mocked counts for summary until real wallet is fully injected
  const matchVotes = trip?.preferences?.match_votes || {};
  const lovedCount = Object.values(matchVotes).filter(v => v === 'yes' || v === 'LOVE').length;
  const boughtCount = Object.values(matchVotes).filter(v => v === 'bought' || v === 'PURCHASED').length;

  return (
    <OnboardingShell
      trip={trip}
      destination={destination}
      stepNumber={displayStepNumber}
      totalSteps={5}
      heroTitle={<>DNA da<br/>Viagem</>}
      heroSubtitle="Nossa inteligência artificial mapeou o seu perfil. Tudo pronto para gerar."
      onBack={onPrev}
      onContinue={handleCreateItinerary}
      continueLabel="Criar meu roteiro"
      loading={loading}
    >
      <div className="space-y-8">
        
        {/* Mensagem central */}
        <div className="bg-gradient-to-br from-[#171717] to-slate-900 rounded-[32px] p-8 lg:p-10 text-white relative overflow-hidden shadow-xl shadow-slate-900/20 border border-slate-800">
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#D7F24B] opacity-10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="relative z-10">
            <Sparkles className="w-8 h-8 text-[#D7F24B] mb-6" />
            <h2 className="text-3xl lg:text-4xl font-extrabold leading-tight mb-4 text-white drop-shadow-sm">
              O Voyage Flow<br/>entendeu esta viagem.
            </h2>
            <p className="text-lg text-slate-300 font-medium max-w-lg leading-relaxed">
              Vamos equilibrar <span className="text-white font-bold">{trip.preferences?.pace || 'seu ritmo'}</span> com <span className="text-white font-bold">{trip.preferences?.must_have?.[0] || 'suas prioridades'}</span>, respeitando seu orçamento <span className="text-white font-bold">{trip.preferences?.budget || 'definido'}</span>.
            </p>
          </div>
        </div>

        {/* Pilares */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          <div className="bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                <Navigation className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-lg text-slate-800">Básicos</h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-500 flex items-center gap-2"><MapPin className="w-4 h-4"/> Destino</span>
                <span className="text-sm font-extrabold text-slate-800">{destination?.name || 'Definido'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-500 flex items-center gap-2"><Calendar className="w-4 h-4"/> Período</span>
                <span className="text-sm font-extrabold text-slate-800">{trip.start_date} a {trip.end_date}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-500 flex items-center gap-2"><Users className="w-4 h-4"/> Viajantes</span>
                <span className="text-sm font-extrabold text-slate-800 capitalize">{trip.companionship}</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center">
                <Target className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-lg text-slate-800">Seu Jeito</h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-500 flex items-center gap-2"><Navigation className="w-4 h-4"/> Estilo</span>
                <span className="text-sm font-extrabold text-slate-800 capitalize">{trip.preferences?.style || 'Padrão'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-500 flex items-center gap-2"><Target className="w-4 h-4"/> Ritmo</span>
                <span className="text-sm font-extrabold text-slate-800 capitalize">{trip.preferences?.pace || 'Equilibrado'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-500 flex items-center gap-2"><Wallet className="w-4 h-4"/> Orçamento</span>
                <span className="text-sm font-extrabold text-slate-800 capitalize">{trip.preferences?.budget || 'Confortável'}</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-pink-50 text-pink-600 flex items-center justify-center">
                <Heart className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-lg text-slate-800">Preferências</h3>
            </div>
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {trip.preferences?.must_have?.map((m: string) => (
                  <span key={m} className="px-3 py-1.5 bg-slate-100 text-slate-700 text-xs font-bold uppercase tracking-wider rounded-full">
                    {m}
                  </span>
                )) || <span className="text-sm text-slate-500">Sem prioridades marcadas</span>}
              </div>
              <div className="pt-4 mt-2 border-t border-slate-100 flex justify-between items-center">
                <span className="text-sm font-bold text-slate-500">Match Positivo</span>
                <span className="text-sm font-extrabold text-pink-600">{lovedCount} experiências</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-lime-50 text-lime-600 flex items-center justify-center">
                <Briefcase className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-lg text-slate-800">Sua Carteira</h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-500 flex items-center gap-2"><CheckCircle2 className="w-4 h-4"/> Compromissos Fixos</span>
                <span className="text-sm font-extrabold text-lime-600">{boughtCount} ingressos</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-500 flex items-center gap-2"><Briefcase className="w-4 h-4"/> Voos & Hotéis</span>
                <span className="text-sm font-extrabold text-slate-800">
                  {trip.preferences?.startMode === 'reservas' ? 'Definidos' : 'A definir'}
                </span>
              </div>
            </div>
          </div>
          
        </div>

      </div>
    </OnboardingShell>
  );
}
