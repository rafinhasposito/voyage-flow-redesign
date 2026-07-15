import React, { useEffect, useState, useMemo } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import {
  Plus, Search, MoreHorizontal, Edit, Copy, Trash2,
  AlertCircle, Star, X, Eye, EyeOff, LayoutGrid, LayoutList,
  Sparkles, UploadCloud, ChevronRight, Image as ImageIcon, MapPin, List
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Database } from "@/types/supabase.types";
import { normalizeTechnicalType, matchesExperienceSection } from "@/lib/experienceUtils";
import { NEW_YORK_NEIGHBORHOODS } from "@/config/constants";
import { cn, isVideoUrl } from "@/lib/utils";

import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ExperienceRow = Database["public"]["Tables"]["experiences"]["Row"];

// Safely parse AI Data
const getAI = (e: ExperienceRow) => {
  if (!e.intelligence_metadata) return null;
  try {
    return typeof e.intelligence_metadata === 'string' 
      ? JSON.parse(e.intelligence_metadata) 
      : e.intelligence_metadata;
  } catch {
    return null;
  }
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
const STATUS_STYLES: Record<string, string> = {
  published: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  draft:     'bg-[#171717]/5 text-[#171717]/60 border-[#171717]/10',
  archived:  'bg-rose-100 text-rose-800 border-rose-200',
};

function QualityBadge({ exp }: { exp: ExperienceRow }) {
  const missing = [
    !exp.location_lat && 'GPS',
    !exp.neighborhood && 'Bairro',
    !exp.duration_minutes && 'Duração',
  ].filter(Boolean);

  if (missing.length === 0) {
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-lg">
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"/> Ok
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded-lg" title={`Faltando: ${missing.join(', ')}`}>
      <div className="w-1.5 h-1.5 rounded-full bg-amber-500"/> Pendente
    </span>
  );
}

function IABadge({ exp }: { exp: ExperienceRow }) {
  const ai = getAI(exp);
  if (!ai || !exp.intelligence_metadata) {
    return <span className="text-[12px] font-medium text-[#171717]/40">Não calculado</span>;
  }
  
  // Se existir IA mas os scores não estiverem claros, podemos checar
  if (ai.is_must_see) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200">
        <Star className="w-3 h-3 fill-amber-500 text-amber-500" /> Must See
      </span>
    );
  }
  return <span className="text-[12px] font-medium text-[#171717]/70">Calculado</span>;
}

// ─── Row Actions Menu ─────────────────────────────────────────────────────────
function RowMenu({ exp, onDuplicate, onToggleStatus }: {
  exp: ExperienceRow;
  onDuplicate: () => void;
  onToggleStatus: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="w-8 h-8 rounded-lg flex items-center justify-center text-[#171717]/50 hover:text-[#171717] hover:bg-[#171717]/5 transition-all">
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 rounded-xl p-1.5 shadow-lg border border-[#171717]/10 bg-white">
        <DropdownMenuItem asChild>
          <Link to={`/admin/experiences/${exp.id}`} className="flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] font-semibold cursor-pointer hover:bg-[#171717]/5 focus:bg-[#171717]/5">
            <Edit className="w-3.5 h-3.5 text-[#171717]/50" /> Editar
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onToggleStatus} className="flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] font-semibold cursor-pointer hover:bg-[#171717]/5 focus:bg-[#171717]/5">
          {exp.status === 'published' ? <EyeOff className="w-3.5 h-3.5 text-[#171717]/50" /> : <Eye className="w-3.5 h-3.5 text-[#171717]/50" />}
          {exp.status === 'published' ? 'Despublicar' : 'Publicar'}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onDuplicate} className="flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] font-semibold cursor-pointer hover:bg-[#171717]/5 focus:bg-[#171717]/5">
          <Copy className="w-3.5 h-3.5 text-[#171717]/50" /> Duplicar
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

  const [searchParams, setSearchParams] = useSearchParams();

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [neighborhoodFilter, setNeighborhoodFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  
  // View Mode: 'table' | 'list' | 'cards'
  const [viewMode, setViewMode] = useState<'table' | 'list' | 'cards'>(() => {
    return (localStorage.getItem('catalog_view_mode') as 'table' | 'list' | 'cards') || 'table';
  });

  useEffect(() => {
    localStorage.setItem('catalog_view_mode', viewMode);
  }, [viewMode]);

  useEffect(() => {
    const urlType = searchParams.get('type');
    setTypeFilter(normalizeTechnicalType(urlType));
  }, [searchParams]);

  const handleTypeFilterChange = (newVal: string) => {
    setTypeFilter(newVal);
    const nextParams = new URLSearchParams(searchParams);
    if (newVal === 'all') {
      nextParams.delete('type');
    } else {
      let urlVal = newVal;
      if (newVal === 'lodging') urlVal = 'Hotel';
      if (newVal === 'dining') urlVal = 'restaurant';
      if (newVal === 'attractions') urlVal = 'attraction';
      if (newVal === 'events') urlVal = 'event';
      nextParams.set('type', urlVal);
    }
    setSearchParams(nextParams);
  };

  useEffect(() => { fetchExperiences(); }, []);

  async function fetchExperiences() {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.from('experiences').select('*').order('title');
      if (error) throw error;
      setExperiences(data as ExperienceRow[]);
    } catch { toast.error('Erro ao carregar catálogo.'); }
    finally { setIsLoading(false); }
  }

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
    } catch (err: unknown) { toast.error('Erro ao duplicar: ' + (err as Error).message); }
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
  
  const handleBulkDraft = async () => {
    const ids = Array.from(selectedIds);
    const { error } = await supabase.from('experiences').update({ status: 'draft' }).in('id', ids);
    if (!error) {
      setExperiences(p => p.map(e => selectedIds.has(e.id) ? { ...e, status: 'draft' } : e));
      setSelectedIds(new Set());
      toast.success(`${ids.length} itens movidos para rascunho!`);
    }
  };

  const filtered = useMemo(() => {
    return experiences.filter(e => {
      if (search && !e.title.toLowerCase().includes(search.toLowerCase())) return false;
      if (statusFilter !== 'all' && e.status !== statusFilter) return false;
      if (neighborhoodFilter !== 'all' && e.neighborhood !== neighborhoodFilter) return false;
      if (typeFilter !== 'all' && !matchesExperienceSection(e, typeFilter)) return false;
      return true;
    });
  }, [experiences, search, statusFilter, neighborhoodFilter, typeFilter]);

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length && filtered.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map(e => e.id)));
    }
  };

  const handleItemClick = (id: string) => navigate(`/admin/experiences/${id}`);

  // Metrics
  const totalCount = experiences.length;
  const publishedCount = experiences.filter(e => e.status === 'published').length;
  const draftCount = experiences.filter(e => e.status === 'draft').length;
  const qualityIssuesCount = experiences.filter(e => !e.location_lat || !e.neighborhood || !e.duration_minutes).length;

  return (
    <div className="flex flex-col h-full bg-[#F7F7F2] overflow-hidden">
      
      {/* ── Contextual Header ── */}
      <div className="bg-gradient-to-r from-[#D7F24B] to-[#BDF4D6] px-8 pt-10 pb-16 flex-shrink-0 relative overflow-hidden">
        {/* Decorator */}
        <div className="absolute -right-20 -top-20 w-96 h-96 bg-white/20 rounded-full blur-3xl" />
        
        <div className="flex items-start justify-between relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/40 rounded-full text-[11px] font-black uppercase tracking-widest text-[#171717]/70 mb-4">
              <Library className="w-3.5 h-3.5" /> Conteúdo
            </div>
            <h1 className="text-4xl font-black text-[#171717] tracking-tight leading-none mb-3">Catálogo Mestre</h1>
            <p className="text-[15px] font-medium text-[#171717]/70 max-w-xl">
              Gerencie experiências, hospedagens, restaurantes, eventos e outros pontos da viagem.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button size="lg" className="bg-white text-[#171717] hover:bg-white/90 border-0 shadow-sm rounded-xl font-bold h-12 px-6" asChild>
              <Link to="/admin/import">
                <UploadCloud className="w-4 h-4 mr-2 text-[#171717]/50" /> Importar URL
              </Link>
            </Button>
            <Button size="lg" className="bg-[#171717] text-white hover:bg-[#171717]/90 border-0 shadow-md rounded-xl font-bold h-12 px-6" asChild>
              <Link to="/admin/experiences/new">
                <Plus className="w-5 h-5 mr-2" /> Nova Experiência
              </Link>
            </Button>
          </div>
        </div>

        {/* Indicators */}
        <div className="flex gap-4 mt-8 relative z-10">
          <div className="bg-white/40 rounded-2xl px-5 py-4 min-w-[140px] shadow-sm">
            <p className="text-[11px] font-bold uppercase tracking-widest text-[#171717]/60 mb-1">Total</p>
            <p className="text-2xl font-black text-[#171717]">{totalCount}</p>
          </div>
          <div className="bg-white/40 rounded-2xl px-5 py-4 min-w-[140px] shadow-sm">
            <p className="text-[11px] font-bold uppercase tracking-widest text-[#171717]/60 mb-1">Publicados</p>
            <p className="text-2xl font-black text-emerald-700">{publishedCount}</p>
          </div>
          <div className="bg-white/40 rounded-2xl px-5 py-4 min-w-[140px] shadow-sm">
            <p className="text-[11px] font-bold uppercase tracking-widest text-[#171717]/60 mb-1">Rascunhos</p>
            <p className="text-2xl font-black text-[#171717]/70">{draftCount}</p>
          </div>
          <div className="bg-white/40 rounded-2xl px-5 py-4 min-w-[140px] shadow-sm">
            <p className="text-[11px] font-bold uppercase tracking-widest text-[#171717]/60 mb-1">Pendências</p>
            <p className="text-2xl font-black text-amber-600">{qualityIssuesCount > 0 ? qualityIssuesCount : 0}</p>
          </div>
        </div>
      </div>

      {/* ── Main Content Area ── */}
      <div className="flex-1 px-8 -mt-8 relative z-20 flex flex-col min-w-0 pb-8">
        <div className="bg-white rounded-3xl shadow-sm border border-[#171717]/5 flex-1 flex flex-col min-w-0 overflow-hidden">
          
          {/* Toolbar */}
          <div className="px-6 py-5 border-b border-[#171717]/5 flex items-center justify-between gap-4 flex-wrap bg-white">
            <div className="flex items-center gap-3 flex-1 min-w-[300px]">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#171717]/40" />
                <Input 
                  value={search} onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar no catálogo..."
                  className="pl-10 h-11 bg-[#F7F7F2] border-0 rounded-xl font-medium focus-visible:ring-1 focus-visible:ring-[#D7F24B]"
                />
              </div>
              <select value={typeFilter} onChange={(e) => handleTypeFilterChange(e.target.value)} className="h-11 rounded-xl bg-[#F7F7F2] border-0 px-4 text-[13px] font-bold text-[#171717] focus:ring-1 focus:ring-[#D7F24B] outline-none">
                <option value="all">Todas as Categorias</option>
                <option value="attractions">Atrações</option>
                <option value="dining">Restaurantes</option>
                <option value="lodging">Hotéis</option>
                <option value="events">Eventos</option>
              </select>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-11 rounded-xl bg-[#F7F7F2] border-0 px-4 text-[13px] font-bold text-[#171717] focus:ring-1 focus:ring-[#D7F24B] outline-none">
                <option value="all">Status: Todos</option>
                <option value="published">Status: Publicado</option>
                <option value="draft">Status: Rascunho</option>
              </select>
              {(search || statusFilter !== 'all' || typeFilter !== 'all') && (
                <button onClick={() => { setSearch(''); setStatusFilter('all'); handleTypeFilterChange('all'); }} className="text-[12px] font-bold text-[#171717]/50 hover:text-[#171717]">
                  Limpar
                </button>
              )}
            </div>

            <div className="flex items-center gap-4">
              <span className="text-[12px] font-bold text-[#171717]/40">{filtered.length} resultados</span>
              <div className="flex items-center bg-[#F7F7F2] p-1 rounded-xl">
                <button onClick={() => setViewMode('table')} className={cn("p-2 rounded-lg transition-all", viewMode === 'table' ? 'bg-white shadow-sm text-[#171717]' : 'text-[#171717]/40 hover:text-[#171717]')}>
                  <List className="w-4 h-4" />
                </button>
                <button onClick={() => setViewMode('list')} className={cn("p-2 rounded-lg transition-all", viewMode === 'list' ? 'bg-white shadow-sm text-[#171717]' : 'text-[#171717]/40 hover:text-[#171717]')}>
                  <LayoutList className="w-4 h-4" />
                </button>
                <button onClick={() => setViewMode('cards')} className={cn("p-2 rounded-lg transition-all", viewMode === 'cards' ? 'bg-white shadow-sm text-[#171717]' : 'text-[#171717]/40 hover:text-[#171717]')}>
                  <LayoutGrid className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Bulk Actions Bar */}
          {selectedIds.size > 0 && (
            <div className="bg-[#171717] text-white px-6 py-3 flex items-center justify-between text-[13px] font-bold">
              <span>{selectedIds.size} itens selecionados</span>
              <div className="flex gap-4 items-center">
                <button onClick={handleBulkPublish} className="text-[#D7F24B] hover:underline">Publicar selecionados</button>
                <button onClick={handleBulkDraft} className="text-white/70 hover:text-white hover:underline">Mover para Rascunhos</button>
                <div className="w-px h-4 bg-white/20 mx-2" />
                <button onClick={() => setSelectedIds(new Set())} className="text-white/40 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Views Area */}
          <div className="flex-1 overflow-auto bg-white">
            {isLoading ? (
              <div className="flex justify-center h-full items-center">
                <div className="w-6 h-6 border-2 border-[#D7F24B] border-t-[#171717] rounded-full animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="h-full flex flex-col justify-center items-center text-center p-8">
                <div className="w-16 h-16 rounded-2xl bg-[#F7F7F2] flex items-center justify-center mb-4">
                  <Search className="w-6 h-6 text-[#171717]/30" />
                </div>
                <p className="font-black text-[#171717] text-lg">Nenhum resultado</p>
                <p className="text-[#171717]/50 text-[14px] mt-1">Tente ajustar os filtros ou limpar a busca.</p>
              </div>
            ) : (
              <>
                {viewMode === 'table' && (
                  <table className="w-full text-left border-collapse whitespace-nowrap">
                    <thead className="sticky top-0 bg-white z-10 shadow-[0_1px_0_rgba(23,23,23,0.05)]">
                      <tr className="text-[10px] font-black uppercase tracking-widest text-[#171717]/40 bg-white">
                        <th className="px-6 py-4 w-10 text-center">
                          <input type="checkbox" className="accent-[#171717] rounded w-4 h-4 cursor-pointer"
                            checked={selectedIds.size === filtered.length && filtered.length > 0}
                            onChange={toggleSelectAll} />
                        </th>
                        <th className="px-6 py-4">Mídia / Título</th>
                        <th className="px-6 py-4">Destino</th>
                        <th className="px-6 py-4">Categoria / Tipo</th>
                        <th className="px-6 py-4">Qualidade</th>
                        <th className="px-6 py-4">Inteligência</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="text-[13px] text-[#171717]">
                      {filtered.map(exp => (
                        <tr key={exp.id} onClick={() => handleItemClick(exp.id)} className={cn('group hover:bg-[#F7F7F2]/50 transition-colors cursor-pointer border-b border-[#171717]/5 last:border-0', selectedIds.has(exp.id) && 'bg-[#D7F24B]/10')}>
                          <td className="px-6 py-4 text-center" onClick={e => e.stopPropagation()}>
                            <input type="checkbox" className="accent-[#171717] rounded w-4 h-4 cursor-pointer"
                              checked={selectedIds.has(exp.id)}
                              onChange={(e) => {
                                const n = new Set(selectedIds);
                                if (n.has(exp.id)) { n.delete(exp.id); } else { n.add(exp.id); }
                                setSelectedIds(n);
                              }}
                            />
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-xl bg-[#F7F7F2] border border-[#171717]/5 overflow-hidden flex items-center justify-center shrink-0">
                                {exp.media_urls?.[0] ? (
                                  isVideoUrl(exp.media_urls[0]) ? (
                                    <video src={exp.media_urls[0]} className="w-full h-full object-cover" />
                                  ) : (
                                    <img src={exp.media_urls[0]} alt={exp.title} className="w-full h-full object-cover" />
                                  )
                                ) : (
                                  <ImageIcon className="w-5 h-5 text-[#171717]/20" />
                                )}
                              </div>
                              <span className="font-bold text-[14px] truncate max-w-[200px]">{exp.title}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-[#171717]/60 font-medium">
                            <div className="flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5" />
                              {exp.neighborhood || '-'}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="font-bold capitalize">{exp.category || '-'}</span>
                              <span className="text-[11px] text-[#171717]/50 uppercase tracking-widest mt-0.5">{exp.type || '-'}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4"><QualityBadge exp={exp} /></td>
                          <td className="px-6 py-4"><IABadge exp={exp} /></td>
                          <td className="px-6 py-4">
                            <span className={cn("px-2.5 py-1 rounded-lg text-[11px] font-bold border", STATUS_STYLES[exp.status || 'draft'])}>
                              {exp.status === 'published' ? 'Publicado' : 'Rascunho'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right" onClick={e => e.stopPropagation()}>
                            <RowMenu exp={exp} onDuplicate={() => handleDuplicate(exp)} onToggleStatus={() => handleToggleStatus(exp)} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {viewMode === 'list' && (
                  <div className="p-6 space-y-4">
                    {filtered.map(exp => (
                      <div key={exp.id} onClick={() => handleItemClick(exp.id)} className="flex items-center gap-6 p-4 rounded-2xl border border-[#171717]/10 hover:border-[#171717]/30 hover:shadow-md transition-all cursor-pointer bg-white group">
                         <div className="w-32 h-24 rounded-xl bg-[#F7F7F2] overflow-hidden shrink-0 relative">
                            {exp.media_urls?.[0] ? (
                              isVideoUrl(exp.media_urls[0]) ? (
                                <video src={exp.media_urls[0]} className="w-full h-full object-cover" />
                              ) : (
                                <img src={exp.media_urls[0]} alt={exp.title} className="w-full h-full object-cover" />
                              )
                            ) : (
                              <div className="w-full h-full flex items-center justify-center"><ImageIcon className="w-6 h-6 text-[#171717]/20" /></div>
                            )}
                            <div className="absolute top-2 right-2">
                               <span className={cn("px-2 py-0.5 rounded-md text-[10px] font-bold shadow-sm", exp.status === 'published' ? 'bg-emerald-500 text-white' : 'bg-white/90 text-[#171717]')}>
                                 {exp.status === 'published' ? 'PUBLISHED' : 'DRAFT'}
                               </span>
                            </div>
                         </div>
                         <div className="flex-1 min-w-0">
                           <div className="flex items-center gap-2 mb-1">
                             <span className="text-[10px] font-black uppercase tracking-widest text-[#171717]/40 bg-[#F7F7F2] px-2 py-0.5 rounded-md">{exp.category || 'N/A'}</span>
                             <span className="text-[10px] font-black uppercase tracking-widest text-[#171717]/40 bg-[#F7F7F2] px-2 py-0.5 rounded-md">{exp.type || 'N/A'}</span>
                           </div>
                           <h3 className="text-lg font-black text-[#171717] truncate">{exp.title}</h3>
                           <p className="text-[13px] text-[#171717]/60 line-clamp-2 mt-1 leading-snug">{exp.short_description || exp.description || 'Sem descrição.'}</p>
                         </div>
                         <div className="flex flex-col gap-2 shrink-0 min-w-[120px]">
                           <QualityBadge exp={exp} />
                           <IABadge exp={exp} />
                         </div>
                         <div className="shrink-0 pr-2 flex items-center justify-center">
                            <div className="w-10 h-10 rounded-full bg-[#171717]/5 flex items-center justify-center text-[#171717]/40 group-hover:bg-[#D7F24B] group-hover:text-[#171717] transition-colors">
                              <ChevronRight className="w-5 h-5" />
                            </div>
                         </div>
                      </div>
                    ))}
                  </div>
                )}

                {viewMode === 'cards' && (
                  <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                     {filtered.map(exp => (
                      <div key={exp.id} onClick={() => handleItemClick(exp.id)} className="flex flex-col rounded-3xl border border-[#171717]/10 overflow-hidden hover:shadow-xl hover:border-[#171717]/30 transition-all cursor-pointer bg-white group">
                         <div className="h-48 bg-[#F7F7F2] relative">
                            {exp.media_urls?.[0] ? (
                              isVideoUrl(exp.media_urls[0]) ? (
                                <video src={exp.media_urls[0]} className="w-full h-full object-cover" />
                              ) : (
                                <img src={exp.media_urls[0]} alt={exp.title} className="w-full h-full object-cover" />
                              )
                            ) : (
                              <div className="w-full h-full flex items-center justify-center"><ImageIcon className="w-8 h-8 text-[#171717]/20" /></div>
                            )}
                            <div className="absolute top-4 right-4 flex flex-col gap-2">
                               <span className={cn("px-2.5 py-1 rounded-lg text-[10px] font-black tracking-wider uppercase shadow-md backdrop-blur-md border border-white/20", exp.status === 'published' ? 'bg-emerald-500/90 text-white' : 'bg-white/90 text-[#171717]')}>
                                 {exp.status === 'published' ? 'Pub' : 'Draft'}
                               </span>
                            </div>
                         </div>
                         <div className="p-5 flex-1 flex flex-col">
                           <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-[#171717]/50 mb-2">
                             <span>{exp.category || 'N/A'}</span>
                             <span className="w-1 h-1 rounded-full bg-[#171717]/20" />
                             <span>{exp.type || 'N/A'}</span>
                           </div>
                           <h3 className="text-xl font-black text-[#171717] leading-tight mb-2 line-clamp-2">{exp.title}</h3>
                           
                           <div className="flex items-center gap-1.5 text-[#171717]/60 text-[13px] font-medium mb-4">
                              <MapPin className="w-4 h-4" />
                              <span className="truncate">{exp.neighborhood || 'Localização não definida'}</span>
                           </div>

                           <div className="mt-auto pt-4 border-t border-[#171717]/5 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <QualityBadge exp={exp} />
                              </div>
                              <div className="w-8 h-8 rounded-full bg-[#171717]/5 flex items-center justify-center text-[#171717]/40 group-hover:bg-[#171717] group-hover:text-white transition-colors">
                                <Edit className="w-3.5 h-3.5" />
                              </div>
                           </div>
                         </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
