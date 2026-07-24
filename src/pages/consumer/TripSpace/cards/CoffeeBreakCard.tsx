import React, { useState } from 'react';
import { Coffee, Croissant, Pizza, MapPin, ChevronDown, ChevronUp, Sparkles, CheckCircle2 } from 'lucide-react';
import { TripSpaceStop } from '@/types/tripSpace.types';

interface CoffeeBreakCardProps {
  stop: TripSpaceStop;
  catalog?: any[];
  isSelected?: boolean;
  onClick?: () => void;
  /** Callback para adicionar sugestão ao dia — integrado ao executeDirectAction */
  onAddToDay?: (experienceId: string) => void;
}

type VibeMode = 'cafe' | 'bakery' | 'fast';

export function CoffeeBreakCard({ stop, catalog, isSelected, onClick, onAddToDay }: CoffeeBreakCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [mode, setMode] = useState<VibeMode | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  
  // Find real suggestions from Catalog
  const getSuggestion = (vibe: VibeMode) => {
     if (!catalog || catalog.length === 0) return null;
     
     const keywords = vibe === 'cafe' ? ['café', 'coffee', 'starbucks', 'cafe'] 
                    : vibe === 'bakery' ? ['bakery', 'doce', 'confeitaria', 'sobremesa'] 
                    : ['fast', 'pizza', 'burger', 'rápido'];
                    
     return catalog.find(item => 
       keywords.some(k => 
         item.title?.toLowerCase().includes(k) || 
         item.category?.toLowerCase().includes(k)
       )
     ) || catalog[0]; // fallback to first item if no match
  };
  
  const currentSuggestion = mode ? getSuggestion(mode) : null;
  
  return (
    <div className="relative group">
      {/* Timeline Node Dot */}
      <div className="absolute -left-[39px] top-6 w-7 h-7 rounded-full border-4 border-white flex items-center justify-center transition-colors z-10 shadow-sm bg-orange-100 text-orange-600">
        <Coffee className="w-3.5 h-3.5" />
      </div>

      <div
        className={`relative rounded-[24px] overflow-hidden border transition-all ${
          isSelected
            ? 'bg-white border-orange-300 shadow-xl ring-2 ring-orange-900/5'
            : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
        }`}
      >
        <div onClick={() => { onClick?.(); setExpanded(!expanded); }} className="cursor-pointer p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-orange-50 text-orange-500 border border-orange-100">
            <Coffee className="w-6 h-6" />
          </div>
          
          <div className="flex-1 min-w-0 flex flex-col justify-center">
             <div className="flex items-center gap-2 mb-1.5">
               <span className="text-[10px] font-extrabold text-orange-500 bg-orange-50 px-2 py-0.5 rounded-md border border-orange-200">
                 Descanso Estimado
               </span>
               <span className="text-xs font-bold text-slate-500">{stop.time}</span>
             </div>
             
            <h3 className="font-extrabold text-slate-900 text-lg leading-tight">
              {stop.title}
            </h3>
            
            {mode && (
               <p className="text-xs text-orange-600 font-bold mt-1 flex items-center gap-1">
                 <CheckCircle2 className="w-3 h-3" /> Você escolheu: {mode === 'cafe' ? 'Cafeteria Clássica' : mode === 'bakery' ? 'Bakery Instagramável' : 'Grab & Go Rápido'}
               </p>
            )}
          </div>
        </div>

        {/* Content */}
        {expanded && (
          <div className="p-5 bg-orange-50/30 border-t border-orange-100 animate-in slide-in-from-top-2 duration-200">
            <div className="flex items-start gap-3 mb-4">
               <Sparkles className="w-5 h-5 text-orange-400 mt-0.5 shrink-0" />
               <p className="text-sm text-slate-700 font-medium leading-relaxed">
                 Você estará perto da Times Square às {stop.time}. Temos uma janela livre. Qual a sua vibe agora?
               </p>
            </div>
            
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              <button 
                onClick={() => setMode('cafe')}
                className={`min-w-[140px] p-4 rounded-xl border flex flex-col items-start gap-2 transition-all text-left ${mode === 'cafe' ? 'bg-orange-500 border-orange-600 text-white shadow-md' : 'bg-white border-slate-200 hover:border-orange-200 hover:bg-orange-50'}`}
              >
                <Coffee className={`w-6 h-6 ${mode === 'cafe' ? 'text-orange-200' : 'text-orange-500'}`} />
                <div>
                  <h4 className={`font-bold text-sm ${mode === 'cafe' ? 'text-white' : 'text-slate-800'}`}>Café Clássico</h4>
                  <p className={`text-[10px] mt-1 ${mode === 'cafe' ? 'text-orange-100' : 'text-slate-500'}`}>Para sentar e relaxar.</p>
                </div>
              </button>
              
              <button 
                onClick={() => setMode('bakery')}
                className={`min-w-[140px] p-4 rounded-xl border flex flex-col items-start gap-2 transition-all text-left ${mode === 'bakery' ? 'bg-pink-500 border-pink-600 text-white shadow-md' : 'bg-white border-slate-200 hover:border-pink-200 hover:bg-pink-50'}`}
              >
                <Croissant className={`w-6 h-6 ${mode === 'bakery' ? 'text-pink-200' : 'text-pink-500'}`} />
                <div>
                  <h4 className={`font-bold text-sm ${mode === 'bakery' ? 'text-white' : 'text-slate-800'}`}>Bakery Doce</h4>
                  <p className={`text-[10px] mt-1 ${mode === 'bakery' ? 'text-pink-100' : 'text-slate-500'}`}>Instagramável e famoso.</p>
                </div>
              </button>

              <button 
                onClick={() => setMode('fast')}
                className={`min-w-[140px] p-4 rounded-xl border flex flex-col items-start gap-2 transition-all text-left ${mode === 'fast' ? 'bg-emerald-500 border-emerald-600 text-white shadow-md' : 'bg-white border-slate-200 hover:border-emerald-200 hover:bg-emerald-50'}`}
              >
                <Pizza className={`w-6 h-6 ${mode === 'fast' ? 'text-emerald-200' : 'text-emerald-500'}`} />
                <div>
                  <h4 className={`font-bold text-sm ${mode === 'fast' ? 'text-white' : 'text-slate-800'}`}>Grab & Go</h4>
                  <p className={`text-[10px] mt-1 ${mode === 'fast' ? 'text-emerald-100' : 'text-slate-500'}`}>Comer andando, sem parar.</p>
                </div>
              </button>
            </div>
            
            {mode && currentSuggestion && (
               <div className="mt-4 bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex flex-col gap-3">
                 <div className="flex items-start gap-3">
                   <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 overflow-hidden shrink-0">
                     {currentSuggestion.photoUrl ? (
                        <img src={currentSuggestion.photoUrl} alt="Sugestão" className="w-full h-full object-cover" />
                     ) : (
                        <MapPin className="w-5 h-5" />
                     )}
                   </div>
                   <div className="flex-1 min-w-0">
                     <p className="text-sm font-bold text-slate-900 line-clamp-1">
                       {currentSuggestion.title}
                     </p>
                     <p className="text-[10px] font-medium text-slate-500 line-clamp-1">
                       {currentSuggestion.neighborhood || currentSuggestion.location || 'A 3 min de caminhada'}
                     </p>
                   </div>
                 </div>
                 
                 <div className="flex items-center justify-between border-t border-slate-50 pt-3">
                    <button className="text-xs font-bold text-slate-600 hover:text-slate-900">
                      Ver Detalhes
                    </button>
                    {confirmed ? (
                      <span className="text-xs font-bold text-emerald-600 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Adicionado ao dia!
                      </span>
                    ) : (
                      <button 
                        onClick={(e) => {
                           e.stopPropagation();
                           if (onAddToDay && currentSuggestion?.id) {
                             // Ação real: adiciona via engine
                             onAddToDay(currentSuggestion.id);
                             setConfirmed(true);
                             setExpanded(false);
                           } else {
                             // Sem integração direta: confirmação visual local
                             setConfirmed(true);
                             setExpanded(false);
                           }
                        }}
                        className="text-xs font-bold text-white bg-orange-500 px-4 py-2 rounded-lg hover:bg-orange-600 shadow-sm transition-colors flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Confirmar Escolha
                      </button>
                    )}
                  </div>
               </div>
            )}
          </div>
        )}
        
        {/* Toggle Indicator */}
        <div onClick={() => { onClick?.(); setExpanded(!expanded); }} className="bg-slate-50 py-2 flex justify-center border-t border-slate-100 cursor-pointer">
          {expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
      </div>
    </div>
  );
}
