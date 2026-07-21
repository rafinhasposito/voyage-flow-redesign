import React from 'react';
import { Heart, Plus, Sparkles, MapPin, ChevronRight, Info } from 'lucide-react';
import { TripSpaceIdea } from '@/types/tripSpace.types';

interface TripCollectionsProps {
  savedIdeas: TripSpaceIdea[];
  recommendations: TripSpaceIdea[];
}

export function TripCollections({ savedIdeas, recommendations }: TripCollectionsProps) {
  return (
    <section className="mb-8 space-y-8">
      {/* Ideias Salvas Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">Ideias salvas</h2>
            <p className="text-xs text-slate-500 font-medium">Experiências que você curtiu ou salvou durante seu planejamento.</p>
          </div>
          {savedIdeas.length > 0 && (
            <button className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1">
              Ver todas <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {savedIdeas.length === 0 ? (
          <div className="bg-white border border-slate-200/80 rounded-[28px] p-8 text-center">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
              <Heart className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-slate-900 text-sm mb-1">Você ainda não salvou ideias para esta viagem.</h3>
            <p className="text-xs text-slate-500 font-medium max-w-sm mx-auto mb-4">
              Ao explorar atrações ou dar Match durante o onboarding, suas experiências favoritas aparecerão aqui.
            </p>
            <button className="bg-slate-900 text-white text-xs font-bold px-5 py-2.5 rounded-full hover:bg-slate-800 transition-colors">
              Explorar experiências
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {savedIdeas.map((idea) => (
              <div key={idea.id} className="bg-white border border-slate-200/80 rounded-2xl p-3 shadow-xs hover:shadow-md transition-shadow group">
                <div className="relative h-32 rounded-xl overflow-hidden mb-3 bg-slate-100">
                  {idea.photoUrl ? (
                    <img src={idea.photoUrl} alt={idea.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold text-xs">Sem foto</div>
                  )}
                  <button className="absolute top-2 right-2 p-1.5 bg-white/90 backdrop-blur-sm rounded-full text-red-500 hover:bg-white shadow-xs">
                    <Heart className="w-3.5 h-3.5 fill-current" />
                  </button>
                </div>
                <h4 className="font-extrabold text-slate-900 text-xs truncate">{idea.title}</h4>
                <p className="text-[11px] text-slate-500 truncate mt-0.5">{idea.neighborhood || idea.category}</p>
                {idea.reason && (
                  <p className="text-[10px] text-purple-700 bg-purple-50 font-bold px-2 py-0.5 rounded-md mt-2 truncate">
                    {idea.reason}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sugestões Para Você Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
              Sugestões para você <Sparkles className="w-4 h-4 text-lime-500" />
            </h2>
            <p className="text-xs text-slate-500 font-medium">Propostas alinhadas ao seu perfil e ao estilo da viagem.</p>
          </div>
        </div>

        {recommendations.length === 0 ? (
          <div className="bg-white border border-slate-200/80 rounded-[28px] p-6 text-center">
            <p className="text-xs font-bold text-slate-600">Nenhuma sugestão adicional encontrada para este destino no momento.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {recommendations.slice(0, 3).map((rec) => (
              <div key={rec.id} className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="relative h-36 rounded-xl overflow-hidden mb-3 bg-slate-100">
                    {rec.photoUrl ? (
                      <img src={rec.photoUrl} alt={rec.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold text-xs">Sem foto</div>
                    )}
                    <span className="absolute bottom-2 left-2 bg-slate-900/80 backdrop-blur-sm text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                      {rec.category}
                    </span>
                  </div>
                  <h4 className="font-extrabold text-slate-900 text-sm truncate">{rec.title}</h4>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-slate-400" /> {rec.neighborhood}
                  </p>
                </div>

                {/* Por que combina? */}
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-1 text-[11px] font-bold text-purple-700">
                    <Info className="w-3 h-3" />
                    <span className="truncate max-w-[150px]">{rec.reason}</span>
                  </div>
                  <button className="p-1.5 bg-lime-400 hover:bg-lime-500 text-slate-950 rounded-full font-bold transition-colors">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
