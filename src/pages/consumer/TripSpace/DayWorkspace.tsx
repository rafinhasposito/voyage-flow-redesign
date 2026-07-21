import React, { useState } from 'react';
import { 
  Clock, MapPin, DollarSign, CheckCircle2, ChevronRight, 
  ArrowUp, ArrowDown, Shuffle, CloudRain, Navigation, AlertCircle, Info 
} from 'lucide-react';
import { TripSpaceDay, TripSpaceStop, TripSpaceBasecamp } from '@/types/tripSpace.types';

interface DayWorkspaceProps {
  days: TripSpaceDay[];
  activeDay: number;
  onDayChange: (dayNum: number) => void;
  basecamp?: TripSpaceBasecamp;
}

export function DayWorkspace({ days, activeDay, onDayChange, basecamp }: DayWorkspaceProps) {
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
                          className="w-20 h-20 rounded-xl object-cover shrink-0"
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 text-slate-400 font-bold text-xs">
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
                            <span className="bg-slate-100 text-slate-600 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                              {stop.category}
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

            {/* Simulated Map Visual Box */}
            <div className="relative w-full h-64 bg-slate-100 rounded-2xl overflow-hidden border border-slate-200/60 flex items-center justify-center p-4">
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:16px_16px]" />
              
              <div className="relative z-10 text-center space-y-2">
                <MapPin className="w-8 h-8 text-lime-600 mx-auto animate-bounce" />
                <p className="text-xs font-bold text-slate-800">
                  {currentDay?.stops?.length ? `${currentDay.stops.length} paradas no roteiro` : 'Sem pontos no mapa'}
                </p>
                <p className="text-[11px] text-slate-500">
                  {basecamp ? `Basecamp: ${basecamp.name}` : 'Nenhuma hospedagem configurada'}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Adjustments Card */}
          <div className="bg-white border border-slate-200/80 rounded-[28px] p-5 shadow-xs">
            <h3 className="font-extrabold text-slate-900 text-sm mb-3">Ajustes rápidos</h3>

            {quickNotice && (
              <div className="mb-3 p-2.5 bg-slate-900 text-white text-xs rounded-xl flex items-center gap-2 animate-in fade-in">
                <Info className="w-4 h-4 text-lime-400 shrink-0" />
                <span>{quickNotice}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2.5">
              <button
                disabled
                className="bg-slate-50 border border-slate-200/60 p-3 rounded-2xl text-left opacity-60 cursor-not-allowed relative"
              >
                <span className="absolute top-2 right-2 bg-slate-200 text-slate-700 text-[9px] font-extrabold px-1.5 py-0.5 rounded">Em breve</span>
                <Shuffle className="w-4 h-4 text-slate-600 mb-1" />
                <p className="text-xs font-extrabold text-slate-800">Reordenar dia</p>
                <p className="text-[10px] text-slate-500">Otimizar sequência</p>
              </button>

              <button
                disabled
                className="bg-slate-50 border border-slate-200/60 p-3 rounded-2xl text-left opacity-60 cursor-not-allowed relative"
              >
                <span className="absolute top-2 right-2 bg-slate-200 text-slate-700 text-[9px] font-extrabold px-1.5 py-0.5 rounded">Em breve</span>
                <Shuffle className="w-4 h-4 text-slate-600 mb-1" />
                <p className="text-xs font-extrabold text-slate-800">Substituir atividade</p>
                <p className="text-[10px] text-slate-500">Encontrar alternativas</p>
              </button>

              <button
                disabled
                className="bg-slate-50 border border-slate-200/60 p-3 rounded-2xl text-left opacity-60 cursor-not-allowed relative"
              >
                <span className="absolute top-2 right-2 bg-slate-200 text-slate-700 text-[9px] font-extrabold px-1.5 py-0.5 rounded">Em breve</span>
                <CloudRain className="w-4 h-4 text-slate-600 mb-1" />
                <p className="text-xs font-extrabold text-slate-800">Plano de chuva</p>
                <p className="text-[10px] text-slate-500">Atividades indoor</p>
              </button>

              <button
                disabled
                className="bg-slate-50 border border-slate-200/60 p-3 rounded-2xl text-left opacity-60 cursor-not-allowed relative"
              >
                <span className="absolute top-2 right-2 bg-slate-200 text-slate-700 text-[9px] font-extrabold px-1.5 py-0.5 rounded">Em breve</span>
                <Navigation className="w-4 h-4 text-slate-600 mb-1" />
                <p className="text-xs font-extrabold text-slate-800">Otimizar rota</p>
                <p className="text-[10px] text-slate-500">Menos tempo em trânsito</p>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
