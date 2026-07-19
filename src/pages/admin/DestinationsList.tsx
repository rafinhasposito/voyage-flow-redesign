import React, { useState, useEffect, useMemo } from 'react';
import { Globe, Plus, Search, MapPin, MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/supabase.types';
import { toast } from 'sonner';

type ExperienceRow = Database['public']['Tables']['experiences']['Row'];

interface DerivedDestination {
  name: string;
  experiencesCount: number;
  publishedCount: number;
  neighborhoods: string[];
  issuesCount: number;
  lastUpdated: string;
}

export default function DestinationsList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [destinations, setDestinations] = useState<DerivedDestination[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDerivedDestinations() {
      try {
        const { data, error } = await supabase
          .from('experiences')
          .select('id, destination, neighborhood, status, location_lat, duration_minutes, updated_at');
        
        if (error) throw error;

        const destMap = new Map<string, DerivedDestination>();

        (data || []).forEach(exp => {
          const destName = exp.destination || 'Desconhecido';
          if (!destMap.has(destName)) {
            destMap.set(destName, {
              name: destName,
              experiencesCount: 0,
              publishedCount: 0,
              neighborhoods: [],
              issuesCount: 0,
              lastUpdated: exp.updated_at || new Date().toISOString()
            });
          }
          
          const d = destMap.get(destName)!;
          d.experiencesCount += 1;
          if (exp.status === 'published') {
            d.publishedCount += 1;
          }
          if (exp.neighborhood && !d.neighborhoods.includes(exp.neighborhood)) {
            d.neighborhoods.push(exp.neighborhood);
          }
          
          const hasIssue = !exp.location_lat || !exp.neighborhood || !exp.duration_minutes;
          if (hasIssue) d.issuesCount += 1;

          if (exp.updated_at && new Date(exp.updated_at) > new Date(d.lastUpdated)) {
            d.lastUpdated = exp.updated_at;
          }
        });

        setDestinations(Array.from(destMap.values()).sort((a, b) => b.experiencesCount - a.experiencesCount));
      } catch (err: any) {
        toast.error('Erro ao carregar destinos: ' + err.message);
      } finally {
        setLoading(false);
      }
    }
    loadDerivedDestinations();
  }, []);

  const filtered = destinations.filter(d => d.name.toLowerCase().includes(searchTerm.toLowerCase()));
  
  return (
    <div className="flex flex-col h-full bg-vf-bg overflow-hidden">
      
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-vf-border z-10 shrink-0">
        <div>
          <h1 className="text-lg font-black text-vf-black tracking-tight flex items-center gap-2">
            <Globe className="w-4 h-4 text-emerald-600" /> Destinos (Derivados)
          </h1>
          <p className="text-[11px] text-vf-text-3 font-semibold">Agrupamento dinâmico baseado nas experiências.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-vf-text-3 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input 
              type="text" 
              placeholder="Buscar destino..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-64 h-9 text-[13px]"
            />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {loading ? (
          <div className="text-center py-20 text-slate-400 font-bold text-sm">Carregando destinos...</div>
        ) : (
          <div className="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(dest => (
              <div key={dest.name} className="bg-white rounded-xl border border-vf-border shadow-vf-sm overflow-hidden flex flex-col group p-5">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-vf-black font-black text-xl leading-none">{dest.name}</h3>
                    <p className="text-vf-text-3 font-bold text-xs mt-1">{dest.neighborhoods.length} Bairros</p>
                  </div>
                  <div className="px-2 py-1 bg-[#171717]/5 text-[#171717]/60 rounded text-[10px] font-black uppercase">
                    Auto
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div>
                    <div className="text-[10px] font-black uppercase text-vf-text-3 tracking-widest">Experiências</div>
                    <div className="text-lg font-black text-vf-black">{dest.experiencesCount}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-black uppercase text-vf-text-3 tracking-widest">Publicadas</div>
                    <div className="text-lg font-black text-emerald-600">{dest.publishedCount}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-black uppercase text-vf-text-3 tracking-widest">Problemas</div>
                    <div className="text-lg font-black text-amber-600">{dest.issuesCount}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-black uppercase text-vf-text-3 tracking-widest">Atualização</div>
                    <div className="text-sm font-bold text-vf-black truncate" title={dest.lastUpdated}>
                      {new Date(dest.lastUpdated).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-vf-border/50 text-[11px] font-bold text-slate-400 leading-tight">
                  <span className="text-slate-500">Bairros:</span> {dest.neighborhoods.slice(0, 5).join(', ')}
                  {dest.neighborhoods.length > 5 && ` +${dest.neighborhoods.length - 5}`}
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
               <div className="col-span-full text-center py-10 text-slate-400 font-bold">Nenhum destino encontrado.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
