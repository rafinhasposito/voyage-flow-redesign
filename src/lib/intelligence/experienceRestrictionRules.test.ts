import { describe, it, expect } from 'vitest';
import { buildExperienceRestrictionsProfile } from './experienceRestrictionRules';

describe('EI-5: Restrições Factuais', () => {
  it('Nightclub 21+: verificação completa com confidence high', () => {
    const q = buildExperienceRestrictionsProfile({
      min_age: 21,
      adult_only: true,
      restriction_source: "official_website",
      verified_at: "2024-01-01T00:00:00Z",
      verified_by: "editor_1",
    });

    expect(q.min_age.value).toBe(21);
    expect(q.min_age.confidence).toBe("high");
    expect(q.min_age.source).toBe("rule");
    expect(q.adult_only.value).toBe(true);
    expect(q.adult_only.confidence).toBe("high");
    expect(q.issues).toHaveLength(0);
    expect(q.verification.source).toBe("official_website");
  });

  it('Nightclub 21+: sem fonte fica com confidence low e null fields com none', () => {
    const q = buildExperienceRestrictionsProfile({
      min_age: 21,
      adult_only: true,
    });

    expect(q.min_age.value).toBe(21);
    expect(q.min_age.confidence).toBe("low"); // Valor presente, fonte ausente
    expect(q.family_with_children_allowed.value).toBeNull();
    expect(q.family_with_children_allowed.confidence).toBe("none");
  });

  it('Spa: sem política etária confirmada não presume restrição', () => {
    const q = buildExperienceRestrictionsProfile({
      min_age: null,
      adult_only: null,
    });

    expect(q.min_age.value).toBeNull();
    expect(q.min_age.confidence).toBe("none");
    expect(q.adult_only.value).toBeNull();
    expect(q.adult_only.confidence).toBe("none");
  });

  it('Atividade para duas pessoas: minimum_group_size e requires_companion', () => {
    const q = buildExperienceRestrictionsProfile({
      minimum_group_size: 2,
      requires_companion: true,
      restriction_source: "venue_policy",
    });

    expect(q.minimum_group_size.value).toBe(2);
    expect(q.minimum_group_size.confidence).toBe("medium"); // Tem fonte, mas não verificado
    expect(q.requires_companion.value).toBe(true);
    expect(q.issues).toHaveLength(0);
  });

  it('Museu acessível: wheelchair true', () => {
    const q = buildExperienceRestrictionsProfile({
      wheelchair_accessible: true,
      restriction_source: "official_website",
      verified_at: "2024-01-01",
      verified_by: "admin",
    });

    expect(q.wheelchair_accessible.value).toBe(true);
    expect(q.wheelchair_accessible.confidence).toBe("high");
  });

  it('Experiência sem dados: todas as restrições null e nenhuma inventada', () => {
    const q = buildExperienceRestrictionsProfile({});

    expect(q.min_age.value).toBeNull();
    expect(q.adult_only.value).toBeNull();
    expect(q.family_with_children_allowed.value).toBeNull();
    expect(q.wheelchair_accessible.value).toBeNull();
    expect(q.min_age.confidence).toBe("none");
    expect(q.issues).toHaveLength(0);
  });

  it('Inconsistência: adult_only true e family_with_children_allowed true gera erro', () => {
    const q = buildExperienceRestrictionsProfile({
      adult_only: true,
      family_with_children_allowed: true,
    });

    expect(q.adult_only.value).toBe(true);
    expect(q.family_with_children_allowed.value).toBe(true);
    expect(q.issues).toContainEqual(expect.objectContaining({
      code: "CONTRADICTORY_FAMILY_POLICY"
    }));
  });

  it('Inconsistência: min_age < 0', () => {
    const q = buildExperienceRestrictionsProfile({
      min_age: -5,
    });
    expect(q.issues).toContainEqual(expect.objectContaining({ code: "INVALID_MIN_AGE" }));
  });

  it('Inconsistência: minimum_group_size < 1', () => {
    const q = buildExperienceRestrictionsProfile({
      minimum_group_size: 0,
    });
    expect(q.issues).toContainEqual(expect.objectContaining({ code: "INVALID_MIN_GROUP_SIZE" }));
  });

  it('Inconsistência: max_group < min_group', () => {
    const q = buildExperienceRestrictionsProfile({
      minimum_group_size: 4,
      maximum_group_size: 2,
    });
    expect(q.issues).toContainEqual(expect.objectContaining({ code: "MAX_GROUP_BELOW_MINIMUM", severity: "error" }));
    expect(q.issues.find(i => i.code === "MAX_GROUP_BELOW_MINIMUM")?.affected_fields).toEqual(["minimum_group_size", "maximum_group_size"]);
  });

  it('Inconsistência: requires_companion false com min_group > 1', () => {
    const q = buildExperienceRestrictionsProfile({
      requires_companion: false,
      minimum_group_size: 2,
    });
    expect(q.issues).toContainEqual(expect.objectContaining({ code: "CONTRADICTORY_COMPANION_POLICY" }));
  });

  it('Inconsistência: verified_at preenchido sem verified_by', () => {
    const q = buildExperienceRestrictionsProfile({
      verified_at: "2024-01-01",
    });
    expect(q.issues).toContainEqual(expect.objectContaining({ code: "MISSING_VERIFIER" }));
  });

  it('Inconsistência: verified_by preenchido sem verified_at', () => {
    const q = buildExperienceRestrictionsProfile({
      verified_by: "editor_1",
    });
    expect(q.issues).toContainEqual(expect.objectContaining({ code: "MISSING_VERIFICATION_DATE" }));
  });

  it('IA sugerida não recebe confidence high, fica medium mesmo com verified', () => {
    const q = buildExperienceRestrictionsProfile({
      wheelchair_accessible: true,
      restriction_source: "ai_suggestion",
      verified_at: "2024-01-01",
      verified_by: "system",
    });

    expect(q.wheelchair_accessible.confidence).toBe("medium");
  });

  it('Import não recebe confidence high, fica medium mesmo com verified', () => {
    const q = buildExperienceRestrictionsProfile({
      wheelchair_accessible: true,
      restriction_source: "import",
      verified_at: "2024-01-01",
      verified_by: "system",
    });

    expect(q.wheelchair_accessible.confidence).toBe("medium");
  });

  it('False é valor válido e preservado', () => {
    const q = buildExperienceRestrictionsProfile({
      wheelchair_accessible: false,
      stairs_required: false,
    });

    expect(q.wheelchair_accessible.value).toBe(false);
    expect(q.wheelchair_accessible.confidence).toBe("low");
    expect(q.stairs_required.value).toBe(false);
  });

  it('Proveniência: ausência não herda high de outra restrição confirmada', () => {
    const q = buildExperienceRestrictionsProfile({
      min_age: 18, // Informado
      restriction_source: "official_website",
      verified_at: "2024-01-01",
      verified_by: "editor",
    });

    // min_age herda high
    expect(q.min_age.confidence).toBe("high");
    expect(q.min_age.value).toBe(18);
    expect(q.min_age.evidences.length).toBeGreaterThan(0);

    // wheelchair_accessible não herda, pois é null
    expect(q.wheelchair_accessible.confidence).toBe("none");
    expect(q.wheelchair_accessible.value).toBeNull();

    // Todas as dimensões têm sua própria proveniência
    const dims = [q.min_age, q.adult_only, q.family_with_children_allowed, q.wheelchair_accessible];
    for (const d of dims) {
      expect(d.source).toBe("rule");
      expect(d.manual_override).toBe(false);
    }
  });
});
