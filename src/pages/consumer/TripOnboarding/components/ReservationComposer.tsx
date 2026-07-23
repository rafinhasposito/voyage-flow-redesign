import React, { useState, useEffect } from 'react';
import { Loader2, Search, X, Check, Building2, MapPin, FileText } from 'lucide-react';
import { AirportTimezoneProvider } from '@/utils/AirportTimezoneProvider';
import { DatePicker } from '@/components/ui/DatePicker';
import { normalizeFlightDateTime } from '@/utils/timezoneNormalizer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TripReservation, TripWalletRepository } from '@/repositories/TripWalletRepository';
import { supabase } from '@/lib/supabase';
import { ExperienceRepository } from '@/repositories/ExperienceRepository';
import FlightLookup from './FlightLookup';
import { FlightSearchResult } from '@/utils/flightDataProvider';

function compareUtcInstants(expected: string | null | undefined, actual: string | null | undefined) {
  if (!expected || !actual) return { equal: false, reason: 'ausência de valor' };
  const expectedMs = Date.parse(expected);
  const actualMs = Date.parse(actual);
  if (!Number.isFinite(expectedMs) || !Number.isFinite(actualMs)) {
    return { equal: false, reason: 'timestamp inválido' };
  }
  const differenceMs = Math.abs(expectedMs - actualMs);
  return {
    equal: differenceMs <= 1000,
    expectedEpoch: expectedMs,
    actualEpoch: actualMs,
    differenceMs
  };
}

function compareTextField(expected: string | null | undefined, actual: string | null | undefined) {
  const e = (expected || '').trim().toUpperCase();
  const a = (actual || '').trim().toUpperCase();
  if (e !== a) return { equal: false, expected: e, actual: a };
  return { equal: true };
}

function compareLocalDateTimeField(expected: string | null | undefined, actual: string | null | undefined) {
  const normalizeSec = (str: string) => {
      const s = (str || '').trim();
      if (!s) return s;
      if (s.length === 16) return s + ':00'; // YYYY-MM-DDTHH:mm -> YYYY-MM-DDTHH:mm:ss
      return s;
  }
  const e = normalizeSec(expected);
  const a = normalizeSec(actual);
  if (e !== a) return { equal: false, expected: e, actual: a };
  return { equal: true };
}

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

  const [previewData, setPreviewData] = useState<any>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [readbackFailed, setReadbackFailed] = useState<{failed: boolean, field?: string, diffInfo?: any}>({ failed: false });
  const [savedReservationId, setSavedReservationId] = useState<string | null>(null);

  // Flight Lookup State
  const [isManualFlight, setIsManualFlight] = useState(true);

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
    if (!tripId) return;
    if (!title.trim() && moduleType !== 'flight' && moduleType !== 'document') {
      alert('Preencha o nome da reserva.');
      return;
    }
    setLoading(true);

    try {
      let finalStartAt = startAt ? new Date(startAt).toISOString() : undefined;
      let finalEndAt = endAt ? new Date(endAt).toISOString() : undefined;
      let finalStructuredData = { ...structuredData };

      if (moduleType === 'flight' && isManualFlight) {
        if (!structuredData.flight_number || structuredData.flight_number.trim() === '') {
          alert('Número do voo ausente ou inválido.');
          setLoading(false);
          return;
        }

        if (structuredData.origin && structuredData.destination && structuredData.origin === structuredData.destination) {
          alert('A origem não pode ser igual ao destino.');
          setLoading(false);
          return;
        }

        let depTz = structuredData.departure_timezone || undefined;
        let arrTz = structuredData.arrival_timezone || undefined;

        // Resolve timezones via Provider if absent
        const depTzRes = AirportTimezoneProvider.resolveTimezone(structuredData.origin, depTz, depTz);
        const arrTzRes = AirportTimezoneProvider.resolveTimezone(structuredData.destination, arrTz, arrTz);

        depTz = depTzRes.timezone || undefined;
        arrTz = arrTzRes.timezone || undefined;

        if (!depTz || !arrTz) {
          alert('Não foi possível identificar o fuso horário deste aeroporto. Selecione o fuso para continuar.');
          setLoading(false);
          return;
        }

        const normDep = normalizeFlightDateTime({ inputString: startAt, airportCode: structuredData.origin, timezone: depTz, sourceOverride: 'manual' });
        const normArr = normalizeFlightDateTime({ inputString: endAt, airportCode: structuredData.destination, timezone: arrTz, sourceOverride: 'manual' });

        if (!normDep.valid || !normArr.valid) {
          alert('Preencha os horários completos de partida e chegada.');
          setLoading(false);
          return;
        }

        if (normArr.utcInstant && normDep.utcInstant) {
          if (new Date(normArr.utcInstant) < new Date(normDep.utcInstant)) {
            alert('A chegada não pode ser anterior à partida.');
            setLoading(false);
            return;
          }
        }

        finalStartAt = normDep.utcInstant;
        finalEndAt = normArr.utcInstant;

        finalStructuredData = {
          ...structuredData,
          departure_local_datetime: `${normDep.localDate}T${normDep.localTime}`,
          arrival_local_datetime: `${normArr.localDate}T${normArr.localTime}`,
          departure_timezone: normDep.timezone,
          arrival_timezone: normArr.timezone,
          departure_timezone_source: depTzRes.source,
          arrival_timezone_source: arrTzRes.source,
          provider: 'manual',
          normalization_confidence: normDep.confidence
        };
      }

      let type: any = moduleType;
      // map moduleType to DB enum if needed
      if (type === 'document') type = 'other';
      if (type === 'insurance') type = 'insurance';

      // Handle file upload if it's a document
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
      }

      const res: TripReservation = {
        ...(existingReservation?.id ? { id: existingReservation.id } : {}),
        trip_id: tripId,
        type: type,
        title: title || provider || `${moduleType.toUpperCase()} - Manual`,
        provider,
        purchase_status: 'booked',
        confirmation_code: confirmationCode,
        start_at: finalStartAt,
        end_at: finalEndAt,
        location_name: locationName,
        is_fixed: true,
        structured_data: type === 'hotel' ? { ...finalStructuredData, is_basecamp: true } : finalStructuredData
      };

      setPreviewData(res);
      setLoading(false);
    } catch (e) {
      console.error(e);
      alert('Erro ao processar dados.');
    } finally {
      setLoading(false);
      setUploadProgress(0);
   }
  };

  const confirmSavedReservation = async (reservationId: string, expectedPayload: any) => {
    try {
      const allReservations = await TripWalletRepository.getReservations(tripId);
      const verify = allReservations.find(r => r.id === reservationId);

      if (!verify) {
         setReadbackFailed({ failed: true, field: 'reserva_nao_encontrada' });
         return;
      }

      const expected = expectedPayload;
      const v = verify;

      // Semantic comparisons
      const checkUtc = (field: string, exp: any, act: any) => {
          const diff = compareUtcInstants(exp, act);
          if (!diff.equal) {
              setReadbackFailed({ failed: true, field, diffInfo: diff });
              throw new Error(`Divergência: ${field}`);
          }
      };

      const checkText = (field: string, exp: any, act: any) => {
          const diff = compareTextField(exp, act);
          if (!diff.equal) {
              setReadbackFailed({ failed: true, field, diffInfo: diff });
              throw new Error(`Divergência: ${field}`);
          }
      };

      const checkLocal = (field: string, exp: any, act: any) => {
          const diff = compareLocalDateTimeField(exp, act);
          if (!diff.equal) {
              setReadbackFailed({ failed: true, field, diffInfo: diff });
              throw new Error(`Divergência: ${field}`);
          }
      };

      checkUtc('start_at', expected.start_at, v.start_at);
      checkUtc('end_at', expected.end_at, v.end_at);

      if (expected.type === 'flight' && expected.structured_data) {
          const sE = expected.structured_data;
          const sV = v.structured_data || {};

          if (sE.airline_code) checkText('airline_code', sE.airline_code, sV.airline_code);
          checkText('flight_number', sE.flight_number, sV.flight_number);
          checkText('origin_airport', sE.origin_airport || sE.origin, sV.origin_airport || sV.origin);
          checkText('destination_airport', sE.destination_airport || sE.destination, sV.destination_airport || sV.destination);

          checkLocal('departure_local_datetime', sE.departure_local_datetime, sV.departure_local_datetime);
          checkText('departure_timezone', sE.departure_timezone, sV.departure_timezone);
          checkText('departure_timezone_source', sE.departure_timezone_source, sV.departure_timezone_source);

          checkLocal('arrival_local_datetime', sE.arrival_local_datetime, sV.arrival_local_datetime);
          checkText('arrival_timezone', sE.arrival_timezone, sV.arrival_timezone);
          checkText('arrival_timezone_source', sE.arrival_timezone_source, sV.arrival_timezone_source);

          checkText('normalization_confidence', sE.normalization_confidence, sV.normalization_confidence);
      }

      setReadbackFailed({ failed: false });
      setSaveSuccess(true);
      setTimeout(() => {
        onSave(v); // pass back the verified row
      }, 2000);
    } catch (e: any) {
      console.warn('Readback failed:', e.message);
    }
  };

  const handleSave = async () => {
    if (!previewData) return;
    setLoading(true);
    setReadbackFailed({ failed: false });
    try {
      let rId = savedReservationId;

      // Duplication Protection
      if (!rId) {
         const allReservations = await TripWalletRepository.getReservations(tripId);
         const pData = previewData;

         const existingFlight = allReservations.find(r => {
             if (r.type !== 'flight' || pData.type !== 'flight') return false;

             const rSd = r.structured_data || {};
             const pSd = pData.structured_data || {};

             const sameFlightNum = rSd.flight_number === pSd.flight_number;
             const sameOrigin = (rSd.origin_airport || rSd.origin) === (pSd.origin_airport || pSd.origin);
             const sameDest = (rSd.destination_airport || rSd.destination) === (pSd.destination_airport || pSd.destination);

             const rDepLocal = (rSd.departure_local_datetime || '').trim().replace(/:00$/, '');
             const pDepLocal = (pSd.departure_local_datetime || '').trim().replace(/:00$/, '');
             const sameDepTime = rDepLocal === pDepLocal;

             return sameFlightNum && sameOrigin && sameDest && sameDepTime;
         });

         if (existingFlight) {
             console.log("Voo equivalente encontrado, reutilizando ID:", existingFlight.id);
             rId = existingFlight.id!;
             setSavedReservationId(rId);
         }
      }

      if (!rId) {
        const saved = await TripWalletRepository.saveReservation(previewData);
        if (!saved || !saved.id) throw new Error("Não foi possível salvar o voo.");
        rId = saved.id;
        setSavedReservationId(rId);
      }

      await confirmSavedReservation(rId, previewData);

    } catch (e: any) {
      console.error(e);
      alert(e.message || 'Erro ao processar o salvamento do voo.');
    } finally {
      setLoading(false);
    }
  };

  const handleFlightSelected = async (flight: FlightSearchResult) => {
    setLoading(true);
    try {
      if (!flight.flightNumber || flight.flightNumber.trim() === '') {
        alert('Número do voo ausente ou inválido.');
        setLoading(false);
        return;
      }

      if (flight.departure?.iataCode && flight.arrival?.iataCode && flight.departure.iataCode === flight.arrival.iataCode) {
        alert('A origem não pode ser igual ao destino.');
        setLoading(false);
        return;
      }

      const departureTimeInput = flight.departure?.scheduledTime;
      const arrivalTimeInput = flight.arrival?.scheduledTime;

      const depTzRes = AirportTimezoneProvider.resolveTimezone(flight.departure?.iataCode, flight.departure?.timezone);
      const arrTzRes = AirportTimezoneProvider.resolveTimezone(flight.arrival?.iataCode, flight.arrival?.timezone);

      if (!depTzRes.timezone || !arrTzRes.timezone) {
        alert('Não foi possível identificar o fuso horário deste aeroporto. Selecione o fuso manualmente.');
        setIsManualFlight(true);
        setStructuredData({
           ...structuredData,
           origin: flight.departure?.iataCode,
           destination: flight.arrival?.iataCode,
           flight_number: flight.flightNumber
        });
        setLoading(false);
        return;
      }

      const normDep = normalizeFlightDateTime({
        inputString: departureTimeInput,
        airportCode: flight.departure?.iataCode,
        timezone: depTzRes.timezone,
        sourceOverride: depTzRes.source as any
      });

      const normArr = normalizeFlightDateTime({
        inputString: arrivalTimeInput,
        airportCode: flight.arrival?.iataCode,
        timezone: arrTzRes.timezone,
        sourceOverride: arrTzRes.source as any
      });

      if (!normDep.valid || !normArr.valid) {
        alert('Não foi possível identificar os horários completos deste voo. Complete os dados manualmente.');
        setIsManualFlight(true);
        setLoading(false);
        return;
      }

      if (normArr.utcInstant && normDep.utcInstant) {
        if (new Date(normArr.utcInstant) < new Date(normDep.utcInstant)) {
          alert('A chegada não pode ser anterior à partida.');
          setLoading(false);
          return;
        }
      }

      const res: TripReservation = {
        trip_id: tripId,
        type: 'flight',
        title: `Voo ${flight.airlineName || flight.airlineCode} ${flight.flightNumber}`,
        provider: flight.airlineName || flight.airlineCode,
        purchase_status: 'booked',
        start_at: normDep.utcInstant,
        end_at: normArr.utcInstant,
        location_name: flight.arrival?.iataCode,
        is_fixed: true,
        structured_data: {
          flight_number: flight.flightNumber,
          airline_code: flight.airlineCode,
          airline_name: flight.airlineName,
          origin_airport: flight.departure?.iataCode,
          destination_airport: flight.arrival?.iataCode,
          departure_local_datetime: `${normDep.localDate}T${normDep.localTime}`,
          departure_timezone: normDep.timezone,
          departure_timezone_source: depTzRes.source,
          arrival_local_datetime: `${normArr.localDate}T${normArr.localTime}`,
          arrival_timezone: normArr.timezone,
          arrival_timezone_source: arrTzRes.source,
          departure_terminal: flight.departure?.terminal,
          arrival_terminal: flight.arrival?.terminal,
          gate: flight.departure?.gate,
          status: flight.status,
          duration: flight.duration,
          provider: 'amadeus',
          normalization_confidence: normDep.confidence
        }
      };

      setPreviewData(res);
      setLoading(false);
    } catch (e) {
      console.error(e);
      alert('Erro ao processar dados do voo.');
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
                  <Input value={structuredData.origin || ''} onChange={e => {
                      const val = e.target.value.toUpperCase();
                      const tz = AirportTimezoneProvider.resolveTimezone(val);
                      setStructuredData({...structuredData, origin: val, departure_timezone: tz.timezone || ''});
                  }} placeholder="Ex: GRU" className="bg-slate-50 border-slate-200 uppercase" />
               </div>
               <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Destino (Aeroporto)</label>
                  <Input value={structuredData.destination || ''} onChange={e => {
                      const val = e.target.value.toUpperCase();
                      const tz = AirportTimezoneProvider.resolveTimezone(val);
                      setStructuredData({...structuredData, destination: val, arrival_timezone: tz.timezone || ''});
                  }} placeholder="Ex: JFK" className="bg-slate-50 border-slate-200 uppercase" />
               </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
               <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Timezone Origem</label>
                  <Input value={structuredData.departure_timezone || ''} onChange={e => setStructuredData({...structuredData, departure_timezone: e.target.value})} placeholder="America/Sao_Paulo" className="bg-slate-50 border-slate-200" />
               </div>
               <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Timezone Destino</label>
                  <Input value={structuredData.arrival_timezone || ''} onChange={e => setStructuredData({...structuredData, arrival_timezone: e.target.value})} placeholder="America/New_York" className="bg-slate-50 border-slate-200" />
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

      {saveSuccess && (
        <div className="mt-6 p-6 bg-lime-50 rounded-xl border border-lime-200 text-center">
          <Check className="w-12 h-12 text-lime-500 mx-auto mb-3" />
          <h5 className="font-bold text-lime-800 text-lg">Voo salvo e confirmado.</h5>
          <p className="text-lime-600 text-sm mt-1">A persistência dos horários locais e UTC foi validada semanticamente.</p>
        </div>
      )}

      {readbackFailed.failed && !saveSuccess && (
        <div className="mt-6 p-6 bg-amber-50 rounded-xl border border-amber-200 text-center">
          <h5 className="font-bold text-amber-800 text-lg">O voo foi salvo, mas não foi possível confirmar todos os dados.</h5>
          <p className="text-amber-700 text-sm mt-1">
             Houve uma divergência no campo: <strong className="font-mono">{readbackFailed.field}</strong>.
          </p>
          {readbackFailed.diffInfo && (
            <div className="mt-2 text-left bg-white/50 p-3 rounded text-xs text-amber-900 font-mono overflow-auto max-h-32">
               Expected: {JSON.stringify(readbackFailed.diffInfo.expectedEpoch || readbackFailed.diffInfo.expected)}<br/>
               Actual: {JSON.stringify(readbackFailed.diffInfo.actualEpoch || readbackFailed.diffInfo.actual)}<br/>
               {readbackFailed.diffInfo.differenceMs !== undefined && <span>Diff (ms): {readbackFailed.diffInfo.differenceMs}</span>}
            </div>
          )}
          <div className="mt-4 flex gap-3 justify-center">
             <Button onClick={() => confirmSavedReservation(savedReservationId!, previewData)} disabled={loading} className="bg-amber-600 hover:bg-amber-700 text-white font-bold h-10 px-4 rounded-lg">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Tentar confirmar novamente'}
             </Button>
             <button onClick={() => { setPreviewData(null); setReadbackFailed({failed: false}); }} className="text-sm font-bold text-slate-500 hover:text-slate-700">
               Revisar dados
             </button>
          </div>
        </div>
      )}

      {previewData && !saveSuccess && !readbackFailed.failed && (
        <div className="mt-6 space-y-4">
           <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <h5 className="font-bold text-slate-800 text-sm mb-3">Revisão do Voo</h5>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <span className="text-xs text-slate-500 font-bold block">Partida</span>
                    <span className="text-sm font-bold text-slate-800 block">
                      {previewData.structured_data?.departure_local_datetime?.replace('T', ' às ')}
                    </span>
                    <span className="text-xs text-slate-500 block">
                      {previewData.structured_data?.origin_airport || previewData.structured_data?.origin} · {previewData.structured_data?.departure_timezone}
                    </span>
                 </div>
                 <div>
                    <span className="text-xs text-slate-500 font-bold block">Chegada</span>
                    <span className="text-sm font-bold text-slate-800 block">
                      {previewData.structured_data?.arrival_local_datetime?.replace('T', ' às ')}
                    </span>
                    <span className="text-xs text-slate-500 block">
                      {previewData.structured_data?.destination_airport || previewData.structured_data?.destination} · {previewData.structured_data?.arrival_timezone}
                    </span>
                 </div>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-200">
                <span className="text-xs text-slate-400 block font-mono">Diagnóstico Interno:</span>
                <span className="text-xs text-slate-400 block font-mono">UTC Partida: {previewData.start_at}</span>
                <span className="text-xs text-slate-400 block font-mono">UTC Chegada: {previewData.end_at}</span>
                <span className="text-xs text-slate-400 block font-mono">Source: {previewData.structured_data?.departure_timezone_source}</span>
                <span className="text-xs text-slate-400 block font-mono">Confidence: {previewData.structured_data?.normalization_confidence}</span>
              </div>
           </div>

           <Button
             onClick={handleSave}
             disabled={loading}
             className="w-full h-12 rounded-xl bg-lime-500 text-white font-bold hover:bg-lime-600"
           >
             {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (savedReservationId ? 'Tentar confirmar novamente' : 'Confirmar e Salvar')}
           </Button>

           <button onClick={() => setPreviewData(null)} className="w-full text-center text-sm font-bold text-slate-500 hover:text-slate-700 mt-2">
             Voltar e editar
           </button>
        </div>
      )}

      {(!showCatalog && !previewData && !saveSuccess && (moduleType !== 'flight' || isManualFlight)) && (
        <div className="space-y-4 mt-6">
          {renderFields()}

          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full h-12 mt-4 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Revisar Dados'}
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

      {moduleType === 'flight' && !isManualFlight && !previewData && !saveSuccess && (
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
