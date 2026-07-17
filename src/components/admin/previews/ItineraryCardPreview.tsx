import React from "react";
import { FormState } from "../../../pages/admin/ExperienceEditor";
import { MatchScoreBadge } from "../../MatchScoreBadge";
import { MapPin, Clock } from "lucide-react";

interface ItineraryCardPreviewProps {
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

export function ItineraryCardPreview({ form }: ItineraryCardPreviewProps) {
  const mainImage = form.cover_media_url || form.cover_image_url || (form.media_urls.length > 0 ? form.media_urls[0] : null);
  const safeUrl = mainImage ? (mainImage.startsWith('http') || mainImage.startsWith('data:') ? mainImage : `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/${mainImage}`) : null;

  const durationHours = Math.round(form.duration_minutes / 60);

  return (
    <div className="relative group pointer-events-none">
      <span className="absolute -left-[31px] top-1.5 grid h-4 w-4 place-items-center rounded-full bg-white border-2 border-[#C5A85C]" />

      <div className="grid gap-4 md:grid-cols-[120px_1fr] items-start bg-white p-4 border border-[#EAE6DF] rounded-xl shadow-sm">
        <div className="aspect-[4/3] md:aspect-square rounded-xl overflow-hidden bg-slate-100 border border-[#EAE6DF] relative">
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
                   <div className="w-8 h-8 bg-black/60 rounded-full flex items-center justify-center text-white backdrop-blur-sm border border-white/20 shadow-md">
                     <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
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
                className="h-full w-full object-cover"
              />
            )
          ) : safeUrl ? (
            <img src={safeUrl} alt={form.title} className="h-full w-full object-cover" />
          ) : (
             <div className="h-full w-full flex items-center justify-center bg-[#F3EFEA] text-slate-400 text-xs text-center">
               Sem Imagem
             </div>
          )}
          <div className="absolute top-2 right-2">
            <MatchScoreBadge score={85} />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#C5A85C]">
                {translateTerm(form.category || "Atração")}
              </span>
              <h4 className="font-serif text-lg font-medium text-[#0D0E10] mt-0.5 line-clamp-1">
                {form.title || "Nome da Experiência"}
              </h4>
            </div>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
            {form.description || "Descrição completa aparecerá aqui."}
          </p>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-1 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-slate-300" />
              {form.neighborhood || "Bairro"}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-slate-300" />
              {durationHours}h · Sugestão
            </span>
            <span className="flex items-center gap-0.5 font-medium text-slate-600">
              Custo: {form.base_cost === 0 ? "Grátis" : `U$ ${form.base_cost}`}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
