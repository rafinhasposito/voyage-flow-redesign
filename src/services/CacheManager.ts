export interface CachePayload<T> {
  version: number;
  updatedAt: string;
  expiresAt: string;
  data: T;
}

interface CacheConfig {
  ttlMs?: number; // Time to live in milliseconds
  version?: number;
}

const DEFAULT_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

export class CacheManager {
  /**
   * Generates the cache key
   */
  private static getKey(key: string, version: number): string {
    return `cache_${key}_v${version}`;
  }

  /**
   * Logging utility for development
   */
  private static log(action: string, key: string) {
    if (import.meta.env.DEV) {
      console.log(`[Cache] ${action} - ${key}`);
    }
  }

  /**
   * Retrieves data from localStorage if valid
   */
  public static get<T>(key: string, version: number = 1): T | null {
    const fullKey = this.getKey(key, version);
    try {
      const stored = localStorage.getItem(fullKey);
      if (!stored) {
        this.log("MISS", fullKey);
        return null;
      }

      const payload: CachePayload<T> = JSON.parse(stored);
      
      // Allow stale while revalidate: we still return the data even if expired, 
      // but the caller logic (SWR) will trigger a background fetch.
      // If we wanted strict expiration, we would check expiresAt here.
      // For SWR, we just consider it a HIT if it exists.
      
      this.log("HIT", fullKey);
      return payload.data;
    } catch (e) {
      console.error("[Cache] Error reading from localStorage", e);
      return null;
    }
  }

  /**
   * Saves data to localStorage
   */
  public static set<T>(key: string, data: T, config?: CacheConfig): void {
    const version = config?.version || 1;
    const ttl = config?.ttlMs || DEFAULT_TTL_MS;
    const fullKey = this.getKey(key, version);
    
    const now = new Date();
    const expires = new Date(now.getTime() + ttl);

    const payload: CachePayload<T> = {
      version,
      updatedAt: now.toISOString(),
      expiresAt: expires.toISOString(),
      data,
    };

    try {
      localStorage.setItem(fullKey, JSON.stringify(payload));
      this.log("UPDATED", fullKey);
    } catch (e) {
      console.error("[Cache] Error writing to localStorage", e);
    }
  }

  /**
   * Helper function for Stale-While-Revalidate (SWR) pattern.
   * - Returns cache immediately if available via the `onCache` callback.
   * - Then fetches from Supabase via `fetchFn`.
   * - Updates cache and calls `onSuccess` callback.
   * - If offline/fails, relies on cache.
   */
  public static async swr<T>(
    key: string, 
    fetchFn: () => Promise<T>, 
    onCache: (data: T) => void,
    onSuccess: (data: T) => void,
    config?: CacheConfig
  ): Promise<void> {
    const version = config?.version || 1;
    
    // 1. Try Cache First
    const cachedData = this.get<T>(key, version);
    if (cachedData) {
      onCache(cachedData);
    }

    // 2. Fetch in background
    try {
      if (import.meta.env.DEV) {
        console.log(`[Repository] Supabase FETCH - ${key}`);
      }
      const freshData = await fetchFn();
      
      // 3. Update Cache
      this.set(key, freshData, config);
      
      // 4. Update UI
      onSuccess(freshData);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.log(`[Repository] Offline MODE / Fetch Failed - ${key}`, error);
      }
      // If we don't have cache, we must throw or handle the error
      if (!cachedData) {
        throw error;
      }
    }
  }

  /**
   * Invalidates a specific cache key
   */
  public static invalidate(key: string, version: number = 1): void {
    const fullKey = this.getKey(key, version);
    try {
      localStorage.removeItem(fullKey);
      this.log("INVALIDATED", fullKey);
    } catch (e) {
      console.error("[Cache] Error removing from localStorage", e);
    }
  }
}
