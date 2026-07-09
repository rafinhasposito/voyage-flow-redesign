export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      experiences: {
        Row: {
          id: string
          destination_id: string
          partner_id: string | null
          title: string
          description: string
          short_description: string
          category: string
          base_cost: number
          duration_minutes: number
          location_lat: number | null
          location_lng: number | null
          address: string | null
          neighborhood: string | null
          booking_url: string | null
          energy_level: string | null
          indoor_outdoor: string | null
          weather_suitability: string | null
          media_urls: string[]
          status: string
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['experiences']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['experiences']['Insert']>
      }
      destinations: {
        Row: {
          id: string
          name: string
          country: string
          timezone: string
          currency: string
          cover_image_url: string | null
          is_active: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['destinations']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['destinations']['Insert']>
      }
      tags: {
        Row: {
          id: string
          name: string
          category: string | null
          is_active: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['tags']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['tags']['Insert']>
      }
      personas: {
        Row: {
          id: string
          name: string
          description: string | null
          is_active: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['personas']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['personas']['Insert']>
      }
      engine_configs: {
        Row: {
          id: string
          weights: Json
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['engine_configs']['Row'], 'id' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['engine_configs']['Insert']>
      }
      experience_tags: {
        Row: {
          experience_id: string
          tag_id: string
        }
        Insert: Database['public']['Tables']['experience_tags']['Row']
        Update: Database['public']['Tables']['experience_tags']['Row']
      }
      experience_personas: {
        Row: {
          experience_id: string
          persona_id: string
        }
        Insert: Database['public']['Tables']['experience_personas']['Row']
        Update: Database['public']['Tables']['experience_personas']['Row']
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
