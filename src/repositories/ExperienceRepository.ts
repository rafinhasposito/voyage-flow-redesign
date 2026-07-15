import { supabase } from "@/lib/supabase";
import { Database } from "@/types/supabase.types";
import { CacheManager } from "../services/CacheManager";
import { TravelExperience } from "@/utils/travelState";
import { FALLBACK_ATTRACTIONS } from "@/data/fallbackData";
import { parseExperienceMetadataValue } from "@/domain/experienceMetadata";

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
        
        if (error) {
          console.error("[Repository] Supabase returned error:", error);
          if (import.meta.env.VITE_DEMO_MODE === "true") {
            console.warn("[Repository] Using Local Fallback data due to Demo Mode.");
            return FALLBACK_ATTRACTIONS;
          }
          throw error;
        }

        if (!data || data.length === 0) {
          console.warn("[Repository] Supabase returned empty catalog.");
          if (import.meta.env.VITE_DEMO_MODE === "true") {
            console.warn("[Repository] Using Local Fallback data due to Demo Mode.");
            return FALLBACK_ATTRACTIONS;
          }
          return [];
        }
        
        // Map Supabase rows to the UI's TravelExperience type
        return data.map(row => this.mapRowToModel(row));
      },
      (cachedData) => {
        // Cache exists, nothing to do on the callback for now
      },
      (freshData) => {
        // Data updated successfully
        if (import.meta.env.DEV) {
          console.log("[Repository] Catalog synced with Supabase!");
        }
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
      
    if (error) {
      console.error("[Repository] Force refresh failed:", error);
      if (import.meta.env.VITE_DEMO_MODE === "true") {
        console.warn("[Repository] Using Local Fallback data due to Demo Mode.");
        CacheManager.set(CACHE_KEY, FALLBACK_ATTRACTIONS, { version: CACHE_VERSION, ttlMs: TTL_MS });
        return FALLBACK_ATTRACTIONS;
      }
      throw error;
    }

    if (!data || data.length === 0) {
      console.warn("[Repository] Force refresh returned empty catalog.");
      if (import.meta.env.VITE_DEMO_MODE === "true") {
        console.warn("[Repository] Using Local Fallback data due to Demo Mode.");
        CacheManager.set(CACHE_KEY, FALLBACK_ATTRACTIONS, { version: CACHE_VERSION, ttlMs: TTL_MS });
        return FALLBACK_ATTRACTIONS;
      }
      CacheManager.set(CACHE_KEY, [], { version: CACHE_VERSION, ttlMs: TTL_MS });
      return [];
    }
    
    const mapped = data.map(row => this.mapRowToModel(row));
    CacheManager.set(CACHE_KEY, mapped, { version: CACHE_VERSION, ttlMs: TTL_MS });
    return mapped;
  }

  /**
   * Returns experiences for a specific destination ID
   */
  public static async getByDestination(destinationId: string): Promise<TravelExperience[]> {
    const all = await this.getAll();
    return all; 
  }

  /**
   * Maps a DB Row to the UI Model
   */
  private static mapRowToModel(row: ExperienceRow): TravelExperience {
    const aiResult = parseExperienceMetadataValue(row.intelligence_metadata);
    const ai = (aiResult.data || {}) as Record<string, unknown>;

    const normalizeScale = (value: number | undefined | null): number | null => {
      if (value === undefined || value === null) return null;
      if (value >= 0 && value <= 1) return value;
      // Compatibilidade temporária: se > 1 e <= 100, divide por 100
      if (value > 1 && value <= 100) return value / 100;
      return null;
    };

    const normalizeWeights = (weights: Record<string, unknown> | undefined) => {
      if (!weights) return undefined;
      return {
        explorador_visual: normalizeScale(weights.explorador_visual as number | undefined),
        curador_experiencias: normalizeScale(weights.curador_experiencias as number | undefined),
        descobridor: normalizeScale(weights.descobridor as number | undefined),
        aproveitador: normalizeScale(weights.aproveitador as number | undefined),
        slow_traveler: normalizeScale(weights.slow_traveler as number | undefined),
      };
    };

    const normalizeComp = (comp: Record<string, unknown> | undefined) => {
      if (!comp) return undefined;
      return {
        solo: normalizeScale(comp.solo as number | undefined),
        couple: normalizeScale(comp.couple as number | undefined),
        family: normalizeScale(comp.family as number | undefined),
        friends: normalizeScale(comp.friends as number | undefined),
      };
    };

    const imageUrl = (row.media_urls && row.media_urls.length > 0) ? row.media_urls[0] : "";

    return {
      id: row.id,
      name: row.title,
      category: (row.category as "culture" | "food" | "views" | "nature" | "shopping" | "classic" | "nightlife" | "hidden_gem") || "Atração", 
      categoryLabel: row.category || "Atração",
      description: row.description || "",
      emotionalDescription: row.description || "",
      image: imageUrl, 
      images: row.media_urls || [],
      costLevel: this.mapCostLevel(row.base_cost ?? 0),
      costUSD: row.base_cost ?? 0,
      neighborhood: row.neighborhood || "Centro",
      coordinates: (row.location_lat != null && row.location_lng != null) 
                   ? { lat: row.location_lat, lng: row.location_lng } 
                   : undefined,
      matchScore: 0,
      durationHours: (row.duration_minutes ?? 120) / 60,
      bestTime: "Morning",
      is_must_see: row.is_must_see ?? false,
      reservationRequired: row.reservation_required ?? false,
      dressCode: (row.dress_code as "casual" | "smart_casual" | "elegant" | "formal") || "casual",
      exclusivityLevel: (row.exclusivity_level as "accessible" | "premium" | "exclusive" | "invite_only") || "accessible",
      physicalEnergyRequired: (row.energy_level as "low" | "medium" | "high") || "medium",
      isIndoor: row.indoor_outdoor === "indoor",
      tags: row.tags || [],
      media_urls: row.media_urls || [],
      affiliateLink: this.buildAffiliateLink(row.booking_url),
      rating: row.rating ?? undefined,
      reviews_count: row.reviews_count ?? undefined,
      type: row.type || row.category,
      climate: row.climate ?? undefined,
      ideal_companion: row.ideal_companion ?? undefined,
      
      personaWeights: (row.intelligence_metadata != null && ai.personaWeights) ? normalizeWeights(ai.personaWeights) : undefined,
      companionshipCompatibility: (row.intelligence_metadata != null && ai.companionshipCompatibility) ? normalizeComp(ai.companionshipCompatibility) : undefined,
      recommendedSeasons: (row.intelligence_metadata != null) ? ai.recommendedSeasons as ("winter" | "spring" | "summer" | "autumn" | "all")[] : undefined,
      weatherCompatibility: (row.intelligence_metadata != null) ? ai.weatherCompatibility as ("rain" | "snow" | "heat" | "all")[] : undefined,
    } as TravelExperience;
  }

  /**
   * Automatically injects the GetYourGuide partner ID into the booking URL
   */
  private static buildAffiliateLink(url: string | null | undefined): string | undefined {
    if (!url) return undefined;
    
    try {
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

  public static invalidateCache(): void {
    CacheManager.invalidate(CACHE_KEY, CACHE_VERSION);
  }

  public static async search(query: string): Promise<TravelExperience[]> {
    const { data, error } = await supabase
      .from("experiences")
      .select("*")
      .eq("status", "published")
      .ilike("title", `%${query}%`);
      
    if (error) throw error;
    return data.map(row => this.mapRowToModel(row));
  }

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
    return this.mapRowToModel(data);
  }

  public static async create(payload: Database["public"]["Tables"]["experiences"]["Insert"]): Promise<void> {
    if ('id' in payload) {
      delete payload.id;
    }
    const { error } = await supabase.from('experiences').insert([payload]);
    if (error) throw error;
    this.invalidateCache();
  }

  public static async update(id: string, payload: Partial<Database["public"]["Tables"]["experiences"]["Insert"]>): Promise<void> {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!id || !uuidRegex.test(id)) {
      throw new Error('Não foi possível identificar a experiência para edição.');
    }
    const { error } = await supabase.from('experiences').update(payload).eq('id', id);
    if (error) throw error;
    this.invalidateCache();
  }

  public static async delete(id: string): Promise<void> {
    const { error } = await supabase.from('experiences').delete().eq('id', id);
    if (error) throw error;
    this.invalidateCache();
  }
}
