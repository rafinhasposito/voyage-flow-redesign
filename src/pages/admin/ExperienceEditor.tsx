import React, { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowLeft, MapPin, DollarSign, Star,
  Link2, Image as ImageIcon, Check, Plus, X, BrainCircuit,
  Wand2, Zap, Heart, Video, AlertCircle, Save, Clock, Trash2, ArchiveRestore, MoreHorizontal
} from "lucide-react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { cn, isVideoUrl } from "@/lib/utils";
import { NEW_YORK_NEIGHBORHOODS } from "@/config/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { ExperienceRepository } from "@/repositories/ExperienceRepository";
import { DestinationRepository, DestinationRow } from "@/repositories/DestinationRepository";
import { validateExperienceForm, buildExperiencePayload, resolveExperienceRouteMode, mapNodeToFormState } from "@/lib/experienceUtils";
import { calculateAffinityV1 } from "@/lib/intelligence/experienceAffinityRules";
import { MediaGallery } from "@/components/admin/media/MediaGallery";
import { EditorPreviewPanel } from "@/components/admin/previews/EditorPreviewPanel";
import { parseVideoUrl } from "@/lib/videoUtils";
import { moveDraftMediaToPermanent, removeMediaSafely } from "@/lib/mediaUploadService";

export interface FormState {
  manual_override?: boolean;
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
  cover_media_url: string | null;
  cover_media_type: 'image' | 'video' | null;
  cover_media_poster_url: string | null;
  cover_image_url: string | null; // For legacy fallback
  video_embed_url: string | null;

  _original_intelligence_metadata: Record<string, unknown> | null;
  _original_media_urls: string[];
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
  media_urls: [], cover_media_url: null, cover_media_type: null, cover_media_poster_url: null, cover_image_url: null, video_embed_url: null,
  _original_intelligence_metadata: null,
  _original_media_urls: []
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
  const [draftId] = useState(() => crypto.randomUUID());

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

        setForm(prev => {
          const mapped = mapNodeToFormState(node, prev);
          mapped._original_media_urls = [...mapped.media_urls];
          return mapped;
        });
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
  
  const handleArchive = async () => {
    if (window.confirm(`Você está prestes a mover "${form.title}" para a Lixeira.\n\nEla não aparecerá mais nas listagens normais do Catálogo.\nVocê poderá restaurá-la posteriormente filtrando pela Lixeira.`)) {
      await handleSave({ archive: true });
    }
  };
  
  const handleRestore = async () => {
    await handleSave({ archive: false, restore: true });
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

  const handleSave = async ({ publish, unpublish, archive, restore, isDraftSave }: { publish?: boolean; unpublish?: boolean; archive?: boolean; restore?: boolean; isDraftSave?: boolean } = {}) => {
    const validation = validateExperienceForm(form, destinationsError);
    if (!validation.valid && !archive && !restore) {
      toast.error(validation.error);
      return;
    }

    setIsSaving(true);
    const toastId = toast.loading(archive ? 'Movendo para a lixeira...' : restore ? 'Restaurando...' : publish ? 'Publicando...' : unpublish ? 'Despublicando...' : 'Salvando alterações...');
    try {
      const row = buildExperiencePayload(form);
      
      // Handle explicit status changes without mutating unrelated saves
      if (publish) row.status = 'published';
      else if (unpublish) row.status = 'draft';
      else if (archive) row.status = 'archived';
      else if (restore) row.status = 'draft';
      // else keep row.status as is (from form state)
      
      let finalId = validExperienceId;

      if (isNew) {
        // Create the row first to get the real DB ID
        const created = await ExperienceRepository.create(row);
        finalId = created.id;
        
        // Now move the files to the permanent folder using the real ID
        const newUrls = await moveDraftMediaToPermanent(draftId, finalId, row.media_urls);
        row.media_urls = newUrls;
        
        // Update cover_media_url if it was part of the move
        const intelligence = (row.intelligence_metadata as Record<string, any>) || {};
        if (intelligence.cover_media_url) {
           const coverIndex = form.media_urls.indexOf(intelligence.cover_media_url);
           if (coverIndex !== -1 && newUrls[coverIndex]) {
              intelligence.cover_media_url = newUrls[coverIndex];
           }
        }
        if (intelligence.cover_media_poster_url) {
           const posterIndex = form.media_urls.indexOf(intelligence.cover_media_poster_url);
           if (posterIndex !== -1 && newUrls[posterIndex]) {
              intelligence.cover_media_poster_url = newUrls[posterIndex];
           }
        }
        row.intelligence_metadata = intelligence;
        
        // Second update to save the new permanent paths
        await ExperienceRepository.update(finalId, { 
          media_urls: row.media_urls,
          intelligence_metadata: row.intelligence_metadata 
        });
      } else if (validExperienceId) {
        await ExperienceRepository.update(validExperienceId, row);
      }
      
      // Cleanup orphan files safely
      const removedUrls = form._original_media_urls.filter(u => !row.media_urls.includes(u));
      if (removedUrls.length > 0) {
        try {
          await removeMediaSafely(removedUrls, finalId || '', draftId);
        } catch (e) {
          toast.warning("Mídia removida da experiência, mas há um arquivo pendente de limpeza no Storage.");
        }
      }

      toast.success(archive ? '🗑️ Movido para a lixeira!' : restore ? '✅ Restaurado!' : publish ? '✅ Publicado!' : unpublish ? '✅ Despublicado!' : '💾 Salvo!', { id: toastId });

      if (archive) {
         navigate('/admin/experiences');
         return;
      }

      if (validExperienceId) {
         setForm(prev => ({...prev, status: row.status, _original_media_urls: [...row.media_urls]}));
      } else if (finalId) {
        navigate(`/admin/experiences/${finalId}`);
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
  const effectiveCoverMediaUrl = form.cover_media_url ?? form.cover_image_url ?? null;

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
              <Button variant="ghost" size="sm" onClick={handleDiscard} className="text-red-600 hover:bg-red-50 hover:text-red-700">Cancelar cadastro</Button>
              <Button variant="outline" size="sm" onClick={() => handleSave({ isDraftSave: true })} disabled={isSaving}>Salvar como rascunho</Button>
              <Button variant="lime" size="sm" onClick={() => handleSave({ publish: true })} disabled={isSaving}><Check className="w-4 h-4 mr-1"/> Salvar e publicar</Button>
            </>
          ) : form.status === 'archived' ? (
            <>
              <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="text-gray-500">Voltar ao Catálogo</Button>
              <Button variant="lime" size="sm" onClick={handleRestore} disabled={isSaving}><ArchiveRestore className="w-4 h-4 mr-1"/> Restaurar</Button>
            </>
          ) : form.status === 'draft' ? (
            <>
              <Button variant="outline" size="sm" onClick={() => handleSave({})} disabled={isSaving}>Salvar alterações</Button>
              <Button variant="lime" size="sm" onClick={() => handleSave({ publish: true })} disabled={isSaving}><Check className="w-4 h-4 mr-1"/> Publicar</Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleArchive} className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer font-medium">
                    <Trash2 className="w-4 h-4 mr-2" /> Mover para a Lixeira
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button variant="lime" size="sm" onClick={() => handleSave({})} disabled={isSaving}>Salvar alterações</Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleUnpublish} className="cursor-pointer font-medium">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Despublicar
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleArchive} className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer font-medium">
                    <Trash2 className="w-4 h-4 mr-2" /> Mover para a Lixeira
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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

            {/* ── Left Column (2/3): Dados Principais, Mídia & IA Concierge ── */}
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
                  <Field label="Categoria Editorial" hint="Define como a experiência será organizada e apresentada ao viajante.">
                    <select value={form.category} onChange={e => set('category', e.target.value)} className="flex h-10 w-full rounded-md border border-vf-border bg-white px-3.5 py-2.5 text-[13px] text-vf-text-1 focus:border-vf-black focus:outline-none focus:ring-1 focus:ring-vf-black">
                      <optgroup label="[NOVA ESTRUTURA]">
                        <option value="Arte e Cultura">Arte e Cultura</option>
                        <option value="História">História</option>
                        <option value="Gastronomia">Gastronomia</option>
                        <option value="Natureza e Parques">Natureza e Parques</option>
                        <option value="Compras">Compras</option>
                        <option value="Vida Noturna">Vida Noturna</option>
                        <option value="Entretenimento">Entretenimento</option>
                        <option value="Família">Família</option>
                        <option value="Romance">Romance</option>
                        <option value="Aventura">Aventura</option>
                        <option value="Bem-estar">Bem-estar</option>
                        <option value="Ícones da Cidade">Ícones da Cidade</option>
                        <option value="Experiências Locais">Experiências Locais</option>
                      </optgroup>
                      <optgroup label="[CATEGORIA LEGADA — REVISAR]">
                        <option value={form.category}>{form.category}</option>
                      </optgroup>
                    </select>
                  </Field>
                  <Field label="Tipo de Experiência" hint="Define os campos e regras utilizados pelo sistema.">
                    <select value={form.type} onChange={e => set('type', e.target.value)} className="flex h-10 w-full rounded-md border border-vf-border bg-white px-3.5 py-2.5 text-[13px] text-vf-text-1 focus:border-vf-black focus:outline-none focus:ring-1 focus:ring-vf-black">
                      <option value="attraction">Atração</option>
                      <option value="restaurant">Restaurante</option>
                      <option value="hotel">Hotel</option>
                    </select>
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
                <Field label="Galeria de Imagens" hint="Arraste para reorganizar. A capa representará a experiência no aplicativo.">
                  <MediaGallery 
                    mediaUrls={form.media_urls}
                    coverImageUrl={effectiveCoverMediaUrl}
                    coverMediaType={form.cover_media_type}
                    experienceId={validExperienceId || draftId}
                    isDraft={isNew}
                    onChangeUrls={(urls) => set('media_urls', urls)}
                    onChangeCover={(url, type) => {
                      set('cover_media_url', url);
                      set('cover_media_type', type);
                      if (type === 'video') {
                         if (url) {
                            const parsed = parseVideoUrl(url);
                            set('cover_media_poster_url', parsed.thumbnailUrl || null);
                         } else {
                            set('cover_media_poster_url', null);
                         }
                      }
                    }}
                  />
                </Field>
                
                <Field label="Vídeo da Experiência (Opcional)" hint="Cole o link do YouTube ou Vimeo.">
                   <Input 
                      value={form.video_embed_url || ""} 
                      onChange={e => set('video_embed_url', e.target.value)} 
                      placeholder="https://youtube.com/watch?v=..." 
                   />
                </Field>
                {form.video_embed_url && (
                   <div className="mt-2 bg-slate-50 border border-vf-border rounded-lg p-3">
                      {parseVideoUrl(form.video_embed_url).embedUrl ? (
                         <div className="aspect-video w-full max-w-sm rounded-lg overflow-hidden bg-black shadow-sm mx-auto">
                            <iframe 
                               src={parseVideoUrl(form.video_embed_url).embedUrl!} 
                               className="w-full h-full" 
                               allowFullScreen 
                               title="Video Preview"
                            />
                         </div>
                      ) : (
                         <div className="text-red-500 text-xs font-bold text-center">
                           {parseVideoUrl(form.video_embed_url).error || "URL de vídeo inválida."}
                         </div>
                      )}
                   </div>
                )}
              </Section>

              <div className="bg-indigo-50 border border-indigo-100 rounded-xl shadow-vf-sm overflow-hidden">
                <div className="p-5 border-b border-indigo-100/50">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-[13px] font-black uppercase tracking-widest text-indigo-900 flex items-center gap-1.5"><BrainCircuit className="w-4 h-4"/> Compatibilidade de público</h3>
                  </div>
                  <p className="text-[11px] text-indigo-700/80 mb-4">Calculada por regras editoriais a partir dos dados preenchidos.</p>
                  <Button onClick={() => handleAiSync()} disabled={isSyncingAI} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs h-9">
                    {isSyncingAI ? <Zap className="w-3.5 h-3.5 animate-pulse" /> : <BrainCircuit className="w-3.5 h-3.5" />}
                    {form.personaWeights.explorador_visual === null ? "Calcular compatibilidade" : "Recalcular compatibilidade"}
                  </Button>
                </div>
                
                <div className="p-5 bg-white">
                  <div className="flex items-center justify-between mb-4">
                     <h4 className="text-[11px] font-black uppercase tracking-widest text-vf-text-3">Resultados da Análise</h4>
                     <button onClick={() => setIsManualAi(!isManualAi)} className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-2 py-1 rounded transition-colors">
                       {isManualAi ? "Ocultar Ajuste Manual" : "Ajustar Manualmente"}
                     </button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                    <div className="space-y-4">
                      <h4 className="text-[10px] font-black uppercase text-vf-text-3 mb-2">Psicografia (Personas)</h4>
                      {isManualAi ? (
                        <>
                          <OptionalRangeSlider label="Explorador Visual" value={form.personaWeights.explorador_visual} onChange={v => { setDeep('personaWeights', 'explorador_visual', v); set('manual_override', true); }} />
                          <OptionalRangeSlider label="Curador de Experiências" value={form.personaWeights.curador_experiencias} onChange={v => { setDeep('personaWeights', 'curador_experiencias', v); set('manual_override', true); }} />
                          <OptionalRangeSlider label="Descobridor de Tendências" value={form.personaWeights.descobridor} onChange={v => { setDeep('personaWeights', 'descobridor', v); set('manual_override', true); }} />
                          <OptionalRangeSlider label="Aproveitador de Oportunidades" value={form.personaWeights.aproveitador} onChange={v => { setDeep('personaWeights', 'aproveitador', v); set('manual_override', true); }} />
                          <OptionalRangeSlider label="Slow Traveler" value={form.personaWeights.slow_traveler} onChange={v => { setDeep('personaWeights', 'slow_traveler', v); set('manual_override', true); }} />
                        </>
                      ) : (
                        <div className="space-y-2">
                           <div className="flex justify-between text-[11px]"><span>Explorador Visual</span><span className="font-bold">{form.personaWeights.explorador_visual ?? '-'}%</span></div>
                           <div className="flex justify-between text-[11px]"><span>Curador</span><span className="font-bold">{form.personaWeights.curador_experiencias ?? '-'}%</span></div>
                           <div className="flex justify-between text-[11px]"><span>Descobridor</span><span className="font-bold">{form.personaWeights.descobridor ?? '-'}%</span></div>
                           <div className="flex justify-between text-[11px]"><span>Aproveitador</span><span className="font-bold">{form.personaWeights.aproveitador ?? '-'}%</span></div>
                           <div className="flex justify-between text-[11px]"><span>Slow Traveler</span><span className="font-bold">{form.personaWeights.slow_traveler ?? '-'}%</span></div>
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-4">
                      <h4 className="text-[10px] font-black uppercase text-vf-text-3 mb-2">Companhia Ideal</h4>
                      {isManualAi ? (
                        <>
                          <OptionalRangeSlider label="Solo" value={form.companionshipCompatibility.solo} onChange={v => { setDeep('companionshipCompatibility', 'solo', v); set('manual_override', true); }} />
                          <OptionalRangeSlider label="Casal" value={form.companionshipCompatibility.couple} onChange={v => { setDeep('companionshipCompatibility', 'couple', v); set('manual_override', true); }} />
                          <OptionalRangeSlider label="Família" value={form.companionshipCompatibility.family} onChange={v => { setDeep('companionshipCompatibility', 'family', v); set('manual_override', true); }} />
                          <OptionalRangeSlider label="Amigos" value={form.companionshipCompatibility.friends} onChange={v => { setDeep('companionshipCompatibility', 'friends', v); set('manual_override', true); }} />
                        </>
                      ) : (
                        <div className="space-y-2">
                           <div className="flex justify-between text-[11px]"><span>Solo</span><span className="font-bold">{form.companionshipCompatibility.solo ?? '-'}%</span></div>
                           <div className="flex justify-between text-[11px]"><span>Casal</span><span className="font-bold">{form.companionshipCompatibility.couple ?? '-'}%</span></div>
                           <div className="flex justify-between text-[11px]"><span>Família</span><span className="font-bold">{form.companionshipCompatibility.family ?? '-'}%</span></div>
                           <div className="flex justify-between text-[11px]"><span>Amigos</span><span className="font-bold">{form.companionshipCompatibility.friends ?? '-'}%</span></div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* ── Right Column (1/3): Previews & Status ── */}
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
                      <optgroup label="[NOVOS CRITÉRIOS]">
                        <option value="accessible">Acessível</option>
                        <option value="comfort">Conforto</option>
                        <option value="premium">Premium</option>
                        <option value="exclusive">Exclusivo</option>
                      </optgroup>
                      <optgroup label="[CLASSIFICAÇÃO LEGADA]">
                         <option value={form.exclusivity_level}>{form.exclusivity_level}</option>
                      </optgroup>
                    </select>
                    <p className="text-[10px] text-vf-text-3 mt-1">Por que possui este nível? Selecione os critérios para ensinar a IA.</p>
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
                  <p className="text-[11px] text-indigo-700/80 mb-4">Analisa os dados da experiência e ajuda a definir para quais perfis de viajante ela deve ser recomendada.</p>
                  
                  <div className="bg-white p-4 rounded-lg border border-indigo-100/50 shadow-sm">
                    <h4 className="text-[11px] font-black uppercase tracking-widest text-vf-text-3 mb-1">Compatibilidade de público</h4>
                    <p className="text-[10px] text-vf-text-3 mb-4">Estimativa calculada por regras editoriais com base nas informações preenchidas.</p>

                    <Button onClick={() => handleAiSync()} disabled={isSyncingAI} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs h-9 mb-4">
                      {isSyncingAI ? <Zap className="w-3.5 h-3.5 animate-pulse" /> : <BrainCircuit className="w-3.5 h-3.5" />}
                      {form.personaWeights.explorador_visual === null ? "Calcular compatibilidade" : "Recalcular compatibilidade"}
                    </Button>

                    <div className="flex items-center justify-between mb-3">
                       <span className="text-[11px] font-bold text-indigo-900">
                          {form.personaWeights.explorador_visual === null 
                            ? "Compatibilidade ainda não calculada" 
                            : "Compatibilidade calculada"}
                       </span>
                       <button onClick={() => setIsManualAi(!isManualAi)} className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-2 py-1 rounded transition-colors">
                         {isManualAi ? "Ocultar Ajuste" : "Ajuste Manual"}
                       </button>
                    </div>
                    
                    <p className="text-[10px] text-vf-text-3 mb-4">
                      {form.personaWeights.explorador_visual === null 
                        ? "Preencha categoria, tags, nível de exclusividade, preço e demais informações para gerar uma estimativa mais precisa."
                        : "Último cálculo realizado com base nos dados atuais da experiência."}
                    </p>

                    {isManualAi && (
                      <div className="mb-6 p-4 rounded-xl border border-dashed border-indigo-200 bg-indigo-50/50 space-y-4">
                        <p className="text-[10px] text-indigo-600 font-bold mb-2">MODO MANUAL ATIVADO — Valores alterados manualmente terão precedência sobre a Engine.</p>
                        <OptionalRangeSlider label="Visual" value={form.personaWeights.explorador_visual} onChange={v => { setDeep('personaWeights', 'explorador_visual', v); set('manual_override', true); }} />
                        <OptionalRangeSlider label="Curador" value={form.personaWeights.curador_experiencias} onChange={v => { setDeep('personaWeights', 'curador_experiencias', v); set('manual_override', true); }} />
                        <OptionalRangeSlider label="Aproveitador" value={form.personaWeights.aproveitador} onChange={v => { setDeep('personaWeights', 'aproveitador', v); set('manual_override', true); }} />
                        <OptionalRangeSlider label="Descobridor" value={form.personaWeights.descobridor} onChange={v => { setDeep('personaWeights', 'descobridor', v); set('manual_override', true); }} />
                        <OptionalRangeSlider label="Slow Traveler" value={form.personaWeights.slow_traveler} onChange={v => { setDeep('personaWeights', 'slow_traveler', v); set('manual_override', true); }} />
                        <div className="pt-2 border-t border-indigo-100 space-y-4">
                          <OptionalRangeSlider label="Solo" value={form.companionshipCompatibility.solo} onChange={v => { setDeep('companionshipCompatibility', 'solo', v); set('manual_override', true); }} />
                          <OptionalRangeSlider label="Casal" value={form.companionshipCompatibility.couple} onChange={v => { setDeep('companionshipCompatibility', 'couple', v); set('manual_override', true); }} />
                          <OptionalRangeSlider label="Família" value={form.companionshipCompatibility.family} onChange={v => { setDeep('companionshipCompatibility', 'family', v); set('manual_override', true); }} />
                          <OptionalRangeSlider label="Amigos" value={form.companionshipCompatibility.friends} onChange={v => { setDeep('companionshipCompatibility', 'friends', v); set('manual_override', true); }} />
                        </div>
                      </div>
                    )}

                    <div className="space-y-4">
                       <h5 className="text-[10px] font-black uppercase text-vf-text-3">1. Afinidade com personas</h5>
                       <IntelligenceBar label="Visual" value={form.personaWeights.explorador_visual} />
                       <IntelligenceBar label="Curador" value={form.personaWeights.curador_experiencias} />
                       <IntelligenceBar label="Aproveitador" value={form.personaWeights.aproveitador} />
                       <IntelligenceBar label="Descobridor" value={form.personaWeights.descobridor} />
                       <IntelligenceBar label="Slow Traveler" value={form.personaWeights.slow_traveler} />
                       
                       <h5 className="text-[10px] font-black uppercase text-vf-text-3 pt-2 mt-4 border-t border-vf-border">2. Adequação por companhia</h5>
                       <IntelligenceBar label="Solo" value={form.companionshipCompatibility.solo} />
                       <IntelligenceBar label="Casal" value={form.companionshipCompatibility.couple} />
                       <IntelligenceBar label="Família" value={form.companionshipCompatibility.family} />
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
