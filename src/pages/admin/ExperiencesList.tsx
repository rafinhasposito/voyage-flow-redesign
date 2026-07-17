import React, { useEffect, useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Plus, Search, MoreHorizontal, Library, Edit, Copy, Eye, EyeOff, LayoutGrid, LayoutList,
  UploadCloud, ImageIcon, MapPin, List, Map as MapIcon, ChevronLeft, ChevronRight, X
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Database } from "@/types/supabase.types";
import { normalizeTechnicalType } from "@/lib/experienceUtils";
import { cn, isVideoUrl } from "@/lib/utils";
import { getSafeMediaUrl } from "@/utils/safeMediaUrl";
import { translateTerm } from "@/utils/translations";

import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import CatalogMap from "@/components/admin/catalog/CatalogMap";

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
      <span className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"/> Perfeito
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full" title={`Faltando: ${missing.join(', ')}`}>
      <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]"/> {missing.length} Pendências
    </span>
  );
}

function IABadge({ exp }: { exp: ExperienceRow }) {
  const ai = getAI(exp);
  if (!ai || !exp.intelligence_metadata) {
    return <span className="inline-flex items-center px-2.5 py-1 text-[11px] font-black uppercase tracking-wider text-[#171717]/40 bg-[#171717]/5 rounded-full border border-[#171717]/10">Não calculado</span>;
  }
  
  if (ai.is_must_see) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wider text-white bg-gradient-to-r from-pink-500 to-purple-500 px-2.5 py-1 rounded-full shadow-md">
        <SparklesIcon className="w-3 h-3 text-white" /> {translateTerm('must see')}
      </span>
    );
  }
  return <span className="inline-flex items-center px-2.5 py-1 text-[11px] font-black uppercase tracking-wider text-purple-700 bg-purple-50 rounded-full border border-purple-200">Calculado</span>;
}

function SparklesIcon(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
      <path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/>
    </svg>
  );
}

function RowMenu({ exp, onDuplicate, onToggleStatus }: { exp: ExperienceRow; onDuplicate: () => void; onToggleStatus: () => void; }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="w-8 h-8 rounded-full flex items-center justify-center text-[#171717]/40 hover:text-[#171717] hover:bg-[#171717]/5 transition-all outline-none">
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] border border-[#171717]/10 bg-white/90 backdrop-blur-xl">
        <DropdownMenuItem asChild>
          <Link to={`/admin/experiences/${exp.id}`} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-bold text-[#171717] cursor-pointer hover:bg-[#D7F24B]/30 transition-colors">
            <Edit className="w-4 h-4 text-[#171717]/60" /> Editar Registro
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onToggleStatus} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-bold text-[#171717] cursor-pointer hover:bg-[#D7F24B]/30 transition-colors">
          {exp.status === 'published' ? <EyeOff className="w-4 h-4 text-[#171717]/60" /> : <Eye className="w-4 h-4 text-[#171717]/60" />}
          {exp.status === 'published' ? 'Mover para Rascunho' : 'Publicar'}
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-[#171717]/5 my-1" />
        <DropdownMenuItem onClick={onDuplicate} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-bold text-[#171717] cursor-pointer hover:bg-[#171717]/5 transition-colors">
          <Copy className="w-4 h-4 text-[#171717]/60" /> Duplicar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function ExperiencesList() {
  const navigate = useNavigate();
  const [experiences, setExperiences] = useState<ExperienceRow[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [viewMode, setViewMode] = useState<'table' | 'list' | 'cards'>(() => {
    return (localStorage.getItem('catalog_view_mode') as 'table' | 'list' | 'cards') || 'table';
  });

  const [showMap, setShowMap] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const [selectedExpId, setSelectedExpId] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('catalog_view_mode', viewMode);
  }, [viewMode]);

  useEffect(() => {
    fetchExperiences();
  }, []);
  
  // Custom highlight flash animation
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes highlight-flash {
        0% { background-color: rgba(215, 242, 75, 0.5); transform: scale(1.02); }
        50% { background-color: rgba(215, 242, 75, 0.3); transform: scale(1.01); }
        100% { background-color: transparent; transform: scale(1); }
      }
      .highlight-flash {
        animation: highlight-flash 2.5s ease-out;
        border-color: #D7F24B !important;
        box-shadow: 0 0 0 2px rgba(215, 242, 75, 0.2) !important;
      }
    `;
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, []);

  const handleSelectExperience = (id: string) => {
    setSelectedExpId(id);
    const mapEl = document.getElementById('catalog-map-container');
    if (mapEl) {
      const rect = mapEl.getBoundingClientRect();
      if (rect.top < 0 || rect.bottom > window.innerHeight) {
        mapEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  const handleShowInList = (id: string) => {
    const locateAndHighlight = (sourceList: ExperienceRow[]) => {
      const expIndex = sourceList.findIndex(e => e.id === id);
      if (expIndex !== -1) {
        const page = Math.floor(expIndex / itemsPerPage) + 1;
        setCurrentPage(page);
        setSelectedExpId(id);
        setTimeout(() => {
          const el = document.getElementById(`exp-${id}`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.classList.add('highlight-flash');
            setTimeout(() => el.classList.remove('highlight-flash'), 2500);
          }
        }, 150);
      }
    };

    const expIndex = filtered.findIndex(e => e.id === id);
    if (expIndex !== -1) {
      locateAndHighlight(filtered);
    } else {
      toast('Esta experiência não está presente nos filtros atuais.', {
        action: {
          label: 'Limpar filtros e localizar',
          onClick: () => {
            setSearchQuery("");
            setStatusFilter("all");
            setCategoryFilter("all");
            setTypeFilter("all");
            setTimeout(() => locateAndHighlight(experiences), 150);
          }
        },
        duration: 5000
      });
    }
  };

  const fetchExperiences = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('experiences')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setExperiences(data || []);
    } catch (err) {
      console.error("Error fetching experiences:", err);
      toast.error("Erro ao carregar catálogo.");
    } finally {
      setLoading(false);
    }
  };

  const handleDuplicate = async (exp: ExperienceRow) => {
    try {
      const { id, created_at, updated_at, ...copyData } = exp;
      const { data, error } = await supabase
        .from('experiences')
        .insert([{
          ...copyData,
          title: `${exp.title} (Cópia)`,
          status: 'draft'
        }])
        .select()
        .single();
      
      if (error) throw error;
      setExperiences([data, ...experiences]);
      toast.success("Experiência duplicada com sucesso!");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao duplicar experiência.");
    }
  };

  const handleToggleStatus = async (exp: ExperienceRow) => {
    const newStatus = exp.status === 'published' ? 'draft' : 'published';
    try {
      const { error } = await supabase
        .from('experiences')
        .update({ status: newStatus })
        .eq('id', exp.id);
        
      if (error) throw error;
      setExperiences(experiences.map(e => e.id === exp.id ? { ...e, status: newStatus } : e));
      toast.success(newStatus === 'published' ? "Experiência publicada!" : "Movida para rascunho.");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao atualizar status.");
    }
  };

  // Reseta a página ao mudar filtros
  useEffect(() => {
    setCurrentPage(1);
    setSelectedExpId(null);
  }, [searchQuery, statusFilter, categoryFilter, typeFilter]);

  const filtered = useMemo(() => {
    return experiences.filter(exp => {
      const searchStr = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery 
        || exp.title?.toLowerCase().includes(searchStr) 
        || exp.description?.toLowerCase().includes(searchStr)
        || exp.neighborhood?.toLowerCase().includes(searchStr);

      const matchesStatus = statusFilter === 'all' 
        ? exp.status !== 'archived' 
        : exp.status === statusFilter;
        
      const matchesCategory = categoryFilter === 'all' || exp.category === categoryFilter;
      const matchesType = typeFilter === 'all' || normalizeTechnicalType(exp.type) === typeFilter;

      return matchesSearch && matchesStatus && matchesCategory && matchesType;
    });
  }, [experiences, searchQuery, statusFilter, categoryFilter, typeFilter]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const currentData = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const categories = useMemo(() => Array.from(new Set(experiences.map(e => e.category).filter(Boolean))), [experiences]);
  const technicalTypes = useMemo(() => Array.from(new Set(experiences.map(e => normalizeTechnicalType(e.type)).filter(Boolean))), [experiences]);

  const metrics = useMemo(() => {
    const total = experiences.length;
    const published = experiences.filter(e => e.status === 'published').length;
    const drafts = experiences.filter(e => e.status === 'draft').length;
    const pendingReview = experiences.filter(e => !e.location_lat || !e.neighborhood || !e.duration_minutes).length;
    return { total, published, drafts, pendingReview };
  }, [experiences]);

  const validCoordinatesCount = filtered.filter(e => e.location_lat != null && e.location_lng != null).length;
  const noCoordinatesCount = filtered.length - validCoordinatesCount;
  const mapVisible = (viewMode === 'cards' || viewMode === 'list') && showMap;

  const renderMedia = (urls: string[] | null, title: string) => {
    const safeUrl = getSafeMediaUrl(urls?.[0]);
    if (!safeUrl) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-rose-50" title="Imagem indisponível temporariamente">
          <ImageIcon className="w-6 h-6 text-rose-300" />
        </div>
      );
    }
    if (isVideoUrl(safeUrl)) {
      return <video src={safeUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />;
    }
    return <img src={safeUrl} alt={title} loading="lazy" decoding="async" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />;
  };

  return (
    <div className="min-h-screen bg-[#F7F7F2] pb-24 font-sans selection:bg-[#D7F24B] selection:text-[#171717]">
      <div className="px-8 pt-8 pb-6">
        <div className="bg-gradient-to-br from-[#D7F24B] to-[#BDF4D6] rounded-[28px] p-10 relative overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#171717]/5">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-white/20 blur-[80px] rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/40 backdrop-blur-md rounded-full text-[11px] font-black uppercase tracking-widest text-[#171717]/80 mb-4 shadow-sm border border-white/40">
                <Library className="w-3.5 h-3.5" /> Centro Operacional
              </div>
              <h1 className="text-5xl font-black text-[#171717] tracking-tight leading-none mb-4">Catálogo Mestre</h1>
              <p className="text-[#171717]/70 font-medium text-lg max-w-xl leading-relaxed">
                Gerencie o inventário global, corrija anomalias e controle o status de publicação.
              </p>
            </div>

            <div className="flex gap-3">
              <Link to="/admin/import" className="h-12 px-6 bg-white/40 backdrop-blur-md hover:bg-white/60 text-[#171717] rounded-xl font-bold flex items-center gap-2 transition-all shadow-sm border border-white/40">
                <UploadCloud className="w-4 h-4" /> Importar URL
              </Link>
              <Link to="/admin/experiences/new" className="h-12 px-6 bg-[#171717] hover:bg-[#171717]/90 text-white rounded-xl font-bold flex items-center gap-2 transition-all shadow-[0_8px_20px_rgba(23,23,23,0.2)]">
                <Plus className="w-4 h-4" /> Nova Experiência
              </Link>
            </div>
          </div>

          <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-4 mt-10">
            {[
              { label: 'Total Inventário', value: metrics.total, color: 'bg-white/40' },
              { label: 'Publicados', value: metrics.published, color: 'bg-emerald-500/10 text-emerald-900 border-emerald-500/20' },
              { label: 'Rascunhos', value: metrics.drafts, color: 'bg-white/30' },
              { label: 'Pendências Críticas', value: metrics.pendingReview, color: 'bg-amber-500/10 text-amber-900 border-amber-500/20' },
            ].map((m, i) => (
              <div key={i} className={cn("px-5 py-4 rounded-2xl border border-white/30 backdrop-blur-sm", m.color)}>
                <div className="text-[11px] font-black uppercase tracking-widest opacity-60 mb-1">{m.label}</div>
                <div className="text-3xl font-black">{loading ? '-' : m.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="px-8">
        
        {/* Toolbar */}
        <div className="bg-white rounded-[24px] p-4 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-[#171717]/5 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-4 z-20">
          
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#171717]/40" />
            <input 
              type="text"
              placeholder="Buscar por nome, bairro ou palavra-chave..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 h-12 bg-[#F7F7F2] border-0 rounded-xl text-[14px] font-medium text-[#171717] placeholder:text-[#171717]/40 focus:ring-2 focus:ring-[#D7F24B] outline-none transition-all"
            />
          </div>

          <div className="flex items-center gap-3 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
            
            <div className="flex items-center gap-2 bg-[#F7F7F2] p-1 rounded-xl">
               <select 
                value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent border-0 h-10 px-3 text-[13px] font-bold text-[#171717] outline-none cursor-pointer"
               >
                 <option value="all">Status: Todos</option>
                 <option value="published">Publicado</option>
                 <option value="draft">Rascunho</option>
                 <option value="archived">Lixeira</option>
               </select>
               <div className="w-px h-5 bg-[#171717]/10" />
               <select 
                value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
                className="bg-transparent border-0 h-10 px-3 text-[13px] font-bold text-[#171717] outline-none cursor-pointer"
               >
                 <option value="all">Tipo Técnico: Todos</option>
                 {technicalTypes.map(t => <option key={t as string} value={t as string}>{translateTerm(t as string)}</option>)}
               </select>
            </div>

            {(searchQuery || statusFilter !== 'all' || categoryFilter !== 'all' || typeFilter !== 'all') && (
              <button 
                onClick={() => { setSearchQuery(""); setStatusFilter("all"); setCategoryFilter("all"); setTypeFilter("all"); }}
                className="h-10 px-4 flex items-center gap-2 text-[12px] font-black uppercase tracking-wider text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"
              >
                Limpar
              </button>
            )}

            <div className="w-px h-8 bg-[#171717]/10 mx-2 hidden md:block" />

            <div className="flex items-center bg-[#F7F7F2] p-1 rounded-xl">
              <button onClick={() => setViewMode('table')} className={cn("w-10 h-10 flex items-center justify-center rounded-lg transition-all", viewMode === 'table' ? "bg-white shadow-sm text-[#171717]" : "text-[#171717]/40 hover:text-[#171717]")}>
                <List className="w-4 h-4" />
              </button>
              <button onClick={() => setViewMode('list')} className={cn("w-10 h-10 flex items-center justify-center rounded-lg transition-all", viewMode === 'list' ? "bg-white shadow-sm text-[#171717]" : "text-[#171717]/40 hover:text-[#171717]")}>
                <LayoutList className="w-4 h-4" />
              </button>
              <button onClick={() => setViewMode('cards')} className={cn("w-10 h-10 flex items-center justify-center rounded-lg transition-all", viewMode === 'cards' ? "bg-white shadow-sm text-[#171717]" : "text-[#171717]/40 hover:text-[#171717]")}>
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>

            {(viewMode === 'cards' || viewMode === 'list') && (
              <button onClick={() => setShowMap(!showMap)} className={cn("h-12 px-4 rounded-xl font-bold flex items-center gap-2 transition-all ml-2", showMap ? "bg-[#171717] text-white shadow-md" : "bg-[#F7F7F2] text-[#171717]/60 hover:text-[#171717]")}>
                <MapIcon className="w-4 h-4" /> Mapa
              </button>
            )}

          </div>
        </div>

        {/* MAIN CONTENT */}
        <div className="flex gap-6">
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-64">
                <div className="w-10 h-10 border-4 border-[#D7F24B] border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-[#171717]/50 font-bold">Carregando catálogo...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="bg-white rounded-[24px] border border-[#171717]/5 p-16 text-center">
                <div className="w-20 h-20 bg-[#F7F7F2] rounded-full flex items-center justify-center mx-auto mb-6 text-[#171717]/20">
                   <Search className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-black text-[#171717] mb-2">Nenhum resultado encontrado</h3>
                <p className="text-[#171717]/50 font-medium">Tente alterar os filtros ou a busca para encontrar o que procura.</p>
              </div>
            ) : (
              <>
                {viewMode === 'table' && (
                  <div className="bg-white rounded-[24px] border border-[#171717]/5 shadow-[0_4px_20px_rgb(0,0,0,0.02)] overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-[#171717]/5 bg-[#F7F7F2]/50">
                            <th className="px-6 py-5 text-[11px] font-black uppercase tracking-wider text-[#171717]/40 w-[40%]">Experiência</th>
                            <th className="px-6 py-5 text-[11px] font-black uppercase tracking-wider text-[#171717]/40">Status / IA</th>
                            <th className="px-6 py-5 text-[11px] font-black uppercase tracking-wider text-[#171717]/40">Categoria</th>
                            <th className="px-6 py-5 text-[11px] font-black uppercase tracking-wider text-[#171717]/40">Qualidade</th>
                            <th className="px-6 py-5 text-right text-[11px] font-black uppercase tracking-wider text-[#171717]/40">Ações</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#171717]/5">
                          {currentData.map(exp => (
                            <tr id={`exp-${exp.id}`} key={exp.id} onClick={() => handleSelectExperience(exp.id)} className={cn("transition-colors group cursor-pointer", selectedExpId === exp.id ? "bg-[#D7F24B]/10" : "hover:bg-[#F7F7F2]/80")}>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-4">
                                  <div className="w-14 h-14 rounded-2xl bg-[#F7F7F2] shrink-0 overflow-hidden border border-[#171717]/5">
                                    {renderMedia(exp.media_urls, exp.title)}
                                  </div>
                                  <div className="min-w-0">
                                    <div className="text-[10px] font-black uppercase tracking-widest text-[#171717]/40 mb-1">{translateTerm(exp.type)}</div>
                                    <h3 className="font-bold text-[#171717] text-[15px] truncate max-w-xs">{exp.title}</h3>
                                    <p className="text-[12px] text-[#171717]/50 truncate max-w-xs mt-0.5">{exp.neighborhood || 'Localização não definida'}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex flex-col gap-2 items-start">
                                  <span className={cn("px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider", STATUS_STYLES[exp.status || 'draft'])}>
                                    {translateTerm(exp.status)}
                                  </span>
                                  <IABadge exp={exp} />
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <span className="text-[14px] font-medium text-[#171717]/80">{translateTerm(exp.category)}</span>
                              </td>
                              <td className="px-6 py-4">
                                <QualityBadge exp={exp} />
                              </td>
                              <td className="px-6 py-4 text-right">
                                <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                  <RowMenu
                                    exp={exp}
                                    onDuplicate={() => handleDuplicate(exp)}
                                    onToggleStatus={() => handleToggleStatus(exp)}
                                  />
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {viewMode === 'list' && (
                  <div className="flex flex-col gap-4">
                    {currentData.map(exp => (
                      <div id={`exp-${exp.id}`} key={exp.id} onClick={() => handleSelectExperience(exp.id)} className={cn("bg-white rounded-[24px] border shadow-[0_4px_20px_rgb(0,0,0,0.02)] p-4 flex gap-6 transition-all group cursor-pointer", selectedExpId === exp.id ? "border-[#D7F24B] ring-2 ring-[#D7F24B]/20" : "border-[#171717]/5 hover:border-[#171717]/20")}>
                         <div className="w-48 h-32 rounded-2xl bg-[#F7F7F2] shrink-0 overflow-hidden relative border border-[#171717]/5">
                            {renderMedia(exp.media_urls, exp.title)}
                            <div className="absolute top-2 left-2">
                               <span className={cn("px-2.5 py-1 rounded-lg text-[10px] font-black tracking-wider uppercase shadow-md backdrop-blur-md border border-white/20", exp.status === 'published' ? 'bg-emerald-500/90 text-white' : 'bg-white/90 text-[#171717]')}>
                                 {exp.status === 'published' ? 'Pub' : 'Draft'}
                               </span>
                            </div>
                         </div>
                         <div className="flex-1 py-1 min-w-0 flex flex-col justify-between">
                           <div>
                             <div className="flex items-center gap-2 mb-2">
                               <span className="text-[10px] font-black uppercase tracking-widest text-[#171717]/50 bg-[#F7F7F2] px-2 py-0.5 rounded-md">{translateTerm(exp.category)}</span>
                               <span className="w-1 h-1 rounded-full bg-[#171717]/20" />
                               <span className="text-[10px] font-black uppercase tracking-widest text-[#171717]/50 bg-[#F7F7F2] px-2 py-0.5 rounded-md">{translateTerm(exp.type)}</span>
                             </div>
                             <h3 className="text-xl font-black text-[#171717] truncate">{exp.title}</h3>
                             <div className="flex items-center gap-1.5 text-[13px] text-[#171717]/50 mt-1">
                               <MapPin className="w-3.5 h-3.5" /> {exp.neighborhood || 'Localização não definida'}
                             </div>
                           </div>
                           <div className="flex items-center gap-3 mt-4">
                             <QualityBadge exp={exp} />
                             <IABadge exp={exp} />
                           </div>
                         </div>
                         <div className="shrink-0 pl-4 border-l border-[#171717]/5 flex flex-col items-center justify-center gap-2">
                            <Link to={`/admin/experiences/${exp.id}`} className="w-12 h-12 rounded-full bg-[#171717]/5 flex items-center justify-center text-[#171717]/60 hover:bg-[#D7F24B] hover:text-[#171717] transition-all">
                              <Edit className="w-5 h-5" />
                            </Link>
                         </div>
                      </div>
                    ))}
                  </div>
                )}

                {viewMode === 'cards' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                     {currentData.map(exp => (
                      <div id={`exp-${exp.id}`} key={exp.id} onClick={() => handleSelectExperience(exp.id)} className={cn("flex flex-col rounded-[28px] border overflow-hidden transition-all cursor-pointer bg-white group h-full", selectedExpId === exp.id ? "border-[#D7F24B] ring-2 ring-[#D7F24B]/20 shadow-[0_20px_40px_rgb(0,0,0,0.08)]" : "border-[#171717]/5 hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] hover:border-[#171717]/10")}>
                         <div className="h-48 bg-[#F7F7F2] relative m-2 rounded-[20px] overflow-hidden">
                            {renderMedia(exp.media_urls, exp.title)}
                            <div className="absolute top-3 right-3 flex flex-col gap-2">
                               <span className={cn("px-2.5 py-1.5 rounded-xl text-[10px] font-black tracking-wider uppercase shadow-[0_4px_12px_rgba(0,0,0,0.1)] backdrop-blur-md border border-white/20", exp.status === 'published' ? 'bg-emerald-500/90 text-white' : 'bg-white/90 text-[#171717]')}>
                                 {exp.status === 'published' ? 'Pub' : 'Draft'}
                               </span>
                            </div>
                         </div>
                         <div className="p-5 flex-1 flex flex-col">
                           <div className="flex items-center justify-between mb-3">
                             <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-[#171717]/40">
                               <span>{translateTerm(exp.category)}</span>
                               <span className="w-1 h-1 rounded-full bg-[#171717]/20" />
                               <span>{translateTerm(exp.type)}</span>
                             </div>
                           </div>
                           <h3 className="text-xl font-black text-[#171717] leading-tight mb-2 line-clamp-2 group-hover:text-[#D7F24B] transition-colors">{exp.title}</h3>
                           
                           <div className="flex items-center gap-1.5 text-[#171717]/50 text-[13px] font-medium mb-6">
                              <MapPin className="w-3.5 h-3.5" />
                              <span className="truncate">{exp.neighborhood || 'Localização não definida'}</span>
                           </div>

                           <div className="mt-auto pt-4 border-t border-[#171717]/5 flex items-center justify-between">
                              <div className="flex flex-col gap-2">
                                <QualityBadge exp={exp} />
                              </div>
                              <button onClick={(e) => { e.stopPropagation(); navigate(`/admin/experiences/${exp.id}`); }} className="w-10 h-10 rounded-full bg-[#171717]/5 flex items-center justify-center text-[#171717]/40 hover:bg-[#171717] hover:text-white transition-colors">
                                <Edit className="w-4 h-4" />
                              </button>
                           </div>
                         </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="py-8 flex items-center justify-between">
                <div className="text-[13px] font-bold text-[#171717]/50 uppercase tracking-widest">
                  Página {currentPage} de {totalPages}
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    className="w-10 h-10 rounded-xl bg-white border border-[#171717]/10 flex items-center justify-center text-[#171717] hover:bg-[#F7F7F2] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button 
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    className="w-10 h-10 rounded-xl bg-white border border-[#171717]/10 flex items-center justify-center text-[#171717] hover:bg-[#F7F7F2] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ─── PAINEL DO MAPA FREE (MapLibre + OpenFreeMap) ─── */}
          {mapVisible && (
            <div id="catalog-map-container" className="w-[450px] shrink-0 h-[calc(100vh-200px)] sticky top-28 bg-white rounded-[28px] border border-[#171717]/5 shadow-[0_4px_20px_rgb(0,0,0,0.03)] overflow-hidden flex flex-col">
              <div className="p-4 border-b border-[#171717]/5 flex items-center justify-between bg-white z-10">
                 <div className="flex items-center gap-2 font-black text-[#171717]">
                   <MapPin className="w-4 h-4 text-[#D7F24B]" /> Vista Geográfica 
                 </div>
                 <button onClick={() => setShowMap(false)} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#171717]/5 text-[#171717]/40 transition-colors">
                   <X className="w-4 h-4" />
                 </button>
              </div>
              <div className="flex-1 relative bg-[#E8EAE6]">
                 <CatalogMap 
                   experiences={filtered} 
                   selectedId={selectedExpId} 
                   onMarkerClick={(id) => handleSelectExperience(id)}
                   onEditClick={(id) => navigate(`/admin/experiences/${id}`)}
                   onListClick={handleShowInList}
                 />
                 
                 <div className="absolute bottom-4 left-4 right-14 pointer-events-none">
                    <div className="bg-white/90 backdrop-blur-md rounded-xl p-3 shadow-lg border border-white border-opacity-50 pointer-events-auto flex items-center justify-between">
                       <span className="text-[12px] font-bold text-[#171717]">
                         {validCoordinatesCount > 0 ? (
                           `${validCoordinatesCount} locais encontrados`
                         ) : (
                           <span className="text-rose-500">Nenhum dos resultados atuais possui coordenadas válidas.</span>
                         )}
                       </span>
                       {noCoordinatesCount > 0 && (
                         <span className="text-[11px] font-bold text-[#171717]/50 bg-[#171717]/5 px-2 py-1 rounded-md">
                           {noCoordinatesCount} s/ GPS
                         </span>
                       )}
                    </div>
                 </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
