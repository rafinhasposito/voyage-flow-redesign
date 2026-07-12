import React, { useEffect, useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Plus, Search, MoreHorizontal, Edit, Copy, Trash2,
  MapPin, AlertCircle, Star, LayoutGrid, List,
  AlignJustify, X, Eye, EyeOff, SlidersHorizontal, Maximize2,
  Sparkles, Upload, ChevronRight
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { ContentNodeRow } from "@/repositories/ExperienceRepository";
import { NEW_YORK_NEIGHBORHOODS, CATEGORIES_PTBR, getCategoryLabel } from "@/config/constants";
import { cn, isVideoUrl } from "@/lib/utils";
import { APIProvider, Map, AdvancedMarker } from "@vis.gl/react-google-maps";

import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type ViewMode = 'strips' | 'cards' | 'compact';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const STATUS_STYLES: Record<string, string> = {
  published: 'vf-pill vf-pill-green',
  draft:     'vf-pill vf-pill-slate',
  archived:  'vf-pill vf-pill-rose',
};

function StarRating({ rating }: { rating: number | null }) {
  const r = rating ?? 0;
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          className={cn('w-3.5 h-3.5', i <= Math.round(r) ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200')}
        />
      ))}
      {rating != null && <span className="text-xs font-bold text-slate-500 ml-1">{r.toFixed(1)}</span>}
    </div>
  );
}

function QualityBadge({ exp, translations }: { exp: ContentNodeRow, translations: any }) {
  const missing = [
    !exp.location_lat && 'GPS',
    !translations.neighborhood && 'Bairro',
    !translations.tags?.length && 'Tags',
    !translations.duration_minutes && 'Duração',
  ].filter(Boolean);

  if (missing.length === 0) {
    return <span className="vf-pill vf-pill-green">● Pronto</span>;
  }
  return (
    <span className="vf-pill vf-pill-amber" title={`Faltando: ${missing.join(', ')}`}>
      ⚠ {missing.length} campo{missing.length > 1 ? 's' : ''}
    </span>
  );
}

// ─── Row Actions Menu ─────────────────────────────────────────────────────────
function RowMenu({ exp, onDelete, onDuplicate, onToggleStatus }: {
  exp: ContentNodeRow;
  onDelete: () => void;
  onDuplicate: () => void;
  onToggleStatus: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="w-7 h-7 rounded-full flex items-center justify-center text-slate-300 hover:text-slate-700 hover:bg-white transition-all opacity-0 group-hover:opacity-100 focus:opacity-100">
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 rounded-2xl p-1.5 shadow-lg border-0"
        style={{ background: '#fff', boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }}>
        <DropdownMenuItem asChild>
          <Link to={`/admin/experiences/${exp.id}`} className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold cursor-pointer hover:bg-[#F0F2F5]">
            <Edit className="w-3.5 h-3.5 text-slate-400" /> Editar
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onToggleStatus} className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold cursor-pointer hover:bg-[#F0F2F5]">
          {exp.status === 'published' ? <EyeOff className="w-3.5 h-3.5 text-slate-400" /> : <Eye className="w-3.5 h-3.5 text-slate-400" />}
          {exp.status === 'published' ? 'Despublicar' : 'Publicar'}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onDuplicate} className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold cursor-pointer hover:bg-[#F0F2F5]">
          <Copy className="w-3.5 h-3.5 text-slate-400" /> Duplicar
        </DropdownMenuItem>
        <DropdownMenuSeparator className="my-1 bg-slate-100" />
        <DropdownMenuItem onClick={onDelete} className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold cursor-pointer text-rose-500 hover:bg-rose-50">
          <Trash2 className="w-3.5 h-3.5" /> Excluir
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function ExperiencesList() {
  const navigate = useNavigate();
  const [experiences, setExperiences] = useState<ContentNodeRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  const [viewMode, setViewMode] = useState<ViewMode>(
    () => (localStorage.getItem('vf-catalog-view') as ViewMode) ?? 'cards'
  );

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [neighborhoodFilter, setNeighborhoodFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  // EcoHome visual filters
  const [budgetType, setBudgetType] = useState<'day' | 'stay'>('day');
  const [maxPrice, setMaxPrice] = useState<number>(1000);
  const [minRating, setMinRating] = useState<number | null>(null);
  const [mustSeeFilter, setMustSeeFilter] = useState(false);

  useEffect(() => { fetchExperiences(); }, []);

  async function fetchExperiences() {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.from('content_nodes').select('*').neq('type', 'hotel').order('title');
      if (error) throw error;
      setExperiences(data as ContentNodeRow[]);
    } catch { toast.error('Erro ao carregar catálogo.'); }
    finally { setIsLoading(false); }
  }

  const setView = (v: ViewMode) => {
    setViewMode(v);
    localStorage.setItem('vf-catalog-view', v);
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    try {
      const { error } = await supabase.from('content_nodes').delete().eq('id', itemToDelete);
      if (error) throw error;
      setExperiences(p => p.filter(e => e.id !== itemToDelete));
      toast.success('Experiência excluída com sucesso.');
    } catch { toast.error('Falha ao excluir a experiência.'); }
    finally { setItemToDelete(null); }
  };

  const handleDuplicate = async (exp: ContentNodeRow) => {
    try {
      const { id, created_at, updated_at, ...rest } = exp;
      const { data, error } = await supabase.from('content_nodes')
        .insert([{ ...rest, title: `${exp.title} (Cópia)`, status: 'draft' }])
        .select()
        .single();
      if (error) throw error;
      setExperiences(p => [data as ContentNodeRow, ...p]);
      toast.success('Experiência duplicada!');
    } catch (err: any) { toast.error('Erro ao duplicar: ' + err.message); }
  };

  const handleToggleStatus = async (exp: ContentNodeRow) => {
    const newStatus = exp.status === 'published' ? 'draft' : 'published';
    try {
      const { error } = await supabase.from('content_nodes').update({ status: newStatus }).eq('id', exp.id);
      if (error) throw error;
      setExperiences(p => p.map(e => e.id === exp.id ? { ...e, status: newStatus } : e));
      toast.success(newStatus === 'published' ? 'Publicado com sucesso!' : 'Movido para rascunhos.');
    } catch { toast.error('Falha ao atualizar status.'); }
  };



  const filtered = useMemo(() => {
    return experiences.filter(e => {
      const tr = (e.translations as any) || {};
      
      if (search && !e.title.toLowerCase().includes(search.toLowerCase())) return false;
      if (statusFilter !== 'all' && e.status !== statusFilter) return false;
      if (neighborhoodFilter !== 'all' && tr.neighborhood !== neighborhoodFilter) return false;
      if (typeFilter !== 'all' && e.type !== typeFilter) return false;
      if (mustSeeFilter && !tr.is_must_see) return false;
      if (minRating !== null && (tr.rating || 0) < minRating) return false;

      const cost = tr.base_cost || 0;
      if (cost > maxPrice) return false;

      return true;
    });
  }, [experiences, search, statusFilter, neighborhoodFilter, typeFilter, mustSeeFilter, minRating, maxPrice]);

  const handleItemClick = (id: string) => navigate(`/admin/experiences/${id}`);

  const renderStrips = () => (
    <div className="space-y-3">
      {filtered.map(exp => {
        const tr = (exp.translations as any) || {};
        return (
          <div
            key={exp.id}
            onClick={() => handleItemClick(exp.id)}
            className={cn(
              "vf-strip flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-slate-50 transition-all border border-transparent hover:border-slate-200"
            )}
          >
            <div className="w-14 h-14 rounded-[12px] bg-slate-100 overflow-hidden flex-shrink-0">
              {tr.cover_url ? (
                isVideoUrl(tr.cover_url) ? (
                  <video src={tr.cover_url} className="w-full h-full object-cover" autoPlay loop muted playsInline />
                ) : (
                  <img src={tr.cover_url} alt={exp.title} className="w-full h-full object-cover" />
                )
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-[10px] font-black text-slate-300">
                  <span>IMG</span>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                {tr.is_must_see && <span className="text-amber-400 text-xs">⭐</span>}
                <p className="font-black text-[#0F1117] text-sm truncate">{exp.title}</p>
              </div>
              <div className="flex items-center gap-3 text-[11px] font-semibold text-slate-400">
                {tr.neighborhood && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-300" />{tr.neighborhood}
                  </span>
                )}
                {exp.type && (
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                    {exp.type}
                  </span>
                )}
                <StarRating rating={tr.rating} />
              </div>
            </div>
            <div className="hidden md:flex items-center gap-6">
              <span className="font-black text-sm text-[#0F1117]">${tr.base_cost ?? 0}</span>
              <QualityBadge exp={exp} translations={tr} />
              <span className={STATUS_STYLES[exp.status || 'draft']}>{exp.status}</span>
            </div>
            <div onClick={e => e.stopPropagation()} className="flex items-center gap-1">
              <RowMenu
                exp={exp}
                onDelete={() => setItemToDelete(exp.id)}
                onDuplicate={() => handleDuplicate(exp)}
                onToggleStatus={() => handleToggleStatus(exp)}
              />
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderCards = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
      {filtered.map(exp => {
        const tr = (exp.translations as any) || {};
        return (
          <div
            key={exp.id}
            onClick={() => handleItemClick(exp.id)}
            className="group bg-white rounded-[24px] overflow-hidden border border-transparent shadow-sm cursor-pointer hover:shadow-md hover:border-slate-200 transition-all flex flex-col"
          >
            <div className="relative h-48 bg-slate-100">
              {tr.cover_url ? (
                isVideoUrl(tr.cover_url) ? (
                  <video src={tr.cover_url} className="w-full h-full object-cover" autoPlay loop muted playsInline />
                ) : (
                  <img src={tr.cover_url} alt={exp.title} className="w-full h-full object-cover" />
                )
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <MapPin className="w-8 h-8 text-slate-300" />
                </div>
              )}

              {/* Badges Ovelay */}
              <div className="absolute top-3 left-3 right-3 flex justify-between items-start">
                <div className="flex flex-col gap-1.5">
                  <div className="bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full flex items-center shadow-sm">
                    <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 mr-1" />
                    <span className="text-[11px] font-black text-slate-700">
                      {tr.rating != null ? tr.rating.toFixed(1) : "5.0"}
                    </span>
                  </div>
                  {tr.is_must_see && (
                    <div className="bg-amber-400 text-black px-2.5 py-1 rounded-full text-[10px] font-black shadow-sm uppercase tracking-wider">
                      Must See
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 flex flex-col flex-1">
              <div className="mb-3">
                <h3 className="font-black text-[15px] leading-tight text-[#0F1117] line-clamp-2">
                  {exp.title}
                </h3>
                {exp.type && (
                  <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mt-1.5">
                    {exp.type}
                  </p>
                )}
              </div>

              <div className="mt-auto flex flex-col gap-3">
                <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-semibold bg-slate-50 px-2.5 py-1.5 rounded-lg w-fit">
                  <MapPin className="w-3.5 h-3.5 text-slate-300" />
                  <span>{tr.neighborhood || 'Nova York'}</span>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Preço Base</p>
                    <p className="font-black text-base text-[#0F1117]">${tr.base_cost ?? 0}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <QualityBadge exp={exp} translations={tr} />
                    <span className={cn("text-[9px] font-bold uppercase px-2 py-1 rounded-full",
                      exp.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                    )}>{exp.status === 'published' ? 'PUB' : 'RASC'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderCompact = () => (
    <div className="bg-white rounded-[24px] border border-slate-200 overflow-hidden shadow-sm">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-50 text-[10px] font-black uppercase tracking-wider text-slate-500 border-b border-slate-200">
            <th className="px-4 py-3">Título</th>
            <th className="px-4 py-3">Tipo</th>
            <th className="px-4 py-3">Bairro</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3 text-right">Ações</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map(exp => {
            const tr = (exp.translations as any) || {};
            return (
              <tr
                key={exp.id}
                onClick={() => handleItemClick(exp.id)}
                className="group hover:bg-slate-50/50 transition-colors cursor-pointer"
              >
                <td className="px-4 py-3 border-t border-slate-100">
                  <div className="font-bold text-sm text-[#0F1117] flex items-center gap-2">
                    {tr.is_must_see && <Star className="w-3 h-3 text-amber-400 fill-amber-400" />}
                    {exp.title}
                  </div>
                </td>
                <td className="px-4 py-3 border-t border-slate-100 text-xs font-semibold text-slate-500">
                  {exp.type}
                </td>
                <td className="px-4 py-3 border-t border-slate-100 text-xs font-semibold text-slate-500">
                  {tr.neighborhood}
                </td>
                <td className="px-4 py-3 border-t border-slate-100">
                  <span className={STATUS_STYLES[exp.status || 'draft']}>{exp.status}</span>
                </td>
                <td className="px-4 py-3 border-t border-slate-100 text-right" onClick={e => e.stopPropagation()}>
                  <RowMenu
                    exp={exp}
                    onDelete={() => setItemToDelete(exp.id)}
                    onDuplicate={() => handleDuplicate(exp)}
                    onToggleStatus={() => handleToggleStatus(exp)}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="max-w-[1600px] mx-auto p-6 space-y-6 vf-fade-in">

      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-[#0F1117] tracking-tight">Catálogo</h1>
          <p className="text-xs text-slate-400 mt-0.5">Atrações, Shows e Restaurantes</p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/admin/import" className="flex items-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors shadow-sm">
            <Sparkles className="w-3.5 h-3.5" /> IA Import
          </Link>
          <Link to="/admin/experiences/new" className="vf-btn-primary text-xs px-4 py-2.5 shadow-sm">
            <Plus className="w-3.5 h-3.5" /> Nova Atração
          </Link>
        </div>
      </div>

      {/* Drafts Alert Banner */}
      {(() => {
        const draftCount = experiences.filter(e => e.status === 'draft').length;
        if (draftCount === 0) return null;
        return (
          <div className="flex items-center justify-between gap-4 px-5 py-4 rounded-[20px] border border-amber-200/80"
            style={{ background: 'linear-gradient(135deg, #FFFBEB 0%, #FEF9C3 100%)' }}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-[12px] bg-amber-100 flex items-center justify-center shrink-0">
                <Upload className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-black text-amber-900">{draftCount} rascunhos aguardando revisão</p>
                <p className="text-[11px] text-amber-700/70">Itens importados que precisam de aprovação antes de irem para o app.</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setStatusFilter('draft')}
                className="flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-bold bg-white border border-amber-300 text-amber-800 hover:bg-amber-50 transition-colors shadow-sm"
              >
                Ver Rascunhos <ChevronRight className="w-3 h-3" />
              </button>
              <button
                onClick={async () => {
                  const draftIds = experiences.filter(e => e.status === 'draft').map(e => e.id);
                  if (draftIds.length === 0) return;
                  const { error } = await supabase.from('content_nodes').update({ status: 'published' }).in('id', draftIds);
                  if (!error) {
                    setExperiences(p => p.map(e => e.status === 'draft' ? { ...e, status: 'published' } : e));
                    toast.success(`${draftIds.length} rascunhos publicados!`);
                  }
                }}
                className="px-3 py-2 rounded-full text-xs font-black bg-amber-500 text-white hover:bg-amber-600 transition-colors shadow-sm"
              >
                Publicar Todos ({draftCount})
              </button>
            </div>
          </div>
        );
      })()}


      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ── Left Sidebar (Filters & Map) ── */}
        <div className="lg:col-span-3 bg-white rounded-[24px] p-5 shadow-sm space-y-6 sticky top-6 border border-slate-100/50 hidden lg:block">
          
          {/* Map Preview */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400 block px-1">Localização</label>
            <div className="relative rounded-[20px] h-48 bg-slate-100 border border-slate-200 overflow-hidden z-0">
              <APIProvider apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
                <Map defaultCenter={{ lat: 40.7580, lng: -73.9855 }} defaultZoom={12} mapId="LIST_MAP" disableDefaultUI={true}>
                  {filtered.map(exp => exp.location_lat && exp.location_lng && (
                    <AdvancedMarker key={exp.id} position={{ lat: exp.location_lat, lng: exp.location_lng }} title={exp.title}>
                      <div className="w-3 h-3 bg-[#E2F18A] border border-black rounded-full shadow-sm" />
                    </AdvancedMarker>
                  ))}
                </Map>
              </APIProvider>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Tipo */}
          <div className="space-y-2.5">
            <label className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400 block px-1">Tipo</label>
            <div className="flex flex-wrap gap-1.5">
              <button onClick={() => setTypeFilter('all')} className={cn('px-3 py-1.5 rounded-full text-xs font-bold transition-all', typeFilter === 'all' ? 'bg-[#0F1117] text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200')}>Todos</button>
              <button onClick={() => setTypeFilter('attraction')} className={cn('px-3 py-1.5 rounded-full text-xs font-bold transition-all', typeFilter === 'attraction' ? 'bg-[#0F1117] text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200')}>Atração</button>
              <button onClick={() => setTypeFilter('restaurant')} className={cn('px-3 py-1.5 rounded-full text-xs font-bold transition-all', typeFilter === 'restaurant' ? 'bg-[#0F1117] text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200')}>Gastronomia</button>
              <button onClick={() => setTypeFilter('event')} className={cn('px-3 py-1.5 rounded-full text-xs font-bold transition-all', typeFilter === 'event' ? 'bg-[#0F1117] text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200')}>Evento</button>
            </div>
          </div>

          {/* Budget Range Slider */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-500">Custo Máximo:</span>
              <span className="text-[#0F1117] font-black">${maxPrice}</span>
            </div>
            <input
              type="range"
              min="0"
              max="500"
              step="10"
              value={maxPrice}
              onChange={(e) => setMaxPrice(parseInt(e.target.value))}
              className="w-full accent-black cursor-pointer"
            />
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold">
              <span>$0 (Grátis)</span>
              <span>$500+</span>
            </div>
          </div>

          {/* Must See Switch */}
          <div className="bg-amber-50 rounded-2xl p-4 flex items-center justify-between cursor-pointer" onClick={() => setMustSeeFilter(!mustSeeFilter)}>
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span className="text-xs font-bold text-amber-900">Apenas Must See</span>
            </div>
            <div className={cn("w-8 h-4 rounded-full transition-colors relative", mustSeeFilter ? "bg-amber-500" : "bg-slate-300")}>
              <div className={cn("absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all", mustSeeFilter ? "left-4.5" : "left-0.5")} />
            </div>
          </div>
          
          {/* Rating */}
          <div className="space-y-2.5">
            <label className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400 block px-1">Avaliação Mínima</label>
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-xs text-slate-600 font-semibold cursor-pointer">
                <input type="radio" checked={minRating === null} onChange={() => setMinRating(null)} className="accent-black" />
                Qualquer nota
              </label>
              {[4.5, 4.0, 3.5].map(r => (
                <label key={r} className="flex items-center gap-2 text-xs text-slate-600 font-semibold cursor-pointer">
                  <input type="radio" checked={minRating === r} onChange={() => setMinRating(r)} className="accent-black" />
                  <StarRating rating={r} /> +
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* ── Right Content Area ── */}
        <div className="lg:col-span-9 space-y-4">
          
          {/* Top Bar */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white rounded-[24px] p-4 shadow-sm border border-slate-100/50">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar atração..."
                className="vf-input pl-9 text-xs py-2 w-full"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="vf-input text-xs py-2">
                <option value="all">Status</option>
                <option value="published">Publicados</option>
                <option value="draft">Rascunhos</option>
                <option value="archived">Arquivados</option>
              </select>

              <select value={neighborhoodFilter} onChange={(e) => setNeighborhoodFilter(e.target.value)} className="vf-input text-xs py-2">
                <option value="all">Bairro</option>
                {NEW_YORK_NEIGHBORHOODS.map(n => <option key={n} value={n}>{n}</option>)}
              </select>

              <div className="flex items-center gap-0.5 bg-slate-100 p-1 rounded-full ml-2">
                <button onClick={() => setView('strips')} className={cn('w-7 h-7 rounded-full flex items-center justify-center transition-all', viewMode === 'strips' ? 'bg-black text-white' : 'text-slate-400 hover:text-black')} title="Lista Detalhada"><AlignJustify className="w-3.5 h-3.5" /></button>
                <button onClick={() => setView('cards')} className={cn('w-7 h-7 rounded-full flex items-center justify-center transition-all', viewMode === 'cards' ? 'bg-black text-white' : 'text-slate-400 hover:text-black')} title="Cards Grid"><LayoutGrid className="w-3.5 h-3.5" /></button>
                <button onClick={() => setView('compact')} className={cn('w-7 h-7 rounded-full flex items-center justify-center transition-all', viewMode === 'compact' ? 'bg-black text-white' : 'text-slate-400 hover:text-black')} title="Tabela Compacta"><List className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          </div>

          {/* Results Summary */}
          <div className="flex items-center justify-between px-2 text-xs font-bold text-slate-400">
            {isLoading ? <span>Carregando dados...</span> : <span>Exibindo {filtered.length} de {experiences.length} itens.</span>}
          </div>

          {/* Content Views */}
          <div className="relative">
            {isLoading ? (
              <div className="flex justify-center h-64 items-center">
                <div className="vf-spinner" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="bg-white rounded-[24px] p-12 text-center border border-slate-100 flex flex-col items-center">
                <div className="w-14 h-14 rounded-[18px] bg-indigo-50 flex items-center justify-center mb-3">
                  <SlidersHorizontal className="w-7 h-7 text-indigo-400" />
                </div>
                <p className="font-bold text-[#0F1117] text-sm">Nenhuma experiência encontrada</p>
                <p className="text-slate-400 text-xs mt-1">Tente remover alguns filtros de busca.</p>
                <button onClick={() => { setSearch(''); setStatusFilter('all'); setTypeFilter('all'); setMaxPrice(1000); setMustSeeFilter(false); setNeighborhoodFilter('all'); setMinRating(null); }} className="mt-4 text-xs font-bold text-indigo-600 hover:underline">
                  Limpar todos os filtros
                </button>
              </div>
            ) : (
              <>
                {viewMode === 'strips' && renderStrips()}
                {viewMode === 'cards' && renderCards()}
                {viewMode === 'compact' && renderCompact()}
              </>
            )}
          </div>
        </div>
      </div>

      <AlertDialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
        <AlertDialogContent className="rounded-[24px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-black">Excluir Experiência?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação é permanente. Se ela faz parte de roteiros de usuários, eles perderão o acesso a esta atração.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="rounded-full bg-rose-600 hover:bg-rose-700 text-white border-0">Excluir Atração</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
