import React, { useState } from 'react';
import { 
  Clock, MapPin, DollarSign, CheckCircle2, ChevronRight, 
  ArrowUp, ArrowDown, Shuffle, CloudRain, Navigation, AlertCircle, Info 
} from 'lucide-react';
import { TripSpaceDay, TripSpaceStop, TripSpaceBasecamp } from '@/types/tripSpace.types';
import MapLibreMap from '@/components/MapLibreMap';

interface DayWorkspaceProps {
  days: TripSpaceDay[];
  activeDay: number;
  onDayChange: (dayNum: number) => void;
  basecamp?: TripSpaceBasecamp;
  onToggleLock?: (activityId: string, isLocked: boolean) => void;
  onCreateDraft?: (intent: import('@/domain/itinerary-engine/edit-intents').ItineraryEditIntent) => void;
  onCommitDraft?: () => void;
  onClearDraft?: () => void;
  editDraft?: import('@/domain/itinerary-engine/edit-intents').ItineraryEditDraft | null;
  draftLoading?: boolean;
}

export function DayWorkspace({ 
  days, activeDay, onDayChange, basecamp, 
  onToggleLock, onCreateDraft, onCommitDraft, onClearDraft, editDraft, draftLoading 
}: DayWorkspaceProps) {
  const [selectedStopId, setSelectedStopId] = useState<string | null>(null);
  const [quickNotice, setQuickNotice] = useState<string | null>(null);

  const currentDay = days.find(d => d.dayNumber === activeDay) || days[0];

  const handleQuickAction = (actionName: string) => {
    setQuickNotice(`${actionName}: Funcionalidade estará disponível em breve.`);
    setTimeout(() => setQuickNotice(null), 3000);
  };

  return (
    <section className="mb-8">
      {/* Day Selector Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 scrollbar-none">
        {days.map((day) => {
          const isActive = day.dayNumber === activeDay;
          return (
            <button
              key={day.dayNumber}
              onClick={() => onDayChange(day.dayNumber)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              Dia {day.dayNumber}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Timeline (Col 1-7) */}
        <div className="lg:col-span-7 bg-white border border-slate-200/80 rounded-[28px] p-6 shadow-xs">
          {/* Day Header */}
          <div className="flex items-center justify-between pb-6 mb-6 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-purple-100 text-purple-800 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full">
                  Dia {currentDay?.dayNumber || 1}
                </span>
                <h2 className="text-xl font-extrabold text-slate-900">
                  {currentDay?.dateStr?.includes(new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }))
                    ? 'Roteiro de hoje'
                    : `Roteiro do Dia ${currentDay?.dayNumber || 1}`}
                </h2>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                {currentDay?.dateStr || 'Programação selecionada'}
              </p>
            </div>
            <div className="text-xs font-bold text-slate-400 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
              {currentDay?.stops?.length || 0} paradas
            </div>
          </div>

          {/* Timeline Items */}
          {!currentDay || !currentDay.stops || currentDay.stops.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <p className="text-sm font-bold text-slate-700">Nenhuma atração agendada para este dia.</p>
              <p className="text-xs text-slate-500 mt-1">Explore ideias salvas para adicionar a este dia.</p>
            </div>
          ) : (
            <div className="relative pl-6 space-y-6 before:absolute before:left-[11px] before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
              {currentDay.stops.map((stop, idx) => {
                const isSelected = selectedStopId === stop.id;
                return (
                  <div
                    key={stop.id}
                    onClick={() => setSelectedStopId(stop.id)}
                    className={`relative bg-white rounded-2xl p-4 border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-lime-500 ring-2 ring-lime-400/20 shadow-md'
                        : 'border-slate-100 hover:border-slate-300 shadow-xs'
                    }`}
                  >
                    {/* Timeline Node Dot */}
                    <div className={`absolute -left-[30px] top-5 w-4 h-4 rounded-full border-2 border-white transition-colors ${
                      stop.isBooked ? 'bg-lime-500' : 'bg-slate-400'
                    }`} />

                    <div className="flex gap-4">
                      {/* Photo Thumbnail */}
                      {stop.imageUrl ? (
                        <img
                          src={stop.imageUrl}
                          alt={stop.title}
                          onError={(e) => {
                            (e.target as HTMLImageElement).onerror = null;
                            (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIiB2aWV3Qm94PSIwIDAgMjQgMjQiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI2NidjVkMiIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxwYXRoIGQ9Ik0xNC41IDIuNUwyIDE1bDEwIDEwIDEyLjUtMTIuNWMuNi0uNiAxLjUtLjYgMi4xIDBsMi44IDIuOGMuNi42LjYgMS41IDAgMi4xTDE3IDI5bC0xNC0xNHoiLz48L3N2Zz4='; // small fallback invisible
                            (e.target as HTMLImageElement).style.display = 'none'; // Better to just hide it
                            (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                          }}
                          className="w-20 h-20 rounded-xl object-cover shrink-0"
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 text-slate-400 font-bold text-xs">
                          Foto
                        </div>
                      )}
                      {/* Explicit fallback element shown only if image fails */}
                      {stop.imageUrl && (
                        <div className="hidden w-20 h-20 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 text-slate-400 font-bold text-xs">
                          Foto
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        {/* Meta top */}
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-[11px] font-extrabold text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {stop.time || '10:00'}
                          </span>
                          {stop.isBooked ? (
                            <span className="bg-lime-100 text-lime-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-lime-600" /> Reservado
                            </span>
                          ) : (
                            <span className="bg-slate-100 text-slate-600 text-[10px] font-extrabold px-2 py-0.5 rounded-full capitalize">
                              {stop.category === 'attraction' ? 'Atração' : stop.category === 'engine' ? 'Engine' : stop.category === 'local_fallback' ? 'Local' : stop.category}
                            </span>
                          )}
                        </div>

                        {/* Title */}
                        <h3 className="font-extrabold text-slate-900 text-sm truncate">{stop.title}</h3>
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5 truncate">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" /> {stop.neighborhood}
                        </p>
                        
                        {/* Editorial Short Description */}
                        <p className="text-xs text-slate-600 line-clamp-1 mt-1 font-medium">
                          {stop.description}
                        </p>

                        {/* Duration & Cost */}
                        <div className="flex items-center gap-4 mt-2 text-[11px] font-bold text-slate-500">
                          <span>{stop.duration}</span>
                          <span>•</span>
                          <span className="text-slate-700">{stop.cost}</span>
                        </div>
                        
                        {/* Expanded Actions */}
                        {isSelected && (
                          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-2">
                            <button
                              onClick={(e) => { e.stopPropagation(); if (stop.isFixed) { setQuickNotice("Itens fixos não podem ser removidos."); return; } onCreateDraft?.({ tripId: '', action: 'REMOVE', activityId: stop.id }); }}
                              className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              title="Remover"
                            >
                              <AlertCircle className="w-4 h-4" /> {/* Fallback icon for Trash */}
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); onToggleLock?.(stop.id, !stop.isLocked); }}
                              className={`p-2 rounded-lg transition-colors ${stop.isLocked ? 'text-purple-600 bg-purple-50' : 'text-slate-500 hover:bg-slate-50'}`}
                              title={stop.isLocked ? "Destrancar" : "Trancar"}
                            >
                              <Info className="w-4 h-4" /> {/* Fallback icon for Lock */}
                            </button>
                            <div className="flex-1" />
                            <button
                              onClick={(e) => { e.stopPropagation(); if (idx === 0) return; onCreateDraft?.({ tripId: '', action: 'MOVE', activityId: stop.id, sourceDay: currentDay.dayNumber, targetDay: currentDay.dayNumber, targetPosition: idx - 1 }); }}
                              className="p-2 text-slate-500 hover:bg-slate-50 rounded-lg transition-colors disabled:opacity-30"
                              disabled={idx === 0}
                              title="Mover para cima"
                            >
                              <ArrowUp className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); if (idx === currentDay.stops.length - 1) return; onCreateDraft?.({ tripId: '', action: 'MOVE', activityId: stop.id, sourceDay: currentDay.dayNumber, targetDay: currentDay.dayNumber, targetPosition: idx + 1 }); }}
                              className="p-2 text-slate-500 hover:bg-slate-50 rounded-lg transition-colors disabled:opacity-30"
                              disabled={idx === currentDay.stops.length - 1}
                              title="Mover para baixo"
                            >
                              <ArrowDown className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleQuickAction("Substituir"); }}
                              className="text-xs font-bold px-3 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
                            >
                              Substituir
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Map & Quick Adjustments (Col 8-12) */}
        <div className="lg:col-span-5 space-y-6 flex flex-col justify-between">
          {/* Day Map Box */}
          <div className="bg-white border border-slate-200/80 rounded-[28px] p-5 shadow-xs flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-slate-900 text-sm">Mapa do dia</h3>
              <span className="text-xs font-bold text-slate-500">
                {currentDay?.stops?.filter(s => s.lat && s.lng).length || 0} pontos geolocalizados
              </span>
            </div>

            {currentDay?.stops?.some(s => s.lat && s.lng) ? (
              <div className="relative w-full h-96 bg-slate-100 rounded-2xl overflow-hidden border border-slate-200/60">
                <MapLibreMap attractions={currentDay.stops.filter(s => s.lat && s.lng).map(s => ({
                  id: s.id,
                  name: s.title,
                  neighborhood: s.neighborhood,
                  coordinates: { lat: s.lat!, lng: s.lng! }
                })) as any} />
              </div>
            ) : (
              <div className="relative w-full h-64 bg-slate-100 rounded-2xl overflow-hidden border border-slate-200/60 flex items-center justify-center p-4">
                <div className="relative z-10 text-center space-y-2">
                  <AlertCircle className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="text-xs font-bold text-slate-800">Mapa indisponível</p>
                  <p className="text-[11px] text-slate-500">Coordenadas insuficientes para exibir o mapa deste dia.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Preview Modal */}
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
    </section>
  );
}
