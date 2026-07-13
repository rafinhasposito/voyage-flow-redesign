import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function isVideoUrl(url: string | undefined): boolean {
  if (!url) return false;
  return url.match(/\.(mp4|webm|ogg)$/i) !== null || url.includes('youtube.com') || url.includes('vimeo.com');
}
