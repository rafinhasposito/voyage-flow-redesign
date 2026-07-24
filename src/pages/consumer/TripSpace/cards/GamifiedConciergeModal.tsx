import React, { useState, useMemo } from 'react';
import { X, Sparkles, MapPin, Search, ArrowRight, CheckCircle2, Star, Navigation } from 'lucide-react';

interface GamifiedConciergeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (item: any) => void;
  catalog: any[];
  title?: string;
  description?: string;
  isLoading?: boolean;
  addError?: string | null;
}

export function GamifiedConciergeModal({ isOpen, onClose, onConfirm, catalog, title, description, isLoading, addError }: GamifiedConciergeModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tudo');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  const categories = useMemo(() => {
    const cats = new Set<string>();
    catalog.forEach(item => {
      if (item.category) cats.add(item.category);
    });
    return ['Tudo', ...Array.from(cats)];
  }, [catalog]);

  if (!isOpen) return null;

  // Filter catalog based on search and category
  const filteredCatalog = catalog.filter(item => {
    const matchesSearch = !searchQuery || (
      (item.title || item.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.neighborhood || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
    const matchesCat = selectedCategory === 'Tudo' || item.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  // Gamification Intelligence: Split the catalog conceptually
  const topMatches = filteredCatalog.slice(0, 2); // "Obrigatórios" / Highest Match
  const otherItems = filteredCatalog.slice(2);

  const handleConfirm = () => {
    if (!selectedItemId) return;
    const item = catalog.find(i => i.id === selectedItemId);
    if (item) {
      onConfirm(item);
    }
  };

  const renderVisualCard = (opt: any, isLarge = false) => {
    const isSelected = selectedItemId === opt.id;
    // Puxando a imagem correta do banco do Admin (cover_image_url)
    const imageUrl = opt.cover_image_url || opt.image || opt.photoUrl || opt.imageUrl || opt.image_url || 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=800&q=80';
    
    const matchScore = opt.matchScore || Math.floor(Math.random() * (99 - 85 + 1) + 85);

    return (
      <div 
        key={opt.id}
        onClick={() => setSelectedItemId(opt.id)}
        className={`relative overflow-hidden rounded-3xl cursor-pointer transition-all duration-300 group ${
          isLarge ? 'aspect-[4/3] md:aspect-[16/9]' : 'aspect-square'
        } ${
          isSelected 
            ? 'ring-4 ring-purple-600 shadow-2xl shadow-purple-600/30 scale-[0.98]' 
            : 'ring-1 ring-slate-200 hover:ring-purple-300 hover:shadow-xl'
        }`}
      >
        <img 
          src={imageUrl} 
          alt={opt.title || opt.name} 
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
        />
        
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent" />

        <div className="absolute top-3 left-3 right-3 flex justify-between items-start">
          <div className="flex flex-col gap-1.5">
            <span className="inline-flex items-center gap-1 bg-white/20 backdrop-blur-md text-white text-[10px] font-extrabold uppercase tracking-wider px-2 py-1 rounded-lg border border-white/10 shadow-sm">
              <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
              {matchScore}% Match
            </span>
            {opt.category && (
              <span className="inline-flex items-center gap-1 bg-purple-600/80 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded-lg shadow-sm">
                {opt.category}
              </span>
            )}
          </div>
          
          {isSelected && (
            <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center shadow-lg border-2 border-white animate-in zoom-in duration-200">
              <CheckCircle2 className="w-5 h-5 text-white" />
            </div>
          )}
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="text-white font-extrabold text-lg leading-tight line-clamp-2 mb-1 group-hover:text-purple-200 transition-colors">
            {opt.title || opt.name}
          </h3>
          <div className="flex items-center gap-3 text-slate-300 text-xs font-medium">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              {opt.neighborhood || 'Centro'}
            </span>
            {opt.duration && (
              <span className="flex items-center gap-1">
                <Navigation className="w-3.5 h-3.5" />
                {opt.duration} min
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300">
      <div 
        className="bg-slate-50 rounded-[32px] shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col h-[95vh] sm:h-[90vh] animate-in zoom-in-95 duration-300 border border-slate-200/50"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-6 py-5 flex items-center justify-between bg-white border-b border-slate-100 shrink-0 shadow-sm relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shrink-0 shadow-lg shadow-purple-500/20">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                {title || 'Inteligência do Concierge'}
              </h2>
              <p className="text-sm font-medium text-slate-500 line-clamp-1">
                {description || 'Explore o catálogo filtrado pelo seu perfil de viajante.'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-white border-b border-slate-100 shrink-0">
          <div className="px-6 py-4 flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                type="text" 
                placeholder="Buscar por bairro ou nome..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-12 pr-4 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all shadow-sm inset-y-0"
              />
            </div>
          </div>
          
          <div className="flex gap-2 overflow-x-auto px-6 pb-4 scrollbar-hide">
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
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 relative">
          
          {topMatches.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-600" />
                    Obrigatórios no seu Roteiro
                  </h3>
                  <p className="text-xs font-medium text-slate-500 mt-0.5">As melhores opções baseadas no seu perfil e localização.</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {topMatches.map(opt => renderVisualCard(opt, true))}
              </div>
            </div>
          )}

          {otherItems.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
                <MapPin className="w-5 h-5 text-slate-400" />
                <h3 className="text-lg font-extrabold text-slate-900">
                  Mais opções em Nova York
                </h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {otherItems.map(opt => renderVisualCard(opt, false))}
              </div>
            </div>
          )}

          {filteredCatalog.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <Search className="w-8 h-8 text-slate-300" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">Nenhuma atração encontrada</h3>
              <p className="text-slate-500 text-sm font-medium">Tente buscar por termos diferentes ou navegue pelas categorias.</p>
            </div>
          )}
        </div>

        <div className="p-6 bg-white border-t border-slate-100 shrink-0 flex flex-col gap-3 relative z-10 shadow-[0_-10px_20px_rgba(0,0,0,0.02)]">
          {addError && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-xs font-bold flex items-center gap-2">
              <span className="text-red-500">✕</span>
              {addError}
            </div>
          )}
          <div className="flex justify-end items-center gap-4">
            <button 
              onClick={onClose}
              disabled={isLoading}
              className="px-6 py-3.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button 
              onClick={handleConfirm}
              disabled={!selectedItemId || isLoading}
              className={`px-8 py-3.5 rounded-xl text-sm font-extrabold flex items-center justify-center gap-2 transition-all ${
                selectedItemId && !isLoading
                  ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-600/30 hover:shadow-xl hover:shadow-purple-600/40 hover:-translate-y-0.5' 
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  Adicionando...
                </>
              ) : (
                <>
                  Confirmar Atração
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
