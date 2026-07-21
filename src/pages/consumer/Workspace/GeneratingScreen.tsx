import React from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import OnboardingShell from '../TripOnboarding/components/OnboardingShell';

export function GeneratingScreen({ trip, destination }: { trip: any, destination: any }) {
  return (
    <OnboardingShell
      trip={trip}
      destination={destination}
      stepNumber={5}
      totalSteps={5}
      heroTitle={<>Gerando<br/>Roteiro</>}
      heroSubtitle="Nossa inteligência está montando seus dias."
      onBack={() => {}}
      loading={true}
    >
      <div className="max-w-md mx-auto py-12">
        <div className="bg-white rounded-[32px] p-8 border border-slate-200 shadow-xl shadow-slate-200/50 relative overflow-hidden text-center">
          <div className="absolute top-0 right-0 w-32 h-32 bg-lime-100 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          
          <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-6 relative z-10">
             <Sparkles className="w-8 h-8 text-lime-400 animate-pulse" />
          </div>

          <h3 className="text-xl font-extrabold text-slate-800 mb-2 relative z-10">
             Estamos criando seu roteiro
          </h3>
          <p className="text-sm text-slate-500 font-medium mb-8 relative z-10">
             Cruzando suas preferências com o DNA do destino...
          </p>

          <div className="flex justify-center relative z-10 h-8">
             <Loader2 className="w-8 h-8 text-lime-500 animate-spin" />
          </div>
        </div>
      </div>
    </OnboardingShell>
  );
}
