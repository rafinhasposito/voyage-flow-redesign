import React, { useState } from "react";
import { FormState } from "../../../pages/admin/ExperienceEditor";
import { CatalogCardPreview } from "./CatalogCardPreview";
import { ItineraryCardPreview } from "./ItineraryCardPreview";
import { DiscoveryCardPreview } from "./DiscoveryCardPreview";
import { ExperienceMapMiniCard } from "../catalog/ExperienceMapMiniCard";
import { cn } from "@/lib/utils";
import { Eye } from "lucide-react";

interface EditorPreviewPanelProps {
  form: FormState;
}

type TabType = 'catalog' | 'map' | 'itinerary' | 'discovery';

export function EditorPreviewPanel({ form }: EditorPreviewPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>('catalog');

  const tabs: { id: TabType; label: string }[] = [
    { id: 'catalog', label: 'Catálogo' },
    { id: 'map', label: 'Mapa' },
    { id: 'itinerary', label: 'Roteiro' },
    { id: 'discovery', label: 'Descoberta' }
  ];

  return (
    <div className="bg-white rounded-xl border border-vf-border shadow-vf-sm overflow-hidden flex flex-col h-[700px] sticky top-24">
      <div className="p-4 border-b border-vf-border bg-slate-50">
        <h3 className="text-[13px] font-black uppercase tracking-widest text-vf-black flex items-center gap-2 mb-4">
          <Eye className="w-4 h-4 text-indigo-600" /> Previews ao Vivo
        </h3>
        
        <div className="flex bg-vf-muted p-1 rounded-lg">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex-1 py-1.5 text-[11px] font-bold rounded-md transition-colors",
                activeTab === tab.id 
                  ? "bg-white text-vf-black shadow-sm" 
                  : "text-vf-text-3 hover:text-vf-text-2"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 flex flex-col items-center justify-start">
        <div className="w-full max-w-[340px] animate-in fade-in slide-in-from-bottom-2 duration-300">
          {activeTab === 'catalog' && <CatalogCardPreview form={form} />}
          
          {activeTab === 'map' && (
             <div className="flex justify-center mt-10">
               <ExperienceMapMiniCard 
                  experience={{
                    id: 'preview',
                    title: form.title,
                    category: form.category,
                    neighborhood: form.neighborhood,
                    base_cost: form.base_cost,
                    rating: form.rating,
                    reviews_count: form.reviews_count,
                    status: form.status as any,
                    cover_image_url: form.cover_image_url || (form.media_urls.length > 0 ? form.media_urls[0] : null),
                    cover_media_url: form.cover_media_url,
                    cover_media_type: form.cover_media_type,
                    cover_media_poster_url: form.cover_media_poster_url
                  }} 
                  hideActions={true}
               />
             </div>
          )}

          {activeTab === 'itinerary' && <ItineraryCardPreview form={form} />}
          
          {activeTab === 'discovery' && <DiscoveryCardPreview form={form} />}
        </div>
      </div>
    </div>
  );
}
