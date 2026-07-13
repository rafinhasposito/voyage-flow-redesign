import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowLeft, MapPin, DollarSign, Star,
  Link2, Image as ImageIcon, Check, Plus, X, BrainCircuit,
  Wand2, Zap, Heart, Video, AlertCircle, Save, Clock
} from "lucide-react";
import { APIProvider, Map, AdvancedMarker } from "@vis.gl/react-google-maps";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { cn, isVideoUrl } from "@/lib/utils";
import { NEW_YORK_NEIGHBORHOODS } from "@/config/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ExperienceRepository } from "@/repositories/ExperienceRepository";

const NYC_DESTINATION_ID = "e4a2c918-a6d1-41b9-8bc3-3b160b73c4d7";

interface FormState {
  title: string;
  description: string;
  short_description: string;
  category: string;
  type: string;
  status: string;

  address: string;
  neighborhood: string;
  location_lat: number | null;
  location_lng: number | null;

  duration_minutes: number;
  reservation_required: boolean;
  check_in_time: string | null;
  check_out_time: string | null;

  base_cost: number;
  booking_url: string;

  tags: string[];
  personas: string[];
  rating: number | null;
  reviews_count: number | null;
  is_must_see: boolean;
  exclusivity_level: string;
  dress_code: string;
  climate: string | null;
  ideal_companion: string | null;

  personaWeights: { explorador_visual: number; curador_experiencias: number; descobridor: number; aproveitador: number; slow_traveler: number; };
  companionshipCompatibility: { solo: number; couple: number; family: number; friends: number; };
  recommendedSeasons: string[];
  weatherCompatibility: string[];

  media_urls: string[]; 
  video_embed_url: string | null;

  _original_intelligence_metadata: Record<string, unknown> | null;
}

const defaultForm: FormState = {
  title: "", description: "", short_description: "", category: "Atração", type: "attraction", status: "draft",
  address: "", neighborhood: "Midtown", location_lat: null, location_lng: null,
  duration_minutes: 60, reservation_required: false, check_in_time: null, check_out_time: null,
  base_cost: 0, booking_url: "",
  tags: [], personas: [], rating: null, reviews_count: null, is_must_see: false, exclusivity_level: "accessible", dress_code: "casual", climate: "", ideal_companion: "",
  personaWeights: { explorador_visual: 50, curador_experiencias: 50, descobridor: 50, aproveitador: 50, slow_traveler: 50 },
  companionshipCompatibility: { solo: 50, couple: 50, family: 50, friends: 50 },
  recommendedSeasons: ["all"], weatherCompatibility: ["all"],
  media_urls: [], video_embed_url: null,
  _original_intelligence_metadata: null
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
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
        <Input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), add())}
          placeholder="ex: parque, museu..." className="flex-1" />
        <Button onClick={add} variant="outline" size="icon" className="shrink-0"><Plus className="w-4 h-4" /></Button>
      </div>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map(t => (
            <span key={t} className="flex items-center gap-1 text-[11px] font-bold bg-vf-muted text-vf-text-1 px-2 py-1 rounded-md">
              #{t}
              <button onClick={() => onChange(tags.filter(x => x !== t))} className="text-vf-text-3 hover:text-vf-danger">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function RangeSlider({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-[11px] font-bold text-vf-text-2">
        <span>{label}</span>
        <span className="text-vf-black">{value}%</span>
      </div>
      <input type="range" min={0} max={100} value={value} onChange={e => onChange(parseInt(e.target.value))} className="w-full accent-vf-black h-1 bg-vf-muted rounded-lg appearance-none cursor-pointer" />
    </div>
  );
}

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-bold uppercase tracking-widest text-vf-text-3">{label}</label>
      {children}
      {hint && <p className="text-[10px] text-vf-text-3">{hint}</p>}
    </div>
  );
}

function Section({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-vf-border shadow-vf-sm p-6 space-y-5">
      <div className="flex items-center gap-2 pb-3 border-b border-vf-border/50">
        <Icon className="w-4 h-4 text-vf-text-2" />
        <h3 className="text-[13px] font-black uppercase tracking-widest text-vf-black">{title}</h3>
      </div>
      {children}
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
    type: searchParams.get('type') || 'attraction',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(!isNew);
  const [isSyncingAI, setIsSyncingAI] = useState(false);
  const [enrichUrl, setEnrichUrl] = useState('');
  const [isEnriching, setIsEnriching] = useState(false);

  const set = useCallback((field: keyof FormState, value: unknown) => { setForm(prev => ({ ...prev, [field]: value })); }, []);
  const setDeep = useCallback((parent: keyof FormState, field: string, value: unknown) => { setForm(prev => ({ ...prev, [parent]: { ...(prev[parent] as Record<string, unknown>), [field]: value } })); }, []);
  
  useEffect(() => { if (!isNew && id) loadData(id); }, [id, isNew]);

  async function loadData(nodeId: string) {
    setIsLoading(true);
    try {
      const { data: node, error } = await supabase.from('experiences').select('*').eq('id', nodeId).single();
      if (error) throw error;
      
      const ai = (node.intelligence_metadata as Record<string, unknown>) || {};
      const weights = (ai.personaWeights as Record<string, number>) || {};
      const comp = (ai.companionshipCompatibility as Record<string, number>) || {};

      const safeScale = (val: number | undefined | null, def: number) => {
         if (val === undefined || val === null) return def * 100;
         return Math.round(val * 100);
      };

      setForm(prev => ({
        ...prev, 
        title: node.title || '',
        description: node.description || '',
        short_description: node.short_description || '',
        category: node.category || '',
        type: node.type || node.category || '',
        status: node.status || 'draft',

        address: node.address || '',
        neighborhood: node.neighborhood || 'Midtown',
        location_lat: node.location_lat,
        location_lng: node.location_lng,

        duration_minutes: node.duration_minutes ?? 60,
        reservation_required: node.reservation_required ?? false,
        check_in_time: node.check_in_time || null,
        check_out_time: node.check_out_time || null,

        base_cost: node.base_cost ?? 0,
        booking_url: node.booking_url || '',

        tags: node.tags || [],
        personas: node.personas || [],
        rating: node.rating ?? null,
        reviews_count: node.reviews_count ?? null,
        is_must_see: node.is_must_see ?? false,
        exclusivity_level: node.exclusivity_level || 'accessible',
        dress_code: node.dress_code || 'casual',
        climate: node.climate || '',
        ideal_companion: node.ideal_companion || '',

        personaWeights: { 
          explorador_visual: safeScale(weights.explorador_visual, 0.5), 
          curador_experiencias: safeScale(weights.curador_experiencias, 0.5), 
          descobridor: safeScale(weights.descobridor, 0.5), 
          aproveitador: safeScale(weights.aproveitador, 0.5), 
          slow_traveler: safeScale(weights.slow_traveler, 0.5) 
        },
        companionshipCompatibility: { 
          solo: safeScale(comp.solo, 0.5), 
          couple: safeScale(comp.couple, 0.5), 
          family: safeScale(comp.family, 0.5), 
          friends: safeScale(comp.friends, 0.5) 
        },
        recommendedSeasons: (ai.recommendedSeasons as string[]) || ['all'],
        weatherCompatibility: (ai.weatherCompatibility as string[]) || ['all'],

        media_urls: node.media_urls || [],
        video_embed_url: node.video_embed_url || null,
        
        _original_intelligence_metadata: node.intelligence_metadata as Record<string, unknown> | null,
      }));
    } catch (e: unknown) { toast.error('Erro ao carregar: ' + (e as Error).message); } 
    finally { setIsLoading(false); }
  }

  const buildPayload = () => {
    const outWeights = {
       explorador_visual: form.personaWeights.explorador_visual / 100,
       curador_experiencias: form.personaWeights.curador_experiencias / 100,
       descobridor: form.personaWeights.descobridor / 100,
       aproveitador: form.personaWeights.aproveitador / 100,
       slow_traveler: form.personaWeights.slow_traveler / 100,
    };
    const outComp = {
       solo: form.companionshipCompatibility.solo / 100,
       couple: form.companionshipCompatibility.couple / 100,
       family: form.companionshipCompatibility.family / 100,
       friends: form.companionshipCompatibility.friends / 100,
    };
    
    const newIntelligence = {
       ...(form._original_intelligence_metadata || {}),
       personaWeights: outWeights,
       companionshipCompatibility: outComp,
       recommendedSeasons: form.recommendedSeasons,
       weatherCompatibility: form.weatherCompatibility,
    };

    return {
      title: form.title,
      description: form.description || null,
      short_description: form.short_description || null,
      category: form.category || null,
      type: form.type || null,
      status: form.status,
      
      address: form.address || null,
      neighborhood: form.neighborhood || null,
      location_lat: form.location_lat,
      location_lng: form.location_lng,
      
      duration_minutes: form.duration_minutes,
      reservation_required: form.reservation_required,
      check_in_time: form.check_in_time || null,
      check_out_time: form.check_out_time || null,
      
      base_cost: form.base_cost,
      booking_url: form.booking_url || null,
      
      tags: form.tags.length > 0 ? form.tags : null,
      personas: form.personas.length > 0 ? form.personas : null,
      rating: form.rating,
      reviews_count: form.reviews_count,
      is_must_see: form.is_must_see,
      exclusivity_level: form.exclusivity_level || null,
      dress_code: form.dress_code || null,
      climate: form.climate || null,
      ideal_companion: form.ideal_companion || null,
      
      media_urls: form.media_urls.length > 0 ? form.media_urls : null,
      video_embed_url: form.video_embed_url || null,
      
      intelligence_metadata: newIntelligence,
      destination_id: NYC_DESTINATION_ID
    };
  };

  const handleSave = async (publish = false) => {
    if (!form.title.trim()) { toast.error('O título é obrigatório.'); return; }
    setIsSaving(true);
    const toastId = toast.loading(publish ? 'Publicando...' : 'Salvando rascunho...');
    try {
      const row = buildPayload();
      if (publish) row.status = 'published';
      if (isNew) {
        const { error } = await supabase.from('experiences').insert([row]);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('experiences').update(row).eq('id', id!);
        if (error) throw error;
      }
      ExperienceRepository.invalidateCache();
      toast.success(publish ? '✅ Publicado!' : '💾 Salvo!', { id: toastId });
      
      if (!isNew && id) {
        await loadData(id); // Recarregar para confirmar
      } else {
        navigate('/admin/experiences');
      }
    } catch (e: unknown) { toast.error('Erro ao salvar: ' + (e as Error).message, { id: toastId }); } 
    finally { setIsSaving(false); }
  };

  const handleUrlEnrich = async () => {
    if (!enrichUrl.trim()) return;
    setIsEnriching(true);
    const toastId = toast.loading('Extraindo informações...');
    try {
      const { data, error } = await supabase.functions.invoke('import-bulk', { body: { target_url: enrichUrl.trim() } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const exp = data?.experiences?.[0];
      if (!exp) throw new Error('Dados não encontrados.');
      setForm(prev => ({ ...prev, ...exp, booking_url: enrichUrl.trim() }));
      toast.success('✅ Dados importados!', { id: toastId });
      setEnrichUrl('');
    } catch (e: unknown) { toast.error('Erro: ' + (e as Error).message, { id: toastId }); } 
    finally { setIsEnriching(false); }
  };

  const handleAiSync = async () => {
    if (!form.title.trim()) { toast.error('Título obrigatório para IA.'); return; }
    setIsSyncingAI(true);
    const toastId = toast.loading('Treinando algoritmo...');
    try {
      const { data, error } = await supabase.functions.invoke('ai-engine-score', { body: form });
      if (error || !data) {
        setForm(p => ({
          ...p,
          personaWeights: { explorador_visual: 85, curador_experiencias: p.base_cost > 80 ? 80 : 50, descobridor: 70, aproveitador: 60, slow_traveler: 40 },
          companionshipCompatibility: { solo: 70, couple: 80, family: 60, friends: 90 },
        }));
        toast.success('✅ Algoritmo calibrado localmente!', { id: toastId });
      } else {
        setForm(p => ({ ...p, ...data }));
        toast.success('✅ Algoritmo calibrado via IA!', { id: toastId });
      }
    } catch (e: unknown) { toast.error('Erro: ' + (e as Error).message, { id: toastId }); } 
    finally { setIsSyncingAI(false); }
  };

  const isLodging = ['hotel', 'hostel', 'accommodation'].includes(form.type.toLowerCase());

  if (isLoading) return <div className="h-full flex items-center justify-center"><div className="w-6 h-6 border-2 border-vf-lime border-t-vf-black rounded-full animate-spin" /></div>;

  return (
    <div className="flex flex-col h-full bg-vf-bg overflow-hidden">
      
      {/* ── Sticky Header ── */}
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-vf-border z-10 shrink-0">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate(-1)} className="rounded-full w-8 h-8"><ArrowLeft className="w-4 h-4" /></Button>
          <div>
            <h1 className="text-lg font-black text-vf-black tracking-tight flex items-center gap-2">
              <BrainCircuit className="w-4 h-4 text-indigo-600" /> Editor Inteligente
            </h1>
            <p className="text-[11px] text-vf-text-3 font-semibold">Treine a IA e gerencie as informações da atração.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => handleSave(false)} disabled={isSaving} className="text-vf-text-2">
            Salvar Rascunho
          </Button>
          <Button variant="lime" size="sm" onClick={() => handleSave(true)} disabled={isSaving}>
            <Check className="w-4 h-4" /> Publicar Oficial
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-[1200px] mx-auto">
          
          {/* AI Import Bar */}
          <div className="mb-6 bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex flex-col md:flex-row items-center gap-4 shadow-sm">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0">
                <Wand2 className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-[13px] font-black text-indigo-900">Preenchimento Automático por Link</p>
                <p className="text-[11px] text-indigo-600">Cole a URL do GetYourGuide, Viator, etc. A IA extrairá tudo.</p>
              </div>
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <Input value={enrichUrl} onChange={e => setEnrichUrl(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleUrlEnrich()} placeholder="https://..." className="w-full md:w-64 bg-white border-indigo-200" disabled={isEnriching} />
              <Button onClick={handleUrlEnrich} disabled={isEnriching || !enrichUrl} className="bg-indigo-600 hover:bg-indigo-700 text-white shrink-0">
                {isEnriching ? <Wand2 className="w-4 h-4 animate-spin" /> : 'Extrair'}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* ── Left Column (2/3): Dados Principais & Mídia ── */}
            <div className="lg:col-span-8 space-y-6">
              
              <Section title="Identidade" icon={AlertCircle}>
                <Field label="Nome da Experiência *">
                  <Input value={form.title} onChange={e => set('title', e.target.value)} placeholder="Top of the Rock" className="font-black text-lg h-12" />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Categoria Editorial">
                    <select value={form.category} onChange={e => set('category', e.target.value)} className="flex h-10 w-full rounded-md border border-vf-border bg-white px-3.5 py-2.5 text-[13px] text-vf-text-1 focus:border-vf-black focus:outline-none focus:ring-1 focus:ring-vf-black">
                      <option value="culture">Cultura</option><option value="food">Comida</option><option value="views">Vistas</option><option value="nature">Natureza</option><option value="shopping">Compras</option>
                      <option value="classic">Clássico</option><option value="nightlife">Vida Noturna</option><option value="hidden_gem">Tesouro Escondido</option><option value="Atração">Atração</option>
                    </select>
                  </Field>
                  <Field label="Tipo (Técnico)">
                    <Input value={form.type} onChange={e => set('type', e.target.value)} placeholder="ex: museum, hotel" />
                  </Field>
                </div>
                <Field label="Descrição Principal">
                  <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={4} className="flex w-full rounded-md border border-vf-border bg-white px-3 py-2 text-[13px] text-vf-text-1 focus:border-vf-black focus:outline-none focus:ring-1 focus:ring-vf-black resize-none" placeholder="Conte uma história completa..." />
                </Field>
                <Field label="Descrição Curta (Editorial)" hint="Texto curto que aparece no card.">
                  <textarea value={form.short_description} onChange={e => set('short_description', e.target.value)} rows={2} className="flex w-full rounded-md border border-vf-border bg-white px-3 py-2 text-[13px] text-vf-text-1 focus:border-vf-black focus:outline-none focus:ring-1 focus:ring-vf-black resize-none" placeholder="Ex: A vista mais clássica de Nova York." />
                </Field>
              </Section>

              <Section title="Localização" icon={MapPin}>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Bairro">
                    <select value={form.neighborhood} onChange={e => set('neighborhood', e.target.value)} className="flex h-10 w-full rounded-md border border-vf-border bg-white px-3.5 py-2.5 text-[13px] text-vf-text-1 focus:border-vf-black focus:outline-none focus:ring-1 focus:ring-vf-black">
                      {NEW_YORK_NEIGHBORHOODS.map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </Field>
                  <Field label="Endereço Completo">
                    <Input value={form.address} onChange={e => set('address', e.target.value)} />
                  </Field>
                </div>
                <div className="h-48 rounded-xl overflow-hidden border border-vf-border bg-vf-muted relative">
                  <APIProvider apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
                    <Map defaultCenter={{ lat: form.location_lat ?? 40.7580, lng: form.location_lng ?? -73.9855 }} defaultZoom={13} mapId="EDITOR_MAP_VF" disableDefaultUI={true} onClick={(e: { detail?: { latLng?: { lat: number; lng: number } } }) => { set('location_lat', e.detail?.latLng?.lat); set('location_lng', e.detail?.latLng?.lng); }} style={{ cursor: 'crosshair' }}>
                      {form.location_lat != null && form.location_lng != null && (
                         <AdvancedMarker position={{ lat: form.location_lat, lng: form.location_lng }}>
                           <div className="w-4 h-4 bg-vf-lime border-2 border-black rounded-full shadow-sm" />
                         </AdvancedMarker>
                      )}
                    </Map>
                  </APIProvider>
                </div>
              </Section>
              
              <Section title="Horários e Duração" icon={Clock}>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Duração (Minutos)">
                    <Input type="number" value={form.duration_minutes} onChange={e => set('duration_minutes', Number(e.target.value))} />
                  </Field>
                  <Field label="Reserva Obrigatória?">
                    <div className="flex items-center h-10 gap-2">
                      <input type="checkbox" checked={form.reservation_required} onChange={e => set('reservation_required', e.target.checked)} className="w-5 h-5 rounded border-vf-border text-vf-black focus:ring-vf-black" />
                      <span className="text-[13px] font-semibold">Sim, requer reserva</span>
                    </div>
                  </Field>
                </div>
                {isLodging && (
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Horário Check-in">
                      <Input type="time" value={form.check_in_time || ""} onChange={e => set('check_in_time', e.target.value)} />
                    </Field>
                    <Field label="Horário Check-out">
                      <Input type="time" value={form.check_out_time || ""} onChange={e => set('check_out_time', e.target.value)} />
                    </Field>
                  </div>
                )}
              </Section>

              <Section title="Preço e Afiliados" icon={DollarSign}>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Custo Base (USD)">
                    <Input type="number" value={form.base_cost} onChange={e => set('base_cost', Number(e.target.value))} className="font-black" />
                  </Field>
                  <Field label="Link de Booking (Afiliado)">
                    <Input value={form.booking_url} onChange={e => set('booking_url', e.target.value)} placeholder="https://..." />
                  </Field>
                </div>
              </Section>

              <Section title="Mídia Visual" icon={Video}>
                <Field label="URLs de Imagem (Uma por linha)" hint="A primeira será a Capa.">
                  <textarea 
                    value={form.media_urls.join('\n')} 
                    onChange={e => set('media_urls', e.target.value.split('\n').map(u => u.trim()).filter(Boolean))}
                    rows={4} className="flex w-full rounded-md border border-vf-border bg-vf-muted px-3 py-2 text-[11px] font-mono whitespace-nowrap overflow-x-auto focus:border-vf-black focus:outline-none" 
                  />
                </Field>
                {form.media_urls.length > 0 && (
                  <div className="grid grid-cols-4 gap-3 mt-2">
                    {form.media_urls.map((url, i) => (
                      <div key={i} className="aspect-square rounded-lg overflow-hidden bg-vf-muted border border-vf-border relative">
                        {isVideoUrl(url) ? <video src={url} className="w-full h-full object-cover" muted /> : <img src={url} className="w-full h-full object-cover" />}
                        {i === 0 && <span className="absolute bottom-1 right-1 bg-vf-black/80 text-white text-[8px] font-bold px-1.5 py-0.5 rounded uppercase">Capa</span>}
                      </div>
                    ))}
                  </div>
                )}
                <Field label="Video Embed URL (Opcional)">
                   <Input value={form.video_embed_url || ""} onChange={e => set('video_embed_url', e.target.value)} placeholder="https://youtube.com/embed/..." />
                </Field>
              </Section>
              
            </div>

            {/* ── Right Column (1/3): IA Concierge, Perfil & Status ── */}
            <div className="lg:col-span-4 space-y-6">
              
              <div className="bg-white rounded-xl border border-vf-border shadow-vf-sm p-6">
                 <h3 className="text-[13px] font-black uppercase tracking-widest text-vf-black mb-4">Publicação</h3>
                 <div className="flex gap-2">
                   <button onClick={() => set('status', 'published')} className={cn("flex-1 py-2 rounded-md text-[13px] font-bold transition-all border", form.status === 'published' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-white border-vf-border text-vf-text-3')}>Publicado</button>
                   <button onClick={() => set('status', 'draft')} className={cn("flex-1 py-2 rounded-md text-[13px] font-bold transition-all border", form.status === 'draft' ? 'bg-vf-muted border-vf-border text-vf-black' : 'bg-white border-vf-border text-vf-text-3')}>Rascunho</button>
                 </div>
                 
                 <div className="mt-4 p-3 bg-vf-muted border border-vf-border rounded-lg text-xs">
                   <p className="font-bold mb-2">Completude</p>
                   <ul className="space-y-1 text-vf-text-3">
                     {!form.title && <li>❌ Nome da Experiência</li>}
                     {!form.description && <li>❌ Descrição Principal</li>}
                     {form.media_urls.length === 0 && <li>❌ Capa/Mídia</li>}
                     {(form.title && form.description && form.media_urls.length > 0) && <li className="text-emerald-600 font-bold">✨ Essenciais preenchidos!</li>}
                   </ul>
                 </div>
              </div>

              <div className="bg-white rounded-xl border border-vf-border shadow-vf-sm p-6 space-y-4">
                 <h3 className="text-[13px] font-black uppercase tracking-widest text-vf-black mb-4">Perfil do Viajante</h3>
                 <Field label="Tags">
                   <TagInput tags={form.tags} onChange={v => set('tags', v)} />
                 </Field>
                 <Field label="Nível de Exclusividade">
                   <select value={form.exclusivity_level} onChange={e => set('exclusivity_level', e.target.value)} className="w-full rounded-md border border-vf-border py-1.5 px-2 text-xs">
                     <option value="accessible">Acessível</option>
                     <option value="premium">Premium</option>
                     <option value="exclusive">Exclusivo</option>
                     <option value="invite_only">Somente Convidados</option>
                   </select>
                 </Field>
                 <Field label="Dress Code">
                   <select value={form.dress_code} onChange={e => set('dress_code', e.target.value)} className="w-full rounded-md border border-vf-border py-1.5 px-2 text-xs">
                     <option value="casual">Casual</option>
                     <option value="smart_casual">Smart Casual</option>
                     <option value="elegant">Elegante</option>
                     <option value="formal">Formal</option>
                   </select>
                 </Field>
                 <div className="grid grid-cols-2 gap-2">
                   <Field label="Avaliação (0-5)">
                     <Input type="number" step="0.1" value={form.rating || ""} onChange={e => set('rating', Number(e.target.value))} />
                   </Field>
                   <Field label="Nº de Reviews">
                     <Input type="number" value={form.reviews_count || ""} onChange={e => set('reviews_count', Number(e.target.value))} />
                   </Field>
                 </div>
                 <div className="flex items-center gap-2 mt-2">
                    <input type="checkbox" checked={form.is_must_see} onChange={e => set('is_must_see', e.target.checked)} className="w-4 h-4" />
                    <label className="text-xs font-bold text-vf-black">Imperdível (Must See)</label>
                 </div>
              </div>

              <div className="bg-indigo-50 border border-indigo-100 rounded-xl shadow-vf-sm overflow-hidden">
                <div className="p-5 border-b border-indigo-100/50">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-[13px] font-black uppercase tracking-widest text-indigo-900 flex items-center gap-1.5"><BrainCircuit className="w-4 h-4"/> IA Concierge</h3>
                  </div>
                  <p className="text-[11px] text-indigo-700/80 mb-4">A Engine decide para quem recomendar com base nestes pesos.</p>
                  <Button onClick={handleAiSync} disabled={isSyncingAI} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs h-9">
                    {isSyncingAI ? <Zap className="w-3.5 h-3.5 animate-pulse" /> : <BrainCircuit className="w-3.5 h-3.5" />}
                    Sincronizar Inteligência
                  </Button>
                </div>
                
                <div className="p-5 space-y-5 bg-white">
                  
                  <div className="space-y-3">
                    <h4 className="text-[11px] font-black uppercase tracking-widest text-vf-text-3">Afinidade Persona (0-100)</h4>
                    <RangeSlider label="📸 Visual" value={form.personaWeights.explorador_visual} onChange={v => setDeep('personaWeights', 'explorador_visual', v)} />
                    <RangeSlider label="🎩 Curador" value={form.personaWeights.curador_experiencias} onChange={v => setDeep('personaWeights', 'curador_experiencias', v)} />
                    <RangeSlider label="🎢 Aproveitador" value={form.personaWeights.aproveitador} onChange={v => setDeep('personaWeights', 'aproveitador', v)} />
                    <RangeSlider label="🧭 Descobridor" value={form.personaWeights.descobridor} onChange={v => setDeep('personaWeights', 'descobridor', v)} />
                    <RangeSlider label="☕ Slow Traveler" value={form.personaWeights.slow_traveler} onChange={v => setDeep('personaWeights', 'slow_traveler', v)} />
                  </div>
                  
                  <div className="space-y-3 pt-3 border-t border-vf-border">
                    <h4 className="text-[11px] font-black uppercase tracking-widest text-vf-text-3">Companhia</h4>
                    <RangeSlider label="🕺 Solo" value={form.companionshipCompatibility.solo} onChange={v => setDeep('companionshipCompatibility', 'solo', v)} />
                    <RangeSlider label="👩‍❤️‍👨 Casal" value={form.companionshipCompatibility.couple} onChange={v => setDeep('companionshipCompatibility', 'couple', v)} />
                    <RangeSlider label="👨‍👩‍👧 Família" value={form.companionshipCompatibility.family} onChange={v => setDeep('companionshipCompatibility', 'family', v)} />
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
