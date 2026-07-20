import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useConsumerAuth } from '../../../contexts/ConsumerAuthProvider';
import { TripRepository } from '../../../repositories/TripRepository';
import { TripWalletRepository, TripReservation, TripDocument } from '../../../repositories/TripWalletRepository';
import Step1TripMeta from './components/Step1TripMeta';
import Step2WalletReservations from './components/Step2WalletReservations';
import Step3Documents from './components/Step3Documents';
import Step4StyleTinder from './components/Step4StyleTinder';
import Step5DNA from './components/Step5DNA';

export default function TripOnboardingContainer() {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const { user } = useConsumerAuth();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [trip, setTrip] = useState<any>(null);
  const [reservations, setReservations] = useState<TripReservation[]>([]);
  const [documents, setDocuments] = useState<TripDocument[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAll = async () => {
    if (!tripId || !user) return;
    try {
      setLoading(true);
      const data = await TripRepository.getTripById(tripId);
      if (data && data.user_id === user.id) {
        setTrip(data);
        const res = await TripWalletRepository.getReservations(tripId);
        setReservations(res);
        const docs = await TripWalletRepository.getDocuments(tripId);
        setDocuments(docs);
      } else {
        navigate('/minhas-viagens');
      }
    } catch (err) {
      console.error(err);
      navigate('/minhas-viagens');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, [tripId, user, navigate]);

  const handleUpdateTrip = async (patch: any) => {
    try {
      await TripRepository.updateTripOnboarding(trip.id, patch);
      await loadAll();
    } catch (err) {
      console.error("Falha ao salvar", err);
      alert("Falha ao salvar. Tente novamente.");
      throw err;
    }
  };

  const nextStep = () => setCurrentStep(prev => Math.min(5, prev + 1));
  const prevStep = () => setCurrentStep(prev => Math.max(1, prev - 1));

  if (loading) return <div className="p-8">Carregando viagem...</div>;
  if (!trip) return null;

  return (
    <div className="min-h-screen bg-[#F0F2F5] text-slate-900 font-urbanist">
      <header className="px-6 py-4 border-b border-slate-200 bg-white flex justify-between items-center">
        <button onClick={() => navigate('/minhas-viagens')} className="text-sm text-slate-500 hover:text-slate-900">
          ← Voltar para Minhas Viagens
        </button>
        <div className="font-semibold text-lg">{trip.title || trip.destination}</div>
        <div className="text-sm font-medium px-3 py-1 bg-lime-100 text-lime-900 rounded-full">
          Etapa {currentStep} de 5
        </div>
      </header>
      
      <main className="max-w-4xl mx-auto py-12 px-4">
        {currentStep === 1 && (
          <Step1TripMeta trip={trip} onSave={handleUpdateTrip} onNext={nextStep} />
        )}
        {currentStep === 2 && (
          <Step2WalletReservations 
            trip={trip} 
            reservations={reservations} 
            onRefresh={loadAll}
            onNext={nextStep} 
            onPrev={prevStep} 
          />
        )}
        {currentStep === 3 && (
          <Step3Documents 
            trip={trip} 
            documents={documents}
            reservations={reservations}
            onRefresh={loadAll}
            onNext={nextStep} 
            onPrev={prevStep} 
          />
        )}
        {currentStep === 4 && (
          <Step4StyleTinder trip={trip} onSave={handleUpdateTrip} onNext={nextStep} onPrev={prevStep} />
        )}
        {currentStep === 5 && (
          <Step5DNA trip={trip} reservations={reservations} documents={documents} onPrev={prevStep} onFinish={() => navigate(`/viagens/${tripId}/carteira`)} />
        )}
      </main>
    </div>
  );
}
