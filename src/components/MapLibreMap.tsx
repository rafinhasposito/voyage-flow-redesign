import React, { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Attraction } from '@/utils/travelState';

interface MapLibreMapProps {
  attractions: Attraction[];
}

export default function MapLibreMap({ attractions = [] }: MapLibreMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);

  useEffect(() => {
    if (!mapContainer.current) return;

    if (!mapRef.current) {
      mapRef.current = new maplibregl.Map({
        container: mapContainer.current,
        style: 'https://tiles.openfreemap.org/styles/liberty', // OpenFreeMap (sem custos ou cotas Google)
        center: [-74.006, 40.7128],
        zoom: 12,
        attributionControl: { compact: true }
      });
      mapRef.current.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
    }

    const map = mapRef.current;
    const items = attractions || [];

    const draw = () => {
      // Remover marcadores antigos
      markersRef.current.forEach(m => m.remove());
      markersRef.current = [];

      const bounds = new maplibregl.LngLatBounds();
      const lineCoordinates: [number, number][] = [];
      let stopOrder = 0;

      items.forEach(attr => {
        const coords = (attr as any).coordinates;
        if (coords?.lat != null && coords?.lng != null && !isNaN(coords.lat) && !isNaN(coords.lng)) {
          const isBasecamp = (attr as any).isBasecamp;
          const el = document.createElement('div');
          
          if (isBasecamp) {
            el.className = 'w-7 h-7 bg-slate-900 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white text-xs font-black select-none';
            el.textContent = 'H';
            el.setAttribute('aria-label', `${attr.name} (Basecamp)`);
          } else {
            stopOrder += 1;
            el.className = 'w-7 h-7 bg-[#C5A85C] rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white text-xs font-black select-none';
            el.textContent = String(stopOrder);
            el.setAttribute('aria-label', `${stopOrder}. ${attr.name}`);
          }

          const marker = new maplibregl.Marker({ element: el })
            .setLngLat([coords.lng, coords.lat])
            .setPopup(new maplibregl.Popup({ offset: 20, closeButton: false }).setHTML(
              `<div style="font-family: sans-serif; padding: 2px 4px;"><b>${isBasecamp ? 'Hospedagem' : `${stopOrder}ª Parada`}</b><br/><span style="font-size: 13px; color: #333;">${attr.name}</span></div>`
            ))
            .addTo(map);

          markersRef.current.push(marker);
          lineCoordinates.push([coords.lng, coords.lat]);
          bounds.extend([coords.lng, coords.lat]);
        }
      });

      // Desenhar a linha sequencial do roteiro
      if (lineCoordinates.length > 1) {
        const routeData: GeoJSON.Feature<GeoJSON.LineString> = {
          type: 'Feature',
          properties: {},
          geometry: { type: 'LineString', coordinates: lineCoordinates },
        };

        const existingSource = map.getSource('trip-route-line') as maplibregl.GeoJSONSource | undefined;
        if (existingSource) {
          existingSource.setData(routeData);
        } else {
          map.addSource('trip-route-line', { type: 'geojson', data: routeData });
          map.addLayer({
            id: 'trip-route-layer',
            type: 'line',
            source: 'trip-route-line',
            layout: { 'line-cap': 'round', 'line-join': 'round' },
            paint: {
              'line-color': '#1D6FE0',
              'line-width': 3,
              'line-opacity': 0.85,
              'line-dasharray': [1.5, 1.5],
            },
          });
        }
      } else {
        const existingSource = map.getSource('trip-route-line') as maplibregl.GeoJSONSource | undefined;
        if (existingSource) {
          existingSource.setData({
            type: 'Feature',
            properties: {},
            geometry: { type: 'LineString', coordinates: [] },
          });
        }
      }

      if (lineCoordinates.length === 1) {
        map.easeTo({ center: lineCoordinates[0], zoom: 14 });
      } else if (lineCoordinates.length > 1) {
        map.fitBounds(bounds, { padding: 48, maxZoom: 15, duration: 400 });
      }
    };

    if (map.isStyleLoaded()) {
      draw();
    } else {
      map.once('load', draw);
    }
  }, [attractions]);

  useEffect(() => {
    const el = mapContainer.current;
    if (!el) return;
    const ro = new ResizeObserver(() => mapRef.current?.resize());
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return <div ref={mapContainer} className="w-full h-full rounded-2xl overflow-hidden shadow-lg border border-[#EAE6DF]" />;
}
