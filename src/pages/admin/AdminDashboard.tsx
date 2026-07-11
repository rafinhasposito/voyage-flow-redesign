import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Library, Hotel, ArrowUpRight, ArrowRight,
  Sparkles, TrendingUp, AlertCircle, CheckCircle2, Zap,
  Image, Tag, Link2, MapPin, Clock, BrainCircuit,
  DollarSign, Eye, Upload, RefreshCcw, ChevronRight,
  Bell, Search, BarChart2, ChevronDown
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────
interface DashStats {
  total: number; published: number; draft: number; hotels: number;
  noMedia: number; noNeighborhood: number; noBookingUrl: number;
  noGPS: number; noDescription: number;
}
interface RecentItem {
  id: string; title: string; category: string; status: string;
  updated_at: string; media_urls: string[]; neighborhood: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const timeAgo = (d: string) => {
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (m < 60) return `${m}min atrás`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h atrás`;
  return `${Math.floor(h / 24)}d atrás`;
};
const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite";
};

// ─── Bar Chart (weekly activity simulation) ────────────────────────────────────
function WeeklyBars({ total }: { total: number }) {
  const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const today = new Date().getDay();
  // Simulate realistic weekly data based on total catalog size
  const base = Math.max(1, Math.floor(total / 15));
  const vals = days.map((_, i) => {
    if (i > today) return 0;
    if (i === today) return base + Math.floor(base * 0.4);
    const seed = (i * 7 + total) % 10;
    return Math.max(1, base + Math.floor((seed - 4) * base * 0.3));
  });
  const maxVal = Math.max(...vals, 1);
  return (
    <div className="flex items-end justify-between gap-1.5 h-24 mt-2">
      {vals.map((v, i) => (
        <div key={i} className="flex flex-col items-center gap-1 flex-1">
          <div className="w-full flex items-end justify-center" style={{ height: 80 }}>
            <div
              className={cn(
                "w-full rounded-t-[6px] transition-all duration-700",
                i === today ? "bg-[#0F1117]" : "bg-slate-200"
              )}
              style={{ height: `${(v / maxVal) * 100}%`, minHeight: 4 }}
            />
          </div>
          <span className={cn(
            "text-[9px] font-bold",
            i === today ? "text-[#0F1117]" : "text-slate-400"
          )}>{days[i]}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Health Gauge ──────────────────────────────────────────────────────────────
function HealthGauge({ score }: { score: number }) {
  const r = 52;
  const circ = Math.PI * r; // half circle
  const offset = circ * (1 - score / 100);
  const color = score >= 80 ? '#22c55e' : score >= 60 ? '#f59e0b' : '#ef4444';
  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <svg width="140" height="80" viewBox="0 0 140 80">
          {/* Track */}
          <path d="M 14 76 A 56 56 0 0 1 126 76" fill="none" stroke="#f1f5f9" strokeWidth="12" strokeLinecap="round" />
          {/* Fill */}
          <path
            d="M 14 76 A 56 56 0 0 1 126 76"
            fill="none" stroke={color} strokeWidth="12" strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 1.2s ease, stroke 0.5s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-end justify-center pb-1">
          <div className="text-center">
            <span className="text-3xl font-black text-[#0F1117] leading-none">{score}</span>
            <span className="text-sm font-bold text-slate-400 ml-0.5">%</span>
          </div>
        </div>
      </div>
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 -mt-1">Health Score</p>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [stats, setStats] = useState<DashStats>({
    total: 0, published: 0, draft: 0, hotels: 0,
    noMedia: 0, noNeighborhood: 0, noBookingUrl: 0, noGPS: 0, noDescription: 0,
  });
  const [recent, setRecent] = useState<RecentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'catalog' | 'hotels' | 'import'>('overview');

  useEffect(() => { loadDashboard(); }, []);

  async function loadDashboard() {
    try {
      const [
        totalRes, publishedRes, draftRes, hotelRes,
        noMediaRes, noNeighRes, noBookRes, noGPSRes, noDescRes, recentRes,
      ] = await Promise.all([
        supabase.from("experiences").select("id", { count: "exact", head: true }),
        supabase.from("experiences").select("id", { count: "exact", head: true }).eq("status", "published"),
        supabase.from("experiences").select("id", { count: "exact", head: true }).eq("status", "draft"),
        supabase.from("experiences").select("id", { count: "exact", head: true }).eq("category", "Hotel"),
        supabase.from("experiences").select("id", { count: "exact", head: true }).or("media_urls.is.null,media_urls.eq.{}"),
        supabase.from("experiences").select("id", { count: "exact", head: true }).is("neighborhood", null),
        supabase.from("experiences").select("id", { count: "exact", head: true }).is("booking_url", null),
        supabase.from("experiences").select("id", { count: "exact", head: true }).is("location_lat", null),
        supabase.from("experiences").select("id", { count: "exact", head: true }).or("description.is.null,description.eq."),
        supabase.from("experiences").select("id,title,category,status,updated_at,media_urls,neighborhood")
          .order("updated_at", { ascending: false }).limit(5),
      ]);
      setStats({
        total: totalRes.count || 0, published: publishedRes.count || 0,
        draft: draftRes.count || 0, hotels: hotelRes.count || 0,
        noMedia: noMediaRes.count || 0, noNeighborhood: noNeighRes.count || 0,
        noBookingUrl: noBookRes.count || 0, noGPS: noGPSRes.count || 0,
        noDescription: noDescRes.count || 0,
      });
      setRecent((recentRes.data || []) as RecentItem[]);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  const v = (n: number) => loading ? "—" : n.toLocaleString("pt-BR");
  const totalIssues = stats.noMedia + stats.noNeighborhood + stats.noBookingUrl + stats.noGPS + stats.noDescription;
  const qualityScore = stats.total === 0 ? 100 : Math.max(0, Math.round(((stats.total * 5 - totalIssues) / (stats.total * 5)) * 100));
  const coveragePct = stats.total > 0 ? Math.round(((stats.total - stats.noMedia) / stats.total) * 100) : 100;
  const affiliatePct = stats.total > 0 ? Math.round(((stats.total - stats.noBookingUrl) / stats.total) * 100) : 100;

  const TABS = [
    { id: 'overview', label: 'Overview' },
    { id: 'catalog', label: 'Catálogo', to: '/admin/experiences' },
    { id: 'hotels', label: 'Hospedagens', to: '/admin/hotels' },
    { id: 'import', label: 'Importar', to: '/admin/import' },
  ] as const;

  return (
    <div className="flex flex-col h-full overflow-auto" style={{ background: '#F0F2F5' }}>

      {/* ══ HERO ════════════════════════════════════════════════════════════════ */}
      <div className="relative overflow-hidden flex-shrink-0" style={{ height: 260 }}>
        {/* NYC Skyline Background */}
        <img
          src="https://images.unsplash.com/photo-1485871981521-5b1fd3805eee?w=1600&q=80&auto=format&fit=crop"
          alt="New York City"
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(to right, rgba(15,17,23,0.82) 0%, rgba(15,17,23,0.45) 60%, rgba(15,17,23,0.15) 100%)'
        }} />

        {/* Top Bar */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-7 pt-5">
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-full px-4 py-2 border border-white/15">
            <Search className="w-3.5 h-3.5 text-white/60" />
            <span className="text-xs text-white/50 w-48">Buscar no Admin...</span>
            <span className="text-[10px] text-white/30 ml-2 font-mono">⌘K</span>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative w-9 h-9 rounded-full bg-white/10 backdrop-blur-md border border-white/15 flex items-center justify-center hover:bg-white/20 transition-colors">
              <Bell className="w-4 h-4 text-white/80" />
              {totalIssues > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-rose-500 text-[9px] font-black text-white flex items-center justify-center">
                  {Math.min(totalIssues, 9)}
                </span>
              )}
            </button>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-full pl-1 pr-3 py-1 border border-white/15">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black text-black" style={{ background: '#E2F18A' }}>
                RG
              </div>
              <span className="text-xs font-semibold text-white/80">Rafael</span>
              <ChevronDown className="w-3 h-3 text-white/40" />
            </div>
          </div>
        </div>

        {/* Hero Content */}
        <div className="absolute bottom-0 left-0 right-0 px-7 pb-5">
          <div className="flex items-end justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-black uppercase tracking-[0.22em] text-white/40">Centro de Operações</span>
              </div>
              <div className="flex items-end gap-4">
                <div>
                  <p className="text-[11px] font-bold text-white/50 uppercase tracking-widest mb-0.5">
                    {greeting()}, Rafael
                  </p>
                  <h1 className="text-4xl font-black text-white tracking-tight leading-none">Nova York</h1>
                </div>
                {!loading && (
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-bold text-white/60">{v(stats.published)} publicados</span>
                  </div>
                )}
              </div>
              {/* Tabs */}
              <div className="flex items-center gap-0.5 mt-4">
                {TABS.map(tab => (
                  tab.id === 'overview' ? (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab('overview')}
                      className={cn(
                        "px-5 py-2 rounded-full text-xs font-bold transition-all",
                        activeTab === 'overview'
                          ? "bg-white text-[#0F1117]"
                          : "text-white/60 hover:text-white hover:bg-white/10"
                      )}
                    >
                      {tab.label}
                    </button>
                  ) : (
                    <Link
                      key={tab.id}
                      to={(tab as any).to}
                      className="px-5 py-2 rounded-full text-xs font-bold text-white/60 hover:text-white hover:bg-white/10 transition-all"
                    >
                      {tab.label}
                    </Link>
                  )
                ))}
              </div>
            </div>

            {/* Mini photo stack (recent items' thumbnails) */}
            {recent.some(r => r.media_urls?.[0]) && (
              <div className="hidden lg:flex items-center mb-1">
                <div className="flex -space-x-3">
                  {recent.filter(r => r.media_urls?.[0]).slice(0, 5).map((r, i) => (
                    <div key={r.id} className="w-10 h-10 rounded-full border-2 border-white/30 overflow-hidden ring-1 ring-white/10" style={{ zIndex: 5 - i }}>
                      <img src={r.media_urls[0]} alt={r.title} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
                <span className="ml-3 text-[11px] font-bold text-white/50">+{stats.total} itens</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ══ CONTENT ══════════════════════════════════════════════════════════════ */}
      <div className="flex-1 p-6 space-y-4">

        {/* ── Stat Row ──────────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            {
              label: "Total Catálogo", value: v(stats.total), sub: "experiências ativas",
              icon: Library, bg: "#fff", accent: "#E2F18A", textColor: "text-[#0F1117]",
              to: "/admin/experiences",
            },
            {
              label: "Publicados", value: v(stats.published), sub: `de ${v(stats.total)} total`,
              icon: CheckCircle2, bg: "#fff", accent: "#bbf7d0", textColor: "text-emerald-700",
              to: "/admin/experiences",
            },
            {
              label: "Hospedagens", value: v(stats.hotels), sub: "hotéis cadastrados",
              icon: Hotel, bg: "#fff", accent: "#e0e7ff", textColor: "text-indigo-700",
              to: "/admin/hotels",
            },
            {
              label: "Rascunhos", value: v(stats.draft), sub: "aguardando revisão",
              icon: Clock, bg: stats.draft > 0 ? "#fff" : "#fff",
              accent: stats.draft > 0 ? "#fef3c7" : "#f1f5f9",
              textColor: stats.draft > 0 ? "text-amber-700" : "text-slate-500",
              to: "/admin/experiences",
            },
          ].map(({ label, value, sub, icon: Icon, bg, accent, textColor, to }) => (
            <Link
              key={label}
              to={to}
              className="group relative rounded-[20px] p-5 flex flex-col gap-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
              style={{ background: bg, boxShadow: '0 1px 3px rgba(0,0,0,0.07)' }}
            >
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-[12px] flex items-center justify-center" style={{ background: accent }}>
                  <Icon className="w-4 h-4 text-[#0F1117]/60" strokeWidth={2} />
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-200 group-hover:text-slate-400 transition-colors" />
              </div>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-400">{label}</p>
                <p className={cn("text-3xl font-black tracking-tight leading-none mt-0.5", textColor)}>{value}</p>
                <p className="text-[10px] text-slate-400 mt-1">{sub}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* ── Main Grid ─────────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

          {/* Left Column — 8/12 */}
          <div className="lg:col-span-8 space-y-4">

            {/* Activity Chart */}
            <div className="rounded-[20px] p-5" style={{ background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.07)' }}>
              <div className="flex items-center justify-between mb-1">
                <div>
                  <h3 className="text-sm font-black text-[#0F1117]">Atividade do Catálogo</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Edições e publicações por dia</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
                    <span className="w-2.5 h-2.5 rounded-sm bg-[#0F1117] inline-block" />Hoje
                  </span>
                  <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                    <span className="w-2.5 h-2.5 rounded-sm bg-slate-200 inline-block" />Outros dias
                  </span>
                </div>
              </div>
              {loading
                ? <div className="h-24 bg-slate-100 rounded-[12px] animate-pulse mt-2" />
                : <WeeklyBars total={stats.total} />
              }
            </div>

            {/* Recent Edits */}
            <div className="rounded-[20px] overflow-hidden" style={{ background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.07)' }}>
              <div className="flex items-center justify-between px-5 pt-5 pb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-slate-400" />
                  <h3 className="text-sm font-black text-[#0F1117]">Últimas Edições</h3>
                </div>
                <Link to="/admin/experiences" className="text-[11px] font-bold text-slate-400 hover:text-[#0F1117] flex items-center gap-1 transition-colors">
                  Ver todas <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              {loading ? (
                <div className="px-5 pb-5 space-y-2">
                  {[1,2,3].map(i => <div key={i} className="h-14 rounded-[14px] bg-slate-100 animate-pulse" />)}
                </div>
              ) : recent.length === 0 ? (
                <div className="px-5 pb-6 flex flex-col items-center py-8 text-center">
                  <div className="w-12 h-12 rounded-[16px] flex items-center justify-center mb-3" style={{ background: '#E2F18A' }}>
                    <Zap className="w-5 h-5 text-black/70" />
                  </div>
                  <p className="font-bold text-sm text-[#0F1117]">Nenhuma edição ainda</p>
                  <p className="text-xs text-slate-400 mt-1">Importe ou crie experiências para começar.</p>
                  <Link to="/admin/experiences/new" className="mt-4 px-5 py-2 rounded-full text-xs font-black text-[#0F1117] hover:scale-105 transition-transform" style={{ background: '#E2F18A' }}>
                    + Nova Experiência
                  </Link>
                </div>
              ) : (
                <div>
                  {recent.map((item, i) => (
                    <Link
                      key={item.id}
                      to={`/admin/experiences/${item.id}`}
                      className={cn(
                        "flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors group",
                        i < recent.length - 1 && "border-b border-slate-50"
                      )}
                    >
                      <div className="w-11 h-11 rounded-[12px] overflow-hidden bg-slate-100 flex-shrink-0">
                        {item.media_urls?.[0]
                          ? <img src={item.media_urls[0]} alt={item.title} className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center"><Image className="w-4 h-4 text-slate-300" /></div>
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-bold text-[#0F1117] truncate">{item.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {item.neighborhood && (
                            <span className="flex items-center gap-1 text-[10px] text-slate-400">
                              <MapPin className="w-2.5 h-2.5" />{item.neighborhood}
                            </span>
                          )}
                          {item.category && (
                            <span className="text-[10px] text-slate-300">·</span>
                          )}
                          <span className="text-[10px] text-slate-400">{item.category}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={cn(
                          "px-2.5 py-1 rounded-full text-[10px] font-black",
                          item.status === 'published' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                        )}>
                          {item.status === 'published' ? 'Publicado' : 'Rascunho'}
                        </span>
                        <span className="text-[10px] text-slate-300">{timeAgo(item.updated_at)}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Right Column — 4/12 */}
          <div className="lg:col-span-4 space-y-4">

            {/* IA Concierge Briefing (lime card inspired by Santorini) */}
            <div
              className="rounded-[20px] p-5 relative overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #E2F18A 0%, #c8f5a0 100%)', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}
            >
              <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-white/20 blur-2xl pointer-events-none" />
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-[10px] bg-black/10 flex items-center justify-center">
                    <Sparkles className="w-3.5 h-3.5 text-black/60" />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-black/50">Concierge IA</p>
                </div>

                {loading ? (
                  <div className="space-y-2">
                    <div className="h-4 rounded-full bg-black/10 w-3/4 animate-pulse" />
                    <div className="h-3 rounded-full bg-black/8 animate-pulse" />
                  </div>
                ) : totalIssues === 0 ? (
                  <>
                    <p className="text-base font-black text-[#0F1117] leading-snug">
                      Catálogo em ótima forma! 🎉
                    </p>
                    <p className="text-xs text-black/50 mt-1.5 leading-relaxed">
                      Nenhum dado crítico faltando. Continue adicionando experiências.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-base font-black text-[#0F1117] leading-snug">
                      {stats.noMedia > 0
                        ? `${stats.noMedia} experiências sem foto`
                        : stats.noBookingUrl > 0
                        ? `${stats.noBookingUrl} sem link de venda`
                        : `${totalIssues} campos incompletos`
                      }
                    </p>
                    <p className="text-xs text-black/50 mt-1.5 leading-relaxed">
                      Corrija agora para melhorar o Match Score dos viajantes.
                    </p>
                  </>
                )}

                <div className="flex gap-2 mt-4">
                  <Link
                    to="/admin/quality"
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-black/10 hover:bg-black/15 text-[11px] font-black text-black/70 transition-colors"
                  >
                    Ver Qualidade
                  </Link>
                  <Link
                    to="/admin/import"
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-black/10 hover:bg-black/15 text-[11px] font-black text-black/70 transition-colors"
                  >
                    <Upload className="w-3 h-3" /> Importar
                  </Link>
                </div>
              </div>
            </div>

            {/* Health Gauge */}
            <div className="rounded-[20px] p-5" style={{ background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.07)' }}>
              {loading
                ? <div className="h-32 bg-slate-100 rounded-[12px] animate-pulse" />
                : <HealthGauge score={qualityScore} />
              }
              <div className="mt-3 space-y-2">
                {[
                  { label: "Com foto", pct: coveragePct, color: "bg-emerald-400" },
                  { label: "Com afiliado", pct: affiliatePct, color: "bg-[#E2F18A]" },
                  { label: "Publicados", pct: stats.total > 0 ? Math.round((stats.published / stats.total) * 100) : 100, color: "bg-indigo-400" },
                ].map(({ label, pct, color }) => (
                  <div key={label}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-semibold text-slate-500">{label}</span>
                      <span className="text-[10px] font-black text-[#0F1117]">{pct}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div className={cn("h-full rounded-full transition-all duration-700", color)} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Revenue Tracker (dark — inspired by Donezo's Time Tracker) */}
            <div
              className="rounded-[20px] p-5 relative overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #0F1117 0%, #1e2535 100%)', boxShadow: '0 4px 20px rgba(15,17,23,0.2)' }}
            >
              <div className="absolute -right-8 -bottom-8 w-36 h-36 rounded-full bg-[#E2F18A]/5 blur-2xl pointer-events-none" />
              <div className="relative z-10">
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-white/40 mb-3">Revenue Tracker</p>
                <div className="flex items-end gap-2 mb-1">
                  <span className="text-4xl font-black text-[#E2F18A] tracking-tight leading-none">{v(stats.noBookingUrl)}</span>
                </div>
                <p className="text-xs text-white/40 leading-relaxed">
                  experiências sem link de afiliado
                </p>
                <div className="mt-4 pt-4 border-t border-white/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-white/30 font-medium">Potencial mensal</p>
                      <p className="text-sm font-black text-white/70">
                        ~${(stats.noBookingUrl * 12).toLocaleString("pt-BR")} USD
                      </p>
                    </div>
                    <Link
                      to="/admin/quality"
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[11px] font-black transition-all hover:scale-105"
                      style={{ background: '#E2F18A', color: '#0F1117' }}
                    >
                      Corrigir <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* ── Quality Alerts Row ─────────────────────────────────────────────── */}
        {!loading && totalIssues > 0 && (
          <div className="rounded-[20px] p-5" style={{ background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.07)' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-[10px] bg-rose-50 flex items-center justify-center">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                </div>
                <h3 className="text-sm font-black text-[#0F1117]">Alertas de Qualidade</h3>
                <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-500 text-[10px] font-black">{totalIssues} total</span>
              </div>
              <Link to="/admin/quality" className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-black text-white bg-[#0F1117] hover:opacity-90 transition-opacity">
                <RefreshCcw className="w-3.5 h-3.5" /> Corrigir tudo
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {[
                { label: "Sem Foto", count: stats.noMedia, icon: Image, color: "rose" },
                { label: "Sem Afiliado", count: stats.noBookingUrl, icon: Link2, color: "orange" },
                { label: "Sem Bairro", count: stats.noNeighborhood, icon: MapPin, color: "amber" },
                { label: "Sem GPS", count: stats.noGPS, icon: Globe2, color: "indigo" },
                { label: "Sem Descrição", count: stats.noDescription, icon: Tag, color: "purple" },
              ].map(({ label, count, icon: Icon, color }) => (
                <Link
                  key={label}
                  to="/admin/quality"
                  className={cn(
                    "flex items-center gap-3 p-3.5 rounded-[16px] transition-all hover:-translate-y-0.5 hover:shadow-sm",
                    count === 0 ? "bg-slate-50" : `bg-${color}-50`
                  )}
                >
                  <Icon className={cn("w-4 h-4 flex-shrink-0", count === 0 ? "text-slate-300" : `text-${color}-500`)} />
                  <div>
                    <p className="text-[10px] font-semibold text-slate-500">{label}</p>
                    <p className={cn("text-lg font-black leading-tight", count === 0 ? "text-slate-300" : "text-[#0F1117]")}>{count}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

// Globe2 is not in lucide but we can use Globe
function Globe2(props: any) {
  return <MapPin {...props} />;
}
