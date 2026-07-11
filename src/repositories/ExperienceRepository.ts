import { supabase } from "@/lib/supabase";
import { Database } from "@/types/supabase.types";
import { CacheManager } from "../services/CacheManager";
import { TravelExperience } from "@/utils/travelState";
import { FALLBACK_ATTRACTIONS } from "@/data/fallbackData";

export type ExperienceRow = Database["public"]["Tables"]["experiences"]["Row"];

const CACHE_KEY = "experiences";
const CACHE_VERSION = 1;
const TTL_MS = 24 * 60 * 60 * 1000; 

export class ExperienceRepository {
  /**
   * Called once at App startup. 
   * Triggers background sync but does not block the UI.
   */
  public static initialize(): void {
    if (import.meta.env.DEV) {
      console.log("[Repository] Initializing ExperienceRepository...");
    }
    
    // Fire and forget - background sync
    this.sync().catch(e => {
      console.error("[Repository] Background sync failed, relying on cache/fallback", e);
    });
  }

  /**
   * Stale-While-Revalidate sync logic.
   */
  private static async sync(): Promise<void> {
    await CacheManager.swr<TravelExperience[]>(
      CACHE_KEY,
      async () => {
        const { data, error } = await supabase
          .from("experiences")
          .select("*")
          .eq("status", "published");
        
        if (error || !data || data.length === 0) {
          console.warn("[Repository] Supabase returned empty/error. Using Local Fallback data. Error:", error);
          return FALLBACK_ATTRACTIONS;
        }
        
        // Map Supabase rows to the UI's TravelExperience type
        return (data as any[]).map(row => this.mapRowToModel(row));
      },
      (cachedData) => {
        // Cache exists, nothing to do on the callback for now
        // We could emit an event if we wanted to trigger a re-render
      },
      (freshData) => {
        // Data updated successfully
        if (import.meta.env.DEV) {
          console.log("[Repository] Catalog synced with Supabase!");
        }
        // In a more complex app, we'd dispatch a global state update here.
        // For now, next time a component calls getAll(), it gets the fresh data.
      },
      { version: CACHE_VERSION, ttlMs: TTL_MS }
    );
  }

  /**
   * Returns all experiences. 
   * 1. Tries Cache.
   * 2. If no cache, fetches from Supabase.
   */
  public static async getAll(): Promise<TravelExperience[]> {
    const cached = CacheManager.get<TravelExperience[]>(CACHE_KEY, CACHE_VERSION);
    
    // 1. Return cache if available (SWR ensures it will be updated in background by initialize())
    if (cached && cached.length > 0) {
      return cached;
    }

    if (import.meta.env.DEV) {
      console.log("[Repository] Cache empty. Fetching directly from Supabase to guarantee fresh data...");
    }
    
    return this.forceRefresh();
  }

  public static async forceRefresh(): Promise<TravelExperience[]> {
    if (import.meta.env.DEV) {
      console.log("[Repository] Forcing sync from network...");
    }
    const { data, error } = await supabase
      .from("experiences")
      .select("*")
      .eq("status", "published");
      
    if (error || !data || data.length === 0) {
      console.warn("[Repository] Force refresh failed or returned empty. Using local fallback.");
      CacheManager.set(CACHE_KEY, FALLBACK_ATTRACTIONS, { version: CACHE_VERSION, ttlMs: TTL_MS });
      return FALLBACK_ATTRACTIONS;
    }
    
    const mapped = (data as any[]).map(row => this.mapRowToModel(row));
    CacheManager.set(CACHE_KEY, mapped, { version: CACHE_VERSION, ttlMs: TTL_MS });
    return mapped;
  }

  /**
   * Returns experiences for a specific destination ID
   */
  public static async getByDestination(destinationId: string): Promise<TravelExperience[]> {
    const all = await this.getAll();
    // Assuming mock/cache might not have destination_id mapped yet in the old type,
    // but in a real scenario we'd filter by it. For now, since MVP has 1 destination, return all.
    return all; 
  }

  /**
   * Maps a DB Row to the UI Model
   */
  private static mapRowToModel(row: ExperienceRow): TravelExperience {
    let ai = {};
    try { ai = JSON.parse(row.short_description || "{}"); } catch(ex) {}

    return {
      id: row.id,
      name: row.title,
      category: row.category || "Atração", 
      categoryLabel: row.category || "Atração",
      description: row.description || "",
      emotionalDescription: row.description || "",
      image: row.media_urls?.[0] || "", 
      images: row.media_urls || [],
      costLevel: this.mapCostLevel(row.base_cost ?? 0),
      costUSD: row.base_cost ?? 0,
      neighborhood: row.neighborhood || "Centro",
      coordinates: row.location_lat && row.location_lng ? { lat: row.location_lat, lng: row.location_lng } : undefined,
      matchScore: 0,
      durationHours: (row.duration_minutes ?? 120) / 60,
      bestTime: "Morning",
      is_must_see: false,
      reservationRequired: false,
      dressCode: "casual",
      exclusivityLevel: (ai as any).exclusivityLevel || "accessible",
      physicalEnergyRequired: row.energy_level || "medium",
      isIndoor: row.indoor_outdoor === "indoor",
      tags: (ai as any).tags || [],
      media_urls: row.media_urls || [],
      affiliateLink: this.buildAffiliateLink(row.booking_url),
      rating: undefined,
      type: row.category
    } as any;
  }

  /**
   * Automatically injects the GetYourGuide partner ID into the booking URL
   */
  private static buildAffiliateLink(url: string | null | undefined): string | undefined {
    if (!url) return undefined;
    
    try {
      // If it's a GetYourGuide URL, inject the partner ID
      if (url.includes("getyourguide.com")) {
        const urlObj = new URL(url);
        const partnerId = import.meta.env.VITE_GYG_PARTNER_ID;
        if (partnerId) {
          urlObj.searchParams.set("partner_id", partnerId);
        }
        return urlObj.toString();
      }
      return url;
    } catch (e) {
      // If URL parsing fails, return original string safely
      return url;
    }
  }

  private static mapCostLevel(cost: number): "$" | "$$" | "$$$" | "$$$$" {
    if (cost < 50) return "$";
    if (cost < 150) return "$$";
    if (cost < 300) return "$$$";
    return "$$$$";
  }

  // --- Admin Methods ---

  /**
   * Invalidates the cache so the next Consumer request fetches fresh data.
   */
  public static invalidateCache(): void {
    CacheManager.invalidate(CACHE_KEY, CACHE_VERSION);
  }

  /**
   * Fetches all experiences directly from Supabase for the Admin list (bypasses cache).
   */
  public static async search(query: string): Promise<TravelExperience[]> {
    const { data, error } = await supabase
      .from("experiences")
      .select("*")
      .eq("status", "published")
      .ilike("title", `%${query}%`);
      
    if (error) throw error;
    return (data as any[]).map(row => this.mapRowToModel(row));
  }

  /**
   * Fetches a single experience directly from Supabase for editing.
   */
  public static async getById(id: string): Promise<TravelExperience | null> {
    const { data, error } = await supabase
      .from("experiences")
      .select("*")
      .eq("id", id)
      .single();
      
    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }
    return this.mapRowToModel(data as any);
  }

  /**
   * Creates a new experience and invalidates cache.
   */
  public static async create(payload: Database["public"]["Tables"]["experiences"]["Insert"]): Promise<void> {
    const { error } = await supabase.from('experiences').insert([payload as any]);
    if (error) throw error;
    this.invalidateCache();
  }

  /**
   * Updates an existing experience and invalidates cache.
   */
  public static async update(id: string, payload: Partial<Database["public"]["Tables"]["experiences"]["Insert"]>): Promise<void> {
    const { error } = await supabase.from('experiences').update(payload as any).eq('id', id);
    if (error) throw error;
    this.invalidateCache();
  }

  /**
   * Deletes an experience and invalidates cache.
   */
  public static async delete(id: string): Promise<void> {
    const { error } = await supabase.from('experiences').delete().eq('id', id);
    if (error) throw error;
    this.invalidateCache();
  }
}
