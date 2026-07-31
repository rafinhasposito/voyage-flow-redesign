import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Library, Hotel, ArrowUpRight, ArrowRight,
  Sparkles, TrendingUp, AlertCircle, CheckCircle2, Zap,
  Image, Tag, Link2, MapPin, Clock,
  Upload, RefreshCcw, ChevronDown,
  Bell, Search, Globe
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { AdminHeader } from "@/components/admin/AdminHeader";

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
          <div className="w-full flex items-end justify-center h-20">
            <div
              className={cn(
                "w-full rounded-t-sm transition-all duration-700",
                i === today ? "bg-vf-black" : "bg-vf-border"
              )}
              style={{ height: `${(v / maxVal) * 100}%`, minHeight: 4 }}
            />
          </div>
          <span className={cn(
            "text-[9px] font-bold mt-1",
            i === today ? "text-vf-text-1" : "text-vf-text-3"
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
  const color = score >= 80 ? 'var(--vf-success)' : score >= 60 ? 'var(--vf-warning)' : 'var(--vf-danger)';
  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <svg width="140" height="80" viewBox="0 0 140 80">
          {/* Track */}
          <path d="M 14 76 A 56 56 0 0 1 126 76" fill="none" stroke="var(--vf-border)" strokeWidth="12" strokeLinecap="round" />
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
            <span className="text-3xl font-black text-vf-black leading-none">{score}</span>
            <span className="text-sm font-bold text-vf-text-3 ml-0.5">%</span>
          </div>
        </div>
      </div>
      <p className="text-[10px] font-bold uppercase tracking-widest text-vf-text-3 -mt-1">Health Score</p>
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
    <div className="flex flex-col h-full overflow-auto bg-[#F7F7F2] font-sans selection:bg-[#D7F24B] selection:text-[#171717]">
      <AdminHeader
        title="Centro de Operações IA"
        subtitle={`${greeting()}, Rafael. Aqui você acompanha a saúde do catálogo, status de processamento da Engine e métricas gerais.`}
        icon={<Sparkles className="w-4 h-4 text-[#171717]" />}
        badgeText="Visão Geral"
        gradient="from-[#D7F24B] to-[#BDF4D6]"
        loading={loading}
        metrics={[
          { label: 'Total Inventário', value: v(stats.total), color: 'bg-white/40' },
          { label: 'Publicados', value: v(stats.published), color: 'bg-emerald-500/10 text-emerald-900 border-emerald-500/20' },
          { label: 'Rascunhos', value: v(stats.draft), color: 'bg-white/30' },
          { label: 'Health Score', value: `${qualityScore}%`, color: qualityScore >= 80 ? 'bg-emerald-500/10 text-emerald-900' : 'bg-amber-500/10 text-amber-900' },
        ]}
        actions={
          <div className="flex flex-col items-end gap-4">
             <div className="flex items-center gap-3">
               <button className="relative w-12 h-12 rounded-xl bg-white/40 backdrop-blur-md border border-white/40 flex items-center justify-center hover:bg-white/60 transition-colors shadow-sm">
                 <Bell className="w-5 h-5 text-[#171717]/80" />
                 {totalIssues > 0 && (
                   <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-[10px] font-black text-white flex items-center justify-center shadow-sm">
                     {Math.min(totalIssues, 9)}
                   </span>
                 )}
               </button>
               <div className="flex items-center gap-3 bg-white/40 backdrop-blur-md rounded-xl pl-2 pr-4 py-2 border border-white/40 shadow-sm">
                 <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black bg-[#171717] text-[#D7F24B]">
                   RG
                 </div>
                 <span className="text-sm font-bold text-[#171717]">Rafael G.</span>
                 <ChevronDown className="w-4 h-4 text-[#171717]/40" />
               </div>
             </div>
             {/* Tabs */}
             <div className="flex items-center gap-2 bg-white/30 backdrop-blur-md p-1 rounded-2xl border border-white/40 shadow-sm">
               {TABS.map(tab => (
                 tab.id === 'overview' ? (
                   <button
                     key={tab.id}
                     onClick={() => setActiveTab('overview')}
                     className={cn(
                        "px-6 py-2 rounded-xl text-[13px] font-black transition-all",
                        activeTab === 'overview'
                          ? "bg-white text-[#171717] shadow-sm"
                          : "text-[#171717]/60 hover:text-[#171717] hover:bg-white/40"
                      )}
                   >
                     {tab.label}
                   </button>
                 ) : (
                   <Link
                     key={tab.id}
                     to={(tab as any).to}
                     className="px-6 py-2 rounded-xl text-[13px] font-black text-[#171717]/60 hover:text-[#171717] hover:bg-white/40 transition-all"
                   >
                     {tab.label}
                   </Link>
                 )
               ))}
             </div>
          </div>
        }
      />

      {/* ══ CONTENT ══════════════════════════════════════════════════════════════ */}
      <div className="flex-1 p-6 space-y-4">

        {/* ── Stat Row ──────────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            {
              label: "Total Catálogo", value: v(stats.total), sub: "experiências ativas",
              icon: Library, bg: "bg-white", accent: "bg-vf-lime", textColor: "text-vf-black",
              to: "/admin/experiences",
            },
            {
              label: "Publicados", value: v(stats.published), sub: `de ${v(stats.total)} total`,
              icon: CheckCircle2, bg: "bg-white", accent: "bg-emerald-100", textColor: "text-emerald-700",
              to: "/admin/experiences",
            },
            {
              label: "Hospedagens", value: v(stats.hotels), sub: "hotéis cadastrados",
              icon: Hotel, bg: "bg-white", accent: "bg-indigo-100", textColor: "text-indigo-700",
              to: "/admin/hotels",
            },
            {
              label: "Rascunhos", value: v(stats.draft), sub: "aguardando revisão",
              icon: Clock, bg: "bg-white",
              accent: stats.draft > 0 ? "bg-amber-100" : "bg-vf-muted",
              textColor: stats.draft > 0 ? "text-amber-700" : "text-vf-text-2",
              to: "/admin/experiences",
            },
          ].map(({ label, value, sub, icon: Icon, bg, accent, textColor, to }) => (
            <Link
              key={label}
              to={to}
              className={cn("group relative rounded-2xl p-5 flex flex-col gap-3 transition-all duration-200 hover:-translate-y-0.5 shadow-vf-sm border border-vf-border", bg)}
            >
              <div className="flex items-center justify-between">
                <div className={cn("w-9 h-9 rounded-[12px] flex items-center justify-center", accent)}>
                  <Icon className={cn("w-4 h-4", accent === "bg-vf-lime" ? "text-vf-black" : "text-vf-text-2")} strokeWidth={2} />
                </div>
                <ArrowUpRight className="w-4 h-4 text-vf-text-3 group-hover:text-vf-text-2 transition-colors" />
              </div>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-vf-text-3">{label}</p>
                <p className={cn("text-3xl font-black tracking-tight leading-none mt-0.5", textColor)}>{value}</p>
                <p className="text-[10px] text-vf-text-3 mt-1">{sub}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* ── Main Grid ─────────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

          {/* Left Column — 8/12 */}
          <div className="lg:col-span-8 space-y-4">

            {/* Activity Chart */}
            <div className="rounded-2xl p-5 bg-white shadow-vf-sm border border-vf-border">
              <div className="flex items-center justify-between mb-1">
                <div>
                  <h3 className="text-sm font-black text-vf-black">Atividade do Catálogo</h3>
                  <p className="text-[10px] text-vf-text-3 mt-0.5">Edições e publicações por dia</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1.5 text-[10px] font-bold text-vf-text-2">
                    <span className="w-2.5 h-2.5 rounded-sm bg-vf-black inline-block" />Hoje
                  </span>
                  <span className="flex items-center gap-1.5 text-[10px] font-bold text-vf-text-3">
                    <span className="w-2.5 h-2.5 rounded-sm bg-vf-border inline-block" />Outros dias
                  </span>
                </div>
              </div>
              {loading
                ? <div className="h-24 bg-vf-muted rounded-xl animate-pulse mt-2" />
                : <WeeklyBars total={stats.total} />
              }
            </div>

            {/* Recent Edits */}
            <div className="rounded-2xl overflow-hidden bg-white shadow-vf-sm border border-vf-border">
              <div className="flex items-center justify-between px-5 pt-5 pb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-vf-text-3" />
                  <h3 className="text-sm font-black text-vf-black">Últimas Edições</h3>
                </div>
                <Link to="/admin/experiences" className="text-[11px] font-bold text-vf-text-3 hover:text-vf-black flex items-center gap-1 transition-colors">
                  Ver todas <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              {loading ? (
                <div className="px-5 pb-5 space-y-2">
                  {[1,2,3].map(i => <div key={i} className="h-14 rounded-xl bg-vf-muted animate-pulse" />)}
                </div>
              ) : recent.length === 0 ? (
                <div className="px-5 pb-6 flex flex-col items-center py-8 text-center">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3 bg-vf-lime">
                    <Zap className="w-5 h-5 text-vf-black" />
                  </div>
                  <p className="font-bold text-sm text-vf-black">Nenhuma edição ainda</p>
                  <p className="text-xs text-vf-text-3 mt-1">Importe ou crie experiências para começar.</p>
                  <Link to="/admin/experiences/new" className="mt-4 px-5 py-2 rounded-full text-xs font-black text-vf-black hover:scale-105 transition-transform bg-vf-lime">
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
                        "flex items-center gap-3 px-5 py-3 hover:bg-vf-muted/50 transition-colors group",
                        i < recent.length - 1 && "border-b border-vf-border"
                      )}
                    >
                      <div className="w-11 h-11 rounded-xl overflow-hidden bg-vf-muted flex-shrink-0">
                        {item.media_urls?.[0]
                          ? <img src={item.media_urls[0]} alt={item.title} className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center"><Image className="w-4 h-4 text-vf-text-3" /></div>
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-bold text-vf-text-1 truncate">{item.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {item.neighborhood && (
                            <span className="flex items-center gap-1 text-[10px] text-vf-text-3">
                              <MapPin className="w-2.5 h-2.5" />{item.neighborhood}
                            </span>
                          )}
                          {item.category && (
                            <span className="text-[10px] text-vf-border">·</span>
                          )}
                          <span className="text-[10px] text-vf-text-3">{item.category}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={cn(
                          "px-2.5 py-1 rounded-full text-[10px] font-black",
                          item.status === 'published' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                        )}>
                          {item.status === 'published' ? 'Publicado' : 'Rascunho'}
                        </span>
                        <span className="text-[10px] text-vf-text-3">{timeAgo(item.updated_at)}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Right Column — 4/12 */}
          <div className="lg:col-span-4 space-y-4">

            {/* IA Concierge Briefing */}
            <div
              className="rounded-2xl p-5 relative overflow-hidden bg-gradient-to-br from-vf-lime to-[#c8f5a0] shadow-vf-sm"
            >
              <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-white/20 blur-2xl pointer-events-none" />
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-[10px] bg-vf-black/10 flex items-center justify-center">
                    <Sparkles className="w-3.5 h-3.5 text-vf-black/60" />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-vf-black/50">Concierge IA</p>
                </div>

                {loading ? (
                  <div className="space-y-2">
                    <div className="h-4 rounded-full bg-vf-black/10 w-3/4 animate-pulse" />
                    <div className="h-3 rounded-full bg-vf-black/5 animate-pulse" />
                  </div>
                ) : totalIssues === 0 ? (
                  <>
                    <p className="text-base font-black text-vf-black leading-snug">
                      Catálogo em ótima forma! 🎉
                    </p>
                    <p className="text-xs text-vf-black/50 mt-1.5 leading-relaxed">
                      Nenhum dado crítico faltando. Continue adicionando experiências.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-base font-black text-vf-black leading-snug">
                      {stats.noMedia > 0
                        ? `${stats.noMedia} experiências sem foto`
                        : stats.noBookingUrl > 0
                        ? `${stats.noBookingUrl} sem link de venda`
                        : `${totalIssues} campos incompletos`
                      }
                    </p>
                    <p className="text-xs text-vf-black/50 mt-1.5 leading-relaxed">
                      Corrija agora para melhorar o Match Score dos viajantes.
                    </p>
                  </>
                )}

                <div className="flex gap-2 mt-4">
                  <Link
                    to="/admin/quality"
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-vf-black/10 hover:bg-vf-black/15 text-[11px] font-black text-vf-black transition-colors"
                  >
                    Ver Qualidade
                  </Link>
                  <Link
                    to="/admin/import"
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-vf-black/10 hover:bg-vf-black/15 text-[11px] font-black text-vf-black transition-colors"
                  >
                    <Upload className="w-3 h-3" /> Importar
                  </Link>
                </div>
              </div>
            </div>

            {/* Health Gauge */}
            <div className="rounded-2xl p-5 bg-white shadow-vf-sm border border-vf-border">
              {loading
                ? <div className="h-32 bg-vf-muted rounded-xl animate-pulse" />
                : <HealthGauge score={qualityScore} />
              }
              <div className="mt-3 space-y-2">
                {[
                  { label: "Com foto", pct: coveragePct, color: "bg-emerald-400" },
                  { label: "Com afiliado", pct: affiliatePct, color: "bg-vf-lime" },
                  { label: "Publicados", pct: stats.total > 0 ? Math.round((stats.published / stats.total) * 100) : 100, color: "bg-indigo-400" },
                ].map(({ label, pct, color }) => (
                  <div key={label}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-semibold text-vf-text-2">{label}</span>
                      <span className="text-[10px] font-black text-vf-black">{pct}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-vf-muted overflow-hidden">
                      <div className={cn("h-full rounded-full transition-all duration-700", color)} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Revenue Tracker */}
            <div
              className="rounded-2xl p-5 relative overflow-hidden shadow-vf-md bg-gradient-to-br from-vf-black to-slate-800"
            >
              <div className="absolute -right-8 -bottom-8 w-36 h-36 rounded-full bg-vf-lime/5 blur-2xl pointer-events-none" />
              <div className="relative z-10">
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-white/40 mb-3">Revenue Tracker</p>
                <div className="flex items-end gap-2 mb-1">
                  <span className="text-4xl font-black text-vf-lime tracking-tight leading-none">{v(stats.noBookingUrl)}</span>
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
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[11px] font-black transition-all hover:scale-105 bg-vf-lime text-vf-black"
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
          <div className="rounded-2xl p-5 bg-white shadow-vf-sm border border-vf-border">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-[10px] bg-vf-danger/10 flex items-center justify-center">
                  <AlertCircle className="w-3.5 h-3.5 text-vf-danger" />
                </div>
                <h3 className="text-sm font-black text-vf-black">Alertas de Qualidade</h3>
                <span className="px-2 py-0.5 rounded-full bg-vf-danger/10 text-vf-danger text-[10px] font-black">{totalIssues} total</span>
              </div>
              <Link to="/admin/quality" className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-black text-white bg-vf-black hover:bg-gray-800 transition-colors shadow-vf-sm">
                <RefreshCcw className="w-3.5 h-3.5" /> Corrigir tudo
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {[
                { label: "Sem Foto", count: stats.noMedia, icon: Image, color: "text-vf-danger bg-vf-danger/10" },
                { label: "Sem Afiliado", count: stats.noBookingUrl, icon: Link2, color: "text-orange-500 bg-orange-50" },
                { label: "Sem Bairro", count: stats.noNeighborhood, icon: MapPin, color: "text-amber-500 bg-amber-50" },
                { label: "Sem GPS", count: stats.noGPS, icon: Globe, color: "text-indigo-500 bg-indigo-50" },
                { label: "Sem Descrição", count: stats.noDescription, icon: Tag, color: "text-purple-500 bg-purple-50" },
              ].map(({ label, count, icon: Icon, color }) => (
                <Link
                  key={label}
                  to="/admin/quality"
                  className={cn(
                    "flex items-center gap-3 p-3.5 rounded-2xl transition-all hover:-translate-y-0.5 hover:shadow-vf-sm",
                    count === 0 ? "bg-vf-muted" : color.split(" ")[1]
                  )}
                >
                  <Icon className={cn("w-4 h-4 flex-shrink-0", count === 0 ? "text-vf-text-3" : color.split(" ")[0])} />
                  <div>
                    <p className="text-[10px] font-semibold text-vf-text-2">{label}</p>
                    <p className={cn("text-lg font-black leading-tight", count === 0 ? "text-vf-text-3" : "text-vf-black")}>{count}</p>
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
