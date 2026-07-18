import { ExperienceIntelligenceInput, ExperienceRestrictionsInput } from "./types";
import { buildExperienceSemanticProfile } from "./experienceSemanticRules";
import { buildExperienceAffinityV2 } from "./experienceAffinityV2";
import { buildExperienceQualityProfile } from "./experienceQualityRules";
import { buildExperienceRestrictionsProfile } from "./experienceRestrictionRules";

export interface ExperienceIntelligenceSnapshot {
  semantic_profile: ReturnType<typeof buildExperienceSemanticProfile>;
  affinity_profile: ReturnType<typeof buildExperienceAffinityV2>;
  quality_profile: ReturnType<typeof buildExperienceQualityProfile>;
  restrictions_profile: ReturnType<typeof buildExperienceRestrictionsProfile>;
  metadata: {
    schema_version: "experience-intelligence-v1";
    rules_version: "affinity-v2";
  };
}

export function buildExperienceIntelligenceSnapshot(
  input: ExperienceIntelligenceInput & ExperienceRestrictionsInput
): ExperienceIntelligenceSnapshot {
  const semantic_profile = buildExperienceSemanticProfile(input);
  const affinity_profile = buildExperienceAffinityV2(semantic_profile);
  const quality_profile = buildExperienceQualityProfile(input);
  const restrictions_profile = buildExperienceRestrictionsProfile(input);

  return {
    semantic_profile,
    affinity_profile,
    quality_profile,
    restrictions_profile,
    metadata: {
      schema_version: "experience-intelligence-v1",
      rules_version: "affinity-v2",
    },
  };
}
