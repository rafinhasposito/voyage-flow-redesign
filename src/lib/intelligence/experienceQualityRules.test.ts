import { describe, it, expect } from 'vitest';
import { buildExperienceQualityProfile } from './experienceQualityRules';

describe('EI-4: Regras de Qualidade e Prioridade', () => {
  it('Aladdin: rating 4.8, muitos reviews, Must See, premium_positioning moderate', () => {
    const q = buildExperienceQualityProfile({
      rating: 4.8,
      reviews_count: 12000,
      is_must_see: true,
      exclusivity_level: "moderate",
    });

    expect(q.quality_score.value).toBe(0.96); // 4.8 / 5
    expect(q.quality_score.evidences).toContain("Avaliação informada: 4.8 de 5");

    expect(q.review_confidence.value).toBe("high");
    expect(q.review_confidence.evidences).toContain("Baseada em 12000 avaliações");

    expect(q.editorial_priority.value).toBe("high");
    expect(q.editorial_priority.evidences).toContain("Marcada editorialmente como Must See");

    expect(q.premium_positioning.value).toBe("moderate");
  });

  it('Nightclub VIP: qualidade alta, premium exclusive, Must See false', () => {
    const q = buildExperienceQualityProfile({
      rating: 4.5,
      reviews_count: 1500,
      is_must_see: false,
      exclusivity_level: "VIP",
      dress_code: "Elegante",
    });

    expect(q.quality_score.value).toBe(0.9);
    expect(q.review_confidence.value).toBe("high");
    expect(q.editorial_priority.value).toBe("none"); // false = none
    expect(q.premium_positioning.value).toBe("exclusive");
    expect(q.premium_positioning.evidences).toContain("Nível de exclusividade informado: VIP");
    expect(q.premium_positioning.evidences).toContain("Dress code formal/elegante reforça o posicionamento");
  });

  it('Restaurante 4.9 com 3 reviews: quality alto mas confidence low', () => {
    const q = buildExperienceQualityProfile({
      rating: 4.9,
      reviews_count: 3,
    });

    expect(q.quality_score.value).toBe(0.98);
    expect(q.review_confidence.value).toBe("low");
  });

  it('Museu 4.7 com 20 mil reviews: quality alto e confidence high', () => {
    const q = buildExperienceQualityProfile({
      rating: 4.7,
      reviews_count: 20000,
    });

    expect(q.quality_score.value).toBe(0.94);
    expect(q.review_confidence.value).toBe("high");
  });

  it('Experiência sem rating: quality null, confidence none', () => {
    const q = buildExperienceQualityProfile({});

    expect(q.quality_score.value).toBe(null);
    expect(q.review_confidence.value).toBe("none");
  });

  it('Must See sem rating: priority high, quality null', () => {
    const q = buildExperienceQualityProfile({
      is_must_see: true,
    });

    expect(q.quality_score.value).toBe(null);
    expect(q.editorial_priority.value).toBe("high");
  });

  it('Base cost (não passado) não deve interferir no teste, mas reserva obrigatória vira requisito', () => {
    const q = buildExperienceQualityProfile({
      reservation_required: true,
      exclusivity_level: "accessible",
    });

    expect(q.planning_requirements.reservation_required.value).toBe(true);
    expect(q.planning_requirements.reservation_required.confidence).toBe("high");
    expect(q.premium_positioning.value).toBe("accessible");
    // Reserva obrigatória não cria premium
    expect(q.premium_positioning.value).not.toBe("high");
    expect(q.quality_score.value).toBeNull();
  });

  it('Dress code sozinho não cria premium', () => {
    const q = buildExperienceQualityProfile({
      dress_code: "Formal",
    });

    // Se exclusivity não foi passado, premium é none, mesmo com dress code
    expect(q.premium_positioning.value).toBe("none");
    expect(q.planning_requirements.dress_code.value).toBe("Formal");
    expect(q.planning_requirements.dress_code.confidence).toBe("high");
  });

  it('Reservation required e dress code ausentes retornam null com confidence none', () => {
    const q = buildExperienceQualityProfile({});
    expect(q.planning_requirements.reservation_required.value).toBeNull();
    expect(q.planning_requirements.reservation_required.confidence).toBe("none");
    expect(q.planning_requirements.dress_code.value).toBeNull();
    expect(q.planning_requirements.dress_code.confidence).toBe("none");
  });

  it('Todo resultado não-null possui evidências (exceto data_completeness que sempre tem)', () => {
    const q = buildExperienceQualityProfile({ rating: 3, reviews_count: 15, is_must_see: true, exclusivity_level: "high", reservation_required: true });

    expect(q.quality_score.evidences.length).toBeGreaterThan(0);
    expect(q.review_confidence.evidences.length).toBeGreaterThan(0);
    expect(q.editorial_priority.evidences.length).toBeGreaterThan(0);
    expect(q.premium_positioning.evidences.length).toBeGreaterThan(0);
    expect(q.planning_requirements.reservation_required.evidences.length).toBeGreaterThan(0);
  });

  it('Data completeness: 6/6 = 1', () => {
    const q = buildExperienceQualityProfile({
      rating: 5, reviews_count: 10, is_must_see: true, exclusivity_level: "VIP", reservation_required: false, dress_code: "Casual"
    });
    expect(q.data_completeness.value).toBe(1);
    expect(q.data_completeness.evidences).toContain("6 de 6 campos de qualidade preenchidos");
  });

  it('Data completeness: false conta como preenchido, zero conta como preenchido, vazia não conta', () => {
    const q = buildExperienceQualityProfile({
      rating: 0, reviews_count: 0, is_must_see: false, reservation_required: false, dress_code: "  "
    });
    // Preenchidos: rating (0), reviews_count (0), is_must_see (false), reservation_required (false) = 4
    // Não preenchidos: exclusivity_level (undefined), dress_code ("  " só espaços) = 2
    // Total = 4/6 = 0.6667
    expect(q.data_completeness.value).toBe(0.6667);
    expect(q.data_completeness.evidences).toContain("4 de 6 campos de qualidade preenchidos");
  });

  it('Todas as dimensões automáticas possuem source rule e manual_override false', () => {
    const q = buildExperienceQualityProfile({ rating: 5, reviews_count: 10, dress_code: "smart" });
    const keys = ["quality_score", "review_confidence", "editorial_priority", "premium_positioning", "data_completeness"] as const;
    for (const key of keys) {
      expect(q[key].source).toBe("rule");
      expect(q[key].manual_override).toBe(false);
    }
    expect(q.planning_requirements.reservation_required.source).toBe("rule");
    expect(q.planning_requirements.reservation_required.manual_override).toBe(false);
    expect(q.planning_requirements.dress_code.source).toBe("rule");
    expect(q.planning_requirements.dress_code.manual_override).toBe(false);
  });
});
