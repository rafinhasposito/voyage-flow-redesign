import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useConsumerAuth } from "@/contexts/ConsumerAuthProvider";
import { ArrowLeft, Loader2, MapPin, Calendar, Users, PlaneTakeoff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TripRepository } from "@/repositories/TripRepository";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function NewTrip() {
  const { user, isLoading } = useConsumerAuth();
  const navigate = useNavigate();
  
  const [destination, setDestination] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [travelers, setTravelers] = useState<number>(1);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<{ field?: string, message: string } | null>(null);

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/login");
    }
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-[#FDFCF8]">Carregando Sessão...</div>;
  }

  if (!user) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!destination.trim()) {
      setError({ field: 'destination', message: 'Para onde você vai?' });
      return;
    }
    if (!startDate) {
      setError({ field: 'startDate', message: 'Quando você pretende ir?' });
      return;
    }
    if (!endDate) {
      setError({ field: 'endDate', message: 'Quando você pretende voltar?' });
      return;
    }
    if (new Date(endDate) < new Date(startDate)) {
      setError({ field: 'endDate', message: 'A data de volta não pode ser antes da ida.' });
      return;
    }
    if (travelers < 1) {
      setError({ field: 'travelers', message: 'Pelo menos um viajante é necessário.' });
      return;
    }
    
    setError(null);
    setIsSaving(true);
    try {
      const trip = await TripRepository.createTrip({
        title: `Viagem para ${destination}`,
        destination,
        start_date: startDate,
        end_date: endDate,
        status: 'planning'
      });
      navigate(`/viagens/${trip.id}/onboarding`);
    } catch (err: any) {
      console.error(err);
      setError({ message: "Não foi possível criar sua viagem no momento. Tente novamente." });
    } finally {
      setIsSaving(false);
    }
  };

  const daysCount = (startDate && endDate && new Date(endDate) >= new Date(startDate)) 
    ? differenceInDays(new Date(endDate), new Date(startDate)) + 1 
    : 0;

  return (
    <div className="min-h-screen bg-[#FDFCF8] flex flex-col font-sans">
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4 flex items-center sticky top-0 z-50">
        <Button variant="ghost" size="icon" asChild className="mr-4 rounded-full hover:bg-slate-100 text-slate-600">
          <Link to="/minhas-viagens">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <span className="font-display font-semibold text-xl text-slate-900 tracking-tight">Nova Viagem</span>
      </header>

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-8 lg:py-16">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-24">
          
          {/* LADO ESQUERDO: Formulário */}
          <div className="flex-1 max-w-xl">
            <div className="mb-10">
              <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-slate-900 text-white mb-6 shadow-sm">
                <PlaneTakeoff className="h-6 w-6" />
              </div>
              <h1 className="text-4xl font-display font-bold text-slate-900 mb-4 tracking-tight leading-tight">
                Para onde sua curiosidade te leva?
              </h1>
              <p className="text-lg text-slate-600">
                Nos dê o básico e nós construímos a experiência. O roteiro inteligente do Voyage Flow começa aqui.
              </p>
            </div>
            
            {error && !error.field && (
              <div className="bg-red-50 text-red-700 p-4 rounded-2xl border border-red-100 mb-8 flex items-start gap-3">
                 <p className="text-sm font-medium mt-0.5">{error.message}</p>
              </div>
            )}

            <form className="space-y-8" onSubmit={handleSave}>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-900">Destino</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Ex: Kyoto, Japão" 
                    className={`w-full rounded-2xl border ${error?.field === 'destination' ? 'border-red-400 focus:border-red-500 focus:ring-red-500' : 'border-slate-200 focus:border-slate-900 focus:ring-slate-900'} py-4 pl-12 pr-4 text-slate-900 bg-white placeholder:text-slate-400 shadow-sm transition-all text-lg`}
                    value={destination}
                    onChange={e => { setDestination(e.target.value); if(error?.field === 'destination') setError(null); }}
                  />
                </div>
                {error?.field === 'destination' && <p className="text-red-500 text-sm mt-1 ml-1">{error.message}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-900">Ida</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <input 
                      type="date" 
                      className={`w-full rounded-2xl border ${error?.field === 'startDate' ? 'border-red-400 focus:border-red-500 focus:ring-red-500' : 'border-slate-200 focus:border-slate-900 focus:ring-slate-900'} py-4 pl-12 pr-4 text-slate-900 bg-white shadow-sm transition-all`}
                      value={startDate}
                      onChange={e => { setStartDate(e.target.value); if(error?.field === 'startDate') setError(null); }}
                    />
                  </div>
                  {error?.field === 'startDate' && <p className="text-red-500 text-sm mt-1 ml-1">{error.message}</p>}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-900">Volta</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <input 
                      type="date" 
                      className={`w-full rounded-2xl border ${error?.field === 'endDate' ? 'border-red-400 focus:border-red-500 focus:ring-red-500' : 'border-slate-200 focus:border-slate-900 focus:ring-slate-900'} py-4 pl-12 pr-4 text-slate-900 bg-white shadow-sm transition-all`}
                      value={endDate}
                      min={startDate}
                      onChange={e => { setEndDate(e.target.value); if(error?.field === 'endDate') setError(null); }}
                    />
                  </div>
                  {error?.field === 'endDate' && <p className="text-red-500 text-sm mt-1 ml-1">{error.message}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-900">Viajantes</label>
                <div className="relative w-full sm:w-1/2">
                  <Users className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input 
                    type="number" 
                    min="1"
                    className={`w-full rounded-2xl border ${error?.field === 'travelers' ? 'border-red-400 focus:border-red-500 focus:ring-red-500' : 'border-slate-200 focus:border-slate-900 focus:ring-slate-900'} py-4 pl-12 pr-4 text-slate-900 bg-white shadow-sm transition-all`}
                    value={travelers}
                    onChange={e => { setTravelers(parseInt(e.target.value) || 0); if(error?.field === 'travelers') setError(null); }}
                  />
                </div>
                {error?.field === 'travelers' && <p className="text-red-500 text-sm mt-1 ml-1">{error.message}</p>}
              </div>

              <div className="pt-6">
                <Button 
                  type="submit" 
                  disabled={isSaving} 
                  className="w-full sm:w-auto min-w-[200px] h-14 rounded-2xl text-lg bg-lime-400 hover:bg-lime-500 text-lime-950 font-bold shadow-sm transition-all"
                >
                  {isSaving ? <><Loader2 className="mr-2 h-5 w-5 animate-spin"/> Criando expedição...</> : "Começar minha viagem"}
                </Button>
              </div>
            </form>
          </div>

          {/* LADO DIREITO: Resumo Visual (Sticky) */}
          <div className="lg:w-[400px] w-full mt-8 lg:mt-0">
            <div className="sticky top-28">
              <div className="bg-white rounded-[2rem] border border-slate-100 p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6">Resumo da Expedição</h3>
                
                <div className="space-y-6">
                  {/* Destino */}
                  <div className="flex gap-4 items-start">
                    <div className={`mt-1 flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${destination ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-300'}`}>
                      <MapPin className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 mb-1">Destino</p>
                      <p className={`text-xl font-display font-semibold ${destination ? 'text-slate-900' : 'text-slate-300'}`}>
                        {destination || 'A definir'}
                      </p>
                    </div>
                  </div>

                  <div className="h-px w-full bg-slate-50"></div>

                  {/* Período */}
                  <div className="flex gap-4 items-start">
                    <div className={`mt-1 flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${(startDate && endDate) ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-300'}`}>
                      <Calendar className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 mb-1">Período {daysCount > 0 && <span className="text-xs font-medium px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full ml-2">{daysCount} dias</span>}</p>
                      <p className={`text-base font-medium ${startDate ? 'text-slate-900' : 'text-slate-300'}`}>
                        {startDate ? format(new Date(startDate + "T12:00:00"), "dd 'de' MMM, yyyy", { locale: ptBR }) : 'A definir'} 
                        {endDate && ' — '}
                        {endDate && format(new Date(endDate + "T12:00:00"), "dd 'de' MMM, yyyy", { locale: ptBR })}
                      </p>
                    </div>
                  </div>

                  <div className="h-px w-full bg-slate-50"></div>

                  {/* Viajantes */}
                  <div className="flex gap-4 items-start">
                    <div className={`mt-1 flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${travelers > 0 ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-300'}`}>
                      <Users className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 mb-1">Participantes</p>
                      <p className={`text-base font-medium ${travelers > 0 ? 'text-slate-900' : 'text-slate-300'}`}>
                        {travelers > 0 ? `${travelers} ${travelers === 1 ? 'viajante' : 'viajantes'}` : 'A definir'}
                      </p>
                    </div>
                  </div>

                </div>

                {(!destination || !startDate || !endDate) && (
                  <div className="mt-8 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-sm text-slate-500 text-center">
                      Preencha os dados ao lado para desbloquear a criação do roteiro.
                    </p>
                  </div>
                )}
                {(destination && startDate && endDate) && (
                   <div className="mt-8 p-4 bg-lime-50 rounded-2xl border border-lime-100">
                   <p className="text-sm text-lime-800 text-center font-medium">
                     Tudo pronto! Seu roteiro base já pode ser gerado.
                   </p>
                 </div>
                )}
              </div>
            </div>
          </div>
          
        </div>
      </main>
    </div>
  );
}
