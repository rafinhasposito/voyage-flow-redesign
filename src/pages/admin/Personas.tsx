import React, { useState, useEffect } from 'react';
import { Users, Search, Activity } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { AdminHeader } from '@/components/admin/AdminHeader';

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
    <div className="flex flex-col h-full bg-[#F7F7F2] font-sans overflow-auto selection:bg-[#D7F24B] selection:text-[#171717]">
      <AdminHeader
        title="Matriz de Personas"
        subtitle="Análise de afinidade e distribuição do inventário pelas Personas do Match Engine."
        icon={<Users className="w-4 h-4 text-[#171717]" />}
        badgeText="Módulo de Inteligência"
        gradient="from-[#FFC3A0] to-[#FFAFBD]" // Warm gradient for Personas
        loading={loading}
        metrics={[
          { label: 'Total de Personas', value: PERSONAS_CONFIG.length, color: 'bg-white/40' },
          { label: 'Cobertura do Catálogo', value: `${stats.reduce((acc, p) => acc + (p.highAffinityCount > 0 ? 1 : 0), 0) > 0 ? 'Alta' : 'Pendente'}`, color: 'bg-emerald-500/10 text-emerald-900 border-emerald-500/20' },
        ]}
        actions={
          <div className="flex items-center gap-2 bg-white/40 backdrop-blur-md rounded-xl p-1 border border-white/40 shadow-sm relative w-[280px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#171717]/40" />
            <input 
              type="text"
              placeholder="Buscar persona..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 h-10 bg-transparent border-0 text-[13px] font-bold text-[#171717] placeholder:text-[#171717]/40 outline-none"
            />
          </div>
        }
      />

      <div className="flex-1 p-8">
        {loading ? (
          <div className="text-center py-20 text-[#171717]/40 font-bold text-sm">Computando afinidade com o catálogo...</div>
        ) : (
          <div className="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(p => {
              const affinityPct = p.totalExperiences > 0 
                ? Math.round((p.highAffinityCount / p.totalExperiences) * 100) 
                : 0;

              return (
                <div key={p.key} className="bg-white rounded-3xl border border-[#171717]/5 shadow-sm overflow-hidden flex flex-col group p-8 transition-transform hover:-translate-y-1">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-[#171717] font-black text-2xl tracking-tight leading-none mb-2">{p.name}</h3>
                      <p className="text-[#171717]/60 font-semibold text-xs leading-relaxed line-clamp-2">{p.desc}</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center shrink-0 border border-orange-100">
                       <Activity className="w-5 h-5 text-orange-500" />
                    </div>
                  </div>
                  
                  <div className="mt-auto pt-6">
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-[10px] font-black uppercase text-[#171717]/40 tracking-widest">Afinidade Alta (≥ 0.7)</span>
                      <span className="text-sm font-black text-[#171717]">{affinityPct}%</span>
                    </div>
                    <div className="w-full bg-[#171717]/5 rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-orange-500 h-2 rounded-full transition-all duration-1000" 
                        style={{ width: `${affinityPct}%` }}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mt-6">
                      <div className="bg-[#171717]/[0.02] rounded-xl p-3 border border-[#171717]/5">
                        <div className="text-[10px] font-black uppercase text-[#171717]/40 tracking-widest">Score Alto</div>
                        <div className="text-lg font-black text-emerald-600">{p.highAffinityCount}</div>
                      </div>
                      <div className="bg-[#171717]/[0.02] rounded-xl p-3 border border-[#171717]/5">
                        <div className="text-[10px] font-black uppercase text-[#171717]/40 tracking-widest">Avaliadas</div>
                        <div className="text-lg font-black text-[#171717]">{p.totalExperiences}</div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 && (
              <div className="col-span-full text-center py-10 text-[#171717]/40 font-bold">Nenhuma persona encontrada.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
