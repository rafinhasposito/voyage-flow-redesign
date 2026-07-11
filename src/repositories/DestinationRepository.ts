import { supabase } from "@/lib/supabase";
import { Database } from "@/types/supabase.types";
import { CacheManager } from "../services/CacheManager";

export type DestinationRow = Database["public"]["Tables"]["destinations"]["Row"];

const CACHE_KEY = "destinations";
const CACHE_VERSION = 1;
const TTL_MS = 24 * 60 * 60 * 1000; 

export class DestinationRepository {
  public static async sync(onData: (data: DestinationRow[]) => void): Promise<void> {
    await CacheManager.swr<DestinationRow[]>(
      CACHE_KEY,
      async () => {
        const { data, error } = await supabase
          .from("destinations")
          .select("*")
          .eq("is_active", true);
        
        if (error) throw error;
        return data as DestinationRow[];
      },
      onData,
      onData,
      { version: CACHE_VERSION, ttlMs: TTL_MS }
    );
  }

  public static async getAll(): Promise<DestinationRow[]> {
    const { data, error } = await supabase.from("destinations").select("*");
    if (error) throw error;
    return data;
  }

  public static async getById(id: string): Promise<DestinationRow | null> {
    const { data, error } = await supabase.from("destinations").select("*").eq("id", id).single();
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data;
  }
}
