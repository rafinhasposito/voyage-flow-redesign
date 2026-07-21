import { supabase } from '@/lib/supabase';

const CACHE_NAME = 'trip-documents-cache';

export interface OfflineStatus {
  isPersistent: boolean;
  isAvailable: boolean;
  message: string;
}

export class TripOfflineStorage {
  /**
   * Requests persistent storage from the browser.
   */
  static async requestPersistentStorage(): Promise<OfflineStatus> {
    try {
      if (navigator.storage && navigator.storage.persist) {
        const isPersisted = await navigator.storage.persisted();
        if (!isPersisted) {
          const granted = await navigator.storage.persist();
          return {
            isPersistent: granted,
            isAvailable: true,
            message: granted 
              ? 'Armazenamento persistente concedido.' 
              : 'Armazenamento offline disponível, sujeito à limpeza do navegador.'
          };
        }
        return {
          isPersistent: true,
          isAvailable: true,
          message: 'Armazenamento persistente já estava concedido.'
        };
      }
      return {
        isPersistent: false,
        isAvailable: true, // Cache API may still work
        message: 'Armazenamento offline disponível, mas o navegador pode limpar os dados.'
      };
    } catch (e) {
      console.error('Failed to request persistent storage', e);
      return {
        isPersistent: false,
        isAvailable: false,
        message: 'Não foi possível verificar ou solicitar armazenamento offline.'
      };
    }
  }

  /**
   * Saves a file to the offline cache.
   * Assumes the file is already uploaded to Supabase and we have the path.
   */
  static async makeAvailableOffline(filePath: string): Promise<boolean> {
    try {
      // 1. Download file from private bucket using signed URL or download()
      // Since download() returns a Blob directly, we'll use that for the Cache API
      const { data, error } = await supabase.storage.from('trip-documents').download(filePath);
      
      if (error || !data) {
        console.error('Error downloading file for offline use:', error);
        return false;
      }

      // 2. Open Cache API and store the Blob
      const cache = await caches.open(CACHE_NAME);
      
      // We store it against a virtual URL that we can intercept or fetch from later
      const cacheUrl = `/offline-docs/${filePath}`;
      
      // Convert Blob to Response
      const response = new Response(data, {
        headers: {
          'Content-Type': data.type,
          'Content-Length': data.size.toString(),
          'X-Offline-Date': new Date().toISOString()
        }
      });
      
      await cache.put(cacheUrl, response);
      return true;
    } catch (e) {
      console.error('Exception in makeAvailableOffline:', e);
      return false;
    }
  }

  /**
   * Removes a file from the offline cache.
   */
  static async removeOfflineCopy(filePath: string): Promise<boolean> {
    try {
      const cache = await caches.open(CACHE_NAME);
      const cacheUrl = `/offline-docs/${filePath}`;
      return await cache.delete(cacheUrl);
    } catch (e) {
      console.error('Exception in removeOfflineCopy:', e);
      return false;
    }
  }

  /**
   * Checks if a file is currently available offline.
   */
  static async isAvailableOffline(filePath: string): Promise<boolean> {
    try {
      const cache = await caches.open(CACHE_NAME);
      const cacheUrl = `/offline-docs/${filePath}`;
      const response = await cache.match(cacheUrl);
      return !!response;
    } catch (e) {
      return false;
    }
  }

  /**
   * Retrieves the Blob from cache if it exists, otherwise falls back to downloading it.
   */
  static async getDocumentBlob(filePath: string): Promise<Blob | null> {
    try {
      const cache = await caches.open(CACHE_NAME);
      const cacheUrl = `/offline-docs/${filePath}`;
      const response = await cache.match(cacheUrl);
      
      if (response) {
        return await response.blob();
      }

      // Fallback to network
      if (navigator.onLine) {
         const { data } = await supabase.storage.from('trip-documents').download(filePath);
         return data;
      }
      return null;
    } catch (e) {
      console.error('Exception in getDocumentBlob:', e);
      return null;
    }
  }
}
