import React from 'react';
import { CreditCard, AlertTriangle, Download, Calendar, Wallet } from 'lucide-react';
import { AdminHeader } from '@/components/admin/AdminHeader';

export default function Sales() {
  return (
    <div className="flex flex-col h-full bg-[#F7F7F2] font-sans overflow-auto selection:bg-[#D7F24B] selection:text-[#171717]">
      <AdminHeader
        title="Vendas & Receita"
        subtitle="Acompanhamento consolidado de transações, comissões de afiliados e faturamento global do aplicativo."
        icon={<CreditCard className="w-4 h-4 text-[#171717]" />}
        badgeText="Módulo Financeiro"
        gradient="from-[#E2E2E2] to-[#C9D6FF]" // Silver/Blue gradient for finance
        metrics={[
          { label: 'Receita Bruta (Mês)', value: 'R$ -', color: 'bg-white/40' },
          { label: 'Comissões Pendentes', value: 'R$ -', color: 'bg-amber-500/10 text-amber-900 border-amber-500/20' },
        ]}
        actions={
          <div className="flex items-center gap-3">
            <button 
              disabled
              className="px-6 py-2.5 bg-white/40 backdrop-blur-md text-[#171717]/60 font-black rounded-xl text-sm transition-all border border-white/40 shadow-sm opacity-50 flex items-center gap-2"
            >
              <Calendar className="w-4 h-4" /> Últimos 30 Dias
            </button>
            <button 
              disabled
              className="px-6 py-2.5 bg-[#171717] text-[#D7F24B] font-black rounded-xl text-sm transition-all shadow-sm opacity-50 flex items-center gap-2"
            >
              <Download className="w-4 h-4" /> Exportar CSV
            </button>
          </div>
        }
      />

      <div className="flex-1 p-8">
        <div className="max-w-[800px] mx-auto mt-10">
          <div className="bg-white/60 backdrop-blur-xl p-10 rounded-3xl border border-white/40 shadow-sm text-center flex flex-col items-center">
            
            <div className="w-20 h-20 bg-gradient-to-br from-[#E2E2E2] to-[#C9D6FF] text-[#171717] rounded-2xl flex items-center justify-center mb-6 shadow-sm -rotate-3">
              <Wallet className="w-10 h-10 rotate-3" />
            </div>
            
            <h2 className="text-3xl font-black text-[#171717] tracking-tight mb-3">Gateway de Pagamentos Pendente</h2>
            <p className="text-[#171717]/60 text-lg max-w-md mb-8 leading-relaxed font-medium">
              Não há registro de vendas ou faturamento. A infraestrutura de pagamentos e liquidação de comissões não está conectada ao Catálogo.
            </p>

            <div className="w-full max-w-md bg-white p-5 rounded-2xl border border-[#171717]/5 flex items-start gap-4 text-left">
               <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center shrink-0 border border-amber-100 mt-1">
                 <AlertTriangle className="w-5 h-5 text-amber-500" />
               </div>
               <div>
                 <h4 className="text-[11px] font-black uppercase tracking-widest text-[#171717]/40 mb-1">Status de Integração</h4>
                 <p className="text-[13px] font-bold text-[#171717]/80">Aguardando implementação da integração com Stripe/Pagar.me e tabelas de faturamento (<code className="bg-[#171717]/5 px-1.5 py-0.5 rounded text-[11px] font-mono">transactions</code>, <code className="bg-[#171717]/5 px-1.5 py-0.5 rounded text-[11px] font-mono">orders</code>).</p>
               </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
