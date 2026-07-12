import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowLeft, Save, MapPin, Clock, DollarSign, Tag, Star,
  Link2, Image as ImageIcon, Globe, Building2, Utensils,
  Ticket, Info, Eye, Check, Plus, X, ChevronDown, BrainCircuit,
  Wand2, Zap, Heart, LayoutGrid, Calendar, Video, Bot
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { ContentNodeRow } from "@/repositories/ExperienceRepository";
import { toast } from "sonner";
import { cn, isVideoUrl } from "@/lib/utils";
import { NEW_YORK_NEIGHBORHOODS, TAXONOMY } from "@/config/constants";

const NYC_DESTINATION_ID = "e4a2c918-a6d1-41b9-8bc3-3b160b73c4d7";

type ContentType = ContentNodeRow["type"];

interface FormState {
  title: string;
  type: ContentType;
  status: ContentNodeRow["status"];
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
      const { data: node, error } = await supabase.from('content_nodes').select('*').eq('id', nodeId).single();
      if (error) throw error;

      const t = (node.translations as any) || {};

      setForm(prev => ({
        ...prev,
        title: node.title,
        type: node.type,
        status: node.status,
        description: node.description || '',
        address: node.address || '',
        neighborhood: t.neighborhood || '',
        location_lat: node.location_lat,
        location_lng: node.location_lng,
        media_urls: t.media_urls || (t.cover_url ? [t.cover_url] : []),
        affiliateLink: t.affiliateLink || t.booking_url || '',
        rating: t.rating ?? null,
        reviews_count: t.reviews_count ?? null,
        tags: t.tags || [],
        base_cost: t.base_cost ?? 0,
        duration_minutes: t.duration_minutes ?? 60,
        is_indoor: t.is_indoor ?? false,
        reservation_required: t.reservation_required ?? false,
        
        // AI Engine
        personaWeights: t.personaWeights || defaultForm.personaWeights,
        companionshipCompatibility: t.companionshipCompatibility || defaultForm.companionshipCompatibility,
        recommendedSeasons: t.recommendedSeasons || ['all'],
        weatherCompatibility: t.weatherCompatibility || ['all'],
        exclusivityLevel: t.exclusivityLevel || 'accessible',
        physicalEnergyRequired: t.physicalEnergyRequired || 'medium',
      }));
    } catch (e: any) {
      toast.error('Erro ao carregar: ' + e.message);
    } finally {
      setIsLoading(false);
    }
  }

  const buildPayload = () => {
    const translations: any = {
      neighborhood: form.neighborhood,
      media_urls: form.media_urls,
      affiliateLink: form.affiliateLink,
      rating: form.rating,
      reviews_count: form.reviews_count,
      tags: form.tags,
      base_cost: form.base_cost,
      duration_minutes: form.duration_minutes,
      is_indoor: form.is_indoor,
      reservation_required: form.reservation_required,
      
      // Engine
      personaWeights: form.personaWeights,
      companionshipCompatibility: form.companionshipCompatibility,
      recommendedSeasons: form.recommendedSeasons,
      weatherCompatibility: form.weatherCompatibility,
      exclusivityLevel: form.exclusivityLevel,
      physicalEnergyRequired: form.physicalEnergyRequired,
    };

    return {
      node: {
        title: form.title,
        type: form.type,
        status: form.status,
        description: form.description || null,
        address: form.address || null,
        location_lat: form.location_lat,
        location_lng: form.location_lng,
        destination_id: NYC_DESTINATION_ID,
        translations,
      } as any,
    };
  };

  const handleSave = async (publish = false) => {
    if (!form.title.trim()) { toast.error('O título é obrigatório.'); return; }
    setIsSaving(true);
    const toastId = toast.loading(publish ? 'Publicando...' : 'Salvando rascunho...');
    try {
      const { node } = buildPayload();
      if (publish) node.status = 'published';

      if (isNew) {
        const { error } = await supabase.from('content_nodes').insert([node]);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('content_nodes').update(node).eq('id', id!);
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

  const handleAiSync = async () => {
    if (!form.affiliateLink && !form.title) {
      toast.error('Coloque um link do GetYourGuide ou um título para sincronizar.');
      return;
    }
    setIsSyncingAI(true);
    const toastId = toast.loading('IA lendo o contexto e inferindo matemática (Firecrawl + LLM)...');
    
    // Simulate AI extraction and mathematical inference for the Engine
    setTimeout(() => {
      setForm(p => ({
        ...p,
        personaWeights: {
          explorador_visual: 90,
          curador_experiencias: 75,
          descobridor: 60,
          aproveitador: 85,
          slow_traveler: 30
        },
        companionshipCompatibility: {
          solo: 60,
          couple: 95,
          family: 40,
          friends: 80
        },
        recommendedSeasons: ['spring', 'summer', 'autumn'],
        weatherCompatibility: ['all'],
        exclusivityLevel: 'premium',
        physicalEnergyRequired: 'low',
        tags: [...p.tags, 'imperdivel', 'romantico', 'por_do_sol'],
        duration_minutes: p.duration_minutes || 90,
      }));
      toast.success('Sincronização matemática da IA concluída!', { id: toastId });
      setActiveTab('engine');
      setIsSyncingAI(false);
    }, 2500);
  };



  if (isLoading) {
    return <div className="h-full flex items-center justify-center"><div className="vf-spinner" /></div>;
  }

  return (
    <div className="max-w-[1400px] mx-auto p-6 vf-fade-in">
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
              
              <Section title="Localização & Geocoding" icon={MapPin}>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Bairro Exato">
                    <select value={form.neighborhood} onChange={e => set('neighborhood', e.target.value)} className="vf-input text-xs py-2.5">
                      {NEW_YORK_NEIGHBORHOODS.map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </Field>
                  <Field label="Endereço Completo">
                    <input value={form.address} onChange={e => set('address', e.target.value)} className="vf-input text-xs" placeholder="Ex: 350 5th Ave, New York, NY 10118" />
                  </Field>
                </div>
                
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex items-start gap-3 mt-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                    <Check className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">Geocoding Automático Ativo</p>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                      Não é necessário pinar no mapa. As coordenadas (Latitude/Longitude) serão resolvidas automaticamente via Nominatim/Google Places quando você salvar o endereço.
                    </p>
                    {(form.location_lat && form.location_lng) && (
                      <div className="mt-2 text-[10px] font-mono text-slate-400">
                        📍 Coordenadas atuais: {form.location_lat.toFixed(6)}, {form.location_lng.toFixed(6)}
                      </div>
                    )}
                  </div>
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

        {/* Right: Live Preview & AI Panel */}
        <div className="xl:col-span-4 space-y-4">
          <MultiPreview form={form} />
          
          {/* AI Suggestions Panel Placeholder */}
          <div className="bg-[#111827] rounded-[24px] p-5 shadow-lg relative overflow-hidden group">
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-colors pointer-events-none" />
            <div className="flex items-center gap-2 mb-4 relative z-10">
              <Bot className="w-4 h-4 text-indigo-400" />
              <h3 className="font-black text-sm text-white">Assistente de IA</h3>
            </div>
            <div className="space-y-3 relative z-10">
              <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex gap-3 items-start">
                <Star className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[11px] font-bold text-slate-200">Sugestão de Tag</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Baseado na descrição, recomendo adicionar a tag <strong>#arquitetura</strong>.</p>
                </div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex gap-3 items-start">
                <DollarSign className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[11px] font-bold text-slate-200">Oportunidade de Receita</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Falta o Link de Afiliado. O EPC médio para atrações no Midtown é de $0.15.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
