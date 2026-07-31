import React, { useState, useEffect, useMemo } from 'react';
import { Globe, Plus, Search, MapPin, MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/supabase.types';
import { toast } from 'sonner';
import { AdminHeader } from '@/components/admin/AdminHeader';

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
          .select('id, destinations(name), neighborhood, status, location_lat, duration_minutes, updated_at');
        
        if (error) throw error;

        const destMap = new Map<string, DerivedDestination>();

        (data || []).forEach((exp: any) => {
          const destName = exp.destinations?.name || 'Desconhecido';
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
    <div className="flex flex-col h-full bg-[#F7F7F2] font-sans overflow-auto selection:bg-[#D7F24B] selection:text-[#171717]">
      <AdminHeader
        title="Destinos & Agrupamentos"
        subtitle="Gerenciamento de clusters geográficos extraídos automaticamente do catálogo da Inteligência."
        icon={<Globe className="w-4 h-4 text-[#171717]" />}
        badgeText="Conteúdo Base"
        gradient="from-[#BCE6F4] to-[#E5F5FA]"
        loading={loading}
        metrics={[
          { label: 'Total Destinos', value: destinations.length, color: 'bg-white/40' },
          { label: 'Mapeados com IA', value: destinations.filter(d => d.issuesCount === 0).length, color: 'bg-emerald-500/10 text-emerald-900 border-emerald-500/20' },
        ]}
        actions={
          <div className="flex items-center gap-2 bg-white/40 backdrop-blur-md rounded-xl p-1 border border-white/40 shadow-sm relative w-[280px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#171717]/40" />
            <input 
              type="text"
              placeholder="Buscar destino..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 h-10 bg-transparent border-0 text-[13px] font-bold text-[#171717] placeholder:text-[#171717]/40 outline-none"
            />
          </div>
        }
      />

      <div className="flex-1 p-8">
        <div className="bg-white rounded-3xl border border-[#171717]/5 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-[#171717]/40 text-sm font-bold">Processando vetores geográficos...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#171717]/5 border-b border-[#171717]/5">
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[#171717]/40">Destino Master</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[#171717]/40">Volume de Inventário</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[#171717]/40">Sub-Regiões</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[#171717]/40">Health Check da IA</th>
                    <th className="px-6 py-4 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#171717]/5">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-sm font-semibold text-[#171717]/40">Nenhum destino encontrado.</td>
                    </tr>
                  ) : filtered.map(dest => (
                    <tr key={dest.name} className="hover:bg-[#171717]/[0.02] transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-black text-lg border border-blue-100">
                            {dest.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-black text-[#171717]">{dest.name}</p>
                            <p className="text-[11px] font-semibold text-[#171717]/40">Última indexação: {new Date(dest.lastUpdated).toLocaleDateString()}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-black text-[#171717]">{dest.experiencesCount}</p>
                        <p className="text-[11px] font-semibold text-[#171717]/40">{dest.publishedCount} publicadas</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {dest.neighborhoods.slice(0, 3).map(n => (
                            <span key={n} className="inline-flex px-2 py-0.5 rounded-md bg-[#171717]/5 text-[#171717]/60 text-[10px] font-bold">
                              {n}
                            </span>
                          ))}
                          {dest.neighborhoods.length > 3 && (
                            <span className="inline-flex px-2 py-0.5 rounded-md bg-[#171717]/5 text-[#171717]/60 text-[10px] font-bold">
                              +{dest.neighborhoods.length - 3}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {dest.issuesCount === 0 ? (
                          <span className="inline-flex px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-black uppercase tracking-wider">
                            100% Qualificado
                          </span>
                        ) : (
                          <span className="inline-flex px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-black uppercase tracking-wider">
                            {dest.issuesCount} Desvios Detectados
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="w-8 h-8 rounded-full flex items-center justify-center text-[#171717]/40 hover:bg-[#171717]/5 hover:text-[#171717] transition-all ml-auto">
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
