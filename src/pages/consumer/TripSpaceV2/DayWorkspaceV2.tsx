import React, { useState, useMemo, useEffect } from 'react';
import { 
  Clock, MapPin, DollarSign, CheckCircle2, ChevronRight, ChevronDown,
  ArrowUp, ArrowDown, Shuffle, CloudRain, Navigation, AlertCircle, Info, Plane, Plus, Lock, Unlock, Zap, Calendar, CloudSun, Sun, Moon, Sparkles
} from 'lucide-react';
import { TripSpaceDay, TripSpaceStop, TripSpaceBasecamp } from '@/types/tripSpace.types';
import MapLibreMap from '@/components/MapLibreMap';
import { DefaultAttractionCardV2 } from './cards/DefaultAttractionCardV2';
import { FlightCard } from '@/pages/consumer/TripSpace/cards/FlightCard';
import { ImmigrationCard } from '@/pages/consumer/TripSpace/cards/ImmigrationCard';
import { TransportCard } from '@/pages/consumer/TripSpace/cards/TransportCard';
import { LuggageCard } from '@/pages/consumer/TripSpace/cards/LuggageCard';
import { CoffeeBreakCard } from '@/pages/consumer/TripSpace/cards/CoffeeBreakCard';
import { ConciergePromptCard } from '@/pages/consumer/TripSpace/cards/ConciergePromptCard';
import { ExperienceDetailModalV2 } from './ExperienceDetailModalV2';
import { GamifiedConciergeModal } from '@/pages/consumer/TripSpace/cards/GamifiedConciergeModal';
import { ManualCatalogBrowserModal } from '@/pages/consumer/TripSpace/cards/ManualCatalogBrowserModal';
import { NextStepCard } from '@/pages/consumer/TripSpace/cards/NextStepCard';
import { MobileDaySelector } from '@/pages/consumer/TripSpace/cards/MobileDaySelector';
import { isDateToday } from '@/pages/consumer/TripSpace/utils/dayProgress';
import { getTravelHint, isLongHop } from '@/pages/consumer/BdayRafaRoteiroNY/logistics';

interface DayWorkspaceV2Props {
  tripId: string;
  userId?: string;
  days: TripSpaceDay[];
  activeDay: number;
  onDayChange: (dayNum: number) => void;
  basecamp?: TripSpaceBasecamp;
  onToggleLock?: (activityId: string, isLocked: boolean) => void;
  onCreateDraft?: (intent: import('@/domain/itinerary-engine/edit-intents').ItineraryEditIntent) => void;
  onExecuteDirectAction?: (intent: import('@/domain/itinerary-engine/edit-intents').ItineraryEditIntent) => void;
  onCommitDraft?: () => void;
  onClearDraft?: () => void;
  editDraft?: import('@/domain/itinerary-engine/edit-intents').ItineraryEditDraft | null;
  draftLoading?: boolean;
  catalog?: any[];
}

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; 
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function parseTimeStr(timeStr?: string): number {
  if (!timeStr) return 0;
  const [hh, mm] = timeStr.split(':').map(Number);
  if (isNaN(hh) || isNaN(mm)) return 0;
  return hh * 60 + mm;
}

function parseDurationMins(duration?: string): number | null {
  if (!duration) return null;
  const trimmed = duration.trim();
  if (/^\d+$/.test(trimmed)) return parseInt(trimmed, 10);
  const match = trimmed.match(/(\d+)\s*(h|min)/g);
  if (match) {
    let total = 0;
    match.forEach(m => {
      if (m.includes('h')) total += parseInt(m) * 60;
      if (m.includes('min')) total += parseInt(m);
    });
    if (total > 0) return total;
  }
  return null;
}

function getStopPriority(stop: TripSpaceStop): number {
  const lower = stop.title.toLowerCase();
  if (stop.category === 'flight' || lower.includes('voo')) return 0;
  if (lower.includes('imigração')) return 1;
  if (lower.includes('bagagem') || lower.includes('guarda-volumes') || lower.includes('guarda de bagagem')) return 2;
  if (lower.includes('deslocamento')) return 3;
  if (stop.category === 'lodging') return 4;
  return 5;
}

function reorderLogisticClusters(stops: TripSpaceStop[]): TripSpaceStop[] {
  const result = [...stops];
  let i = 0;
  while (i < result.length) {
    if (getStopPriority(result[i]) <= 4) {
      let j = i;
      while (j < result.length && getStopPriority(result[j]) <= 4) j++;
      const cluster = result.slice(i, j).sort((a, b) => getStopPriority(a) - getStopPriority(b));
      for (let k = 0; k < cluster.length; k++) result[i + k] = cluster[k];
      i = j;
    } else {
      i++;
    }
  }
  return result;
}

export function DayWorkspaceV2({ 
  tripId, userId, days, activeDay, onDayChange, basecamp, catalog,
  onToggleLock, onCreateDraft, onExecuteDirectAction, onCommitDraft, onClearDraft, editDraft, draftLoading 
}: DayWorkspaceV2Props) {
  const [selectedStopId, setSelectedStopId] = useState<string | null>(null);
  const [detailModalStop, setDetailModalStop] = useState<TripSpaceStop | null>(null);
  const [directionsStop, setDirectionsStop] = useState<TripSpaceStop | null>(null);
  const [isGamifiedModalOpen, setIsGamifiedModalOpen] = useState(false);
  const [activeGamifiedStop, setActiveGamifiedStop] = useState<TripSpaceStop | null>(null);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  useEffect(() => {
    const handleOpenAddModal = () => setIsManualModalOpen(true);
    window.addEventListener('OPEN_ADD_EXPERIENCE_MODAL', handleOpenAddModal);
    return () => window.removeEventListener('OPEN_ADD_EXPERIENCE_MODAL', handleOpenAddModal);
  }, []);

  const currentDay = days.find(d => d.dayNumber === activeDay) || days[0];
  const catalogItems = catalog || [];

  const orderedDayStops = useMemo(
    () => reorderLogisticClusters(currentDay?.stops || []),
    [currentDay]
  );

  const stopMapPoints = orderedDayStops.filter(s => s.lat && s.lng).map(s => ({
    id: s.id,
    name: s.title,
    neighborhood: s.neighborhood,
    coordinates: { lat: s.lat!, lng: s.lng! },
  }));
  const hasBasecampCoords = !!(basecamp?.lat && basecamp?.lng);
  const mapPoints = [
    ...(hasBasecampCoords ? [{
      id: 'basecamp',
      name: basecamp!.name,
      neighborhood: 'Basecamp',
      coordinates: { lat: basecamp!.lat!, lng: basecamp!.lng! },
      isBasecamp: true,
    }] : []),
    ...stopMapPoints,
  ];

  const dailyStats = useMemo(() => {
    let totalKm = 0;
    let totalMins = 0;
    const validPoints = [
      ...(basecamp?.lat != null && basecamp?.lng != null ? [{ lat: basecamp.lat, lng: basecamp.lng }] : []),
      ...orderedDayStops.filter(s => s.lat != null && s.lng != null).map(s => ({ lat: s.lat!, lng: s.lng! }))
    ];
    for (let i = 0; i < validPoints.length - 1; i++) {
      const hint = getTravelHint(validPoints[i], validPoints[i + 1]);
      if (hint) {
        totalKm += hint.km;
        totalMins += hint.minutes;
      }
    }
    return { totalKm, totalMins };
  }, [basecamp, orderedDayStops]);

  const getLogisticAlert = (stop: TripSpaceStop, nextStop: TripSpaceStop) => {
    if (!stop.lat || !stop.lng || !nextStop.lat || !nextStop.lng || !stop.time || !nextStop.time) return null;
    const currentStart = parseTimeStr(stop.time);
    const nextStart = parseTimeStr(nextStop.time);
    let durationMins = 60; 
    if (stop.duration) {
      const match = stop.duration.match(/(\d+)\s*(h|min)/g);
      if (match) {
        let total = 0;
        match.forEach(m => {
          if (m.includes('h')) total += parseInt(m) * 60;
          if (m.includes('min')) total += parseInt(m);
        });
        if (total > 0) durationMins = total;
      } else if (stop.duration.includes('min')) {
        durationMins = parseInt(stop.duration) || 60;
      }
    }
    const timeGap = nextStart - (currentStart + durationMins);
    if (timeGap < 0) return "Conflito de horário: As atividades se sobrepõem.";
    const distanceKm = haversineDistance(stop.lat, stop.lng, nextStop.lat, nextStop.lng);
    const estimatedTransitMins = Math.ceil(distanceKm * 12); 
    if (estimatedTransitMins > timeGap) {
      return `Atrito logístico: O deslocamento de ~${estimatedTransitMins} min inviabiliza a janela de ${timeGap} min.`;
    }
    return null;
  };

  const morningStops = orderedDayStops.filter(s => {
    const t = parseTimeStr(s.time);
    return t >= 0 && t < 12 * 60;
  });

  const afternoonStops = orderedDayStops.filter(s => {
    const t = parseTimeStr(s.time);
    return t >= 12 * 60 && t < 18 * 60;
  });

  const nightStops = orderedDayStops.filter(s => {
    const t = parseTimeStr(s.time);
    return t >= 18 * 60;
  });

  const getFullDateLabel = (fullDateStr?: string) => {
    if (!fullDateStr) return null;
    const parts = fullDateStr.split('/');
    if (parts.length !== 3) return null;
    const date = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
    if (isNaN(date.getTime())) return null;
    const label = date.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
    return label.charAt(0).toUpperCase() + label.slice(1);
  };

  const fullDateLabel = getFullDateLabel(currentDay?.fullDateStr) || currentDay?.dateStr || `Dia ${currentDay?.dayNumber ?? ''}`;
  const isToday = isDateToday(currentDay?.fullDateStr);

  const arrivalFlightStop = orderedDayStops.find(s => s.category === 'flight' && s.title.toLowerCase().includes('chegada'));
  const otherFlightStop = orderedDayStops.find(s => s.category === 'flight');
  const isArrivalDay = !!arrivalFlightStop;

  const contextualSubtitle = (() => {
    if (arrivalFlightStop) {
      const checkInSuffix = basecamp?.checkIn ? ` · Check-in no ${basecamp.name} a partir de ${basecamp.checkIn}` : '';
      return `Chegada: ${arrivalFlightStop.title}${arrivalFlightStop.time ? ` às ${arrivalFlightStop.time}` : ''}${checkInSuffix}`;
    }
    if (otherFlightStop) {
      return `Voo: ${otherFlightStop.title}${otherFlightStop.time ? ` às ${otherFlightStop.time}` : ''}`;
    }
    const firstStop = orderedDayStops[0];
    if (firstStop) {
      return `Primeira parada: ${firstStop.title}${firstStop.time ? ` às ${firstStop.time}` : ''}`;
    }
    return currentDay?.locationSubtitle;
  })();

  const renderStop = (stop: TripSpaceStop, idx: number, arr: TripSpaceStop[]) => {
    const isSelected = selectedStopId === stop.id;
    const lowerTitle = stop.title.toLowerCase();
    
    // Fallback for special cards. If they look weird without the timeline dot, we can adapt them later.
    // We just wrap them in a simple div so they align with the new V2 logic.
    if (stop.category === 'flight' || lowerTitle.includes('voo')) {
      return <div key={stop.id} className="w-full"><FlightCard stop={stop} tripId={tripId} userId={userId} isSelected={isSelected} onClick={() => setSelectedStopId(stop.id)} hideTimelineDot={true} /></div>;
    }
    if (lowerTitle.includes('imigração')) {
      return <div key={stop.id} className="w-full"><ImmigrationCard stop={stop} tripId={tripId} userId={userId} isSelected={isSelected} onClick={() => setSelectedStopId(stop.id)} hideTimelineDot={true} /></div>;
    }
    if (lowerTitle.includes('deslocamento')) {
      const prevStop = arr[idx - 1];
      const nextStop = arr[idx + 1];
      const originLabel = prevStop?.title;
      const originAddress = prevStop?.locationAddress || prevStop?.neighborhood;
      const nextIsLodgingOrMissing = !nextStop || nextStop.category === 'lodging';
      const destinationLabel = nextIsLodgingOrMissing ? basecamp?.name : nextStop?.title;
      const destinationAddress = nextIsLodgingOrMissing ? basecamp?.address : (nextStop?.locationAddress || nextStop?.neighborhood);
      return (
        <div key={stop.id} className="w-full">
          <TransportCard
            stop={stop}
            basecamp={basecamp}
            isSelected={isSelected}
            onClick={() => setSelectedStopId(stop.id)}
            originLabel={originLabel}
            originAddress={originAddress}
            destinationLabel={destinationLabel}
            destinationAddress={destinationAddress}
            hideTimelineDot={true}
          />
        </div>
      );
    }
    if (lowerTitle.includes('bagagem') || lowerTitle.includes('guarda-volumes') || lowerTitle.includes('guarda de bagagem')) {
      return <div key={stop.id} className="w-full"><LuggageCard stop={stop} basecamp={basecamp} isSelected={isSelected} onClick={() => setSelectedStopId(stop.id)} hideTimelineDot={true} /></div>;
    }
    if (lowerTitle.includes('pausa') || lowerTitle.includes('café') || lowerTitle.includes('descanso')) {
      return <div key={stop.id} className="w-full"><CoffeeBreakCard stop={stop} catalog={catalog} isSelected={isSelected} onClick={() => setSelectedStopId(stop.id)} hideTimelineDot={true} /></div>;
    }
    if (stop.category === 'gamified_prompt') {
      return (
        <div key={stop.id} className="w-full">
          <ConciergePromptCard 
            stop={stop} 
            catalog={catalog} 
            isSelected={isSelected} 
            hideTimelineDot={true}
            onClick={() => {
              setSelectedStopId(stop.id);
              setActiveGamifiedStop(stop);
              setIsGamifiedModalOpen(true);
            }}
          />
        </div>
      );
    }
    
    const isLodging = stop.category === 'lodging';
    const nextStop = arr[idx + 1];
    let logisticAlert = null;
    
    if (!isLodging && nextStop && !nextStop.category?.includes('flight') && !nextStop.category?.includes('lodging')) {
      logisticAlert = getLogisticAlert(stop, nextStop);
    }

    let travelFromPrevious = null;
    if (stop.lat != null && stop.lng != null && !isLodging) {
      let origin: { lat?: number | null; lng?: number | null } | undefined = undefined;
      let fromBasecamp = false;
      if (idx > 0 && arr[idx - 1]?.lat != null && arr[idx - 1]?.lng != null) {
        origin = { lat: arr[idx - 1].lat, lng: arr[idx - 1].lng };
      } else if (basecamp?.lat != null && basecamp?.lng != null) {
        origin = { lat: basecamp.lat, lng: basecamp.lng };
        fromBasecamp = true;
      }
      if (origin && origin.lat != null && origin.lng != null) {
        const hint = getTravelHint({ lat: origin.lat, lng: origin.lng }, { lat: stop.lat, lng: stop.lng });
        if (hint) {
          travelFromPrevious = { label: hint.label, isLongHop: isLongHop(hint), fromBasecamp };
        }
      }
    }

    return (
      <DefaultAttractionCardV2 
        key={stop.id} 
        stop={stop} 
        isSelected={isSelected} 
        logisticAlert={logisticAlert}
        travelFromPrevious={travelFromPrevious}
        onClick={() => setDetailModalStop(stop)}
        onNavigate={() => setDirectionsStop(stop)}
        onReplace={() => {}}
        onRemove={() => {
          if (onExecuteDirectAction) {
            onExecuteDirectAction({
              tripId,
              action: 'REMOVE',
              activityId: stop.id,
              targetDay: currentDay.dayNumber
            } as any);
          }
        }}
      />
    );
  };

  const renderSectionV2 = (title: string, subtitle: string, icon: React.ReactNode, stops: TripSpaceStop[]) => {
    return (
      <div className="mb-12 last:mb-0">
        <div className="flex items-center justify-between gap-3 mb-5 pl-2 flex-wrap border-b border-slate-200/60 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white shadow-sm border border-slate-200/80 flex items-center justify-center">
              {icon}
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-xl font-outfit tracking-tight">{title}</h3>
              <p className="text-xs font-bold text-slate-500">{subtitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 ml-auto flex-wrap">
            {stops.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={() => alert(`Sincronizando Plano de Chuva com IA para o turno: ${title}`)}
                  className="text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl shadow-sm transition-all flex items-center gap-1"
                  title="Substitui paradas abertas por opções cobertas e climatizadas"
                >
                  <CloudRain className="w-3.5 h-3.5 text-sky-500" />
                  <span>Plano de Chuva</span>
                </button>
                <button
                  type="button"
                  onClick={() => alert(`Recalculando rotas e deslocamentos otimizados para: ${title}`)}
                  className="text-xs font-black text-[#14150F] bg-white hover:bg-[#D6FF3F] border border-slate-200 hover:border-[#b8e624] px-3 py-1.5 rounded-xl shadow-sm transition-all flex items-center gap-1.5"
                  title="Otimiza o tráfego e ordem dos locais com a Engine V2"
                >
                  <Navigation className="w-3.5 h-3.5 text-[#14150F]" />
                  <span>Otimizar Rota</span>
                </button>
              </>
            )}
            {stops.length === 0 && (
              <span className="text-[11px] font-bold text-slate-400 bg-slate-100 px-3 py-1.5 rounded-xl uppercase tracking-wider">
                Turno Livre
              </span>
            )}
          </div>
        </div>
        
        {stops.length === 0 ? (
          <div className="bg-[#FAF8F1] border-2 border-dashed border-slate-300/80 rounded-[28px] p-8 flex flex-col items-center justify-center text-center gap-3 shadow-inner">
            <p className="text-sm sm:text-base font-extrabold text-slate-600">Nenhuma programação curada para este turno.</p>
            <button
              onClick={() => setIsGamifiedModalOpen(true)}
              className="bg-[#14150F] text-[#FAF8F1] hover:bg-[#D6FF3F] hover:text-[#14150F] font-black shadow-md rounded-xl py-2.5 px-6 flex items-center justify-center gap-2 transition-all mt-1"
            >
              <Sparkles className="w-4 h-4 text-[#D6FF3F] group-hover:text-[#14150F]" />
              <span className="text-xs sm:text-sm">Explorar Ideias com Concierge IA</span>
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {stops.map((stop, idx) => renderStop(stop, idx, stops))}
            
            {/* Add action at the end of the shift block */}
            <div className="flex justify-center mt-2">
              <button
                onClick={() => setIsGamifiedModalOpen(true)}
                className="text-xs font-extrabold text-slate-500 hover:text-slate-900 transition-colors flex items-center gap-1.5 bg-white border border-slate-200/80 hover:border-slate-400 shadow-sm hover:shadow px-5 py-2.5 rounded-xl"
              >
                <Plus className="w-4 h-4 text-[#8C7CF0]" /> Adicionar parada nesta janela ({title})
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <section className="mb-8">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="space-y-6 xl:col-span-2">
          {currentDay && (
            <div className="bg-transparent border-none rounded-none">
              
              {/* Card Resumo do Dia (Estilo Copiloto V3 / Verde Neon & Tinta Preta) */}
              <div className="bg-[#D6FF3F] text-[#14150F] border-2 border-[#b5db2b] rounded-[28px] p-6 sm:p-8 shadow-xl mb-8 relative overflow-hidden transition-all duration-300 hover:shadow-2xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 relative z-10">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="bg-[#14150F] text-[#FAF8F1] font-black text-xs px-3.5 py-1.5 rounded-xl uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                      <span className="w-2 h-2 rounded-full bg-[#D6FF3F] animate-pulse" />
                      Bom dia, Rafael — Dia {currentDay.dayNumber} de {days.length}
                    </span>
                    {isArrivalDay && (
                      <span className="bg-white/90 border border-black/10 text-slate-900 font-extrabold text-xs px-3 py-1.5 rounded-xl shadow-sm">
                        🛬 Dia de Chegada & Logística
                      </span>
                    )}
                    {currentDay.dayNumber === days.length && days.length > 1 && (
                      <span className="bg-white/90 border border-black/10 text-slate-900 font-extrabold text-xs px-3 py-1.5 rounded-xl shadow-sm">
                        🛫 Dia de Partida
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-extrabold text-[#14150F] bg-white/80 px-3 py-1.5 rounded-xl border border-black/10 shadow-sm uppercase tabular-nums">
                    1 de {currentDay.stops?.length || 7} etapas hoje
                  </span>
                </div>

                <h2 className="text-2xl sm:text-3xl font-black text-[#14150F] tracking-tight mb-3 capitalize font-outfit relative z-10">
                  {isArrivalDay ? 'Imigração e Retirada de Bagagem' : fullDateLabel}
                </h2>
                
                <p className="text-sm sm:text-base text-[#14150F]/90 font-extrabold relative z-10 mb-6 max-w-3xl leading-relaxed">
                  {isArrivalDay 
                    ? `Seu voo pousa de manhã. Fila de imigração estimada em ~40min neste horário — depois disso, a próxima decisão é onde deixar as malas antes de fazer o check-in no hotel.`
                    : `Roteiro otimizado para um ritmo harmônico sem sobrecarga de trânsito. Paradas distribuídas entre os turnos para garantir respiro e contemplação ao longo do dia.`}
                </p>

                {/* Painel de Instrumentos Tabulares / Medidores Executivos */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 relative z-10">
                  {isArrivalDay ? (
                    <>
                      <div className="bg-white/90 backdrop-blur-sm p-3.5 rounded-2xl border border-black/10 shadow-sm flex flex-col justify-center">
                        <span className="text-lg font-black tabular-nums text-[#14150F]">08:20</span>
                        <span className="text-[11px] font-black uppercase tracking-wider text-slate-600">Pouso confirmado</span>
                      </div>
                      <div className="bg-white/90 backdrop-blur-sm p-3.5 rounded-2xl border border-black/10 shadow-sm flex flex-col justify-center">
                        <span className="text-lg font-black tabular-nums text-amber-700">~40 min</span>
                        <span className="text-[11px] font-black uppercase tracking-wider text-slate-600">Fila estimada</span>
                      </div>
                      <div className="bg-white/90 backdrop-blur-sm p-3.5 rounded-2xl border border-black/10 shadow-sm flex flex-col justify-center">
                        <span className="text-lg font-black tabular-nums text-[#14150F]">17:00</span>
                        <span className="text-[11px] font-black uppercase tracking-wider text-slate-600">Check-in liberado</span>
                      </div>
                      <div className="bg-white/90 backdrop-blur-sm p-3.5 rounded-2xl border border-black/10 shadow-sm flex flex-col justify-center">
                        <span className="text-sm font-black text-[#14150F] truncate">{basecamp?.name || 'citizenM Bowery'}</span>
                        <span className="text-[11px] font-black uppercase tracking-wider text-slate-600">Basecamp</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="bg-white/90 backdrop-blur-sm p-3.5 rounded-2xl border border-black/10 shadow-sm flex flex-col justify-center">
                        <span className="text-lg font-black tabular-nums text-[#14150F]">09:00</span>
                        <span className="text-[11px] font-black uppercase tracking-wider text-slate-600">Início do dia</span>
                      </div>
                      <div className="bg-white/90 backdrop-blur-sm p-3.5 rounded-2xl border border-black/10 shadow-sm flex flex-col justify-center">
                        <span className="text-lg font-black tabular-nums text-[#14150F]">4h30</span>
                        <span className="text-[11px] font-black uppercase tracking-wider text-slate-600">Tempo em vivências</span>
                      </div>
                      <div className="bg-white/90 backdrop-blur-sm p-3.5 rounded-2xl border border-black/10 shadow-sm flex flex-col justify-center">
                        <span className="text-lg font-black tabular-nums text-[#14150F]">
                          {dailyStats.totalMins > 0 ? `${dailyStats.totalMins} min` : '~30 min'}
                        </span>
                        <span className="text-[11px] font-black uppercase tracking-wider text-slate-600">Tempo em trânsito</span>
                      </div>
                      <div className="bg-white/90 backdrop-blur-sm p-3.5 rounded-2xl border border-black/10 shadow-sm flex flex-col justify-center">
                        <span className="text-lg font-black tabular-nums text-[#14150F]">
                          {dailyStats.totalKm > 0 ? `${dailyStats.totalKm.toFixed(1).replace('.', ',')} km` : '—'}
                        </span>
                        <span className="text-[11px] font-black uppercase tracking-wider text-slate-600">Deslocamento no dia</span>
                      </div>
                      <div className="bg-white/90 backdrop-blur-sm p-3.5 rounded-2xl border border-black/10 shadow-sm flex flex-col justify-center">
                        <span className="text-sm font-black text-[#14150F] truncate">{basecamp?.name || 'Seu Hotel'}</span>
                        <span className="text-[11px] font-black uppercase tracking-wider text-slate-600">Basecamp</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Roteiro V2: No MobileNowCard gambiarra, just show the sections! */}
              <div className="mt-4">
                {renderSectionV2('Manhã', 'Até as 12h', <Sun className="w-5 h-5 text-amber-500" />, morningStops)}
                {renderSectionV2('Tarde', '12h as 18h', <CloudSun className="w-5 h-5 text-orange-500" />, afternoonStops)}
                {renderSectionV2('Noite', 'Após as 18h', <Moon className="w-5 h-5 text-indigo-500" />, nightStops)}
              </div>

            </div>
          )}
        </div>

        <div className="hidden md:flex md:flex-col space-y-6">
          <div className="bg-white border border-slate-200 rounded-[28px] p-5 shadow-sm flex flex-col relative overflow-hidden">
            <div className="flex items-center justify-between mb-4 relative z-10">
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <Navigation className="w-4 h-4 text-lime-500" /> Mapa do dia
              </h3>
            </div>
            {mapPoints.length > 0 ? (
              <div className="relative w-full h-[400px] bg-slate-100 rounded-[20px] overflow-hidden border border-slate-200/60 shadow-inner">
                <MapLibreMap attractions={mapPoints as any} />
              </div>
            ) : (
              <div className="relative w-full h-[400px] bg-slate-50 rounded-[20px] overflow-hidden border-2 border-dashed border-slate-200 flex items-center justify-center p-6">
                <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, black 1px, transparent 0)', backgroundSize: '16px 16px' }} />
                <div className="relative z-10 text-center space-y-3">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm text-slate-300">
                    <Navigation className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-extrabold text-slate-700">
                    {basecamp ? 'Localização do basecamp indisponível' : 'Sem locais no mapa'}
                  </h3>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white border border-slate-200 rounded-[28px] p-6 shadow-sm">
             <h3 className="font-extrabold text-slate-900 mb-4 flex items-center gap-2">
               <Zap className="w-4 h-4 text-purple-500" /> Ajustes rápidos
             </h3>
             <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: Shuffle, label: 'Reordenar dia', impact: 'Vai reorganizar a ordem das paradas do dia para reduzir deslocamento.' },
                  { icon: CloudRain, label: 'Plano de chuva', impact: 'Vai sugerir alternativas cobertas para os planos ao ar livre do dia.' },
                  { icon: Navigation, label: 'Otimizar rota', impact: 'Vai recalcular a rota entre as paradas para economizar tempo de deslocamento.' },
                  { icon: Clock, label: 'Ritmo lento', impact: 'Vai espaçar os horários do dia para um passeio mais tranquilo.' },
                ].map(({ icon: Icon, label, impact }) => (
                  <button
                    key={label}
                    type="button"
                    disabled
                    title={`${impact} Em breve.`}
                    className="relative bg-slate-50 border border-slate-200 p-3 rounded-2xl flex flex-col items-start gap-2 text-left opacity-60 cursor-not-allowed"
                  >
                    <span className="absolute top-2 right-2 text-[9px] font-bold text-slate-400 bg-white px-1.5 py-0.5 rounded-full border border-slate-200">Em breve</span>
                    <div className="bg-white p-2 rounded-full shadow-sm">
                      <Icon className="w-4 h-4 text-slate-400" />
                    </div>
                    <span className="text-xs font-bold text-slate-500">{label}</span>
                  </button>
                ))}
             </div>
          </div>
        </div>
      </div>

      {editDraft && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-6">
          <div className="bg-white rounded-[24px] shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-extrabold text-slate-900">Revisar Alteração</h3>
                <p className="text-xs font-medium text-slate-500 mt-1">Veja o impacto no seu roteiro</p>
              </div>
              <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center">
                <AlertCircle className="w-5 h-5" />
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto bg-slate-50 flex-1">
              {editDraft.status !== 'APPLIED' ? (
                <div className="text-center p-4">
                  <p className="text-sm font-bold text-red-600 mb-2">A alteração não pode ser aplicada.</p>
                  <p className="text-xs text-slate-600">{editDraft.status}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm font-medium text-slate-700">Seu roteiro foi recalculado. A ordem ou horários podem ter mudado de forma a otimizar sua viagem.</p>
                  
                  {editDraft.warnings && editDraft.warnings.length > 0 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                      <p className="text-xs font-bold text-amber-800 mb-2">Avisos do Motor:</p>
                      <ul className="text-xs text-amber-700 space-y-1 list-disc pl-4">
                        {editDraft.warnings.map((w: string, i: number) => <li key={i}>{w}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="p-6 border-t border-slate-100 bg-white flex items-center justify-end gap-3">
              <button 
                onClick={onClearDraft}
                className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 rounded-xl transition-colors"
                disabled={draftLoading}
              >
                Cancelar
              </button>
              <button 
                onClick={onCommitDraft}
                disabled={editDraft.status !== 'APPLIED' || draftLoading}
                className="px-5 py-2.5 text-sm font-extrabold bg-slate-900 text-white hover:bg-slate-800 rounded-xl transition-colors disabled:opacity-50"
              >
                {draftLoading ? 'Salvando...' : 'Aprovar Alteração'}
              </button>
            </div>
          </div>
        </div>
      )}

      {directionsStop && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm" onClick={() => setDirectionsStop(null)}>
          <div className="bg-white w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom-10 sm:zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="p-4 text-center border-b border-slate-100">
              <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-4 sm:hidden" />
              <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-1">Abrir em</h3>
              <p className="text-base font-bold text-slate-900 truncate px-4">{directionsStop.title}</p>
            </div>
            <div className="p-2 flex flex-col gap-1">
              <a href={`https://maps.apple.com/?daddr=${directionsStop.lat && directionsStop.lng ? `${directionsStop.lat},${directionsStop.lng}` : encodeURIComponent(directionsStop.locationAddress || directionsStop.title)}&q=${encodeURIComponent(directionsStop.title)}`} target="_blank" rel="noopener noreferrer" onClick={() => setDirectionsStop(null)} className="w-full flex items-center justify-center gap-2 p-4 text-lg font-bold text-blue-600 hover:bg-slate-50 active:bg-slate-100 rounded-2xl transition-colors"><MapPin className="w-5 h-5" /> Apple Maps</a>
              <a href={`https://www.google.com/maps/dir/?api=1&destination=${directionsStop.lat && directionsStop.lng ? `${directionsStop.lat},${directionsStop.lng}` : encodeURIComponent(directionsStop.locationAddress || directionsStop.title)}`} target="_blank" rel="noopener noreferrer" onClick={() => setDirectionsStop(null)} className="w-full flex items-center justify-center gap-2 p-4 text-lg font-bold text-red-600 hover:bg-slate-50 active:bg-slate-100 rounded-2xl transition-colors"><Navigation className="w-5 h-5" /> Google Maps</a>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100">
              <button onClick={() => setDirectionsStop(null)} className="w-full py-3.5 bg-white border border-slate-200 rounded-xl text-slate-900 font-bold hover:bg-slate-50 active:bg-slate-100 transition-colors">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {detailModalStop && (
        <ExperienceDetailModalV2
          item={detailModalStop}
          onClose={() => setDetailModalStop(null)}
          onRemoveAndReplace={(id) => {
             if (onExecuteDirectAction) {
               onExecuteDirectAction({
                 tripId,
                 action: 'REMOVE',
                 activityId: id,
                 targetDay: currentDay.dayNumber
               } as any);
             }
          }}
        />
      )}

      <GamifiedConciergeModal
        isOpen={isGamifiedModalOpen}
        onClose={() => {
          if (!isAdding) {
            setIsGamifiedModalOpen(false);
            setAddError(null);
          }
        }}
        catalog={catalogItems}
        title={activeGamifiedStop?.title}
        description={activeGamifiedStop?.description}
        isLoading={isAdding}
        addError={addError}
        onConfirm={async (item) => {
          if (!onExecuteDirectAction) {
            setAddError('Erro interno: ação de adição não está disponível.');
            return;
          }
          if (!item?.id) {
            setAddError('Experiência inválida: ID ausente.');
            return;
          }
          setIsAdding(true);
          setAddError(null);
          try {
            await onExecuteDirectAction({
              tripId,
              action: activeGamifiedStop ? 'REPLACE' : 'ADD',
              activityId: activeGamifiedStop?.id || undefined,
              targetDay: currentDay.dayNumber,
              sourceExperienceId: item.id,
              catalogContext: catalogItems
            } as any);
            setIsGamifiedModalOpen(false);
            setActiveGamifiedStop(null);
            setAddError(null);
          } catch (err: any) {
            setAddError(err?.message || 'Erro ao adicionar experiência. Tente novamente.');
          } finally {
            setIsAdding(false);
          }
        }}
      />

      <ManualCatalogBrowserModal
        isOpen={isManualModalOpen}
        onClose={() => {
          if (!isAdding) {
            setIsManualModalOpen(false);
            setAddError(null);
          }
        }}
        catalog={catalogItems}
        isLoading={isAdding}
        addError={addError}
        activeDayNumber={currentDay?.dayNumber}
        onConfirm={async (item) => {
          if (!onExecuteDirectAction) {
            setAddError('Erro interno: ação de adição não está disponível.');
            return;
          }
          if (!item?.id) {
            setAddError('Experiência inválida: ID ausente.');
            return;
          }
          setIsAdding(true);
          setAddError(null);
          try {
            await onExecuteDirectAction({
              tripId,
              action: 'ADD',
              targetDay: currentDay.dayNumber,
              sourceExperienceId: item.id,
              catalogContext: catalogItems
            } as any);
            setIsManualModalOpen(false);
            setAddError(null);
          } catch (err: any) {
            setAddError(err?.message || 'Erro ao adicionar experiência. Tente novamente.');
          } finally {
            setIsAdding(false);
          }
        }}
      />
    </section>
  );
}
