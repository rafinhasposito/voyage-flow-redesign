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
    </section>
  );
}
