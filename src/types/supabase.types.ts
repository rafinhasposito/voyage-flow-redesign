export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      destinations: {
        Row: {
          country: string
          cover_image_url: string | null
          created_at: string | null
          currency: string
          description_short: string | null
          id: string
          is_active: boolean | null
          language: string | null
          location_lat: number | null
          location_lng: number | null
          name: string
          slug: string
          timezone: string
        }
        Insert: {
          country: string
          cover_image_url?: string | null
          created_at?: string | null
          currency: string
          description_short?: string | null
          id?: string
          is_active?: boolean | null
          language?: string | null
          location_lat?: number | null
          location_lng?: number | null
          name: string
          slug: string
          timezone: string
        }
        Update: {
          country?: string
          cover_image_url?: string | null
          created_at?: string | null
          currency?: string
          description_short?: string | null
          id?: string
          is_active?: boolean | null
          language?: string | null
          location_lat?: number | null
          location_lng?: number | null
          name?: string
          slug?: string
          timezone?: string
        }
        Relationships: []
      }
      engine_configs: {
        Row: {
          id: string
          updated_at: string | null
          weights: Json
        }
        Insert: {
          id?: string
          updated_at?: string | null
          weights?: Json
        }
        Update: {
          id?: string
          updated_at?: string | null
          weights?: Json
        }
        Relationships: []
      }
      experience_personas: {
        Row: {
          experience_id: string
          persona_id: string
        }
        Insert: {
          experience_id: string
          persona_id: string
        }
        Update: {
          experience_id?: string
          persona_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "experience_personas_persona_id_fkey"
            columns: ["persona_id"]
            isOneToOne: false
            referencedRelation: "personas"
            referencedColumns: ["id"]
          },
        ]
      }
      experience_tags: {
        Row: {
          experience_id: string
          tag_id: string
        }
        Insert: {
          experience_id: string
          tag_id: string
        }
        Update: {
          experience_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "experience_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      experiences: {
        Row: {
          address: string | null
          base_cost: number
          booking_url: string | null
          category: string
          check_in_time: string | null
          check_out_time: string | null
          climate: string[] | null
          created_at: string | null
          description: string
          destination_id: string
          dress_code: string | null
          duration_minutes: number | null
          energy_level: string | null
          exclusivity_level: string | null
          id: string
          ideal_companion: string[] | null
          indoor_outdoor: string | null
          intelligence_metadata: Json | null
          is_must_see: boolean | null
          location_lat: number | null
          location_lng: number | null
          media_urls: string[] | null
          neighborhood: string | null
          partner_id: string | null
          personas: string[] | null
          rating: number | null
          reservation_required: boolean | null
          reviews_count: number | null
          short_description: string
          status: Database["public"]["Enums"]["experience_status"] | null
          tags: string[] | null
          title: string
          type: string | null
          updated_at: string | null
          video_embed_url: string | null
          weather_suitability: string | null
        }
        Insert: {
          address?: string | null
          base_cost: number
          booking_url?: string | null
          category: string
          check_in_time?: string | null
          check_out_time?: string | null
          climate?: string[] | null
          created_at?: string | null
          description: string
          destination_id: string
          dress_code?: string | null
          duration_minutes?: number | null
          energy_level?: string | null
          exclusivity_level?: string | null
          id?: string
          ideal_companion?: string[] | null
          indoor_outdoor?: string | null
          intelligence_metadata?: Json | null
          is_must_see?: boolean | null
          location_lat?: number | null
          location_lng?: number | null
          media_urls?: string[] | null
          neighborhood?: string | null
          partner_id?: string | null
          personas?: string[] | null
          rating?: number | null
          reservation_required?: boolean | null
          reviews_count?: number | null
          short_description: string
          status?: Database["public"]["Enums"]["experience_status"] | null
          tags?: string[] | null
          title: string
          type?: string | null
          updated_at?: string | null
          video_embed_url?: string | null
          weather_suitability?: string | null
        }
        Update: {
          address?: string | null
          base_cost?: number
          booking_url?: string | null
          category?: string
          check_in_time?: string | null
          check_out_time?: string | null
          climate?: string[] | null
          created_at?: string | null
          description?: string
          destination_id?: string
          dress_code?: string | null
          duration_minutes?: number | null
          energy_level?: string | null
          exclusivity_level?: string | null
          id?: string
          ideal_companion?: string[] | null
          indoor_outdoor?: string | null
          intelligence_metadata?: Json | null
          is_must_see?: boolean | null
          location_lat?: number | null
          location_lng?: number | null
          media_urls?: string[] | null
          neighborhood?: string | null
          partner_id?: string | null
          personas?: string[] | null
          rating?: number | null
          reservation_required?: boolean | null
          reviews_count?: number | null
          short_description?: string
          status?: Database["public"]["Enums"]["experience_status"] | null
          tags?: string[] | null
          title?: string
          type?: string | null
          updated_at?: string | null
          video_embed_url?: string | null
          weather_suitability?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "experiences_destination_id_fkey"
            columns: ["destination_id"]
            isOneToOne: false
            referencedRelation: "destinations"
            referencedColumns: ["id"]
          },
        ]
      }
      personas: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
        }
        Relationships: []
      }
      tags: {
        Row: {
          category: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      experience_status: "draft" | "published" | "archived"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      experience_status: ["draft", "published", "archived"],
    },
  },
} as const
