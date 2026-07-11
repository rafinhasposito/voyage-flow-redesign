import { supabase } from "@/lib/supabase";
import { Database } from "@/types/supabase.types";

export class ExperienceService {
  /**
   * Invokes the AI Edge Function to extract experience metadata from a booking URL
   */
  public static async importFromUrl(url: string): Promise<Partial<Database["public"]["Tables"]["experiences"]["Insert"]>> {
    const { data, error } = await supabase.functions.invoke('import-experience', {
      body: { target_url: url }
    });

    if (error) throw error;
    return data;
  }
}
