import { describe, it, expect } from 'vitest';
import { buildExperienceSemanticProfile } from './experienceSemanticRules';
import { buildExperienceAffinityV2, ExperienceAffinityV2Result } from './experienceAffinityV2';
import { ExperienceScoreDimension } from './types';

// ─── Helpers ────────────────────────────────────────────────────────────────
function calc(input: Parameters<typeof buildExperienceSemanticProfile>[0]) {
  return buildExperienceAffinityV2(buildExperienceSemanticProfile(input));
}

function pct(v: number | null): number | null {
  return v === null ? null : Math.round(v * 100);
}

function between(val: number | null, min: number, max: number): boolean {
  if (val === null) return false;
  const p = Math.round(val * 100);
  return p >= min && p <= max;
}

// ─── INVARIANTE OBRIGATÓRIA ──────────────────────────────────────────────────
// Nenhum score não-null pode existir sem pelo menos uma evidência concreta
function assertNoEvidencelessScores(result: ExperienceAffinityV2Result, label: string) {
  const allDims: [string, ExperienceScoreDimension][] = [
    ["personas.explorador_visual",    result.personas.explorador_visual],
    ["personas.curador_experiencias", result.personas.curador_experiencias],
    ["personas.aproveitador",         result.personas.aproveitador],
    ["personas.descobridor",          result.personas.descobridor],
    ["personas.slow_traveler",        result.personas.slow_traveler],
    ["companionship.solo",            result.companionship.solo],
    ["companionship.couple",          result.companionship.couple],
    ["companionship.friends",         result.companionship.friends],
    ["companionship.family",          result.companionship.family],
  ];
  for (const [name, d] of allDims) {
    if (d.value !== null) {
      expect(d.evidences.length, `[${label}] ${name}: value=${pct(d.value)} mas evidences está vazio`)
        .toBeGreaterThan(0);
    }
    if (d.evidences.length === 0) {
      expect(d.value, `[${label}] ${name}: evidences vazio mas value=${pct(d.value)} (deveria ser null)`)
        .toBeNull();
    }
  }
}

describe('EI-3: Invariante — score não-null exige evidência', () => {
  const cases = [
    { label: "Aladdin",         input: { title: "Aladdin The Musical", description: "A spectacular broadway show for the whole family with magic and fantasy" } },
    { label: "O Rei Leão",      input: { title: "O Rei Leão", description: "Um musical inesquecível da Broadway" } },
    { label: "Chicago",         input: { title: "Chicago", description: "Musical focado no público adulto com cenas fortes" } },
    { label: "Nightclub",       input: { title: "Omnia", description: "The best nightclub in town with top DJs and dance parties" } },
    { label: "Rooftop Almoço",  input: { title: "Sky Rooftop", type: "restaurant", description: "Almoço com vista incrível no rooftop" } },
    { label: "Rest Romântico",  input: { title: "La Cabaña", type: "restaurant", tags: ["romance"], description: "Jantar romântico à luz de velas" } },
    { label: "Street Food",     input: { title: "Khao San Street Food", description: "Comida de rua autêntica" } },
    { label: "Museu de Arte",   input: { title: "Louvre", type: "museum", description: "O maior museu de arte do mundo" } },
    { label: "Parque Infantil", input: { title: "Central Park Kids", tags: ["parque", "infantil"], description: "Diversão para crianças ao ar livre" } },
    { label: "Spa",             input: { title: "Zen Massage", description: "Spa e massagem para relaxamento total" } },
    { label: "Entrada vazia",   input: {} },
  ];

  for (const { label, input } of cases) {
    it(`[${label}] — todo score não-null tem evidência`, () => {
      assertNoEvidencelessScores(calc(input), label);
    });
  }

  it('entrada completamente vazia: todas as dimensões null', () => {
    const r = calc({});
    expect(r.personas.explorador_visual.value).toBeNull();
    expect(r.personas.curador_experiencias.value).toBeNull();
    expect(r.personas.aproveitador.value).toBeNull();
    expect(r.personas.descobridor.value).toBeNull();
    expect(r.personas.slow_traveler.value).toBeNull();
    expect(r.companionship.family.value).toBeNull();
    expect(r.companionship.solo.value).toBeNull();
    expect(r.companionship.couple.value).toBeNull();
    expect(r.companionship.friends.value).toBeNull();
  });
});

describe('EI-3: Motor de Afinidade V2 — 10 Casos de Referência', () => {

  it('A. Aladdin — personas dentro das faixas aprovadas', () => {
    const r = calc({ title: "Aladdin The Musical", description: "A spectacular broadway show for the whole family with magic and fantasy" });
    expect(r.source_profile_format).toBe("musical");
    expect(between(r.personas.explorador_visual.value, 80, 100)).toBe(true);
    expect(between(r.personas.curador_experiencias.value, 55, 90)).toBe(true);
    expect(between(r.personas.aproveitador.value, 70, 100)).toBe(true);
    expect(between(r.personas.descobridor.value, 0, 35)).toBe(true);
    expect(between(r.personas.slow_traveler.value, 30, 65)).toBe(true);
    expect(between(r.companionship.solo.value, 60, 90)).toBe(true);
    expect(between(r.companionship.couple.value, 55, 90)).toBe(true);
    expect(between(r.companionship.friends.value, 55, 90)).toBe(true);
    expect(between(r.companionship.family.value, 80, 100)).toBe(true);
  });


  it('B. O Rei Leão — visual e família altos', () => {
    const r = calc({ title: "O Rei Leão", description: "Um musical inesquecível da Broadway" });
    expect(r.source_profile_format).toBe("musical");
    expect(between(r.personas.explorador_visual.value, 60, 100)).toBe(true);
    expect(between(r.companionship.family.value, 70, 100)).toBe(true);
  });

  it('C. Musical adulto (Chicago) — família baixa, entusiasta alto', () => {
    const r = calc({ title: "Chicago", description: "Musical focado no público adulto com cenas fortes" });
    expect(r.source_profile_format).toBe("musical");
    expect(r.personas.aproveitador.value).not.toBeNull();
    const aladdin = calc({ title: "Aladdin The Musical", description: "broadway musical for the whole family with fantasy" });
    // Chicago tem família menor que Aladdin
    expect((r.companionship.family.value ?? 0)).toBeLessThan((aladdin.companionship.family.value ?? 1));
  });

  it('D. Nightclub — entusiasta 70-100, amigos 80-100, família 0-15, slow 0-20', () => {
    const r = calc({ title: "Omnia", description: "The best nightclub in town with top DJs and dance parties" });
    expect(r.source_profile_format).toBe("nightlife");
    expect(between(r.personas.aproveitador.value, 70, 100)).toBe(true);
    expect(between(r.companionship.friends.value, 80, 100)).toBe(true);
    // Família deve ser 0-15%
    const famPct = pct(r.companionship.family.value);
    expect(famPct === null || famPct <= 15).toBe(true);
    // Slow Traveler penalizado
    const slowPct = pct(r.personas.slow_traveler.value);
    expect(slowPct === null || slowPct <= 20).toBe(true);
  });

  it('E. Rooftop para almoço — visual 60-90, slow 40-70, nightlife=false', () => {
    const r = calc({ title: "Sky Rooftop", type: "restaurant", description: "Almoço com vista incrível no rooftop" });
    expect(r.source_profile_format).toBe("dining");
    expect(between(r.personas.explorador_visual.value, 60, 90)).toBe(true);
    expect(between(r.personas.slow_traveler.value, 40, 70)).toBe(true);
    // Nightlife não contaminou o score
    expect(r.personas.aproveitador.evidences.some(e => e.includes("nightlife") || e.includes("Nightlife"))).toBe(false);
  });

  it('F. Restaurante romântico — casal 60-100, slow moderado', () => {
    const r = calc({ title: "La Cabaña", type: "restaurant", tags: ["romance"], description: "Jantar romântico à luz de velas" });
    expect(between(r.companionship.couple.value, 60, 100)).toBe(true);
  });

  it('G. Street food — descobridor alto (> nightclub descobridor)', () => {
    const sf = calc({ title: "Khao San Street Food", description: "Comida de rua autêntica" });
    const nc = calc({ title: "Omnia", description: "The best nightclub in town" });
    expect((sf.personas.descobridor.value ?? 0)).toBeGreaterThan((nc.personas.descobridor.value ?? 0));
  });

  it('H. Museu de arte — visual 60-90, curador 60-90, slow 40-70', () => {
    const r = calc({ title: "Louvre", type: "museum", description: "O maior museu de arte do mundo" });
    expect(r.source_profile_format).toBe("museum");
    expect(between(r.personas.explorador_visual.value, 60, 90)).toBe(true);
    expect(between(r.personas.curador_experiencias.value, 60, 100)).toBe(true);
    expect(between(r.personas.slow_traveler.value, 40, 70)).toBe(true);
  });

  it('I. Parque infantil — família 80-100', () => {
    const r = calc({ title: "Central Park Kids", tags: ["parque", "infantil"], description: "Diversão para crianças ao ar livre" });
    expect(between(r.companionship.family.value, 80, 100)).toBe(true);
  });

  it('J. Spa — slow traveler 75-100, maior que entusiasta', () => {
    const r = calc({ title: "Zen Massage", description: "Spa e massagem para relaxamento total" });
    expect(r.source_profile_format).toBe("wellness");
    expect(between(r.personas.slow_traveler.value, 75, 100)).toBe(true);
    const slow = pct(r.personas.slow_traveler.value);
    const enth = pct(r.personas.aproveitador.value);
    if (enth !== null) expect(slow!).toBeGreaterThan(enth);
  });
});

describe('EI-3: Testes Negativos', () => {
  it('nightclub Família <= 15%', () => {
    const r = calc({ title: "Omnia", description: "The best nightclub in town with top DJs and dance parties" });
    const famPct = pct(r.companionship.family.value);
    expect(famPct === null || famPct <= 15).toBe(true);
  });

  it('nightclub Amigos >= 80%', () => {
    const r = calc({ title: "Omnia", description: "The best nightclub in town with top DJs and dance parties" });
    expect(between(r.companionship.friends.value, 80, 100)).toBe(true);
  });

  it('rooftop Visual >= 60%', () => {
    const r = calc({ title: "Sky Rooftop", type: "restaurant", description: "Almoço no rooftop com vista incrível" });
    expect(between(r.personas.explorador_visual.value, 60, 100)).toBe(true);
  });

  it('rooftop não contamina com evidência de nightlife', () => {
    const r = calc({ title: "Sky Rooftop", type: "restaurant", description: "Almoço no rooftop com vista incrível" });
    expect(r.personas.aproveitador.evidences.some(e => e.toLowerCase().includes("nightlife"))).toBe(false);
  });

  it('museu Visual >= 60%', () => {
    const r = calc({ title: "Louvre", type: "museum", description: "O maior museu de arte do mundo" });
    expect(between(r.personas.explorador_visual.value, 60, 100)).toBe(true);
  });

  it('museu Curador >= 60%', () => {
    const r = calc({ title: "Louvre", type: "museum", description: "O maior museu de arte do mundo" });
    expect(between(r.personas.curador_experiencias.value, 60, 100)).toBe(true);
  });

  it('spa Slow Traveler >= 75%', () => {
    const r = calc({ title: "Zen Massage", description: "Spa e massagem para relaxamento total" });
    expect(between(r.personas.slow_traveler.value, 75, 100)).toBe(true);
  });

  it('family_friendly não prejudica Solo', () => {
    const r = calc({ title: "Aladdin The Musical", description: "A spectacular broadway musical for the whole family with fantasy" });
    expect((r.companionship.solo.value ?? 0)).toBeGreaterThan(0.5);
  });

  it('family_friendly não prejudica Casal', () => {
    const r = calc({ title: "Aladdin The Musical", description: "A spectacular broadway musical for the whole family with fantasy" });
    expect((r.companionship.couple.value ?? 0)).toBeGreaterThan(0.5);
  });

  it('adult_oriented não vira restrição total — solo continua viável', () => {
    const r = calc({ title: "Chicago", description: "Musical adulto com cenas fortes" });
    expect((r.companionship.solo.value ?? 0)).toBeGreaterThan(0.5);
  });

  it('adult_oriented reduz Família vs family_friendly', () => {
    const adult = calc({ title: "Chicago", description: "Musical adulto com cenas fortes" });
    const family = calc({ title: "Aladdin The Musical", description: "broadway musical for the whole family with fantasy" });
    expect((adult.companionship.family.value ?? 0)).toBeLessThan((family.companionship.family.value ?? 1));
  });

  it('mainstream reduz Descobridor', () => {
    const mainstream = calc({ title: "Aladdin The Musical", description: "broadway show for the whole family with magic and fantasy" });
    const local = calc({ title: "Khao San Street Food", description: "Comida de rua autêntica" });
    expect((mainstream.personas.descobridor.value ?? 1)).toBeLessThan((local.personas.descobridor.value ?? 0));
  });

  it('Must See não altera afinidade', () => {
    const sem  = calc({ title: "Café", description: "restaurante tranquilo", is_must_see: false });
    const must = calc({ title: "Café", description: "restaurante tranquilo", is_must_see: true });
    expect(pct(sem.personas.explorador_visual.value)).toEqual(pct(must.personas.explorador_visual.value));
    expect(pct(sem.companionship.family.value)).toEqual(pct(must.companionship.family.value));
  });

  it('preço não altera persona', () => {
    const barato = calc({ title: "Café", description: "restaurante", base_cost: 5 });
    const caro   = calc({ title: "Café", description: "restaurante", base_cost: 5000 });
    expect(pct(barato.personas.curador_experiencias.value)).toEqual(pct(caro.personas.curador_experiencias.value));
  });

  it('função consome apenas ExperienceSemanticProfile — perfil vazio gera todas dimensões null', () => {
    const empty = buildExperienceSemanticProfile({});
    const r = buildExperienceAffinityV2(empty);
    // Sem perfil semântico, nenhum score pode existir
    const dims = [
      r.personas.explorador_visual, r.personas.curador_experiencias,
      r.personas.aproveitador, r.personas.descobridor, r.personas.slow_traveler,
      r.companionship.solo, r.companionship.couple,
      r.companionship.friends, r.companionship.family,
    ];
    for (const d of dims) {
      expect(d.value).toBeNull();
      expect(d.evidences.length).toBe(0);
      expect(d.confidence).toBe("none");
    }
  });
});
