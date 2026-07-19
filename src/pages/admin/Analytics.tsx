import React from 'react';
import { BarChart2, AlertTriangle, Download, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Analytics() {
  return (
    <div className="flex flex-col h-full bg-vf-bg overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-vf-border z-10 shrink-0">
        <div>
          <h1 className="text-lg font-black text-vf-black tracking-tight flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-emerald-600" /> Analytics do Catálogo
          </h1>
          <p className="text-[11px] text-vf-text-3 font-semibold">Visualizações, cliques e funil de conversão.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" disabled className="opacity-60 bg-white">
            <Calendar className="w-4 h-4 mr-2" /> Últimos 30 Dias
          </Button>
          <Button variant="outline" size="sm" disabled className="opacity-60 bg-white">
            <Download className="w-4 h-4 mr-2" /> Exportar PDF
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-[800px] mx-auto mt-10">
          <div className="bg-white p-8 rounded-xl border border-vf-border shadow-vf-sm text-center flex flex-col items-center">
            
            <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="w-8 h-8" />
            </div>
            
            <h2 className="text-xl font-black text-vf-black mb-2">Monitoramento Offline</h2>
            <p className="text-vf-text-2 text-sm max-w-md mb-6 leading-relaxed">
              O rastreamento de uso (Analytics) requer integração com um provedor de eventos (ex: PostHog, Mixpanel ou tabelas analíticas no Supabase). 
              Neste momento, cliques e exibições não estão sendo persistidos.
            </p>

            <div className="text-left w-full max-w-sm bg-slate-50 p-4 rounded-lg border border-slate-200">
              <h4 className="text-[11px] font-black uppercase text-slate-500 mb-2">Lacuna Documentada (Backend)</h4>
              <ul className="text-xs text-slate-600 space-y-1.5 list-disc pl-4">
                <li>Tabela <code>page_views</code> ausente.</li>
                <li>Tabela <code>link_clicks</code> ausente.</li>
                <li>Ferramenta de Analytics terceira não configurada.</li>
              </ul>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
