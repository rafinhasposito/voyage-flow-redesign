import React, { useState, useMemo, useEffect } from 'react';
import { 
  Clock, MapPin, DollarSign, CheckCircle2, ChevronRight, ChevronDown,
  ArrowUp, ArrowDown, Shuffle, CloudRain, Navigation, AlertCircle, Info, Plane, Plus, Lock, Unlock, Zap, Calendar, CloudSun, Sun, Moon, Sparkles
} from 'lucide-react';
import { TripSpaceDay, TripSpaceStop, TripSpaceBasecamp } from '@/types/tripSpace.types';
import MapLibreMap from '@/components/MapLibreMap';
import { DefaultAttractionCard } from './cards/DefaultAttractionCard';
import { FlightCard } from './cards/FlightCard';
import { ImmigrationCard } from './cards/ImmigrationCard';
import { TransportCard } from './cards/TransportCard';
import { LuggageCard } from './cards/LuggageCard';
import { CoffeeBreakCard } from './cards/CoffeeBreakCard';
import { ConciergePromptCard } from './cards/ConciergePromptCard';
import { ExperienceDetailModal } from './ExperienceDetailModal';
import { GamifiedConciergeModal } from './cards/GamifiedConciergeModal';
import { ManualCatalogBrowserModal } from './cards/ManualCatalogBrowserModal';
import { NextStepCard } from './cards/NextStepCard';
import { MobileNowCard } from './cards/MobileNowCard';
import { MobileDaySelector } from './cards/MobileDaySelector';
import { isDateToday } from './utils/dayProgress';

interface DayWorkspaceProps {
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

function getMealHint(startMins: number): string | null {
  if (startMins >= 8 * 60 && startMins < 10 * 60) return 'o café da manhã';
  if (startMins >= 12 * 60 && startMins < 14 * 60) return 'o almoço';
  if (startMins >= 19 * 60 && startMins < 21 * 60) return 'o jantar';
  return null;
}

function formatFreeDuration(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h > 0 && m > 0) return `${h}h${m} livres`;
  if (h > 0) return `${h} hora${h > 1 ? 's' : ''} livre${h > 1 ? 's' : ''}`;
  return `${m} minutos livres`;
}

// Priority for the arrival-day logistics cluster: chegada -> imigração -> malas -> transporte -> hotel
function getStopPriority(stop: TripSpaceStop): number {
  const lower = stop.title.toLowerCase();
  if (stop.category === 'flight' || lower.includes('voo')) return 0;
  if (lower.includes('imigração')) return 1;
  if (lower.includes('bagagem') || lower.includes('guarda-volumes') || lower.includes('guarda de bagagem')) return 2;
  if (lower.includes('deslocamento')) return 3;
  if (stop.category === 'lodging') return 4;
  return 5;
}

// Only reorders inside contiguous runs of "special logistics" stops (priority <= 4),
// never moves a stop across a regular attraction — avoids scrambling the rest of the day.
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

export function DayWorkspace({ 
  tripId, userId, days, activeDay, onDayChange, basecamp, catalog,
  onToggleLock, onCreateDraft, onExecuteDirectAction, onCommitDraft, onClearDraft, editDraft, draftLoading 
}: DayWorkspaceProps) {
  const [selectedStopId, setSelectedStopId] = useState<string | null>(null);
  const [detailModalStop, setDetailModalStop] = useState<TripSpaceStop | null>(null);
  const [directionsStop, setDirectionsStop] = useState<TripSpaceStop | null>(null);
  const [isGamifiedModalOpen, setIsGamifiedModalOpen] = useState(false);
  const [activeGamifiedStop, setActiveGamifiedStop] = useState<TripSpaceStop | null>(null);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [showFullDayMobile, setShowFullDayMobile] = useState(false);

  useEffect(() => {
    setShowFullDayMobile(false);
  }, [activeDay]);

  // Accordion state
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    morning: true,
    afternoon: true,
    night: true
  });

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Opened from the page header's "Adicionar ao Dia X" button (TripSpacePage.tsx)
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

  const periodCopy: Record<string, string> = {
    morning: 'pela manhã',
    afternoon: 'à tarde',
    night: 'à noite',
  };

  const sectionBounds: Record<string, [number, number]> = {
    morning: [0, 12 * 60],
    afternoon: [12 * 60, 18 * 60],
    night: [18 * 60, 24 * 60],
  };

  const dayTimeline = orderedDayStops;

  const getFreeSlotMessage = (sectionKey: string, sectionStops: TripSpaceStop[]) => {
    const periodLabel = periodCopy[sectionKey] || 'neste período';

    let prevStop: TripSpaceStop | undefined;
    let nextStop: TripSpaceStop | undefined;

    if (sectionStops.length > 0) {
      prevStop = sectionStops[sectionStops.length - 1];
      const idx = dayTimeline.findIndex(s => s.id === prevStop!.id);
      nextStop = idx >= 0 ? dayTimeline[idx + 1] : undefined;
    } else {
      const [start, end] = sectionBounds[sectionKey] || [0, 24 * 60];
      const before = dayTimeline.filter(s => parseTimeStr(s.time) < start);
      const after = dayTimeline.filter(s => parseTimeStr(s.time) >= end);
      prevStop = before[before.length - 1];
      nextStop = after[0];
    }

    let durationMins: number | null = null;
    let slotStartMins: number | null = null;
    if (prevStop?.time) {
      slotStartMins = parseTimeStr(prevStop.time) + (parseDurationMins(prevStop.duration) ?? 60);
    } else if (sectionStops.length === 0) {
      slotStartMins = (sectionBounds[sectionKey] || [0, 24 * 60])[0];
    }
    if (prevStop?.time && nextStop?.time) {
      const prevStart = parseTimeStr(prevStop.time);
      const prevDuration = parseDurationMins(prevStop.duration) ?? 60;
      const nextStart = parseTimeStr(nextStop.time);
      const gap = nextStart - (prevStart + prevDuration);
      if (gap > 0) durationMins = gap;
    }

    const anchorStop = prevStop || nextStop;
    const anchorLabel = anchorStop?.neighborhood || anchorStop?.title || basecamp?.name;

    const quantityPhrase = durationMins ? formatFreeDuration(durationMins) : 'tempo livre';
    const anchorSuffix = anchorLabel ? `, próximo a ${anchorLabel}` : '';
    const mealHint = slotStartMins !== null ? getMealHint(slotStartMins) : null;
    const mealSuffix = mealHint ? ` Também é um bom horário para ${mealHint}.` : '';

    return `Você tem ${quantityPhrase} ${periodLabel}${anchorSuffix}.${mealSuffix}`;
  };

  const renderFreeSlotAction = (sectionKey: string, sectionStops: TripSpaceStop[]) => (
    <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-4 flex flex-col items-center gap-3 text-center">
      <p className="text-xs font-bold text-slate-500">{getFreeSlotMessage(sectionKey, sectionStops)}</p>
      <button
        onClick={() => setIsGamifiedModalOpen(true)}
        className="bg-white border border-slate-200 shadow-sm hover:border-purple-300 hover:shadow-md rounded-xl py-2.5 px-5 flex items-center justify-center gap-2 transition-all"
      >
        <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
          <Sparkles className="w-3 h-3" />
        </div>
        <span className="text-xs font-extrabold text-slate-700">Sugestão da IA</span>
      </button>
      <button
        onClick={() => setIsManualModalOpen(true)}
        className="text-[11px] font-bold text-slate-400 hover:text-slate-600 underline underline-offset-2"
      >
        ou busque no catálogo completo
      </button>
    </div>
  );

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

  // Group stops by time (already reordered within logistic clusters)
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

  // Full-text date ("Segunda-feira, 3 de agosto") parsed from the real fullDateStr (DD/MM/YYYY)
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

  // Arrival-day detection: no `direction` field exists on stops, so reuse the same
  // title heuristic FlightCard already uses ("chegada") — no invented field.
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
    
    if (stop.category === 'flight' || lowerTitle.includes('voo')) {
      return <FlightCard key={stop.id} stop={stop} tripId={tripId} userId={userId} isSelected={isSelected} onClick={() => setSelectedStopId(stop.id)} />;
    }
    if (lowerTitle.includes('imigração')) {
      return <ImmigrationCard key={stop.id} stop={stop} tripId={tripId} userId={userId} isSelected={isSelected} onClick={() => setSelectedStopId(stop.id)} />;
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
        <TransportCard
          key={stop.id}
          stop={stop}
          basecamp={basecamp}
          isSelected={isSelected}
          onClick={() => setSelectedStopId(stop.id)}
          originLabel={originLabel}
          originAddress={originAddress}
          destinationLabel={destinationLabel}
          destinationAddress={destinationAddress}
        />
      );
    }
    if (lowerTitle.includes('bagagem') || lowerTitle.includes('guarda-volumes') || lowerTitle.includes('guarda de bagagem')) {
      return <LuggageCard key={stop.id} stop={stop} basecamp={basecamp} isSelected={isSelected} onClick={() => setSelectedStopId(stop.id)} />;
    }
    if (lowerTitle.includes('pausa') || lowerTitle.includes('café') || lowerTitle.includes('descanso')) {
      return <CoffeeBreakCard key={stop.id} stop={stop} catalog={catalog} isSelected={isSelected} onClick={() => setSelectedStopId(stop.id)} />;
    }
    if (stop.category === 'gamified_prompt') {
      return (
        <ConciergePromptCard 
          key={stop.id} 
          stop={stop} 
          catalog={catalog} 
          isSelected={isSelected} 
          onClick={() => {
            setSelectedStopId(stop.id);
            setActiveGamifiedStop(stop);
            setIsGamifiedModalOpen(true);
          }}
        />
      );
    }
    
    const isLodging = stop.category === 'lodging';
    const nextStop = arr[idx + 1];
    let logisticAlert = null;
    
    if (!isLodging && nextStop && !nextStop.category?.includes('flight') && !nextStop.category?.includes('lodging')) {
      logisticAlert = getLogisticAlert(stop, nextStop);
    }

    return (
      <DefaultAttractionCard 
        key={stop.id} 
        stop={stop} 
        isSelected={isSelected} 
        logisticAlert={logisticAlert}
        onClick={() => setDetailModalStop(stop)}
        onNavigate={() => setDirectionsStop(stop)}
      />
    );
  };

  const renderSection = (title: string, icon: React.ReactNode, stops: TripSpaceStop[], sectionKey: string) => {
    const isOpen = openSections[sectionKey];
    const isEmpty = stops.length === 0;

    return (
      <div className={`bg-white border rounded-[24px] overflow-hidden transition-all duration-300 ${isOpen ? 'border-slate-200 shadow-sm' : 'border-slate-100 opacity-80'}`}>
        <button 
          onClick={() => toggleSection(sectionKey)}
          className={`w-full flex items-center justify-between p-5 transition-colors ${isOpen ? 'bg-slate-50/50' : 'bg-slate-50/20 hover:bg-slate-50/50'}`}
        >
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${isOpen ? 'bg-white shadow-sm' : 'bg-slate-100'}`}>
              {icon}
            </div>
            <h3 className="font-extrabold text-slate-900 capitalize">{title}</h3>
            {isEmpty && <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">Livre</span>}
          </div>
          <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
        </button>
        
        {isOpen && (
          <div className="p-6 pt-2 animate-in slide-in-from-top-4 fade-in duration-300">
            {isEmpty ? (
              <div className="py-2">
                {renderFreeSlotAction(sectionKey, stops)}
              </div>
            ) : (
              <div className="relative pl-6 space-y-6 before:absolute before:left-[11px] before:top-4 before:bottom-4 before:w-0.5 before:bg-slate-200">
                {stops.map((stop, idx) => renderStop(stop, idx, stops))}

                {/* Timeline slot for remaining free time in this period */}
                <div className="relative pl-6 pt-4">
                  <div className="absolute left-[11px] top-1/2 -translate-y-1/2 w-2 h-2 rounded-full border-2 border-slate-300 bg-white z-10" />
                  {renderFreeSlotAction(sectionKey, stops)}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <section className="mb-8">
      {/* Desktop day tabs */}
      <div className="hidden md:flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide border-b border-slate-200">
        {days.map((day) => (
          <button
            key={day.dayNumber}
            onClick={() => onDayChange?.(day.dayNumber)}
            className={`px-5 py-3 rounded-t-xl text-sm font-extrabold whitespace-nowrap transition-all border-b-2 ${
              activeDay === day.dayNumber
                ? 'border-slate-900 text-slate-900 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            Dia {day.dayNumber}
          </button>
        ))}
      </div>

      {/* Mobile day selector */}
      <div className="md:hidden mb-4">
        <MobileDaySelector days={days} activeDay={activeDay} onDayChange={onDayChange} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          {currentDay && (
            <div className="bg-slate-50/50 p-2 sm:p-0 sm:bg-transparent border-none sm:border-none rounded-[32px] sm:rounded-none">

              {/* Premium Header (desktop only — mobile has its own compact header below) */}
              <div className="hidden md:block bg-white border border-slate-200 rounded-[28px] p-6 shadow-sm mb-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-5">
                  <Calendar className="w-32 h-32" />
                </div>
                <div className="relative z-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                  <div>
                    <div className="inline-flex items-center gap-1.5 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">
                      <span className="bg-slate-100 px-2 py-1 rounded-md">Dia {currentDay.dayNumber}</span>
                      {isArrivalDay && (
                        <span className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded-md">Chegada</span>
                      )}
                    </div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight capitalize">
                      {fullDateLabel}
                    </h2>
                    <div className="flex items-center gap-1.5 mt-2 text-sm font-bold text-slate-500">
                      <MapPin className="w-4 h-4 text-lime-500" /> {contextualSubtitle}
                    </div>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 px-4 py-3 rounded-2xl flex items-center gap-3 shrink-0">
                    <CloudSun className="w-8 h-8 text-slate-300" />
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Previsão</p>
                      <p className="text-sm font-extrabold text-slate-400">Clima não disponível</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="hidden md:block">
                <NextStepCard
                  stops={orderedDayStops}
                  isToday={isToday}
                  onViewDetails={(stop) => setDetailModalStop(stop)}
                />

                {isArrivalDay && (
                  <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 mb-6 flex items-start gap-3">
                    <Plane className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                    <p className="text-sm font-medium text-indigo-900">
                      Hoje é dia de chegada — priorize a logística (imigração, malas e deslocamento até o hotel) antes de planejar passeios.
                    </p>
                  </div>
                )}
              </div>

              {/* Mobile compact header */}
              <div className="md:hidden mb-4">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase bg-slate-100 px-2 py-1 rounded-md">Dia {currentDay.dayNumber}</span>
                  {isArrivalDay && (
                    <span className="text-[10px] font-extrabold text-indigo-700 bg-indigo-100 px-2 py-1 rounded-md">Chegada</span>
                  )}
                </div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight capitalize truncate">{fullDateLabel}</h2>
                <p className="text-xs font-bold text-slate-500 mt-1 truncate">{contextualSubtitle}</p>
              </div>

              {/* Mobile: compact "next 2 steps" preview, expandable to the full day */}
              <div className="md:hidden mb-6">
                {!showFullDayMobile ? (
                  <div className="space-y-4">
                    <MobileNowCard allStops={orderedDayStops} isToday={isToday} renderStop={renderStop} />
                    <button
                      onClick={() => setShowFullDayMobile(true)}
                      className="w-full bg-white border border-slate-200 text-slate-700 font-extrabold text-sm py-3 rounded-2xl shadow-sm"
                    >
                      Ver dia completo
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowFullDayMobile(false)}
                    className="w-full bg-slate-900 text-white font-extrabold text-sm py-3 rounded-2xl mb-4"
                  >
                    Ver resumo
                  </button>
                )}
              </div>

              {/* Accordions: always visible on desktop; on mobile only inside "Ver dia completo" */}
              <div className={`${showFullDayMobile ? 'block' : 'hidden'} md:block space-y-4`}>
                {renderSection('Manhã', <Sun className="w-5 h-5 text-amber-500" />, morningStops, 'morning')}
                {renderSection('Tarde', <CloudSun className="w-5 h-5 text-orange-500" />, afternoonStops, 'afternoon')}
                {renderSection('Noite', <Moon className="w-5 h-5 text-indigo-500" />, nightStops, 'night')}
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
              <a href={`https://maps.apple.com/?daddr=${directionsStop.lat || ''},${directionsStop.lng || ''}&q=${encodeURIComponent(directionsStop.title)}`} target="_blank" rel="noopener noreferrer" onClick={() => setDirectionsStop(null)} className="w-full flex items-center justify-center gap-2 p-4 text-lg font-bold text-blue-600 hover:bg-slate-50 active:bg-slate-100 rounded-2xl transition-colors"><MapPin className="w-5 h-5" /> Apple Maps</a>
              <a href={`https://www.google.com/maps/dir/?api=1&destination=${directionsStop.lat || ''},${directionsStop.lng || ''}&destination_place_id=${encodeURIComponent(directionsStop.title)}`} target="_blank" rel="noopener noreferrer" onClick={() => setDirectionsStop(null)} className="w-full flex items-center justify-center gap-2 p-4 text-lg font-bold text-red-600 hover:bg-slate-50 active:bg-slate-100 rounded-2xl transition-colors"><Navigation className="w-5 h-5" /> Google Maps</a>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100">
              <button onClick={() => setDirectionsStop(null)} className="w-full py-3.5 bg-white border border-slate-200 rounded-xl text-slate-900 font-bold hover:bg-slate-50 active:bg-slate-100 transition-colors">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {detailModalStop && (
        <ExperienceDetailModal
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
            // Só fecha após sucesso confirmado
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
            // Só fecha após sucesso confirmado
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
