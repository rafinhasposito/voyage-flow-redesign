import { describe, it, expect } from 'vitest';
import { buildExperienceIntelligenceSnapshot } from './experienceIntelligenceSnapshot';

describe('EI-6: Intelligence Snapshot Orchestrator', () => {
  it('Deve agregar corretamente as quatro camadas de inteligência', () => {
    const snapshot = buildExperienceIntelligenceSnapshot({
      title: "Aladdin",
      type: "attraction",
      category: "show",
      tags: ["musical", "broadway", "fantasia", "familiar"],
      rating: 4.8,
      reviews_count: 12000,
      is_must_see: true,
      exclusivity_level: "moderate",
      min_age: null,
      adult_only: null,
    });

    // 1. Semantic Profile
    expect(snapshot.semantic_profile.experience_format.value).toBe("musical");

    // 2. Affinity Profile
    // Deve ter processado a partir do perfil semântico
    expect(snapshot.affinity_profile.personas.explorador_visual.value).toBeGreaterThan(0);

    // 3. Quality Profile
    expect(snapshot.quality_profile.quality_score.value).toBe(0.96);
    expect(snapshot.quality_profile.review_confidence.value).toBe("high");

    // 4. Restrictions Profile
    expect(snapshot.restrictions_profile.min_age.value).toBeNull();
    expect(snapshot.restrictions_profile.min_age.confidence).toBe("none");

    // 5. Metadata
    expect(snapshot.metadata.schema_version).toBe("experience-intelligence-v1");
    expect(snapshot.metadata.rules_version).toBe("affinity-v2");
  });
});
