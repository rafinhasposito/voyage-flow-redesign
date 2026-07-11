import React, { useState } from 'react';
import { 
  Star, 
  Search, 
  GripVertical,
  Plus,
  Trash2,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const MOCK_CATALOG = [
  { id: 'c1', title: 'Top of the Rock Observation Deck', category: 'Attraction', baseCost: 40, rating: 4.8 },
  { id: 'c2', title: 'Museum of Modern Art (MoMA)', category: 'Attraction', baseCost: 25, rating: 4.9 },
  { id: 'c3', title: 'Statue of Liberty Cruise', category: 'Activity', baseCost: 35, rating: 4.6 },
  { id: 'c4', title: '1 Hotel Brooklyn Bridge', category: 'Hotel', baseCost: 450, rating: 4.7 },
  { id: 'c5', title: 'The Plaza Hotel', category: 'Hotel', baseCost: 850, rating: 4.9 },
];

const MOCK_FEATURED = [
  { id: 'f1', title: 'Top of the Rock Observation Deck', category: 'Attraction', slot: 1, startDate: '2024-05-01', endDate: '2024-05-31' },
  { id: 'f2', title: '1 Hotel Brooklyn Bridge', category: 'Hotel', slot: 2, startDate: '2024-05-15', endDate: '2024-06-15' },
];

export default function FeaturedDashboard() {
  const [searchTerm, setSearchTerm] = useState('');
  
  return (
    <div className="flex flex-col h-full bg-vf-bg overflow-hidden">
      
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-vf-border z-10 shrink-0">
        <div>
          <h1 className="text-lg font-black text-vf-black tracking-tight flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-500" /> Destaques
          </h1>
          <p className="text-[11px] text-vf-text-3 font-semibold">Gerencie os itens fixados na tela principal do App.</p>
        </div>
        <Button variant="lime" size="sm">
          <Star className="w-4 h-4" /> Publicar Destaques
        </Button>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Left: Featured Slots */}
          <div className="bg-white rounded-xl border border-vf-border shadow-vf-sm flex flex-col h-full">
            <div className="p-5 border-b border-vf-border/50">
              <h2 className="text-[13px] font-black uppercase tracking-widest text-vf-black">Slots Ativos</h2>
              <p className="text-[11px] text-vf-text-3">Estes itens aparecerão com destaque no App.</p>
            </div>
            
            <div className="flex-1 p-5 space-y-4">
              {MOCK_FEATURED.map((item, index) => (
                <div key={item.id} className="group relative flex items-center bg-vf-muted rounded-xl p-3 border border-vf-border transition-all hover:shadow-vf-sm">
                  <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-white border border-vf-border flex items-center justify-center">
                    <Star className="w-6 h-6 text-amber-400" />
                  </div>
                  
                  <div className="ml-4 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-black bg-vf-black text-white px-2 py-0.5 rounded-sm">SLOT {index + 1}</span>
                      <span className="text-[10px] font-bold text-vf-text-2 bg-white px-1.5 py-0.5 rounded-sm border border-vf-border">{item.category}</span>
                    </div>
                    <h3 className="font-bold text-[13px] text-vf-black leading-tight">{item.title}</h3>
                    <div className="flex items-center gap-2 text-[10px] text-vf-text-3 font-semibold mt-1">
                      <Calendar className="w-3 h-3" />
                      {item.startDate} até {item.endDate}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 px-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="w-8 h-8 text-vf-text-3 hover:text-rose-500 hover:bg-rose-50">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                    <div className="cursor-grab text-vf-text-3 hover:text-vf-black p-2">
                      <GripVertical className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              ))}
              
              <div className="h-24 flex flex-col items-center justify-center text-vf-text-3 border-2 border-dashed border-vf-border rounded-xl">
                <AlertCircle className="w-5 h-5 mb-2 text-vf-text-3/50" />
                <span className="text-[11px] font-semibold">Arraste um item do catálogo para cá</span>
              </div>
            </div>
          </div>

          {/* Right: Catalog Search */}
          <div className="bg-white rounded-xl border border-vf-border shadow-vf-sm flex flex-col h-[600px]">
            <div className="p-5 border-b border-vf-border/50">
              <h2 className="text-[13px] font-black uppercase tracking-widest text-vf-black mb-1">Catálogo</h2>
              <div className="relative">
                <Search className="w-4 h-4 text-vf-text-3 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input 
                  type="text" 
                  placeholder="Buscar para destacar..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-9 text-[13px] w-full"
                />
              </div>
            </div>
            
            <div className="flex-1 overflow-auto p-3 space-y-2">
              {MOCK_CATALOG.filter(i => i.title.toLowerCase().includes(searchTerm.toLowerCase())).map(item => (
                <div key={item.id} className="flex items-center bg-white rounded-xl p-3 border border-vf-border hover:border-vf-black transition-all hover:shadow-sm cursor-pointer">
                  <div className="w-12 h-12 rounded-lg bg-vf-muted flex-shrink-0 flex items-center justify-center">
                    <Star className="w-4 h-4 text-vf-text-3" />
                  </div>
                  <div className="ml-3 flex-1">
                    <h3 className="font-bold text-[13px] text-vf-black">{item.title}</h3>
                    <span className="text-[10px] font-bold text-vf-text-2 bg-vf-muted px-1.5 py-0.5 rounded-sm">{item.category}</span>
                  </div>
                  <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full text-vf-text-3 hover:text-vf-black hover:bg-vf-lime">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
