import React, { useState, useEffect } from 'react';
import { Loader2, Search, X, Check, Building2, MapPin, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TripReservation, TripWalletRepository } from '@/repositories/TripWalletRepository';
import { supabase } from '@/lib/supabase';
import { ExperienceRepository } from '@/repositories/ExperienceRepository';
import FlightLookup from './FlightLookup';
import { FlightSearchResult } from '@/utils/flightDataProvider';

interface ReservationComposerProps {
  trip?: any;
  tripId: string;
  destinationId: string;
  moduleType: string;
  onClose: () => void;
  onSave: (res: TripReservation) => void;
  existingReservation?: TripReservation;
}

export default function ReservationComposer({ trip, tripId, destinationId, moduleType, onClose, onSave, existingReservation }: ReservationComposerProps) {
  const [loading, setLoading] = useState(false);
  
  // Base fields
  const [title, setTitle] = useState(existingReservation?.title || '');
  const [provider, setProvider] = useState(existingReservation?.provider || '');
  const [startAt, setStartAt] = useState(existingReservation?.start_at ? existingReservation.start_at.substring(0, 16) : '');
  const [endAt, setEndAt] = useState(existingReservation?.end_at ? existingReservation.end_at.substring(0, 16) : '');
  const [confirmationCode, setConfirmationCode] = useState(existingReservation?.confirmation_code || '');
  const [locationName, setLocationName] = useState(existingReservation?.location_name || '');
  const [structuredData, setStructuredData] = useState<any>(existingReservation?.structured_data || {});

  // Catalog search
  const [searchQuery, setSearchQuery] = useState('');
  const [catalogResults, setCatalogResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showCatalog, setShowCatalog] = useState(false);
  
  // Document Upload State
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Flight Lookup State
  const [isManualFlight, setIsManualFlight] = useState(false);

  useEffect(() => {
    if (['hotel', 'attraction', 'restaurant', 'show'].includes(moduleType)) {
      setShowCatalog(true);
      searchCatalog('');
    }
  }, [moduleType]);

  const searchCatalog = async (query: string) => {
    setIsSearching(true);
    try {
      let data = [];
      if (moduleType === 'hotel') {
        data = await ExperienceRepository.getPublishedHotelsByDestination(destinationId);
        if (query) {
          data = data.filter((item: any) => item.name.toLowerCase().includes(query.toLowerCase()));
        }
      } else {
        data = await ExperienceRepository.searchPublishedExperiencesByDestination(destinationId, moduleType, query);
      }
      setCatalogResults(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectCatalogItem = (item: any) => {
    setTitle(item.name);
    setLocationName(item.neighborhood || item.address || '');
    // Ensure we don't save undefined objects. Just save the string.
    let photoUrl = '';
    if (item.image) {
      photoUrl = item.image;
    } else if (item.media_urls && item.media_urls.length > 0) {
      photoUrl = item.media_urls[0];
    }
    
    setStructuredData({ 
      ...structuredData, 
      catalog_id: item.id,
      photo_url: photoUrl
    });
    setShowCatalog(false);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      let type: any = moduleType;
      // map moduleType to DB enum if needed
      if (type === 'document') type = 'other';
      if (type === 'insurance') type = 'insurance';
      
      // Handle file upload if it's a document
      let finalStructuredData = { ...structuredData };
      if (moduleType === 'document' && fileToUpload) {
         setUploadProgress(10);
         // Generate a unique path
         const user = (await supabase.auth.getUser()).data.user;
         const filePath = `${user?.id}/${tripId}/${Date.now()}_${fileToUpload.name}`;
         
         const { data: uploadData, error: uploadError } = await supabase.storage
            .from('trip-documents')
            .upload(filePath, fileToUpload, {
              cacheControl: '3600',
              upsert: false
            });
            
         if (uploadError) {
            throw new Error(`Erro no upload: ${uploadError.message}`);
         }
         
         setUploadProgress(100);
         finalStructuredData.file_path = uploadData.path;
         finalStructuredData.file_name = fileToUpload.name;
         finalStructuredData.file_type = fileToUpload.type;
         
         // Trigger offline caching in background if possible, or leave to PWA sync
      }

      const res: TripReservation = {
        ...(existingReservation?.id ? { id: existingReservation.id } : {}),
        trip_id: tripId,
        type: type,
        title: title || `${moduleType.toUpperCase()} - Manual`,
        provider,
        purchase_status: 'booked',
        confirmation_code: confirmationCode,
        start_at: startAt ? new Date(startAt).toISOString() : undefined,
        end_at: endAt ? new Date(endAt).toISOString() : undefined,
        location_name: locationName,
        is_fixed: true,
        structured_data: type === 'hotel' ? { ...finalStructuredData, is_basecamp: true } : finalStructuredData
      };

      const saved = await TripWalletRepository.saveReservation(res);
      onSave(saved);
    } catch (e: any) {
      console.error(e);
      alert(e.message || 'Erro ao salvar reserva.');
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  const handleFlightSelected = async (flight: FlightSearchResult) => {
    setLoading(true);
    try {
      const departureTime = flight.departure?.scheduledTime || (flight as any).departureTime;
      const arrivalTime = flight.arrival?.scheduledTime || (flight as any).arrivalTime;
      
      const res: TripReservation = {
        trip_id: tripId,
        type: 'flight',
        title: `Voo ${flight.airlineName || flight.airlineCode || (flight as any).airline} ${flight.flightNumber}`,
        provider: flight.airlineName || flight.airlineCode || (flight as any).airline,
        purchase_status: 'booked',
        start_at: departureTime ? new Date(departureTime).toISOString() : undefined,
        end_at: arrivalTime ? new Date(arrivalTime).toISOString() : undefined,
        location_name: flight.arrival?.iataCode || (flight as any).destinationIata,
        is_fixed: true,
        structured_data: {
          flight_number: `${flight.airlineCode || (flight as any).airline}${flight.flightNumber}`,
          origin: flight.departure?.iataCode || (flight as any).originIata,
          destination: flight.arrival?.iataCode || (flight as any).destinationIata,
          terminal: flight.departure?.terminal || (flight as any).terminal,
          gate: flight.departure?.gate || (flight as any).gate,
          status: flight.status,
          duration: flight.duration,
          is_sandbox: flight.sandbox || (flight as any).isSandbox
        }
      };
      const saved = await TripWalletRepository.saveReservation(res);
      onSave(saved);
    } catch (e) {
      console.error(e);
      alert('Erro ao salvar voo.');
    } finally {
      setLoading(false);
    }
  };

  const renderFields = () => {
    switch (moduleType) {
      case 'flight':
        if (!isManualFlight) {
          return null; // Handled outside renderFields now to pass props cleanly if preferred, or just handled here. Wait, let's just keep it here!
        }
        return (
          <>
            <div className="grid grid-cols-2 gap-3">
               <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Companhia</label>
                  <Input value={provider} onChange={e => setProvider(e.target.value)} placeholder="Ex: LATAM" className="bg-slate-50 border-slate-200" />
               </div>
               <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Número do Voo</label>
                  <Input value={structuredData.flight_number || ''} onChange={e => setStructuredData({...structuredData, flight_number: e.target.value})} placeholder="Ex: LA3210" className="bg-slate-50 border-slate-200" />
               </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
               <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Origem (Aeroporto)</label>
                  <Input value={structuredData.origin || ''} onChange={e => setStructuredData({...structuredData, origin: e.target.value})} placeholder="Ex: GRU" className="bg-slate-50 border-slate-200" />
               </div>
               <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Destino (Aeroporto)</label>
                  <Input value={structuredData.destination || ''} onChange={e => setStructuredData({...structuredData, destination: e.target.value})} placeholder="Ex: JFK" className="bg-slate-50 border-slate-200" />
               </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
               <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Data/Hora Saída</label>
                  <Input type="datetime-local" value={startAt} onChange={e => setStartAt(e.target.value)} className="bg-slate-50 border-slate-200" />
               </div>
               <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Data/Hora Chegada</label>
                  <Input type="datetime-local" value={endAt} onChange={e => setEndAt(e.target.value)} className="bg-slate-50 border-slate-200" />
               </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
               <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Localizador</label>
                  <Input value={confirmationCode} onChange={e => setConfirmationCode(e.target.value)} placeholder="Opcional" className="bg-slate-50 border-slate-200" />
               </div>
               <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Terminal</label>
                  <Input value={structuredData.terminal || ''} onChange={e => setStructuredData({...structuredData, terminal: e.target.value})} placeholder="Opcional" className="bg-slate-50 border-slate-200" />
               </div>
            </div>
          </>
        );
      case 'hotel':
        return (
          <>
            <div>
               <label className="block text-xs font-bold text-slate-700 mb-1">Nome do Hotel</label>
               <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: The Plaza" className="bg-slate-50 border-slate-200" />
            </div>
            <div>
               <label className="block text-xs font-bold text-slate-700 mb-1">Endereço</label>
               <Input value={locationName} onChange={e => setLocationName(e.target.value)} placeholder="Endereço do hotel" className="bg-slate-50 border-slate-200" />
            </div>
            <div className="grid grid-cols-2 gap-3">
               <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Check-in</label>
                  <Input type="datetime-local" value={startAt} onChange={e => setStartAt(e.target.value)} className="bg-slate-50 border-slate-200" />
               </div>
               <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Check-out</label>
                  <Input type="datetime-local" value={endAt} onChange={e => setEndAt(e.target.value)} className="bg-slate-50 border-slate-200" />
               </div>
            </div>
            <div>
               <label className="block text-xs font-bold text-slate-700 mb-1">Código da Reserva</label>
               <Input value={confirmationCode} onChange={e => setConfirmationCode(e.target.value)} placeholder="Opcional" className="bg-slate-50 border-slate-200" />
            </div>
            <div>
               <label className="block text-xs font-bold text-slate-700 mb-1">Observações</label>
               <Input value={structuredData.observations || ''} onChange={e => setStructuredData({...structuredData, observations: e.target.value})} placeholder="Ex: Pedido de cama extra" className="bg-slate-50 border-slate-200" />
            </div>
          </>
        );
      case 'train':
      case 'bus':
        return (
          <>
            <div className="grid grid-cols-2 gap-3">
               <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Empresa</label>
                  <Input value={provider} onChange={e => setProvider(e.target.value)} placeholder="Empresa" className="bg-slate-50 border-slate-200" />
               </div>
               <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Assento</label>
                  <Input value={structuredData.seat || ''} onChange={e => setStructuredData({...structuredData, seat: e.target.value})} placeholder="Ex: 12A" className="bg-slate-50 border-slate-200" />
               </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
               <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Origem (Estação)</label>
                  <Input value={structuredData.origin || ''} onChange={e => setStructuredData({...structuredData, origin: e.target.value})} placeholder="Ex: Gare du Nord" className="bg-slate-50 border-slate-200" />
               </div>
               <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Destino (Estação)</label>
                  <Input value={structuredData.destination || ''} onChange={e => setStructuredData({...structuredData, destination: e.target.value})} placeholder="Ex: St Pancras" className="bg-slate-50 border-slate-200" />
               </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
               <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Partida</label>
                  <Input type="datetime-local" value={startAt} onChange={e => setStartAt(e.target.value)} className="bg-slate-50 border-slate-200" />
               </div>
               <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Chegada</label>
                  <Input type="datetime-local" value={endAt} onChange={e => setEndAt(e.target.value)} className="bg-slate-50 border-slate-200" />
               </div>
            </div>
            <div>
               <label className="block text-xs font-bold text-slate-700 mb-1">Localizador</label>
               <Input value={confirmationCode} onChange={e => setConfirmationCode(e.target.value)} placeholder="Opcional" className="bg-slate-50 border-slate-200" />
            </div>
          </>
        );
      case 'transfer':
        return (
          <>
            <div>
               <label className="block text-xs font-bold text-slate-700 mb-1">Empresa / Motorista</label>
               <Input value={provider} onChange={e => setProvider(e.target.value)} placeholder="Ex: Uber, Transfer Local" className="bg-slate-50 border-slate-200" />
            </div>
            <div className="grid grid-cols-2 gap-3">
               <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Local de Retirada</label>
                  <Input value={structuredData.origin || ''} onChange={e => setStructuredData({...structuredData, origin: e.target.value})} placeholder="Ex: Aeroporto" className="bg-slate-50 border-slate-200" />
               </div>
               <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Destino</label>
                  <Input value={structuredData.destination || ''} onChange={e => setStructuredData({...structuredData, destination: e.target.value})} placeholder="Ex: Hotel" className="bg-slate-50 border-slate-200" />
               </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
               <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Data/Hora</label>
                  <Input type="datetime-local" value={startAt} onChange={e => setStartAt(e.target.value)} className="bg-slate-50 border-slate-200" />
               </div>
               <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Contato/Código</label>
                  <Input value={confirmationCode} onChange={e => setConfirmationCode(e.target.value)} placeholder="Telefone ou código" className="bg-slate-50 border-slate-200" />
               </div>
            </div>
          </>
        );
      case 'attraction':
      case 'show':
      case 'restaurant':
        return (
          <>
            <div>
               <label className="block text-xs font-bold text-slate-700 mb-1">Nome do Local</label>
               <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Nome" className="bg-slate-50 border-slate-200" />
            </div>
            <div>
               <label className="block text-xs font-bold text-slate-700 mb-1">Data e Hora</label>
               <Input type="datetime-local" value={startAt} onChange={e => setStartAt(e.target.value)} className="bg-slate-50 border-slate-200" />
            </div>
            {moduleType !== 'restaurant' && (
              <div>
                 <label className="block text-xs font-bold text-slate-700 mb-1">Quantidade de Ingressos</label>
                 <Input type="number" value={structuredData.quantity || ''} onChange={e => setStructuredData({...structuredData, quantity: e.target.value})} className="bg-slate-50 border-slate-200" />
              </div>
            )}
            {moduleType === 'restaurant' && (
              <div>
                 <label className="block text-xs font-bold text-slate-700 mb-1">Número de Pessoas</label>
                 <Input type="number" value={structuredData.guests || ''} onChange={e => setStructuredData({...structuredData, guests: e.target.value})} className="bg-slate-50 border-slate-200" />
              </div>
            )}
            <div>
               <label className="block text-xs font-bold text-slate-700 mb-1">Código da Reserva / Ingresso</label>
               <Input value={confirmationCode} onChange={e => setConfirmationCode(e.target.value)} placeholder="Opcional" className="bg-slate-50 border-slate-200" />
            </div>
            <div>
               <label className="block text-xs font-bold text-slate-700 mb-1">Observações</label>
               <Input value={structuredData.observations || ''} onChange={e => setStructuredData({...structuredData, observations: e.target.value})} className="bg-slate-50 border-slate-200" />
            </div>
          </>
        );
      case 'insurance':
        return (
          <>
            <div>
               <label className="block text-xs font-bold text-slate-700 mb-1">Seguradora</label>
               <Input value={provider} onChange={e => setProvider(e.target.value)} placeholder="Ex: Allianz" className="bg-slate-50 border-slate-200" />
            </div>
            <div>
               <label className="block text-xs font-bold text-slate-700 mb-1">Número da Apólice</label>
               <Input value={confirmationCode} onChange={e => setConfirmationCode(e.target.value)} placeholder="Apólice" className="bg-slate-50 border-slate-200" />
            </div>
            <div className="grid grid-cols-2 gap-3">
               <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Início</label>
                  <Input type="date" value={startAt.substring(0,10)} onChange={e => setStartAt(e.target.value)} className="bg-slate-50 border-slate-200" />
               </div>
               <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Fim</label>
                  <Input type="date" value={endAt.substring(0,10)} onChange={e => setEndAt(e.target.value)} className="bg-slate-50 border-slate-200" />
               </div>
            </div>
            <div>
               <label className="block text-xs font-bold text-slate-700 mb-1">Contato de Emergência</label>
               <Input value={structuredData.emergency_contact || ''} onChange={e => setStructuredData({...structuredData, emergency_contact: e.target.value})} placeholder="Telefone" className="bg-slate-50 border-slate-200" />
            </div>
          </>
        );
      case 'document':
        return (
          <>
            <div>
               <label className="block text-xs font-bold text-slate-700 mb-1">Tipo de Documento</label>
               <Input value={structuredData.doc_type || ''} onChange={e => setStructuredData({...structuredData, doc_type: e.target.value})} placeholder="Ex: Passaporte, Visto, Ingresso PDF" className="bg-slate-50 border-slate-200" />
            </div>
            <div>
               <label className="block text-xs font-bold text-slate-700 mb-1">Título</label>
               <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Visto Americano" className="bg-slate-50 border-slate-200" />
            </div>
            
            <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl p-4 text-center">
               <label className="cursor-pointer flex flex-col items-center gap-2">
                 <input 
                   type="file" 
                   className="hidden" 
                   accept="application/pdf,image/*" 
                   onChange={(e) => {
                     if (e.target.files && e.target.files.length > 0) {
                       setFileToUpload(e.target.files[0]);
                     }
                   }}
                 />
                 <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center border border-slate-200 shadow-sm">
                   <FileText className="w-5 h-5 text-slate-500" />
                 </div>
                 <div>
                   <span className="text-sm font-bold text-lime-600 block">
                     {fileToUpload ? fileToUpload.name : 'Selecionar arquivo (PDF, JPG, PNG)'}
                   </span>
                   {!fileToUpload && <span className="text-xs text-slate-400">para ficar disponível offline</span>}
                 </div>
               </label>
            </div>
            
            {uploadProgress > 0 && uploadProgress < 100 && (
              <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2">
                <div className="bg-lime-500 h-1.5 rounded-full" style={{ width: `${uploadProgress}%` }}></div>
              </div>
            )}

            <div>
               <label className="block text-xs font-bold text-slate-700 mb-1">Observações</label>
               <Input value={structuredData.observations || ''} onChange={e => setStructuredData({...structuredData, observations: e.target.value})} className="bg-slate-50 border-slate-200" />
            </div>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm relative">
      <button 
        onClick={onClose}
        className="absolute top-6 right-6 text-slate-400 hover:text-slate-700"
      >
        <X className="w-5 h-5" />
      </button>

      <h4 className="font-extrabold text-xl text-slate-800 mb-6 capitalize">Adicionar {moduleType}</h4>

      {showCatalog && (
        <div className="mb-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input 
              placeholder={`Buscar no catálogo...`}
              className="h-12 pl-12 rounded-xl bg-slate-50 border-slate-200"
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                searchCatalog(e.target.value);
              }}
            />
          </div>

          {catalogResults.length > 0 && (
            <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
              {catalogResults.map(item => (
                 <button 
                   key={item.id} 
                   onClick={() => handleSelectCatalogItem(item)}
                   className="w-full flex items-center gap-4 p-3 rounded-xl border border-slate-100 hover:border-lime-500 hover:bg-lime-50/20 transition-colors text-left group"
                 >
                   <div className="w-12 h-12 bg-slate-100 rounded-lg overflow-hidden shrink-0">
                     {(item.image || (item.media_urls && item.media_urls[0])) ? (
                       <img src={item.image || item.media_urls[0]} alt={item.name} className="w-full h-full object-cover" />
                     ) : (
                       <MapPin className="w-5 h-5 text-slate-400 m-auto mt-3.5" />
                     )}
                   </div>
                   <div>
                     <h5 className="font-bold text-slate-800 text-sm group-hover:text-lime-600 transition-colors line-clamp-1">{item.name}</h5>
                     <p className="text-xs text-slate-500 line-clamp-1">{item.neighborhood || 'Bairro'} &middot; {item.address || 'Endereço não cadastrado'}</p>
                   </div>
                 </button>
              ))}
            </div>
          )}
          
          {moduleType === 'hotel' && catalogResults.length === 0 && !isSearching && (
            <div className="text-center py-6 bg-slate-50 rounded-xl border border-slate-100">
              <Building2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-600 mb-4">Nenhuma hospedagem cadastrada para este destino.</p>
              <button onClick={() => setShowCatalog(false)} className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-bold hover:bg-slate-800">
                Adicionar hospedagem manualmente
              </button>
            </div>
          )}

          {!(moduleType === 'hotel' && catalogResults.length === 0 && !isSearching) && (
            <div className="text-center pt-2 border-t border-slate-100">
               <button onClick={() => setShowCatalog(false)} className="text-sm font-bold text-lime-600 hover:underline">
                 Ou preencher dados manualmente +
               </button>
            </div>
          )}
        </div>
      )}

      {(!showCatalog && (moduleType !== 'flight' || isManualFlight)) && (
        <div className="space-y-4 mt-6">
          {renderFields()}
          
          <Button 
            onClick={handleSubmit}
            disabled={loading}
            className="w-full h-12 mt-4 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Salvar'}
          </Button>
          
          {['hotel', 'attraction', 'restaurant', 'show'].includes(moduleType) && (
            <div className="text-center mt-4">
               <button onClick={() => setShowCatalog(true)} className="text-xs font-bold text-slate-400 hover:text-slate-600">
                 Voltar para busca no catálogo
               </button>
            </div>
          )}
        </div>
      )}

      {moduleType === 'flight' && !isManualFlight && (
        <div className="mt-6">
          <FlightLookup 
            tripStartDate={trip?.start_date}
            tripEndDate={trip?.end_date}
            onFlightSelected={handleFlightSelected} 
            onManualFallback={() => setIsManualFlight(true)} 
          />
        </div>
      )}

    </div>
  );
}
