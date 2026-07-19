import React, { useState } from 'react';
import { Brain, Save, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function IAConcierge() {
  const [saving, setSaving] = useState(false);

  // Exemplo de configuração estática / local storage (conforme instruído: documentar a dependência de backend)
  const [config, setConfig] = useState({
    mustSeeWeight: 1.5,
    maxDailyEvents: 4,
    defaultTransitTime: 15,
  });

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      // Como pedido, não inventar persistência no Supabase. Salvar apenas local/memória para demo.
      toast.success('Configurações salvas localmente.');
      setSaving(false);
    }, 600);
  };

  return (
    <div className="flex flex-col h-full bg-vf-bg overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-vf-border z-10 shrink-0">
        <div>
          <h1 className="text-lg font-black text-vf-black tracking-tight flex items-center gap-2">
            <Brain className="w-4 h-4 text-emerald-600" /> IA Concierge
          </h1>
          <p className="text-[11px] text-vf-text-3 font-semibold">Parâmetros de ajuste fino do motor de recomendação.</p>
        </div>
        <Button variant="lime" onClick={handleSave} disabled={saving}>
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Salvando...' : 'Salvar Alterações'}
        </Button>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-[800px] mx-auto space-y-6">
          
          <div className="bg-amber-50 text-amber-800 p-4 rounded-xl border border-amber-200 flex items-start gap-4">
            <AlertTriangle className="w-6 h-6 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-sm">Dependência de Backend (Lacuna)</h3>
              <p className="text-xs mt-1 opacity-80">
                Os parâmetros globais do motor ainda estão definidos no código-fonte. A persistência definitiva destas configurações
                exige a criação da tabela <code>engine_configs</code> no Supabase. Edições aqui são aplicadas localmente.
              </p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-vf-border shadow-vf-sm">
            <h3 className="text-lg font-black text-vf-black mb-6">Ajuste de Pesos</h3>
            
            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-bold text-vf-black">Multiplicador "Must See"</label>
                  <span className="text-xs font-black bg-[#F7F7F2] px-2 py-1 rounded">{config.mustSeeWeight}x</span>
                </div>
                <input 
                  type="range" 
                  min="1" max="3" step="0.1" 
                  value={config.mustSeeWeight}
                  onChange={(e) => setConfig({ ...config, mustSeeWeight: parseFloat(e.target.value) })}
                  className="w-full" 
                />
                <p className="text-xs text-vf-text-3 mt-1">Peso aplicado sobre a pontuação base de itens marcados como obrigatórios.</p>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-bold text-vf-black">Eventos Máximos por Dia (Padrão)</label>
                  <span className="text-xs font-black bg-[#F7F7F2] px-2 py-1 rounded">{config.maxDailyEvents}</span>
                </div>
                <input 
                  type="range" 
                  min="1" max="10" step="1" 
                  value={config.maxDailyEvents}
                  onChange={(e) => setConfig({ ...config, maxDailyEvents: parseInt(e.target.value) })}
                  className="w-full" 
                />
                <p className="text-xs text-vf-text-3 mt-1">Limite flexível antes que o roteador considere o dia muito intenso.</p>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-bold text-vf-black">Tempo de Trânsito Padrão (Fallback)</label>
                  <span className="text-xs font-black bg-[#F7F7F2] px-2 py-1 rounded">{config.defaultTransitTime} min</span>
                </div>
                <input 
                  type="range" 
                  min="5" max="60" step="5" 
                  value={config.defaultTransitTime}
                  onChange={(e) => setConfig({ ...config, defaultTransitTime: parseInt(e.target.value) })}
                  className="w-full" 
                />
                <p className="text-xs text-vf-text-3 mt-1">Tempo assumido entre locais caso a API de roteamento falhe.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
