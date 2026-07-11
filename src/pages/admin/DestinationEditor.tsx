import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save } from "lucide-react";

export default function DestinationEditor() {
  const navigate = useNavigate();
  return (
    <div className="p-8 pb-32 max-w-3xl mx-auto space-y-8">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Voltar
      </button>

      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold font-urbanist">Editar Destino</h1>
        <button className="flex items-center gap-2 bg-[#E2F18A] text-[#0F1117] px-5 py-2.5 rounded-full font-medium hover:bg-[#cbe068] transition-all">
          <Save className="w-4 h-4" /> Salvar
        </button>
      </div>

      <div className="bg-white border rounded-[24px] p-6 space-y-6">
        <p className="text-gray-500">Módulo em refatoração para a Fase 3 SaaS.</p>
      </div>
    </div>
  );
}
