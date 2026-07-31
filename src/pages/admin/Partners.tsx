import React from 'react';
import { Briefcase, AlertTriangle, Plus, Search, Building2, Workflow } from 'lucide-react';
import { AdminHeader } from '@/components/admin/AdminHeader';

export default function Partners() {
  return (
    <div className="flex flex-col h-full bg-[#F7F7F2] font-sans overflow-auto selection:bg-[#D7F24B] selection:text-[#171717]">
      <AdminHeader
        title="Parceiros Comerciais"
        subtitle="Gestão de B2B, agências e operadores turísticos conectados ao ecossistema Voyage Flow."
        icon={<Briefcase className="w-4 h-4 text-[#171717]" />}
        badgeText="Módulo de Receita"
        gradient="from-[#C6EA8D] to-[#FE90AF]" // Green to Pink gradient for Business
        metrics={[
          { label: 'Parceiros Ativos', value: '-', color: 'bg-white/40' },
          { label: 'Receita Indireta', value: 'R$ -', color: 'bg-emerald-500/10 text-emerald-900 border-emerald-500/20' },
        ]}
        actions={
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white/40 backdrop-blur-md rounded-xl p-1 border border-white/40 shadow-sm relative w-[280px]">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#171717]/40" />
              <input 
                type="text"
                placeholder="Buscar parceiro..."
                disabled
                className="w-full pl-11 pr-4 h-10 bg-transparent border-0 text-[13px] font-bold text-[#171717] placeholder:text-[#171717]/40 outline-none opacity-50"
              />
            </div>
            <button 
              disabled
              className="px-6 py-2.5 bg-[#171717] text-[#D7F24B] font-black rounded-xl text-sm transition-all shadow-sm opacity-50 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Novo Parceiro
            </button>
          </div>
        }
      />

      <div className="flex-1 p-8">
        <div className="max-w-[800px] mx-auto mt-10">
          <div className="bg-white/60 backdrop-blur-xl p-10 rounded-3xl border border-white/40 shadow-sm text-center flex flex-col items-center">
            
            <div className="w-20 h-20 bg-gradient-to-br from-[#C6EA8D] to-[#FE90AF] text-[#171717] rounded-2xl flex items-center justify-center mb-6 shadow-sm rotate-3">
              <Building2 className="w-10 h-10 -rotate-3" />
            </div>
            
            <h2 className="text-3xl font-black text-[#171717] tracking-tight mb-3">Módulo em Desenvolvimento</h2>
            <p className="text-[#171717]/60 text-lg max-w-md mb-8 leading-relaxed font-medium">
              O gerenciamento de parceiros integrará as comissões B2B ao Motor de IA. A infraestrutura de banco de dados (tabelas <code className="bg-[#171717]/5 px-1.5 py-0.5 rounded text-sm font-mono font-bold">partners</code> e <code className="bg-[#171717]/5 px-1.5 py-0.5 rounded text-sm font-mono font-bold">partner_commissions</code>) está sendo provisionada.
            </p>

            <div className="w-full max-w-md bg-white p-5 rounded-2xl border border-[#171717]/5 flex items-start gap-4 text-left">
               <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center shrink-0 border border-amber-100 mt-1">
                 <AlertTriangle className="w-5 h-5 text-amber-500" />
               </div>
               <div>
                 <h4 className="text-[11px] font-black uppercase tracking-widest text-[#171717]/40 mb-1">Status de Integração</h4>
                 <p className="text-[13px] font-bold text-[#171717]/80">Aguardando deploy das tabelas de comissionamento e chaves de API para ativação do painel B2B.</p>
               </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
