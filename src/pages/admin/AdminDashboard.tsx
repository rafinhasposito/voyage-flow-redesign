import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Library, Hotel, Globe, Activity, ArrowUpRight,
  Sparkles, TrendingUp, AlertCircle, CheckCircle2, Zap,
  Users, DollarSign, Utensils, Crown,
  CreditCard, MousePointerClick, Percent, Target, HeartPulse, BrainCircuit, BarChart3, Clock, LineChart, Star, MapPin
} from "lucide-react";
import { supabase } from "@/lib/supabase";

// ─────────────────────────────────────────────────────────────────────────────
// Mini stat chip (Bento pequeno)
// ─────────────────────────────────────────────────────────────────────────────
function StatChip({
  label, value, sub, icon: Icon, bg, iconColor, to
}: {
  label: string; value: string; sub: string;
  icon: React.ElementType; bg: string; iconColor: string; to: string;
}) {
  return (
    <Link
      to={to}
      className="group relative overflow-hidden rounded-[24px] p-5 flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
      style={{ background: bg, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
    >
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-10 h-10 rounded-[14px] flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,0.65)' }}
        >
          <Icon className={`w-5 h-5 ${iconColor}`} strokeWidth={2} />
        </div>
        <ArrowUpRight
          className="w-4 h-4 text-slate-300 opacity-0 group-hover:opacity-100 group-hover:text-slate-600 transition-all -translate-x-1 group-hover:translate-x-0"
        />
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 mb-0.5">{label}</p>
        <p className="text-3xl font-black text-[#0F1117] tracking-tight leading-none">{value}</p>
        <p className="text-[11px] text-slate-400 mt-1">{sub}</p>
      </div>
    </Link>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [stats, setStats] = useState({
    exp: 0, hotels: 0, restaurants: 0, issues: 0,
    // SaaS Metrics (Mocks until affiliate tables are live)
    usersActive: 1254, subscribers: 342,
    revenueDaily: 840, revenueMonthly: 25200, revenueAnnual: 302400,
    growth: 14.2, conversions: 8.5, clicks: 12450, commission: 1250, epc: 0.10,
    partners: 12, matchAvg: 94
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      try {
        const [expRes, hotelRes, restRes, issueRes] = await Promise.all([
          supabase.from("experiences").select("id", { count: "exact", head: true }),
          supabase.from("experiences").select("id", { count: "exact", head: true }).eq("type", "hotel"),
          supabase.from("experiences").select("id", { count: "exact", head: true }).eq("type", "restaurant"),
          supabase.from("experiences").select("id", { count: "exact", head: true }).is("location_lat", null),
        ]);
        setStats(prev => ({
          ...prev,
          exp: expRes.count || 0,
          hotels: hotelRes.count || 0,
          restaurants: restRes.count || 0,
          issues: issueRes.count || 0,
        }));
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, []);

  const v = (n: number) => loading ? "—" : String(n);

  return (
    <div className="px-6 pt-2 pb-8 space-y-4 vf-fade-in">

      {/* ── HERO ──────────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden rounded-[24px] p-7"
        style={{
          background: 'linear-gradient(135deg, #E2F18A 0%, #BAF5C9 55%, #7CFE9D 100%)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
        }}
      >
        {/* Content */}
        <div className="relative z-10 max-w-lg">
          <div className="flex items-center gap-1.5 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-black/50" />
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-black/50">
              Centro de Comando
            </p>
          </div>
          <h1 className="text-2xl font-black text-[#0F1117] tracking-tight leading-tight">
            Bem-vindo ao Voyage Flow
          </h1>
          <p className="text-sm text-black/55 mt-1.5 leading-relaxed">
            Gerencie o catálogo, monitore a qualidade dos dados e<br className="hidden sm:block" />
            mantenha a Engine de Matching no pico de performance.
          </p>
          <div className="flex flex-wrap gap-2 mt-4">
            <Link to="/admin/experiences/new" className="vf-btn-primary text-xs px-4 py-2">
              <Library className="w-3.5 h-3.5" /> Nova Experiência
            </Link>
            <Link to="/admin/quality" className="vf-btn-ghost text-xs bg-white/60 hover:bg-white/90">
              <Activity className="w-3.5 h-3.5" /> Ver Qualidade
            </Link>
          </div>
        </div>

        {/* Decorative orbs */}
        <div className="absolute -right-12 -top-12 w-52 h-52 rounded-full bg-white/20 blur-2xl pointer-events-none" />
        <div className="absolute right-8 -bottom-8 w-36 h-36 rounded-full bg-white/30 blur-xl pointer-events-none" />
        <div className="absolute right-32 top-4 w-20 h-20 rounded-full bg-white/15 blur-lg pointer-events-none" />
      </div>

      {/* ── METRICS GRID: FINANCIALS & AFFILIATES ─────────────────────── */}
      <h2 className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400 mt-8 mb-2 px-1">Performance & Financeiro</h2>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <StatChip label="Receita Dia" value={`$${v(stats.revenueDaily)}`} sub={`+${stats.growth}% vs ontem`} icon={DollarSign} bg="#F0FDFA" iconColor="text-teal-600" to="/admin/financial" />
        <StatChip label="Receita Mês" value={`$${v(stats.revenueMonthly / 1000)}k`} sub="Recorrente (MRR)" icon={LineChart} bg="#F4FBF7" iconColor="text-emerald-600" to="/admin/financial" />
        <StatChip label="Comissão" value={`$${v(stats.commission)}`} sub="Afiliados" icon={CreditCard} bg="#FEFCE8" iconColor="text-yellow-600" to="/admin/affiliates" />
        <StatChip label="EPC" value={`$${v(stats.epc)}`} sub="Earnings / Click" icon={Target} bg="#EEF2FF" iconColor="text-indigo-600" to="/admin/affiliates" />
        <StatChip label="Conversões" value={`${v(stats.conversions)}%`} sub={`${v(stats.clicks)} cliques`} icon={MousePointerClick} bg="#F8FAFC" iconColor="text-slate-600" to="/admin/analytics" />
      </div>

      {/* ── METRICS GRID: PRODUCT & CATALOG ─────────────────────── */}
      <h2 className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400 mt-8 mb-2 px-1">Produto & Catálogo</h2>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <StatChip label="Match Médio" value={`${v(stats.matchAvg)}%`} sub="Satisfação da IA" icon={HeartPulse} bg="#FFF1F2" iconColor="text-rose-500" to="/admin/quality" />
        <StatChip label="Usuários Ativos" value={v(stats.usersActive)} sub="Últimos 30 dias" icon={Users} bg="#F0F9FF" iconColor="text-sky-500" to="/admin/users" />
        <StatChip label="Assinantes" value={v(stats.subscribers)} sub="Planos Premium" icon={Crown} bg="#FEF2F2" iconColor="text-red-500" to="/admin/users?filter=premium" />
        <StatChip label="Experiências" value={v(stats.exp)} sub="Ativas no catálogo" icon={Library} bg="#FAF8F3" iconColor="text-amber-600" to="/admin/experiences" />
        <StatChip label="Anomalias" value={v(stats.issues)} sub="Ação requerida" icon={stats.issues > 0 ? AlertCircle : CheckCircle2} bg={stats.issues > 0 ? "#FFF1F1" : "#F4FBF7"} iconColor={stats.issues > 0 ? "text-rose-500" : "text-emerald-600"} to="/admin/quality" />
      </div>

      {/* ── BENTO BOTTOM ROW ──────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mt-4">
        
        {/* AI Insights — 2/3 */}
        <div className="lg:col-span-2 rounded-[24px] p-6" style={{ background: '#FFFFFF', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <BrainCircuit className="w-4 h-4 text-slate-400" />
              <h3 className="font-bold text-sm text-[#0F1117]">AI Insights & Sugestões</h3>
            </div>
            <Link to="/admin/quality" className="text-[11px] font-bold text-slate-400 hover:text-[#0F1117] transition-colors">
              Analisar Catálogo →
            </Link>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center shrink-0"><AlertCircle className="w-4 h-4 text-rose-500"/></div>
              <div>
                <p className="text-xs font-bold text-slate-800">{stats.issues} Experiências sem geolocalização</p>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">O motor de matching penaliza severamente itens sem coordenadas exatas. Sugestão: Rodar o Auto-Heal (Google Places) no painel de Qualidade.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0"><TrendingUp className="w-4 h-4 text-emerald-600"/></div>
              <div>
                <p className="text-xs font-bold text-slate-800">Alta demanda por "Rooftops" à noite</p>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">92 usuários buscaram ou deram match com essa tag hoje. Considere promover e adicionar mais parceiros de Vida Noturna ao catálogo.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0"><Star className="w-4 h-4 text-blue-500"/></div>
              <div>
                <p className="text-xs font-bold text-slate-800">Top Produto: SUMMIT One Vanderbilt</p>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">Foi adicionado a 45 roteiros nas últimas 24h. Verifique se o link de afiliado GetYourGuide está atualizado para maximizar a conversão.</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Parceiros & Rede — 1/3 */}
        <div className="flex flex-col gap-3">
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-600 mb-2">Sistema</p>
            <p className="text-sm font-bold text-[#0F1117] leading-snug">
              Geocoding automático
            </p>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Coordenadas enriquecidas via Nominatim automaticamente ao salvar.
            </p>
          </div>

        </div>
      </div>

    </div>
  );
}
