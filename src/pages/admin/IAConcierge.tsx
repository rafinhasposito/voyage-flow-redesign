import React, { useState, useEffect } from 'react';
import { Brain, Save, AlertTriangle, Play, RefreshCw, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { MatchEngine } from '@/lib/intelligence/MatchEngine';
import { Database } from '@/types/supabase.types';

type ExperienceRow = Database['public']['Tables']['experiences']['Row'];

const PERSONAS_CONFIG = [
  { key: 'explorador_visual', name: 'Explorador Visual' },
  { key: 'curador_experiencias', name: 'Curador' },
  { key: 'aproveitador', name: 'Entusiasta (Aproveitador)' },
  { key: 'descobridor', name: 'Descobridor' },
  { key: 'slow_traveler', name: 'Slow Traveler' },
];

export default function IAConcierge() {
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [experiences, setExperiences] = useState<ExperienceRow[]>([]);
  const [simulation, setSimulation] = useState<any>(null);

  const [simParams, setSimParams] = useState({
    persona: 'explorador_visual',
    budget: 'comfortable',
    pace: 'moderate'
  });

  const [config, setConfig] = useState({
    mustSeeWeight: 1.5,
    maxDailyEvents: 4,
    defaultTransitTime: 15,
  });

  useEffect(() => {
    async function loadData() {
      try {
        const { ExperienceRepository } = await import('@/repositories/ExperienceRepository');
        const data = await ExperienceRepository.getAll();
        setExperiences(data as any);
      } catch (err) {
        console.error('Error loading experiences:', err);
        toast.error('Erro ao carregar catálogo.');
      }
    }
    loadData();
  }, []);

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      toast.success('Configurações salvas localmente.');
      setSaving(false);
    }, 600);
  };

  const handleRunSimulation = () => {
    if (experiences.length === 0) {
      toast.error('Catálogo ainda não carregado.');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      try {
        const deck = MatchEngine.buildInitialDeck(
          { persona: simParams.persona, budget: simParams.budget, pace: simParams.pace },
          experiences as any,
          5
        );
        setSimulation(deck);
        setLoading(false);
        toast.success('Simulação concluída com sucesso!');
      } catch (err: any) {
        console.error("MatchEngine Error:", err);
        setLoading(false);
        toast.error(`Erro no motor: ${err.message}`);
      }
    }, 500);
  };

  return (
    <div className="flex flex-col h-full bg-vf-bg overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-vf-border z-10 shrink-0">
        <div>
          <h1 className="text-lg font-black text-vf-black tracking-tight flex items-center gap-2">
            <Brain className="w-4 h-4 text-emerald-600" /> IA Concierge & Engine Simulator
          </h1>
          <p className="text-[11px] text-vf-text-3 font-semibold">Ajuste de pesos e teste de algoritmos de neuromarketing.</p>
        </div>
        <Button variant="lime" onClick={handleSave} disabled={saving}>
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Salvando...' : 'Salvar Alterações'}
        </Button>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-[1000px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Left Column: Settings */}
          <div className="space-y-6">
            <div className="bg-amber-50 text-amber-800 p-4 rounded-xl border border-amber-200 flex items-start gap-4">
              <AlertTriangle className="w-6 h-6 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-sm">Dependência de Backend</h3>
                <p className="text-xs mt-1 opacity-80">
                  Os parâmetros abaixo são locais. A persistência exige a tabela <code>engine_configs</code>.
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
                  <input type="range" min="1" max="3" step="0.1" value={config.mustSeeWeight} onChange={(e) => setConfig({ ...config, mustSeeWeight: parseFloat(e.target.value) })} className="w-full" />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-bold text-vf-black">Eventos Máximos por Dia</label>
                    <span className="text-xs font-black bg-[#F7F7F2] px-2 py-1 rounded">{config.maxDailyEvents}</span>
                  </div>
                  <input type="range" min="1" max="10" step="1" value={config.maxDailyEvents} onChange={(e) => setConfig({ ...config, maxDailyEvents: parseInt(e.target.value) })} className="w-full" />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-bold text-vf-black">Tempo de Trânsito Padrão</label>
                    <span className="text-xs font-black bg-[#F7F7F2] px-2 py-1 rounded">{config.defaultTransitTime} min</span>
                  </div>
                  <input type="range" min="5" max="60" step="5" value={config.defaultTransitTime} onChange={(e) => setConfig({ ...config, defaultTransitTime: parseInt(e.target.value) })} className="w-full" />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Simulator */}
          <div className="bg-white p-6 rounded-xl border border-vf-border shadow-vf-sm flex flex-col">
            <h3 className="text-lg font-black text-vf-black mb-2 flex items-center gap-2">
              <Play className="w-4 h-4 text-emerald-600" /> Simulador de Neuromarketing
            </h3>
            <p className="text-xs text-slate-500 mb-6">Simule o motor de recomendação (MatchEngine 2.0) com o catálogo atual.</p>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="text-[10px] font-black uppercase text-vf-text-3 tracking-widest block mb-1.5">Persona IA</label>
                <select value={simParams.persona} onChange={e => setSimParams({...simParams, persona: e.target.value})} className="w-full h-9 rounded-lg border border-slate-200 text-xs px-2 bg-slate-50">
                  {PERSONAS_CONFIG.map(p => <option key={p.key} value={p.key}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-vf-text-3 tracking-widest block mb-1.5">Ritmo / Energia</label>
                <select value={simParams.pace} onChange={e => setSimParams({...simParams, pace: e.target.value})} className="w-full h-9 rounded-lg border border-slate-200 text-xs px-2 bg-slate-50">
                  <option value="relaxed">Relaxado (Leve)</option>
                  <option value="moderate">Moderado</option>
                  <option value="intense">Intenso (Forte)</option>
                </select>
              </div>
            </div>

            <Button variant="outline" className="w-full mb-6 border-slate-300 font-bold text-slate-700" onClick={handleRunSimulation} disabled={loading || experiences.length === 0}>
              {loading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Brain className="w-4 h-4 mr-2 text-violet-500" />}
              Executar Engine
            </Button>

            <div className="flex-1 bg-slate-50 rounded-lg border border-slate-200 p-4 overflow-auto">
              {!simulation ? (
                <div className="h-full flex items-center justify-center text-xs font-bold text-slate-400">
                  Configure o viajante e rode a simulação.
                </div>
              ) : (
                <div className="space-y-4">
                  {simulation.items.map((item: any, idx: number) => {
                    const exp = experiences.find(e => e.id === item.experience_id);
                    return (
                      <div key={idx} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm flex items-start gap-3">
                        <div className="w-8 h-8 rounded bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-sm shrink-0">
                          {item.score}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm text-[#0F1117] truncate">{exp?.title || item.experience_id}</p>
                          <p className="text-[10px] text-violet-600 font-semibold mt-0.5 mb-1.5 flex items-center gap-1">
                            <Star className="w-3 h-3" /> {MatchEngine.getReasonPhrase(item.reasons)}
                          </p>
                          <div className="flex gap-1 flex-wrap">
                            {item.reasons.map((r: any, i: number) => (
                              <span key={i} className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-black uppercase">
                                {r.type}: +{r.weight}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
