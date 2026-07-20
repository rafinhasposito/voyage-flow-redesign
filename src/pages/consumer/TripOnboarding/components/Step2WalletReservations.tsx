import { useState } from 'react';
import { TripWalletRepository, TripReservation } from '../../../repositories/TripWalletRepository';
import { Loader2 } from 'lucide-react';

const RESERVATION_TYPES = [
  { id: 'flight', label: 'Voo', icon: '✈️' },
  { id: 'hotel', label: 'Hotel', icon: '🏨' },
  { id: 'train', label: 'Trem/Ônibus', icon: '🚆' },
  { id: 'show', label: 'Show/Atração', icon: '🎫' },
];

export default function Step2WalletReservations({ trip, reservations, onRefresh, onNext, onPrev }: any) {
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  
  // States para form manual de Voo
  const [flightData, setFlightData] = useState({
    provider: '',
    flightNumber: '',
    origin: '',
    destination: '',
    date: '',
    pnr: ''
  });

  // States para form manual de Hotel
  const [hotelData, setHotelData] = useState({
    title: '',
    address: '',
    checkin: '',
    checkout: '',
    pnr: ''
  });

  const handleSaveFlight = async () => {
    setSaving(true);
    try {
      await TripWalletRepository.saveReservation({
        trip_id: trip.id,
        type: 'flight',
        provider: flightData.provider,
        title: `${flightData.origin} para ${flightData.destination}`,
        purchase_status: 'booked',
        confirmation_code: flightData.pnr,
        start_at: flightData.date ? new Date(flightData.date).toISOString() : undefined,
        is_fixed: true,
        structured_data: {
           flight_number: flightData.flightNumber
        }
      });
      await onRefresh();
      setActiveModal(null);
      setFlightData({ provider: '', flightNumber: '', origin: '', destination: '', date: '', pnr: '' });
    } catch (err) {
      alert("Falha ao salvar voo.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveHotel = async () => {
    setSaving(true);
    try {
      await TripWalletRepository.saveReservation({
        trip_id: trip.id,
        type: 'hotel',
        title: hotelData.title,
        address: hotelData.address,
        purchase_status: 'booked',
        confirmation_code: hotelData.pnr,
        start_at: hotelData.checkin ? new Date(hotelData.checkin).toISOString() : undefined,
        end_at: hotelData.checkout ? new Date(hotelData.checkout).toISOString() : undefined,
        is_fixed: true,
      });
      await onRefresh();
      setActiveModal(null);
      setHotelData({ title: '', address: '', checkin: '', checkout: '', pnr: '' });
    } catch (err) {
      alert("Falha ao salvar hotel.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white p-8 rounded-[24px] shadow-sm border border-slate-200">
      <h2 className="text-3xl font-bold mb-2">O que você já reservou?</h2>
      <p className="text-slate-500 mb-8">
        Vamos construir seu roteiro ao redor das suas certezas. Adicione o que já tem garantido.
      </p>

      {reservations.length > 0 && (
        <div className="mb-8 p-4 bg-lime-50 rounded-xl border border-lime-200">
           <h4 className="font-bold text-lime-900 mb-2">Itens já adicionados:</h4>
           <ul className="list-disc list-inside text-sm text-lime-800">
             {reservations.map((r: any) => (
                <li key={r.id}>{r.type === 'flight' ? '✈️ Voo' : '🏨 Hotel'}: {r.title || r.provider}</li>
             ))}
           </ul>
        </div>
      )}

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
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-[24px] w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">✈️ Adicionar Voo</h3>
            <div className="bg-blue-50 text-blue-800 text-sm p-3 rounded-lg mb-4">
               Busca automática ainda não configurada. Você pode adicionar os dados manualmente.
            </div>
            <div className="space-y-4">
              <input type="text" placeholder="Companhia (Ex: LATAM)" value={flightData.provider} onChange={e => setFlightData({...flightData, provider: e.target.value})} className="w-full p-3 border rounded-xl focus:border-lime-500 outline-none" />
              <input type="text" placeholder="Número do voo (Ex: LA8180)" value={flightData.flightNumber} onChange={e => setFlightData({...flightData, flightNumber: e.target.value})} className="w-full p-3 border rounded-xl focus:border-lime-500 outline-none" />
              <div className="grid grid-cols-2 gap-2">
                <input type="text" placeholder="Origem (Ex: GRU)" value={flightData.origin} onChange={e => setFlightData({...flightData, origin: e.target.value})} className="w-full p-3 border rounded-xl focus:border-lime-500 outline-none" />
                <input type="text" placeholder="Destino (Ex: JFK)" value={flightData.destination} onChange={e => setFlightData({...flightData, destination: e.target.value})} className="w-full p-3 border rounded-xl focus:border-lime-500 outline-none" />
              </div>
              <input type="date" value={flightData.date} onChange={e => setFlightData({...flightData, date: e.target.value})} className="w-full p-3 border rounded-xl focus:border-lime-500 outline-none" />
              <input type="text" placeholder="Localizador (PNR)" value={flightData.pnr} onChange={e => setFlightData({...flightData, pnr: e.target.value})} className="w-full p-3 border rounded-xl focus:border-lime-500 outline-none" />
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setActiveModal(null)} className="px-4 py-2 text-slate-500 font-bold">Cancelar</button>
              <button onClick={handleSaveFlight} disabled={saving} className="px-6 py-2 bg-lime-400 font-bold rounded-full disabled:opacity-50 flex items-center">
                 {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin"/>} Salvar Voo
              </button>
            </div>
          </div>
        </div>
      )}
      
      {activeModal === 'hotel' && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-[24px] w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">🏨 Adicionar Hotel / Basecamp</h3>
            <div className="space-y-4">
              <input type="text" placeholder="Nome do Hotel" value={hotelData.title} onChange={e => setHotelData({...hotelData, title: e.target.value})} className="w-full p-3 border rounded-xl focus:border-lime-500 outline-none" />
              <input type="text" placeholder="Endereço" value={hotelData.address} onChange={e => setHotelData({...hotelData, address: e.target.value})} className="w-full p-3 border rounded-xl focus:border-lime-500 outline-none" />
              <div className="flex gap-2">
                 <div className="flex-1">
                    <label className="text-xs font-semibold ml-1">Check-in</label>
                    <input type="date" value={hotelData.checkin} onChange={e => setHotelData({...hotelData, checkin: e.target.value})} className="w-full p-3 border rounded-xl focus:border-lime-500 outline-none" />
                 </div>
                 <div className="flex-1">
                    <label className="text-xs font-semibold ml-1">Check-out</label>
                    <input type="date" value={hotelData.checkout} onChange={e => setHotelData({...hotelData, checkout: e.target.value})} className="w-full p-3 border rounded-xl focus:border-lime-500 outline-none" />
                 </div>
              </div>
              <input type="text" placeholder="Confirmação / Localizador" value={hotelData.pnr} onChange={e => setHotelData({...hotelData, pnr: e.target.value})} className="w-full p-3 border rounded-xl focus:border-lime-500 outline-none" />
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setActiveModal(null)} className="px-4 py-2 text-slate-500 font-bold">Cancelar</button>
              <button onClick={handleSaveHotel} disabled={saving} className="px-6 py-2 bg-lime-400 font-bold rounded-full disabled:opacity-50 flex items-center">
                 {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin"/>} Salvar Hotel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fallback para modais não implementados */}
      {(activeModal === 'train' || activeModal === 'show') && (
         <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-[24px] w-full max-w-md text-center">
             <h3 className="text-xl font-bold mb-4">Em construção</h3>
             <p className="text-slate-500 mb-6">Apenas Voo e Hotel estão ativos nesta demonstração do Bloco B.2.</p>
             <button onClick={() => setActiveModal(null)} className="bg-slate-900 text-white font-bold px-6 py-2 rounded-full">Fechar</button>
          </div>
         </div>
      )}
    </div>
  );
}
