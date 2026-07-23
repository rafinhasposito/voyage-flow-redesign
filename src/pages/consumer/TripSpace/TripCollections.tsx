import React, { useState } from 'react';
import { Heart, Sparkles, MapPin, Info, Plus, Eye } from 'lucide-react';
import { TripSpaceIdea } from '@/types/tripSpace.types';
import { ExperienceDetailModal } from './ExperienceDetailModal';

interface TripCollectionsProps {
  savedIdeas: TripSpaceIdea[];
  maybeIdeas: TripSpaceIdea[];
  recommendations: TripSpaceIdea[];
  onAddIdea?: (ideaId: string) => void;
}

export function TripCollections({ savedIdeas, maybeIdeas, recommendations, onAddIdea }: TripCollectionsProps) {
  const [selectedIdea, setSelectedIdea] = useState<TripSpaceIdea | null>(null);

  return (
    <section className="mb-8 space-y-8">
      {/* Experience Detail Modal */}
      {selectedIdea && (
        <ExperienceDetailModal
          item={selectedIdea}
          onClose={() => setSelectedIdea(null)}
          onAdd={onAddIdea}
        />
      )}

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
              <div key={idea.id} onClick={() => setSelectedIdea(idea)} className="bg-white border border-slate-200/80 rounded-2xl p-3 shadow-xs hover:shadow-md transition-all group cursor-pointer flex flex-col justify-between">
                <div>
                  <div className="relative h-32 rounded-xl overflow-hidden mb-3 bg-slate-100">
                    {idea.photoUrl ? (
                      <img src={idea.photoUrl} alt={idea.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold text-xs">Sem foto</div>
                    )}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-xs mb-1 line-clamp-2">{idea.title}</h4>
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 mb-3">
                      <MapPin className="w-3 h-3" />
                      <span className="truncate">{idea.location || 'Localização não informada'}</span>
                    </div>
                  </div>
                </div>

                {onAddIdea && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddIdea(idea.id);
                    }}
                    className="w-full py-1.5 px-3 bg-lime-100 hover:bg-lime-200 text-lime-900 text-[11px] font-extrabold rounded-xl flex items-center justify-center gap-1 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Adicionar
                  </button>
                )}
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
              <div key={idea.id} onClick={() => setSelectedIdea(idea)} className="bg-white border border-slate-200/80 rounded-2xl p-3 shadow-xs hover:shadow-md transition-all group cursor-pointer flex flex-col justify-between">
                <div>
                  <div className="relative h-32 rounded-xl overflow-hidden mb-3 bg-slate-100">
                    {idea.photoUrl ? (
                      <img src={idea.photoUrl} alt={idea.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold text-xs">Sem foto</div>
                    )}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-xs mb-1 line-clamp-2">{idea.title}</h4>
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 mb-3">
                      <MapPin className="w-3 h-3" />
                      <span className="truncate">{idea.location || 'Localização não informada'}</span>
                    </div>
                  </div>
                </div>

                {onAddIdea && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddIdea(idea.id);
                    }}
                    className="w-full py-1.5 px-3 bg-lime-100 hover:bg-lime-200 text-lime-900 text-[11px] font-extrabold rounded-xl flex items-center justify-center gap-1 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Adicionar
                  </button>
                )}
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
              <div key={rec.id} onClick={() => setSelectedIdea(rec)} className="bg-white border border-slate-200/80 rounded-2xl p-3 shadow-xs hover:shadow-md transition-all group cursor-pointer flex flex-col justify-between">
                <div>
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

                {onAddIdea && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddIdea(rec.id);
                    }}
                    className="w-full py-1.5 px-3 bg-lime-100 hover:bg-lime-200 text-lime-900 text-[11px] font-extrabold rounded-xl flex items-center justify-center gap-1 transition-colors mt-2"
                  >
                    <Plus className="w-3.5 h-3.5" /> Adicionar
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
