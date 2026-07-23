import React from 'react';
import { X, MapPin, Clock, DollarSign, Sparkles, Plus, Check } from 'lucide-react';
import { TripSpaceIdea, TripSpaceStop } from '@/types/tripSpace.types';

interface ExperienceDetailModalProps {
  item: TripSpaceIdea | TripSpaceStop | null;
  onClose: () => void;
  onAdd?: (itemId: string) => void;
}

export function ExperienceDetailModal({ item, onClose, onAdd }: ExperienceDetailModalProps) {
  if (!item) return null;

  const title = item.title;
  const photoUrl = 'photoUrl' in item ? item.photoUrl : item.imageUrl;
  const category = item.category || 'Atração';
  const neighborhood = item.neighborhood || item.location || 'Centro';
  const description = item.description || 'Experiência exclusiva selecionada com curadoria de IA e especialistas do Voyage Flow.';
  const duration = 'duration' in item ? item.duration : '1h 30min';
  const cost = 'cost' in item ? item.cost : 'Consultar';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
      <div 
        className="bg-white rounded-[28px] max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200/80 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Photo */}
        <div className="relative h-64 bg-slate-100 shrink-0">
          {photoUrl ? (
            <img src={photoUrl} alt={title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold text-sm">
              Sem foto disponível
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
          
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-white/90 backdrop-blur-sm text-slate-700 hover:text-slate-900 rounded-full shadow-md transition-transform hover:scale-105 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="absolute bottom-4 left-5 right-5 text-white">
            <span className="inline-block bg-lime-400 text-slate-950 text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider mb-1.5">
              {category}
            </span>
            <h2 className="text-xl font-extrabold text-white leading-tight drop-shadow-xs">{title}</h2>
            <p className="text-xs text-slate-200 flex items-center gap-1.5 mt-1 font-medium">
              <MapPin className="w-3.5 h-3.5 text-lime-400" /> {neighborhood}
            </p>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Quick Metrics */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Duração estimada</p>
                <p className="text-xs font-extrabold text-slate-900">{duration}</p>
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-lime-100 text-lime-800 flex items-center justify-center shrink-0">
                <DollarSign className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Investimento</p>
                <p className="text-xs font-extrabold text-slate-900">{cost}</p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-lime-500" /> Curadoria & Detalhes
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed font-medium bg-slate-50 p-4 rounded-2xl border border-slate-100/80">
              {description}
            </p>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-5 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-full text-xs font-bold text-slate-600 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            Fechar
          </button>
          {onAdd && (
            <button
              onClick={() => {
                onAdd(item.id);
                onClose();
              }}
              className="bg-lime-400 hover:bg-lime-500 text-slate-950 px-6 py-2.5 rounded-full text-xs font-extrabold flex items-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Adicionar ao Roteiro</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
