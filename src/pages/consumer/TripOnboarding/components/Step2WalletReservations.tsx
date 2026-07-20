import { useState } from 'react';

const RESERVATION_TYPES = [
  { id: 'flight', label: 'Voo', icon: '✈️' },
  { id: 'hotel', label: 'Hotel', icon: '🏨' },
  { id: 'train', label: 'Trem', icon: '🚆' },
  { id: 'show', label: 'Show/Evento', icon: '🎫' },
];

export default function Step2WalletReservations({ trip, onNext, onPrev }: any) {
  const [activeModal, setActiveModal] = useState<string | null>(null);
  
  // Mock function - na V2 chamaremos TripWalletRepository.saveReservation
  const handleSaveReservation = (type: string, data: any) => {
    console.log("Saving reservation", type, data);
    setActiveModal(null);
  };

  return (
    <div className="bg-white p-8 rounded-[24px] shadow-sm">
      <h2 className="text-3xl font-bold mb-2">O que você já reservou?</h2>
      <p className="text-slate-500 mb-8">
        Vamos construir seu roteiro ao redor das suas certezas. Adicione o que já tem garantido.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {RESERVATION_TYPES.map(rt => (
          <div key={rt.id} className="p-4 border border-slate-200 rounded-[20px] flex items-center justify-between hover:border-lime-400 transition-colors">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{rt.icon}</span>
              <span className="font-semibold text-slate-800">{rt.label}</span>
            </div>
            <button 
              onClick={() => setActiveModal(rt.id)}
              className="text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-full font-medium"
            >
              Já tenho
            </button>
          </div>
        ))}
      </div>

      <div className="mt-10 flex justify-between">
        <button onClick={onPrev} className="text-slate-500 font-bold hover:text-slate-900 px-4 py-2">
          ← Voltar
        </button>
        <button onClick={onNext} className="bg-lime-400 hover:bg-lime-500 text-slate-900 font-bold py-4 px-8 rounded-full transition-colors">
          Continuar
        </button>
      </div>

      {activeModal === 'flight' && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-[24px] w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">✈️ Adicionar Voo</h3>
            <div className="space-y-4">
              <input type="text" placeholder="Número do voo (Ex: LA8180)" className="w-full p-3 border rounded-xl" />
              <input type="date" className="w-full p-3 border rounded-xl" />
              <div className="text-xs text-slate-500 text-center my-2">OU</div>
              <input type="file" className="w-full p-3 border rounded-xl text-sm" />
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setActiveModal(null)} className="px-4 py-2 text-slate-500">Cancelar</button>
              <button onClick={() => handleSaveReservation('flight', {})} className="px-4 py-2 bg-lime-400 font-bold rounded-full">Salvar Voo</button>
            </div>
          </div>
        </div>
      )}
      
      {activeModal === 'hotel' && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-[24px] w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">🏨 Adicionar Hotel / Basecamp</h3>
            <div className="space-y-4">
              <input type="text" placeholder="Nome do Hotel" className="w-full p-3 border rounded-xl" />
              <input type="text" placeholder="Endereço" className="w-full p-3 border rounded-xl" />
              <div className="flex gap-2">
                 <input type="date" placeholder="Check-in" className="w-full p-3 border rounded-xl" />
                 <input type="date" placeholder="Check-out" className="w-full p-3 border rounded-xl" />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setActiveModal(null)} className="px-4 py-2 text-slate-500">Cancelar</button>
              <button onClick={() => handleSaveReservation('hotel', {})} className="px-4 py-2 bg-lime-400 font-bold rounded-full">Salvar Hotel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
