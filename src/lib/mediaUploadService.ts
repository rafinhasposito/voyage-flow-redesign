import { supabase } from "./supabase";

export const MEDIA_CONFIG = {
  MAX_IMAGE_SIZE_MB: 5,
  MAX_VIDEO_SIZE_MB: 50,
  ALLOWED_IMAGE_MIME: ['image/jpeg', 'image/png', 'image/webp'],
  ALLOWED_VIDEO_MIME: ['video/mp4', 'video/webm'],
};

export type UploadState = 'Preparando arquivo' | 'Enviando' | 'Processando' | 'Concluído' | 'Falha';

export interface UploadProgress {
  state: UploadState;
  percent?: number;
  error?: string;
}

/**
 * Identify if a string URL is definitely a video by known extension or provider
 */
export function identifyMediaType(url: string, fileMime?: string): 'image' | 'video' | 'unknown' {
  if (fileMime) {
    if (fileMime.startsWith('video/')) return 'video';
    if (fileMime.startsWith('image/')) return 'image';
  }
  const lurl = url.toLowerCase();
  if (lurl.includes('youtube.com') || lurl.includes('vimeo.com') || lurl.includes('youtu.be')) return 'video';
  if (/\.(mp4|webm|mov|ogg)$/i.test(url)) return 'video';
  if (/\.(jpg|jpeg|png|webp|gif|avif)$/i.test(url)) return 'image';
  return 'unknown';
}

/**
 * Uploads a file to experiences-media bucket.
 * For new experiences (drafts), use draftId.
 * For existing experiences, use experienceId.
 */
export async function uploadMedia(
  file: File, 
  experienceId: string, 
  isDraft: boolean,
  onProgress?: (p: UploadProgress) => void
): Promise<{ path: string | null; error: string | null }> {
  try {
    const isImage = MEDIA_CONFIG.ALLOWED_IMAGE_MIME.includes(file.type);
    const isVideo = MEDIA_CONFIG.ALLOWED_VIDEO_MIME.includes(file.type);

    if (!isImage && !isVideo) {
      return { path: null, error: `Formato não suportado. Aceitos: ${MEDIA_CONFIG.ALLOWED_IMAGE_MIME.join(', ')} e ${MEDIA_CONFIG.ALLOWED_VIDEO_MIME.join(', ')}` };
    }

    const sizeMB = file.size / (1024 * 1024);
    if (isImage && sizeMB > MEDIA_CONFIG.MAX_IMAGE_SIZE_MB) {
      return { path: null, error: `Imagem excede o limite de ${MEDIA_CONFIG.MAX_IMAGE_SIZE_MB}MB.` };
    }
    if (isVideo && sizeMB > MEDIA_CONFIG.MAX_VIDEO_SIZE_MB) {
      return { path: null, error: `Vídeo excede o limite de ${MEDIA_CONFIG.MAX_VIDEO_SIZE_MB}MB.` };
    }

    onProgress?.({ state: 'Preparando arquivo' });

    let ext = 'unknown';
    if (file.type === 'image/jpeg') ext = 'jpg';
    else if (file.type === 'image/png') ext = 'png';
    else if (file.type === 'image/webp') ext = 'webp';
    else if (file.type === 'video/mp4') ext = 'mp4';
    else if (file.type === 'video/webm') ext = 'webm';
    
    if (ext === 'unknown') {
      return { path: null, error: 'MIME type não reconhecido pelo mapeamento de segurança.' };
    }

    const uuid = crypto.randomUUID();
    
    const basePath = isDraft ? `drafts/${experienceId}` : experienceId;
    const finalPath = `${basePath}/${uuid}.${ext}`;

    onProgress?.({ state: 'Enviando' });

    // Supabase JS upload doesn't expose native progress events in the standard upload() method yet for the browser in a simple way 
    // without XMLHttpRequest. We will just show "Enviando" until done.
    const { data, error } = await supabase.storage
      .from('experiences-media')
      .upload(finalPath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error("Supabase upload error:", error);
      onProgress?.({ state: 'Falha', error: error.message });
      return { path: null, error: error.message };
    }

    onProgress?.({ state: 'Concluído' });
    const { data: publicData } = supabase.storage.from('experiences-media').getPublicUrl(data.path);
    return { path: publicData.publicUrl, error: null };
  } catch (err: any) {
    onProgress?.({ state: 'Falha', error: err.message });
    return { path: null, error: err.message };
  }
}

/**
 * Helper para extrair o path interno do Storage a partir de uma URL pública
 */
function extractStoragePath(url: string): string | null {
  try {
    const projectUrl = import.meta.env.VITE_SUPABASE_URL;
    if (!projectUrl) return null;
    const bucketPrefix = `${projectUrl}/storage/v1/object/public/experiences-media/`;
    if (url.startsWith(bucketPrefix)) {
      return url.replace(bucketPrefix, '');
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Move files from draft directory to permanent experience directory
 */
export async function moveDraftMediaToPermanent(draftId: string, experienceId: string, urls: string[]): Promise<string[]> {
  const newUrls: string[] = [];
  
  for (const url of urls) {
    const storagePath = extractStoragePath(url);
    if (storagePath && storagePath.startsWith(`drafts/${draftId}/`)) {
      const parts = storagePath.split('/');
      const filename = parts[parts.length - 1];
      const fromPath = `drafts/${draftId}/${filename}`;
      const toPath = `${experienceId}/${filename}`;
      
      const { error } = await supabase.storage.from('experiences-media').move(fromPath, toPath);
      if (!error) {
         const { data: publicData } = supabase.storage.from('experiences-media').getPublicUrl(toPath);
         newUrls.push(publicData.publicUrl);
      } else {
         console.warn(`Failed to move ${fromPath} to ${toPath}:`, error);
         newUrls.push(url); // Keep old if fail
      }
    } else {
      newUrls.push(url);
    }
  }
  
  return newUrls;
}

/**
 * Remove media safely from storage.
 * Only removes if the path explicitly points to our managed bucket AND belongs to the correct experience/draft.
 */
export async function removeMediaSafely(urls: string[], experienceId: string, draftId?: string): Promise<void> {
  const pathsToRemove: string[] = [];

  for (const url of urls) {
    const storagePath = extractStoragePath(url);
    if (!storagePath) continue; // External URL or invalid

    // Validate ownership
    const isOwnedByExperience = storagePath.startsWith(`${experienceId}/`);
    const isOwnedByDraft = draftId ? storagePath.startsWith(`drafts/${draftId}/`) : false;

    if (isOwnedByExperience || isOwnedByDraft) {
      pathsToRemove.push(storagePath);
    }
  }
    
  if (pathsToRemove.length > 0) {
    const { error } = await supabase.storage.from('experiences-media').remove(pathsToRemove);
    if (error) {
      console.error("Failed to remove media safely. Orphan files may exist.", error);
      throw error;
    }
  }
}
