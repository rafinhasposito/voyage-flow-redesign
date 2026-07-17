import React from "react";
import { FormState } from "../../../pages/admin/ExperienceEditor";
import { MatchScoreBadge } from "../../MatchScoreBadge";
import { MapPin, Heart, X } from "lucide-react";

interface DiscoveryCardPreviewProps {
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

export function DiscoveryCardPreview({ form }: DiscoveryCardPreviewProps) {
  const mainImage = form.cover_media_url || form.cover_image_url || (form.media_urls.length > 0 ? form.media_urls[0] : null);
  const safeUrl = mainImage ? (mainImage.startsWith('http') || mainImage.startsWith('data:') ? mainImage : `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/${mainImage}`) : null;

  return (
    <div className="flex flex-col items-center pointer-events-none">
      <div className="text-[10px] uppercase font-bold tracking-widest text-[#C5A85C] mb-2">
        Prévia Conceitual — Descoberta
      </div>
      
      <div className="relative w-full max-w-[320px] aspect-[3/4] rounded-3xl overflow-hidden shadow-2xl bg-[#0D0E10] text-white">
        {form.cover_media_type === 'video' ? (
          form.cover_media_url?.includes('youtube.com') || form.cover_media_url?.includes('youtu.be') || form.cover_media_url?.includes('vimeo.com') ? (
            <div className="absolute inset-0 w-full h-full bg-black flex items-center justify-center">
               {form.cover_media_poster_url ? (
                  <img src={form.cover_media_poster_url} className="absolute inset-0 w-full h-full object-cover opacity-60" alt="Poster" />
               ) : (
                  <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-slate-900 text-slate-500">
                    Sem Poster
                  </div>
               )}
               <div className="z-10 w-12 h-12 bg-black/60 rounded-full flex items-center justify-center text-white backdrop-blur-sm border border-white/20 shadow-lg">
                 <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
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
              className="absolute inset-0 w-full h-full object-cover opacity-80"
            />
          )
        ) : safeUrl ? (
          <img src={safeUrl} alt={form.title} className="absolute inset-0 w-full h-full object-cover opacity-80" />
        ) : (
          <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-[#F3EFEA] text-slate-400">
            Sem Imagem
          </div>
        )}
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
        
        <div className="absolute top-4 right-4">
          <MatchScoreBadge score={85} />
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6 space-y-3">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#C5A85C] bg-black/50 px-2 py-1 rounded-md backdrop-blur-sm">
            {translateTerm(form.category || "Atração")}
          </span>
          
          <h2 className="font-serif text-3xl font-light leading-tight drop-shadow-md line-clamp-2">
            {form.title || "Nome da Experiência"}
          </h2>
          
          <div className="flex items-center gap-1.5 text-sm font-medium text-white/80">
            <MapPin className="h-4 w-4" />
            {form.neighborhood || "Bairro"}
          </div>
        </div>
      </div>
      
      <div className="flex gap-4 mt-6">
        <div className="w-14 h-14 rounded-full bg-white text-red-500 flex items-center justify-center shadow-lg border border-[#EAE6DF]">
          <X className="w-6 h-6" strokeWidth={3} />
        </div>
        <div className="w-14 h-14 rounded-full bg-[#0D0E10] text-white flex items-center justify-center shadow-lg">
          <Heart className="w-6 h-6" strokeWidth={2.5} />
        </div>
      </div>
    </div>
  );
}
