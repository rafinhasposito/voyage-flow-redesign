import React, { useState } from 'react';
import { Settings, Shield, AlertTriangle, Zap, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { AdminHeader } from '@/components/admin/AdminHeader';

const INITIAL_RULES = [
  { 
    id: 'ei-7', 
    name: 'Restrições Hard (EI-7)', 
    category: 'Segurança', 
    status: true,
    priority: 'Bloqueante',
    desc: 'O Motor rejeita rotas onde a restrição de idade, acessibilidade ou formatação do grupo (ex: Adult-only) é violada.'
  },
  { 
    id: 'ei-8', 
    name: 'Viabilidade Logística (EI-8)', 
    category: 'Física', 
    status: true,
    priority: 'Alta',
    desc: 'Considera tempos de deslocamento (Transit API), horários de funcionamento e duração. Roteiros que extrapolam o tempo disponível diário sofrem penalidade infinita.'
  },
  { 
    id: 'ei-9', 
    name: 'Edição Manual e Conflitos (EI-9)', 
    category: 'UX', 
    status: true,
    priority: 'Sobrescrita',
    desc: 'Se o usuário fixa um evento em um slot impossível, a Engine prioriza a ação do usuário e marca como CONFLITO, em vez de apagar a experiência sumariamente.'
  },
  { 
    id: 'neuro-pace', 
    name: 'Fadiga e Ritmo (Neuro-Match)', 
    category: 'Neuromarketing', 
    status: true,
    priority: 'Alta',
    desc: 'Penaliza severamente a combinação de viajantes com ritmo "Relaxado" e atrações de alta energia física. (Ativado no MatchEngine 2.0).'
  },
  { 
    id: 'must-see', 
    name: 'Priorização de Must See', 
    category: 'Curadoria', 
    status: true,
    priority: 'Média',
    desc: 'Multiplicador de pontuação base (score) para itens marcados como Must See pelo Concierge ou IA.'
  },
];

export default function EngineRules() {
  const [rules, setRules] = useState(INITIAL_RULES);
  const [saving, setSaving] = useState(false);

  const toggleRule = (id: string) => {
    setRules(rules.map(r => r.id === id ? { ...r, status: !r.status } : r));
  };

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      toast.success('Regras do motor atualizadas localmente.');
      setSaving(false);
    }, 500);
  };

  return (
    <div className="flex flex-col h-full bg-[#F7F7F2] font-sans overflow-auto selection:bg-[#D7F24B] selection:text-[#171717]">
      <AdminHeader
        title="Regras do Motor (Engine)"
        subtitle="Controle absoluto sobre as heurísticas e comportamentos do Match Engine 2.0."
        icon={<Settings className="w-4 h-4 text-[#171717]" />}
        badgeText="Módulo de Inteligência"
        gradient="from-[#FFD166] to-[#EF476F]" // Orange/Red gradient for rules engine
        loading={false}
        metrics={[
          { label: 'Regras Ativas', value: rules.filter(r => r.status).length, color: 'bg-emerald-500/10 text-emerald-900 border-emerald-500/20' },
          { label: 'Engine', value: '2.0.4', color: 'bg-white/40' },
        ]}
        actions={
          <button 
            onClick={handleSave} 
            disabled={saving}
            className="px-8 py-3 bg-[#171717] hover:bg-[#2a2a2a] text-white font-black rounded-xl text-sm transition-all shadow-[0_4px_14px_0_rgb(0,0,0,0.1)] active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
          >
            {saving ? 'Salvando...' : 'Salvar Engine'}
          </button>
        }
      />

      <div className="flex-1 p-8">
        <div className="max-w-[1200px] mx-auto space-y-6">
          
          <div className="bg-emerald-50 text-emerald-800 p-6 rounded-3xl border border-emerald-200 flex items-start gap-4 shadow-sm">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
               <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-black text-lg text-emerald-900">Engine Operacional (v2.0)</h3>
              <p className="text-sm mt-1 text-emerald-800/80 font-medium">A nova lógica de Neuromarketing e Personas IA está ativa e monitorando o catálogo em tempo real.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {rules.map(rule => (
              <div 
                key={rule.id} 
                className={`rounded-3xl border p-6 flex flex-col transition-all duration-300 ${rule.status ? 'bg-white border-[#171717]/5 shadow-sm hover:shadow-md' : 'bg-[#171717]/[0.02] border-[#171717]/5 opacity-60'}`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-black text-[#171717] text-xl leading-tight mb-1">{rule.name}</h4>
                    <span className="text-[10px] font-black uppercase text-[#171717]/40 tracking-widest">{rule.category}</span>
                  </div>
                  
                  {/* Toggle Button */}
                  <button 
                    onClick={() => toggleRule(rule.id)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${rule.status ? 'bg-[#D7F24B]' : 'bg-[#171717]/20'}`}
                  >
                    <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${rule.status ? 'translate-x-2.5' : '-translate-x-2.5'}`} />
                  </button>

                </div>
                
                <p className="text-[13px] font-medium text-[#171717]/60 mb-6 flex-1 leading-relaxed">{rule.desc}</p>
                
                <div className="pt-4 border-t border-[#171717]/5 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#171717]/40">
                    <Shield className="w-4 h-4" />
                    Prioridade:
                  </div>
                  <span className={`text-[11px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md ${
                    rule.priority === 'Bloqueante' ? 'bg-red-50 text-red-600' :
                    rule.priority === 'Sobrescrita' ? 'bg-indigo-50 text-indigo-600' :
                    'bg-orange-50 text-orange-600'
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
