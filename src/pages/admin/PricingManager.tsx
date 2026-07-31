import React, { useEffect, useState } from 'react';
import { 
  Percent, 
  Settings, 
  Save, 
  TrendingUp,
  Link2,
  AlertCircle,
  CheckCircle2,
  DollarSign
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/supabase.types';
import { toast } from 'sonner';
import { AdminHeader } from '@/components/admin/AdminHeader';

type ExperienceRow = Database['public']['Tables']['experiences']['Row'];

// Mock Data
const MOCK_MARKUP = {
  defaultMarkup: 15,
  flightMarkup: 5,
  hotelMarkup: 12,
  activityMarkup: 20,
};

export default function PricingManager() {
  const [markup, setMarkup] = useState(MOCK_MARKUP);
  const [experiences, setExperiences] = useState<ExperienceRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadExperiences();
  }, []);

  async function loadExperiences() {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('experiences')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setExperiences(data || []);
    } catch (e: any) {
      toast.error('Erro ao carregar dados: ' + e.message);
    } finally {
      setIsLoading(false);
    }
  }

  const handleMarkupChange = (field: keyof typeof MOCK_MARKUP, value: string) => {
    setMarkup(prev => ({ ...prev, [field]: Number(value) }));
  };

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      toast.success('Regras de markup salvas com sucesso!');
      setIsSaving(false);
    }, 500);
  };

  const totalWithLink = experiences.filter(e => e.booking_url).length;
  const coveragePercent = experiences.length > 0 ? Math.round((totalWithLink / experiences.length) * 100) : 0;

  return (
    <div className="flex flex-col h-full bg-[#F7F7F2] font-sans overflow-auto selection:bg-[#D7F24B] selection:text-[#171717]">
      
      <AdminHeader
        title="Revenue & Afiliados"
        subtitle="Gerencie markups globais, margens de lucro e cobertura de links de parceiros integrados."
        icon={<DollarSign className="w-4 h-4 text-[#171717]" />}
        badgeText="Módulo Financeiro"
        gradient="from-[#E2E2E2] to-[#C9D6FF]" // Silver/Blue gradient for finance
        loading={isLoading}
        metrics={[
          { label: 'Links Cadastrados', value: totalWithLink, color: 'bg-white/40' },
          { label: 'Cobertura Global', value: `${coveragePercent}%`, color: coveragePercent > 80 ? 'bg-emerald-500/10 text-emerald-900 border-emerald-500/20' : 'bg-amber-500/10 text-amber-900 border-amber-500/20' },
        ]}
        actions={
          <button 
            onClick={handleSave} 
            disabled={isSaving}
            className="px-8 py-3 bg-[#171717] hover:bg-[#2a2a2a] text-[#D7F24B] font-black rounded-xl text-sm transition-all shadow-[0_4px_14px_0_rgb(0,0,0,0.1)] active:scale-95 disabled:opacity-50 disabled:pointer-events-none flex items-center gap-2"
          >
            <Save className="w-4 h-4" /> {isSaving ? 'Salvando...' : 'Salvar Regras'}
          </button>
        }
      />

      <div className="flex-1 p-8">
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* ── Left Column: Configuração de Markup ── */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-3xl border border-[#171717]/5 p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-6 border-b border-[#171717]/5 pb-4">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0 border border-blue-100">
                  <Percent className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="font-black text-lg text-[#171717]">Markup Global</h3>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-[11px] font-black uppercase text-[#171717]/40 tracking-widest block mb-2">Markup Padrão (Fallback)</label>
                  <div className="relative">
                    <input 
                      type="number"
                      value={markup.defaultMarkup}
                      onChange={(e) => handleMarkupChange('defaultMarkup', e.target.value)}
                      className="w-full bg-[#171717]/[0.02] border border-[#171717]/10 rounded-xl px-4 py-3 font-bold text-[#171717] focus:border-[#171717]/40 focus:ring-0 outline-none transition-colors"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-[#171717]/40">%</div>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#171717]/5 space-y-4">
                  <h4 className="text-[11px] font-black uppercase text-[#171717]/40 tracking-widest">Overrides Específicos</h4>
                  
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[13px] font-bold text-[#171717]/80 w-24">Voos</span>
                    <div className="relative flex-1">
                      <input 
                        type="number"
                        value={markup.flightMarkup}
                        onChange={(e) => handleMarkupChange('flightMarkup', e.target.value)}
                        className="w-full bg-[#171717]/[0.02] border border-[#171717]/10 rounded-xl px-4 py-2 text-sm font-bold text-[#171717] focus:border-[#171717]/40 outline-none transition-colors"
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-[#171717]/40 text-xs">%</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[13px] font-bold text-[#171717]/80 w-24">Hotéis</span>
                    <div className="relative flex-1">
                      <input 
                        type="number"
                        value={markup.hotelMarkup}
                        onChange={(e) => handleMarkupChange('hotelMarkup', e.target.value)}
                        className="w-full bg-[#171717]/[0.02] border border-[#171717]/10 rounded-xl px-4 py-2 text-sm font-bold text-[#171717] focus:border-[#171717]/40 outline-none transition-colors"
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-[#171717]/40 text-xs">%</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[13px] font-bold text-[#171717]/80 w-24">Atividades</span>
                    <div className="relative flex-1">
                      <input 
                        type="number"
                        value={markup.activityMarkup}
                        onChange={(e) => handleMarkupChange('activityMarkup', e.target.value)}
                        className="w-full bg-[#171717]/[0.02] border border-[#171717]/10 rounded-xl px-4 py-2 text-sm font-bold text-[#171717] focus:border-[#171717]/40 outline-none transition-colors"
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-[#171717]/40 text-xs">%</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-amber-50 text-amber-800 p-6 rounded-3xl border border-amber-200">
              <h3 className="font-black text-sm flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-amber-600" /> Ambiente Simulado
              </h3>
              <p className="text-[12px] opacity-80 leading-relaxed font-medium">
                As métricas de cobertura de links buscam dados reais do Catálogo. 
                Porém, a configuração de markup e cálculo de comissões finais aguardam a integração com a API de pagamentos (Stripe/Pagar.me).
              </p>
            </div>
          </div>

          {/* ── Right Column: Cobertura de Afiliados ── */}
          <div className="lg:col-span-8 flex flex-col h-full space-y-6">
            
            <div className="bg-white rounded-3xl border border-[#171717]/5 shadow-sm flex-1 flex flex-col min-h-[500px] overflow-hidden">
              <div className="flex items-center gap-3 p-6 border-b border-[#171717]/5 bg-white z-10">
                <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center shrink-0 border border-indigo-100">
                   <Link2 className="w-5 h-5 text-indigo-600" />
                </div>
                <h3 className="text-lg font-black tracking-tight text-[#171717]">Auditoria de Links de Reserva</h3>
              </div>
              
              <div className="flex-1 overflow-auto">
                {isLoading ? (
                  <div className="h-full flex items-center justify-center p-8">
                    <div className="text-[#171717]/40 font-bold text-sm">Carregando links...</div>
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-white sticky top-0 z-10 shadow-sm border-b border-[#171717]/5">
                      <tr>
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[#171717]/40">Item</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[#171717]/40">Categoria</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[#171717]/40 text-right">Preço Base</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[#171717]/40">Status do Link</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#171717]/5">
                      {experiences.map((exp) => (
                        <tr key={exp.id} className="hover:bg-[#171717]/[0.02] transition-colors group">
                          <td className="px-6 py-4">
                            <div className="font-bold text-[13px] text-[#171717]">{exp.title}</div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-[10px] font-black text-[#171717]/60 bg-[#171717]/5 px-2 py-1 rounded-md uppercase tracking-wider">
                              {exp.category}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className="text-[13px] font-black text-[#171717]">${exp.base_cost?.toFixed(2) || '0.00'}</span>
                          </td>
                          <td className="px-6 py-4">
                            {exp.booking_url ? (
                              <div className="inline-flex items-center gap-1.5 text-[11px] font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-100 uppercase tracking-wider">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Configurado</span>
                              </div>
                            ) : (
                              <div className="inline-flex items-center gap-1.5 text-[11px] font-black text-red-700 bg-red-50 px-2.5 py-1 rounded-md border border-red-100 uppercase tracking-wider">
                                <AlertCircle className="w-3.5 h-3.5" />
                                <span>Faltando Link</span>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                      {experiences.length === 0 && (
                        <tr>
                          <td colSpan={4} className="p-8 text-center text-[#171717]/40 font-bold text-sm">
                            Nenhum item cadastrado no catálogo.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
