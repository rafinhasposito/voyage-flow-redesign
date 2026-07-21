import React, { useState, useEffect } from 'react';
import { Plane, Building2, Train, Car, Ticket, MapPin, Utensils, Shield, FileText, ArrowRight, ArrowLeft, Loader2, Plus, X, Search, CheckCircle2 } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import OnboardingShell from './OnboardingShell';
import { TripReservation, TripWalletRepository } from '../../../../repositories/TripWalletRepository';
import ReservationComposer from './ReservationComposer';

export default function StepReservations({
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
  const [loading, setLoading] = useState(false);
  const [activeModule, setActiveModule] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [reservations, setReservations] = useState<TripReservation[]>([]);
  const startMode = trip?.preferences?.startMode;

  const modules = [
    { id: 'flight', title: 'Voo', icon: Plane },
    { id: 'hotel', title: 'Hotel', icon: Building2 },
    { id: 'train', title: 'Trem / Ônibus', icon: Train },
    { id: 'transfer', title: 'Transfer', icon: Car },
    { id: 'show', title: 'Show', icon: Ticket },
    { id: 'attraction', title: 'Atração', icon: MapPin },
    { id: 'restaurant', title: 'Restaurante', icon: Utensils },
    { id: 'insurance', title: 'Seguro', icon: Shield },
    { id: 'document', title: 'Documento', icon: FileText },
  ];

  const fetchReservations = async () => {
    if (!trip?.id) return;
    try {
      const data = await TripWalletRepository.getReservations(trip.id);
      setReservations(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, [trip]);

  const handleDelete = async (id: string) => {
    try {
      await TripWalletRepository.deleteReservation(id);
      await fetchReservations();
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaved = async () => {
    setActiveModule(null);
    await fetchReservations();
  };

  const handleNext = async () => {
    if (activeModule) {
      setErrorMsg("Salve ou descarte a reserva que está sendo editada antes de continuar.");
      return;
    }
    setErrorMsg(null);
    setLoading(true);
    try {
      await onNext();
    } catch (e) {
      console.error(e);
      setErrorMsg("Não foi possível continuar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <OnboardingShell
      trip={trip}
      destination={destination}
      stepNumber={displayStepNumber}
      totalSteps={5}
      heroTitle={<>O que já está<br/>confirmado?</>}
      heroSubtitle="Adicione reservas, ingressos e documentos. O roteiro será montado ao redor do que não pode mudar."
      onBack={onPrev}
      onContinue={handleNext}
      loading={loading}
    >
      <div className="space-y-10">

        {startMode === 'zero' && reservations.length === 0 && (
           <div className="bg-lime-50 border border-lime-100 rounded-2xl p-6 text-center">
             <p className="text-lime-800 font-medium text-sm mb-4">Ainda não comprou nada? Tudo bem, você pode pular esta etapa por enquanto.</p>
             <Button onClick={handleNext} className="bg-lime-600 hover:bg-lime-700 text-white rounded-full px-6 font-bold">
               Ainda não reservei nada
             </Button>
           </div>
        )}

        {startMode === 'reservas' && reservations.length === 0 && (
           <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6 flex items-start gap-4">
             <div className="bg-amber-100 p-2 rounded-full shrink-0">
               <Ticket className="w-5 h-5 text-amber-600" />
             </div>
             <div>
               <h4 className="font-bold text-amber-900 mb-1">Vamos organizar suas compras</h4>
               <p className="text-amber-800 text-sm font-medium">Comece adicionando o que você já comprou ou reservou. Seu roteiro inteligente vai respeitar esses horários.</p>
             </div>
           </div>
        )}

        {reservations.length > 0 && (
          <div className="bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm">
            <h3 className="font-extrabold text-xl mb-4 text-slate-800">Itens confirmados</h3>
            <div className="space-y-3">
              {reservations.map(res => (
                <div key={res.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-lime-100 text-lime-600 flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800">{res.title}</h4>
                      <p className="text-xs text-slate-500 font-medium">{res.start_at ? new Date(res.start_at).toLocaleString() : res.type}</p>
                    </div>
                  </div>
                  <button onClick={() => res.id && handleDelete(res.id)} className="text-slate-400 hover:text-red-500 p-2">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <h3 className="font-extrabold text-2xl text-[#171717] mb-6">Adicionar uma reserva ou documento</h3>

          {!activeModule ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {modules.map(mod => (
                <button
                  key={mod.id}
                  onClick={() => setActiveModule(mod.id)}
                  className="flex flex-col items-center justify-center gap-3 p-6 bg-white border border-slate-200 rounded-[20px] hover:border-lime-500 hover:bg-lime-50/30 hover:-translate-y-1 transition-all shadow-sm"
                >
                  <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center">
                    <mod.icon className="w-6 h-6 text-slate-700" />
                  </div>
                  <span className="font-bold text-slate-700 text-sm">{mod.title}</span>
                </button>
              ))}
            </div>
          ) : (
            <ReservationComposer
              trip={trip}
              tripId={trip.id}
              destinationId={trip.destination}
              moduleType={activeModule}
              onClose={() => setActiveModule(null)}
              onSave={handleSaved}
            />
          )}
        </div>

        {errorMsg && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-200 font-bold mt-4 animate-in fade-in">
            {errorMsg}
          </div>
        )}
      </div>
    </OnboardingShell>
  );
}
