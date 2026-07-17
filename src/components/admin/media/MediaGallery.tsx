import React, { useState, useRef } from "react";
import { X, Plus, ImageIcon, Star, GripHorizontal, ArrowLeft, ArrowRight, UploadCloud, Link as LinkIcon, Video as VideoIcon } from "lucide-react";
import { getSafeMediaUrl } from "@/lib/utils";
import { uploadMedia, UploadState, identifyMediaType } from "@/lib/mediaUploadService";
import { parseVideoUrl } from "@/lib/videoUtils";

interface MediaGalleryProps {
  mediaUrls: string[];
  coverImageUrl: string | null;
  experienceId: string;
  isDraft: boolean;
  onChangeUrls: (urls: string[]) => void;
  onChangeCover: (url: string | null, type: 'image' | 'video' | null) => void;
}

const BLOCKED_DOMAINS = [
  "places.googleapis.com",
  "maps.googleapis.com",
  "maps.gstatic.com",
  "googleusercontent.com"
];

export function MediaGallery({ mediaUrls, coverImageUrl, experienceId, isDraft, onChangeUrls, onChangeCover }: MediaGalleryProps) {
  const [newUrl, setNewUrl] = useState("");
  const [activeTab, setActiveTab] = useState<'upload' | 'link' | 'video'>('upload');
  const [error, setError] = useState<string | null>(null);
  
  // Upload State
  const [uploadState, setUploadState] = useState<UploadState | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Drag and drop state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const isBlockedDomain = (url: string) => {
    try {
      const u = new URL(url);
      return BLOCKED_DOMAINS.some(domain => u.hostname.includes(domain));
    } catch {
      return false;
    }
  };

  const handleAddLink = () => {
    setError(null);
    const url = newUrl.trim();
    if (!url) return;

    if (!/^https?:\/\//i.test(url)) {
      setError("A URL deve começar com http:// ou https://");
      return;
    }

    if (isBlockedDomain(url)) {
      setError("URLs do Google são bloqueadas pelas regras de domínio.");
      return;
    }

    if (mediaUrls.includes(url)) {
      setError("Esta URL já está na galeria.");
      return;
    }

    addUrlToGallery(url);
    setNewUrl("");
  };
  
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    
    const { path, error: uploadError } = await uploadMedia(file, experienceId, isDraft, (prog) => {
      setUploadState(prog.state);
    });
    
    if (uploadError || !path) {
      setError(uploadError || "Erro desconhecido no upload.");
      setUploadState(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    
    addUrlToGallery(path);
    setUploadState(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };
  
  const addUrlToGallery = (url: string) => {
    const newUrls = [...mediaUrls, url];
    onChangeUrls(newUrls);
    if (newUrls.length === 1 && !coverImageUrl) {
       onChangeCover(url, identifyMediaType(url));
    }
  };

  const handleRemove = (url: string) => {
    if (url === coverImageUrl) {
      if (!window.confirm("Esta imagem é a capa atual. Tem certeza que deseja removê-la? A capa será removida ou reatribuída.")) {
        return;
      }
      
      const newUrls = mediaUrls.filter(u => u !== url);
      onChangeUrls(newUrls);
      
      if (newUrls.length > 0) {
        if (window.confirm("Deseja definir a primeira imagem restante como nova capa?")) {
          onChangeCover(newUrls[0], identifyMediaType(newUrls[0]));
        } else {
          onChangeCover(null, null);
        }
      } else {
        onChangeCover(null, null);
      }
    } else {
      onChangeUrls(mediaUrls.filter(u => u !== url));
    }
  };

  // Drag and drop events
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", index.toString());
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault(); // Necessary to allow dropping
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) return;

    const newUrls = [...mediaUrls];
    const draggedItem = newUrls[draggedIndex];
    
    newUrls.splice(draggedIndex, 1);
    newUrls.splice(dropIndex, 0, draggedItem);
    
    onChangeUrls(newUrls);
    setDraggedIndex(null);
  };
  
  const moveLeft = (index: number) => {
     if (index <= 0) return;
     const newUrls = [...mediaUrls];
     const temp = newUrls[index - 1];
     newUrls[index - 1] = newUrls[index];
     newUrls[index] = temp;
     onChangeUrls(newUrls);
  };
  
  const moveRight = (index: number) => {
     if (index >= mediaUrls.length - 1) return;
     const newUrls = [...mediaUrls];
     const temp = newUrls[index + 1];
     newUrls[index + 1] = newUrls[index];
     newUrls[index] = temp;
     onChangeUrls(newUrls);
  };

  return (
    <div className="space-y-4">
      {/* 3 Opções Claras */}
      <div className="flex bg-slate-100 p-1 rounded-lg w-fit">
        <button type="button" onClick={() => setActiveTab('upload')} className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${activeTab === 'upload' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><UploadCloud className="w-3.5 h-3.5" /> Enviar foto ou vídeo</button>
        <button type="button" onClick={() => setActiveTab('link')} className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${activeTab === 'link' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><LinkIcon className="w-3.5 h-3.5" /> Adicionar por link</button>
        <button type="button" onClick={() => setActiveTab('video')} className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${activeTab === 'video' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><VideoIcon className="w-3.5 h-3.5" /> YouTube / Vimeo</button>
      </div>

      <div className="bg-slate-50 border border-vf-border p-4 rounded-xl">
        {activeTab === 'upload' && (
          <div className="space-y-3">
             <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/jpeg,image/png,image/webp,video/mp4,video/webm" className="hidden" />
             <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploadState !== null} className="w-full border-2 border-dashed border-indigo-200 hover:border-indigo-400 bg-white text-indigo-600 rounded-xl py-6 flex flex-col items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                <UploadCloud className="w-8 h-8 mb-2" />
                <span className="font-bold text-sm">Clique para selecionar do computador</span>
                <span className="text-xs text-slate-500 mt-1">Imagens (JPEG, PNG, WebP) até 5MB. Vídeos (MP4, WebM) até 50MB.</span>
             </button>
             {uploadState && (
               <div className="bg-indigo-50 text-indigo-700 text-xs font-bold p-2 rounded flex items-center justify-between">
                 <span>Status do upload: {uploadState}</span>
                 {uploadState !== 'Concluído' && uploadState !== 'Falha' && <span className="animate-pulse">⏳</span>}
               </div>
             )}
          </div>
        )}
        
        {activeTab === 'link' && (
          <div className="flex gap-2">
            <input type="text" value={newUrl} onChange={e => setNewUrl(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddLink())} placeholder="https://site.com/imagem.jpg" className="flex-1 rounded-md border border-vf-border bg-white px-3 py-2 text-[13px] focus:border-vf-black focus:outline-none" />
            <button onClick={handleAddLink} type="button" className="bg-vf-black text-white px-4 py-2 rounded-md text-[13px] font-bold flex items-center gap-1 hover:bg-vf-black/90">
              Adicionar
            </button>
          </div>
        )}
        
        {activeTab === 'video' && (
          <div className="flex gap-2">
            <input type="text" value={newUrl} onChange={e => setNewUrl(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddLink())} placeholder="https://youtube.com/watch?v=..." className="flex-1 rounded-md border border-vf-border bg-white px-3 py-2 text-[13px] focus:border-vf-black focus:outline-none" />
            <button onClick={handleAddLink} type="button" className="bg-vf-black text-white px-4 py-2 rounded-md text-[13px] font-bold flex items-center gap-1 hover:bg-vf-black/90">
              Adicionar Vídeo
            </button>
          </div>
        )}
        
        {error && <p className="text-red-500 text-xs font-bold mt-2">{error}</p>}
      </div>
      
      {mediaUrls.length === 0 ? (
        <div className="border-2 border-dashed border-vf-border/50 rounded-xl p-8 flex flex-col items-center justify-center text-vf-text-3">
          <ImageIcon className="w-8 h-8 mb-2 opacity-50" />
          <p className="text-[13px] font-medium">Nenhuma imagem adicionada.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {mediaUrls.map((url, i) => {
            const isCover = coverImageUrl === url;
            const safeUrl = getSafeMediaUrl(url);
            const mediaType = identifyMediaType(url);
            
            return (
              <div 
                key={url + i}
                draggable
                onDragStart={(e) => handleDragStart(e, i)}
                onDragOver={(e) => handleDragOver(e, i)}
                onDrop={(e) => handleDrop(e, i)}
                className={`relative group aspect-square rounded-xl overflow-hidden border-2 bg-slate-900 transition-all ${
                  isCover ? "border-indigo-600 shadow-md" : "border-vf-border hover:border-gray-400"
                } ${draggedIndex === i ? "opacity-40" : "opacity-100"}`}
              >
                {/* Visual */}
                {mediaType === 'video' && (url.includes('youtube.com') || url.includes('youtu.be') || url.includes('vimeo.com')) ? (
                   <iframe
                     src={parseVideoUrl(url).embedUrl || ""}
                     className="w-full h-full object-cover bg-black"
                     allowFullScreen
                   />
                ) : mediaType === 'video' ? (
                   <video 
                     src={safeUrl} 
                     controls 
                     preload="metadata" 
                     playsInline
                     className="w-full h-full object-cover bg-black"
                     onError={(e) => {
                       console.error("Video load error", e);
                     }}
                   >
                     Seu navegador não suporta a tag de vídeo.
                   </video>
                ) : (
                   <img src={safeUrl} alt={`Mídia ${i}`} className="w-full h-full object-cover" />
                )}
                
                {/* Número da Ordem */}
                <div className="absolute top-2 left-2 w-5 h-5 bg-black/60 rounded flex items-center justify-center text-[10px] font-bold text-white shadow-sm pointer-events-none">
                  {i + 1}
                </div>

                {/* Badge de Capa */}
                {isCover && (
                  <div className="absolute bottom-2 left-2 bg-indigo-600 text-white text-[9px] font-bold px-2 py-0.5 rounded shadow flex items-center gap-1 pointer-events-none">
                    <Star className="w-2.5 h-2.5 fill-white" /> Capa
                  </div>
                )}
                
                {/* Controles de Hover */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-between p-2 pointer-events-none">
                  <div className="w-full flex justify-between pointer-events-auto">
                    {!isCover ? (
                      <button type="button" onClick={() => onChangeCover(url, mediaType)} className="bg-white/90 hover:bg-white text-indigo-700 text-[10px] font-bold px-2 py-1 rounded shadow-sm">
                        Tornar Capa
                      </button>
                    ) : <div />}
                    
                    <button type="button" onClick={() => handleRemove(url)} className="bg-white/90 hover:bg-white text-red-600 p-1 rounded shadow-sm">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Gripper central para drag */}
                  <div className="cursor-move p-2 bg-black/40 rounded-lg hover:bg-black/60 transition-colors pointer-events-auto">
                     <GripHorizontal className="w-5 h-5 text-white/80" />
                  </div>
                  
                  {/* Botões Acessíveis para mover */}
                  <div className="w-full flex justify-between pb-1 pointer-events-auto">
                     <button type="button" onClick={() => moveLeft(i)} disabled={i === 0} className="bg-white/90 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white text-vf-black p-1 rounded shadow-sm">
                       <ArrowLeft className="w-3 h-3" />
                     </button>
                     <button type="button" onClick={() => moveRight(i)} disabled={i === mediaUrls.length - 1} className="bg-white/90 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white text-vf-black p-1 rounded shadow-sm">
                       <ArrowRight className="w-3 h-3" />
                     </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
