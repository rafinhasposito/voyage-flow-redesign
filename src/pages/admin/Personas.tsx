import React, { useState, useEffect } from 'react';
import { Users, Search, Activity } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

const PERSONAS_CONFIG = [
  { key: 'explorador_visual', name: 'Explorador Visual', desc: 'Foco em estética, fotos e pontos icônicos (Must See).' },
  { key: 'curador_experiencias', name: 'Curador', desc: 'Busca autenticidade, hidden gems e cultura local.' },
  { key: 'aproveitador', name: 'Entusiasta (Aproveitador)', desc: 'Maximiza o tempo, gosta de atividades intensas e populares.' },
  { key: 'descobridor', name: 'Descobridor', desc: 'Explora bairros inteiros sem roteiro fixo.' },
  { key: 'slow_traveler', name: 'Slow Traveler', desc: 'Ritmo calmo, foca em poucas atividades bem aproveitadas.' },
];

interface PersonaStats {
  key: string;
  name: string;
  desc: string;
  totalExperiences: number;
  highAffinityCount: number;
}

export default function Personas() {
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState<PersonaStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPersonas() {
      try {
        const { data, error } = await supabase
          .from('experiences')
          .select('intelligence_metadata');
        
        if (error) throw error;

        const statMap: Record<string, { total: number; high: number }> = {};
        PERSONAS_CONFIG.forEach(p => statMap[p.key] = { total: 0, high: 0 });

        (data || []).forEach(exp => {
          let meta = exp.intelligence_metadata;
          if (typeof meta === 'string') {
            try { meta = JSON.parse(meta); } catch { return; }
          }
          if (meta && typeof meta === 'object') {
            const personas = (meta as any).personas || {};
            PERSONAS_CONFIG.forEach(p => {
              const val = personas[p.key]?.value;
              if (typeof val === 'number') {
                statMap[p.key].total += 1;
                if (val >= 0.7) {
                  statMap[p.key].high += 1;
                }
              }
            });
          }
        });

        setStats(PERSONAS_CONFIG.map(p => ({
          ...p,
          totalExperiences: statMap[p.key].total,
          highAffinityCount: statMap[p.key].high
        })));
      } catch (err: any) {
        toast.error('Erro ao carregar personas: ' + err.message);
      } finally {
        setLoading(false);
      }
    }
    loadPersonas();
  }, []);

  const filtered = stats.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="flex flex-col h-full bg-vf-bg overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-vf-border z-10 shrink-0">
        <div>
          <h1 className="text-lg font-black text-vf-black tracking-tight flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-600" /> Personas da Engine
          </h1>
          <p className="text-[11px] text-vf-text-3 font-semibold">Análise de afinidade das experiências cadastradas.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-vf-text-3 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input 
              type="text" 
              placeholder="Buscar persona..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-64 h-9 text-[13px]"
            />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {loading ? (
          <div className="text-center py-20 text-slate-400 font-bold text-sm">Carregando personas...</div>
        ) : (
          <div className="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(p => (
              <div key={p.key} className="bg-white rounded-xl border border-vf-border shadow-vf-sm p-6 flex flex-col group">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-black text-vf-black">{p.name}</h3>
                    <div className="text-[10px] font-black uppercase text-vf-text-3 tracking-widest mt-1">ID: {p.key}</div>
                  </div>
                  <div className="p-2 bg-emerald-50 rounded-lg">
                    <Activity className="w-4 h-4 text-emerald-600" />
                  </div>
                </div>
                
                <p className="text-sm text-vf-text-2 mb-6 h-10">{p.desc}</p>
                
                <div className="grid grid-cols-2 gap-4 mt-auto pt-4 border-t border-vf-border/50">
                  <div>
                    <div className="text-[10px] font-black uppercase text-vf-text-3 tracking-widest">Avaliadas</div>
                    <div className="text-xl font-black text-vf-black">{p.totalExperiences}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-black uppercase text-vf-text-3 tracking-widest">Alta Afinidade (≥70%)</div>
                    <div className="text-xl font-black text-emerald-600">{p.highAffinityCount}</div>
                  </div>
                </div>
                
                {p.totalExperiences === 0 && (
                  <div className="mt-4 p-3 bg-amber-50 text-amber-800 text-xs font-bold rounded border border-amber-200">
                    Nenhuma experiência avaliada para esta persona.
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
