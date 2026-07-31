import React, { useState } from 'react';
import { Settings as SettingsIcon, Save, Database, Shield, Zap, Map, Layout, Key, Palette, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { AdminHeader } from '@/components/admin/AdminHeader';

export default function Settings() {
  const [saving, setSaving] = useState(false);

  // Mapeamento das configurações verdadeiras baseadas no estado atual do projeto
  const [config, setConfig] = useState({
    appName: 'Voyage Flow',
    brandColor: '#E2F18A', // D7F24B in our new theme, but keeping legacy default for display
    brandDarkColor: '#171717',
    mapProvider: 'MapLibre / OpenFreeMap',
    engineVersion: 'v2 (EI-9)',
    cacheDuration: 3600, // 1h
    importAIEnabled: true,
    experimentalDragDrop: true,
  });

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      toast.success('Configurações salvas com sucesso!');
      setSaving(false);
    }, 600);
  };

  return (
    <div className="flex flex-col h-full bg-[#F7F7F2] font-sans overflow-auto selection:bg-[#D7F24B] selection:text-[#171717]">
      <AdminHeader
        title="Configurações do Sistema"
        subtitle="Gerencie parâmetros globais da aplicação, identidades visuais e chaves de API externas."
        icon={<SettingsIcon className="w-4 h-4 text-[#171717]" />}
        badgeText="Módulo de Controle"
        gradient="from-[#E2D1C3] to-[#FDFCFB]" // Beige/White gradient
        loading={false}
        metrics={[
          { label: 'Versão do App', value: '1.0.0', color: 'bg-white/40' },
          { label: 'Ambiente', value: 'Produção', color: 'bg-emerald-500/10 text-emerald-900 border-emerald-500/20' },
        ]}
        actions={
          <button 
            onClick={handleSave} 
            disabled={saving}
            className="px-8 py-3 bg-[#171717] hover:bg-[#2a2a2a] text-[#D7F24B] font-black rounded-xl text-sm transition-all shadow-[0_4px_14px_0_rgb(0,0,0,0.1)] active:scale-95 disabled:opacity-50 disabled:pointer-events-none flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        }
      />

      <div className="flex-1 p-8">
        <div className="max-w-[1200px] mx-auto space-y-8 pb-10">
          
          <div className="bg-amber-50 text-amber-800 p-6 rounded-3xl border border-amber-200 flex items-start gap-4 shadow-sm">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
               <AlertCircle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="font-black text-lg text-amber-900">Dependência de Backend (Lacuna)</h3>
              <p className="text-sm mt-1 text-amber-800/80 font-medium leading-relaxed">
                As configurações globais do sistema ainda não estão persistidas no banco. A tabela <code className="bg-amber-100/50 px-1.5 py-0.5 rounded text-[11px] font-mono">system_settings</code> ou equivalente precisa ser criada. 
                Os valores apresentados refletem o estado codificado do projeto atual (Environment/Código). Edições aqui são aplicadas apenas na memória (Sessão Local).
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Aplicação & Identidade */}
            <div className="bg-white p-8 rounded-3xl border border-[#171717]/5 shadow-sm space-y-6">
              <div className="flex items-center gap-3 mb-6 border-b border-[#171717]/5 pb-4">
                <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center shrink-0 border border-rose-100">
                  <Palette className="w-5 h-5 text-rose-600" />
                </div>
                <h2 className="font-black text-xl text-[#171717]">Identidade Visual</h2>
              </div>
              <div className="space-y-6">
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-widest text-[#171717]/40 mb-2">Nome da Aplicação</label>
                  <input 
                    type="text" 
                    value={config.appName}
                    onChange={(e) => setConfig({ ...config, appName: e.target.value })}
                    className="w-full h-12 px-4 border border-[#171717]/10 rounded-xl text-[13px] font-bold text-[#171717] bg-[#171717]/[0.02] focus:border-[#171717]/40 focus:ring-0 outline-none transition-colors"
                  />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-widest text-[#171717]/40 mb-2">Cor Primária (Lime)</label>
                    <div className="flex items-center gap-3">
                      <input 
                        type="color" 
                        value={config.brandColor} 
                        onChange={(e) => setConfig({ ...config, brandColor: e.target.value })} 
                        className="w-10 h-10 rounded-lg cursor-pointer border-0 bg-transparent p-0" 
                      />
                      <span className="text-[13px] font-mono font-bold text-[#171717] uppercase">{config.brandColor}</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-widest text-[#171717]/40 mb-2">Cor Escura</label>
                    <div className="flex items-center gap-3">
                      <input 
                        type="color" 
                        value={config.brandDarkColor} 
                        onChange={(e) => setConfig({ ...config, brandDarkColor: e.target.value })} 
                        className="w-10 h-10 rounded-lg cursor-pointer border-0 bg-transparent p-0" 
                      />
                      <span className="text-[13px] font-mono font-bold text-[#171717] uppercase">{config.brandDarkColor}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Mapas & Integrações */}
            <div className="bg-white p-8 rounded-3xl border border-[#171717]/5 shadow-sm space-y-6">
              <div className="flex items-center gap-3 mb-6 border-b border-[#171717]/5 pb-4">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0 border border-blue-100">
                  <Map className="w-5 h-5 text-blue-600" />
                </div>
                <h2 className="font-black text-xl text-[#171717]">Integrações & Mapas</h2>
              </div>
              <div className="space-y-6">
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-widest text-[#171717]/40 mb-2">Provedor de Mapas</label>
                  <input 
                    type="text" 
                    value={config.mapProvider}
                    disabled
                    className="w-full h-12 px-4 border border-[#171717]/10 rounded-xl text-[13px] font-bold text-[#171717] bg-[#171717]/5 opacity-60"
                  />
                  <p className="text-[11px] font-medium text-[#171717]/60 mt-2">O projeto adota MapLibre + OpenFreeMap para renders sem Google Maps.</p>
                </div>
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-widest text-[#171717]/40 mb-2">Integração de Importação via IA</label>
                  <div className="flex items-center gap-3 mt-3">
                    <input 
                      type="checkbox" 
                      checked={config.importAIEnabled} 
                      onChange={(e) => setConfig({ ...config, importAIEnabled: e.target.checked })}
                      className="w-5 h-5 rounded border-[#171717]/20 text-[#171717] focus:ring-[#171717]" 
                    />
                    <span className="text-[13px] font-bold text-[#171717]">Edge Function (import-bulk) ativada</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Engine & Cache */}
            <div className="bg-white p-8 rounded-3xl border border-[#171717]/5 shadow-sm space-y-6">
              <div className="flex items-center gap-3 mb-6 border-b border-[#171717]/5 pb-4">
                <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center shrink-0 border border-purple-100">
                  <Database className="w-5 h-5 text-purple-600" />
                </div>
                <h2 className="font-black text-xl text-[#171717]">Engine & Cache</h2>
              </div>
              <div className="space-y-6">
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-widest text-[#171717]/40 mb-2">Versão do Motor</label>
                  <input 
                    type="text" 
                    value={config.engineVersion}
                    disabled
                    className="w-full h-12 px-4 border border-[#171717]/10 rounded-xl text-[13px] font-bold text-[#171717] bg-[#171717]/5 opacity-60"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-widest text-[#171717]/40 mb-2">Duração do Cache (segundos)</label>
                  <input 
                    type="number" 
                    value={config.cacheDuration}
                    onChange={(e) => setConfig({ ...config, cacheDuration: parseInt(e.target.value) })}
                    className="w-full h-12 px-4 border border-[#171717]/10 rounded-xl text-[13px] font-bold text-[#171717] bg-[#171717]/[0.02] focus:border-[#171717]/40 focus:ring-0 outline-none transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Funcionalidades Experimentais */}
            <div className="bg-white p-8 rounded-3xl border border-[#171717]/5 shadow-sm space-y-6">
              <div className="flex items-center gap-3 mb-6 border-b border-[#171717]/5 pb-4">
                <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center shrink-0 border border-orange-100">
                  <Zap className="w-5 h-5 text-orange-600" />
                </div>
                <h2 className="font-black text-xl text-[#171717]">Labs (Experimentais)</h2>
              </div>
              <div className="space-y-6">
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-widest text-[#171717]/40 mb-2">Edição Visual (Drag and Drop)</label>
                  <div className="flex items-center gap-3 mt-3">
                    <input 
                      type="checkbox" 
                      checked={config.experimentalDragDrop} 
                      onChange={(e) => setConfig({ ...config, experimentalDragDrop: e.target.checked })}
                      className="w-5 h-5 rounded border-[#171717]/20 text-[#171717] focus:ring-[#171717]" 
                    />
                    <span className="text-[13px] font-bold text-[#171717]">Ativar DnD e edição parcial (EI-9/EI-10)</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
