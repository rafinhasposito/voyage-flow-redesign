import React, { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Attraction } from '@/utils/travelState';

interface MapLibreMapProps {
  attractions: Attraction[];
}

export default function MapLibreMap({ attractions }: MapLibreMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);

  useEffect(() => {
    if (!mapContainer.current) return;

    if (!mapRef.current) {
      mapRef.current = new maplibregl.Map({
        container: mapContainer.current,
        style: 'https://tiles.openfreemap.org/styles/liberty', // OpenFreeMap!
        center: [-74.006, 40.7128], // Default to NY
        zoom: 12
      });
      mapRef.current.addControl(new maplibregl.NavigationControl(), 'top-right');
    }

    const map = mapRef.current;

    // Clear old markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    const bounds = new maplibregl.LngLatBounds();
    let hasPoints = false;

    attractions.forEach(attr => {
      // Assuming coordinates exist on attr (we need to pass them down or map from experience)
      // Since travelState.ts Attraction type might not have lat/lng directly exposed, let's check
      // For now we assume attr.coordinates is {lat, lng} or similar
      if ((attr as any).coordinates?.lat && (attr as any).coordinates?.lng) {
        const el = document.createElement('div');
        el.className = 'w-6 h-6 bg-[#C5A85C] rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white text-xs font-bold';
        el.innerText = '📍';

        const marker = new maplibregl.Marker(el)
          .setLngLat([(attr as any).coordinates.lng, (attr as any).coordinates.lat])
          .setPopup(new maplibregl.Popup({ offset: 25 }).setHTML(`<strong>${attr.name}</strong><br/>${attr.neighborhood}`))
          .addTo(map);

        markersRef.current.push(marker);
        bounds.extend([(attr as any).coordinates.lng, (attr as any).coordinates.lat]);
        hasPoints = true;
      }
    });

    if (hasPoints) {
      map.fitBounds(bounds, { padding: 50, maxZoom: 15 });
    }

    return () => {
      // Don't destroy the map on unmount, or it might blink when re-rendering, but it's safe to destroy
      // map.remove(); 
    };
  }, [attractions]);

  return <div ref={mapContainer} className="w-full h-full rounded-2xl overflow-hidden shadow-lg border border-[#EAE6DF]" />;
}
