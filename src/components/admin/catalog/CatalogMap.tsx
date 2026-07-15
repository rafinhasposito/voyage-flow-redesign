import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Database } from '@/types/supabase.types';
import { translateTerm } from '@/utils/translations';
import { MapPin } from 'lucide-react';

type ExperienceRow = Database["public"]["Tables"]["experiences"]["Row"];

interface CatalogMapProps {
  experiences: ExperienceRow[];
  selectedId: string | null;
  onMarkerClick: (id: string) => void;
  onEditClick: (id: string) => void;
}

export default function CatalogMap({ experiences, selectedId, onMarkerClick, onEditClick }: CatalogMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const activePopup = useRef<maplibregl.Popup | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  const validExperiences = experiences.filter(exp => 
    exp.location_lat != null && 
    exp.location_lng != null &&
    exp.location_lat >= -90 && exp.location_lat <= 90 &&
    exp.location_lng >= -180 && exp.location_lng <= 180
  );

  useEffect(() => {
    if (!mapContainer.current) return;

    if (!map.current) {
      map.current = new maplibregl.Map({
        container: mapContainer.current,
        style: 'https://tiles.openfreemap.org/styles/liberty',
        center: [-73.9855, 40.7580], 
        zoom: 12,
        attributionControl: true
      });

      map.current.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');

      map.current.on('load', () => {
        const currentMap = map.current!;
        
        currentMap.addSource('experiences', {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: [] },
          cluster: true,
          clusterMaxZoom: 14,
          clusterRadius: 50
        });

        currentMap.addLayer({
          id: 'clusters',
          type: 'circle',
          source: 'experiences',
          filter: ['has', 'point_count'],
          paint: {
            'circle-color': '#D7F24B',
            'circle-radius': ['step', ['get', 'point_count'], 15, 10, 20, 30, 25],
            'circle-stroke-width': 3,
            'circle-stroke-color': '#FFFFFF'
          }
        });

        currentMap.addLayer({
          id: 'cluster-count',
          type: 'symbol',
          source: 'experiences',
          filter: ['has', 'point_count'],
          layout: {
            'text-field': '{point_count_abbreviated}',
            'text-size': 12
          },
          paint: {
            'text-color': '#171717',
            'text-halo-color': '#D7F24B',
            'text-halo-width': 1
          }
        });

        currentMap.addLayer({
          id: 'unclustered-point',
          type: 'circle',
          source: 'experiences',
          filter: ['!', ['has', 'point_count']],
          paint: {
            'circle-color': '#171717',
            'circle-radius': 8,
            'circle-stroke-width': 2,
            'circle-stroke-color': '#FFFFFF'
          }
        });

        currentMap.on('click', 'clusters', (e) => {
          const features = currentMap.queryRenderedFeatures(e.point, { layers: ['clusters'] });
          if (!features.length) return;
          const clusterId = features[0].properties.cluster_id;
          const source = currentMap.getSource('experiences') as maplibregl.GeoJSONSource;
          
          source.getClusterExpansionZoom(clusterId, (err, zoom) => {
            if (err) return;
            currentMap.easeTo({
              center: (features[0].geometry as GeoJSON.Point).coordinates as [number, number],
              zoom: zoom
            });
          });
        });

        currentMap.on('click', 'unclustered-point', (e) => {
          if (!e.features || e.features.length === 0) return;
          const id = e.features[0].properties.exp_id;
          onMarkerClick(id);
        });

        currentMap.on('mouseenter', 'clusters', () => currentMap.getCanvas().style.cursor = 'pointer');
        currentMap.on('mouseleave', 'clusters', () => currentMap.getCanvas().style.cursor = '');
        currentMap.on('mouseenter', 'unclustered-point', () => currentMap.getCanvas().style.cursor = 'pointer');
        currentMap.on('mouseleave', 'unclustered-point', () => currentMap.getCanvas().style.cursor = '');

        setMapLoaded(true);
      });
    }
  }, []);

  // Update Data and Filter Behavior
  useEffect(() => {
    if (!map.current || !mapLoaded) return;
    const currentMap = map.current;
    const source = currentMap.getSource('experiences') as maplibregl.GeoJSONSource;
    if (!source) return;

    const geojsonData: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: validExperiences.map(exp => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [exp.location_lng!, exp.location_lat!] },
        properties: { exp_id: exp.id }
      }))
    };
    source.setData(geojsonData);

    // Filter behavior
    if (!selectedId) { // Only adjust if we aren't clicking a specific marker (handled in another effect)
        if (validExperiences.length === 1) {
          currentMap.flyTo({ center: [validExperiences[0].location_lng!, validExperiences[0].location_lat!], zoom: 15 });
        } else if (validExperiences.length >= 2 && validExperiences.length <= 20) {
          const bounds = new maplibregl.LngLatBounds();
          validExperiences.forEach(exp => bounds.extend([exp.location_lng!, exp.location_lat!]));
          currentMap.fitBounds(bounds, { padding: 50, maxZoom: 10, duration: 800 });
        }
    }
  }, [experiences, mapLoaded]); // removed selectedId from dependency so selecting a card doesn't refit

  // Handle Selection Highlight and Popup
  useEffect(() => {
    if (!map.current || !mapLoaded) return;
    const currentMap = map.current;

    currentMap.setPaintProperty('unclustered-point', 'circle-color', [
      'case',
      ['==', ['get', 'exp_id'], selectedId || ''],
      '#D7F24B',
      '#171717'
    ]);
    
    currentMap.setPaintProperty('unclustered-point', 'circle-radius', [
      'case',
      ['==', ['get', 'exp_id'], selectedId || ''],
      12,
      8
    ]);

    if (activePopup.current) {
      activePopup.current.remove();
      activePopup.current = null;
    }

    if (selectedId) {
      const exp = validExperiences.find(e => e.id === selectedId);
      if (exp && exp.location_lng != null && exp.location_lat != null) {
        const popupNode = document.createElement('div');
        popupNode.innerHTML = `
          <div class="p-2 min-w-[200px] font-sans">
            <h4 class="font-bold text-[#171717] text-[13px] mb-1 line-clamp-2">${exp.title}</h4>
            <p class="text-[11px] text-[#171717]/60 mb-3 font-medium">${translateTerm(exp.category)} • ${exp.neighborhood || 'Local desconhecido'}</p>
            <button class="edit-btn w-full bg-[#171717] hover:bg-[#171717]/90 transition-colors text-white py-2 rounded-xl text-[12px] font-bold" data-id="${exp.id}">Editar Registro</button>
          </div>
        `;

        popupNode.querySelector('.edit-btn')?.addEventListener('click', () => {
           onEditClick(exp.id);
        });

        activePopup.current = new maplibregl.Popup({ offset: 15, closeButton: false, className: 'catalog-popup overflow-hidden rounded-[16px]' })
           .setLngLat([exp.location_lng, exp.location_lat])
           .setDOMContent(popupNode)
           .addTo(currentMap);
           
        currentMap.flyTo({ center: [exp.location_lng, exp.location_lat], zoom: 15 });
      }
    }
  }, [selectedId, mapLoaded]);

  const handleShowAll = () => {
    if (!map.current || validExperiences.length === 0) return;
    const bounds = new maplibregl.LngLatBounds();
    validExperiences.forEach(exp => bounds.extend([exp.location_lng!, exp.location_lat!]));
    map.current.fitBounds(bounds, { padding: 50, maxZoom: 10, duration: 800 });
  };

  const handleCenterManhattan = () => {
    if (!map.current) return;
    map.current.flyTo({ center: [-73.9855, 40.7580], zoom: 12, duration: 800 });
  };

  return (
    <>
      <style>{`
        .catalog-popup .maplibregl-popup-content {
          border-radius: 16px;
          padding: 8px;
          box-shadow: 0 10px 40px -10px rgba(0,0,0,0.2);
          border: 1px solid rgba(23,23,23,0.05);
        }
        .catalog-popup .maplibregl-popup-tip {
          display: none;
        }
      `}</style>
      <div className="relative w-full h-full">
        <div ref={mapContainer} className="w-full h-full rounded-[28px] overflow-hidden bg-[#E8EAE6]" />
        
        <div className="absolute top-4 left-4 z-10 flex gap-2">
          <button 
            onClick={handleShowAll}
            className="bg-white/90 backdrop-blur-md hover:bg-white text-[#171717] px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider shadow-sm border border-white/50 transition-colors"
          >
            Ver todos
          </button>
          <button 
            onClick={handleCenterManhattan}
            className="bg-white/90 backdrop-blur-md hover:bg-white text-[#171717] px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider shadow-sm border border-white/50 transition-colors"
          >
            Centralizar
          </button>
        </div>
      </div>
    </>
  );
}
