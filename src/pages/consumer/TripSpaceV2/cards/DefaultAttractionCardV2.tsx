import React, { useState } from 'react';
import { Clock, MapPin, Shuffle, Navigation, MoreHorizontal, Trash2, ChevronDown, Sparkles, AlertTriangle, Edit2, Check, ExternalLink } from 'lucide-react';
import { TripSpaceStop } from '@/types/tripSpace.types';
import { MatchScoreBadge } from '@/components/MatchScoreBadge';

interface DefaultAttractionCardV2Props {
  stop: TripSpaceStop;
  isSelected?: boolean;
  logisticAlert?: string | null;
  travelFromPrevious?: {
    label: string;
    isLongHop?: boolean;
    fromBasecamp?: boolean;
  } | null;
  onClick?: () => void;
  onNavigate?: () => void;
  onReplace?: () => void;
  onRemove?: () => void;
  onOpenJournal?: () => void;
}

export function DefaultAttractionCardV2({
  stop,
  isSelected,
  logisticAlert,
  travelFromPrevious,
  onClick,
  onNavigate,
  onReplace,
  onRemove,
  onOpenJournal
}: DefaultAttractionCardV2Props) {
  const isLodging = stop.category === 'lodging';
  const [showMenu, setShowMenu] = useState(false);

  // Descrição curta editorial limpa (resumo para a timeline)
  const shortDesc = (stop as any).short_description || stop.description || 'Uma experiência com curadoria especial selecionada pelo seu Concierge Digital, oferecendo atmosfera única e excelente qualidade.';
  const categoryName = stop.category?.replace('_', ' ') || 'Experiência Curada';

  return (
    <div className="w-full">
      <div 
        className={`relative rounded-3xl overflow-hidden border transition-all duration-300 cursor-pointer group/card ${
          isSelected
            ? 'bg-white border-[#14150F] shadow-xl ring-2 ring-[#14150F]'
            : 'bg-[#FAF8F1] border-slate-200 hover:border-slate-300 shadow-sm hover:shadow-md'
        }`}
        onClick={onClick}
      >
        {/* 1. FAIXA INTEGRA DO CONCIERGE: DESLOCAMENTO & ROTAS (Embutida no topo do Cartão) */}
        {travelFromPrevious && (
          <div className={`px-5 py-2.5 flex items-center gap-2 text-xs font-bold border-b border-slate-200/80 transition-colors ${
            travelFromPrevious.isLongHop 
              ? 'bg-amber-100/90 text-amber-950' 
              : 'bg-slate-100/95 text-slate-700'
          }`}>
            <Navigation className={`w-3.5 h-3.5 shrink-0 ${travelFromPrevious.isLongHop ? 'text-amber-600' : 'text-indigo-600'}`} />
            <span>
              {travelFromPrevious.fromBasecamp ? 'Deslocamento da hospedagem: ' : 'Deslocamento da parada anterior: '}
              <strong className="text-slate-900 font-black">{travelFromPrevious.label}</strong>
            </span>
            {travelFromPrevious.isLongHop && (
              <span className="ml-auto px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-amber-200/90 text-amber-950 border border-amber-300/80 shrink-0">
                Trecho longo
              </span>
            )}
          </div>
        )}

        {/* 2. FOTOGRAFIA EDITORIAL 100% LIMPA (Zero Textos ou Badges poluído na foto) */}
        {!isLodging && (
          <div className="relative w-full aspect-video overflow-hidden bg-slate-100">
            {(() => {
              const imgUrl = (stop as any).media_urls?.[0] || stop.photoUrl || stop.imageUrl || (stop as any).image_url || (stop as any).photo || 'https://images.unsplash.com/photo-1534430480872-3498386e7856?w=1200&q=85';
              const isVideo = imgUrl.toLowerCase().match(/\.(mp4|mov|webm)(\?.*)?$/) != null;
              
              if (isVideo) {
                return (
                  <video
                    src={imgUrl}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover transition-transform duration-700 group-hover/card:scale-105"
                  />
                );
              }
              return (
                <img
                  src={imgUrl}
                  alt={stop.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover/card:scale-105"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1477959858617-67f30bc4fc38?auto=format&fit=crop&q=80&w=1200';
                  }}
                />
              );
            })()}
          </div>
        )}

        {/* 2. CORPO EDITORIAL UNIFICADO (Padrão Sanfona / Concierge V2) */}
        <div className="p-6 sm:p-7 relative bg-[#FAF8F1]">
          {/* Linha Superior: Categoria, Afinidade & Relógio Principal */}
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="flex flex-wrap items-center gap-2 max-w-[65%]">
              <span className="text-[10px] sm:text-xs font-extrabold uppercase tracking-wider text-slate-700 bg-slate-200/80 px-2.5 py-1 rounded-md border border-slate-300/60">
                {categoryName}
              </span>
              {stop.matchScore && (
                <span className="text-[10px] sm:text-xs font-extrabold text-indigo-950 bg-indigo-50/90 px-2.5 py-1 rounded-md border border-indigo-100 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-indigo-600 fill-indigo-100 shrink-0" />
                  <span>{stop.matchScore}% Afinidade IA</span>
                </span>
              )}
            </div>

            <div className="text-right shrink-0 flex items-start gap-2 group/time">
              <div>
                <div className="flex items-center justify-end gap-1.5 cursor-pointer" onClick={(e) => { e.stopPropagation(); onOpenJournal?.(); }}>
                  <p className="text-slate-900 font-black text-2xl sm:text-3xl tracking-tighter leading-none border-b-2 border-dashed border-transparent hover:border-slate-300 transition-colors pb-0.5">
                    {stop.time || '10:00'}
                  </p>
                  <Edit2 className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover/time:opacity-100 transition-opacity hover:text-indigo-600" />
                </div>
                <p className="text-slate-500 text-[10px] font-extrabold uppercase tracking-wider mt-1 text-right">
                  {stop.duration ? `Duração ${stop.duration}` : 'Horário Estimado'}
                </p>
              </div>

              {/* Menu Rápido Lateral (Três Pontos) */}
              <div className="relative ml-1">
                <button 
                  onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
                  className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-slate-200/80 text-slate-400 hover:text-slate-800 transition-colors"
                >
                  <MoreHorizontal className="w-5 h-5" />
                </button>
                
                {showMenu && (
                  <div className="absolute right-0 top-full mt-1 w-52 bg-white border border-slate-200 rounded-2xl shadow-xl z-30 py-1.5 animate-in zoom-in-95 duration-150 text-left">
                    <button 
                      onClick={(e) => { e.stopPropagation(); setShowMenu(false); onNavigate?.(); }}
                      className="w-full text-left px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                    >
                      <Navigation className="w-3.5 h-3.5 text-indigo-600" /> Rotas no Google Maps
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setShowMenu(false); onReplace?.(); }}
                      className="w-full text-left px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                    >
                      <Shuffle className="w-3.5 h-3.5 text-amber-500" /> Trocar local
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setShowMenu(false); onOpenJournal?.(); }}
                      className="w-full text-left px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Diário de Bordo
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setShowMenu(false); onRemove?.(); }}
                      className="w-full text-left px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 flex items-center gap-2 border-t border-slate-100 mt-1 pt-2"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Remover da viagem
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Título Principal */}
          <h3 className="font-black text-2xl sm:text-3xl leading-snug mb-2 text-[#14150F] tracking-tight group-hover/card:text-indigo-600 transition-colors">
            {stop.title}
          </h3>

          {/* Descrição Editorial Curto */}
          <p className="text-slate-600 font-normal text-sm sm:text-base leading-relaxed line-clamp-3 mt-1 mb-4">
            {shortDesc}
          </p>

          {/* Linha de Metadados Limpos: Localização & Preço */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-slate-700 bg-slate-200/60 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span>{stop.neighborhood || 'New York City'}</span>
            </span>

            <div className="group/cost flex items-center gap-1" onClick={e => e.stopPropagation()}>
              <span 
                onClick={() => onOpenJournal?.()}
                className="text-xs font-extrabold text-[#14150F] bg-[#D6FF3F] hover:bg-[#cbf731] px-3 py-1.5 rounded-xl border border-[#b8e624]/60 shadow-2xs cursor-pointer flex items-center gap-1 transition-colors"
              >
                {stop.cost || 'Grátis'}
                <Edit2 className="w-3 h-3 opacity-0 group-hover/cost:opacity-100 transition-opacity text-slate-600" />
              </span>
            </div>

            {logisticAlert && (
              <span className="text-xs font-bold text-amber-900 bg-amber-100/90 px-3 py-1.5 rounded-xl border border-amber-300/50 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>{logisticAlert}</span>
              </span>
            )}
          </div>
        </div>

        {/* 3. RODAPÉ EM SANFONA UNIFICADA (Idêntico aos Cartões de Voo e Imigração) */}
        <div className="bg-slate-100/90 hover:bg-slate-200/70 py-3.5 px-4 flex items-center justify-center gap-2 border-t border-slate-200 text-slate-600 font-extrabold text-xs sm:text-sm transition-all">
          <span>Abrir Dossiê & Central de Soluções</span>
          <ChevronDown className="w-4 h-4 text-slate-500 group-hover/card:translate-y-0.5 transition-transform" />
        </div>

        {/* Overlay invisível para fechar o menu rápido */}
        {showMenu && (
          <div 
            className="fixed inset-0 z-20"
            onClick={(e) => { e.stopPropagation(); setShowMenu(false); }}
          />
        )}
      </div>
    </div>
  );
}
