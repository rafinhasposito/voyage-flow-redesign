import { 
  ExperienceIntelligenceMetadata, 
  ExperiencePersonas, 
  ExperienceCompanionship, 
  ExperienceScoreDimension 
} from './types';
import { normalizeIntelligenceValue } from './utils';

// Tipagem aproximada do modelo legado
export interface LegacyIntelligenceMetadata {
  personaWeights?: Record<string, number | null>;
  companionshipCompatibility?: Record<string, number | null>;
  manualOverride?: boolean;
  source?: string;
}

function adaptLegacyDimension(
  value: number | null | undefined, 
  manualOverride: boolean = false
): ExperienceScoreDimension {
  const normalizedValue = normalizeIntelligenceValue(value);
  
  return {
    value: normalizedValue,
    confidence: normalizedValue === null ? "none" : "low",
    evidences: [],
    source: "import",
    manual_override: manualOverride
  };
}

export function adaptLegacyMetadata(
  legacy: LegacyIntelligenceMetadata | null | undefined
): ExperienceIntelligenceMetadata {
  const manualOverride = legacy?.manualOverride || false;
  
  const p = legacy?.personaWeights || {};
  const c = legacy?.companionshipCompatibility || {};

  return {
    schema_version: "experience-intelligence-v1",
    rules_version: "affinity-v2",
    calculated_at: new Date().toISOString(),
    
    personas: {
      explorador_visual: adaptLegacyDimension(p.explorador_visual, manualOverride),
      curador_experiencias: adaptLegacyDimension(p.curador_experiencias, manualOverride),
      aproveitador: adaptLegacyDimension(p.aproveitador, manualOverride),
      descobridor: adaptLegacyDimension(p.descobridor, manualOverride),
      slow_traveler: adaptLegacyDimension(p.slow_traveler, manualOverride),
    },
    companionship: {
      solo: adaptLegacyDimension(c.solo, manualOverride),
      couple: adaptLegacyDimension(c.couple, manualOverride),
      friends: adaptLegacyDimension(c.friends, manualOverride), // Legado pode ou não ter friends
      family: adaptLegacyDimension(c.family, manualOverride),
    }
  };
}
