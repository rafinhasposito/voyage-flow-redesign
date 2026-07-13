import React, { useEffect, useState, useMemo } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import {
  Plus, Search, MoreHorizontal, Edit, Copy, Trash2,
  MapPin, AlertCircle, Star, X, Eye, EyeOff, SlidersHorizontal,
  Sparkles, Upload, ChevronRight, Image as ImageIcon
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Database } from "@/types/supabase.types";
type ExperienceRow = Database["public"]["Tables"]["experiences"]["Row"];
const getAI = (e: ExperienceRow) => { try { return JSON.parse(e.short_description || '{}'); } catch { return {}; } };
import { NEW_YORK_NEIGHBORHOODS } from "@/config/constants";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// ─── Helpers ─────────────────────────────────────────────────────────────────
const STATUS_STYLES: Record<string, string> = {
  published: 'bg-emerald-50 text-emerald-700',
  draft:     'bg-vf-muted text-vf-text-2',
  archived:  'bg-rose-50 text-rose-700',
};

function StarRating({ rating }: { rating: number | null }) {
  const r = rating ?? 0;
  return (
    <div className="flex items-center gap-0.5">
      <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
      <span className="text-[11px] font-bold text-vf-text-2 ml-0.5">{r.toFixed(1)}</span>
    </div>
  );
}

function QualityBadge({ exp }: { exp: ExperienceRow }) {
  const translations = getAI(exp);
  const missing = [
    !exp.location_lat && 'GPS',
    !exp.neighborhood && 'Bairro',
    !translations.tags?.length && 'Tags',
    !exp.duration_minutes && 'Duração',
  ].filter(Boolean);

  if (missing.length === 0) {
    return <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500"/> 100% Completo</span>;
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md" title={`Faltando: ${missing.join(', ')}`}>
      <div className="w-1.5 h-1.5 rounded-full bg-amber-500"/> Falta {missing.length} campo{missing.length > 1 ? 's' : ''}
    </span>
  );
}

// ─── Row Actions Menu ─────────────────────────────────────────────────────────
function RowMenu({ exp, onDelete, onDuplicate, onToggleStatus }: {
  exp: ExperienceRow;
  onDelete: () => void;
  onDuplicate: () => void;
  onToggleStatus: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="w-8 h-8 rounded-md flex items-center justify-center text-vf-text-3 hover:text-vf-black hover:bg-vf-muted transition-all">
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 rounded-xl p-1.5 shadow-vf-md border border-vf-border bg-white">
        <DropdownMenuItem asChild>
          <Link to={`/admin/experiences/${exp.id}`} className="flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] font-semibold cursor-pointer hover:bg-vf-muted focus:bg-vf-muted">
            <Edit className="w-3.5 h-3.5 text-vf-text-3" /> Editar
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onToggleStatus} className="flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] font-semibold cursor-pointer hover:bg-vf-muted focus:bg-vf-muted">
          {exp.status === 'published' ? <EyeOff className="w-3.5 h-3.5 text-vf-text-3" /> : <Eye className="w-3.5 h-3.5 text-vf-text-3" />}
          {exp.status === 'published' ? 'Despublicar' : 'Publicar'}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onDuplicate} className="flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] font-semibold cursor-pointer hover:bg-vf-muted focus:bg-vf-muted">
          <Copy className="w-3.5 h-3.5 text-vf-text-3" /> Duplicar
        </DropdownMenuItem>
        <DropdownMenuSeparator className="my-1 bg-vf-border" />
        <DropdownMenuItem onClick={onDelete} className="flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] font-semibold cursor-pointer text-vf-danger hover:bg-vf-danger/10 focus:bg-vf-danger/10">
          <Trash2 className="w-3.5 h-3.5" /> Excluir
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function ExperiencesList() {
  const navigate = useNavigate();
  const [experiences, setExperiences] = useState<ExperienceRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  const [searchParams, setSearchParams] = useSearchParams();

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [neighborhoodFilter, setNeighborhoodFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  // EcoHome visual filters
  const [maxPrice, setMaxPrice] = useState<number>(1000);
  const [minRating, setMinRating] = useState<number | null>(null);
  const [mustSeeFilter, setMustSeeFilter] = useState(false);

  // Normalização de tipo para evitar divergências de capitalização
  const normalizeType = (val: string | null): string => {
    if (!val) return 'all';
    const lower = val.toLowerCase();
    if (lower === 'hotel') return 'Hotel';
    if (lower === 'restaurant') return 'restaurant';
    if (lower === 'event') return 'event';
    if (lower === 'attraction') return 'attraction';
    return val;
  };

  // Atualiza o filtro de tipo sempre que o parâmetro 'type' na URL mudar
  useEffect(() => {
    const urlType = searchParams.get('type');
    setTypeFilter(normalizeType(urlType));
  }, [searchParams]);

  // Atualiza a URL quando o usuário altera o select de tipo manualmente
  const handleTypeFilterChange = (newVal: string) => {
    setTypeFilter(newVal);
    const nextParams = new URLSearchParams(searchParams);
    if (newVal === 'all') {
      nextParams.delete('type');
    } else {
      nextParams.set('type', newVal);
    }
    setSearchParams(nextParams);
  };

  useEffect(() => { fetchExperiences(); }, []);

  async function fetchExperiences() {
    setIsLoading(true);
    try {
      // MASTER PLAN: The catalog is the single source of truth for ALL experiences.
      const { data, error } = await supabase.from('experiences').select('*').order('title');
      if (error) throw error;
      setExperiences(data as ExperienceRow[]);
    } catch { toast.error('Erro ao carregar catálogo.'); }
    finally { setIsLoading(false); }
  }

  const handleDelete = async () => {
    if (!itemToDelete) return;
    try {
      const { error } = await supabase.from('experiences').delete().eq('id', itemToDelete);
      if (error) throw error;
      setExperiences(p => p.filter(e => e.id !== itemToDelete));
      toast.success('Experiência excluída com sucesso.');
    } catch { toast.error('Falha ao excluir a experiência.'); }
    finally { setItemToDelete(null); }
  };

  const handleDuplicate = async (exp: ExperienceRow) => {
    try {
      const { id, created_at, updated_at, ...rest } = exp;
      const { data, error } = await supabase.from('experiences')
        .insert([{ ...rest, title: `${exp.title} (Cópia)`, status: 'draft' }])
        .select()
        .single();
      if (error) throw error;
      setExperiences(p => [data as ExperienceRow, ...p]);
      toast.success('Experiência duplicada!');
    } catch (err: any) { toast.error('Erro ao duplicar: ' + err.message); }
  };

  const handleToggleStatus = async (exp: ExperienceRow) => {
    const newStatus = exp.status === 'published' ? 'draft' : 'published';
    try {
      const { error } = await supabase.from('experiences').update({ status: newStatus }).eq('id', exp.id);
      if (error) throw error;
      setExperiences(p => p.map(e => e.id === exp.id ? { ...e, status: newStatus } : e));
      toast.success(newStatus === 'published' ? 'Publicado com sucesso!' : 'Movido para rascunhos.');
    } catch { toast.error('Falha ao atualizar status.'); }
  };

  const handleBulkPublish = async () => {
    const ids = Array.from(selectedIds);
    const { error } = await supabase.from('experiences').update({ status: 'published' }).in('id', ids);
    if (!error) {
      setExperiences(p => p.map(e => selectedIds.has(e.id) ? { ...e, status: 'published' } : e));
      setSelectedIds(new Set());
      toast.success(`${ids.length} itens publicados!`);
    }
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedIds);
    const { error } = await supabase.from('experiences').delete().in('id', ids);
    if (!error) {
      setExperiences(p => p.filter(e => !selectedIds.has(e.id)));
      setSelectedIds(new Set());
      toast.success(`${ids.length} itens excluídos!`);
    }
  };

  const filtered = useMemo(() => {
    return experiences.filter(e => {
      const ai = getAI(e);
      
      if (search && !e.title.toLowerCase().includes(search.toLowerCase())) return false;
      if (statusFilter !== 'all' && e.status !== statusFilter) return false;
      if (neighborhoodFilter !== 'all' && e.neighborhood !== neighborhoodFilter) return false;
      if (typeFilter !== 'all' && e.category !== typeFilter) return false;
      if (mustSeeFilter && !ai.is_must_see) return false;
      if (minRating !== null && (ai.rating || 0) < minRating) return false;

      const cost = e.base_cost || 0;
      if (cost > maxPrice) return false;

      return true;
    });
  }, [experiences, search, statusFilter, neighborhoodFilter, typeFilter, mustSeeFilter, minRating, maxPrice]);

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length && filtered.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map(e => e.id)));
    }
  };

  const handleItemClick = (id: string) => navigate(`/admin/experiences/${id}`);

  const handleCheckboxToggle = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const n = new Set(selectedIds);
    if (n.has(id)) { n.delete(id); } else { n.add(id); }
    setSelectedIds(n);
  };

  return (
    <div className="flex flex-col h-full bg-vf-bg p-6 overflow-hidden">
      
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap shrink-0 mb-6">
        <div>
          <h1 className="text-2xl font-black text-vf-black tracking-tight">Catálogo Mestre</h1>
          <p className="text-[13px] text-vf-text-3 mt-0.5">Todas as atrações, restaurantes e hotéis centralizados.</p>
        </div>
        <div className="flex items-center gap-3">
          {selectedIds.size > 0 && (
            <div className="bg-vf-black text-white px-4 py-2 rounded-md flex items-center gap-3 text-[13px] font-bold shadow-vf-sm">
              <span>{selectedIds.size} selecionados</span>
              <div className="w-px h-4 bg-white/20" />
              <button onClick={handleBulkPublish} className="text-vf-lime hover:underline">Publicar</button>
              <button onClick={handleBulkDelete} className="text-vf-danger hover:underline">Excluir</button>
              <button onClick={() => setSelectedIds(new Set())} className="text-white/40 hover:text-white">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          <Button variant="outline" size="sm" asChild>
            <Link to="/admin/import" className="gap-1.5 text-indigo-600 border-indigo-200 bg-indigo-50 hover:bg-indigo-100">
              <Sparkles className="w-3.5 h-3.5" /> Importação IA
            </Link>
          </Button>
          <Button variant="lime" size="sm" asChild>
            <Link to="/admin/experiences/new">
              <Plus className="w-4 h-4" /> Novo Item
            </Link>
          </Button>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="flex gap-6 h-full min-h-0">
        
        {/* ── Left Sidebar (Filters) ── */}
        <div className="w-72 shrink-0 bg-white rounded-xl border border-vf-border shadow-vf-sm p-5 space-y-6 overflow-y-auto hidden lg:block">
          
          <div className="space-y-3">
            <h3 className="text-[11px] font-bold uppercase text-vf-text-3 tracking-widest">Filtros Rápidos</h3>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-vf-text-3" />
              <Input 
                value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nome..."
                className="pl-9"
              />
            </div>

            <div className="space-y-1.5">
              <select value={typeFilter} onChange={(e) => handleTypeFilterChange(e.target.value)} className="flex h-10 w-full rounded-md border border-vf-border bg-white px-3.5 py-2.5 text-[13px] text-vf-text-1 focus:border-vf-black focus:outline-none focus:ring-1 focus:ring-vf-black">
                <option value="all">Todas as Categorias</option>
                <option value="attraction">Atrações</option>
                <option value="restaurant">Restaurantes</option>
                <option value="Hotel">Hotéis</option>
                <option value="event">Eventos</option>
              </select>

              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="flex h-10 w-full rounded-md border border-vf-border bg-white px-3.5 py-2.5 text-[13px] text-vf-text-1 focus:border-vf-black focus:outline-none focus:ring-1 focus:ring-vf-black">
                <option value="all">Todos os Status</option>
                <option value="published">Publicados</option>
                <option value="draft">Rascunhos</option>
              </select>

              <select value={neighborhoodFilter} onChange={(e) => setNeighborhoodFilter(e.target.value)} className="flex h-10 w-full rounded-md border border-vf-border bg-white px-3.5 py-2.5 text-[13px] text-vf-text-1 focus:border-vf-black focus:outline-none focus:ring-1 focus:ring-vf-black">
                <option value="all">Todos os Bairros</option>
                {NEW_YORK_NEIGHBORHOODS.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-3">
             <h3 className="text-[11px] font-bold uppercase text-vf-text-3 tracking-widest">Custo Máximo</h3>
            <div className="flex items-center justify-between text-[13px] font-bold">
              <span className="text-vf-text-2">Até:</span>
              <span className="text-vf-black">${maxPrice}</span>
            </div>
            <input
              type="range"
              min="0"
              max="1000"
              step="10"
              value={maxPrice}
              onChange={(e) => setMaxPrice(parseInt(e.target.value))}
              className="w-full accent-vf-black cursor-pointer"
            />
          </div>

          <div className="space-y-3">
             <h3 className="text-[11px] font-bold uppercase text-vf-text-3 tracking-widest">Qualidade</h3>
            <label className="flex items-center gap-2 p-3 rounded-lg border border-vf-border cursor-pointer hover:bg-vf-muted transition-colors">
              <input type="checkbox" checked={mustSeeFilter} onChange={(e) => setMustSeeFilter(e.target.checked)} className="accent-vf-black w-4 h-4 rounded" />
              <span className="text-[13px] font-bold text-vf-black flex items-center gap-1.5"><Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400"/> Apenas Must See</span>
            </label>
            
            <div className="space-y-2 pt-2">
              <label className="flex items-center gap-2 text-[13px] text-vf-text-2 font-semibold cursor-pointer">
                <input type="radio" checked={minRating === null} onChange={() => setMinRating(null)} className="accent-vf-black w-4 h-4" />
                Qualquer nota
              </label>
              {[4.5, 4.0, 3.5].map(r => (
                <label key={r} className="flex items-center gap-2 text-[13px] text-vf-text-2 font-semibold cursor-pointer">
                  <input type="radio" checked={minRating === r} onChange={() => setMinRating(r)} className="accent-vf-black w-4 h-4" />
                  <StarRating rating={r} /> +
                </label>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-vf-border">
            <h3 className="text-[11px] font-bold uppercase text-vf-text-3 tracking-widest mb-3">Mapa em Tempo Real</h3>
            <div className="relative rounded-lg h-32 bg-vf-muted border border-vf-border overflow-hidden z-0">
              <APIProvider apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
                <Map defaultCenter={{ lat: 40.7580, lng: -73.9855 }} defaultZoom={11} mapId="LIST_MAP_COMPACT" disableDefaultUI={true}>
                  {filtered.map(exp => exp.location_lat && exp.location_lng && (
                    <AdvancedMarker key={exp.id} position={{ lat: exp.location_lat, lng: exp.location_lng }} title={exp.title}>
                      <div className="w-2.5 h-2.5 bg-vf-lime border border-black rounded-full shadow-sm" />
                    </AdvancedMarker>
                  ))}
                </Map>
              </APIProvider>
            </div>
          </div>

        </div>

        {/* ── Right Content Area (Table) ── */}
        <div className="flex-1 bg-white rounded-xl border border-vf-border shadow-vf-sm overflow-hidden flex flex-col">
          <div className="flex-1 overflow-auto">
            {isLoading ? (
              <div className="flex justify-center h-full items-center">
                <div className="w-6 h-6 border-2 border-vf-lime border-t-vf-black rounded-full animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="h-full flex flex-col justify-center items-center text-center p-8">
                <div className="w-12 h-12 rounded-xl bg-vf-muted flex items-center justify-center mb-3">
                  <Search className="w-5 h-5 text-vf-text-3" />
                </div>
                <p className="font-bold text-vf-black text-[15px]">Nenhuma experiência encontrada</p>
                <p className="text-vf-text-3 text-[13px] mt-1 max-w-sm">Ajuste os filtros na lateral para encontrar o que você está procurando.</p>
                <Button variant="outline" className="mt-4" onClick={() => { setSearch(''); setStatusFilter('all'); setTypeFilter('all'); setMaxPrice(1000); setMustSeeFilter(false); setNeighborhoodFilter('all'); setMinRating(null); }}>
                  Limpar todos os filtros
                </Button>
              </div>
            ) : (
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead className="sticky top-0 bg-white z-10">
                  <tr className="text-[11px] font-bold uppercase text-vf-text-3 border-b border-vf-border">
                    <th className="px-4 py-3 w-10 text-center">
                      <input type="checkbox" className="accent-vf-black rounded w-4 h-4 cursor-pointer"
                        checked={selectedIds.size === filtered.length && filtered.length > 0}
                        onChange={toggleSelectAll} />
                    </th>
                    <th className="px-4 py-3 min-w-[200px]">Título / Mídia</th>
                    <th className="px-4 py-3">Categoria</th>
                    <th className="px-4 py-3">Bairro</th>
                    <th className="px-4 py-3">Base Price</th>
                    <th className="px-4 py-3">Saúde do Dado</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="text-[13px] text-vf-text-1">
                  {filtered.map(exp => {
                    const ai = getAI(exp);
                    return (
                      <tr
                        key={exp.id}
                        onClick={() => handleItemClick(exp.id)}
                        className={cn('group hover:bg-vf-muted transition-colors cursor-pointer border-b border-vf-border/50 last:border-0', selectedIds.has(exp.id) && 'bg-vf-lime/10')}
                      >
                        <td className="px-4 py-3 text-center" onClick={e => e.stopPropagation()}>
                          <input type="checkbox" className="accent-vf-black rounded w-4 h-4 cursor-pointer"
                            checked={selectedIds.has(exp.id)}
                            onChange={(e) => {
                              const n = new Set(selectedIds);
                              if (n.has(exp.id)) { n.delete(exp.id); } else { n.add(exp.id); }
                              setSelectedIds(n);
                            }}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-md bg-vf-muted border border-vf-border/50 flex-shrink-0 overflow-hidden flex items-center justify-center">
                              {exp.media_urls?.[0] ? (
                                isVideoUrl(exp.media_urls[0]) ? (
                                  <video src={exp.media_urls[0]} className="w-full h-full object-cover" />
                                ) : (
                                  <img src={exp.media_urls[0]} alt={exp.title} className="w-full h-full object-cover" />
                                )
                              ) : (
                                <ImageIcon className="w-4 h-4 text-vf-text-3" />
                              )}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="font-bold text-vf-black truncate flex items-center gap-1.5">
                                {ai.is_must_see && <Star className="w-3 h-3 text-amber-400 fill-amber-400" />}
                                {exp.title}
                              </span>
                              {ai.rating != null && (
                                <span className="text-[11px] text-vf-text-3 font-semibold mt-0.5">Rating: {ai.rating.toFixed(1)}</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-vf-text-2 font-medium capitalize">
                          {exp.category || '-'}
                        </td>
                        <td className="px-4 py-3 text-vf-text-2 font-medium">
                          {exp.neighborhood || '-'}
                        </td>
                        <td className="px-4 py-3 font-bold text-vf-black">
                          ${exp.base_cost ?? 0}
                        </td>
                        <td className="px-4 py-3">
                          <QualityBadge exp={exp} />
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn("px-2.5 py-1 rounded-md text-[11px] font-bold", STATUS_STYLES[exp.status || 'draft'])}>
                            {exp.status === 'published' ? 'Publicado' : 'Rascunho'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
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
            )}
          </div>
          <div className="px-4 py-3 border-t border-vf-border bg-vf-bg/50 text-[11px] font-bold text-vf-text-3 flex justify-between items-center">
             <span>Mostrando {filtered.length} resultados.</span>
          </div>
        </div>

      </div>

      <AlertDialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
        <AlertDialogContent className="rounded-2xl border border-vf-border bg-white shadow-vf-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-black text-vf-black">Excluir Experiência?</AlertDialogTitle>
            <AlertDialogDescription className="text-vf-text-2">Esta ação é permanente. Se ela faz parte de roteiros de usuários, eles perderão o acesso a esta atração.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-lg text-vf-text-1 hover:bg-vf-muted">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="rounded-lg bg-vf-danger hover:bg-vf-danger/90 text-white border-0 shadow-sm">Excluir Atração</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
