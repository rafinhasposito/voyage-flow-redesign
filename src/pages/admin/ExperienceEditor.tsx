import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowLeft, Save, MapPin, Clock, DollarSign, Tag, Star,
  Link2, Image as ImageIcon, Globe, Building2, Utensils,
  Ticket, Info, Eye, Check, Plus, X, ChevronDown, BrainCircuit,
  Wand2, Zap, Heart, LayoutGrid, Calendar, Video
} from "lucide-react";
import { APIProvider, Map, AdvancedMarker } from "@vis.gl/react-google-maps";
import { supabase } from "@/lib/supabase";
import { Database } from "@/types/supabase.types";
type ExperienceRow = Database["public"]["Tables"]["experiences"]["Row"];
type ContentType = string;
import { toast } from "sonner";
import { cn, isVideoUrl } from "@/lib/utils";
import { NEW_YORK_NEIGHBORHOODS } from "@/config/constants";

const NYC_DESTINATION_ID = "e4a2c918-a6d1-41b9-8bc3-3b160b73c4d7";

interface FormState {
  title: string;
  type: ContentType;
  status: string;
  description: string;
  address: string;
  neighborhood: string;
  location_lat: number | null;
  location_lng: number | null;
  media_urls: string[]; // Replaces cover_url
  affiliateLink: string; // Replaces booking_url
  rating: number | null;
  reviews_count: number | null;
  
  // Base Attrs
  base_cost: number;
  duration_minutes: number;
  is_indoor: boolean;
  reservation_required: boolean;
  
  // Tags
  tags: string[];

  // --- AI ENGINE SETTINGS ---
  personaWeights: {
    explorador_visual: number;
    curador_experiencias: number;
    descobridor: number;
    aproveitador: number;
    slow_traveler: number;
  };
  companionshipCompatibility: {
    solo: number;
    couple: number;
    family: number;
    friends: number;
  };
  recommendedSeasons: string[];
  weatherCompatibility: string[];
  exclusivityLevel: string;
  physicalEnergyRequired: string;
}

const defaultForm: FormState = {
  title: "", type: "attraction", status: "draft",
  description: "", address: "", neighborhood: "Midtown",
  location_lat: null, location_lng: null,
  media_urls: [], affiliateLink: "", rating: null, reviews_count: null,
  base_cost: 0, duration_minutes: 60, is_indoor: false, reservation_required: false,
  tags: [],
  personaWeights: { explorador_visual: 50, curador_experiencias: 50, descobridor: 50, aproveitador: 50, slow_traveler: 50 },
  companionshipCompatibility: { solo: 50, couple: 50, family: 50, friends: 50 },
  recommendedSeasons: ["all"],
  weatherCompatibility: ["all"],
  exclusivityLevel: "accessible",
  physicalEnergyRequired: "medium"
};

// ─── Live Preview ─────────────────────────────────────────────────────────────
type PreviewTab = 'tinder' | 'itinerary' | 'home' | 'gallery';

function MultiPreview({ form }: { form: FormState }) {
  const [activeTab, setActiveTab] = useState<PreviewTab>('tinder');
  const primaryMedia = form.media_urls?.[0] || "";

  const renderTinder = () => (
    <div className="relative h-[550px] w-full rounded-[32px] overflow-hidden shadow-2xl bg-black" style={{ boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
      {primaryMedia ? (
        isVideoUrl(primaryMedia) ? (
          <video src={primaryMedia} autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <img src={primaryMedia} alt={form.title} className="absolute inset-0 w-full h-full object-cover" />
        )
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 text-slate-700">
          <ImageIcon className="w-12 h-12" />
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/10" />
      
      {/* Top Badges */}
      <div className="absolute top-6 left-6 right-6 flex items-center justify-between">
        <div className="bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-1.5">
          <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
          <span className="text-white text-xs font-black">{form.rating?.toFixed(1) || "5.0"}</span>
        </div>
        <div className="bg-[#E2F18A] text-black px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg">
          <BrainCircuit className="w-3.5 h-3.5" />
          <span className="text-xs font-black">98% Match</span>
        </div>
      </div>

      {/* Content */}
      <div className="absolute bottom-6 left-6 right-6">
        <div className="flex flex-wrap gap-2 mb-3">
          <span className="bg-white/20 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
            {form.neighborhood || 'Bairro'}
          </span>
          {form.personaWeights.explorador_visual > 80 && (
            <span className="bg-pink-500/80 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
              📸 Visual
            </span>
          )}
        </div>
        <h2 className="text-white font-black text-3xl leading-tight font-urbanist mb-2">{form.title || 'Título da Atração'}</h2>
        <p className="text-white/80 text-sm line-clamp-2 mb-4 leading-relaxed">{form.description || 'Descrição detalhada...'}</p>
        
        <div className="flex items-center gap-4 border-t border-white/20 pt-4">
          <div className="flex flex-col">
            <span className="text-white/50 text-[10px] uppercase font-bold tracking-widest">Tempo</span>
            <span className="text-white font-black text-sm">{form.duration_minutes} min</span>
          </div>
          <div className="flex flex-col">
            <span className="text-white/50 text-[10px] uppercase font-bold tracking-widest">Custo</span>
            <span className="text-white font-black text-sm">${form.base_cost}</span>
          </div>
          <div className="flex-1" />
          <button className="w-12 h-12 rounded-full bg-[#E2F18A] flex items-center justify-center hover:scale-105 transition-transform">
            <Heart className="w-5 h-5 text-black fill-black" />
          </button>
        </div>
      </div>
    </div>
  );

  const renderItinerary = () => (
    <div className="bg-white rounded-[24px] p-4 shadow-sm border border-slate-100 h-[550px] overflow-y-auto">
      <div className="flex items-start gap-4 mb-6">
        <div className="flex flex-col items-center mt-1">
          <div className="w-3 h-3 rounded-full bg-slate-300 ring-4 ring-white shadow-sm z-10" />
          <div className="w-px h-20 bg-slate-200" />
        </div>
        <div className="flex-1 pb-4">
          <p className="text-xs font-bold text-slate-400 mb-1">09:00 AM • Café da Manhã</p>
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-sm font-semibold text-slate-600">
            Atração anterior
          </div>
        </div>
      </div>
      
      {/* Current Node */}
      <div className="flex items-start gap-4 relative">
        <div className="flex flex-col items-center mt-1">
          <div className="w-4 h-4 rounded-full bg-[#E2F18A] ring-4 ring-white shadow-sm z-10" />
          <div className="w-px h-full bg-[#E2F18A] opacity-50 absolute top-4 left-[7px] -bottom-10" />
        </div>
        <div className="flex-1 pb-10">
          <p className="text-xs font-bold text-[#E2F18A] drop-shadow-sm mb-1">10:30 AM • {form.duration_minutes} min</p>
          <div className="bg-white rounded-[20px] p-2 border-2 border-[#E2F18A] shadow-md flex gap-3">
            <div className="w-20 h-20 rounded-[14px] overflow-hidden bg-slate-100 shrink-0">
               {primaryMedia ? (
                 isVideoUrl(primaryMedia) ? <video src={primaryMedia} className="w-full h-full object-cover" /> : <img src={primaryMedia} className="w-full h-full object-cover" />
               ) : null}
            </div>
            <div className="py-1 pr-2 flex-1 flex flex-col">
              <h3 className="font-black text-[13px] text-[#0F1117] leading-tight line-clamp-2">{form.title || 'Título da Atração'}</h3>
              <p className="text-[10px] text-slate-500 mt-0.5">{form.neighborhood}</p>
              <div className="mt-auto flex items-center justify-between">
                <span className="text-xs font-black text-[#0F1117]">${form.base_cost}</span>
                <button className="bg-[#0F1117] text-white px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider">Ver</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="sticky top-6">
      <div className="flex items-center justify-between mb-3 px-1">
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
          Multi-Preview
        </p>
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-full">
          <button onClick={() => setActiveTab('tinder')} className={cn("px-3 py-1 rounded-full text-[10px] font-bold transition-all", activeTab === 'tinder' ? 'bg-black text-white' : 'text-slate-500')}><Zap className="w-3 h-3 inline mr-1"/> Match</button>
          <button onClick={() => setActiveTab('itinerary')} className={cn("px-3 py-1 rounded-full text-[10px] font-bold transition-all", activeTab === 'itinerary' ? 'bg-black text-white' : 'text-slate-500')}><Calendar className="w-3 h-3 inline mr-1"/> Roteiro</button>
        </div>
      </div>

      <div className="transition-all duration-500 ease-in-out">
        {activeTab === 'tinder' && renderTinder()}
        {activeTab === 'itinerary' && renderItinerary()}
      </div>
    </div>
  );
}

// ─── Tag Input ─────────────────────────────────────────────────────────────────
function TagInput({ tags, onChange }: { tags: string[]; onChange: (t: string[]) => void }) {
  const [input, setInput] = useState('');
  const add = () => {
    const v = input.trim().toLowerCase().replace(/\s+/g, '_');
    if (v && !tags.includes(v)) onChange([...tags, v]);
    setInput('');
  };
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), add())}
          placeholder="ex: por_do_sol, rooftop..." className="vf-input text-xs flex-1 py-2" />
        <button onClick={add} className="px-3 py-2 rounded-xl bg-[#E2F18A] text-black text-xs font-black hover:opacity-80">
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map(t => (
            <span key={t} className="flex items-center gap-1 text-[11px] font-bold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full">
              #{t}
              <button onClick={() => onChange(tags.filter(x => x !== t))} className="text-slate-400 hover:text-red-500">
                <X className="w-2.5 h-2.5" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Slider ───────────────────────────────────────────────────────────────────
function RangeSlider({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
        <span>{label}</span>
        <span className="text-[#0F1117] font-black bg-slate-100 px-2 py-0.5 rounded">{value}%</span>
      </div>
      <input type="range" min={0} max={100} value={value} onChange={e => onChange(parseInt(e.target.value))} className="w-full accent-[#0F1117] h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer" />
    </div>
  );
}

// ─── Section Wrapper ───────────────────────────────────────────────────────────
function Section({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="rounded-[24px] bg-white p-6 shadow-sm border border-slate-100/60 space-y-4">
      <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
        <div className="w-7 h-7 rounded-[10px] bg-[#E2F18A]/30 flex items-center justify-center">
          <Icon className="w-3.5 h-3.5 text-slate-700" />
        </div>
        <h3 className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">{title}</h3>
      </div>
      {children}
    </div>
  );
}

// ─── Field ────────────────────────────────────────────────────────────────────
function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-black uppercase tracking-[0.1em] text-slate-400">{label}</label>
      {children}
      {hint && <p className="text-[10px] text-slate-400 italic">{hint}</p>}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function ExperienceEditor() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isNew = id === 'new';

  const [form, setForm] = useState<FormState>({
    ...defaultForm,
    type: (searchParams.get('type') as ContentType) || 'attraction',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(!isNew);
  const [isSyncingAI, setIsSyncingAI] = useState(false);
  const [enrichUrl, setEnrichUrl] = useState('');
  const [isEnriching, setIsEnriching] = useState(false);

  const [activeTab, setActiveTab] = useState<'basic' | 'engine' | 'media'>('basic');

  const set = useCallback((field: keyof FormState, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  }, []);

  const setDeep = useCallback((parent: keyof FormState, field: string, value: any) => {
    setForm(prev => ({ ...prev, [parent]: { ...(prev[parent] as any), [field]: value } }));
  }, []);

  const toggleArray = useCallback((field: keyof FormState, value: string) => {
    setForm(prev => {
      const arr = (prev[field] as string[]) || [];
      if (arr.includes(value)) return { ...prev, [field]: arr.filter(x => x !== value) };
      return { ...prev, [field]: [...arr, value] };
    });
  }, []);

  useEffect(() => {
    if (!isNew && id) loadData(id);
  }, [id, isNew]);

  async function loadData(nodeId: string) {
    setIsLoading(true);
    try {
      const { data: node, error } = await supabase.from('experiences').select('*').eq('id', nodeId).single();
      if (error) throw error;

      let ai: any = {};
      try { ai = JSON.parse(node.short_description || '{}'); } catch {}

      setForm(prev => ({
        ...prev,
        title: node.title,
        type: node.category as ContentType,
        status: node.status,
        description: node.description || '',
        address: node.address || '',
        neighborhood: node.neighborhood || '',
        location_lat: node.location_lat,
        location_lng: node.location_lng,
        media_urls: node.media_urls || [],
        affiliateLink: node.booking_url || '',
        rating: ai.rating ?? null,
        reviews_count: ai.reviews_count ?? null,
        tags: ai.tags || [],
        base_cost: node.base_cost ?? 0,
        duration_minutes: node.duration_minutes ?? 60,
        is_indoor: node.indoor_outdoor === 'indoor',
        reservation_required: ai.reservation_required ?? false,
        
        // AI Engine
        personaWeights: ai.personaWeights || defaultForm.personaWeights,
        companionshipCompatibility: ai.companionshipCompatibility || defaultForm.companionshipCompatibility,
        recommendedSeasons: ai.recommendedSeasons || ['all'],
        weatherCompatibility: ai.weatherCompatibility || ['all'],
        exclusivityLevel: ai.exclusivityLevel || 'accessible',
        physicalEnergyRequired: node.energy_level || 'medium',
      }));
    } catch (e: any) {
      toast.error('Erro ao carregar: ' + e.message);
    } finally {
      setIsLoading(false);
    }
  }

  const buildPayload = () => {
    const short_description = JSON.stringify({
      rating: form.rating,
      reviews_count: form.reviews_count,
      tags: form.tags,
      reservation_required: form.reservation_required,
      // Engine
      personaWeights: form.personaWeights,
      companionshipCompatibility: form.companionshipCompatibility,
      recommendedSeasons: form.recommendedSeasons,
      weatherCompatibility: form.weatherCompatibility,
      exclusivityLevel: form.exclusivityLevel,
    });

    return {
      row: {
        title: form.title,
        category: form.type,
        status: form.status,
        description: form.description || null,
        short_description,
        address: form.address || null,
        neighborhood: form.neighborhood || null,
        location_lat: form.location_lat,
        location_lng: form.location_lng,
        destination_id: NYC_DESTINATION_ID,
        media_urls: form.media_urls,
        booking_url: form.affiliateLink || null,
        base_cost: form.base_cost,
        duration_minutes: form.duration_minutes,
        energy_level: form.physicalEnergyRequired,
        indoor_outdoor: form.is_indoor ? 'indoor' : 'outdoor',
      } as any,
    };
  };

  const handleSave = async (publish = false) => {
    if (!form.title.trim()) { toast.error('O título é obrigatório.'); return; }
    setIsSaving(true);
    const toastId = toast.loading(publish ? 'Publicando...' : 'Salvando rascunho...');
    try {
      const { row } = buildPayload();
      if (publish) row.status = 'published';

      if (isNew) {
        const { error } = await supabase.from('experiences').insert([row]);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('experiences').update(row).eq('id', id!);
        if (error) throw error;
      }

      toast.success(publish ? '✅ Publicado com sucesso!' : '💾 Rascunho salvo!', { id: toastId });
      navigate('/admin/experiences');
    } catch (e: any) {
      toast.error('Erro: ' + e.message, { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  // ── URL Enrichment (REAL — calls import-bulk Edge Function) ─────────────────
  const handleUrlEnrich = async () => {
    if (!enrichUrl.trim()) { toast.error('Cole um link válido.'); return; }
    setIsEnriching(true);
    const toastId = toast.loading('IA lendo a página e extraindo informações...');
    try {
      const { data, error } = await supabase.functions.invoke('import-bulk', {
        body: { target_url: enrichUrl.trim() }
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const exp = data?.experiences?.[0];
      if (!exp) throw new Error('IA não encontrou dados nesta URL.');

      // Populate form with real AI data
      setForm(prev => ({
        ...prev,
        title: exp.title || prev.title,
        type: exp.type || prev.type,
        description: exp.description || exp.short_description || prev.description,
        address: exp.address || prev.address,
        neighborhood: exp.neighborhood || prev.neighborhood,
        location_lat: exp.location_lat ?? prev.location_lat,
        location_lng: exp.location_lng ?? prev.location_lng,
        media_urls: exp.media_urls?.length ? exp.media_urls : prev.media_urls,
        affiliateLink: enrichUrl.trim(), // set the source URL as affiliate link
        rating: exp.rating ?? prev.rating,
        reviews_count: exp.reviews_count ?? prev.reviews_count,
        tags: exp.tags?.length ? exp.tags : prev.tags,
        base_cost: exp.base_cost ?? prev.base_cost,
        duration_minutes: exp.duration_minutes ?? prev.duration_minutes,
        reservation_required: exp.reservation_required ?? prev.reservation_required,
      }));

      toast.success('✅ Dados importados! Revise e salve.', { id: toastId });
      setEnrichUrl('');
    } catch (e: any) {
      toast.error('Erro: ' + (e.message || 'Falha na importação'), { id: toastId });
    } finally {
      setIsEnriching(false);
    }
  };

  // ── AI Engine Sync (engine weights inference via Edge Function) ───────────────
  const handleAiSync = async () => {
    if (!form.title.trim()) {
      toast.error('Preencha ao menos o título para sincronizar a Engine.');
      return;
    }
    setIsSyncingAI(true);
    const toastId = toast.loading('Calculando pesos da Engine de Matching...');
    try {
      // Call the AI engine scoring edge function
      const { data, error } = await supabase.functions.invoke('ai-engine-score', {
        body: {
          title: form.title,
          category: form.type,
          description: form.description,
          tags: form.tags,
          neighborhood: form.neighborhood,
          base_cost: form.base_cost,
          duration_minutes: form.duration_minutes,
        }
      });

      if (error || !data) {
        // Fallback: intelligent local inference based on form data
        const isOutdoor = !form.is_indoor;
        const isExpensive = form.base_cost > 80;
        const isLong = form.duration_minutes > 90;

        setForm(p => ({
          ...p,
          personaWeights: {
            explorador_visual: isOutdoor ? 85 : 55,
            curador_experiencias: isExpensive ? 80 : 50,
            descobridor: 70,
            aproveitador: isLong ? 40 : 80,
            slow_traveler: !isLong && !isExpensive ? 75 : 30,
          },
          companionshipCompatibility: {
            solo: form.base_cost < 30 ? 80 : 60,
            couple: 75,
            family: form.type === 'attraction' ? 70 : 45,
            friends: 80,
          },
          recommendedSeasons: isOutdoor ? ['spring', 'summer', 'autumn'] : ['all'],
          weatherCompatibility: form.is_indoor ? ['all'] : ['sunny', 'cloudy'],
          exclusivityLevel: isExpensive ? 'premium' : 'accessible',
          physicalEnergyRequired: isLong ? 'high' : isOutdoor ? 'medium' : 'low',
        }));
        toast.success('✅ Engine calibrada com inteligência local!', { id: toastId });
      } else {
        setForm(p => ({ ...p, ...data }));
        toast.success('✅ Engine sincronizada com IA!', { id: toastId });
      }

      setActiveTab('engine');
    } catch (e: any) {
      toast.error('Erro na Engine: ' + e.message, { id: toastId });
    } finally {
      setIsSyncingAI(false);
    }
  };

  const handleMapClick = (e: any) => {
    const lat = e.detail?.latLng?.lat;
    const lng = e.detail?.latLng?.lng;
    if (lat && lng) {
      set('location_lat', lat);
      set('location_lng', lng);
      toast.success(`📍 Coordenadas: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
    }
  };

  if (isLoading) {
    return <div className="h-full flex items-center justify-center"><div className="vf-spinner" /></div>;
  }

  return (
    <div className="max-w-[1400px] mx-auto p-6 vf-fade-in">
      {/* ── URL Enrichment Banner ──────────────────────────────────────── */}
      <div className="mb-4 rounded-[20px] p-4 border-2 border-dashed border-indigo-200 bg-indigo-50/50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-[14px] bg-indigo-600 flex items-center justify-center flex-shrink-0">
            <Link2 className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-black text-indigo-800 mb-0.5">Cole o link → IA preenche tudo</p>
            <p className="text-[10px] text-indigo-500">GetYourGuide · Viator · Civitatis · Google Maps · Booking · Blog de viagem</p>
          </div>
        </div>
        <div className="flex gap-2 mt-3">
          <input
            value={enrichUrl}
            onChange={e => setEnrichUrl(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleUrlEnrich()}
            placeholder="https://www.getyourguide.com/new-york/..."
            className="flex-1 text-xs px-4 py-2.5 rounded-[12px] border border-indigo-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent placeholder-slate-300"
            disabled={isEnriching}
          />
          <button
            onClick={handleUrlEnrich}
            disabled={isEnriching || !enrichUrl.trim()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-[12px] text-xs font-black text-white bg-indigo-600 hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
          >
            {isEnriching
              ? <><Wand2 className="w-3.5 h-3.5 animate-spin" /> Importando...</>
              : <><Wand2 className="w-3.5 h-3.5" /> Enriquecer com IA</>
            }
          </button>
        </div>
      </div>

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6 bg-white p-4 rounded-[24px] shadow-sm border border-slate-100">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center hover:bg-slate-100 transition-colors">
            <ArrowLeft className="w-4 h-4 text-slate-600" />
          </button>
          <div>
            <h1 className="text-xl font-black text-[#0F1117] tracking-tight flex items-center gap-2">
              <Wand2 className="w-5 h-5 text-indigo-500" />
              Editor Concierge (IA)
            </h1>
            <p className="text-[11px] text-slate-400 mt-0.5">Treine a IA para esta experiência através dos campos abaixo.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleAiSync} disabled={isSyncingAI} className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-indigo-50 text-indigo-600 text-xs font-black hover:bg-indigo-100 transition-colors disabled:opacity-50">
            {isSyncingAI ? <Zap className="w-4 h-4 animate-pulse" /> : <BrainCircuit className="w-4 h-4" />}
            Sincronizar com IA
          </button>
          <div className="w-px h-6 bg-slate-200" />
          <button onClick={() => handleSave(false)} disabled={isSaving} className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white border border-slate-200 text-xs font-bold text-slate-600 hover:border-slate-300 transition-all shadow-sm disabled:opacity-50">
            Salvar Rascunho
          </button>
          <button onClick={() => handleSave(true)} disabled={isSaving} className="flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-black text-[#0F1117] transition-all shadow-sm hover:scale-105 disabled:opacity-50" style={{ background: '#E2F18A' }}>
            <Eye className="w-3.5 h-3.5" /> Salvar & Publicar
          </button>
        </div>
      </div>

      {/* ── Layout ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        
        {/* Left: Editor Tabs */}
        <div className="xl:col-span-8 space-y-4">
          <div className="flex items-center gap-2 bg-white p-2 rounded-full shadow-sm border border-slate-100 w-fit">
            <button onClick={() => setActiveTab('basic')} className={cn("px-5 py-2 rounded-full text-xs font-bold transition-all", activeTab === 'basic' ? 'bg-[#0F1117] text-white' : 'text-slate-500 hover:bg-slate-50')}>Info Básica</button>
            <button onClick={() => setActiveTab('engine')} className={cn("px-5 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5", activeTab === 'engine' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-50')}>
              <BrainCircuit className="w-3.5 h-3.5" /> IA Engine
            </button>
            <button onClick={() => setActiveTab('media')} className={cn("px-5 py-2 rounded-full text-xs font-bold transition-all", activeTab === 'media' ? 'bg-[#0F1117] text-white' : 'text-slate-500 hover:bg-slate-50')}>Galeria & Links</button>
          </div>

          {activeTab === 'basic' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <Section title="Geral" icon={Info}>
                <Field label="Título *">
                  <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="Top of the Rock" className="vf-input text-lg font-black" />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Tipo">
                    <select value={form.type} onChange={e => set('type', e.target.value)} className="vf-input text-xs py-2.5">
                      <option value="attraction">Atração</option><option value="restaurant">Restaurante</option><option value="event">Evento</option>
                    </select>
                  </Field>
                  <Field label="Duração Estimada (Minutos)">
                    <input type="number" value={form.duration_minutes} onChange={e => set('duration_minutes', Number(e.target.value))} className="vf-input text-xs" />
                  </Field>
                </div>
                <Field label="Descrição Narrativa">
                  <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={4} className="vf-input text-xs resize-none" placeholder="O que torna essa experiência especial para o viajante?" />
                </Field>
              </Section>
              
              <Section title="Localização" icon={MapPin}>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Bairro Exato">
                    <select value={form.neighborhood} onChange={e => set('neighborhood', e.target.value)} className="vf-input text-xs py-2.5">
                      {NEW_YORK_NEIGHBORHOODS.map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </Field>
                  <Field label="Endereço">
                    <input value={form.address} onChange={e => set('address', e.target.value)} className="vf-input text-xs" />
                  </Field>
                </div>
                <div className="h-48 rounded-[20px] overflow-hidden border border-slate-200 shadow-sm relative">
                  <div className="absolute top-2 left-2 z-10 bg-white/90 backdrop-blur text-[10px] font-bold px-2 py-1 rounded shadow-sm">Clique no mapa para pinar</div>
                  <APIProvider apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
                    <Map defaultCenter={{ lat: form.location_lat ?? 40.7580, lng: form.location_lng ?? -73.9855 }} defaultZoom={13} mapId="EDITOR_MAP" disableDefaultUI={true} onClick={handleMapClick} style={{ cursor: 'crosshair' }}>
                      {form.location_lat && form.location_lng && (
                        <AdvancedMarker position={{ lat: form.location_lat, lng: form.location_lng }}>
                          <div className="w-5 h-5 bg-[#E2F18A] border-2 border-black rounded-full shadow-lg" />
                        </AdvancedMarker>
                      )}
                    </Map>
                  </APIProvider>
                </div>
              </Section>
            </div>
          )}

          {activeTab === 'engine' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="bg-indigo-50 border border-indigo-100 rounded-[24px] p-5 flex gap-4 items-start">
                <div className="bg-white p-2 rounded-xl shadow-sm"><BrainCircuit className="w-5 h-5 text-indigo-600" /></div>
                <div>
                  <h3 className="font-black text-sm text-indigo-900">Treinamento do Algoritmo de Match</h3>
                  <p className="text-xs text-indigo-700/80 mt-1">Os pesos abaixo definem a probabilidade desta experiência aparecer no roteiro gerado pela IA. Ajuste de 0 a 100.</p>
                </div>
              </div>

              <Section title="Afinidade por Persona (0-100)" icon={Star}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                  <RangeSlider label="📸 Explorador Visual (Fotos)" value={form.personaWeights.explorador_visual} onChange={v => setDeep('personaWeights', 'explorador_visual', v)} />
                  <RangeSlider label="🎩 Curador de Experiências (VIP)" value={form.personaWeights.curador_experiencias} onChange={v => setDeep('personaWeights', 'curador_experiencias', v)} />
                  <RangeSlider label="🧭 Descobridor (Hidden Gems)" value={form.personaWeights.descobridor} onChange={v => setDeep('personaWeights', 'descobridor', v)} />
                  <RangeSlider label="🎢 Aproveitador (Intenso/Rápido)" value={form.personaWeights.aproveitador} onChange={v => setDeep('personaWeights', 'aproveitador', v)} />
                  <RangeSlider label="☕ Slow Traveler (Relax/Cafés)" value={form.personaWeights.slow_traveler} onChange={v => setDeep('personaWeights', 'slow_traveler', v)} />
                </div>
              </Section>

              <Section title="Compatibilidade de Companhia" icon={Heart}>
                <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                  <RangeSlider label="🕺 Solo" value={form.companionshipCompatibility.solo} onChange={v => setDeep('companionshipCompatibility', 'solo', v)} />
                  <RangeSlider label="👩‍❤️‍👨 Casal" value={form.companionshipCompatibility.couple} onChange={v => setDeep('companionshipCompatibility', 'couple', v)} />
                  <RangeSlider label="👨‍👩‍👧 Família (Crianças)" value={form.companionshipCompatibility.family} onChange={v => setDeep('companionshipCompatibility', 'family', v)} />
                  <RangeSlider label="🍻 Amigos" value={form.companionshipCompatibility.friends} onChange={v => setDeep('companionshipCompatibility', 'friends', v)} />
                </div>
              </Section>

              <Section title="Condições Climáticas & Energia" icon={Zap}>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Estações Recomendadas">
                    <div className="flex flex-wrap gap-2 mt-1">
                      {['winter', 'spring', 'summer', 'autumn', 'all'].map(season => (
                        <button key={season} onClick={() => toggleArray('recommendedSeasons', season)} className={cn("px-3 py-1.5 rounded-full text-xs font-bold border transition-all", form.recommendedSeasons.includes(season) ? "bg-black text-white border-black" : "bg-white text-slate-500 border-slate-200")}>
                          {season}
                        </button>
                      ))}
                    </div>
                  </Field>
                  <Field label="Energia Física">
                    <select value={form.physicalEnergyRequired} onChange={e => set('physicalEnergyRequired', e.target.value)} className="vf-input text-xs py-2">
                      <option value="low">Baixa (Passeio Leve)</option>
                      <option value="medium">Média (Caminhada)</option>
                      <option value="high">Alta (Trilha/Esforço)</option>
                    </select>
                  </Field>
                </div>
                <Field label="Tags Comportamentais (Motor extra)">
                  <TagInput tags={form.tags} onChange={v => set('tags', v)} />
                </Field>
              </Section>
            </div>
          )}

          {activeTab === 'media' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <Section title="Galeria Visual" icon={Video}>
                <Field label="URLs de Imagem ou Vídeo (.mp4, .webp)" hint="Adicione uma URL por linha. A primeira será a Capa.">
                  <textarea 
                    value={form.media_urls.join('\n')} 
                    onChange={e => set('media_urls', e.target.value.split('\n').map(u => u.trim()).filter(Boolean))}
                    rows={4} className="vf-input text-[11px] font-mono whitespace-nowrap overflow-x-auto bg-slate-50" 
                    placeholder="https://.../img1.jpg&#10;https://.../video.mp4"
                  />
                </Field>
                {form.media_urls.length > 0 && (
                  <div className="grid grid-cols-4 gap-2 mt-2">
                    {form.media_urls.map((url, i) => (
                      <div key={i} className="aspect-square rounded-xl overflow-hidden bg-slate-100 border border-slate-200 relative">
                        {isVideoUrl(url) ? <video src={url} className="w-full h-full object-cover" muted /> : <img src={url} className="w-full h-full object-cover" />}
                        {i === 0 && <span className="absolute bottom-1 right-1 bg-black/70 text-white text-[8px] font-bold px-1.5 py-0.5 rounded uppercase">Capa</span>}
                      </div>
                    ))}
                  </div>
                )}
              </Section>
              <Section title="Vendas & Afiliados" icon={DollarSign}>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Preço Base (Custo USD)">
                    <input type="number" value={form.base_cost} onChange={e => set('base_cost', Number(e.target.value))} className="vf-input font-black text-lg text-emerald-700" />
                  </Field>
                  <Field label="Link de Venda (GetYourGuide, Viator)">
                    <input value={form.affiliateLink} onChange={e => set('affiliateLink', e.target.value)} className="vf-input text-xs h-full" placeholder="https://..." />
                  </Field>
                </div>
              </Section>
            </div>
          )}
        </div>

        {/* Right: Live Preview */}
        <div className="xl:col-span-4">
          <MultiPreview form={form} />
        </div>
      </div>
    </div>
  );
}
