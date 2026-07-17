import React from "react";
import { ExperienceRow } from "@/repositories/ExperienceRepository";

// Mapeamento simples para exibição local
const TERM_MAP: Record<string, string> = {
  culture: 'Cultura', food: 'Comida', views: 'Vistas', 
  nature: 'Natureza', shopping: 'Compras', classic: 'Clássico', 
  nightlife: 'Vida Noturna', hidden_gem: 'Tesouro Escondido',
  attraction: 'Atração'
};

function translateTerm(term: string): string {
  return TERM_MAP[term] || term;
}

interface ExperienceMapMiniCardProps {
  experience: Partial<ExperienceRow> & { 
    cover_image_url?: string | null;
    cover_media_url?: string | null;
    cover_media_type?: 'image' | 'video' | null;
    cover_media_poster_url?: string | null;
  };
  onViewList?: (id: string) => void;
  onEdit?: (id: string) => void;
  hideActions?: boolean; // Permite ocultar botões no painel de preview
}

export function ExperienceMapMiniCard({ experience: exp, onViewList, onEdit, hideActions }: ExperienceMapMiniCardProps) {
  const mainImage = exp.cover_media_url || exp.cover_image_url || (exp.media_urls && exp.media_urls.length > 0 ? exp.media_urls[0] : null);
  
  let safeUrl = null;
  if (mainImage) {
    safeUrl = mainImage.startsWith('http') || mainImage.startsWith('data:') ? mainImage : `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/${mainImage}`;
  }

  const costStr = exp.base_cost && exp.base_cost > 0 ? `US$ ${exp.base_cost}` : 'Gratuito';
  const ratingStr = exp.rating ? `⭐ ${exp.rating} (${exp.reviews_count || 0})` : '';
  const isPublished = exp.status === 'published';

  return (
    <div className="p-2 min-w-[220px] max-w-[240px] font-sans bg-white rounded-lg">
      {exp.cover_media_type === 'video' ? (
        exp.cover_media_url?.includes('youtube.com') || exp.cover_media_url?.includes('youtu.be') || exp.cover_media_url?.includes('vimeo.com') ? (
          <div className="w-full h-24 mb-3 rounded-lg overflow-hidden bg-black relative flex items-center justify-center">
             {exp.cover_media_poster_url ? (
                <img src={exp.cover_media_poster_url} className="w-full h-full object-cover opacity-60" alt="Poster" />
             ) : (
                <div className="w-full h-full flex items-center justify-center bg-slate-900 text-slate-500 text-xs">
                  Sem Poster
                </div>
             )}
             <div className="absolute inset-0 flex items-center justify-center">
               <div className="w-8 h-8 bg-black/60 rounded-full flex items-center justify-center text-white backdrop-blur-sm border border-white/20 shadow-md">
                 <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
               </div>
             </div>
          </div>
        ) : (
          <div className="w-full h-24 mb-3 rounded-lg overflow-hidden bg-black">
            <video 
              src={safeUrl || undefined} 
              autoPlay 
              loop 
              muted 
              playsInline 
              preload="metadata"
              className="w-full h-full object-cover"
            />
          </div>
        )
      ) : safeUrl ? (
        <div className="w-full h-24 mb-3 rounded-lg overflow-hidden bg-gray-100">
          <img src={safeUrl} alt={exp.title || "Experiência"} className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className="w-full h-24 mb-3 rounded-lg flex items-center justify-center bg-[#F7F7F2]">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300">
            <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
            <circle cx="9" cy="9" r="2"/>
            <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
          </svg>
        </div>
      )}
      
      <h4 className="font-bold text-[#171717] text-[13px] mb-1 line-clamp-2 leading-tight">
        {exp.title || "Sem Título"}
      </h4>
      
      <div className="flex items-center gap-1.5 mb-2 flex-wrap">
        <span className="text-[10px] font-bold uppercase tracking-wide text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">
          {translateTerm(exp.category || "Atração")}
        </span>
        <span className="text-[11px] text-[#171717]/60 font-medium truncate max-w-[120px]">
          {exp.neighborhood || ''}
        </span>
      </div>
      
      <div className="flex items-center justify-between mb-3 text-[11px] font-medium text-[#171717]/70">
        <span>{costStr}</span>
        <span>{ratingStr}</span>
      </div>
      
      <div className="flex items-center justify-between mb-3">
        <span className={`text-[10px] font-bold uppercase ${isPublished ? 'text-emerald-600' : 'text-amber-600'}`}>
          {isPublished ? 'Publicado' : 'Rascunho'}
        </span>
      </div>

      {!hideActions && (
        <div className="flex gap-2">
          <button 
            onClick={() => onViewList && exp.id && onViewList(exp.id)}
            className="flex-1 bg-white border border-[#171717]/10 hover:border-[#171717]/30 transition-colors text-[#171717] py-2 rounded-xl text-[11px] font-bold"
          >
            Ver na lista
          </button>
          <button 
            onClick={() => onEdit && exp.id && onEdit(exp.id)}
            className="flex-1 bg-[#171717] hover:bg-[#171717]/90 transition-colors text-white py-2 rounded-xl text-[11px] font-bold"
          >
            Editar
          </button>
        </div>
      )}
    </div>
  );
}
