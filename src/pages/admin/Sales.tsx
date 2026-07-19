import React from 'react';
import { CreditCard, AlertTriangle, Download, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Sales() {
  return (
    <div className="flex flex-col h-full bg-vf-bg overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-vf-border z-10 shrink-0">
        <div>
          <h1 className="text-lg font-black text-vf-black tracking-tight flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-emerald-600" /> Vendas & Receita
          </h1>
          <p className="text-[11px] text-vf-text-3 font-semibold">Acompanhamento de transações e comissões.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" disabled className="opacity-60 bg-white">
            <Calendar className="w-4 h-4 mr-2" /> Últimos 30 Dias
          </Button>
          <Button variant="outline" size="sm" disabled className="opacity-60 bg-white">
            <Download className="w-4 h-4 mr-2" /> Exportar CSV
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-[800px] mx-auto mt-10">
          <div className="bg-white p-8 rounded-xl border border-vf-border shadow-vf-sm text-center flex flex-col items-center">
            
            <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="w-8 h-8" />
            </div>
            
            <h2 className="text-xl font-black text-vf-black mb-2">Módulo de Transações Indisponível</h2>
            <p className="text-vf-text-2 text-sm max-w-md mb-6 leading-relaxed">
              Não há registro de vendas ou faturamento. A infraestrutura de pagamentos (Stripe/pagamentos integrados) e tabelas de transações ainda não estão implementadas.
            </p>

            <div className="text-left w-full max-w-sm bg-slate-50 p-4 rounded-lg border border-slate-200">
              <h4 className="text-[11px] font-black uppercase text-slate-500 mb-2">Lacuna Documentada (Backend)</h4>
              <ul className="text-xs text-slate-600 space-y-1.5 list-disc pl-4">
                <li>Tabela <code>transactions</code> ou <code>orders</code> ausente.</li>
                <li>Tabela <code>subscriptions</code> ausente.</li>
                <li>Integração com provedor de pagamentos (Stripe/Pagar.me) pendente.</li>
              </ul>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
