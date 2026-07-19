import React from 'react';
import { Briefcase, AlertTriangle, Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function Partners() {
  return (
    <div className="flex flex-col h-full bg-vf-bg overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-vf-border z-10 shrink-0">
        <div>
          <h1 className="text-lg font-black text-vf-black tracking-tight flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-emerald-600" /> Parceiros Comerciais
          </h1>
          <p className="text-[11px] text-vf-text-3 font-semibold">Gestão de B2B, agências e operadores turísticos.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-vf-text-3 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input 
              type="text" 
              placeholder="Buscar parceiro..." 
              disabled
              className="pl-9 w-64 h-9 text-[13px] bg-slate-50 opacity-60"
            />
          </div>
          <Button variant="lime" size="sm" disabled className="opacity-60">
            <Plus className="w-4 h-4" /> Novo Parceiro
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-[800px] mx-auto mt-10">
          <div className="bg-white p-8 rounded-xl border border-vf-border shadow-vf-sm text-center flex flex-col items-center">
            
            <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="w-8 h-8" />
            </div>
            
            <h2 className="text-xl font-black text-vf-black mb-2">Módulo Não Conectado</h2>
            <p className="text-vf-text-2 text-sm max-w-md mb-6 leading-relaxed">
              O gerenciamento de parceiros requer a criação da tabela <code className="bg-slate-100 text-slate-800 px-1 py-0.5 rounded text-xs font-mono">partners</code> no Supabase. 
              Atualmente, não há backend disponível para armazenar perfis comerciais, comissionamento e chaves de API.
            </p>

            <div className="text-left w-full max-w-sm bg-slate-50 p-4 rounded-lg border border-slate-200">
              <h4 className="text-[11px] font-black uppercase text-slate-500 mb-2">Lacuna Documentada (Backend)</h4>
              <ul className="text-xs text-slate-600 space-y-1.5 list-disc pl-4">
                <li>Tabela <code>partners</code> ausente.</li>
                <li>Tabela <code>partner_commissions</code> ausente.</li>
                <li>Autenticação B2B via Edge Functions ausente.</li>
              </ul>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
