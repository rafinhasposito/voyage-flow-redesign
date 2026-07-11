import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Search, Edit3, Globe, CheckCircle2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Database } from "@/types/supabase.types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type DestinationRow = Database["public"]["Tables"]["destinations"]["Row"];

export default function DestinationsList() {
  const [destinations, setDestinations] = useState<DestinationRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function fetchDestinations() {
      try {
        const { data, error } = await supabase.from("destinations").select("*").order("name");
        if (error) throw error;
        setDestinations(data || []);
      } catch {
        toast.error("Erro ao carregar destinos");
      } finally {
        setIsLoading(false);
      }
    }
    fetchDestinations();
  }, []);

  const filtered = destinations.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase())
  );

  // Flag emoji por código de país
  const countryEmoji = (country: string) => {
    const map: Record<string, string> = {
      'United States': '🇺🇸', 'Brasil': '🇧🇷', 'France': '🇫🇷',
      'Japan': '🇯🇵', 'Italy': '🇮🇹', 'Portugal': '🇵🇹',
    };
    return map[country] || '🌍';
  };

  return (
    <div className="px-6 pt-2 pb-8 space-y-4 vf-fade-in">

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-[#0F1117] tracking-tight">Destinos</h1>
          <p className="text-[12px] text-slate-400 mt-0.5">
            Hierarquia geográfica global do catálogo
          </p>
        </div>
        <Link to="/admin/destinations/new" className="vf-btn-primary text-[13px]">
          <Plus className="w-4 h-4" /> Novo Destino
        </Link>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar destinos..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="vf-input pl-11 py-2.5 text-[13px]"
        />
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex justify-center py-20"><div className="vf-spinner" /></div>
      ) : filtered.length === 0 ? (
        <div
          className="rounded-[24px] py-20 flex flex-col items-center text-center"
          style={{ background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
        >
          <div
            className="w-14 h-14 rounded-[18px] flex items-center justify-center mb-4"
            style={{ background: 'linear-gradient(135deg, #EEF2FF, #6366F1)' }}
          >
            <Globe className="w-6 h-6 text-white" />
          </div>
          <p className="font-bold text-[#0F1117]">
            {search ? "Nenhum resultado" : "Nenhum destino ainda"}
          </p>
          <p className="text-sm text-slate-400 mt-1">
            {search ? "Tente outro termo." : "Cadastre o primeiro destino do catálogo."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(dest => (
            <div
              key={dest.id}
              className="vf-strip flex items-center gap-4 px-5 py-4"
            >
              {/* Flag/orb */}
              <div
                className="w-11 h-11 rounded-[14px] flex items-center justify-center text-2xl shrink-0"
                style={{ background: '#EEF2FF' }}
              >
                {countryEmoji(dest.country)}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-[#0F1117]">{dest.name}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-[11px] text-slate-400">{dest.country}</span>
                  {dest.timezone && (
                    <span className="vf-pill vf-pill-slate py-0 text-[10px] font-mono">{dest.timezone}</span>
                  )}
                  {dest.currency && (
                    <span className="vf-pill vf-pill-lime text-[10px]">{dest.currency}</span>
                  )}
                </div>
              </div>

              {/* Status */}
              <div className="shrink-0">
                {dest.is_active ? (
                  <span className="vf-pill vf-pill-green flex items-center gap-1">
                    <CheckCircle2 className="w-2.5 h-2.5" /> Ativo
                  </span>
                ) : (
                  <span className="vf-pill vf-pill-slate">Inativo</span>
                )}
              </div>

              {/* Edit */}
              <Link
                to={`/admin/destinations/${dest.id}`}
                className="w-9 h-9 rounded-full flex items-center justify-center text-slate-300 hover:text-[#0F1117] hover:bg-[#E2F18A] transition-all"
              >
                <Edit3 className="h-3.5 w-3.5" />
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
