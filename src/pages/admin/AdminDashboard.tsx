import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Library, Hotel, Globe, Activity, ArrowUpRight,
  Sparkles, TrendingUp, AlertCircle, CheckCircle2, Zap
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
  const [stats, setStats] = useState({ exp: 0, hotels: 0, issues: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      try {
        const [expRes, hotelRes, issueRes] = await Promise.all([
          supabase.from("experiences").select("id", { count: "exact", head: true }),
          supabase.from("experiences").select("id", { count: "exact", head: true }).eq("type", "hotel"),
          supabase.from("experiences").select("id", { count: "exact", head: true }).is("location_lat", null),
        ]);
        setStats({
          exp: expRes.count || 0,
          hotels: hotelRes.count || 0,
          issues: issueRes.count || 0,
        });
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

      {/* ── STAT CHIPS (4 cards Bento) ─────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatChip
          label="Experiências" value={v(stats.exp)} sub="No catálogo ativo"
          icon={Library} bg="#FAF8F3" iconColor="text-amber-600" to="/admin/experiences"
        />
        <StatChip
          label="Hospedagens" value={v(stats.hotels)} sub="Hotéis & basecamps"
          icon={Hotel} bg="#F4FBF7" iconColor="text-emerald-600" to="/admin/hotels"
        />
        <StatChip
          label="Destinos" value="1" sub="Nova York (MVP)"
          icon={Globe} bg="#EEF2FF" iconColor="text-indigo-600" to="/admin/destinations"
        />
        <StatChip
          label="Anomalias" value={v(stats.issues)} sub="Dados incompletos"
          icon={stats.issues > 0 ? AlertCircle : CheckCircle2}
          bg={stats.issues > 0 ? "#FFF1F1" : "#F4FBF7"}
          iconColor={stats.issues > 0 ? "text-rose-500" : "text-emerald-600"}
          to="/admin/quality"
        />
      </div>

      {/* ── BENTO BOTTOM ROW ──────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">

        {/* Atividade — 2/3 */}
        <div
          className="lg:col-span-2 rounded-[24px] p-6"
          style={{ background: '#FFFFFF', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
        >
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-slate-400" />
              <h3 className="font-bold text-sm text-[#0F1117]">Atividade Recente</h3>
            </div>
            <Link to="/admin/experiences" className="text-[11px] font-bold text-slate-400 hover:text-[#0F1117] transition-colors">
              Ver tudo →
            </Link>
          </div>

          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div
              className="w-14 h-14 rounded-[18px] flex items-center justify-center mb-4"
              style={{ background: 'linear-gradient(135deg, #E2F18A 0%, #B8F5C8 100%)' }}
            >
              <Zap className="w-6 h-6 text-black/70" strokeWidth={2.5} />
            </div>
            <p className="font-bold text-sm text-[#0F1117]">Catálogo sendo construído</p>
            <p className="text-xs text-slate-400 mt-1 max-w-xs leading-relaxed">
              Importe experiências via URL ou cadastre manualmente. A Engine de Matching começa a funcionar a partir de 10 registros.
            </p>
            <Link to="/admin/experiences/new" className="vf-btn-lime text-xs mt-5 px-5 py-2.5">
              <Library className="w-3.5 h-3.5" /> Criar primeira experiência
            </Link>
          </div>
        </div>

        {/* Avisos — 1/3 */}
        <div className="flex flex-col gap-3">

          <div
            className="rounded-[24px] p-5 flex-1"
            style={{ background: '#FEFCE8', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-amber-600 mb-2">Aviso</p>
            <p className="text-sm font-bold text-[#0F1117] leading-snug">
              Layout CMS ativo
            </p>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Interface focada em produtividade máxima. Alterne entre views Strips, Cards e Compact nas listagens.
            </p>
          </div>

          <div
            className="rounded-[24px] p-5"
            style={{ background: '#F4FBF7', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
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
