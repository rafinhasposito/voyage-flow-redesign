import React, { useState } from 'react';
import { Settings as SettingsIcon, Save, Database, Shield, Zap, Map, Layout, Key, Palette, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function Settings() {
  const [saving, setSaving] = useState(false);

  // Mapeamento das configurações verdadeiras baseadas no estado atual do projeto
  const [config, setConfig] = useState({
    appName: 'Voyage Flow',
    brandColor: '#E2F18A',
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
    <div className="flex flex-col h-full bg-vf-bg overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-vf-border z-10 shrink-0">
        <div>
          <h1 className="text-lg font-black text-vf-black tracking-tight flex items-center gap-2">
            <SettingsIcon className="w-4 h-4 text-emerald-600" /> Configurações do Sistema
          </h1>
          <p className="text-[11px] text-vf-text-3 font-semibold">Gerencie os parâmetros globais da aplicação.</p>
        </div>
        <Button variant="lime" onClick={handleSave} disabled={saving} size="sm">
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Salvando...' : 'Salvar Alterações'}
        </Button>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-[1000px] mx-auto space-y-8 pb-10">
          
          <div className="bg-amber-50 text-amber-800 p-4 rounded-xl border border-amber-200 flex items-start gap-4">
            <AlertCircle className="w-6 h-6 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-sm">Dependência de Backend (Lacuna)</h3>
              <p className="text-xs mt-1 opacity-80 leading-relaxed">
                As configurações globais do sistema ainda não estão persistidas no banco. A tabela <code>system_settings</code> ou equivalente precisa ser criada. 
                Os valores apresentados refletem o estado codificado do projeto atual (Environment/Código). Edições aqui são aplicadas na memória (Local).
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Aplicação & Identidade */}
            <div className="bg-white p-6 rounded-xl border border-vf-border shadow-vf-sm space-y-4">
              <div className="flex items-center gap-2 mb-4 border-b border-vf-border pb-2">
                <Palette className="w-4 h-4 text-vf-text-2" />
                <h2 className="font-black text-vf-black text-sm uppercase tracking-widest">Identidade Visual</h2>
              </div>
              <div>
                <label className="block text-xs font-bold text-vf-black mb-1">Nome da Aplicação</label>
                <input 
                  type="text" 
                  value={config.appName}
                  onChange={(e) => setConfig({ ...config, appName: e.target.value })}
                  className="w-full h-10 px-3 border border-vf-border rounded-lg text-sm bg-slate-50"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-vf-black mb-1">Cor Primária (Lime)</label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={config.brandColor} onChange={(e) => setConfig({ ...config, brandColor: e.target.value })} className="w-8 h-8 rounded cursor-pointer" />
                    <span className="text-xs font-mono">{config.brandColor}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-vf-black mb-1">Cor Escura</label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={config.brandDarkColor} onChange={(e) => setConfig({ ...config, brandDarkColor: e.target.value })} className="w-8 h-8 rounded cursor-pointer" />
                    <span className="text-xs font-mono">{config.brandDarkColor}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Mapas & Integrações */}
            <div className="bg-white p-6 rounded-xl border border-vf-border shadow-vf-sm space-y-4">
              <div className="flex items-center gap-2 mb-4 border-b border-vf-border pb-2">
                <Map className="w-4 h-4 text-vf-text-2" />
                <h2 className="font-black text-vf-black text-sm uppercase tracking-widest">Integrações & Mapas</h2>
              </div>
              <div>
                <label className="block text-xs font-bold text-vf-black mb-1">Provedor de Mapas</label>
                <input 
                  type="text" 
                  value={config.mapProvider}
                  disabled
                  className="w-full h-10 px-3 border border-vf-border rounded-lg text-sm bg-slate-100 opacity-70"
                />
                <p className="text-[10px] text-vf-text-3 mt-1">O projeto adota MapLibre + OpenFreeMap para renders sem Google Maps.</p>
              </div>
              <div>
                <label className="block text-xs font-bold text-vf-black mb-1">Integração de Importação via IA</label>
                <div className="flex items-center gap-2 mt-2">
                  <input 
                    type="checkbox" 
                    checked={config.importAIEnabled} 
                    onChange={(e) => setConfig({ ...config, importAIEnabled: e.target.checked })}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500" 
                  />
                  <span className="text-sm font-medium">Edge Function (import-bulk) ativada</span>
                </div>
              </div>
            </div>

            {/* Engine & Cache */}
            <div className="bg-white p-6 rounded-xl border border-vf-border shadow-vf-sm space-y-4">
              <div className="flex items-center gap-2 mb-4 border-b border-vf-border pb-2">
                <Database className="w-4 h-4 text-vf-text-2" />
                <h2 className="font-black text-vf-black text-sm uppercase tracking-widest">Engine & Cache</h2>
              </div>
              <div>
                <label className="block text-xs font-bold text-vf-black mb-1">Versão do Motor</label>
                <input 
                  type="text" 
                  value={config.engineVersion}
                  disabled
                  className="w-full h-10 px-3 border border-vf-border rounded-lg text-sm bg-slate-100 opacity-70"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-vf-black mb-1">Duração do Cache (segundos)</label>
                <input 
                  type="number" 
                  value={config.cacheDuration}
                  onChange={(e) => setConfig({ ...config, cacheDuration: parseInt(e.target.value) })}
                  className="w-full h-10 px-3 border border-vf-border rounded-lg text-sm bg-slate-50"
                />
              </div>
            </div>

            {/* Funcionalidades Experimentais */}
            <div className="bg-white p-6 rounded-xl border border-vf-border shadow-vf-sm space-y-4">
              <div className="flex items-center gap-2 mb-4 border-b border-vf-border pb-2">
                <Zap className="w-4 h-4 text-vf-text-2" />
                <h2 className="font-black text-vf-black text-sm uppercase tracking-widest">Labs (Experimentais)</h2>
              </div>
              <div>
                <label className="block text-xs font-bold text-vf-black mb-1">Edição Visual (Drag and Drop)</label>
                <div className="flex items-center gap-2 mt-2">
                  <input 
                    type="checkbox" 
                    checked={config.experimentalDragDrop} 
                    onChange={(e) => setConfig({ ...config, experimentalDragDrop: e.target.checked })}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500" 
                  />
                  <span className="text-sm font-medium">Ativar DnD e edição parcial (EI-9/EI-10)</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
