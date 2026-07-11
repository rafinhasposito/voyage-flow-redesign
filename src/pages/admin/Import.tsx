import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Link as LinkIcon, Sparkles, AlertCircle, Search, 
  MapPin, Check, Plus, Trash2, Save, DownloadCloud, X, ArrowLeft
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

// Mock NYC destination ID for MVP
const NYC_DESTINATION_ID = "e4a2c918-a6d1-41b9-8bc3-3b160b73c4d7";

type ExtractedExperience = {
  _id: string; // temp id for UI
  title: string;
  type: "attraction" | "hotel" | "restaurant" | "event" | "editorial";
  category: string;
  short_description: string;
  description: string;
  base_cost: number;
  duration_minutes: number;
  address: string;
  neighborhood: string;
  location_lat: number | null;
  location_lng: number | null;
  booking_url: string | null;
  reservation_required: boolean;
  is_must_see: boolean;
  tags: string[];
  rating: number | null;
  media_urls?: string[];
  check_in_time?: string;
  check_out_time?: string;
  selected?: boolean;
};

export default function Import() {
  const navigate = useNavigate();
  const [url, setUrl] = useState("");
  const [isScraping, setIsScraping] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [results, setResults] = useState<ExtractedExperience[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleScrape = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setIsScraping(true);
    setError(null);
    setResults([]);

    const toastId = toast.loading("Lendo página e extraindo locais via IA...");

    try {
      const { data, error } = await supabase.functions.invoke("import-bulk", {
        body: { target_url: url }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      if (data?.experiences && Array.isArray(data.experiences)) {
        const withIds = data.experiences.map((exp: any, i: number) => ({
          ...exp,
          _id: `temp-${Date.now()}-${i}`,
          selected: true
        }));
        setResults(withIds);
        toast.success(`${withIds.length} experiências encontradas!`, { id: toastId });
      } else {
        throw new Error("Formato de resposta inválido da IA.");
      }
    } catch (err: any) {
      setError(err.message || "Falha ao importar URL.");
      toast.error("Erro na importação", { id: toastId });
    } finally {
      setIsScraping(false);
    }
  };

  const toggleSelect = (id: string) => {
    setResults(p => p.map(e => e._id === id ? { ...e, selected: !e.selected } : e));
  };

  const removeResult = (id: string) => {
    setResults(p => p.filter(e => e._id !== id));
  };

  const selectedCount = results.filter(r => r.selected).length;

  const handleSave = async (status: 'draft' | 'published') => {
    const toSave = results.filter(r => r.selected);
    if (toSave.length === 0) return;

    setIsSaving(true);
    const toastId = toast.loading(status === 'published' ? "Publicando experiências..." : "Salvando rascunhos...");

    try {
      const payloads = toSave.map(exp => ({
        destination_id: NYC_DESTINATION_ID,
        title: exp.title,
        type: exp.type === 'hotel' ? 'hotel' : exp.type === 'restaurant' ? 'restaurant' : 'attraction',
        status: status,
        description: exp.description || exp.short_description || null,
        address: exp.address || null,
        location_lat: exp.location_lat,
        location_lng: exp.location_lng,
        translations: {
          neighborhood: exp.neighborhood,
          cover_url: exp.media_urls?.[0] || '',
          booking_url: exp.booking_url || '',
          rating: exp.rating || null,
          tags: exp.tags || [],
          base_cost: exp.base_cost || 0,
          duration_minutes: exp.duration_minutes || 60,
          reservation_required: exp.reservation_required || false,
          stars: 4, // Default
          average_price_usd: exp.base_cost || 0,
          check_in_time: exp.check_in_time || "15:00",
          check_out_time: exp.check_out_time || "11:00",
          amenities: []
        }
      }));

      const { error } = await supabase.from('content_nodes').insert(payloads as any);
      if (error) throw error;

      toast.success(`${payloads.length} itens salvos com sucesso!`, { id: toastId });
      navigate('/admin/experiences');
    } catch (err: any) {
      toast.error("Erro ao salvar: " + err.message, { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6 vf-fade-in pb-32">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors shadow-sm">
            <ArrowLeft className="w-4 h-4 text-slate-600" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-[#0F1117] tracking-tight">Importação por IA (Firecrawl)</h1>
            <p className="text-xs text-slate-400 mt-0.5">Extraia atrações e hotéis em lote a partir de qualquer blog ou site de turismo.</p>
          </div>
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100/60 max-w-3xl mx-auto">
        <form onSubmit={handleScrape} className="space-y-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
              <LinkIcon className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="url"
              required
              placeholder="https://www.getyourguide.com/... ou https://blogdeviagem.com/..."
              value={url}
              onChange={e => setUrl(e.target.value)}
              disabled={isScraping || isSaving}
              className="w-full pl-14 pr-32 py-5 bg-slate-50 border border-slate-200 rounded-full text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#E2F18A] focus:bg-white transition-all shadow-inner"
            />
            <div className="absolute inset-y-2 right-2">
              <button
                type="submit"
                disabled={isScraping || isSaving || !url}
                className="h-full px-6 rounded-full bg-[#0F1117] text-[#E2F18A] font-black text-sm hover:opacity-90 disabled:opacity-50 transition-all flex items-center gap-2 shadow-md"
              >
                {isScraping ? (
                  <><div className="vf-spinner w-4 h-4 border-2 border-t-[#E2F18A] border-white/20" /> Lendo...</>
                ) : (
                  <><Sparkles className="w-4 h-4" /> Extrair</>
                )}
              </button>
            </div>
          </div>
          {error && (
            <div className="flex items-center gap-2 text-rose-600 bg-rose-50 px-4 py-3 rounded-2xl text-xs font-bold">
              <AlertCircle className="w-4 h-4" /> {error}
            </div>
          )}
        </form>
      </div>

      {/* Results Area */}
      {results.length > 0 && (
        <div className="space-y-6 animate-in slide-in-from-bottom-8 duration-500 pt-8">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-[#0F1117]">
              {results.length} Itens Encontrados
            </h2>
            <div className="flex gap-2">
              <button
                onClick={() => setResults(p => p.map(e => ({ ...e, selected: true })))}
                className="text-xs font-bold text-indigo-600 bg-indigo-50 px-4 py-2 rounded-full hover:bg-indigo-100"
              >
                Selecionar Todos
              </button>
              <button
                onClick={() => setResults(p => p.map(e => ({ ...e, selected: false })))}
                className="text-xs font-bold text-slate-500 bg-slate-100 px-4 py-2 rounded-full hover:bg-slate-200"
              >
                Desmarcar Todos
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {results.map((exp) => (
              <div
                key={exp._id}
                onClick={() => toggleSelect(exp._id)}
                className={cn(
                  "relative rounded-[24px] bg-white border p-5 cursor-pointer transition-all hover:shadow-lg flex flex-col gap-3",
                  exp.selected ? "border-[#E2F18A] ring-2 ring-[#E2F18A]/30 shadow-md" : "border-slate-200 shadow-sm"
                )}
              >
                <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
                  <button onClick={(e) => { e.stopPropagation(); removeResult(exp._id); }}
                    className="w-7 h-7 rounded-full bg-white/80 backdrop-blur border border-slate-200 flex items-center justify-center text-slate-400 hover:text-rose-500 shadow-sm">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <div className={cn("w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all bg-white",
                    exp.selected ? "border-black bg-black text-[#E2F18A]" : "border-slate-300 text-transparent"
                  )}>
                    <Check className="w-4 h-4" />
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="w-16 h-16 rounded-[16px] overflow-hidden bg-slate-100 flex-shrink-0">
                    {exp.media_urls?.[0] ? (
                      <img src={exp.media_urls[0]} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-[10px] font-black text-slate-300">IMG</div>
                    )}
                  </div>
                  <div className="flex-1 pr-12">
                    <h3 className="font-black text-[15px] leading-tight text-[#0F1117] line-clamp-2">{exp.title}</h3>
                    <div className="flex items-center gap-1.5 mt-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      <span className={cn("px-2 py-0.5 rounded-full", exp.type === 'hotel' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700')}>
                        {exp.type}
                      </span>
                      <span>• {exp.category}</span>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">{exp.short_description}</p>

                <div className="flex flex-wrap gap-1.5 mt-auto pt-3 border-t border-slate-100">
                  <span className="text-[11px] font-bold text-slate-600 bg-[#F0F2F5] px-2.5 py-1 rounded-full flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-400" /> {exp.neighborhood}
                  </span>
                  {exp.base_cost > 0 && (
                    <span className="text-[11px] font-bold text-slate-600 bg-[#F0F2F5] px-2.5 py-1 rounded-full">
                      ${exp.base_cost}
                    </span>
                  )}
                  {exp.is_must_see && (
                    <span className="text-[11px] font-black text-amber-700 bg-amber-100 px-2.5 py-1 rounded-full">
                      ⭐ Imperdível
                    </span>
                  )}
                  {exp.booking_url && (
                    <span className="text-[11px] font-bold text-blue-700 bg-blue-100 px-2.5 py-1 rounded-full">
                      🔗 Afiliado Link
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Sticky Actions Footer */}
          {selectedCount > 0 && (
            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-12">
              <div className="bg-[#0F1117] text-white px-3 py-3 rounded-full shadow-2xl flex items-center gap-4 border border-white/10"
                style={{ boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}>
                <div className="pl-4">
                  <span className="text-sm font-black mr-1">{selectedCount}</span>
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Selecionados</span>
                </div>
                <div className="w-px h-6 bg-white/20" />
                <button
                  onClick={() => handleSave('draft')}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-black transition-colors"
                >
                  <Save className="w-4 h-4" /> Salvar como Rascunho
                </button>
                <button
                  onClick={() => handleSave('published')}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#E2F18A] hover:bg-[#cce067] text-black text-xs font-black transition-colors"
                >
                  <Check className="w-4 h-4" /> Publicar Imediatamente
                </button>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
