import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function isVideoUrl(url: string | undefined): boolean {
  if (!url) return false;
  return url.match(/\.(mp4|webm|ogg)$/i) !== null || url.includes('youtube.com') || url.includes('vimeo.com');
}
export function getSafeMediaUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  return url.startsWith('http') ? url : `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/${url}`;
}
