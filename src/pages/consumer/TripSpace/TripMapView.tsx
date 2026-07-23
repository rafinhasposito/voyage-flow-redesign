import React, { useState } from 'react';
import { MapPin, Navigation, Compass, Layers, Calendar, ExternalLink } from 'lucide-react';
import { TripSpaceViewModel } from '@/types/tripSpace.types';

interface TripMapViewProps {
  data: TripSpaceViewModel;
  activeDay: number;
  onDaySelect: (dayNumber: number) => void;
}

export function TripMapView({ data, activeDay, onDaySelect }: TripMapViewProps) {
  const [selectedDayFilter, setSelectedDayFilter] = useState<number | 'all'>(activeDay);
  const [selectedStopId, setSelectedStopId] = useState<string | null>(null);

  // Collect all stops with coordinates
  const allStops = (data.days || []).flatMap(day => 
    (day.stops || []).map(stop => ({
      ...stop,
      dayNumber: day.dayNumber,
      dateStr: day.dateStr
    }))
  );

  const displayedStops = selectedDayFilter === 'all' 
    ? allStops 
    : allStops.filter(s => s.dayNumber === selectedDayFilter);

  const activeStop = displayedStops.find(s => s.id === selectedStopId) || displayedStops[0];

  // Base map center (default NYC: 40.7580, -73.9855)
  const centerLat = activeStop?.lat || 40.7580;
  const centerLng = activeStop?.lng || -73.9855;

  return (
    <div className="space-y-6">
      {/* Header & Filter bar */}
      <div className="bg-white border border-slate-200/80 rounded-[28px] p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-lime-100 text-lime-800 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <Navigation className="w-3 h-3 text-lime-700" /> Mapa Inteligente
            </span>
            <h2 className="text-xl font-extrabold text-slate-900">Mapa do Roteiro em Nova York</h2>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Visualização geográfica de {displayedStops.length} atrações agendadas.
          </p>
        </div>

        {/* Day Selector Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
          <button
            onClick={() => setSelectedDayFilter('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              selectedDayFilter === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todos os dias
          </button>
          {(data.days || []).map(day => (
            <button
              key={day.dayNumber}
              onClick={() => {
                setSelectedDayFilter(day.dayNumber);
                onDaySelect(day.dayNumber);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedDayFilter === day.dayNumber
                  ? 'bg-lime-400 text-slate-950 shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Dia {day.dayNumber}
            </button>
          ))}
        </div>
      </div>

      {/* Main Map & Interactive Sidebar Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Map Display Container (9 cols) */}
        <div className="lg:col-span-8 bg-white border border-slate-200/80 rounded-[28px] overflow-hidden shadow-xs relative min-h-[520px]">
          {/* Interactive OpenStreetMap Embed */}
          <iframe
            title="Interactive Itinerary Map"
            width="100%"
            height="520"
            frameBorder="0"
            scrolling="no"
            src={`https://www.openstreetmap.org/export/embed.html?bbox=${centerLng - 0.05}%2C${centerLat - 0.03}%2C${centerLng + 0.05}%2C${centerLat + 0.03}&layer=mapnik&marker=${centerLat}%2C${centerLng}`}
            className="w-full h-[520px] border-0"
          />

          {/* Map Overlay Badge */}
          <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md border border-slate-200/80 px-4 py-2 rounded-2xl shadow-md flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-lime-500 animate-ping" />
            <span className="text-xs font-extrabold text-slate-900">
              {activeStop ? activeStop.title : 'Nova York'}
            </span>
          </div>

          {/* Quick Google Maps directions link */}
          {activeStop && activeStop.lat && activeStop.lng && (
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activeStop.title + ' ' + activeStop.neighborhood + ' NYC')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute bottom-4 right-4 bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold px-4 py-2.5 rounded-2xl shadow-lg flex items-center gap-2 transition-all"
            >
              <ExternalLink className="w-3.5 h-3.5 text-lime-400" /> Google Maps
            </a>
          )}
        </div>

        {/* Paradas List (4 cols) */}
        <div className="lg:col-span-4 space-y-3 max-h-[520px] overflow-y-auto pr-1">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 px-1">
            Paradas do Dia {selectedDayFilter === 'all' ? 'Todas' : selectedDayFilter}
          </h3>

          {displayedStops.map((stop, idx) => {
            const isSelected = activeStop?.id === stop.id;
            return (
              <div
                key={stop.id}
                onClick={() => setSelectedStopId(stop.id)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center gap-3 ${
                  isSelected
                    ? 'bg-slate-900 text-white border-slate-900 shadow-md scale-[1.02]'
                    : 'bg-white text-slate-900 border-slate-200/80 hover:border-slate-300 shadow-xs'
                }`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-extrabold text-xs shrink-0 ${
                  isSelected ? 'bg-lime-400 text-slate-950' : 'bg-slate-100 text-slate-700'
                }`}>
                  {idx + 1}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="font-extrabold text-xs truncate leading-tight">{stop.title}</p>
                  <p className={`text-[11px] truncate flex items-center gap-1 mt-0.5 ${
                    isSelected ? 'text-slate-300' : 'text-slate-500'
                  }`}>
                    <MapPin className="w-3 h-3 shrink-0" /> {stop.neighborhood}
                  </p>
                </div>

                {stop.time && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                    isSelected ? 'bg-slate-800 text-lime-400' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {stop.time}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
