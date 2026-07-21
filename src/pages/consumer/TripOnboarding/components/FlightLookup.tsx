import React, { useState } from 'react';
import { Plane, Search, Loader2, Info, ArrowRight } from 'lucide-react';
import { Input } from '../../../../components/ui/input';
import { Button } from '../../../../components/ui/button';
import { FlightDataProvider, FlightSearchResult } from '../../../../utils/flightDataProvider';

interface FlightLookupProps {
  tripStartDate?: string;
  tripEndDate?: string;
  onFlightSelected: (flight: FlightSearchResult) => void;
  onManualFallback: () => void;
}

export default function FlightLookup({ tripStartDate, tripEndDate, onFlightSelected, onManualFallback }: FlightLookupProps) {
  const [flightNumber, setFlightNumber] = useState('');
  const [dateSelection, setDateSelection] = useState<'ida' | 'volta' | 'outra' | ''>('');
  const [date, setDate] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<FlightSearchResult[]>([]);
  const [selectedFlight, setSelectedFlight] = useState<FlightSearchResult | null>(null);

  const searchDate = dateSelection === 'ida' && tripStartDate ? tripStartDate : 
                     dateSelection === 'volta' && tripEndDate ? tripEndDate : date;

  const handleSearch = async () => {
    if (!flightNumber || !searchDate) return;
    setIsSearching(true);
    setError(null);
    setResults([]);
    setSelectedFlight(null);

    try {
      const data = await FlightDataProvider.searchByFlightNumber({
        flightNumber,
        departureDate: searchDate
      });
      
      if (data.length === 0) {
        setError('Não encontramos esse voo. Verifique o número e a data ou tente adicionar manualmente.');
      } else if (data.length === 1) {
        setSelectedFlight(data[0]);
      } else {
        setResults(data);
      }
    } catch (e: any) {
      if (e.message === 'Missing Amadeus API Secrets on server') {
        setError('O servidor está sem as credenciais da Amadeus. Configure AMADEUS_API_KEY e AMADEUS_API_SECRET no seu painel do Supabase (Secrets).');
      } else {
        setError('Não conseguimos buscar esse voo agora. Você pode tentar novamente ou adicionar manualmente.');
      }
    } finally {
      setIsSearching(false);
    }
  };

  const handleConfirm = () => {
    if (selectedFlight) {
      onFlightSelected(selectedFlight);
    }
  };

  if (selectedFlight) {
    return (
      <div className="space-y-6">
        {selectedFlight.isSandbox && (
           <div className="bg-amber-50 text-amber-800 text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-2">
             <Info className="w-4 h-4" />
             Dados do ambiente de teste Amadeus (Sandbox). Horários simulados.
           </div>
        )}
        <div className="bg-slate-900 text-white p-6 rounded-[24px] relative overflow-hidden shadow-lg">
           <Plane className="absolute -right-6 -bottom-6 w-32 h-32 text-white/5" />
           <div className="flex justify-between items-start mb-6 relative z-10">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{selectedFlight.airline}</span>
                <h4 className="text-2xl font-extrabold">{selectedFlight.flightNumber}</h4>
              </div>
              <div className="bg-white/10 px-3 py-1 rounded-full text-xs font-bold">
                {selectedFlight.status || 'Confirmado'}
              </div>
           </div>
           
           <div className="flex items-center justify-between relative z-10">
              <div className="text-center">
                 <p className="text-3xl font-extrabold">{selectedFlight.departure?.iataCode || selectedFlight.originIata}</p>
                 <p className="text-sm text-slate-400 font-medium mt-1">
                    {selectedFlight.departure?.scheduledTime ? new Date(selectedFlight.departure.scheduledTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : new Date(selectedFlight.departureTime || '').toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                 </p>
                 {selectedFlight.departure?.terminal && <p className="text-xs text-slate-500 mt-1">Terminal {selectedFlight.departure.terminal}</p>}
              </div>
              
              <div className="flex-1 px-4 flex flex-col items-center justify-center">
                 <div className="w-full h-px border-t border-dashed border-white/20 mb-1 relative">
                    <Plane className="w-4 h-4 text-white/40 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                 </div>
                 {selectedFlight.duration && <p className="text-[10px] text-slate-400 font-bold">{selectedFlight.duration}</p>}
              </div>

              <div className="text-center">
                 <p className="text-3xl font-extrabold">{selectedFlight.arrival?.iataCode || selectedFlight.destinationIata}</p>
                 <p className="text-sm text-slate-400 font-medium mt-1">
                    {selectedFlight.arrival?.scheduledTime ? new Date(selectedFlight.arrival.scheduledTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : new Date(selectedFlight.arrivalTime || '').toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                 </p>
              </div>
           </div>
        </div>

        <Button 
          onClick={handleConfirm}
          className="w-full h-12 rounded-xl bg-[#D7F24B] text-[#171717] font-bold hover:bg-[#c5e042]"
        >
          Confirmar Voo
        </Button>
        <button onClick={() => setSelectedFlight(null)} className="w-full text-sm font-bold text-slate-500 hover:text-slate-700">
          Pesquisar outro voo
        </button>
      </div>
    );
  }

  if (results.length > 1) {
    return (
      <div className="space-y-4">
        <h4 className="font-extrabold text-lg text-slate-800">Escolha o voo correto</h4>
        {results.map((r, i) => (
           <button 
             key={i}
             onClick={() => setSelectedFlight(r)}
             className="w-full p-4 rounded-xl border-2 border-slate-100 hover:border-[#D7F24B] text-left transition-all bg-white"
           >
             <div className="flex justify-between items-center">
               <div>
                 <span className="text-xs font-bold text-slate-500">{r.airline} {r.flightNumber}</span>
                 <div className="font-extrabold text-slate-800 flex items-center gap-2 mt-1">
                   {r.originIata} <ArrowRight className="w-4 h-4 text-slate-300" /> {r.destinationIata}
                 </div>
               </div>
               <div className="text-right text-sm font-bold text-slate-600">
                 {new Date(r.departureTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
               </div>
             </div>
           </button>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-6">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">Número do Voo</label>
          <Input 
            placeholder="Ex: LA8180" 
            value={flightNumber}
            onChange={e => setFlightNumber(e.target.value.toUpperCase())}
            className="h-14 rounded-xl bg-slate-50 border-slate-200 font-bold text-lg"
          />
        </div>
        
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-3 uppercase tracking-wider">Este é o seu voo de ida ou de volta?</label>
          <div className="grid grid-cols-1 gap-2 mb-3">
             {tripStartDate && (
               <button 
                 onClick={() => setDateSelection('ida')}
                 className={`p-3 text-left rounded-xl border-2 font-bold flex justify-between items-center transition-all ${dateSelection === 'ida' ? 'border-[#D7F24B] bg-[#D7F24B]/10 text-slate-900' : 'border-slate-100 bg-white text-slate-600 hover:border-slate-200'}`}
               >
                 <span>Voo de ida</span>
                 <span className="text-sm">{new Date(tripStartDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', timeZone: 'UTC' })}</span>
               </button>
             )}
             {tripEndDate && (
               <button 
                 onClick={() => setDateSelection('volta')}
                 className={`p-3 text-left rounded-xl border-2 font-bold flex justify-between items-center transition-all ${dateSelection === 'volta' ? 'border-[#D7F24B] bg-[#D7F24B]/10 text-slate-900' : 'border-slate-100 bg-white text-slate-600 hover:border-slate-200'}`}
               >
                 <span>Voo de volta</span>
                 <span className="text-sm">{new Date(tripEndDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', timeZone: 'UTC' })}</span>
               </button>
             )}
             <button 
               onClick={() => setDateSelection('outra')}
               className={`p-3 text-left rounded-xl border-2 font-bold flex justify-between items-center transition-all ${dateSelection === 'outra' ? 'border-[#D7F24B] bg-[#D7F24B]/10 text-slate-900' : 'border-slate-100 bg-white text-slate-600 hover:border-slate-200'}`}
             >
               <span>Outra data</span>
             </button>
          </div>
          
          {dateSelection === 'outra' && (
            <Input 
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="h-14 rounded-xl bg-slate-50 border-slate-200 font-bold text-lg mt-2"
            />
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium border border-red-100">
          {error}
        </div>
      )}

      <div>
        <Button 
          onClick={handleSearch}
          disabled={!flightNumber || (!searchDate && dateSelection !== 'ida' && dateSelection !== 'volta') || isSearching}
          className={`w-full h-14 rounded-xl text-white font-bold text-lg shadow-lg shadow-slate-900/20 transition-all ${(!flightNumber || (!searchDate && dateSelection !== 'ida' && dateSelection !== 'volta')) ? 'bg-slate-300 shadow-none' : 'bg-slate-900 hover:bg-slate-800'}`}
        >
          {isSearching ? <Loader2 className="w-6 h-6 animate-spin" /> : (
            <span className="flex items-center gap-2"><Search className="w-5 h-5" /> Buscar Voo</span>
          )}
        </Button>
        {(!flightNumber || (!searchDate && dateSelection !== 'ida' && dateSelection !== 'volta')) && (
          <p className="text-center text-xs font-bold text-slate-400 mt-3">
            {!flightNumber ? 'Informe o número do voo' : !dateSelection ? 'Escolha se este é o voo de ida, volta ou outro trecho' : 'Escolha a data do voo'}
          </p>
        )}
      </div>

      <div className="text-center border-t border-slate-100 pt-4">
        <button 
          onClick={onManualFallback}
          className="text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors"
        >
          Preencher manualmente
        </button>
      </div>
    </div>
  );
}
