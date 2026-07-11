import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Library, Hotel, Globe, Activity, ArrowUpRight, ArrowRight,
  Sparkles, TrendingUp, AlertCircle, CheckCircle2, Zap,
  Image, Tag, Link2, MapPin, Clock, BrainCircuit,
  DollarSign, Eye, Upload, RefreshCcw, ChevronRight
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────
interface DashStats {
  total: number;
  published: number;
  draft: number;
  hotels: number;
  noMedia: number;
  noNeighborhood: number;
  noBookingUrl: number;
  noGPS: number;
  noDescription: number;
}

interface RecentItem {
  id: string;
  title: string;
  category: string;
  status: string;
  updated_at: string;
  media_urls: string[];
  neighborhood: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `há ${days}d`;
  if (hours > 0) return `há ${hours}h`;
  if (mins > 0) return `há ${mins}min`;
  return "agora mesmo";
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({
  label, value, sub, icon: Icon, bg, iconBg, iconColor, to, alert
}: {
  label: string; value: string | number; sub: string;
  icon: React.ElementType; bg: string; iconBg: string; iconColor: string;
  to: string; alert?: boolean;
}) {
  return (
    <Link
      to={to}
      className="group relative overflow-hidden rounded-[22px] p-5 flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
      style={{ background: bg, boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={cn("w-10 h-10 rounded-[14px] flex items-center justify-center", iconBg)}>
          <Icon className={cn("w-4.5 h-4.5", iconColor)} strokeWidth={2} style={{ width: 18, height: 18 }} />
        </div>
        {alert && (
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
        )}
        {!alert && (
          <ArrowUpRight className="w-4 h-4 text-slate-300 opacity-0 group-hover:opacity-100 group-hover:text-slate-600 transition-all -translate-x-1 group-hover:translate-x-0" />
        )}
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 mb-0.5">{label}</p>
        <p className="text-3xl font-black text-[#0F1117] tracking-tight leading-none">{value}</p>
        <p className="text-[11px] text-slate-400 mt-1">{sub}</p>
      </div>
    </Link>
  );
}

function AlertRow({ icon: Icon, label, count, to, color }: {
  icon: React.ElementType; label: string; count: number; to: string; color: string;
}) {
  if (count === 0) return null;
  return (
    <Link to={to} className="flex items-center justify-between py-2.5 px-3 rounded-[14px] hover:bg-slate-50 transition-colors group">
      <div className="flex items-center gap-2.5">
        <div className={cn("w-7 h-7 rounded-[10px] flex items-center justify-center", color)}>
          <Icon className="w-3.5 h-3.5" strokeWidth={2} />
        </div>
        <span className="text-[12px] font-semibold text-slate-600">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[12px] font-black text-[#0F1117] bg-slate-100 px-2 py-0.5 rounded-full">{count}</span>
        <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 transition-colors" />
      </div>
    </Link>
  );
}

function RecentRow({ item }: { item: RecentItem }) {
  const cover = item.media_urls?.[0];
  return (
    <Link
      to={`/admin/experiences/${item.id}`}
      className="flex items-center gap-3 py-2.5 px-3 rounded-[14px] hover:bg-slate-50 transition-colors group"
    >
      <div className="w-10 h-10 rounded-[12px] overflow-hidden bg-slate-100 flex-shrink-0">
        {cover
          ? <img src={cover} alt={item.title} className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center"><Image className="w-4 h-4 text-slate-300" /></div>
        }
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-bold text-[#0F1117] truncate">{item.title}</p>
        <p className="text-[10px] text-slate-400 font-medium">{item.neighborhood || item.category || '—'}</p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className={cn(
          "text-[10px] font-black px-2 py-0.5 rounded-full",
          item.status === 'published' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'
        )}>
          {item.status === 'published' ? 'Pub' : 'Rascunho'}
        </span>
        <span className="text-[10px] text-slate-400">{timeAgo(item.updated_at)}</span>
      </div>
    </Link>
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

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      const [
        totalRes, publishedRes, draftRes, hotelRes,
        noMediaRes, noNeighRes, noBookRes, noGPSRes, noDescRes,
        recentRes,
      ] = await Promise.all([
        supabase.from("experiences").select("id", { count: "exact", head: true }),
        supabase.from("experiences").select("id", { count: "exact", head: true }).eq("status", "published"),
        supabase.from("experiences").select("id", { count: "exact", head: true }).eq("status", "draft"),
        supabase.from("experiences").select("id", { count: "exact", head: true }).eq("category", "Hotel"),
        // no media: media_urls is null or empty array
        supabase.from("experiences").select("id", { count: "exact", head: true }).or("media_urls.is.null,media_urls.eq.{}"),
        supabase.from("experiences").select("id", { count: "exact", head: true }).is("neighborhood", null),
        supabase.from("experiences").select("id", { count: "exact", head: true }).is("booking_url", null),
        supabase.from("experiences").select("id", { count: "exact", head: true }).is("location_lat", null),
        supabase.from("experiences").select("id", { count: "exact", head: true }).or("description.is.null,description.eq."),
        supabase.from("experiences")
          .select("id, title, category, status, updated_at, media_urls, neighborhood")
          .order("updated_at", { ascending: false })
          .limit(6),
      ]);

      setStats({
        total: totalRes.count || 0,
        published: publishedRes.count || 0,
        draft: draftRes.count || 0,
        hotels: hotelRes.count || 0,
        noMedia: noMediaRes.count || 0,
        noNeighborhood: noNeighRes.count || 0,
        noBookingUrl: noBookRes.count || 0,
        noGPS: noGPSRes.count || 0,
        noDescription: noDescRes.count || 0,
      });

      setRecent((recentRes.data || []) as RecentItem[]);
    } catch (e) {
      console.error("Dashboard load error:", e);
    } finally {
      setLoading(false);
    }
  }

  const v = (n: number) => loading ? "—" : n.toLocaleString("pt-BR");
  const totalIssues = stats.noMedia + stats.noNeighborhood + stats.noBookingUrl + stats.noGPS + stats.noDescription;
  const qualityScore = stats.total === 0 ? 100 : Math.max(0, Math.round(((stats.total * 5 - totalIssues) / (stats.total * 5)) * 100));
  const revenueOpportunity = stats.noBookingUrl;

  return (
    <div className="px-6 pt-2 pb-10 space-y-4 vf-fade-in">

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden rounded-[26px] p-7"
        style={{ background: 'linear-gradient(135deg, #E2F18A 0%, #BAF5C9 55%, #7CFE9D 100%)', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}
      >
        <div className="relative z-10 flex items-start justify-between gap-4">
          <div className="max-w-lg">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Sparkles className="w-3.5 h-3.5 text-black/40" />
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-black/40">Centro de Operações</p>
            </div>
            <h1 className="text-[22px] font-black text-[#0F1117] tracking-tight leading-tight">
              {greeting()}, Rafael.
            </h1>
            {loading ? (
              <p className="text-sm text-black/50 mt-1.5">Carregando inteligência do catálogo...</p>
            ) : (
              <p className="text-sm text-black/55 mt-1.5 leading-relaxed">
                {stats.total > 0 ? (
                  <>
                    Seu catálogo tem <strong>{v(stats.published)}</strong> experiências publicadas e <strong>{v(stats.draft)}</strong> em rascunho.
                    {totalIssues > 0 && <> Há <strong className="text-rose-700">{totalIssues} campos</strong> que precisam de atenção.</>}
                  </>
                ) : (
                  "Catálogo vazio. Comece importando experiências abaixo."
                )}
              </p>
            )}
            <div className="flex flex-wrap gap-2 mt-4">
              <Link to="/admin/experiences/new" className="vf-btn-primary text-xs px-4 py-2">
                <Library className="w-3.5 h-3.5" /> Nova Experiência
              </Link>
              <Link to="/admin/import" className="vf-btn-ghost text-xs bg-white/60 hover:bg-white/90 border-0">
                <Upload className="w-3.5 h-3.5" /> Importar via URL
              </Link>
              <Link to="/admin/quality" className="vf-btn-ghost text-xs bg-white/60 hover:bg-white/90 border-0">
                <Activity className="w-3.5 h-3.5" /> Qualidade
              </Link>
            </div>
          </div>

          {/* Health Score */}
          {!loading && stats.total > 0 && (
            <div className="hidden md:flex flex-col items-center gap-1 bg-white/50 backdrop-blur-sm rounded-[20px] px-6 py-4">
              <p className="text-[9px] font-black uppercase tracking-widest text-black/40 mb-1">Health Score</p>
              <div className="relative w-20 h-20">
                <svg viewBox="0 0 80 80" className="w-20 h-20 -rotate-90">
                  <circle cx="40" cy="40" r="32" fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="8" />
                  <circle
                    cx="40" cy="40" r="32" fill="none"
                    stroke={qualityScore >= 80 ? '#0F1117' : qualityScore >= 60 ? '#f59e0b' : '#ef4444'}
                    strokeWidth="8" strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 32}`}
                    strokeDashoffset={`${2 * Math.PI * 32 * (1 - qualityScore / 100)}`}
                    style={{ transition: 'stroke-dashoffset 1s ease' }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xl font-black text-[#0F1117]">{qualityScore}</span>
                </div>
              </div>
              <p className="text-[10px] font-bold text-black/50">/ 100</p>
            </div>
          )}
        </div>
        <div className="absolute -right-12 -top-12 w-52 h-52 rounded-full bg-white/20 blur-2xl pointer-events-none" />
        <div className="absolute right-8 -bottom-8 w-36 h-36 rounded-full bg-white/25 blur-xl pointer-events-none" />
      </div>

      {/* ── STAT CHIPS ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Catálogo" value={v(stats.total)} sub={`${v(stats.published)} publicados`}
          icon={Library} bg="#FAF8F3" iconBg="bg-amber-50" iconColor="text-amber-600" to="/admin/experiences"
        />
        <StatCard
          label="Hospedagens" value={v(stats.hotels)} sub="Hotéis cadastrados"
          icon={Hotel} bg="#F4FBF7" iconBg="bg-emerald-50" iconColor="text-emerald-600" to="/admin/hotels"
        />
        <StatCard
          label="Rascunhos" value={v(stats.draft)} sub="Aguardando revisão"
          icon={Clock} bg={stats.draft > 0 ? "#FFFBEB" : "#F4FBF7"}
          iconBg={stats.draft > 0 ? "bg-amber-100" : "bg-emerald-50"}
          iconColor={stats.draft > 0 ? "text-amber-600" : "text-emerald-600"}
          to="/admin/experiences" alert={stats.draft > 10}
        />
        <StatCard
          label="Sem Afiliado" value={v(revenueOpportunity)} sub="Receita potencial perdida"
          icon={DollarSign} bg={revenueOpportunity > 0 ? "#FFF1F1" : "#F4FBF7"}
          iconBg={revenueOpportunity > 0 ? "bg-rose-50" : "bg-emerald-50"}
          iconColor={revenueOpportunity > 0 ? "text-rose-500" : "text-emerald-600"}
          to="/admin/quality" alert={revenueOpportunity > 5}
        />
      </div>

      {/* ── MAIN GRID ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">

        {/* Atividade Recente — 2/3 */}
        <div
          className="lg:col-span-2 rounded-[22px] p-5"
          style={{ background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-[10px] bg-slate-100 flex items-center justify-center">
                <TrendingUp className="w-3.5 h-3.5 text-slate-500" />
              </div>
              <h3 className="font-bold text-sm text-[#0F1117]">Editadas Recentemente</h3>
            </div>
            <Link to="/admin/experiences" className="text-[11px] font-bold text-slate-400 hover:text-[#0F1117] transition-colors flex items-center gap-1">
              Ver todas <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-2">
              {[1,2,3,4].map(i => (
                <div key={i} className="h-12 rounded-[14px] bg-slate-100 animate-pulse" />
              ))}
            </div>
          ) : recent.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="w-12 h-12 rounded-[16px] flex items-center justify-center mb-3" style={{ background: 'linear-gradient(135deg, #E2F18A, #B8F5C8)' }}>
                <Zap className="w-5 h-5 text-black/70" />
              </div>
              <p className="font-bold text-sm text-[#0F1117]">Nenhuma experiência ainda</p>
              <p className="text-xs text-slate-400 mt-1 max-w-xs">Importe via URL ou cadastre manualmente.</p>
              <Link to="/admin/experiences/new" className="vf-btn-lime text-xs mt-4 px-4 py-2">
                <Library className="w-3.5 h-3.5" /> Criar agora
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {recent.map(item => <RecentRow key={item.id} item={item} />)}
            </div>
          )}
        </div>

        {/* Alertas de Qualidade — 1/3 */}
        <div className="flex flex-col gap-3">

          {/* Alertas */}
          <div className="rounded-[22px] p-5 flex-1" style={{ background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-[10px] bg-rose-50 flex items-center justify-center">
                <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
              </div>
              <h3 className="font-bold text-sm text-[#0F1117]">Atenção Necessária</h3>
            </div>

            {loading ? (
              <div className="space-y-2">
                {[1,2,3].map(i => <div key={i} className="h-10 rounded-[12px] bg-slate-100 animate-pulse" />)}
              </div>
            ) : totalIssues === 0 ? (
              <div className="flex flex-col items-center py-6 text-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mb-2" />
                <p className="text-sm font-bold text-emerald-600">Tudo em ordem!</p>
                <p className="text-xs text-slate-400 mt-1">Nenhum problema detectado.</p>
              </div>
            ) : (
              <div className="space-y-0.5">
                <AlertRow icon={Image} label="Sem imagem" count={stats.noMedia} to="/admin/quality" color="bg-rose-50 text-rose-500" />
                <AlertRow icon={Link2} label="Sem link afiliado" count={stats.noBookingUrl} to="/admin/quality" color="bg-orange-50 text-orange-500" />
                <AlertRow icon={MapPin} label="Sem bairro" count={stats.noNeighborhood} to="/admin/quality" color="bg-amber-50 text-amber-600" />
                <AlertRow icon={Globe} label="Sem GPS" count={stats.noGPS} to="/admin/quality" color="bg-indigo-50 text-indigo-500" />
                <AlertRow icon={Tag} label="Sem descrição" count={stats.noDescription} to="/admin/quality" color="bg-purple-50 text-purple-500" />
              </div>
            )}

            {totalIssues > 0 && (
              <Link
                to="/admin/quality"
                className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-[14px] text-xs font-bold text-white transition-all hover:opacity-90"
                style={{ background: '#0F1117' }}
              >
                <RefreshCcw className="w-3.5 h-3.5" />
                Corrigir {totalIssues} problemas
              </Link>
            )}
          </div>

          {/* Quick Actions */}
          <div className="rounded-[22px] p-5" style={{ background: '#F4FBF7', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-700 mb-3">Ações Rápidas</p>
            <div className="space-y-1.5">
              {[
                { label: "Importar via URL", icon: Upload, to: "/admin/import" },
                { label: "Ver Catálogo", icon: Library, to: "/admin/experiences" },
                { label: "Controle de Qualidade", icon: Activity, to: "/admin/quality" },
                { label: "Hospedagens", icon: Hotel, to: "/admin/hotels" },
              ].map(({ label, icon: Icon, to }) => (
                <Link
                  key={to}
                  to={to}
                  className="flex items-center justify-between px-3 py-2 rounded-[12px] bg-white hover:bg-slate-50 transition-colors group"
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-[12px] font-semibold text-slate-700">{label}</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 transition-colors" />
                </Link>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* ── INTELLIGENCE ROW ─────────────────────────────────────────── */}
      {!loading && stats.total > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">

          {/* Revenue Opportunity */}
          <div
            className="rounded-[22px] p-5"
            style={{ background: 'linear-gradient(135deg, #0F1117 0%, #1e293b 100%)', boxShadow: '0 1px 4px rgba(0,0,0,0.15)' }}
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-[10px] bg-[#E2F18A]/20 flex items-center justify-center">
                <DollarSign className="w-3.5 h-3.5 text-[#E2F18A]" />
              </div>
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/50">Revenue</p>
            </div>
            <p className="text-2xl font-black text-[#E2F18A] tracking-tight">{v(revenueOpportunity)}</p>
            <p className="text-xs text-white/60 mt-1 leading-relaxed">
              experiências sem link de afiliado. Cada link pode gerar comissão de 6–10%.
            </p>
            <Link
              to="/admin/quality"
              className="mt-4 flex items-center gap-1.5 text-[11px] font-bold text-[#E2F18A] hover:opacity-80 transition-opacity"
            >
              Adicionar links <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {/* Catalog Coverage */}
          <div className="rounded-[22px] p-5" style={{ background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-[10px] bg-indigo-50 flex items-center justify-center">
                <Eye className="w-3.5 h-3.5 text-indigo-500" />
              </div>
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">Cobertura</p>
            </div>
            <div className="space-y-2.5">
              {[
                { label: "Com foto", pct: stats.total > 0 ? Math.round(((stats.total - stats.noMedia) / stats.total) * 100) : 100, color: 'bg-emerald-400' },
                { label: "Com bairro", pct: stats.total > 0 ? Math.round(((stats.total - stats.noNeighborhood) / stats.total) * 100) : 100, color: 'bg-indigo-400' },
                { label: "Com afiliado", pct: stats.total > 0 ? Math.round(((stats.total - stats.noBookingUrl) / stats.total) * 100) : 100, color: 'bg-amber-400' },
                { label: "Com GPS", pct: stats.total > 0 ? Math.round(((stats.total - stats.noGPS) / stats.total) * 100) : 100, color: 'bg-rose-400' },
              ].map(({ label, pct, color }) => (
                <div key={label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-semibold text-slate-600">{label}</span>
                    <span className="text-[11px] font-black text-[#0F1117]">{pct}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={cn("h-full rounded-full transition-all duration-700", color)}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* IA Engine Status */}
          <div className="rounded-[22px] p-5" style={{ background: '#EEF2FF', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-[10px] bg-indigo-100 flex items-center justify-center">
                <BrainCircuit className="w-3.5 h-3.5 text-indigo-600" />
              </div>
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-indigo-600">Engine IA</p>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-xs font-bold text-indigo-900 leading-snug">Tabela Ativa</p>
                <p className="text-[10px] text-indigo-600 mt-0.5 font-mono">experiences (estável)</p>
              </div>
              <div>
                <p className="text-xs font-bold text-indigo-900 leading-snug">Catálogo</p>
                <p className="text-[10px] text-indigo-600 mt-0.5">{v(stats.total)} itens · {v(stats.published)} publicados</p>
              </div>
              <div>
                <p className="text-xs font-bold text-indigo-900 leading-snug">Qualidade Geral</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 h-2 rounded-full bg-indigo-200 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-indigo-500 transition-all duration-700"
                      style={{ width: `${qualityScore}%` }}
                    />
                  </div>
                  <span className="text-[11px] font-black text-indigo-700">{qualityScore}%</span>
                </div>
              </div>
            </div>
            <Link to="/admin/quality" className="mt-4 flex items-center gap-1.5 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors">
              Ver detalhes <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

        </div>
      )}

    </div>
  );
}
