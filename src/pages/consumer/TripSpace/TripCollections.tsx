import React from 'react';
import { Heart, Sparkles, MapPin, Info } from 'lucide-react';
import { TripSpaceIdea } from '@/types/tripSpace.types';

interface TripCollectionsProps {
  savedIdeas: TripSpaceIdea[];
  maybeIdeas: TripSpaceIdea[];
  recommendations: TripSpaceIdea[];
}

export function TripCollections({ savedIdeas, maybeIdeas, recommendations }: TripCollectionsProps) {
  return (
    <section className="mb-8 space-y-8">
      {/* Ideias Salvas Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">Curtidas no Match</h2>
            <p className="text-xs text-slate-500 font-medium">Experiências que você curtiu ou salvou durante seu planejamento.</p>
          </div>
        </div>

        {savedIdeas.length === 0 ? (
          <div className="bg-white border border-slate-200/80 rounded-[28px] p-8 text-center">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
              <Heart className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-slate-900 text-sm mb-1">Você ainda não deu match em ideias para esta viagem.</h3>
            <p className="text-xs text-slate-500 font-medium max-w-sm mx-auto mb-4">
              Ao explorar atrações ou dar Match durante o onboarding, suas experiências favoritas aparecerão aqui.
            </p>
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
                    <Heart className="w-4 h-4 fill-current" />
                  </button>
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 text-xs mb-1 line-clamp-2">{idea.title}</h4>
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                    <MapPin className="w-3 h-3" />
                    <span className="truncate">{idea.location || 'Localização não informada'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Talvez Section */}
      {maybeIdeas && maybeIdeas.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">Talvez</h2>
              <p className="text-xs text-slate-500 font-medium">Ideias que você marcou como Talvez, mas que não entraram no roteiro principal.</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {maybeIdeas.map((idea) => (
              <div key={idea.id} className="bg-white border border-slate-200/80 rounded-2xl p-3 shadow-xs hover:shadow-md transition-shadow group">
                <div className="relative h-32 rounded-xl overflow-hidden mb-3 bg-slate-100">
                  {idea.photoUrl ? (
                    <img src={idea.photoUrl} alt={idea.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold text-xs">Sem foto</div>
                  )}
                  <button className="absolute top-2 right-2 p-1.5 bg-white/90 backdrop-blur-sm rounded-full text-slate-400 hover:text-red-500 hover:bg-white shadow-xs">
                    <Heart className="w-4 h-4" />
                  </button>
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 text-xs mb-1 line-clamp-2">{idea.title}</h4>
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                    <MapPin className="w-3 h-3" />
                    <span className="truncate">{idea.location || 'Localização não informada'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Descubra Mais Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-lime-500" /> Outras sugestões
            </h2>
            <p className="text-xs text-slate-500 font-medium">Recomendações baseadas no seu perfil e nas suas escolhas.</p>
          </div>
        </div>

        {recommendations.length === 0 ? (
          <div className="bg-white border border-slate-200/80 rounded-[28px] p-8 text-center flex flex-col items-center">
             <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
              <Info className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-slate-900 text-sm mb-1">Nenhuma recomendação no momento.</h3>
            <p className="text-xs text-slate-500 font-medium max-w-sm mx-auto">
              Continue interagindo com o roteiro para receber sugestões personalizadas.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {recommendations.map((rec) => (
              <div key={rec.id} className="bg-white border border-slate-200/80 rounded-2xl p-3 shadow-xs hover:shadow-md transition-shadow group flex flex-col">
                <div className="relative h-32 rounded-xl overflow-hidden mb-3 bg-slate-100 shrink-0">
                  {rec.photoUrl ? (
                    <img src={rec.photoUrl} alt={rec.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold text-xs">Sem foto</div>
                  )}
                  {rec.matchScore && (
                    <div className="absolute top-2 left-2 bg-slate-900/80 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded-lg">
                      <Sparkles className="w-3 h-3 inline mr-1" />
                      {rec.matchScore}% Match
                    </div>
                  )}
                </div>
                <h4 className="font-extrabold text-slate-900 text-xs truncate">{rec.title}</h4>
                <p className="text-[11px] text-slate-500 truncate mt-0.5 mb-3">{rec.neighborhood || rec.category}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
