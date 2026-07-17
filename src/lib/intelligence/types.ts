export type ConfidenceLevel = "high" | "medium" | "low" | "none";
export type SourceOrigin = "rule" | "human" | "import" | "ai_suggestion";

export interface ExperienceDimension<T> {
  value: T | null;
  confidence: ConfidenceLevel;
  evidences: string[];
  source: SourceOrigin;
  manual_override: boolean;
}

export type ExperienceScoreDimension = ExperienceDimension<number>;

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

export type ExperienceFormat = "attraction" | "show" | "musical" | "museum" | "park" | "tour" | "dining" | "nightlife" | "shopping" | "wellness" | "event" | "hotel" | "transportation" | "other" | "unknown";
export type ExperienceTheme = "broadway" | "fantasy" | "family" | "romance" | "history" | "art" | "culture" | "local" | "iconic" | "mainstream" | "hidden_gem" | "luxury" | "adventure" | "relaxation" | "gastronomy" | "entertainment" | "scenic_view";
export type EnvironmentType = "indoor" | "outdoor" | "mixed" | "unknown";
export type EnergyLevel = "calm" | "moderate" | "intense" | "unknown";
export type NoiseLevel = "low" | "medium" | "high" | "unknown";
export type CrowdLevel = "low" | "medium" | "high" | "unknown";
export type FamilyOrientation = "child_focused" | "family_friendly" | "neutral" | "adult_oriented" | "unknown";
export type CulturalProfile = "none" | "light" | "moderate" | "strong" | "unknown";
export type TourismProfile = "local" | "balanced" | "mainstream" | "iconic" | "unknown";

export interface ExperienceSemanticProfile {
  semantic_tags: string[];
  experience_format: ExperienceDimension<ExperienceFormat>;
  themes: ExperienceDimension<ExperienceTheme[]>;
  environment_type: ExperienceDimension<EnvironmentType>;
  energy_level: ExperienceDimension<EnergyLevel>;
  noise_level: ExperienceDimension<NoiseLevel>;
  crowd_level: ExperienceDimension<CrowdLevel>;
  nightlife: ExperienceDimension<boolean>;
  alcohol_focused: ExperienceDimension<boolean>;
  family_orientation: ExperienceDimension<FamilyOrientation>;
  cultural_profile: ExperienceDimension<CulturalProfile>;
  tourism_profile: ExperienceDimension<TourismProfile>;
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
