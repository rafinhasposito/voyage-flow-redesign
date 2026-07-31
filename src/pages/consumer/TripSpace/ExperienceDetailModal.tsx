import React from 'react';
import { X, MapPin, Clock, DollarSign, Sparkles, Plus, Check, ExternalLink, Calendar, Phone, ArrowRight, Star } from 'lucide-react';
import { TripSpaceIdea, TripSpaceStop } from '@/types/tripSpace.types';

interface ExperienceDetailModalProps {
  item: TripSpaceIdea | TripSpaceStop | null;
  onClose: () => void;
  onAdd?: (itemId: string) => void;
  onRemoveAndReplace?: (itemId: string) => void;
}

export function ExperienceDetailModal({ item, onClose, onAdd, onRemoveAndReplace }: ExperienceDetailModalProps) {
  if (!item) return null;

  const title = item.title;
  const photoUrl = 'photoUrl' in item ? item.photoUrl : item.imageUrl;
  const category = item.category || 'Atração';
  const neighborhood = item.neighborhood || item.location || 'Centro';
  const description = item.description || 'Experiência exclusiva selecionada com curadoria de IA e especialistas do Voyage Flow.';
  
  let duration = 'duration' in item ? item.duration : '1h 30min';
  if (duration && /^\d+$/.test(String(duration).trim())) {
    const mins = parseInt(String(duration));
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h > 0 && m > 0) duration = `${h}h ${m}m`;
    else if (h > 0) duration = `${h}h`;
    else duration = `${m}m`;
  }

  const cost = 'cost' in item ? item.cost : 'Consultar';
  
  const rating = 'rating' in item ? item.rating : 4.9;
  const reviewCount = 'reviewCount' in item ? item.reviewCount : 124;

  const address = 'locationAddress' in item ? item.locationAddress : undefined;
  const openingHours = 'openingHours' in item ? item.openingHours : undefined;
  const bookingUrl = 'bookingUrl' in item ? item.bookingUrl : undefined;
  const phone = 'contactPhone' in item ? item.contactPhone : undefined;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div 
        className="bg-white sm:rounded-[32px] rounded-t-[32px] w-full max-w-lg overflow-hidden shadow-2xl flex flex-col h-[90vh] sm:h-[85vh] animate-in slide-in-from-bottom-8 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative h-[35vh] sm:h-72 shrink-0 bg-slate-100">
          {photoUrl ? (
            <img src={photoUrl} alt={title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-400">
              <Sparkles className="w-8 h-8 opacity-50" />
            </div>
          )}
          
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent" />
          
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white rounded-full transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="absolute bottom-0 left-0 right-0 p-6">
            <span className="inline-block bg-purple-600 text-white text-[10px] font-extrabold px-3 py-1 rounded-lg uppercase tracking-wider mb-2">
              {category}
            </span>
            <h2 className="text-3xl font-extrabold text-white leading-tight drop-shadow-md">{title}</h2>
            <div className="flex items-center gap-3 mt-2 text-slate-200 text-sm font-medium">
              <span className="flex items-center gap-1.5 font-bold text-amber-400">
                <Star className="w-4 h-4 fill-amber-400" /> {rating} <span className="text-slate-300 font-normal">({reviewCount})</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-purple-400" /> {neighborhood}
              </span>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-slate-50">
          
          <div className="px-6 py-5 bg-white border-b border-slate-100 flex gap-3">
            {bookingUrl && (
              <a 
                href={bookingUrl} 
                target="_blank" 
                rel="noreferrer"
                className="flex-1 bg-slate-900 hover:bg-slate-800 text-white py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-slate-900/20"
              >
                Comprar Ingresso <ExternalLink className="w-4 h-4" />
              </a>
            )}
            <a 
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address || title)}`}
              target="_blank"
              rel="noreferrer"
              className="flex-1 bg-purple-50 hover:bg-purple-100 text-purple-700 py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors border border-purple-200"
            >
              <MapPin className="w-4 h-4" /> Rotas (Maps)
            </a>
          </div>

          <div className="p-6 space-y-6">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white p-4 rounded-2xl border border-slate-200/60 shadow-sm flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-600 flex items-center justify-center shrink-0 border border-slate-100">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Duração Média</p>
                  <p className="text-sm font-extrabold text-slate-900 mt-0.5">{duration}</p>
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200/60 shadow-sm flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center shrink-0 border border-green-100">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Investimento</p>
                  <p className="text-sm font-extrabold text-slate-900 mt-0.5">{cost}</p>
                </div>
              </div>
            </div>

            {(address || openingHours || phone) && (
              <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
                {address && (
                  <div className="p-4 border-b border-slate-100 flex gap-3 items-center">
                    <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center shrink-0 text-slate-400">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Endereço Exato</p>
                      <p className="text-sm font-semibold text-slate-700">{address}</p>
                    </div>
                  </div>
                )}
                {openingHours && (
                  <div className="p-4 border-b border-slate-100 flex gap-3 items-center">
                    <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center shrink-0 text-slate-400">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Horário de Funcionamento</p>
                      <p className="text-sm font-semibold text-slate-700">{openingHours}</p>
                    </div>
                  </div>
                )}
                {phone && (
                  <div className="p-4 flex gap-3 items-center">
                    <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center shrink-0 text-slate-400">
                      <Phone className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Contato</p>
                      <p className="text-sm font-semibold text-slate-700">{phone}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-purple-500" />
              <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-purple-600" /> Insight do Concierge
              </h4>
              <p className="text-sm text-slate-600 leading-relaxed font-medium">
                {description}
              </p>
            </div>
          </div>
        </div>

        <div className="p-5 bg-white border-t border-slate-200 shrink-0 flex items-center justify-between gap-3">
          {onRemoveAndReplace && (
            <button
              onClick={() => {
                onRemoveAndReplace(item.id);
                onClose();
              }}
              className="flex-1 py-3.5 rounded-xl text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 transition-colors cursor-pointer border border-red-100"
            >
              Remover do Roteiro
            </button>
          )}
          {onAdd && (
            <button
              onClick={() => {
                onAdd(item.id);
                onClose();
              }}
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-3.5 rounded-xl text-sm font-extrabold flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30 transition-all cursor-pointer"
            >
              Adicionar ao Roteiro <ArrowRight className="w-4 h-4" />
            </button>
          )}
          {!onRemoveAndReplace && !onAdd && (
            <button
              onClick={onClose}
              className="w-full py-3.5 rounded-xl text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              Voltar ao Roteiro
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
