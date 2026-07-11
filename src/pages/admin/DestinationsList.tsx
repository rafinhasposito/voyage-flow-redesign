import React, { useState } from 'react';
import { Globe, Plus, Search, MapPin, Map, Navigation, ArrowRight, MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const MOCK_DESTINATIONS = [
  { id: '1', name: 'Nova York', country: 'Estados Unidos', region: 'América do Norte', status: 'active', experiencesCount: 142, hotelsCount: 45, image: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?q=80&w=600&auto=format&fit=crop' },
  { id: '2', name: 'Paris', country: 'França', region: 'Europa', status: 'active', experiencesCount: 89, hotelsCount: 32, image: 'https://images.unsplash.com/photo-1502602898657-3e90760b6209?q=80&w=600&auto=format&fit=crop' },
  { id: '3', name: 'Tóquio', country: 'Japão', region: 'Ásia', status: 'draft', experiencesCount: 56, hotelsCount: 28, image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?q=80&w=600&auto=format&fit=crop' },
];

export default function DestinationsList() {
  const [searchTerm, setSearchTerm] = useState('');
  
  return (
    <div className="flex flex-col h-full bg-vf-bg overflow-hidden">
      
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-vf-border z-10 shrink-0">
        <div>
          <h1 className="text-lg font-black text-vf-black tracking-tight flex items-center gap-2">
            <Globe className="w-4 h-4 text-emerald-600" /> Destinos
          </h1>
          <p className="text-[11px] text-vf-text-3 font-semibold">Gerencie cidades e macrorregiões.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-vf-text-3 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input 
              type="text" 
              placeholder="Buscar destino..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-64 h-9 text-[13px]"
            />
          </div>
          <Button variant="lime" size="sm">
            <Plus className="w-4 h-4" /> Novo Destino
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {MOCK_DESTINATIONS.map(dest => (
            <div key={dest.id} className="bg-white rounded-xl border border-vf-border shadow-vf-sm overflow-hidden flex flex-col group">
              <div className="h-48 relative overflow-hidden">
                <img src={dest.image} alt={dest.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                  <div>
                    <h3 className="text-white font-black text-xl leading-none shadow-sm">{dest.name}</h3>
                    <p className="text-white/80 font-bold text-xs mt-1">{dest.country}</p>
                  </div>
                  <div className={`px-2 py-1 rounded text-[10px] font-black uppercase ${dest.status === 'active' ? 'bg-emerald-500 text-white' : 'bg-slate-500 text-white'}`}>
                    {dest.status === 'active' ? 'Ativo' : 'Rascunho'}
                  </div>
                </div>
              </div>
              
              <div className="p-5 flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-[10px] font-black uppercase text-vf-text-3 tracking-widest">Experiências</div>
                    <div className="text-lg font-black text-vf-black">{dest.experiencesCount}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-black uppercase text-vf-text-3 tracking-widest">Hotéis</div>
                    <div className="text-lg font-black text-vf-black">{dest.hotelsCount}</div>
                  </div>
                </div>
                
                <div className="flex justify-end gap-2 mt-2 pt-4 border-t border-vf-border/50">
                  <Button variant="outline" size="sm" className="h-8 text-[11px] font-bold">
                    <Edit className="w-3.5 h-3.5" /> Editar
                  </Button>
                  <Button variant="outline" size="icon" className="h-8 w-8 text-rose-500 hover:text-rose-600 hover:bg-rose-50">
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
