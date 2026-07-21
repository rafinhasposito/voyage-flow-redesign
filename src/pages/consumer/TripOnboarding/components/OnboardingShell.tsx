import React, { ReactNode } from 'react';
import { ArrowLeft, ArrowRight, Loader2, Plane, Lock, MapPin, Calendar, User, Compass } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format, parseISO, differenceInDays } from 'date-fns';

interface OnboardingShellProps {
  trip?: any;
  destination?: any;
  stepNumber: number;
  totalSteps?: number;
  heroImage?: string;
  heroTitle: ReactNode;
  heroSubtitle: ReactNode;
  sidebarTitle?: string;
  onBack?: () => void;
  onContinue?: () => void;
  continueLabel?: string;
  loading?: boolean;
  disabled?: boolean;
  children: ReactNode;
}

export default function OnboardingShell({
  trip,
  destination,
  stepNumber,
  totalSteps = 5,
  heroImage,
  heroTitle,
  heroSubtitle,
  sidebarTitle = "Resumo da viagem",
  onBack,
  onContinue,
  continueLabel = "Continuar",
  loading = false,
  disabled = false,
  children
}: OnboardingShellProps) {
  
  const startDate = trip?.start_date;
  const endDate = trip?.end_date;
  
  let nightsCount = 0;
  if (startDate && endDate) {
    const s = new Date(startDate);
    const e = new Date(endDate);
    if (!isNaN(s.getTime()) && !isNaN(e.getTime())) {
      const utc1 = Date.UTC(s.getFullYear(), s.getMonth(), s.getDate());
      const utc2 = Date.UTC(e.getFullYear(), e.getMonth(), e.getDate());
      nightsCount = Math.floor((utc2 - utc1) / (1000 * 60 * 60 * 24));
    }
  }
  const companionship = trip?.companionship;
  const startMode = trip?.preferences?.startMode;

  const coverImageUrl = heroImage || destination?.cover_image_url || "/hero-ny.webp";

  return (
    <div className="relative w-full min-h-screen bg-[#FDFCF8] text-[#171717] font-sans pb-32 lg:pb-12">
      
      {/* HEADER DE NAVEGAÇÃO SUPERIOR */}
      {onBack && (
        <header className="absolute top-0 w-full z-50 px-6 py-6 flex items-center justify-between pointer-events-none">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onBack}
            data-testid="onboarding-back"
            className="rounded-full bg-white/20 backdrop-blur-md hover:bg-white/40 text-white pointer-events-auto border border-white/10 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </header>
      )}

      {/* HERO SECTION */}
      <div className="relative w-full h-[400px] lg:h-[480px]">
        <img 
          src={coverImageUrl} 
          onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&q=80&w=1440' }}
          className="absolute inset-0 w-full h-full object-cover object-center saturate-110 contrast-110 brightness-90" 
          alt="Destino" 
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-transparent" />
        
        <div className="relative z-10 h-full flex flex-col justify-center px-6 lg:px-12 max-w-7xl mx-auto w-full text-white pt-10">
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <div className="flex items-center gap-2 px-4 py-1.5 bg-white/10 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-widest border border-white/20 shadow-sm">
               <Plane className="w-3 h-3" /> Nova Viagem
            </div>
            <div className="flex items-center gap-2 text-sm font-bold bg-black/40 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10 shadow-sm">
              <span className="text-white">Etapa {stepNumber} de {totalSteps}</span>
              <div className="flex gap-1.5 ml-1">
                {Array.from({ length: totalSteps }).map((_, i) => (
                   <div key={i} className={`w-1.5 h-1.5 rounded-full ${i === (stepNumber - 1) ? 'bg-[#D7F24B] shadow-[0_0_8px_#D7F24B]' : 'bg-white/30'}`}></div>
                ))}
              </div>
            </div>
          </div>
          
          <h1 className="text-4xl lg:text-[56px] font-extrabold leading-[1.1] mb-4 tracking-tight drop-shadow-lg text-white max-w-xl">
            {heroTitle}
          </h1>
          <p className="text-lg text-white/90 font-medium max-w-lg drop-shadow-md leading-relaxed">
            {heroSubtitle}
          </p>
        </div>
      </div>

      {/* OVERLAP CONTAINER COM CURVATURA */}
      <div className="relative z-20 w-full bg-[#FDFCF8] rounded-t-[40px] -mt-10 lg:-mt-16 pt-10 pb-10">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 flex flex-col lg:flex-row gap-8 lg:gap-10">
          
          {/* COLUNA ESQUERDA - CONTEÚDO (Children) */}
          <div className="flex-1 space-y-14 min-w-0">
            {children}

            {/* AÇÕES (Mobile & Desktop Flow) */}
            {onContinue && (
              <div className="flex items-center justify-between pt-8 border-t border-slate-200">
                 {onBack ? (
                   <button onClick={onBack} data-testid="onboarding-back-bottom" className="flex items-center gap-2 px-6 py-3 rounded-full text-slate-500 font-bold hover:bg-slate-100 transition-colors">
                     <ArrowLeft className="w-4 h-4" /> Voltar
                   </button>
                 ) : <div></div>}
                 
                 <Button 
                   onClick={onContinue} 
                   disabled={loading || disabled}
                   data-testid="onboarding-continue"
                   className="h-12 lg:h-14 px-8 rounded-full bg-[#D7F24B] hover:bg-[#c5e62b] text-[#171717] text-base font-extrabold shadow-lg shadow-[#D7F24B]/20 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 hidden lg:flex items-center gap-2"
                 >
                   {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : <>{continueLabel} <ArrowRight className="w-4 h-4" /></>}
                 </Button>
              </div>
            )}
          </div>

          {/* COLUNA DIREITA - SIDEBAR DE RESUMO */}
          <div className="w-full lg:w-[380px] shrink-0 relative z-30">
            <div className="sticky top-8 bg-white rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-6 lg:p-8">
               <h2 className="text-xl font-extrabold text-[#171717] mb-6">{sidebarTitle}</h2>
               
               {/* Imagem Cover */}
               <div className="w-full h-[220px] rounded-[24px] overflow-hidden mb-8 bg-slate-100 relative">
                 {destination?.cover_image_url ? (
                    <img src={destination.cover_image_url} className="w-full h-full object-cover transition-transform duration-1000 hover:scale-105" alt="Cover" />
                 ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 font-medium bg-slate-50 border-2 border-dashed border-slate-200">
                      <MapPin className="w-8 h-8 mb-2 opacity-50" />
                      Sem destino
                    </div>
                 )}
               </div>

               {/* Informações */}
               <div className="space-y-5">
                  <div className="flex gap-4 items-start">
                     <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100">
                       <MapPin className="w-5 h-5 text-slate-600" />
                     </div>
                     <div>
                       <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mb-0.5">Destino</p>
                       <p className="font-extrabold text-sm text-[#171717]">{destination ? `${destination.name}, ${destination.country}` : 'Não selecionado'}</p>
                     </div>
                  </div>
                  
                  <hr className="border-slate-100" />
                  
                  <div className="flex gap-4 items-start">
                     <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100">
                       <Calendar className="w-5 h-5 text-slate-600" />
                     </div>
                     <div>
                       <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mb-0.5">Período</p>
                       <p className="font-extrabold text-sm text-[#171717]">
                         {startDate && endDate 
                           ? `${format(parseISO(startDate), 'dd/MM/yyyy')} até ${format(parseISO(endDate), 'dd/MM/yyyy')}` 
                           : 'Não selecionado'}
                       </p>
                       {nightsCount > 0 && <span className="inline-block mt-1.5 px-3 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wider rounded-full">{nightsCount} noites</span>}
                     </div>
                  </div>

                  <hr className="border-slate-100" />
                  
                  <div className="flex gap-4 items-start">
                     <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100">
                       <User className="w-5 h-5 text-slate-600" />
                     </div>
                     <div>
                       <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mb-0.5">Viajantes</p>
                       <p className="font-extrabold text-sm text-[#171717]">{companionship || 'Não selecionado'}</p>
                     </div>
                  </div>

                  <hr className="border-slate-100" />
                  
                  <div className="flex gap-4 items-start">
                     <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100">
                       <Compass className="w-5 h-5 text-slate-600" />
                     </div>
                     <div>
                       <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mb-0.5">Modo inicial</p>
                       <p className="font-extrabold text-sm text-[#171717]">
                         {startMode === "zero" ? "Planejar do zero" : startMode === "reservas" ? "Já tenho reservas" : 'Não selecionado'}
                       </p>
                     </div>
                  </div>
               </div>

               {/* CTA MOBILE: Only show on mobile inside the sidebar, on desktop it's in the left column bottom */}
               {onContinue && (
                 <Button 
                   onClick={onContinue} 
                   disabled={loading || disabled}
                   data-testid="onboarding-continue-mobile"
                   className="w-full mt-8 bg-[#D7F24B] hover:bg-[#c5e62b] text-[#171717] rounded-full h-[52px] text-base font-extrabold shadow-lg shadow-[#D7F24B]/20 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 flex lg:hidden items-center justify-center gap-2"
                 >
                   {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>{continueLabel} <ArrowRight className="w-4 h-4 ml-1" /></>}
                 </Button>
               )}

               <div className="mt-5 flex items-start justify-center gap-2 text-center text-[10px] font-semibold text-slate-400 max-w-[240px] mx-auto leading-relaxed">
                  <Lock className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <p>Suas informações estão seguras e serão usadas apenas para sua viagem.</p>
               </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
