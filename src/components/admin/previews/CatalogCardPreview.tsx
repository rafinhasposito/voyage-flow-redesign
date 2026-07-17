import React from "react";
import { FormState } from "../../../pages/admin/ExperienceEditor";
import { MatchScoreBadge } from "../../MatchScoreBadge";
import { MapPin } from "lucide-react";

interface CatalogCardPreviewProps {
  form: FormState;
}

const TERM_MAP: Record<string, string> = {
  culture: 'Arte & Cultura', food: 'Gastronomia', views: 'Mirantes', 
  nature: 'Parques', shopping: 'Compras', classic: 'Clássico', 
  nightlife: 'Vida Noturna', hidden_gem: 'Tesouro Escondido',
  attraction: 'Atração'
};

function translateTerm(term: string): string {
  return TERM_MAP[term] || term;
}

export function CatalogCardPreview({ form }: CatalogCardPreviewProps) {
  const mainImage = form.cover_media_url || form.cover_image_url || (form.media_urls.length > 0 ? form.media_urls[0] : null);
  const safeUrl = mainImage ? (mainImage.startsWith('http') || mainImage.startsWith('data:') ? mainImage : `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/${mainImage}`) : null;

  // Usa valor fake de match score, pois não temos o estado global do perfil aqui
  const matchScore = 85; 

  return (
    <article className="bg-white rounded-3xl border border-[#EAE6DF] overflow-hidden flex flex-col group hover:shadow-xl transition-all duration-300 pointer-events-none">
      <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
        {form.cover_media_type === 'video' ? (
          form.cover_media_url?.includes('youtube.com') || form.cover_media_url?.includes('youtu.be') || form.cover_media_url?.includes('vimeo.com') ? (
            <div className="h-full w-full relative bg-black flex items-center justify-center">
               {form.cover_media_poster_url ? (
                  <img src={form.cover_media_poster_url} className="w-full h-full object-cover opacity-60" alt="Poster" />
               ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-900 text-slate-500">
                    Sem Poster
                  </div>
               )}
               <div className="absolute inset-0 flex items-center justify-center">
                 <div className="w-12 h-12 bg-black/60 rounded-full flex items-center justify-center text-white backdrop-blur-sm border border-white/20 shadow-lg">
                   <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                 </div>
               </div>
            </div>
          ) : (
            <video 
              src={safeUrl || undefined} 
              autoPlay 
              loop 
              muted 
              playsInline 
              preload="metadata"
              className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          )
        ) : safeUrl ? (
          <img 
            src={safeUrl} 
            alt={form.title} 
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center bg-[#F3EFEA] text-slate-400">
            Sem Imagem
          </div>
        )}
        <div className="absolute top-3 right-3 flex flex-col gap-1.5 items-end">
          <MatchScoreBadge score={matchScore} label="Personalizado" />
        </div>
      </div>

      <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#C5A85C]">
            {translateTerm(form.category || "Atração")}
          </span>
          <h3 className="font-serif text-xl font-medium text-[#0D0E10] leading-tight line-clamp-2">
            {form.title || "Nome da Experiência"}
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed line-clamp-3">
            {form.short_description || form.description || "Descrição curta aparecerá aqui."}
          </p>
        </div>

        <div className="space-y-4 pt-4 border-t border-[#EAE6DF]">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-slate-300" />
              {form.neighborhood || "Bairro"}
            </span>
            <span className="font-medium text-slate-600">
              {form.base_cost === 0 ? "Grátis" : `U$ ${form.base_cost}`}
            </span>
          </div>

          <button className="w-full inline-flex items-center justify-center gap-2 rounded-2xl py-3 text-xs font-medium transition-all bg-[#0D0E10] text-white shadow-md">
            Adicionar ao Roteiro
          </button>
        </div>
      </div>
    </article>
  );
}
