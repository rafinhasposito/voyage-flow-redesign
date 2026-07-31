import React, { useState, useMemo, useEffect } from 'react';
import { 
  Clock, MapPin, DollarSign, CheckCircle2, ChevronRight, ChevronDown,
  ArrowUp, ArrowDown, Shuffle, CloudRain, Navigation, AlertCircle, Info, Plane, Plus, Lock, Unlock, Zap, Calendar, CloudSun, Sun, Moon, Sparkles, X, Bookmark, Banknote, TrainFront
} from 'lucide-react';
import { CONCIERGE_NOTES } from '@/pages/consumer/BdayRafaRoteiroNY/conciergeNotes';
import { TripSpaceDay, TripSpaceStop, TripSpaceBasecamp } from '@/types/tripSpace.types';
import MapLibreMap from '@/components/MapLibreMap';
import { WeeklyOverviewGridV2 } from './components/WeeklyOverviewGridV2';
import { FreetimeCardV2 } from './components/FreetimeCardV2';
import { DecisionCardV2 } from './components/DecisionCardV2';
import { BoardingJournalModal } from './components/BoardingJournalModal';
import { DayContextHeaderV2 } from './components/DayContextHeaderV2';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { DefaultAttractionCardV2 } from './cards/DefaultAttractionCardV2';

function SortableStopItem({ id, children, disabled = false }: { id: string; children: React.ReactNode; disabled?: boolean }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 1,
    position: 'relative' as const,
  };

  return (
    <div ref={setNodeRef} style={style} className={`relative flex group/dnd ${isDragging ? 'opacity-70' : ''}`}>
      <div className="flex-1 w-full relative">
        {/* A alça (handle) para arrastar, escondida se o item estiver travado (disabled) */}
        {!disabled && (
          <div 
            {...attributes} 
            {...listeners}
            className="absolute -left-3 sm:-left-6 top-1/2 -translate-y-1/2 w-8 h-12 flex items-center justify-center cursor-grab active:cursor-grabbing z-20"
          >
            <div className="w-2 h-6 flex flex-wrap gap-[2px] opacity-0 group-hover/dnd:opacity-100 transition-opacity bg-white/50 rounded-full p-0.5 backdrop-blur-sm shadow-sm border border-slate-200">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div>
            </div>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
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
  onUpdateActivity?: (activityId: string, updates: { time?: string, cost?: string }) => void;
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
  const lower = stop.title?.toLowerCase() || '';
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
  onToggleLock, onUpdateActivity, onCreateDraft, onExecuteDirectAction, onCommitDraft, onClearDraft, editDraft, draftLoading 
}: DayWorkspaceV2Props) {
  const [selectedStopId, setSelectedStopId] = useState<string | null>(null);
  const [detailModalStop, setDetailModalStop] = useState<TripSpaceStop | null>(null);
  const [directionsStop, setDirectionsStop] = useState<TripSpaceStop | null>(null);
  const [journalStop, setJournalStop] = useState<TripSpaceStop | null>(null);
  const [localEdits, setLocalEdits] = useState<Record<string, {time?: string, cost?: string}>>({});
  const [isGamifiedModalOpen, setIsGamifiedModalOpen] = useState(false);
  const [activeGamifiedStop, setActiveGamifiedStop] = useState<TripSpaceStop | null>(null);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [activeMetricModal, setActiveMetricModal] = useState<'km' | 'custo' | 'reservas' | null>(null);

  const [localStopsOrder, setLocalStopsOrder] = useState<string[] | null>(null);

  useEffect(() => {
    const handleOpenAddModal = () => setIsManualModalOpen(true);
    window.addEventListener('OPEN_ADD_EXPERIENCE_MODAL', handleOpenAddModal);
    return () => window.removeEventListener('OPEN_ADD_EXPERIENCE_MODAL', handleOpenAddModal);
  }, []);

  useEffect(() => {
    setLocalStopsOrder(null);
  }, [activeDay, days]);

  const currentDay = days.find(d => d.dayNumber === activeDay) || days[0];
  
  const catalogItems = catalog || [];

  const orderedDayStops = useMemo(
    () => {
      let stops = reorderLogisticClusters(currentDay?.stops || []);
      
      if (localStopsOrder) {
        const orderMap = new Map(localStopsOrder.map((id, index) => [id, index]));
        stops = [...stops].sort((a, b) => {
          const idxA = orderMap.has(a.id) ? orderMap.get(a.id)! : 9999;
          const idxB = orderMap.has(b.id) ? orderMap.get(b.id)! : 9999;
          return idxA - idxB;
        });
      }

      return stops.map(stop => {
        const edit = localEdits[stop.id];
        if (edit) {
          return { 
            ...stop, 
            time: edit.time ?? stop.time, 
            cost: edit.cost ? `US$ ${parseFloat(edit.cost).toFixed(2).replace('.00', '')}` : stop.cost 
          };
        }
        return stop;
      });
    },
    [currentDay, localEdits, localStopsOrder]
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = orderedDayStops.findIndex(s => s.id === active.id);
      const newIndex = orderedDayStops.findIndex(s => s.id === over.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrder = arrayMove(orderedDayStops.map(s => s.id), oldIndex, newIndex);
        setLocalStopsOrder(newOrder);
      }
    }
  };

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
      neighborhood: 'Hospedagem',
      coordinates: { lat: basecamp!.lat!, lng: basecamp!.lng! },
      isBasecamp: true,
    }] : []),
    ...stopMapPoints,
  ];

  const dailyStats = useMemo(() => {
    let totalKm = 0;
    let totalMins = 0;
    let totalCost = 0;
    const bookingsNeeded: { title: string; time?: string; url?: string }[] = [];
    const costDetails: { title: string; cost: number }[] = [];

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

    orderedDayStops.forEach(s => {
      let costVal = 0;
      if (typeof s.cost === 'number') costVal = s.cost;
      else if (typeof (s as any).base_cost === 'number') costVal = (s as any).base_cost;
      else if (typeof (s as any).experience?.base_cost === 'number') costVal = (s as any).experience.base_cost;

      if (costVal > 0) {
        totalCost += costVal;
        costDetails.push({ title: s.title, cost: costVal });
      }

      const t = s.title?.toLowerCase() || '';
      if ((s as any).reservation_required || (s as any).experience?.reservation_required || s.category === 'restaurant' || t.includes('summit') || t.includes('edge') || t.includes('wicked') || t.includes('aladdin')) {
        bookingsNeeded.push({
          title: s.title,
          time: s.time,
          url: (s as any).bookingUrl || (s as any).booking_url || (s as any).experience?.booking_url
        });
      }
    });

    return { totalKm, totalMins, totalCost, costDetails, bookingsNeeded };
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

  const arrivalFlightStop = orderedDayStops.find(s => s.category === 'flight' && (s.title?.toLowerCase() || '').includes('chegada'));
  const otherFlightStop = orderedDayStops.find(s => s.category === 'flight');
  const isArrivalDay = !!arrivalFlightStop || currentDay.dayNumber === 1;

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
    const lowerTitle = stop.title?.toLowerCase() || '';
    
    // Fallback for special cards. If they look weird without the timeline dot, we can adapt them later.
    // We just wrap them in a simple div so they align with the new V2 logic.
    if (stop.category === 'flight' || lowerTitle.includes('voo')) {
      return <div key={stop.id} className="w-full"><FlightCard stop={stop} tripId={tripId} userId={userId} isSelected={isSelected} onClick={() => setSelectedStopId(stop.id)} hideTimelineDot={true} /></div>;
    }
    if (stop.category === 'immigration' || lowerTitle.includes('imigração') || lowerTitle.includes('imigracao')) {
      return <div key={stop.id} className="w-full"><ImmigrationCard stop={stop} tripId={tripId} userId={userId} isSelected={isSelected} onClick={() => setSelectedStopId(stop.id)} hideTimelineDot={true} /></div>;
    }
    if (stop.category === 'transport' || stop.category === 'logistics' || lowerTitle.includes('deslocamento')) {
      // O cartão da própria atração (ExperienceCardV2) já possui um banner superior amarelo
      // indicando o tempo e distância da atração anterior. Portanto, renderizar um bloco 
      // separado na timeline é redundante e visualmente poluído. Ocultamos completamente.
      return null;
    }
    if (stop.category === 'freetime') {
      return (
        <div key={stop.id} className="w-full">
          <FreetimeCardV2 
            stop={stop} 
            isSelected={isSelected} 
            onClick={() => setSelectedStopId(stop.id)} 
            onFill={() => {
              window.dispatchEvent(new CustomEvent('OPEN_ADD_EXPERIENCE_MODAL', { detail: { day: currentDay.dayNumber } }));
            }}
            onRemove={async () => {
              if (!onExecuteDirectAction) return;
              try {
                await onExecuteDirectAction({
                  tripId,
                  action: 'REMOVE',
                  activityId: stop.id,
                  targetDay: currentDay.dayNumber
                } as any);
              } catch (e: any) {
                console.error('[REMOVE FreetimeCard] falhou:', e);
                alert('Falha ao remover: ' + (e?.message || 'erro desconhecido'));
              }
            }}
          />
        </div>
      );
    }
    if (stop.category === 'decision') {
      return (
        <div key={stop.id} className="w-full">
          <DecisionCardV2 stop={stop} isSelected={isSelected} onClick={() => setSelectedStopId(stop.id)} />
        </div>
      );
    }
    if (stop.category === 'luggage' || lowerTitle.includes('bagagem') || lowerTitle.includes('guarda-volumes') || lowerTitle.includes('guarda de bagagem')) {
      return <div key={stop.id} className="w-full"><LuggageCard stop={stop} basecamp={basecamp} isSelected={isSelected} onClick={() => setSelectedStopId(stop.id)} hideTimelineDot={true} /></div>;
    }
    if (lowerTitle.includes('pausa') || lowerTitle.includes('café') || lowerTitle.includes('descanso')) {
      return (
        <div key={stop.id} className="w-full">
          <CoffeeBreakCard 
            stop={stop} 
            catalog={catalog} 
            isSelected={isSelected} 
            onClick={() => setSelectedStopId(stop.id)} 
            hideTimelineDot={true} 
            onRemove={async () => {
              if (!onExecuteDirectAction) return;
              try {
                await onExecuteDirectAction({
                  tripId,
                  action: 'REMOVE',
                  activityId: stop.id,
                  targetDay: currentDay.dayNumber
                } as any);
              } catch (e: any) {
                console.error('[REMOVE CoffeeBreakCard] falhou:', e);
                alert('Falha ao remover: ' + (e?.message || 'erro desconhecido'));
              }
            }}
          />
        </div>
      );
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
      
      // Encontrar a última parada que possui lat/lng válida (ignorando Freetime/Decision que não tem mapa)
      let lastValidStop = null;
      for (let k = idx - 1; k >= 0; k--) {
        if (arr[k].lat != null && arr[k].lng != null && !arr[k].category?.includes('flight') && !arr[k].category?.includes('lodging')) {
          lastValidStop = arr[k];
          break;
        }
      }

      if (lastValidStop) {
        origin = { lat: lastValidStop.lat, lng: lastValidStop.lng };
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
        onOpenJournal={() => setJournalStop(stop)}
        onRemove={async () => {
          if (!onExecuteDirectAction) return;
          try {
            await onExecuteDirectAction({
              tripId,
              action: 'REMOVE',
              activityId: stop.id,
              targetDay: currentDay.dayNumber
            } as any);
          } catch (e: any) {
            console.error('[REMOVE AttractionCard] falhou:', e);
            alert('Falha ao remover: ' + (e?.message || 'erro desconhecido'));
          }
        }}
      />
    );
  };

  const renderSectionV2 = null; // removido

  return (
    <section className="mb-8">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="space-y-6 xl:col-span-2">
          {currentDay && (
            <div className="bg-transparent border-none rounded-none">
              
              {/* Card Resumo do Dia e Contexto (Clima, Dicas, Astronomia) */}
              <DayContextHeaderV2
                currentDay={currentDay}
                totalDays={days.length}
                isArrivalDay={isArrivalDay}
                fullDateLabel={fullDateLabel}
                dailyStats={dailyStats}
                basecamp={basecamp}
                orderedDayStops={orderedDayStops}
                setActiveMetricModal={setActiveMetricModal}
              />

              {/* Timeline Contínua V2 (sem sanfonas) */}
              <div className="mt-6 flex flex-col gap-5">
                {orderedDayStops.length > 0 ? (
                  <>
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                      <SortableContext items={orderedDayStops.map(s => s.id)} strategy={verticalListSortingStrategy}>
                        {orderedDayStops.map((stop, idx) => {
                          const isLogisticCard = stop.category === 'flight' || stop.category === 'immigration' || stop.category === 'luggage' || stop.category === 'transport';
                          return (
                            <SortableStopItem key={stop.id} id={stop.id} disabled={isLogisticCard}>
                              {renderStop(stop, idx, orderedDayStops)}
                            </SortableStopItem>
                          );
                        })}
                      </SortableContext>
                    </DndContext>
                    
                    {/* Botão Fixo de Adicionar Atração no Final do Dia */}
                    <button
                      onClick={() => {
                        window.dispatchEvent(new CustomEvent('OPEN_ADD_EXPERIENCE_MODAL', { detail: { day: currentDay.dayNumber } }));
                      }}
                      className="w-full bg-white hover:bg-slate-50 border-2 border-dashed border-slate-300 hover:border-slate-400 text-slate-600 hover:text-slate-800 font-black text-sm px-6 py-5 rounded-[24px] transition-all flex items-center justify-center gap-2 shadow-sm mt-2 group"
                    >
                      <span className="w-8 h-8 rounded-full bg-slate-100 group-hover:bg-slate-200 flex items-center justify-center transition-colors">
                        <Plus className="w-4 h-4 text-slate-600" />
                      </span>
                      INCLUIR ATRAÇÃO NESTE DIA
                    </button>
                  </>
                ) : (
                  <div className="bg-[#FAF8F1] border-2 border-dashed border-slate-300/80 rounded-[28px] p-10 flex flex-col items-center justify-center text-center gap-4 shadow-inner">
                    <p className="text-sm sm:text-base font-extrabold text-slate-600">Nenhuma experiência curada para este dia.</p>
                    <button
                      onClick={() => {
                        window.dispatchEvent(new CustomEvent('OPEN_ADD_EXPERIENCE_MODAL', { detail: { day: currentDay.dayNumber } }));
                      }}
                      className="bg-[#14150F] text-[#FAF8F1] hover:bg-[#D6FF3F] hover:text-[#14150F] font-black shadow-md rounded-xl py-3 px-8 flex items-center justify-center gap-2 transition-all w-full sm:w-auto"
                    >
                      <Plus className="w-4 h-4" />
                      <span className="text-xs sm:text-sm">Incluir Primeira Atração</span>
                    </button>
                    <button
                      onClick={() => setIsGamifiedModalOpen(true)}
                      className="bg-transparent text-slate-500 hover:text-slate-800 font-bold py-2 px-6 flex items-center justify-center gap-2 transition-all"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span className="text-xs">Ou pedir sugestões para a IA</span>
                    </button>
                  </div>
                )}
              </div>

            </div>
          )}
        </div>

        <div className="hidden md:flex md:flex-col space-y-6">
          {/* Ocultado o Mapa do dia conforme pedido */}

          {/* PAINEL LEITURA DO DIA - CONCIERGE IA LOGÍSTICO (Paridade Exemplo NY - Regras 16 e 24) */}
          <div className="bg-[#FAF8F1] border border-slate-200/80 rounded-[28px] p-6 shadow-xs relative overflow-hidden">
            <div className="flex items-center gap-2.5 mb-3">
              <span className="w-7 h-7 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-xs shrink-0">
                <Sparkles className="w-3.5 h-3.5" />
              </span>
              <h3 className="font-black text-slate-900 text-sm tracking-tight uppercase">Leitura do Dia · Concierge IA</h3>
            </div>
            <p className="text-xs font-black text-[#14150F] leading-relaxed mb-4 pb-3 border-b border-slate-200/80">
              {CONCIERGE_NOTES[activeDay]?.summary || (
                orderedDayStops.length > 3 
                  ? `Dia dinâmico com ${orderedDayStops.length} paradas planejadas. A otimização em cluster evitou zigue-zagues desnecessários e garantiu pausas equilibradas entre as atrações.`
                  : `Roteiro planejado para uma vivência com ritmo sereno e menos tempo no tráfego urbano. Os deslocamentos iniciais foram concentrados perto de sua base.`
              )}
            </p>
            <ul className="space-y-2.5 text-xs font-medium text-slate-700">
              {(CONCIERGE_NOTES[activeDay]?.bullets || [
                `Distância de ${dailyStats.totalKm > 0 ? dailyStats.totalKm.toFixed(1).replace('.', ',') : '~5'} km calculada via malha Manhattan (1,25x Haversine).`,
                `Paradas distribuídas ordenadamente sem atropelar janelas de refeição ou descanso.`,
                `Verifique com antecedência os locais de reserva obrigatória sinalizados na barra de controle.`
              ]).map((bullet, idx) => (
                <li key={idx} className="flex items-start gap-2 text-slate-800 font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 mt-1.5 shrink-0" />
                  <span className="leading-snug">{bullet}</span>
                </li>
              ))}
            </ul>
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
          onRemoveAndReplace={async (id) => {
             if (!onExecuteDirectAction) return;
             try {
               await onExecuteDirectAction({
                 tripId,
                 action: 'REMOVE',
                 activityId: id,
                 targetDay: currentDay.dayNumber
               } as any);
               setDetailModalStop(null);
             } catch (e: any) {
               console.error('[REMOVE Modal] falhou:', e);
               alert('Falha ao remover: ' + (e?.message || 'erro desconhecido'));
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

      {/* MODAL / EXPLICADOR DE MÉTRICAS LOGÍSTICAS E FINANCEIRAS (Paridade Ouro com Exemplo NY) */}
      {activeMetricModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setActiveMetricModal(null)}>
          <div className="bg-white border border-slate-200 rounded-[32px] p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <header className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-md shrink-0">
                  {activeMetricModal === 'km' && <Navigation className="w-5 h-5 text-indigo-400" />}
                  {activeMetricModal === 'custo' && <DollarSign className="w-5 h-5 text-emerald-400" />}
                  {activeMetricModal === 'reservas' && <Clock className="w-5 h-5 text-[#D6FF3F]" />}
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 leading-tight">
                    {activeMetricModal === 'km' && 'Deslocamento do Dia (Trechos)'}
                    {activeMetricModal === 'custo' && 'Custo Total Estimado'}
                    {activeMetricModal === 'reservas' && 'Reservas e Ingressos Pendentes'}
                  </h3>
                  <p className="text-xs text-slate-500 font-bold mt-0.5">Sem adivinhações: cálculo item a item</p>
                </div>
              </div>
              <button 
                onClick={() => setActiveMetricModal(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </header>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
              {activeMetricModal === 'km' && (
                <>
                  <p className="text-xs font-bold text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
                    Soma das distâncias entre as paradas deste dia, calculada pelo algoritmo Haversine e corrigida com fator de 1,25x para a malha ortogonal urbana de Manhattan.
                  </p>
                  <ul className="space-y-2.5">
                    {orderedDayStops.map((stop, idx) => {
                      const prevPoint = idx === 0 
                        ? (basecamp?.lat != null && basecamp?.lng != null ? { lat: basecamp.lat, lng: basecamp.lng, name: basecamp.name || 'Seu Hotel' } : null)
                        : (orderedDayStops[idx - 1]?.lat != null && orderedDayStops[idx - 1]?.lng != null ? { lat: orderedDayStops[idx - 1].lat!, lng: orderedDayStops[idx - 1].lng!, name: orderedDayStops[idx - 1].title } : null);
                      
                      const hint = prevPoint && stop.lat != null && stop.lng != null ? getTravelHint(prevPoint, { lat: stop.lat, lng: stop.lng }) : null;
                      return (
                        <li key={stop.id || idx} className="p-3.5 bg-white rounded-2xl border border-slate-200 flex items-center justify-between text-xs shadow-2xs">
                          <div className="min-w-0 flex-1 pr-3">
                            <span className="font-extrabold text-[#14150F] block truncate">{idx + 1}. {stop.title}</span>
                            <span className="text-[11px] font-bold text-slate-500 block truncate mt-0.5">
                              {prevPoint ? `Partindo de: ${prevPoint.name}` : 'Ponto inicial do trajeto'}
                            </span>
                          </div>
                          <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-xl font-black shrink-0 border border-indigo-100">
                            {hint ? `${hint.km.toFixed(1).replace('.', ',')} km (~${hint.minutes} min)` : '—'}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                  <div className="flex items-center justify-between p-4 bg-slate-900 text-white rounded-2xl text-sm font-black shadow-lg">
                    <span>Deslocamento somado hoje</span>
                    <span className="text-lime-400 font-mono text-base">{dailyStats.totalKm > 0 ? `${dailyStats.totalKm.toFixed(1).replace('.', ',')} km` : '—'}</span>
                  </div>
                </>
              )}

              {activeMetricModal === 'custo' && (
                <>
                  <p className="text-xs font-bold text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
                    Somatória dos preços e custos base cadastrados pela curadoria no Admin para as atrações e refeições programadas para hoje.
                  </p>
                  <ul className="space-y-2.5">
                    {dailyStats.costDetails.length > 0 ? (
                      dailyStats.costDetails.map((item, idx) => (
                        <li key={idx} className="p-3.5 bg-white rounded-2xl border border-slate-200 flex items-center justify-between text-xs shadow-2xs">
                          <span className="font-black text-[#14150F] truncate pr-3">{item.title}</span>
                          <span className="px-3 py-1 bg-emerald-50 text-emerald-800 rounded-xl font-black shrink-0 border border-emerald-100">
                            US$ {item.cost}
                          </span>
                        </li>
                      ))
                    ) : (
                      <li className="p-6 text-center text-slate-500 text-xs font-bold bg-slate-50 rounded-2xl border border-slate-200">
                        Nenhuma vivência com custo em dólar cadastrado para este dia (passeios livres ou valor a consultar).
                      </li>
                    )}
                  </ul>
                  <div className="flex items-center justify-between p-4 bg-slate-900 text-white rounded-2xl text-sm font-black shadow-lg">
                    <span>Custo total somado hoje</span>
                    <span className="text-emerald-400 font-mono text-base">US$ {dailyStats.totalCost}</span>
                  </div>
                </>
              )}

              {activeMetricModal === 'reservas' && (
                <>
                  <p className="text-xs font-bold text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
                    Locais concorridos deste dia marcados com agendamento obrigatório de horário ou compra de ingresso antecipada.
                  </p>
                  <ul className="space-y-2.5">
                    {dailyStats.bookingsNeeded.length > 0 ? (
                      dailyStats.bookingsNeeded.map((book, idx) => (
                        <li key={idx} className="p-3.5 bg-white rounded-2xl border border-slate-200 flex items-center justify-between text-xs shadow-2xs gap-3">
                          <div className="min-w-0 flex-1">
                            <span className="font-black text-[#14150F] block truncate">{book.title}</span>
                            <span className="text-[11px] text-slate-500 font-bold block mt-0.5">Horário da parada: {book.time || 'A confirmar'}</span>
                          </div>
                          {book.url ? (
                            <a href={book.url} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 bg-[#D6FF3F] hover:bg-[#c3ec2e] text-slate-950 font-black text-[11px] rounded-xl border border-[#b8e624] shrink-0 shadow-2xs transition-all">
                              Reservar Online
                            </a>
                          ) : (
                            <span className="px-3 py-1 bg-amber-100 text-amber-900 rounded-xl font-black text-[11px] shrink-0">
                              No local / fone
                            </span>
                          )}
                        </li>
                      ))
                    ) : (
                      <li className="p-6 text-center text-slate-500 text-xs font-bold bg-slate-50 rounded-2xl border border-slate-200">
                        Todas as paradas deste dia possuem acesso livre sem necessidade de ingresso com hora marcada.
                      </li>
                    )}
                  </ul>
                </>
              )}
            </div>

            <footer className="pt-2 border-t border-slate-100 flex justify-end">
              <button 
                onClick={() => setActiveMetricModal(null)}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-black text-xs transition-colors shadow-sm"
              >
                Fechar Painel
              </button>
            </footer>
          </div>
        </div>
      )}
      {journalStop && (
        <BoardingJournalModal 
          stop={journalStop}
          onClose={() => setJournalStop(null)}
          onSave={(time, cost) => {
            // Persiste a edição localmente na UI para reflexo imediato no card
            setLocalEdits(prev => ({
              ...prev,
              [journalStop.id]: { time, cost: cost.toString() }
            }));
            
            // Dispara o salvamento permanente no Supabase (Engine/Banco)
            if (onUpdateActivity) {
              onUpdateActivity(journalStop.id, { 
                time, 
                cost: `US$ ${parseFloat(cost.toString()).toFixed(2).replace('.00', '')}` 
              });
            }
            
            setJournalStop(null);
          }}
        />
      )}
    </section>
  );
}
