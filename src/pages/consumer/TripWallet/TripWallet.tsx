import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { TripWalletRepository, TripReservation, TripDocument } from '../../../repositories/TripWalletRepository';
import { OfflineStorage } from '../../../utils/offlineStorage';
import { Plane, Hotel, FileText, Download, WifiOff, Loader2, Trash2 } from 'lucide-react';

export default function TripWallet() {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const [filter, setFilter] = useState('Todos');
  const [reservations, setReservations] = useState<TripReservation[]>([]);
  const [documents, setDocuments] = useState<TripDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [offlineDocs, setOfflineDocs] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function load() {
      if (!tripId) return;
      try {
        const res = await TripWalletRepository.getReservations(tripId);
        const docs = await TripWalletRepository.getDocuments(tripId);
        setReservations(res);
        setDocuments(docs);
        
        // Verifica quais estão offline
        const offState: any = {};
        for (const doc of docs) {
           const cached = await OfflineStorage.getDocumentBlob(doc.id!);
           if (cached) offState[doc.id!] = true;
        }
        setOfflineDocs(offState);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [tripId]);

  const handleMakeOffline = async (doc: TripDocument) => {
    try {
       const url = await TripWalletRepository.getDocumentSignedUrl(doc);
       const response = await fetch(url);
       const blob = await response.blob();
       await OfflineStorage.saveDocumentBlob(doc.id!, doc.file_name, doc.mime_type || '', doc.file_size || 0, blob);
       setOfflineDocs(prev => ({...prev, [doc.id!]: true}));
       alert("Disponibilizado offline com sucesso!");
    } catch (err) {
       alert("Erro ao baixar documento para modo offline.");
    }
  };

  const handleRemoveOffline = async (doc: TripDocument) => {
    try {
       await OfflineStorage.removeDocumentBlob(doc.id!);
       setOfflineDocs(prev => ({...prev, [doc.id!]: false}));
    } catch (err) {
       alert("Erro ao remover cópia offline.");
    }
  };

  const handleOpenDoc = async (doc: TripDocument) => {
    try {
       const cached = await OfflineStorage.getDocumentBlob(doc.id!);
       if (cached) {
          const url = URL.createObjectURL(cached.data);
          window.open(url, '_blank');
          return;
       }
       const url = await TripWalletRepository.getDocumentSignedUrl(doc);
       window.open(url, '_blank');
    } catch (err) {
       alert("Falha ao abrir documento. Verifique sua conexão.");
    }
  };

  const filteredReservations = reservations.filter(r => {
    if (filter === 'Voos') return r.type === 'flight';
    if (filter === 'Hospedagem') return r.type === 'hotel';
    return true;
  });

  return (
    <div className="min-h-screen bg-[#F0F2F5] text-slate-900 font-urbanist p-8">
      <header className="flex justify-between items-center mb-8 max-w-4xl mx-auto">
         <h1 className="text-3xl font-bold">Carteira da Viagem</h1>
         <button className="bg-white border border-slate-200 px-4 py-2 rounded-full font-medium text-sm hover:bg-slate-50" onClick={() => navigate(`/viagens/${tripId}/onboarding?step=5`)}>← Voltar pro Onboarding</button>
      </header>

      <div className="max-w-4xl mx-auto">
        <div className="flex gap-4 mb-8 overflow-x-auto pb-4">
          {['Todos', 'Voos', 'Hospedagem', 'Documentos'].map(f => (
            <button 
              key={f}
              onClick={() => setFilter(f)}
              className={`px-6 py-2 rounded-full font-bold whitespace-nowrap transition-colors ${filter === f ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'}`}
            >
              {f}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center p-20"><Loader2 className="w-10 h-10 animate-spin text-slate-400" /></div>
        ) : (
          <div className="space-y-6">
            
            {/* RESERVATIONS */}
            {(filter === 'Todos' || filter === 'Voos' || filter === 'Hospedagem') && filteredReservations.map(r => (
               <div key={r.id} className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-200 flex flex-col md:flex-row gap-6">
                  <div className="bg-slate-50 w-20 h-20 rounded-[16px] flex items-center justify-center shrink-0">
                     {r.type === 'flight' ? <Plane className="w-8 h-8 text-blue-600" /> : <Hotel className="w-8 h-8 text-orange-600" />}
                  </div>
                  <div className="flex-1">
                     <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="text-xl font-bold">{r.title || 'Reserva s/ Nome'}</h3>
                          <p className="text-slate-500 font-medium">{r.provider || (r.type === 'flight' ? 'Cia Aérea Não Inf.' : 'Hospedagem')}</p>
                        </div>
                        <span className="bg-lime-100 text-lime-800 text-xs font-bold px-3 py-1 rounded-full uppercase">Confirmado</span>
                     </div>
                     <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm">
                        <div>
                           <p className="text-slate-400 text-xs uppercase font-bold">Partida / Checkin</p>
                           <p className="font-semibold">{r.start_at ? new Date(r.start_at).toLocaleDateString() : 'N/D'}</p>
                        </div>
                        <div>
                           <p className="text-slate-400 text-xs uppercase font-bold">Chegada / Checkout</p>
                           <p className="font-semibold">{r.end_at ? new Date(r.end_at).toLocaleDateString() : 'N/D'}</p>
                        </div>
                        <div>
                           <p className="text-slate-400 text-xs uppercase font-bold">Localizador / PNR</p>
                           <p className="font-semibold">{r.confirmation_code || 'Não Inf.'}</p>
                        </div>
                     </div>
                     {r.type === 'flight' && r.structured_data?.flight_number && (
                        <div className="mt-4 pt-4 border-t border-slate-100 text-sm">
                           <span className="text-slate-500">Voo: </span><span className="font-bold">{r.structured_data.flight_number}</span>
                        </div>
                     )}
                  </div>
               </div>
            ))}

            {/* DOCUMENTS */}
            {(filter === 'Todos' || filter === 'Documentos') && (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {documents.map(doc => (
                    <div key={doc.id} className="bg-white p-4 rounded-[20px] shadow-sm border border-slate-200 flex items-center justify-between">
                       <div className="flex items-center gap-4 truncate">
                          <FileText className="text-lime-600 shrink-0" />
                          <div className="truncate">
                             <p className="font-bold text-sm truncate">{doc.file_name}</p>
                             <p className="text-xs text-slate-500">{(doc.file_size! / 1024).toFixed(1)} KB</p>
                          </div>
                       </div>
                       <div className="flex items-center gap-2 shrink-0">
                          <button onClick={() => handleOpenDoc(doc)} className="bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-lg text-sm font-semibold">Abrir</button>
                          {offlineDocs[doc.id!] ? (
                             <button onClick={() => handleRemoveOffline(doc)} className="bg-lime-100 text-lime-700 hover:bg-lime-200 p-2 rounded-lg" title="Remover cópia offline">
                               <WifiOff className="w-5 h-5" />
                             </button>
                          ) : (
                             <button onClick={() => handleMakeOffline(doc)} className="bg-slate-100 text-slate-600 hover:bg-slate-200 p-2 rounded-lg" title="Baixar para Offline">
                               <Download className="w-5 h-5" />
                             </button>
                          )}
                       </div>
                    </div>
                 ))}
               </div>
            )}

            {filteredReservations.length === 0 && documents.length === 0 && filter !== 'Todos' && (
              <div className="bg-white p-12 rounded-[24px] text-center border-2 border-dashed border-slate-300">
                 <h3 className="text-xl font-bold mb-2">Nenhum item em {filter}</h3>
              </div>
            )}
            
            {reservations.length === 0 && documents.length === 0 && filter === 'Todos' && (
              <div className="bg-white p-12 rounded-[24px] text-center border-2 border-dashed border-slate-300">
                 <div className="text-4xl mb-4">🪪</div>
                 <h3 className="text-xl font-bold mb-2">Sua carteira está vazia</h3>
                 <p className="text-slate-500 mb-6">Seus comprovantes e reservas ficam todos aqui.</p>
                 <button onClick={() => navigate(`/viagens/${tripId}/onboarding?step=2`)} className="bg-lime-400 font-bold px-6 py-3 rounded-full text-slate-900">
                    Adicionar minha primeira reserva
                 </button>
              </div>
            )}
            
          </div>
        )}
      </div>
    </div>
  );
}
