import React, { useEffect } from 'react';
import { TripEngineInputV1 } from '@/domain/itinerary-engine/contracts';
import { ItineraryDraftV1 } from '@/domain/itinerary-engine/schedulerV1';
import { GeoAuditExporter } from '@/domain/itinerary-engine/geoAuditExporter';
import { Button } from '@/components/ui/button';
import { AlertTriangle, MapPin, Copy } from 'lucide-react';

interface GeoAuditPanelProps {
  inputData: TripEngineInputV1 | null;
  draft: ItineraryDraftV1 | null;
  tripId: string | undefined;
}

export function GeoAuditPanel({ inputData, draft, tripId }: GeoAuditPanelProps) {
  if (import.meta.env.MODE !== 'development') {
    return null;
  }

  if (!inputData || !draft || !tripId) {
    return null;
  }

  const exportData = GeoAuditExporter.build(inputData, draft, tripId);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).__ENGINE_GEO_AUDIT__ = exportData;
    }
  }, [exportData]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(JSON.stringify(exportData, null, 2));
    alert('Auditoria geográfica copiada para a área de transferência.');
  };

  return (
    <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mt-6 border-dashed border-red-300">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-red-800 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" /> Dry-Run de Dados Geográficos (DEV-ONLY)
        </h2>
        <Button onClick={copyToClipboard} className="bg-red-600 hover:bg-red-700 text-white flex gap-2">
          <Copy className="w-4 h-4" /> Copiar auditoria geográfica
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
         <div className="bg-slate-50 p-3 rounded">
            <div className="text-xs text-slate-500 uppercase">Total Entidades</div>
            <div className="font-bold text-lg">{exportData.summary.totalEntities}</div>
         </div>
         <div className="bg-slate-50 p-3 rounded">
            <div className="text-xs text-slate-500 uppercase">GPS Válido</div>
            <div className="font-bold text-lg text-lime-600">{exportData.summary.validGps}</div>
         </div>
         <div className="bg-slate-50 p-3 rounded">
            <div className="text-xs text-slate-500 uppercase">Sem GPS / Inválido</div>
            <div className="font-bold text-lg text-red-600">{exportData.summary.missingGps} / {exportData.summary.invalidGps}</div>
         </div>
         <div className="bg-slate-50 p-3 rounded">
            <div className="text-xs text-slate-500 uppercase">Cobertura</div>
            <div className="font-bold text-lg text-indigo-600">{exportData.summary.coveragePercent}%</div>
         </div>
         <div className="bg-slate-50 p-3 rounded">
            <div className="text-xs text-slate-500 uppercase">Basecamp GPS</div>
            <div className="font-bold text-lg">{exportData.summary.basecampHasGps ? 'Sim' : 'Não'}</div>
         </div>
         <div className="bg-slate-50 p-3 rounded">
            <div className="text-xs text-slate-500 uppercase">Segmentos Possíveis</div>
            <div className="font-bold text-lg">{exportData.summary.possibleSegments}</div>
         </div>
      </div>

      <div className="space-y-4">
        {exportData.basecamp && (
          <div className="border border-slate-200 rounded p-4 bg-slate-50">
            <h3 className="font-bold mb-2">🏨 {exportData.basecamp.name} (Basecamp)</h3>
            <div className="text-sm">Situação: <span className="font-mono bg-slate-200 px-1 rounded">{exportData.basecamp.situation}</span></div>
            <div className="text-sm">Lat: {exportData.basecamp.lat ?? 'N/A'} | Lng: {exportData.basecamp.lng ?? 'N/A'}</div>
          </div>
        )}

        {exportData.draftActivities.map((act: any) => (
          <div key={act.id} className="border border-slate-200 rounded p-4 bg-slate-50">
            <h3 className="font-bold mb-2">📍 {act.name}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
               <div>
                  <div>Situação: <span className="font-mono bg-slate-200 px-1 rounded">{act.situation}</span></div>
                  <div>Lat: {act.lat ?? 'N/A'} | Lng: {act.lng ?? 'N/A'}</div>
                  <div>Endereço: {act.address}</div>
               </div>
               <div className="bg-white p-2 border rounded">
                  <strong className="block text-xs mb-1">Diagnóstico (Campos)</strong>
                  <div className="text-xs font-mono text-slate-600">
                    <div>Catálogo: {JSON.stringify(act.diagnostics.catalogFields)}</div>
                    <div>Normalizado: {JSON.stringify(act.diagnostics.normalizedFields)}</div>
                    <div>Final: {JSON.stringify(act.diagnostics.finalCoordinates)}</div>
                    {act.diagnostics.reasonIfMissing && <div className="text-red-500 mt-1">{act.diagnostics.reasonIfMissing}</div>}
                  </div>
               </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
