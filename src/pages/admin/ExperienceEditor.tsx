import React, { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowLeft, MapPin, DollarSign, Star,
  Link2, Image as ImageIcon, Check, Plus, X, BrainCircuit,
  Wand2, Zap, Heart, Video, AlertCircle, Save, Clock
} from "lucide-react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { cn, isVideoUrl } from "@/lib/utils";
import { NEW_YORK_NEIGHBORHOODS } from "@/config/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { ExperienceRepository } from "@/repositories/ExperienceRepository";
import { DestinationRepository, DestinationRow } from "@/repositories/DestinationRepository";
import { validateExperienceForm, buildExperiencePayload, resolveExperienceRouteMode, mapNodeToFormState } from "@/lib/experienceUtils";
import { calculateAffinityV1 } from "@/lib/intelligence/experienceAffinityRules";

export interface FormState {
  title: string;
  description: string;
  short_description: string;
  category: string;
  type: string;
  status: string;
  destination_id: string;

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
  title: "", description: "", short_description: "", category: "Atração", type: "attraction", status: "draft", destination_id: "",
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


function OptionalRangeSlider({ label, value, onChange }: { label: string; value: number | null; onChange: (v: number) => void }) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState<number | ''>('');

  if (value === null && !isEditing) {
    return (
      <div className="space-y-1.5 p-2 bg-indigo-50/30 rounded-lg border border-dashed border-indigo-100">
        <div className="flex justify-between items-center text-[11px] font-bold">
          <span className="text-vf-text-2">{label}</span>
          <span className="text-gray-400">Não calculado</span>
        </div>
        <button onClick={() => setIsEditing(true)} className="text-[10px] text-indigo-600 font-bold hover:underline">
          + Definir valor
        </button>
      </div>
    );
  }

  if (value === null && isEditing) {
    return (
      <div className="space-y-1.5 p-2 bg-indigo-50 rounded-lg border border-indigo-200">
        <div className="flex justify-between items-center text-[11px] font-bold">
          <span className="text-vf-text-2">{label}</span>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <input 
            type="number" min={0} max={100} 
            value={tempValue} 
            onChange={e => setTempValue(e.target.value === '' ? '' : parseInt(e.target.value))}
            className="w-16 h-7 text-xs border rounded px-1 outline-none focus:ring-1 focus:ring-indigo-500" 
            placeholder="0-100" 
          />
          <button onClick={() => {
            if (tempValue !== '' && tempValue >= 0 && tempValue <= 100) {
               onChange(tempValue as number);
               setIsEditing(false);
            }
          }} className="text-[10px] bg-indigo-600 text-white px-2 py-1 rounded">OK</button>
          <button onClick={() => setIsEditing(false)} className="text-[10px] text-gray-500">Cancelar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-[11px] font-bold text-vf-text-2">
        <span>{label}</span>
        <span className="text-indigo-700">{value}%</span>
      </div>
      <input type="range" min={0} max={100} value={value} onChange={e => onChange(parseInt(e.target.value))} className="w-full accent-indigo-600 h-1 bg-vf-muted rounded-lg appearance-none cursor-pointer" />
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


function EditorMap({ lat, lng }: { lat: number | null, lng: number | null }) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const marker = useRef<maplibregl.Marker | null>(null);

  useEffect(() => {
    if (!mapContainer.current || lat === null || lng === null) return;

    if (!map.current) {
      map.current = new maplibregl.Map({
        container: mapContainer.current,
        style: 'https://tiles.openfreemap.org/styles/liberty',
        center: [lng, lat],
        zoom: 15,
        attributionControl: true
      });
      map.current.addControl(new maplibregl.NavigationControl(), 'bottom-right');
      
      const el = document.createElement('div');
      el.className = "w-4 h-4 bg-[#D7F24B] border-2 border-[#171717] rounded-full shadow-sm";
      marker.current = new maplibregl.Marker(el).setLngLat([lng, lat]).addTo(map.current);
    } else {
      map.current.flyTo({ center: [lng, lat] });
      if (marker.current) {
        marker.current.setLngLat([lng, lat]);
      }
    }
  }, [lat, lng]);

  useEffect(() => {
    return () => {
      if (marker.current) {
        marker.current.remove();
        marker.current = null;
      }
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  if (lat === null || lng === null) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl">
        <MapPin className="w-8 h-8 text-gray-300 mb-2" />
        <p className="text-xs font-bold text-gray-400">Informe latitude e longitude para visualizar o local no mapa.</p>
      </div>
    );
  }

  return <div ref={mapContainer} className="w-full h-full rounded-xl overflow-hidden bg-[#E8EAE6]" />;
}



function IntelligenceBar({ label, value }: { label: string; value: number | null }) {
  if (value === null) {
    return (
      <div className="space-y-1.5">
        <div className="flex justify-between items-center text-[11px] font-bold">
          <span className="text-vf-text-2">{label}</span>
          <span className="text-gray-400">Não calculado</span>
        </div>
        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden"></div>
      </div>
    );
  }
  
  let level = "Baixa afinidade";
  let color = "bg-gray-400";
  if (value >= 80) { level = "Alta afinidade"; color = "bg-emerald-500"; }
  else if (value >= 60) { level = "Boa afinidade"; color = "bg-[#D7F24B]"; }
  else if (value >= 40) { level = "Afinidade moderada"; color = "bg-amber-400"; }
  
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center text-[11px] font-bold">
        <span className="text-vf-black">{label}</span>
        <span className="text-vf-text-2">{value}% — {level}</span>
      </div>
      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

export default function ExperienceEditor() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const routeResolution = resolveExperienceRouteMode(id);
  const routeMode = routeResolution.mode;
  const validExperienceId = routeResolution.id;
  const isNew = routeMode === 'create';

  const [form, setForm] = useState<FormState>({
    ...defaultForm,
    type: searchParams.get('type') || 'attraction',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncingAI, setIsSyncingAI] = useState(false);
  const [enrichUrl, setEnrichUrl] = useState('');
  const [isEnriching, setIsEnriching] = useState(false);
  const [isManualAi, setIsManualAi] = useState(false);
  const [destinations, setDestinations] = useState<DestinationRow[]>([]);
  const [destinationsError, setDestinationsError] = useState<string | null>(null);

  const set = useCallback((field: keyof FormState, value: unknown) => { setForm(prev => ({ ...prev, [field]: value })); }, []);
  const setDeep = useCallback((parent: keyof FormState, field: string, value: unknown) => { setForm(prev => ({ ...prev, [parent]: { ...(prev[parent] as Record<string, unknown>), [field]: value } })); }, []);

  useEffect(() => {
    async function init() {
      try {
        const dests = await DestinationRepository.getAll();
        dests.sort((a, b) => {
          if (a.is_active && !b.is_active) return -1;
          if (!a.is_active && b.is_active) return 1;
          return (a.name || "").localeCompare(b.name || "");
        });
        setDestinations(dests);
      } catch (e: unknown) {
        setDestinationsError("Erro ao carregar lista de destinos.");
      }
    }
    init();
  }, []);

  useEffect(() => {
    // Only scroll if we haven't loaded yet
    if (!form.title && !isSyncingAI) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [form.title, isSyncingAI]);

  useEffect(() => {
    const loadData = async (experienceId: string) => {
      try {
        const { data: node, error } = await supabase.from('experiences').select('*').eq('id', experienceId).single();
        if (error || !node) throw new Error("Experiência não encontrada");

        setForm(prev => mapNodeToFormState(node, prev));
      } catch (err: unknown) {
        toast.error((err as Error).message);
        navigate("/admin/experiences");
      } finally {
        setIsLoading(false);
      }
    };

    if (validExperienceId) {
      loadData(validExperienceId);
    } else {
      setIsLoading(false);
    }
  }, [validExperienceId, navigate]);

  const handleSaveAsDraft = async () => {
    await handleSave({ publish: false, unpublish: false });
  };

  const handlePublish = async () => {
    await handleSave({ publish: true, unpublish: false });
  };

  const handleUnpublish = async () => {
    if (window.confirm("Tem certeza que deseja despublicar esta experiência? Ela não será mais visível no aplicativo principal.")) {
      await handleSave({ publish: false, unpublish: true });
    }
  };

  const handleDiscard = () => {
    if (form.title || form.booking_url) {
      if (!window.confirm("Deseja realmente descartar esta importação? Os dados não salvos serão perdidos.")) {
        return;
      }
    }
    // Hard reset
    setForm({ ...defaultForm, type: searchParams.get('type') || 'attraction' });
    setEnrichUrl('');
    setDestinationsError(null);
    setIsManualAi(false);
    navigate('/admin/experiences');
  };

  const handleSave = async ({ publish, unpublish }: { publish: boolean; unpublish: boolean }) => {
    const validation = validateExperienceForm(form, destinationsError);
    if (!validation.valid) {
      toast.error(validation.error);
      return;
    }

    setIsSaving(true);
    const toastId = toast.loading(publish ? 'Publicando...' : unpublish ? 'Despublicando...' : 'Salvando rascunho...');
    try {
      const row = buildExperiencePayload(form);
      if (publish) row.status = 'published';
      else if (unpublish) row.status = 'draft';

      if (isNew) {
        await ExperienceRepository.create(row);
      } else if (validExperienceId) {
        await ExperienceRepository.update(validExperienceId, row);
      }

      toast.success(publish ? '✅ Publicado!' : unpublish ? '✅ Despublicado!' : '💾 Salvo!', { id: toastId });

      if (validExperienceId) {
        // Just reload UI locally to show success without refetching from db in this basic flow
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
      handleAiSync({ ...form, ...exp, booking_url: enrichUrl.trim() });
    } catch (e: unknown) { toast.error('Erro: ' + (e as Error).message, { id: toastId }); }
    finally { setIsEnriching(false); }
  };

  
  
  const handleAiSync = async (prefilledForm?: any) => {
    const dataToUse = prefilledForm || form;
    if (!dataToUse.title?.trim()) { toast.error('Título obrigatório para IA.'); return; }
    setIsSyncingAI(true);
    const toastId = toast.loading('Analisando afinidade (Motor de Regras V1)...');
    
    await new Promise(r => setTimeout(r, 600));

    try {
      const result = calculateAffinityV1(dataToUse);

      setForm(p => ({
        ...p,
        personaWeights: { 
          explorador_visual: result.personaWeights.explorador_visual.score,
          curador_experiencias: result.personaWeights.curador_experiencias.score,
          descobridor: result.personaWeights.descobridor.score,
          aproveitador: result.personaWeights.aproveitador.score,
          slow_traveler: result.personaWeights.slow_traveler.score
        },
        companionshipCompatibility: { 
          solo: result.companionshipCompatibility.solo.score,
          couple: result.companionshipCompatibility.couple.score,
          family: result.companionshipCompatibility.family.score,
          friends: result.companionshipCompatibility.friends.score
        },
        intelligence_metadata_source: result.metadata.source,
        intelligence_metadata_calculatedAt: result.metadata.calculatedAt,
        manualOverride: false
      }));
      toast.success('✅ Afinidade calculada!', { id: toastId });
    } catch (e: any) { 
      toast.error('Erro: ' + e.message, { id: toastId }); 
    } finally { 
      setIsSyncingAI(false); 
    }
  };



  const isLodging = ['hotel', 'hostel', 'accommodation'].includes(form.type.toLowerCase());

  if (routeMode === 'invalid') {
    return (
      <div className="p-8 max-w-2xl mx-auto mt-20 bg-white rounded-2xl shadow-sm border border-vf-border text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-vf-text-3 mx-auto mb-2" />
        <h2 className="text-xl font-bold text-vf-black">Experiência não identificada</h2>
        <p className="text-vf-text-2">Não foi possível identificar esta experiência. Volte ao catálogo e tente novamente.</p>
        <button onClick={() => navigate('/admin/experiences')} className="mt-4 px-6 py-2 bg-vf-black text-white rounded-full text-sm font-bold">
          Voltar ao Catálogo
        </button>
      </div>
    );
  }

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
        
        <div className="flex items-center gap-2">
          {isNew ? (
            <>
              <Button variant="ghost" size="sm" onClick={handleDiscard} className="text-red-600 hover:bg-red-50 hover:text-red-700">Descartar importação</Button>
              <Button variant="outline" size="sm" onClick={handleSaveAsDraft} disabled={isSaving}>Salvar Rascunho</Button>
              <Button variant="lime" size="sm" onClick={handlePublish} disabled={isSaving}><Check className="w-4 h-4 mr-1"/> Publicar</Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="text-gray-500">Cancelar edição</Button>
              <Button variant="outline" size="sm" onClick={handleSaveAsDraft} disabled={isSaving}>Salvar Rascunho</Button>
              {form.status === 'published' ? (
                <Button variant="secondary" size="sm" onClick={handleUnpublish} disabled={isSaving}>Despublicar</Button>
              ) : (
                <Button variant="lime" size="sm" onClick={handlePublish} disabled={isSaving}><Check className="w-4 h-4 mr-1"/> Publicar</Button>
              )}
            </>
          )}
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
                <Field label="Destino *">
                  {destinationsError ? (
                    <div className="text-sm font-bold text-red-500 bg-red-50 p-2 rounded-md">{destinationsError}</div>
                  ) : (
                    <select value={form.destination_id} onChange={e => set('destination_id', e.target.value)} className="flex h-10 w-full rounded-md border border-vf-border bg-white px-3.5 py-2.5 text-[13px] text-vf-text-1 focus:border-vf-black focus:outline-none focus:ring-1 focus:ring-vf-black">
                      <option value="" disabled>Selecione um destino...</option>
                      {destinations.map(d => (
                        <option key={d.id} value={d.id}>
                          {d.name} {!d.is_active && "(Inativo)"}
                        </option>
                      ))}
                    </select>
                  )}
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
                
                <div className="h-48 rounded-xl relative">
                   <EditorMap lat={form.location_lat} lng={form.location_lng} />
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
                     <Input type="number" step="0.1" value={form.rating ?? ""} onChange={e => set('rating', Number(e.target.value))} />
                   </Field>
                   <Field label="Nº de Reviews">
                     <Input type="number" value={form.reviews_count ?? ""} onChange={e => set('reviews_count', Number(e.target.value))} />
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
                    {form.personaWeights.explorador_visual === null ? "Calcular inteligência" : "Recalcular inteligência"}
                  </Button>
                </div>

                
                <div className="p-5 bg-white">
                  <div className="flex items-center justify-between mb-4">
                     <h4 className="text-[11px] font-black uppercase tracking-widest text-vf-text-3">Resultados da Análise</h4>
                     <button onClick={() => setIsManualAi(!isManualAi)} className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-2 py-1 rounded transition-colors">
                       {isManualAi ? "Ocultar Ajuste Manual" : "Ajustar Manualmente"}
                     </button>
                  </div>
                  
                  {isManualAi && (
                    <div className="mb-6 p-4 rounded-xl border border-dashed border-indigo-200 bg-indigo-50/50 space-y-4">
                      <p className="text-[10px] text-indigo-600 font-bold mb-2">MODO MANUAL ATIVADO — Valores alterados manualmente terão precedência sobre a Engine.</p>
                      <OptionalRangeSlider label="📸 Visual" value={form.personaWeights.explorador_visual} onChange={v => { setDeep('personaWeights', 'explorador_visual', v); set('manualOverride', true); }} />
                      <OptionalRangeSlider label="🎩 Curador" value={form.personaWeights.curador_experiencias} onChange={v => { setDeep('personaWeights', 'curador_experiencias', v); set('manualOverride', true); }} />
                      <OptionalRangeSlider label="🎢 Aproveitador" value={form.personaWeights.aproveitador} onChange={v => { setDeep('personaWeights', 'aproveitador', v); set('manualOverride', true); }} />
                      <OptionalRangeSlider label="🧭 Descobridor" value={form.personaWeights.descobridor} onChange={v => { setDeep('personaWeights', 'descobridor', v); set('manualOverride', true); }} />
                      <OptionalRangeSlider label="☕ Slow Traveler" value={form.personaWeights.slow_traveler} onChange={v => { setDeep('personaWeights', 'slow_traveler', v); set('manualOverride', true); }} />
                      <div className="pt-2 border-t border-indigo-100 space-y-4">
                        <OptionalRangeSlider label="🕺 Solo" value={form.companionshipCompatibility.solo} onChange={v => { setDeep('companionshipCompatibility', 'solo', v); set('manualOverride', true); }} />
                        <OptionalRangeSlider label="👩‍❤️‍👨 Casal" value={form.companionshipCompatibility.couple} onChange={v => { setDeep('companionshipCompatibility', 'couple', v); set('manualOverride', true); }} />
                        <OptionalRangeSlider label="👨‍👩‍👧 Família" value={form.companionshipCompatibility.family} onChange={v => { setDeep('companionshipCompatibility', 'family', v); set('manualOverride', true); }} />
                        <OptionalRangeSlider label="🧑‍🤝‍🧑 Amigos" value={form.companionshipCompatibility.friends} onChange={v => { setDeep('companionshipCompatibility', 'friends', v); set('manualOverride', true); }} />
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                     <IntelligenceBar label="📸 Explorador Visual" value={form.personaWeights.explorador_visual} />
                     <IntelligenceBar label="🎩 Curador" value={form.personaWeights.curador_experiencias} />
                     <IntelligenceBar label="🎢 Aproveitador" value={form.personaWeights.aproveitador} />
                     <IntelligenceBar label="🧭 Descobridor" value={form.personaWeights.descobridor} />
                     <IntelligenceBar label="☕ Slow Traveler" value={form.personaWeights.slow_traveler} />
                     
                     <div className="pt-4 mt-4 border-t border-vf-border space-y-4">
                       <IntelligenceBar label="🕺 Solo" value={form.companionshipCompatibility.solo} />
                       <IntelligenceBar label="👩‍❤️‍👨 Casal" value={form.companionshipCompatibility.couple} />
                       <IntelligenceBar label="👨‍👩‍👧 Família" value={form.companionshipCompatibility.family} />
                       <IntelligenceBar label="🧑‍🤝‍🧑 Amigos" value={form.companionshipCompatibility.friends} />
                     </div>
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

