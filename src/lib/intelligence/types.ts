export type ConfidenceLevel = "high" | "medium" | "low" | "none";
export type SourceOrigin = "rule" | "human" | "import" | "ai_suggestion";

export interface ExperienceScoreDimension {
  value: number | null; // 0-1 range internally, null if unknown
  confidence: ConfidenceLevel;
  evidences: string[];
  source: SourceOrigin;
  manual_override: boolean;
}

export interface ExperiencePersonas {
  explorador_visual: ExperienceScoreDimension;
  curador_experiencias: ExperienceScoreDimension;
  aproveitador: ExperienceScoreDimension; // Exibido como "Entusiasta" na UI
  descobridor: ExperienceScoreDimension;
  slow_traveler: ExperienceScoreDimension;
}

export interface ExperienceCompanionship {
  solo: ExperienceScoreDimension;
  couple: ExperienceScoreDimension;
  friends: ExperienceScoreDimension;
  family: ExperienceScoreDimension;
}

export interface ExperienceRestrictions {
  min_age?: number;
  adult_only?: boolean;
  family_with_children_allowed?: boolean;
  minimum_group_size?: number;
  maximum_group_size?: number;
  requires_companion?: boolean;
  wheelchair_accessible?: boolean;
  restriction_source?: string;
  restriction_confidence?: ConfidenceLevel;
  verified_at?: string;
  verified_by?: string;
}

export interface ExperienceSemanticProfile {
  semantic_tags?: string[];
  nightlife?: boolean;
  noise_level?: "low" | "medium" | "high";
  energy_level?: "calm" | "moderate" | "intense";
  alcohol_focused?: boolean;
  crowd_level?: "low" | "medium" | "high";
  environment_type?: "indoor" | "outdoor" | "mixed";
  walking_intensity?: "low" | "medium" | "high";
  wheelchair_accessible?: boolean;
}

export interface ExperienceIntelligenceMetadata {
  schema_version: "experience-intelligence-v1";
  rules_version: "affinity-v2";
  calculated_at?: string;
  
  personas: ExperiencePersonas;
  companionship: ExperienceCompanionship;
  
  // Contrato neutro - não processados/inferidos automaticamente nesta fase
  experience_profile?: ExperienceSemanticProfile;
  restrictions?: ExperienceRestrictions;
}

// User Preference Profile (Não acoplado à experiência)
export interface UserPreferenceProfile {
  nightlife_preference?: "love" | "accept" | "avoid";
  noise_tolerance?: "high" | "medium" | "low";
  alcohol_environment_preference?: "avoid" | "accept" | "love";
  energy_preference?: "high_energy" | "slow_travel" | "balanced";
  mobility_needs?: string[];
  walking_tolerance?: "low" | "medium" | "high";
}


export interface ExperienceIntelligenceInput {
  category?: string;
  type?: string;
  description?: string;
  short_description?: string;
  tags?: string[];
  exclusivity_level?: string;
  is_must_see?: boolean;
  base_cost?: number;
  duration_minutes?: number;
  neighborhood?: string;
  reviews_count?: number;
  reservation_required?: boolean;
  media_urls?: string[];
  dress_code?: string;
  title?: string;
  status?: string;
}
