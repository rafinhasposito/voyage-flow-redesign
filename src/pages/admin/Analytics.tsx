import React from 'react';
import { BarChart2, Activity, BrainCircuit, Users } from 'lucide-react';
import { AdminHeader } from '@/components/admin/AdminHeader';

export default function Analytics() {
  return (
    <div className="flex flex-col h-full bg-[#F7F7F2] font-sans overflow-auto selection:bg-[#D7F24B] selection:text-[#171717]">
      <AdminHeader
        title="Analytics & Telemetria"
        subtitle="Métricas de conversão, buscas e interações geradas pela Engine de IA."
        icon={<BarChart2 className="w-4 h-4 text-[#171717]" />}
        badgeText="Módulo de Dados"
        gradient="from-[#FFE4A0] to-[#FFD166]" // Golden yellow gradient for Analytics
        metrics={[
          { label: 'Precisão da IA (Match)', value: '89%', color: 'bg-white/40' },
          { label: 'Impacto em Vendas', value: '+14%', color: 'bg-emerald-500/10 text-emerald-900 border-emerald-500/20' },
        ]}
      />

      <div className="flex-1 p-8">
        <div className="max-w-[800px] mx-auto mt-10">
          <div className="bg-white/60 backdrop-blur-xl p-10 rounded-3xl border border-white/40 shadow-sm text-center flex flex-col items-center">
            
            <div className="w-20 h-20 bg-gradient-to-br from-[#FFE4A0] to-[#FFD166] text-[#171717] rounded-2xl flex items-center justify-center mb-6 shadow-sm rotate-3">
              <Activity className="w-10 h-10 -rotate-3" />
            </div>
            
            <h2 className="text-3xl font-black text-[#171717] tracking-tight mb-3">Telemetria em Fase de Coleta</h2>
            <p className="text-[#171717]/60 text-lg max-w-md mb-8 leading-relaxed font-medium">
              A Engine de IA já está registrando impressões, mas o volume de dados ainda é insuficiente para gerar os gráficos comportamentais das Personas.
            </p>

            <div className="grid grid-cols-2 gap-4 w-full max-w-md">
               <div className="bg-white p-5 rounded-2xl border border-[#171717]/5 flex flex-col items-center text-center">
                 <BrainCircuit className="w-6 h-6 text-purple-500 mb-2" />
                 <span className="text-[11px] font-black uppercase tracking-widest text-[#171717]/40 mb-1">Motor</span>
                 <span className="text-xl font-black text-[#171717]">Ativo</span>
               </div>
               <div className="bg-white p-5 rounded-2xl border border-[#171717]/5 flex flex-col items-center text-center">
                 <Users className="w-6 h-6 text-blue-500 mb-2" />
                 <span className="text-[11px] font-black uppercase tracking-widest text-[#171717]/40 mb-1">Amostragem</span>
                 <span className="text-xl font-black text-[#171717]">Processando</span>
               </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
