import React, { useState, useEffect } from 'react';
import { Tag, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface TagStats {
  name: string;
  usageCount: number;
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

        setTags(Array.from(tagMap.entries()).map(([name, usageCount]) => ({ name, usageCount })).sort((a, b) => b.usageCount - a.usageCount));
      } catch (err: any) {
        toast.error('Erro ao carregar tags: ' + err.message);
      } finally {
        setLoading(false);
      }
    }
    loadTags();
  }, []);

  const filtered = tags.filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="flex flex-col h-full bg-vf-bg overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-vf-border z-10 shrink-0">
        <div>
          <h1 className="text-lg font-black text-vf-black tracking-tight flex items-center gap-2">
            <Tag className="w-4 h-4 text-emerald-600" /> Tags
          </h1>
          <p className="text-[11px] text-vf-text-3 font-semibold">Derivadas das tags das experiências atuais.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-vf-text-3 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input 
              type="text" 
              placeholder="Buscar tag..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-64 h-9 text-[13px]"
            />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {loading ? (
          <div className="text-center py-20 text-slate-400 font-bold text-sm">Carregando tags...</div>
        ) : (
          <div className="max-w-[1000px] mx-auto bg-white rounded-xl border border-vf-border overflow-hidden">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-6">
              {filtered.map(t => (
                <div key={t.name} className="flex justify-between items-center bg-[#F7F7F2] p-3 rounded-lg border border-vf-border shadow-sm">
                  <span className="font-bold text-vf-black text-sm">{t.name}</span>
                  <span className="px-2 py-1 bg-emerald-100 text-emerald-800 rounded text-xs font-black">{t.usageCount} usos</span>
                </div>
              ))}
              {filtered.length === 0 && (
                <div className="col-span-full text-center py-10 text-slate-400 font-bold">Nenhuma tag encontrada.</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
