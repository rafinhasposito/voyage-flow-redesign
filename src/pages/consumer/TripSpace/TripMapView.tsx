import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Navigation, Compass, Layers, ExternalLink, Plane, Bed, Utensils, Ticket } from 'lucide-react';
import { TripSpaceViewModel } from '@/types/tripSpace.types';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

interface TripMapViewProps {
  data: TripSpaceViewModel;
  activeDay: number;
  onDaySelect: (dayNumber: number) => void;
}

type FilterCategory = 'all' | 'flight' | 'lodging' | 'restaurant' | 'attraction';

export function TripMapView({ data, activeDay, onDaySelect }: TripMapViewProps) {
  const [selectedDayFilter, setSelectedDayFilter] = useState<number | 'all'>(activeDay);
  const [selectedCategory, setSelectedCategory] = useState<FilterCategory>('all');
  const [selectedStopId, setSelectedStopId] = useState<string | null>(null);

  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);

  // Collect all stops with coordinates
  const allStops = (data.days || []).flatMap(day => 
    (day.stops || []).map(stop => ({
      ...stop,
      dayNumber: day.dayNumber,
      dateStr: day.dateStr
    }))
  );

  let displayedStops = selectedDayFilter === 'all' 
    ? allStops 
    : allStops.filter(s => Number(s.dayNumber) === Number(selectedDayFilter));

  if (selectedCategory !== 'all') {
    displayedStops = displayedStops.filter(s => s.category === selectedCategory);
  }

  const activeStop = displayedStops.find(s => s.id === selectedStopId) || displayedStops[0];

  useEffect(() => {
    if (!mapContainer.current) return;

    if (!mapRef.current) {
      mapRef.current = new maplibregl.Map({
        container: mapContainer.current,
        style: 'https://tiles.openfreemap.org/styles/liberty',
        center: [-73.9855, 40.7580],
        zoom: 12,
        attributionControl: false
      });
      mapRef.current.addControl(new maplibregl.NavigationControl(), 'bottom-right');
    }

    const map = mapRef.current;

    // Clear old markers and lines
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];
    if (map.getLayer('flight-path')) map.removeLayer('flight-path');
    if (map.getSource('flights')) map.removeSource('flights');

    const bounds = new maplibregl.LngLatBounds();
    let hasPoints = false;
    const flightCoordinates: [number, number][] = [];

    displayedStops.forEach(stop => {
      if (stop.lat && stop.lng) {
        hasPoints = true;
        bounds.extend([stop.lng, stop.lat]);

        if (stop.category === 'flight') {
          flightCoordinates.push([stop.lng, stop.lat]);
        }

        const el = document.createElement('div');
        let icon = '📍';
        let bgColor = 'bg-slate-900';
        if (stop.category === 'flight') { icon = '✈️'; bgColor = 'bg-blue-600'; }
        if (stop.category === 'lodging') { icon = '🏨'; bgColor = 'bg-purple-600'; }
        if (stop.category === 'restaurant') { icon = '🍽️'; bgColor = 'bg-orange-500'; }
        if (stop.category === 'attraction') { icon = '📸'; bgColor = 'bg-lime-500'; }

        el.className = `w-8 h-8 ${bgColor} rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white text-sm cursor-pointer transition-transform hover:scale-110`;
        el.innerText = icon;
        
        if (activeStop?.id === stop.id) {
          el.classList.add('ring-4', 'ring-lime-400/50', 'scale-125');
        }

        el.addEventListener('click', () => setSelectedStopId(stop.id));

        const marker = new maplibregl.Marker(el)
          .setLngLat([stop.lng, stop.lat])
          .addTo(map);

        markersRef.current.push(marker);
      }
    });

    if (flightCoordinates.length > 1 && selectedCategory === 'flight') {
      map.addSource('flights', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: flightCoordinates
          }
        }
      });
      map.addLayer({
        id: 'flight-path',
        type: 'line',
        source: 'flights',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#2563eb',
          'line-width': 4,
          'line-dasharray': [2, 2]
        }
      });
    }

    if (hasPoints) {
      if (activeStop?.lat && activeStop?.lng) {
        map.flyTo({ center: [activeStop.lng, activeStop.lat], zoom: selectedCategory === 'flight' ? 4 : 14 });
      } else {
        map.fitBounds(bounds, { padding: 50, maxZoom: 14 });
      }
    }
  }, [displayedStops, activeStop, selectedCategory]);

  return (
    <div className="space-y-6">
      {/* Header & Filter bar */}
      <div className="bg-white border border-slate-200/80 rounded-[28px] p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-lime-100 text-lime-800 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <Navigation className="w-3 h-3 text-lime-700" /> Mapa Inteligente
            </span>
            <h2 className="text-xl font-extrabold text-slate-900">Mapa do Roteiro</h2>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Visualização geográfica de {displayedStops.length} itens encontrados.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3">
          {/* Category Selector */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide max-w-full">
            <button onClick={() => setSelectedCategory('all')} className={`px-3 py-1.5 rounded-full text-[11px] font-extrabold transition-all flex items-center gap-1.5 ${selectedCategory === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-600 border border-slate-200'}`}>
              <Layers className="w-3.5 h-3.5" /> Tudo
            </button>
            <button onClick={() => setSelectedCategory('flight')} className={`px-3 py-1.5 rounded-full text-[11px] font-extrabold transition-all flex items-center gap-1.5 ${selectedCategory === 'flight' ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-600 border border-slate-200'}`}>
              <Plane className="w-3.5 h-3.5" /> Voos
            </button>
            <button onClick={() => setSelectedCategory('lodging')} className={`px-3 py-1.5 rounded-full text-[11px] font-extrabold transition-all flex items-center gap-1.5 ${selectedCategory === 'lodging' ? 'bg-purple-600 text-white' : 'bg-slate-50 text-slate-600 border border-slate-200'}`}>
              <Bed className="w-3.5 h-3.5" /> Hotéis
            </button>
            <button onClick={() => setSelectedCategory('restaurant')} className={`px-3 py-1.5 rounded-full text-[11px] font-extrabold transition-all flex items-center gap-1.5 ${selectedCategory === 'restaurant' ? 'bg-orange-500 text-white' : 'bg-slate-50 text-slate-600 border border-slate-200'}`}>
              <Utensils className="w-3.5 h-3.5" /> Restaurantes
            </button>
          </div>

          {/* Day Selector */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
            <button
              onClick={() => setSelectedDayFilter('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedDayFilter === 'all'
                  ? 'bg-lime-400 text-slate-950 shadow-xs'
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
      </div>

      {/* Main Map & Interactive Sidebar Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Map Display Container (8 cols) */}
        <div className="lg:col-span-8 bg-slate-900 rounded-[32px] overflow-hidden shadow-xl relative min-h-[520px] border border-slate-800" ref={mapContainer}>
          {/* Map Overlay Badge */}
          <div className="absolute top-6 left-6 bg-slate-900/80 backdrop-blur-xl border border-white/10 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 z-10 pointer-events-none">
            <div className="w-3 h-3 rounded-full bg-lime-400 animate-pulse shadow-[0_0_10px_rgba(163,230,53,0.5)]" />
            <span className="text-sm font-extrabold text-white">
              {activeStop ? activeStop.title : 'Nenhum local selecionado'}
            </span>
          </div>

          {/* Quick Google Maps directions link */}
          {activeStop && activeStop.lat && activeStop.lng && (
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${activeStop.lat},${activeStop.lng}&destination_place_id=${encodeURIComponent(activeStop.title)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute bottom-6 left-6 bg-lime-400 text-slate-950 hover:bg-lime-500 text-xs font-extrabold px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 transition-all z-10"
            >
              <Navigation className="w-4 h-4" /> Traçar Rota (Google Maps)
            </a>
          )}
        </div>

        {/* Paradas List (4 cols) */}
        <div className="lg:col-span-4 space-y-3 max-h-[520px] overflow-y-auto pr-1">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 px-1">
            Listagem
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
                    <MapPin className="w-3 h-3 shrink-0" /> {stop.neighborhood || stop.category}
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
          {displayedStops.length === 0 && (
            <div className="p-8 text-center text-slate-400 text-sm">
              Nenhuma parada encontrada para este filtro.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
