import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DestinationEditor() {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col h-full bg-vf-bg overflow-hidden">
      
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-vf-border z-10 shrink-0">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate(-1)} className="rounded-full w-8 h-8">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-lg font-black text-vf-black tracking-tight flex items-center gap-2">
              <Globe className="w-4 h-4 text-emerald-600" /> Editor de Destino
            </h1>
            <p className="text-[11px] text-vf-text-3 font-semibold">Crie ou edite cidades e macrorregiões.</p>
          </div>
        </div>
        <Button variant="lime" size="sm">
          <Save className="w-4 h-4" /> Salvar Destino
        </Button>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-[800px] mx-auto bg-white rounded-xl border border-vf-border shadow-vf-sm p-6 space-y-6">
          <p className="text-sm font-semibold text-vf-text-2">
            Este módulo será detalhado nas próximas sprints de estruturação do banco de dados (Cidades vs Bairros). 
            No momento, utilizamos hardcoded (ex: Nova York).
          </p>
        </div>
      </div>
    </div>
  );
}
