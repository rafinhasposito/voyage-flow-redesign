import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MapPin, Navigation, Layers, Plane, Bed, Utensils, Compass, CheckCircle2, ChevronRight } from 'lucide-react';
import { TripSpaceViewModel, TripSpaceStop } from '@/types/tripSpace.types';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { getTravelHint } from '@/pages/consumer/BdayRafaRoteiroNY/logistics';

interface TripMapViewV2Props {
  data: TripSpaceViewModel;
  activeDay: number;
  onDaySelect: (dayNumber: number) => void;
}

type FilterCategory = 'all' | 'flight' | 'lodging' | 'restaurant' | 'attraction';

export function TripMapViewV2({ data, activeDay, onDaySelect }: TripMapViewV2Props) {
  const [selectedDayFilter, setSelectedDayFilter] = useState<number | 'all'>(activeDay);
  const [selectedCategory, setSelectedCategory] = useState<FilterCategory>('all');
  const [selectedStopId, setSelectedStopId] = useState<string | null>(null);

  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);

  // Coleta de paradas da viagem
  const allStops = useMemo(() => {
    return (data.days || []).flatMap(day => 
      (day.stops || []).map(stop => ({
        ...stop,
        dayNumber: day.dayNumber,
        dateStr: day.dateStr
      }))
    );
  }, [data.days]);

  const displayedStops = useMemo(() => {
    let list = selectedDayFilter === 'all' 
      ? allStops 
      : allStops.filter(s => Number(s.dayNumber) === Number(selectedDayFilter));

    if (selectedCategory !== 'all') {
      list = list.filter(s => s.category === selectedCategory);
    }
    return list;
  }, [allStops, selectedDayFilter, selectedCategory]);

  const activeStop = displayedStops.find(s => s.id === selectedStopId) || displayedStops[0];

  // Cálculo da distância total Haversine para a vista selecionada
  const totalKm = useMemo(() => {
    let km = 0;
    const coords: { lat: number; lng: number }[] = [];
    if (data.basecamp?.lat && data.basecamp?.lng) {
      coords.push({ lat: data.basecamp.lat, lng: data.basecamp.lng });
    }
    displayedStops.forEach(s => {
      if (s.lat != null && s.lng != null) coords.push({ lat: s.lat, lng: s.lng });
    });
    for (let i = 0; i < coords.length - 1; i++) {
      const hint = getTravelHint(coords[i], coords[i + 1]);
      if (hint) km += hint.km;
    }
    return km;
  }, [data.basecamp, displayedStops]);

  useEffect(() => {
    if (!mapContainer.current) return;

    if (!mapRef.current) {
      mapRef.current = new maplibregl.Map({
        container: mapContainer.current,
        style: 'https://tiles.openfreemap.org/styles/liberty', // OpenFreeMap sem custos Google
        center: [-73.9855, 40.7580],
        zoom: 12,
        attributionControl: false
      });
      mapRef.current.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');
    }

    const map = mapRef.current;
    const basecamp = data.basecamp;

    const renderMapElements = () => {
      markersRef.current.forEach(m => m.remove());
      markersRef.current = [];

      const bounds = new maplibregl.LngLatBounds();
      const routeCoordinates: [number, number][] = [];
      let hasPoints = false;

      // 1. Adicionar Pino H para o Basecamp / Hotel principal se houver coordenadas
      if (basecamp?.lat != null && basecamp?.lng != null && !isNaN(basecamp.lat) && !isNaN(basecamp.lng)) {
        hasPoints = true;
        bounds.extend([basecamp.lng, basecamp.lat]);
        routeCoordinates.push([basecamp.lng, basecamp.lat]);

        const el = document.createElement('div');
        el.className = 'w-7 h-7 bg-slate-900 text-white rounded-full border-2 border-white shadow-lg flex items-center justify-center font-black text-xs cursor-pointer select-none transition-transform hover:scale-110 z-20';
        el.innerText = 'H';
        el.setAttribute('aria-label', `${basecamp.name || 'Hotel'} (Basecamp)`);

        const popup = new maplibregl.Popup({ offset: 18, closeButton: false }).setHTML(
          `<div style="font-family: sans-serif; padding: 4px 6px; text-align: left;"><b>HOSPEDAGEM / BASECAMP</b><br/><span style="font-size: 13px; font-weight: bold; color: #14150F;">${basecamp.name || 'Seu Hotel'}</span></div>`
        );

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([basecamp.lng, basecamp.lat])
          .setPopup(popup)
          .addTo(map);

        markersRef.current.push(marker);
      }

      // 2. Iterar sobre as paradas (Ordem cronológica 1 ➔ 2 ➔ 3 ou H para lodging)
      let stopCounter = 0;
      displayedStops.forEach(stop => {
        if (stop.lat != null && stop.lng != null && !isNaN(stop.lat) && !isNaN(stop.lng)) {
          hasPoints = true;
          bounds.extend([stop.lng, stop.lat]);
          routeCoordinates.push([stop.lng, stop.lat]);

          const isLodging = stop.category === 'lodging';
          const el = document.createElement('div');

          let markerText = 'H';
          if (!isLodging) {
            stopCounter += 1;
            markerText = String(stopCounter);
          }

          const isSelected = activeStop?.id === stop.id;
          const bgColor = isLodging ? 'bg-slate-900' : isSelected ? 'bg-[#D6FF3F] text-[#14150F]' : 'bg-[#1D6FE0] text-white';

          el.className = `w-7 h-7 ${bgColor} rounded-full border-2 border-white shadow-lg flex items-center justify-center font-black text-xs cursor-pointer transition-all select-none hover:scale-110 ${
            isSelected ? 'ring-4 ring-indigo-500/30 scale-125 z-30' : 'z-10'
          }`;
          el.innerText = markerText;
          el.addEventListener('click', () => setSelectedStopId(stop.id));

          const popup = new maplibregl.Popup({ offset: 18, closeButton: false }).setHTML(
            `<div style="font-family: sans-serif; padding: 4px 6px; text-align: left;"><b>${isLodging ? 'HOSPEDAGEM' : `PARADA ${stopCounter}`}</b><br/><span style="font-size: 13px; font-weight: bold; color: #14150F;">${stop.title}</span><br/><span style="font-size: 11px; color: #666;">${stop.time || ''} · ${stop.neighborhood || ''}</span></div>`
          );

          const marker = new maplibregl.Marker({ element: el })
            .setLngLat([stop.lng, stop.lat])
            .setPopup(popup)
            .addTo(map);

          markersRef.current.push(marker);
        }
      });

      // 3. Desenhar linha tracejada na ordem do roteiro (1 ➔ 2 ➔ 3)
      const lineData: GeoJSON.Feature<GeoJSON.LineString> = {
        type: 'Feature',
        properties: {},
        geometry: { type: 'LineString', coordinates: routeCoordinates.length > 1 ? routeCoordinates : [] }
      };

      const existingSource = map.getSource('route-path-source') as maplibregl.GeoJSONSource | undefined;
      if (existingSource) {
        existingSource.setData(lineData);
      } else {
        map.addSource('route-path-source', { type: 'geojson', data: lineData });
        map.addLayer({
          id: 'route-path-layer',
          type: 'line',
          source: 'route-path-source',
          layout: { 'line-cap': 'round', 'line-join': 'round' },
          paint: {
            'line-color': '#1D6FE0',
            'line-width': 3.5,
            'line-opacity': 0.85,
            'line-dasharray': [1.5, 1.5]
          }
        });
      }

      if (hasPoints) {
        if (routeCoordinates.length === 1) {
          map.easeTo({ center: routeCoordinates[0], zoom: 14 });
        } else {
          map.fitBounds(bounds, { padding: 60, maxZoom: 15, duration: 400 });
        }
      }
    };

    if (map.isStyleLoaded()) {
      renderMapElements();
    } else {
      map.once('load', renderMapElements);
    }
  }, [displayedStops, activeStop, data.basecamp]);

  return (
    <div className="space-y-6">
      {/* Cabeçalho e Barra de Filtros limpa e sem emojis */}
      <div className="bg-white border border-slate-200/80 rounded-[28px] p-6 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-slate-900 text-white text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-lg flex items-center gap-1.5">
              <Navigation className="w-3 h-3 text-indigo-400" /> Roteiro Tracejado V2
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Mapa de Conexões Reais</h2>
          </div>
          <p className="text-xs text-slate-600 font-medium mt-1">
            Trajeto sequencial com distâncias reais de {displayedStops.length} vivências selecionadas.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-center">
          {/* Categorias sem emojis (Regra 13) */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
            <button onClick={() => setSelectedCategory('all')} className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${selectedCategory === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>
              <Layers className="w-3.5 h-3.5" /> Tudo
            </button>
            <button onClick={() => setSelectedCategory('flight')} className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${selectedCategory === 'flight' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>
              <Plane className="w-3.5 h-3.5" /> Voos
            </button>
            <button onClick={() => setSelectedCategory('lodging')} className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${selectedCategory === 'lodging' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>
              <Bed className="w-3.5 h-3.5" /> Hotéis (H)
            </button>
            <button onClick={() => setSelectedCategory('restaurant')} className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${selectedCategory === 'restaurant' ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>
              <Utensils className="w-3.5 h-3.5" /> Gastronomia
            </button>
          </div>

          {/* Seletor de Dia */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
            <button
              onClick={() => setSelectedDayFilter('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all ${
                selectedDayFilter === 'all'
                  ? 'bg-[#D6FF3F] text-slate-950 shadow-xs border border-[#b8e624]/60'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
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
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all ${
                  selectedDayFilter === day.dayNumber
                    ? 'bg-[#D6FF3F] text-slate-950 shadow-xs border border-[#b8e624]/60'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Dia {day.dayNumber}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grade Principal do Mapa + Listagem Interativa */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Container do Mapa (8 colunas) */}
        <div className="lg:col-span-8 bg-slate-950 rounded-[32px] overflow-hidden shadow-xl relative min-h-[540px] border border-slate-800" ref={mapContainer}>
          <div className="absolute top-6 left-6 bg-white/95 backdrop-blur-xl border border-slate-200/80 px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2.5 z-10 pointer-events-none">
            <div className="w-2.5 h-2.5 rounded-full bg-[#D6FF3F] ring-2 ring-slate-950 shrink-0" />
            <span className="text-xs font-black text-slate-900">
              {activeStop ? activeStop.title : 'Selecione uma parada na lista'}
            </span>
          </div>

          {activeStop && activeStop.lat && activeStop.lng && (
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${activeStop.lat},${activeStop.lng}&destination_place_id=${encodeURIComponent(activeStop.title)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute bottom-6 left-6 bg-[#D6FF3F] text-slate-950 hover:bg-[#cbf536] text-xs font-black px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 transition-all z-10 border border-[#b8e624]"
            >
              <Navigation className="w-3.5 h-3.5" /> Rota no Google Maps
            </a>
          )}
        </div>

        {/* Lista Lateral de Paradas Cronológicas (4 colunas) */}
        <div className="lg:col-span-4 space-y-3 max-h-[540px] overflow-y-auto pr-1">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">
              Sequência do Roteiro
            </h3>
            <span className="text-[11px] font-bold text-slate-500">{displayedStops.length} locais</span>
          </div>

          {data.basecamp && (selectedDayFilter !== 'all' || selectedCategory === 'all') && (
            <div className="p-3.5 rounded-2xl border transition-all flex items-center gap-3 bg-slate-900 text-white border-slate-800 shadow-sm">
              <div className="w-7 h-7 rounded-full bg-white text-slate-950 flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                H
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-black text-xs truncate leading-tight">{data.basecamp.name || 'Seu Hotel / Basecamp'}</p>
                <p className="text-[11px] text-slate-400 truncate flex items-center gap-1 mt-0.5">
                  <Bed className="w-3 h-3 shrink-0 text-slate-400" /> Ponto de Partida e Chegada
                </p>
              </div>
              <span className="text-[10px] font-black px-2 py-1 rounded-lg bg-slate-800 text-slate-300 uppercase tracking-wider shrink-0">
                Hotel
              </span>
            </div>
          )}

          {displayedStops.map((stop, idx) => {
            const isSelected = activeStop?.id === stop.id;
            const isLodging = stop.category === 'lodging';
            return (
              <div
                key={stop.id}
                onClick={() => setSelectedStopId(stop.id)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center gap-3 ${
                  isSelected
                    ? 'bg-white border-[#14150F] ring-2 ring-[#14150F] shadow-md'
                    : 'bg-[#FAF8F1] border-slate-200 hover:border-slate-300 shadow-2xs'
                }`}
              >
                <div className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-xs shrink-0 border border-white shadow-2xs ${
                  isLodging 
                    ? 'bg-slate-900 text-white' 
                    : isSelected ? 'bg-[#D6FF3F] text-slate-950 border-slate-950' : 'bg-[#1D6FE0] text-white'
                }`}>
                  {isLodging ? 'H' : idx + 1}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="font-black text-xs text-[#14150F] truncate leading-tight">{stop.title}</p>
                  <p className="text-[11px] text-slate-600 truncate flex items-center gap-1 mt-0.5 font-medium">
                    <MapPin className="w-3 h-3 shrink-0 text-slate-400" /> {stop.neighborhood || stop.category?.replace('_', ' ')}
                  </p>
                </div>

                {stop.time && (
                  <span className="text-[10px] font-black px-2 py-1 rounded-lg bg-slate-200/80 text-slate-800 shrink-0">
                    {stop.time}
                  </span>
                )}
              </div>
            );
          })}
          {displayedStops.length === 0 && (
            <div className="p-8 text-center text-slate-500 font-bold text-xs bg-slate-50 rounded-2xl border border-slate-200">
              Nenhuma parada com localização encontrada para este filtro.
            </div>
          )}
        </div>
      </div>

      {/* Legenda Ouro no estilo BdayRafaRoteiroNY (1 ➔ 2 ➔ 3) */}
      <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4 bg-white rounded-[24px] text-xs font-bold text-slate-700 border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="w-6 h-6 bg-slate-900 text-white rounded-full flex items-center justify-center font-black text-[11px] border border-white shadow-2xs shrink-0">H</span>
          <span className="font-black text-slate-900 mr-2">Hospedagem / Basecamp</span>
          <span className="text-slate-300 hidden sm:inline">|</span>
          <span className="w-6 h-6 bg-[#1D6FE0] text-white rounded-full flex items-center justify-center font-black text-[11px] border border-white shadow-2xs shrink-0">1</span>
          <span className="text-slate-400 font-black">➔</span>
          <span className="w-6 h-6 bg-[#1D6FE0] text-white rounded-full flex items-center justify-center font-black text-[11px] border border-white shadow-2xs shrink-0">2</span>
          <span className="text-slate-400 font-black">➔</span>
          <span className="w-6 h-6 bg-[#1D6FE0] text-white rounded-full flex items-center justify-center font-black text-[11px] border border-white shadow-2xs shrink-0">3</span>
          <span className="font-black text-slate-900 ml-1">Ordem cronológica do dia (linha tracejada)</span>
        </div>
        <div className="flex items-center gap-2 bg-[#FAF8F1] px-3.5 py-1.5 rounded-xl border border-slate-200/80 text-slate-900 font-black text-xs">
          <Navigation className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
          <span>{totalKm > 0 ? `${totalKm.toFixed(1).replace('.', ',')} km totais neste roteiro` : 'Cálculo Haversine em tempo real'}</span>
        </div>
      </div>
    </div>
  );
}
