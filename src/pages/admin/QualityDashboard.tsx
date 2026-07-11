// @ts-nocheck
import React, { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { RefreshCcw, MapPin, Clock, Tag, AlertCircle, CheckCircle2, ArrowUpRight, Star, Link2, Copy, ChevronDown, ChevronUp, BrainCircuit } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { ContentNodeRow } from "@/repositories/ExperienceRepository";
import { cn } from "@/lib/utils";

// ─── SVG Circular Score ───────────────────────────────────────────────────────
function ScoreRing({ score, size = 120 }: { score: number; size?: number }) {
  const r = size * 0.38;
  const cx = size / 2;
  const circumference = 2 * Math.PI * r;
  const dashoffset = circumference * (1 - score / 100);
  const color = score >= 90 ? '#7CFE9D' : score >= 70 ? '#E2F18A' : '#FFB3B3';

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cx} r={r} fill="none" stroke="#E8EAF0" strokeWidth={size * 0.075} />
      <circle
        cx={cx} cy={cx} r={r} fill="none"
        stroke={color} strokeWidth={size * 0.075}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={dashoffset}
        transform={`rotate(-90 ${cx} ${cx})`}
        style={{ transition: 'stroke-dashoffset 1s ease' }}
      />
      <text x={cx} y={cx - 4} textAnchor="middle" dominantBaseline="middle"
        fontSize={size * 0.22} fontWeight="900" fontFamily="Urbanist, sans-serif" fill="#0F1117">
        {Math.round(score)}
      </text>
      <text x={cx} y={cx + size * 0.16} textAnchor="middle" dominantBaseline="middle"
        fontSize={size * 0.09} fontWeight="700" fontFamily="Urbanist, sans-serif" fill="#94A3B8">
        / 100
      </text>
    </svg>
  );
}

// ─── Issue Card ───────────────────────────────────────────────────────────────
function IssueCard({ title, count, total, icon: Icon, bg, color, onClick, active }: {
  title: string; count: number; total: number;
  icon: React.ElementType; bg: string; color: string;
  onClick?: () => void;
  active?: boolean;
}) {
  const pct = total > 0 ? Math.round(((total - count) / total) * 100) : 100;
  return (
    <button
      onClick={onClick}
      className={cn('rounded-[24px] p-5 text-left w-full transition-all duration-200 hover:-translate-y-1 hover:shadow-md',
        count === 0 ? 'opacity-60' : '',
        active ? 'ring-2 ring-offset-2 ring-black' : '')}
      style={{ background: count === 0 ? '#F4FBF7' : bg, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
      disabled={count === 0}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="w-9 h-9 rounded-[12px] flex items-center justify-center bg-white/60">
          {count === 0
            ? <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            : <Icon className={cn("w-4 h-4", color)} />
          }
        </div>
        <span className="text-[10px] font-black text-black/30">{pct}% ok</span>
      </div>
      <p className="text-2xl font-black text-[#0F1117]">{count}</p>
      <p className="text-[11px] font-semibold text-black/50 mt-0.5">{title}</p>
      <div className="mt-3 h-1.5 rounded-full bg-black/10 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: count === 0 ? '#7CFE9D' : '#E2F18A' }} />
      </div>
    </button>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/\(.*?\)/g, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

function findDuplicatePairs(experiences: ContentNodeRow[]): Array<[ContentNodeRow, ContentNodeRow]> {
  const pairs: Array<[ContentNodeRow, ContentNodeRow]> = [];
  const seen = new Map<string, ContentNodeRow>();
  for (const exp of experiences) {
    const key = normalizeTitle(exp.title);
    if (key.length < 4) continue;
    if (seen.has(key)) {
      pairs.push([seen.get(key)!, exp]);
    } else {
      seen.set(key, exp);
    }
  }
  return pairs;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function QualityDashboard() {
  const [experiences, setExperiences] = useState<ContentNodeRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEnriching, setIsEnriching] = useState(false);
  const [isReframing, setIsReframing] = useState(false);
  const [showDuplicates, setShowDuplicates] = useState(false);
  const navigate = useNavigate();

  useEffect(() => { fetchExperiences(); }, []);

  const handleEnrichCatalog = async () => {
    setIsEnriching(true);
    const toastId = toast.loading('Buscando dados no Google Maps e gerando campos IA...');
    try {
      const { data, error } = await supabase.functions.invoke('enrich-catalog');
      if (error) throw error;
      toast.success(data.message, { id: toastId });
      if (data.updated > 0) fetchExperiences();
    } catch (err: any) {
      toast.error(err.message || 'Falha ao enriquecer catálogo.', { id: toastId });
    } finally {
      setIsEnriching(false);
    }
  };

  async function fetchExperiences() {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.from('content_nodes').select('*').neq('type', 'hotel');
      if (error) throw error;
      setExperiences(data as ContentNodeRow[]);
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  }

  const handleReframeTaxonomy = async () => {
    setIsReframing(true);
    const toastId = toast.loading('IA revisando taxonomia e perfis...');
    try {
      const { data, error } = await supabase.functions.invoke('reframe-taxonomy');
      if (error) throw error;
      if (data.count === 0) {
        toast.success('Taxonomia perfeita — nenhuma revisão necessária!', { id: toastId });
      } else {
        const remainingMsg = data.remaining > 0 ? ` (${data.remaining} ainda pendentes — rode novamente)` : '';
        toast.success(`${data.count} experiências reclassificadas.${remainingMsg}`, { id: toastId, duration: 6000 });
      }
      fetchExperiences();
    } catch (err: any) {
      toast.error(`Erro na Revisão: ${err.message}`, { id: toastId });
    } finally {
      setIsReframing(false);
    }
  };

  const total = experiences.length;
  
  // Checking fields within translations
  const getTr = (e: ContentNodeRow) => (e.translations as any) || {};

  const noCoords     = experiences.filter(e => !e.location_lat || !e.location_lng);
  const noDuration   = experiences.filter(e => !getTr(e).duration_minutes);
  const noCategory   = experiences.filter(e => !getTr(e).tags?.length); // we use tags for categorization now
  const noNeighbor   = experiences.filter(e => !getTr(e).neighborhood);
  const noDesc       = experiences.filter(e => !e.description || e.description.length < 20);
  const noMedia      = experiences.filter(e => !getTr(e).media_urls || getTr(e).media_urls.length === 0);
  const noRating     = experiences.filter(e => getTr(e).rating === undefined || getTr(e).reviews_count === undefined);
  const noAddress    = experiences.filter(e => !e.address);
  const noBookingUrl = experiences.filter(e => !getTr(e).affiliateLink);
  const noAIEngine   = experiences.filter(e => !getTr(e).personaWeights || !getTr(e).recommendedSeasons);

  const duplicatePairs = useMemo(() => findDuplicatePairs(experiences), [experiences]);

  const totalIssues = noCoords.length * 2 + noDuration.length + noCategory.length + noNeighbor.length + noRating.length + noAddress.length + noBookingUrl.length * 0.5 + noAIEngine.length * 2 + duplicatePairs.length;
  const maxPenalty  = total * 9.5;
  const score       = total === 0 ? 100 : Math.max(0, Math.round(((maxPenalty - totalIssues) / maxPenalty) * 100));

  const critical = experiences
    .map(e => {
      const tr = getTr(e);
      const missing = [
        !e.location_lat && 'GPS',
        !tr.duration_minutes && 'Duração',
        !tr.neighborhood && 'Bairro',
        !tr.tags?.length && 'Tags',
        !e.description && 'Descrição',
        (!tr.rating || !tr.reviews_count) && 'Avaliações',
        !e.address && 'Endereço',
        (!tr.media_urls || tr.media_urls.length === 0) && 'Fotos',
        !tr.affiliateLink && 'Link de Venda',
        (!tr.personaWeights || !tr.recommendedSeasons) && 'IA Profiling (Engine)',
      ].filter(Boolean) as string[];
      return { ...e, missing, score: missing.length };
    })
    .filter(e => e.missing.length > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="vf-spinner" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4 vf-fade-in max-w-6xl mx-auto">

      {/* ── Header ───────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#0F1117] tracking-tight">Concierge AI Health</h1>
          <p className="text-xs text-slate-400 mt-0.5">{total} experiências operando na Engine</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleReframeTaxonomy} disabled={isReframing || isEnriching}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-slate-900 border border-slate-900 text-sm font-bold text-white hover:bg-slate-800 transition-all shadow-sm disabled:opacity-50">
            {isReframing ? <span className="animate-pulse">A IA está revisando...</span> : <><BrainCircuit className="w-4 h-4 text-[#7CFE9D]" /> Treinar IA / Taxonomia</>}
          </button>
          <button onClick={handleEnrichCatalog} disabled={isEnriching || isReframing}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white border border-slate-200 text-sm font-bold text-[#0F1117] hover:border-slate-300 transition-all shadow-sm disabled:opacity-50">
            {isEnriching ? <span className="animate-pulse">Enriquecendo...</span> : <><Star className="w-4 h-4 text-amber-400 fill-amber-400" /> Auto-Completar (IA)</>}
          </button>
          <button onClick={fetchExperiences} disabled={isEnriching || isReframing}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white border border-transparent text-sm font-bold text-slate-500 hover:text-[#0F1117] transition-all"
            style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.07)' }}>
            <RefreshCcw className="w-3.5 h-3.5" /> Atualizar
          </button>
        </div>
      </div>

      {/* ── Hero Score + Issues ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="rounded-[24px] p-6 flex flex-col items-center justify-center text-center"
          style={{ background: score >= 90 ? '#F4FBF7' : score >= 70 ? '#FEFCE8' : '#FFF1F1',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <ScoreRing score={score} size={130} />
          <p className="font-black text-[#0F1117] mt-3">Saúde do Motor (AI Matching)</p>
          <p className="text-[11px] text-slate-500 mt-1">
            {score >= 95 ? '✅ Excelente — Engine com dados perfeitos' :
             score >= 80 ? '⚠️ Bom, mas o matching pode falhar em nichos' :
             '🔴 Corrija os campos para a IA poder sugerir atrações'}
          </p>
        </div>
        <div className="lg:col-span-2 grid grid-cols-2 gap-3">
          <IssueCard title="Falta IA Engine (Personas/Tags)" count={noAIEngine.length} total={total}
            icon={BrainCircuit} bg="#F0EDFF" color="text-violet-500"
            onClick={() => navigate('/admin/experiences')} />
          <IssueCard title="Sem Coordenadas GPS" count={noCoords.length} total={total}
            icon={MapPin} bg="#FFF1F1" color="text-rose-500"
            onClick={() => navigate('/admin/experiences')} />
          <IssueCard title="Sem Tags ou Categorias" count={noCategory.length} total={total}
            icon={Tag} bg="#FFF5ED" color="text-orange-500"
            onClick={() => navigate('/admin/experiences')} />
          <IssueCard title="Sem Duração/Tempo" count={noDuration.length} total={total}
            icon={Clock} bg="#FEFCE8" color="text-amber-500"
            onClick={() => navigate('/admin/experiences')} />
        </div>
      </div>

      {/* ── Secondary metrics ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { title: 'Sem Descrição Longa', count: noDesc.length,      bg: '#FAF8F3' },
          { title: 'Sem Mídias/Vídeos',  count: noMedia.length,     bg: '#FAF8F3' },
          { title: 'Sem Rating do Google', count: noRating.length,  bg: '#FFF1F1' },
          { title: 'Sem Endereço Exato', count: noAddress.length,   bg: '#FEFCE8' },
          { title: 'Sem Bairro Definido',count: noNeighbor.length,  bg: '#F0EDFF' },
          { title: '100% Otimizados IA', count: total - critical.length, bg: '#F4FBF7' },
        ].map(item => (
          <div key={item.title} className="rounded-[24px] px-5 py-4"
            style={{ background: item.bg, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <p className="text-2xl font-black text-[#0F1117]">{item.count}</p>
            <p className="text-[11px] font-semibold text-black/40 mt-0.5">{item.title}</p>
          </div>
        ))}

        {/* Sem Link de Venda */}
        <div
          className="rounded-[24px] px-5 py-4 cursor-pointer hover:shadow-md transition-all duration-200"
          style={{ background: '#FFFBEB', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
          onClick={() => navigate('/admin/experiences')}
        >
          <div className="flex items-center gap-1.5 mb-1">
            <Link2 className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-[9px] font-black uppercase tracking-widest text-amber-600">Receita</span>
          </div>
          <p className="text-2xl font-black text-[#0F1117]">{noBookingUrl.length}</p>
          <p className="text-[11px] font-semibold text-black/40 mt-0.5">Sem Link de Afiliado</p>
          <div className="mt-3 h-1.5 rounded-full bg-amber-100 overflow-hidden">
            <div className="h-full rounded-full bg-amber-300 transition-all duration-700"
              style={{ width: `${total > 0 ? Math.round(((total - noBookingUrl.length) / total) * 100) : 100}%` }} />
          </div>
        </div>

        {/* Possíveis Duplicatas */}
        <div
          className={cn(
            "rounded-[24px] px-5 py-4 cursor-pointer hover:shadow-md transition-all duration-200",
            showDuplicates ? 'ring-2 ring-violet-300' : ''
          )}
          style={{ background: duplicatePairs.length === 0 ? '#F4FBF7' : '#F5F0FF', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
          onClick={() => duplicatePairs.length > 0 && setShowDuplicates(s => !s)}
        >
          <div className="flex items-center gap-1.5 mb-1">
            <Copy className="w-3.5 h-3.5 text-violet-500" />
            <span className="text-[9px] font-black uppercase tracking-widest text-violet-600">Catálogo</span>
          </div>
          <p className="text-2xl font-black text-[#0F1117]">{duplicatePairs.length}</p>
          <p className="text-[11px] font-semibold text-black/40 mt-0.5">Possíveis Duplicatas</p>
          <div className="mt-3 h-1.5 rounded-full bg-violet-100 overflow-hidden">
            <div className="h-full rounded-full bg-violet-300 transition-all duration-700"
              style={{ width: duplicatePairs.length === 0 ? '100%' : `${Math.round((1 - duplicatePairs.length / total) * 100)}%` }} />
          </div>
          {duplicatePairs.length > 0 && (
            <div className="mt-2 flex items-center gap-1 text-[10px] font-bold text-violet-500">
              {showDuplicates ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              {showDuplicates ? 'Esconder' : 'Ver pares'}
            </div>
          )}
        </div>
      </div>

      {/* ── Duplicate Pairs Panel ─────────────────────────────────────── */}
      {showDuplicates && duplicatePairs.length > 0 && (
        <div className="rounded-[24px] overflow-hidden border border-violet-100"
          style={{ background: '#FDFBFF', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <div className="px-6 py-4 border-b border-violet-100">
            <h2 className="font-black text-sm text-[#0F1117]">Pares com Títulos Similares</h2>
            <p className="text-[11px] text-slate-400">Revise e decida quais manter. Itens com contexto diferente (ex: pôr do sol) podem coexistir.</p>
          </div>
          <div className="divide-y divide-violet-50">
            {duplicatePairs.map(([a, b], i) => (
              <div key={i} className="px-6 py-4 grid grid-cols-2 gap-4">
                {[a, b].map(exp => {
                  const tr = getTr(exp);
                  return (
                  <div key={exp.id} className="flex items-start gap-3 group">
                    <div className="w-9 h-9 rounded-[12px] flex-shrink-0 overflow-hidden bg-slate-100">
                      {tr.media_urls?.[0]
                        ? <img src={tr.media_urls[0]} alt={exp.title} className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-slate-300 text-xs">?</div>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-xs text-[#0F1117] line-clamp-1">{exp.title}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{exp.status} · {tr.neighborhood || '—'}</p>
                    </div>
                    <Link to={`/admin/experiences/${exp.id}`}
                      className="flex items-center gap-1 text-[10px] font-black text-slate-300 hover:text-violet-600 transition-colors opacity-0 group-hover:opacity-100 shrink-0">
                      Ver <ArrowUpRight className="w-3 h-3" />
                    </Link>
                  </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Critical list ─────────────────────────────────────────────── */}
      {critical.length > 0 && (
        <div className="rounded-[24px] overflow-hidden"
          style={{ background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <div className="px-6 py-4 border-b border-[#F0F2F5]">
            <h2 className="font-black text-sm text-[#0F1117]">Registros Críticos para a Inteligência</h2>
            <p className="text-[11px] text-slate-400">Ordenados por gravidade. Estas atrações não aparecerão nos roteiros até serem corrigidas.</p>
          </div>
          <div className="divide-y divide-[#F0F2F5]">
            {critical.map(exp => {
              const tr = getTr(exp);
              return (
              <div key={exp.id}
                className="px-6 py-4 flex items-center gap-4 hover:bg-[#F0F2F5]/50 transition-colors group">
                <div className="w-9 h-9 rounded-[12px] flex-shrink-0 overflow-hidden bg-slate-100">
                  {tr.media_urls?.[0]
                    ? <img src={tr.media_urls[0]} alt={exp.title} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-slate-300 text-xs">?</div>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-[#0F1117] truncate">{exp.title}</p>
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {exp.missing.map((m: string) => (
                      <span key={m} className={cn(
                        "vf-pill text-[9px]",
                        m === 'IA Profiling (Engine)' ? 'bg-violet-100 text-violet-700' :
                        m === 'Link de Venda' ? 'bg-amber-100 text-amber-700' : 'vf-pill-rose'
                      )}>{m}</span>
                    ))}
                  </div>
                </div>
                <Link to={`/admin/experiences/${exp.id}`}
                  className="flex items-center gap-1 text-[11px] font-black text-slate-300 hover:text-[#0F1117] transition-colors opacity-0 group-hover:opacity-100">
                  Corrigir <ArrowUpRight className="w-3 h-3" />
                </Link>
              </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
