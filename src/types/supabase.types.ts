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
      admin_users: {
        Row: {
          created_at: string
          created_by: string | null
          is_active: boolean
          notes: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          is_active?: boolean
          notes?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          is_active?: boolean
          notes?: string | null
          user_id?: string
        }
        Relationships: []
      }
      destinations: {
        Row: {
          country: string
          country_code: string | null
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
          country_code?: string | null
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
          country_code?: string | null
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
          accessibility_notes: string | null
          address: string | null
          adult_only: boolean | null
          base_cost: number
          booking_deadline_hours: number | null
          booking_time_mode: string | null
          booking_url: string | null
          buffer_after_minutes: number | null
          buffer_before_minutes: number | null
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
          family_with_children_allowed: boolean | null
          id: string
          ideal_companion: string[] | null
          ideal_duration_minutes: number | null
          indoor_outdoor: string | null
          intelligence_metadata: Json | null
          is_must_see: boolean | null
          location_lat: number | null
          location_lng: number | null
          max_duration_minutes: number | null
          maximum_group_size: number | null
          meal_periods: string[] | null
          media_urls: string[] | null
          min_age: number | null
          min_duration_minutes: number | null
          minimum_group_size: number | null
          neighborhood: string | null
          partner_id: string | null
          personas: string[] | null
          rating: number | null
          requires_companion: boolean | null
          reservation_required: boolean | null
          restrictions_provenance: Json | null
          reviews_count: number | null
          short_description: string
          source_url: string | null
          stairs_required: boolean | null
          status: Database["public"]["Enums"]["experience_status"] | null
          tags: string[] | null
          title: string
          type: string | null
          typical_queue_minutes: number | null
          updated_at: string | null
          verified_at: string | null
          video_embed_url: string | null
          weather_suitability: string | null
          wheelchair_accessible: boolean | null
        }
        Insert: {
          accessibility_notes?: string | null
          address?: string | null
          adult_only?: boolean | null
          base_cost: number
          booking_deadline_hours?: number | null
          booking_time_mode?: string | null
          booking_url?: string | null
          buffer_after_minutes?: number | null
          buffer_before_minutes?: number | null
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
          family_with_children_allowed?: boolean | null
          id?: string
          ideal_companion?: string[] | null
          ideal_duration_minutes?: number | null
          indoor_outdoor?: string | null
          intelligence_metadata?: Json | null
          is_must_see?: boolean | null
          location_lat?: number | null
          location_lng?: number | null
          max_duration_minutes?: number | null
          maximum_group_size?: number | null
          meal_periods?: string[] | null
          media_urls?: string[] | null
          min_age?: number | null
          min_duration_minutes?: number | null
          minimum_group_size?: number | null
          neighborhood?: string | null
          partner_id?: string | null
          personas?: string[] | null
          rating?: number | null
          requires_companion?: boolean | null
          reservation_required?: boolean | null
          restrictions_provenance?: Json | null
          reviews_count?: number | null
          short_description: string
          source_url?: string | null
          stairs_required?: boolean | null
          status?: Database["public"]["Enums"]["experience_status"] | null
          tags?: string[] | null
          title: string
          type?: string | null
          typical_queue_minutes?: number | null
          updated_at?: string | null
          verified_at?: string | null
          video_embed_url?: string | null
          weather_suitability?: string | null
          wheelchair_accessible?: boolean | null
        }
        Update: {
          accessibility_notes?: string | null
          address?: string | null
          adult_only?: boolean | null
          base_cost?: number
          booking_deadline_hours?: number | null
          booking_time_mode?: string | null
          booking_url?: string | null
          buffer_after_minutes?: number | null
          buffer_before_minutes?: number | null
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
          family_with_children_allowed?: boolean | null
          id?: string
          ideal_companion?: string[] | null
          ideal_duration_minutes?: number | null
          indoor_outdoor?: string | null
          intelligence_metadata?: Json | null
          is_must_see?: boolean | null
          location_lat?: number | null
          location_lng?: number | null
          max_duration_minutes?: number | null
          maximum_group_size?: number | null
          meal_periods?: string[] | null
          media_urls?: string[] | null
          min_age?: number | null
          min_duration_minutes?: number | null
          minimum_group_size?: number | null
          neighborhood?: string | null
          partner_id?: string | null
          personas?: string[] | null
          rating?: number | null
          requires_companion?: boolean | null
          reservation_required?: boolean | null
          restrictions_provenance?: Json | null
          reviews_count?: number | null
          short_description?: string
          source_url?: string | null
          stairs_required?: boolean | null
          status?: Database["public"]["Enums"]["experience_status"] | null
          tags?: string[] | null
          title?: string
          type?: string | null
          typical_queue_minutes?: number | null
          updated_at?: string | null
          verified_at?: string | null
          video_embed_url?: string | null
          weather_suitability?: string | null
          wheelchair_accessible?: boolean | null
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
      operating_hour_exceptions: {
        Row: {
          closes_at: string | null
          created_at: string
          end_date: string
          experience_id: string
          id: string
          is_24_hours: boolean
          last_entry_at: string | null
          opens_at: string | null
          period_type: string
          reason: string | null
          sort_order: number
          source_url: string | null
          spans_next_day: boolean
          start_date: string
          status: string
          updated_at: string
          verified_at: string | null
        }
        Insert: {
          closes_at?: string | null
          created_at?: string
          end_date: string
          experience_id: string
          id?: string
          is_24_hours?: boolean
          last_entry_at?: string | null
          opens_at?: string | null
          period_type?: string
          reason?: string | null
          sort_order?: number
          source_url?: string | null
          spans_next_day?: boolean
          start_date: string
          status: string
          updated_at?: string
          verified_at?: string | null
        }
        Update: {
          closes_at?: string | null
          created_at?: string
          end_date?: string
          experience_id?: string
          id?: string
          is_24_hours?: boolean
          last_entry_at?: string | null
          opens_at?: string | null
          period_type?: string
          reason?: string | null
          sort_order?: number
          source_url?: string | null
          spans_next_day?: boolean
          start_date?: string
          status?: string
          updated_at?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "operating_hour_exceptions_experience_id_fkey"
            columns: ["experience_id"]
            isOneToOne: false
            referencedRelation: "experiences"
            referencedColumns: ["id"]
          },
        ]
      }
      operating_hours: {
        Row: {
          closes_at: string | null
          created_at: string
          day_of_week: number
          experience_id: string
          id: string
          is_24_hours: boolean
          is_closed: boolean
          last_entry_at: string | null
          opens_at: string | null
          period_type: string
          sort_order: number
          source_url: string | null
          spans_next_day: boolean
          updated_at: string
          valid_from: string | null
          valid_to: string | null
          verified_at: string | null
        }
        Insert: {
          closes_at?: string | null
          created_at?: string
          day_of_week: number
          experience_id: string
          id?: string
          is_24_hours?: boolean
          is_closed?: boolean
          last_entry_at?: string | null
          opens_at?: string | null
          period_type: string
          sort_order?: number
          source_url?: string | null
          spans_next_day?: boolean
          updated_at?: string
          valid_from?: string | null
          valid_to?: string | null
          verified_at?: string | null
        }
        Update: {
          closes_at?: string | null
          created_at?: string
          day_of_week?: number
          experience_id?: string
          id?: string
          is_24_hours?: boolean
          is_closed?: boolean
          last_entry_at?: string | null
          opens_at?: string | null
          period_type?: string
          sort_order?: number
          source_url?: string | null
          spans_next_day?: boolean
          updated_at?: string
          valid_from?: string | null
          valid_to?: string | null
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "operating_hours_experience_id_fkey"
            columns: ["experience_id"]
            isOneToOne: false
            referencedRelation: "experiences"
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
      transit_options: {
        Row: {
          accessibility: string[] | null
          booking_required: boolean
          booking_url: string | null
          created_at: string
          currency: string | null
          description: string | null
          destination_experience_id: string | null
          destination_id: string
          destination_zone: string | null
          duration_avg_minutes: number | null
          duration_max_minutes: number | null
          duration_min_minutes: number | null
          frequency_minutes: number | null
          id: string
          instructions: string | null
          luggage_suitability: string | null
          modality: string
          operation_notes: string | null
          origin_experience_id: string | null
          origin_zone: string | null
          price_max: number | null
          price_min: number | null
          source_url: string | null
          status: string
          title: string
          transfers_required: number
          updated_at: string
          verified_at: string | null
        }
        Insert: {
          accessibility?: string[] | null
          booking_required?: boolean
          booking_url?: string | null
          created_at?: string
          currency?: string | null
          description?: string | null
          destination_experience_id?: string | null
          destination_id: string
          destination_zone?: string | null
          duration_avg_minutes?: number | null
          duration_max_minutes?: number | null
          duration_min_minutes?: number | null
          frequency_minutes?: number | null
          id?: string
          instructions?: string | null
          luggage_suitability?: string | null
          modality: string
          operation_notes?: string | null
          origin_experience_id?: string | null
          origin_zone?: string | null
          price_max?: number | null
          price_min?: number | null
          source_url?: string | null
          status?: string
          title: string
          transfers_required?: number
          updated_at?: string
          verified_at?: string | null
        }
        Update: {
          accessibility?: string[] | null
          booking_required?: boolean
          booking_url?: string | null
          created_at?: string
          currency?: string | null
          description?: string | null
          destination_experience_id?: string | null
          destination_id?: string
          destination_zone?: string | null
          duration_avg_minutes?: number | null
          duration_max_minutes?: number | null
          duration_min_minutes?: number | null
          frequency_minutes?: number | null
          id?: string
          instructions?: string | null
          luggage_suitability?: string | null
          modality?: string
          operation_notes?: string | null
          origin_experience_id?: string | null
          origin_zone?: string | null
          price_max?: number | null
          price_min?: number | null
          source_url?: string | null
          status?: string
          title?: string
          transfers_required?: number
          updated_at?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transit_options_destination_experience_id_fkey"
            columns: ["destination_experience_id"]
            isOneToOne: false
            referencedRelation: "experiences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transit_options_destination_id_fkey"
            columns: ["destination_id"]
            isOneToOne: false
            referencedRelation: "destinations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transit_options_origin_experience_id_fkey"
            columns: ["origin_experience_id"]
            isOneToOne: false
            referencedRelation: "experiences"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: { Args: never; Returns: boolean }
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
