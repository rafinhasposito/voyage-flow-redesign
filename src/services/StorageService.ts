import { supabase } from "@/lib/supabase";

export class StorageService {
  /**
   * Uploads a file to a specific bucket and returns its public URL
   */
  public static async uploadMedia(bucket: string, file: File): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(fileName, file, { upsert: false });

    if (uploadError) throw uploadError;

    const { data: publicUrlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);
      
    return publicUrlData.publicUrl;
  }
}
