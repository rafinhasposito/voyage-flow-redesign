import React from 'react';
import { Settings, Shield, AlertTriangle, Zap, CheckCircle2 } from 'lucide-react';

const ENGINE_RULES = [
  { 
    id: 'ei-7', 
    name: 'Restrições Hard (EI-7)', 
    category: 'Segurança', 
    status: 'Ativo',
    priority: 'Bloqueante',
    desc: 'O Motor rejeita rotas onde a restrição de idade, acessibilidade ou formatação do grupo (ex: Adult-only) é violada.'
  },
  { 
    id: 'ei-8', 
    name: 'Viabilidade Logística (EI-8)', 
    category: 'Física', 
    status: 'Ativo',
    priority: 'Alta',
    desc: 'Considera tempos de deslocamento (Transit API), horários de funcionamento e duração. Roteiros que extrapolam o tempo disponível diário sofrem penalidade infinita.'
  },
  { 
    id: 'ei-9', 
    name: 'Edição Manual e Conflitos (EI-9)', 
    category: 'UX', 
    status: 'Ativo',
    priority: 'Sobrescrita',
    desc: 'Se o usuário fixa um evento em um slot impossível, a Engine prioriza a ação do usuário e marca como CONFLITO, em vez de apagar a experiência sumariamente.'
  },
  { 
    id: 'must-see', 
    name: 'Priorização de Must See', 
    category: 'Curadoria', 
    status: 'Ativo',
    priority: 'Média',
    desc: 'Multiplicador de 1.5x na pontuação base (score) para itens marcados como Must See pelo Concierge ou IA.'
  },
  { 
    id: 'transit', 
    name: 'Fallback de Trânsito Desconhecido', 
    category: 'Logística', 
    status: 'Ativo',
    priority: 'Baixa',
    desc: 'Se a API de mapas falhar (ou offline), a Engine assume 15 minutos fixos de deslocamento aéreo intra-bairro e 45 minutos inter-bairro.'
  }
];

export default function EngineRules() {
  return (
    <div className="flex flex-col h-full bg-vf-bg overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-vf-border z-10 shrink-0">
        <div>
          <h1 className="text-lg font-black text-vf-black tracking-tight flex items-center gap-2">
            <Settings className="w-4 h-4 text-emerald-600" /> Transparência do Motor (Engine)
          </h1>
          <p className="text-[11px] text-vf-text-3 font-semibold">Auditoria das regras determinísticas em execução.</p>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-[1000px] mx-auto space-y-6">
          
          <div className="bg-emerald-50 text-emerald-800 p-4 rounded-xl border border-emerald-200 flex items-start gap-4">
            <CheckCircle2 className="w-6 h-6 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-sm">Engine Operacional</h3>
              <p className="text-xs mt-1 opacity-80">As políticas de validação estão rodando na versão mais recente (EI-9). O roteador respeita fixações manuais e tempo logístico.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ENGINE_RULES.map(rule => (
              <div key={rule.id} className="bg-white rounded-xl border border-vf-border shadow-vf-sm p-5 flex flex-col">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-black text-vf-black text-lg leading-tight">{rule.name}</h4>
                    <span className="text-[10px] font-black uppercase text-vf-text-3 tracking-widest">{rule.category}</span>
                  </div>
                  <div className="px-2 py-1 bg-emerald-100 text-emerald-800 rounded text-[10px] font-black uppercase shrink-0">
                    {rule.status}
                  </div>
                </div>
                
                <p className="text-sm text-vf-text-2 mb-4 flex-1">{rule.desc}</p>
                
                <div className="pt-3 border-t border-vf-border/50 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                    <Shield className="w-3.5 h-3.5" />
                    Prioridade:
                  </div>
                  <span className={`text-[11px] font-black uppercase ${
                    rule.priority === 'Bloqueante' ? 'text-rose-600' :
                    rule.priority === 'Sobrescrita' ? 'text-indigo-600' :
                    'text-amber-600'
                  }`}>
                    {rule.priority}
                  </span>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}
