/**
 * Utilitários para converter e validar URLs de vídeo, garantindo que o iframe
 * carregue apenas vídeos seguros do YouTube ou Vimeo, bloqueando conteúdo arbitrário.
 */

export interface VideoParseResult {
  platform: "youtube" | "vimeo" | "unknown";
  embedUrl: string | null;
  thumbnailUrl?: string | null;
  error?: string;
}

export function parseVideoUrl(url: string): VideoParseResult {
  if (!url || typeof url !== "string") {
    return { platform: "unknown", embedUrl: null, error: "URL inválida." };
  }

  const trimmed = url.trim();
  
  if (!/^https?:\/\//i.test(trimmed)) {
    return { platform: "unknown", embedUrl: null, error: "URL deve começar com http:// ou https://." };
  }

  try {
    const urlObj = new URL(trimmed);
    const hostname = urlObj.hostname.toLowerCase();

    // YouTube
    if (hostname.includes("youtube.com") || hostname.includes("youtu.be")) {
      let videoId: string | null = null;
      
      if (hostname.includes("youtu.be")) {
        videoId = urlObj.pathname.slice(1);
      } else if (urlObj.pathname.startsWith("/embed/")) {
        videoId = urlObj.pathname.split("/")[2];
      } else {
        videoId = urlObj.searchParams.get("v");
      }

      if (videoId) {
        return {
          platform: "youtube",
          embedUrl: `https://www.youtube.com/embed/${videoId}`,
          thumbnailUrl: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
        };
      }
      return { platform: "youtube", embedUrl: null, error: "ID do vídeo não encontrado na URL do YouTube." };
    }

    // Vimeo
    if (hostname.includes("vimeo.com")) {
      const parts = urlObj.pathname.split("/").filter(Boolean);
      // vimeo.com/123456789
      if (parts.length > 0 && /^\d+$/.test(parts[0])) {
        return {
          platform: "vimeo",
          embedUrl: `https://player.vimeo.com/video/${parts[0]}`
        };
      }
      return { platform: "vimeo", embedUrl: null, error: "ID do vídeo não encontrado na URL do Vimeo." };
    }

    return { platform: "unknown", embedUrl: null, error: "Plataforma não suportada. Use YouTube ou Vimeo." };
  } catch (e) {
    return { platform: "unknown", embedUrl: null, error: "URL mal formatada." };
  }
}
