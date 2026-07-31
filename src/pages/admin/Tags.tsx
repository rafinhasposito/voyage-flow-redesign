import React, { useState, useEffect } from 'react';
import { Tag, Search, Network } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { AdminHeader } from '@/components/admin/AdminHeader';

interface TagStats {
  name: string;
  usageCount: number;
  cluster: string;
}

const CLUSTER_MAP: Record<string, string[]> = {
  'Gastronomia': ['restaurant', 'cafe', 'food', 'gastronomia', 'drink', 'bar', 'rooftop', 'street food'],
  'Cultura & Arte': ['museum', 'monument', 'teatro', 'classic', 'art', 'history', 'cultura', 'musical'],
  'Natureza & Aventura': ['park', 'nature', 'aventura', 'outdoor', 'hike', 'beach', 'praia', 'trilha'],
  'Entretenimento': ['show', 'music', 'nightlife', 'party', 'entertainment', 'shopping'],
  'Essenciais (Must See)': ['must see', 'iconic', 'landmark', 'famoso', 'tourist']
};

function getCluster(tagName: string): string {
  const lower = tagName.toLowerCase();
  for (const [cluster, keywords] of Object.entries(CLUSTER_MAP)) {
    if (keywords.some(k => lower.includes(k))) return cluster;
  }
  return 'Outros / Nicho';
}

export default function Tags() {
  const [searchTerm, setSearchTerm] = useState('');
  const [tags, setTags] = useState<TagStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTags() {
      try {
        const { data, error } = await supabase
          .from('experiences')
          .select('tags');
        
        if (error) throw error;

        const tagMap = new Map<string, number>();

        (data || []).forEach(exp => {
          if (Array.isArray(exp.tags)) {
            exp.tags.forEach(t => {
              if (typeof t === 'string') {
                const trimmed = t.trim();
                tagMap.set(trimmed, (tagMap.get(trimmed) || 0) + 1);
              }
            });
          }
        });

        const mappedTags = Array.from(tagMap.entries()).map(([name, usageCount]) => ({ 
          name, 
          usageCount,
          cluster: getCluster(name)
        })).sort((a, b) => b.usageCount - a.usageCount);

        setTags(mappedTags);
      } catch (err: any) {
        toast.error('Erro ao carregar tags: ' + err.message);
      } finally {
        setLoading(false);
      }
    }
    loadTags();
  }, []);

  const filtered = tags.filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase()));

  // Group by cluster
  const clusters = filtered.reduce((acc, tag) => {
    if (!acc[tag.cluster]) acc[tag.cluster] = [];
    acc[tag.cluster].push(tag);
    return acc;
  }, {} as Record<string, TagStats[]>);

  return (
    <div className="flex flex-col h-full bg-[#F7F7F2] font-sans overflow-auto selection:bg-[#D7F24B] selection:text-[#171717]">
      <AdminHeader
        title="Taxonomia (Clusters)"
        subtitle="Agrupamento semântico de Tags usado pelo Motor de Recomendação para processar interesses dos usuários."
        icon={<Network className="w-4 h-4 text-[#171717]" />}
        badgeText="Módulo de Inteligência"
        gradient="from-[#E0C3FC] to-[#8EC5FC]" // Purple to Blue for Intelligence
        loading={loading}
        metrics={[
          { label: 'Total de Tags Únicas', value: tags.length, color: 'bg-white/40' },
          { label: 'Categorias Master', value: Object.keys(CLUSTER_MAP).length, color: 'bg-white/30' },
        ]}
        actions={
          <div className="flex items-center gap-2 bg-white/40 backdrop-blur-md rounded-xl p-1 border border-white/40 shadow-sm relative w-[280px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#171717]/40" />
            <input 
              type="text"
              placeholder="Buscar tag..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 h-10 bg-transparent border-0 text-[13px] font-bold text-[#171717] placeholder:text-[#171717]/40 outline-none"
            />
          </div>
        }
      />

      <div className="flex-1 p-8">
        {loading ? (
          <div className="text-center py-20 text-[#171717]/40 font-bold text-sm">Analisando taxonomia do banco de dados...</div>
        ) : (
          <div className="max-w-[1200px] mx-auto space-y-8">
            {Object.entries(clusters).map(([clusterName, clusterTags]) => (
              <div key={clusterName} className="bg-white rounded-3xl border border-[#171717]/5 shadow-sm p-8">
                <div className="flex items-center justify-between mb-6 pb-6 border-b border-[#171717]/5">
                  <div>
                    <h2 className="text-xl font-black text-[#171717] flex items-center gap-2">
                      <Tag className="w-5 h-5 text-purple-500" />
                      {clusterName}
                    </h2>
                    <p className="text-xs font-semibold text-[#171717]/40 mt-1">
                      {clusterTags.length} tags associadas
                    </p>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {clusterTags.map(tag => (
                    <div key={tag.name} className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#F7F7F2] rounded-lg border border-[#171717]/5 hover:border-[#171717]/20 transition-colors">
                      <span className="text-[13px] font-bold text-[#171717]">{tag.name}</span>
                      <span className="text-[10px] font-black bg-[#171717]/10 text-[#171717]/60 px-1.5 py-0.5 rounded-md">
                        {tag.usageCount}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            
            {Object.keys(clusters).length === 0 && (
              <div className="text-center py-10 text-[#171717]/40 font-bold">Nenhuma tag correspondente encontrada.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
