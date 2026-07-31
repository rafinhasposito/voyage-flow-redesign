import React, { useState, useMemo } from 'react';
import { X, Search, Sparkles, Plus, Check } from 'lucide-react';
import { TripSpaceStop } from '@/types/tripSpace.types';

interface ManualCatalogBrowserModalProps {
  isOpen: boolean;
  onClose: () => void;
  catalog: any[];
  onConfirm: (item: any) => void;
  isLoading?: boolean;
  addError?: string | null;
  activeDayNumber?: number;
  replacingTitle?: string;
}

export function ManualCatalogBrowserModal({ isOpen, onClose, catalog, onConfirm, isLoading, addError, activeDayNumber, replacingTitle }: ManualCatalogBrowserModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedItem, setSelectedItem] = useState<any | null>(null);

  const categories = useMemo(() => {
    const cats = new Set<string>();
    catalog.forEach(item => {
      if (item.category) cats.add(item.category);
    });
    return ['all', ...Array.from(cats)];
  }, [catalog]);

  const filteredCatalog = useMemo(() => {
    return catalog.filter(item => {
      const matchesSearch = (item.title || item.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                            (item.description || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCat = selectedCategory === 'all' || item.category === selectedCategory;
      return matchesSearch && matchesCat;
    });
  }, [catalog, searchTerm, selectedCategory]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300 p-0 sm:p-4">
      <div 
        className="bg-slate-50 sm:rounded-[32px] rounded-t-[32px] w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col h-[90vh] animate-in slide-in-from-bottom-8 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-white p-6 pb-4 border-b border-slate-200 shrink-0 relative z-10 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              {replacingTitle ? (
                <span className="inline-block text-[10px] font-extrabold text-violet-700 bg-violet-50 border border-violet-200 px-2.5 py-1 rounded-full uppercase tracking-wider mb-2">
                  Substituindo "{replacingTitle}"
                </span>
              ) : activeDayNumber && (
                <span className="inline-block text-[10px] font-extrabold text-violet-700 bg-violet-50 border border-violet-200 px-2.5 py-1 rounded-full uppercase tracking-wider mb-2">
                  Adicionando ao Dia {activeDayNumber}
                </span>
              )}
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Catálogo Livre</h2>
              <p className="text-sm font-medium text-slate-500 mt-1">
                {replacingTitle ? 'Escolha a experiência que vai substituir a atual.' : 'Busque e adicione qualquer experiência ao seu dia.'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar pelo nome ou local..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-100 border-none rounded-2xl py-3.5 pl-12 pr-4 text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-slate-900 transition-all outline-none"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto mt-4 pb-2 scrollbar-hide">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                  selectedCategory === cat
                    ? 'bg-slate-900 text-white shadow-md'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat === 'all' ? 'Todas' : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Content (List) */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredCatalog.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-3">
              <Search className="w-8 h-8 opacity-50" />
              <p className="font-bold text-sm">Nenhuma experiência encontrada.</p>
            </div>
          ) : (
            filteredCatalog.map(item => {
              const isSelected = selectedItem?.id === item.id;
              const imageUrl = item.cover_image_url || item.cover_media_url || item.photoUrl || item.imageUrl || item.image || item.images?.[0] || item.media_urls?.[0];
              
              return (
                <div 
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className={`bg-white rounded-2xl p-3 flex gap-4 cursor-pointer transition-all border-2 ${
                    isSelected ? 'border-purple-500 shadow-md ring-4 ring-purple-500/10' : 'border-transparent hover:border-slate-200 shadow-sm'
                  }`}
                >
                  <div className="w-20 h-20 rounded-xl bg-slate-100 overflow-hidden shrink-0 relative">
                    {imageUrl ? (
                      <img src={imageUrl} alt={item.title || item.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-slate-200 text-slate-400">
                        <Sparkles className="w-6 h-6" />
                      </div>
                    )}
                    {isSelected && (
                      <div className="absolute inset-0 bg-purple-500/20 flex items-center justify-center backdrop-blur-[1px]">
                        <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-purple-900/50">
                          <Check className="w-5 h-5" />
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 py-1 flex flex-col justify-center">
                    <span className="text-[10px] font-extrabold text-purple-600 uppercase tracking-wider mb-1">
                      {item.category || 'Atração'}
                    </span>
                    <h3 className="font-extrabold text-slate-900 text-sm leading-tight line-clamp-1">{item.title || item.name}</h3>
                    <p className="text-xs font-medium text-slate-500 mt-1 line-clamp-1">{item.neighborhood || item.location || 'Centro'}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Action */}
        <div className="bg-white p-5 border-t border-slate-200 shrink-0">
          {addError && (
            <div className="mb-3 bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-xs font-bold flex items-center gap-2">
              <span className="text-red-500">✕</span>
              {addError}
            </div>
          )}
          <button
            disabled={!selectedItem || isLoading}
            onClick={() => {
              if (selectedItem && !isLoading) onConfirm(selectedItem);
            }}
            className="w-full bg-slate-900 disabled:bg-slate-200 hover:bg-slate-800 text-white disabled:text-slate-400 py-4 rounded-2xl text-sm font-extrabold flex items-center justify-center gap-2 transition-all shadow-xl shadow-slate-900/20 disabled:shadow-none"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                Adicionando ao roteiro...
              </>
            ) : selectedItem ? (
              <>
                <Plus className="w-5 h-5" /> Adicionar "{selectedItem.title || selectedItem.name}" ao Dia
              </>
            ) : (
              'Selecione uma experiência'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
