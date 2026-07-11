import React, { useEffect, useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Plus, Search, Edit2, Trash2, MapPin, AlertCircle, CheckCircle2,
  Star, DollarSign, Eye, EyeOff, LayoutGrid, List, SlidersHorizontal,
  ArrowUpRight, Upload, ChevronRight, X
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { ContentNodeRow } from "@/repositories/ExperienceRepository";
import { NEW_YORK_NEIGHBORHOODS, getCategoryLabel } from "@/config/constants";
import { cn, isVideoUrl } from "@/lib/utils";
import { APIProvider, Map, AdvancedMarker } from "@vis.gl/react-google-maps";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type ViewMode = 'cards' | 'strips';

export default function HotelsList() {
  const navigate = useNavigate();
  const [hotels, setHotels] = useState<ContentNodeRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  const [viewMode, setViewMode] = useState<ViewMode>('cards');

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [neighborhoodFilter, setNeighborhoodFilter] = useState('all');
  const [minStars, setMinStars] = useState<number | null>(null);
  const [maxPrice, setMaxPrice] = useState<number>(1000);

  useEffect(() => { fetchHotels(); }, []);

  async function fetchHotels() {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.from('content_nodes').select('*').eq('type', 'hotel').order('title');
      if (error) throw error;
      setHotels(data || []);
    } catch { toast.error('Erro ao carregar hotéis.'); }
    finally { setIsLoading(false); }
  }

  const handleDelete = async () => {
    if (!itemToDelete) return;
    try {
      const { error } = await supabase.from('content_nodes').delete().eq('id', itemToDelete);
      if (error) throw error;
      setHotels(p => p.filter(e => e.id !== itemToDelete));
      toast.success('Hotel excluído.');
    } catch { toast.error('Falha ao excluir.'); }
    finally { setItemToDelete(null); }
  };

  const handleToggleStatus = async (exp: ContentNodeRow) => {
    const newStatus = exp.status === 'published' ? 'draft' : 'published';
    try {
      const { error } = await supabase.from('content_nodes').update({ status: newStatus }).eq('id', exp.id);
      if (error) throw error;
      setHotels(p => p.map(e => e.id === exp.id ? { ...e, status: newStatus } : e));
      toast.success(newStatus === 'published' ? 'Publicado!' : 'Despublicado.');
    } catch { toast.error('Falha ao atualizar status.'); }
  };

  const handleBulkPublish = async () => {
    const ids = Array.from(selectedIds);
    const { error } = await supabase.from('content_nodes').update({ status: 'published' }).in('id', ids);
    if (!error) {
      setHotels(p => p.map(e => selectedIds.has(e.id) ? { ...e, status: 'published' } : e));
      setSelectedIds(new Set());
      toast.success(`${ids.length} hotéis publicados.`);
    }
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedIds);
    const { error } = await supabase.from('content_nodes').delete().in('id', ids);
    if (!error) {
      setHotels(p => p.filter(e => !selectedIds.has(e.id)));
      setSelectedIds(new Set());
      toast.success(`${ids.length} excluídos.`);
    }
  };

  const filtered = useMemo(() => {
    return hotels.filter(e => {
      const translations = (e.translations as any) || {};
      const avgPrice = translations.average_price_usd ?? 0;
      const stars = translations.stars ?? 0;

      if (search && !e.title.toLowerCase().includes(search.toLowerCase())) return false;
      if (statusFilter !== 'all' && e.status !== statusFilter) return false;
      if (neighborhoodFilter !== 'all' && translations.neighborhood !== neighborhoodFilter) return false;
      if (minStars !== null && stars < minStars) return false;
      if (avgPrice > maxPrice) return false;
      return true;
    });
  }, [hotels, search, statusFilter, neighborhoodFilter, minStars, maxPrice]);

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length && filtered.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map(e => e.id)));
    }
  };

  const StarDisplay = ({ count }: { count: number }) => (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <Star key={s} className={cn("w-3.5 h-3.5", s <= count ? "text-amber-400 fill-amber-400" : "text-slate-200 fill-slate-200")} />
      ))}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6 vf-fade-in">

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#0F1117] tracking-tight">Hospedagens</h1>
          <p className="text-xs text-slate-400 mt-0.5">Gerencie o portfólio de hotéis e resorts de Nova York.</p>
        </div>
        <div className="flex items-center gap-2">
          {selectedIds.size > 0 && (
            <div className="bg-[#0F1117] text-white px-4 py-2 rounded-full flex items-center gap-3 text-xs font-bold shadow-md">
              <span>{selectedIds.size} selecionados</span>
              <div className="w-px h-4 bg-white/20" />
              <button onClick={handleBulkPublish} className="text-[#E2F18A] hover:underline">Publicar</button>
              <button onClick={handleBulkDelete} className="text-rose-400 hover:underline">Excluir</button>
              <button onClick={() => setSelectedIds(new Set())} className="text-white/40 hover:text-white">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          <Link to="/admin/experiences/new?type=hotel" className="vf-btn-primary text-xs px-4 py-2.5 shadow-sm">
            <Plus className="w-3.5 h-3.5" /> Adicionar Hotel
          </Link>
        </div>
      </div>

      {/* Drafts Banner */}
      {(() => {
        const draftCount = hotels.filter(e => e.status === 'draft').length;
        if (draftCount === 0) return null;
        return (
          <div className="flex items-center justify-between gap-4 px-5 py-4 rounded-[20px] border border-amber-200/80"
            style={{ background: 'linear-gradient(135deg, #FFFBEB 0%, #FEF9C3 100%)' }}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-[12px] bg-amber-100 flex items-center justify-center shrink-0">
                <Upload className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-black text-amber-900">{draftCount} hotéis em rascunho</p>
                <p className="text-[11px] text-amber-700/70">Aguardando revisão ou importados recentemente.</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={() => setStatusFilter('draft')}
                className="flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-bold bg-white border border-amber-300 text-amber-800 hover:bg-amber-50 transition-colors shadow-sm">
                Filtrar <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        );
      })()}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        
        {/* ── Left Sidebar (Filters & Map) ── */}
        <div className="lg:col-span-1 bg-white rounded-[24px] p-5 shadow-sm space-y-6 sticky top-6 border border-slate-100/50 hidden lg:block">
          
          {/* Map */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400 block px-1">Localização</label>
            <div className="relative rounded-[20px] h-48 bg-slate-100 border border-slate-200 overflow-hidden z-0">
              <APIProvider apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
                <Map defaultCenter={{ lat: 40.7580, lng: -73.9855 }} defaultZoom={12} mapId="HOTELS_MAP" disableDefaultUI={true}>
                  {filtered.map(hotel => hotel.location_lat && hotel.location_lng && (
                    <AdvancedMarker key={hotel.id} position={{ lat: hotel.location_lat, lng: hotel.location_lng }} title={hotel.title}>
                      <div className="w-5 h-5 bg-[#C4B5FD] border-2 border-black rounded-full shadow-md flex items-center justify-center text-[8px]">🏨</div>
                    </AdvancedMarker>
                  ))}
                </Map>
              </APIProvider>
            </div>
          </div>

          {/* Stars Filter */}
          <div className="space-y-2.5">
            <label className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400 block px-1">Categoria (Estrelas)</label>
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-xs text-slate-600 font-semibold cursor-pointer">
                <input type="radio" checked={minStars === null} onChange={() => setMinStars(null)} className="accent-black" />
                Todas as categorias
              </label>
              {[5, 4, 3].map(stars => (
                <label key={stars} className="flex items-center gap-2 text-xs text-slate-600 font-semibold cursor-pointer">
                  <input type="radio" checked={minStars === stars} onChange={() => setMinStars(stars)} className="accent-black" />
                  <StarDisplay count={stars} /> {stars}+ Estrelas
                </label>
              ))}
            </div>
          </div>

          {/* Price Max */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-500">Preço Máximo/Noite:</span>
              <span className="text-[#0F1117] font-black">${maxPrice}</span>
            </div>
            <input type="range" min="100" max="2000" step="50" value={maxPrice}
              onChange={e => setMaxPrice(parseInt(e.target.value))}
              className="w-full accent-black cursor-pointer" />
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold">
              <span>$100</span><span>$2000+</span>
            </div>
          </div>

          {/* Neighborhood */}
          <div className="space-y-2.5">
            <label className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400 block px-1">Bairro / Região</label>
            <select value={neighborhoodFilter} onChange={e => setNeighborhoodFilter(e.target.value)} className="vf-input text-xs py-2">
              <option value="all">Todos os Bairros</option>
              {NEW_YORK_NEIGHBORHOODS.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>

        </div>

        {/* ── Right Content ── */}
        <div className="lg:col-span-3 space-y-4">
          
          {/* Top Bar */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white rounded-[24px] p-4 shadow-sm border border-slate-100/50">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Buscar hotéis..." className="vf-input pl-9 text-xs py-2 w-full" />
              {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"><X className="w-3.5 h-3.5" /></button>}
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
              {isLoading ? '...' : `${filtered.length} listados`}
            </div>
            <div className="flex items-center gap-0.5 bg-slate-100 p-1 rounded-full">
              <button onClick={() => setViewMode('cards')} className={cn('w-7 h-7 rounded-full flex items-center justify-center transition-all', viewMode === 'cards' ? 'bg-black text-white' : 'text-slate-400')}><LayoutGrid className="w-3.5 h-3.5" /></button>
              <button onClick={() => setViewMode('strips')} className={cn('w-7 h-7 rounded-full flex items-center justify-center transition-all', viewMode === 'strips' ? 'bg-black text-white' : 'text-slate-400')}><List className="w-3.5 h-3.5" /></button>
            </div>
          </div>

          {/* List/Grid */}
          <div className="relative">
            {isLoading ? (
              <div className="flex justify-center h-64 items-center"><div className="vf-spinner" /></div>
            ) : filtered.length === 0 ? (
              <div className="bg-white rounded-[24px] p-12 text-center border border-slate-100 flex flex-col items-center">
                <div className="w-14 h-14 rounded-[18px] bg-indigo-50 flex items-center justify-center mb-3">
                  <SlidersHorizontal className="w-7 h-7 text-indigo-400" />
                </div>
                <p className="font-bold text-[#0F1117] text-sm">Nenhum hotel encontrado</p>
              </div>
            ) : viewMode === 'cards' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {filtered.map(hotel => {
                  const translations = (hotel.translations as any) || {};
                  const isSelected = selectedIds.has(hotel.id);
                  return (
                    <div key={hotel.id}
                      className={cn('bg-white rounded-[24px] overflow-hidden group cursor-pointer border hover:shadow-md transition-all',
                        isSelected ? 'border-[#C4B5FD] ring-2 ring-[#C4B5FD]/30' : 'border-transparent shadow-sm'
                      )}
                      onClick={() => navigate(`/admin/experiences/${hotel.id}?type=hotel`)}
                    >
                      <div className="relative h-48 bg-slate-100">
                        {translations.cover_url ? (
                          <img src={translations.cover_url} alt={hotel.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-indigo-50"><MapPin className="w-8 h-8 text-indigo-200" /></div>
                        )}
                        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full flex items-center shadow-sm">
                          <StarDisplay count={translations.stars || 4} />
                        </div>
                        <div className="absolute top-3 right-3" onClick={e => e.stopPropagation()}>
                          <input type="checkbox" checked={isSelected} onChange={(e) => {
                            const n = new Set(selectedIds);
                            if (n.has(hotel.id)) n.delete(hotel.id); else n.add(hotel.id);
                            setSelectedIds(n);
                          }} className="w-5 h-5 rounded-md border-white/50 accent-black drop-shadow-md cursor-pointer" />
                        </div>
                      </div>
                      <div className="p-4 space-y-2">
                        <div className="flex justify-between items-start gap-2">
                          <h3 className="font-black text-sm text-[#0F1117] line-clamp-1">{hotel.title}</h3>
                          <span className={cn("text-[9px] font-bold uppercase px-2 py-0.5 rounded-full flex-shrink-0",
                            hotel.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                          )}>{hotel.status === 'published' ? 'PUB' : 'RASC'}</span>
                        </div>
                        <div className="flex items-center gap-1 text-slate-400 text-[11px] font-semibold">
                          <MapPin className="w-3.5 h-3.5" />
                          <span>{translations.neighborhood || 'Nova York'}</span>
                        </div>
                        <div className="pt-3 mt-2 border-t border-slate-100 flex items-center justify-between">
                          <div>
                            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Diária Média</p>
                            <p className="font-black text-base text-[#0F1117]">${translations.average_price_usd ?? 0}</p>
                          </div>
                          <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                            <button onClick={() => handleToggleStatus(hotel)} className="p-1.5 rounded-full text-slate-400 hover:text-black hover:bg-slate-100">
                              {hotel.status === 'published' ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                            <button onClick={() => navigate(`/admin/experiences/${hotel.id}?type=hotel`)} className="p-1.5 rounded-full text-slate-400 hover:text-indigo-600 hover:bg-indigo-50">
                              <Edit2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map(hotel => {
                  const translations = (hotel.translations as any) || {};
                  return (
                    <div key={hotel.id} onClick={() => navigate(`/admin/experiences/${hotel.id}?type=hotel`)}
                      className={cn("vf-strip flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-slate-50 transition-all border border-transparent", selectedIds.has(hotel.id) && "border-[#C4B5FD] bg-indigo-50/30")}>
                      <div onClick={e => e.stopPropagation()} className="flex items-center">
                        <input type="checkbox" checked={selectedIds.has(hotel.id)} onChange={() => {
                          const n = new Set(selectedIds);
                          if (n.has(hotel.id)) n.delete(hotel.id); else n.add(hotel.id);
                          setSelectedIds(n);
                        }} className="accent-black w-4 h-4 rounded-md" />
                      </div>
                      <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">
                        {translations.cover_url ? <img src={translations.cover_url} className="w-full h-full object-cover" /> : <MapPin className="w-6 h-6 m-auto mt-4 text-slate-300" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-[#0F1117] text-sm truncate">{hotel.title}</p>
                        <div className="flex items-center gap-3 mt-1 flex-wrap text-slate-400">
                          <span className="flex items-center gap-1 text-[11px]"><MapPin className="w-3 h-3" /> {translations.neighborhood || 'Nova York'}</span>
                          <StarDisplay count={translations.stars || 4} />
                        </div>
                      </div>
                      <div className="hidden md:flex items-center gap-6 flex-shrink-0">
                        <span className="font-black text-sm text-[#0F1117]">${translations.average_price_usd ?? 0}/noite</span>
                        <span className={cn("vf-pill", hotel.status === 'published' ? 'vf-pill-green' : 'vf-pill-slate')}>{hotel.status}</span>
                      </div>
                      <div onClick={e => e.stopPropagation()} className="flex items-center gap-2">
                        <button onClick={() => navigate(`/admin/experiences/${hotel.id}?type=hotel`)} className="p-2 text-slate-400 hover:text-black bg-white rounded-full shadow-sm"><Edit2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <AlertDialog open={!!itemToDelete} onOpenChange={open => !open && setItemToDelete(null)}>
        <AlertDialogContent className="rounded-[24px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-black">Excluir hotel?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação é permanente e não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="rounded-full bg-rose-600 hover:bg-rose-700 text-white">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
