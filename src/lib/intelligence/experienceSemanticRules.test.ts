import { describe, it, expect } from 'vitest';
import { buildExperienceSemanticProfile } from './experienceSemanticRules';

describe('EI-2: Perfil Semântico Determinístico', () => {
  it('A. Aladdin (Musical Broadway Familiar)', () => {
    const profile = buildExperienceSemanticProfile({
      title: "Aladdin The Musical",
      description: "A spectacular broadway show for the whole family with magic and fantasy",
      type: "attractions"
    });
    // Formato mais específico deve ser musical, não show genérico
    expect(profile.experience_format.value).toBe("musical");
    expect(profile.experience_format.evidences).toContain("Contém evidência explícita de musical");
    expect(profile.experience_format.evidences).toContain("Associado ao circuito Broadway");
    expect(profile.themes.value).toContain("broadway");
    expect(profile.themes.value).toContain("fantasy");
    expect(profile.themes.value).toContain("family");
    expect(profile.themes.value).toContain("entertainment");
    expect(profile.themes.value).toContain("mainstream");
    expect(profile.environment_type.value).toBe("indoor");
    expect(profile.family_orientation.value).toBe("family_friendly");
    expect(profile.experience_format.confidence).toBe("high");
    // semantic_tags é projeção das dimensões, deve conter os valores estruturados
    expect(profile.semantic_tags).toContain("musical");
    expect(profile.semantic_tags).toContain("broadway");
    expect(profile.semantic_tags).toContain("fantasy");
    expect(profile.semantic_tags).toContain("family");
    expect(profile.semantic_tags).toContain("entertainment");
    expect(profile.semantic_tags).toContain("mainstream");
    expect(profile.semantic_tags).toContain("indoor");
  });

  it('B. O Rei Leão', () => {
    const profile = buildExperienceSemanticProfile({
      title: "O Rei Leão",
      description: "Um musical inesquecível da Broadway",
    });
    expect(profile.experience_format.value).toBe("musical");
    expect(profile.themes.value).toContain("broadway");
    expect(profile.themes.value).toContain("family");
    expect(profile.themes.value).toContain("mainstream");
    expect(profile.environment_type.value).toBe("indoor");
  });

  it('C. Musical adulto (Chicago)', () => {
    const profile = buildExperienceSemanticProfile({
      title: "Chicago",
      description: "Musical focado no público adulto com cenas fortes",
    });
    expect(profile.experience_format.value).toBe("musical");
    expect(profile.themes.value).toContain("entertainment");
    expect(profile.family_orientation.value).toBe("adult_oriented");
    expect(profile.environment_type.value).toBe("indoor");
    expect(profile.nightlife.value).not.toBe(true);
  });

  it('C2. Show genérico (concerto sem palavra musical)', () => {
    const profile = buildExperienceSemanticProfile({
      title: "Concerto de Primavera",
      description: "Uma apresentação especial no teatro, com performance ao vivo",
      category: "broadway"
    });
    // Tem broadway mas não tem a palavra "musical" — deve ser show genérico
    expect(profile.experience_format.value).toBe("show");
    expect(profile.experience_format.value).not.toBe("musical");
  });

  it('D. Nightclub', () => {
    const profile = buildExperienceSemanticProfile({
      title: "Omnia",
      description: "The best nightclub in town with top DJs and dance parties",
    });
    expect(profile.nightlife.value).toBe(true);
    expect(profile.energy_level.value).toBe("intense");
    expect(profile.noise_level.value).toBe("high");
    expect(profile.crowd_level.value).toBe("high");
    expect(profile.family_orientation.value).toBe("adult_oriented");
  });

  it('E. Rooftop para almoço', () => {
    const profile = buildExperienceSemanticProfile({
      title: "Sky Rooftop",
      type: "restaurant",
      description: "Almoço com vista incrível",
    });
    expect(profile.experience_format.value).toBe("dining");
    expect(profile.nightlife.value).toBe(false); // Não é nightlife só por ser rooftop
    expect(profile.energy_level.value).toBe("calm");
    expect(profile.nightlife.evidences.length).toBeGreaterThan(0);
  });

  it('F. Restaurante romântico', () => {
    const profile = buildExperienceSemanticProfile({
      title: "La Cabaña",
      type: "restaurant",
      tags: ["romance"],
      description: "Jantar super romântico à luz de velas",
    });
    expect(profile.experience_format.value).toBe("dining");
    expect(profile.themes.value).toContain("romance");
    expect(profile.energy_level.value).toBe("calm");
  });

  it('G. Street food', () => {
    const profile = buildExperienceSemanticProfile({
      title: "Khao San Road Street Food",
      description: "Comida de rua autêntica",
    });
    expect(profile.experience_format.value).toBe("dining");
    expect(profile.themes.value).toContain("local");
    expect(profile.themes.value).toContain("gastronomy");
  });

  it('H. Museu de arte', () => {
    const profile = buildExperienceSemanticProfile({
      title: "Louvre",
      type: "museum",
      description: "O maior museu de arte do mundo",
    });
    expect(profile.experience_format.value).toBe("museum");
    expect(profile.themes.value).toContain("art");
    expect(profile.themes.value).toContain("culture");
    expect(profile.environment_type.value).toBe("indoor");
    expect(profile.cultural_profile.value).toBe("strong");
  });

  it('I. Parque infantil', () => {
    const profile = buildExperienceSemanticProfile({
      title: "Central Park Kids Zone",
      tags: ["parque", "infantil"],
      description: "Diversão para a criançada ao ar livre",
    });
    expect(profile.experience_format.value).toBe("park");
    expect(profile.environment_type.value).toBe("outdoor");
    expect(profile.themes.value).toContain("family");
    expect(profile.family_orientation.value).toBe("child_focused");
  });

  it('J. Spa terapêutico', () => {
    const profile = buildExperienceSemanticProfile({
      title: "Zen Massage",
      description: "Spa e massagem para relaxamento total",
    });
    expect(profile.experience_format.value).toBe("wellness");
    expect(profile.themes.value).toContain("relaxation");
    expect(profile.energy_level.value).toBe("calm");
    expect(profile.noise_level.value).toBe("low");
    expect(profile.family_orientation.value).not.toBe("adult_oriented"); // Não presumir adult only
  });
});

describe('EI-2: Casos Negativos', () => {
  it('semantic_tags de Aladdin não contém duplicatas (mainstream aparece uma vez)', () => {
    const profile = buildExperienceSemanticProfile({
      title: "Aladdin The Musical",
      description: "A spectacular broadway show for the whole family with magic and fantasy",
    });
    const mainstreams = profile.semantic_tags.filter(t => t === "mainstream");
    expect(mainstreams.length).toBe(1);
    // Sem nenhuma duplicata em nenhum campo
    const unique = new Set(profile.semantic_tags);
    expect(unique.size).toBe(profile.semantic_tags.length);
  });

  it('rooftop restaurant não vira nightlife', () => {
    const profile = buildExperienceSemanticProfile({ title: "Rooftop Restaurant" });
    expect(profile.nightlife.value).not.toBe(true);
  });
  
  it('musical adulto não vira adult_only (adult only requirement)', () => {
    const profile = buildExperienceSemanticProfile({ title: "Musical Adulto", description: "adultos" });
    // It becomes adult_oriented but it's not a boolean restriction.
    expect(profile.family_orientation.value).toBe("adult_oriented");
  });

  it('spa não vira adult_oriented automaticamente', () => {
    const profile = buildExperienceSemanticProfile({ title: "Spa Resort" });
    expect(profile.family_orientation.value).not.toBe("adult_oriented");
  });

  it('parque infantil não exige criança', () => {
    const profile = buildExperienceSemanticProfile({ title: "Parque Infantil" });
    expect(profile.family_orientation.value).toBe("child_focused");
  });

  it('Must See não altera perfil semântico e não gera luxury', () => {
    const profile1 = buildExperienceSemanticProfile({ title: "Café", is_must_see: true, base_cost: 5000 });
    const profile2 = buildExperienceSemanticProfile({ title: "Café", is_must_see: false, base_cost: 10 });
    expect(profile1.themes.value).not.toContain("luxury");
    expect(profile1.experience_format.value).toEqual(profile2.experience_format.value);
  });

  it('rating/reviews e poucas avaliações não criam hidden_gem sozinhas', () => {
    const profile = buildExperienceSemanticProfile({ title: "Lugar legal", reviews_count: 2 });
    expect(profile.themes.value).not.toContain("hidden_gem");
  });

  it('null permanece desconhecido e texto parcial não lança erro', () => {
    const profile = buildExperienceSemanticProfile({});
    expect(profile.experience_format.confidence).toBe("none");
    expect(profile.experience_format.value).toBe("unknown");
  });
});
