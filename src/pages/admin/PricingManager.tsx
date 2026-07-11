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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

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
    <div className="flex flex-col h-full bg-vf-bg overflow-hidden">
      
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-vf-border z-10 shrink-0">
        <div>
          <h1 className="text-lg font-black text-vf-black tracking-tight flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-600" /> Revenue & Afiliados
          </h1>
          <p className="text-[11px] text-vf-text-3 font-semibold">Gerencie markups globais e links de parceiros.</p>
        </div>
        <Button variant="lime" onClick={handleSave} disabled={isSaving} size="sm">
          <Save className="w-4 h-4" /> {isSaving ? 'Salvando...' : 'Salvar Regras'}
        </Button>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* ── Left Column: Configuração de Markup ── */}
          <div className="lg:col-span-4 space-y-6">
            
            <div className="bg-white rounded-xl border border-vf-border shadow-vf-sm p-6 space-y-5">
              <div className="flex items-center gap-2 pb-3 border-b border-vf-border/50">
                <TrendingUp className="w-4 h-4 text-vf-text-2" />
                <h3 className="text-[13px] font-black uppercase tracking-widest text-vf-black">Markup Global</h3>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-widest text-vf-text-3">Markup Padrão (%)</label>
                <div className="relative">
                  <Input 
                    type="number" 
                    className="pl-8 h-10 font-black text-lg"
                    value={markup.defaultMarkup}
                    onChange={(e) => handleMarkupChange('defaultMarkup', e.target.value)}
                  />
                  <Percent className="w-4 h-4 text-vf-text-3 absolute left-2.5 top-1/2 -translate-y-1/2" />
                </div>
                <p className="text-[10px] text-vf-text-3">Aplicado quando não houver regra específica de categoria.</p>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-vf-border shadow-vf-sm p-6 space-y-5">
              <div className="flex items-center gap-2 pb-3 border-b border-vf-border/50">
                <Settings className="w-4 h-4 text-vf-text-2" />
                <h3 className="text-[13px] font-black uppercase tracking-widest text-vf-black">Regras por Categoria</h3>
              </div>
              <div className="space-y-4">
                {[
                  { id: 'flightMarkup', label: 'Voos (Aéreo)' },
                  { id: 'hotelMarkup', label: 'Hospedagens' },
                  { id: 'activityMarkup', label: 'Atrações & Eventos' },
                ].map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-4">
                    <label className="text-[12px] font-bold text-vf-black">{item.label}</label>
                    <div className="relative w-24">
                      <Input 
                        type="number" 
                        className="pr-8 h-9 text-right font-black"
                        value={markup[item.id as keyof typeof MOCK_MARKUP]}
                        onChange={(e) => handleMarkupChange(item.id as keyof typeof MOCK_MARKUP, e.target.value)}
                      />
                      <Percent className="w-3.5 h-3.5 text-vf-text-3 absolute right-2.5 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* ── Right Column: Cobertura de Afiliados ── */}
          <div className="lg:col-span-8 flex flex-col h-full space-y-6">
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-vf-border shadow-vf-sm p-5">
                <div className="text-[11px] font-bold uppercase tracking-widest text-vf-text-3 mb-1">Total de Links</div>
                <div className="text-3xl font-black text-vf-black">{totalWithLink} <span className="text-lg text-vf-text-3 font-semibold">/ {experiences.length}</span></div>
              </div>
              <div className="bg-white rounded-xl border border-vf-border shadow-vf-sm p-5">
                <div className="text-[11px] font-bold uppercase tracking-widest text-vf-text-3 mb-1">Cobertura</div>
                <div className="flex items-end gap-2">
                  <div className="text-3xl font-black text-vf-black">{coveragePercent}%</div>
                  <div className={`text-xs font-bold mb-1 ${coveragePercent > 80 ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {coveragePercent > 80 ? 'Excelente' : 'Atenção Necessária'}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-vf-border shadow-vf-sm flex-1 flex flex-col min-h-[400px]">
              <div className="flex items-center gap-2 p-5 border-b border-vf-border/50">
                <Link2 className="w-4 h-4 text-vf-text-2" />
                <h3 className="text-[13px] font-black uppercase tracking-widest text-vf-black">Auditoria de Links</h3>
              </div>
              
              <div className="flex-1 overflow-auto">
                {isLoading ? (
                  <div className="h-full flex items-center justify-center p-8">
                    <div className="w-6 h-6 border-2 border-vf-lime border-t-vf-black rounded-full animate-spin" />
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-vf-muted sticky top-0 z-10 shadow-sm">
                      <tr>
                        <th className="px-5 py-3 text-[10px] font-black uppercase tracking-widest text-vf-text-3">Item</th>
                        <th className="px-5 py-3 text-[10px] font-black uppercase tracking-widest text-vf-text-3">Categoria</th>
                        <th className="px-5 py-3 text-[10px] font-black uppercase tracking-widest text-vf-text-3 text-right">Preço Base</th>
                        <th className="px-5 py-3 text-[10px] font-black uppercase tracking-widest text-vf-text-3">Status do Link</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-vf-border">
                      {experiences.map((exp) => (
                        <tr key={exp.id} className="hover:bg-vf-muted/50 transition-colors">
                          <td className="px-5 py-3">
                            <div className="font-bold text-[13px] text-vf-black">{exp.title}</div>
                          </td>
                          <td className="px-5 py-3">
                            <span className="text-[11px] font-semibold text-vf-text-2 bg-vf-muted px-2 py-0.5 rounded-md capitalize">
                              {exp.category}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-right">
                            <span className="text-[13px] font-black text-vf-black">${exp.base_cost?.toFixed(2) || '0.00'}</span>
                          </td>
                          <td className="px-5 py-3">
                            {exp.booking_url ? (
                              <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-100">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Configurado</span>
                              </div>
                            ) : (
                              <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-md border border-rose-100">
                                <AlertCircle className="w-3.5 h-3.5" />
                                <span>Faltando Link</span>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                      {experiences.length === 0 && (
                        <tr>
                          <td colSpan={4} className="p-8 text-center text-vf-text-3 text-sm">
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
