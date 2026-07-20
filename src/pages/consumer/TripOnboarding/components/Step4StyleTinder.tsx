import { useState, useEffect } from 'react';
import { ExperienceRepository } from '../../../repositories';
import { TripWalletRepository } from '../../../repositories/TripWalletRepository';
import { Loader2, Heart, X, CheckCircle, HelpCircle } from 'lucide-react';

export default function Step4StyleTinder({ trip, onSave, onNext, onPrev }: any) {
  const [experiences, setExperiences] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [votes, setVotes] = useState<any>(trip.preferences?.tinder_votes || {});

  useEffect(() => {
    async function load() {
      try {
        const data = await ExperienceRepository.getExperiences({
          destination: trip.destination,
          limit: 10
        });
        // Se a API não achar match exato, ExperienceRepository poderia retornar fallbacks.
        // Simulando filtro para 10 itens
        setExperiences(data.slice(0, 10));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [trip.destination]);

  const handleVote = async (exp: any, vote: string) => {
    setSaving(true);
    const newVotes = { ...votes, [exp.id]: vote };
    setVotes(newVotes);

    try {
       // Persiste voto no Onboarding
       await onSave({
         preferences: { tinder_votes: newVotes }
       });

       // Se votou "already_bought", salva em Reservations
       if (vote === 'already_bought') {
          await TripWalletRepository.saveReservation({
            trip_id: trip.id,
            type: 'attraction',
            title: exp.title,
            purchase_status: 'booked',
            is_fixed: true,
          });
       }

       setCurrentIndex(prev => prev + 1);
    } catch (err) {
       alert("Erro ao salvar sua resposta.");
    } finally {
       setSaving(false);
    }
  };

  const currentExp = experiences[currentIndex];

  return (
    <div className="bg-white p-8 rounded-[24px] shadow-sm border border-slate-200">
      <h2 className="text-3xl font-bold mb-2">Tinder de Experiências</h2>
      <p className="text-slate-500 mb-8">Baseado no seu destino ({trip.destination}), o que você acha dessas ideias?</p>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-lime-500" /></div>
      ) : experiences.length === 0 ? (
        <div className="bg-slate-50 p-8 rounded-xl text-center border border-slate-200">
           Não encontramos experiências prontas para o seu destino ainda. Mas o seu Concierge de IA cuidará de personalizar o roteiro!
        </div>
      ) : currentIndex >= experiences.length ? (
        <div className="bg-lime-50 p-12 rounded-[24px] text-center border border-lime-200">
           <div className="text-5xl mb-4">🎉</div>
           <h3 className="text-2xl font-bold mb-2 text-lime-900">Mapeamento Concluído!</h3>
           <p className="text-lime-700">Temos o necessário para decodificar seu DNA.</p>
        </div>
      ) : (
        <div className="max-w-md mx-auto">
          <div className="relative rounded-[24px] overflow-hidden bg-slate-900 aspect-[4/5] shadow-lg mb-6">
             {currentExp.image_url ? (
                <img src={currentExp.image_url} alt={currentExp.title} className="w-full h-full object-cover opacity-80" />
             ) : (
                <div className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-500">Sem imagem</div>
             )}
             <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-6 text-white">
                <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold w-fit mb-3">{currentExp.category}</span>
                <h3 className="text-2xl font-bold mb-1">{currentExp.title}</h3>
                <p className="text-sm text-slate-300 line-clamp-2">{currentExp.description}</p>
             </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-3">
             <button disabled={saving} onClick={() => handleVote(currentExp, 'reject')} className="bg-slate-100 hover:bg-slate-200 text-slate-700 py-4 rounded-[16px] font-bold flex flex-col items-center gap-1">
                <X className="w-6 h-6" /> Não combina
             </button>
             <button disabled={saving} onClick={() => handleVote(currentExp, 'love')} className="bg-lime-400 hover:bg-lime-500 text-slate-900 py-4 rounded-[16px] font-bold flex flex-col items-center gap-1">
                <Heart className="w-6 h-6" /> Quero Muito
             </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
             <button disabled={saving} onClick={() => handleVote(currentExp, 'maybe')} className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 py-3 rounded-[16px] font-semibold flex items-center justify-center gap-2">
                <HelpCircle className="w-4 h-4" /> Talvez
             </button>
             <button disabled={saving} onClick={() => handleVote(currentExp, 'already_bought')} className="bg-slate-900 hover:bg-black text-white py-3 rounded-[16px] font-semibold flex items-center justify-center gap-2">
                <CheckCircle className="w-4 h-4" /> Já Comprei
             </button>
          </div>
        </div>
      )}

      <div className="mt-10 flex justify-between">
        <button onClick={onPrev} className="text-slate-500 font-bold hover:text-slate-900 px-4 py-2">← Voltar</button>
        <button onClick={onNext} className="bg-slate-900 hover:bg-black text-white font-bold py-4 px-8 rounded-full transition-colors flex items-center">
           {saving ? <Loader2 className="mr-2 animate-spin w-5 h-5"/> : 'Pular para o final'}
        </button>
      </div>
    </div>
  );
}
