import {
  ExperienceSemanticProfile,
  ExperienceScoreDimension,
  ConfidenceLevel
} from "./types";

export interface ExperienceAffinityV2Result {
  schema_version: "affinity-v2";
  calculated_at: string;
  source_profile_format: string | null;
  personas: {
    explorador_visual: ExperienceScoreDimension;
    curador_experiencias: ExperienceScoreDimension;
    aproveitador: ExperienceScoreDimension; // Exibido como "Entusiasta" na UI
    descobridor: ExperienceScoreDimension;
    slow_traveler: ExperienceScoreDimension;
  };
  companionship: {
    solo: ExperienceScoreDimension;
    couple: ExperienceScoreDimension;
    friends: ExperienceScoreDimension;
    family: ExperienceScoreDimension;
  };
}

// ─── Helpers de leitura do perfil semântico ─────────────────────────────────
function formatIs(p: ExperienceSemanticProfile, ...formats: string[]): boolean {
  return formats.includes(p.experience_format.value ?? "");
}
function hasTheme(p: ExperienceSemanticProfile, ...themes: string[]): boolean {
  return themes.some(t => (p.themes.value ?? []).includes(t));
}
function familyIs(p: ExperienceSemanticProfile, orientation: string): boolean {
  return p.family_orientation.value === orientation;
}
function energyIs(p: ExperienceSemanticProfile, level: string): boolean {
  return p.energy_level.value === level;
}
function noiseIs(p: ExperienceSemanticProfile, level: string): boolean {
  return p.noise_level.value === level;
}
function isNightlife(p: ExperienceSemanticProfile): boolean {
  return p.nightlife.value === true;
}

// ─── Finalização de dimensão ─────────────────────────────────────────────────
// REGRA OBRIGATÓRIA: sem evidência → null, confidence "none"
// com evidência → value calculado (>= 0) e evidences não vazia
function finalize(
  score: number,
  evidences: string[]
): { value: number | null; confidence: ConfidenceLevel; evidences: string[] } {
  if (evidences.length === 0) return { value: null, confidence: "none", evidences: [] };
  const value = Math.max(0, Math.min(1, score));
  const confidence: ConfidenceLevel = value >= 0.5 ? "high" : "medium";
  return { value, confidence, evidences };
}

function dim(
  score: number,
  evidences: string[]
): ExperienceScoreDimension {
  const { value, confidence, evidences: ev } = finalize(score, evidences);
  return { value, confidence, evidences: ev, source: "rule", manual_override: false };
}

// ─── MOTOR PRINCIPAL ─────────────────────────────────────────────────────────
export function buildExperienceAffinityV2(
  profile: ExperienceSemanticProfile
): ExperienceAffinityV2Result {

  // ─── VISUAL ────────────────────────────────────────────────────────────────
  // Principio: a experiência possui apelo visual forte para o Explorador Visual
  // Fonte: themes (broadway, fantasy, art, scenic_view), format (museum, musical)
  // Nenhuma base genérica — zero pontos sem evidência semântica concreta
  let vs = 0;
  const vEv: string[] = [];
  if (hasTheme(profile, "broadway"))    { vs += 0.40; vEv.push("Broadway: cenografia e espetáculo visual de alto impacto"); }
  if (hasTheme(profile, "fantasy"))     { vs += 0.25; vEv.push("Fantasia: cenário visualmente imersivo"); }
  if (hasTheme(profile, "art"))         { vs += 0.35; vEv.push("Arte: apelo visual direto como objeto central"); }
  if (hasTheme(profile, "scenic_view")) { vs += 0.60; vEv.push("Vista cênica (rooftop): impacto visual panorâmico — razão principal da visita"); }
  if (hasTheme(profile, "luxury"))      { vs += 0.15; vEv.push("Luxo: cenário premium visualmente diferenciado"); }
  if (hasTheme(profile, "iconic"))      { vs += 0.15; vEv.push("Ícone: atração altamente fotografável"); }
  if (formatIs(profile, "musical"))     { vs += 0.45; vEv.push("Musical: produção teatral com forte foco em figurino e cenografia"); }
  if (formatIs(profile, "show"))        { vs += 0.25; vEv.push("Show: produção visual de palco"); }
  if (formatIs(profile, "museum"))      { vs += 0.35; vEv.push("Museu: exposição visual como experiência central"); }
  // Bônus de combinação: musical com tema familiar normalmente é uma produção muito elaborada visualmente
  if (formatIs(profile, "musical") && hasTheme(profile, "family")) { vs += 0.05; vEv.push("Musical familiar: produção visual elaborada para amplo público"); }

  // ─── CURADOR ───────────────────────────────────────────────────────────────
  // Principio: a experiência é curada, reconhecida, com identidade artística ou cultural
  // Fonte: cultural_profile, themes (art, culture, broadway), format (musical, museum)
  let cs = 0;
  const cEv: string[] = [];
  const cult = profile.cultural_profile.value;
  if (cult === "strong")                { cs += 0.35; cEv.push("Perfil cultural forte: identidade cultural central"); }
  else if (cult === "moderate")         { cs += 0.20; cEv.push("Perfil cultural moderado"); }
  if (hasTheme(profile, "art"))         { cs += 0.25; cEv.push("Arte: experiência com curadoria artística"); }
  if (hasTheme(profile, "culture"))     { cs += 0.20; cEv.push("Cultura: conteúdo cultural relevante"); }
  if (hasTheme(profile, "broadway"))    { cs += 0.35; cEv.push("Broadway: produção de alto reconhecimento"); }
  if (formatIs(profile, "musical"))     { cs += 0.45; cEv.push("Musical: forma artística com curadoria exigente"); }
  if (formatIs(profile, "museum"))      { cs += 0.65; cEv.push("Museu: acervo curatorialmente selecionado"); }


  // ─── ENTUSIASTA (Aproveitador) ─────────────────────────────────────────────
  let es = 0;
  const eEv: string[] = [];
  if (hasTheme(profile, "entertainment")){ es += 0.30; eEv.push("Entretenimento: experiência focada em diversão"); }
  if (hasTheme(profile, "adventure"))    { es += 0.35; eEv.push("Aventura: busca por emoções fortes"); }
  if (hasTheme(profile, "fantasy"))      { es += 0.25; eEv.push("Fantasia: experiência imersiva e envolvente"); }
  if (hasTheme(profile, "broadway"))     { es += 0.25; eEv.push("Broadway: espetáculo de alto entretenimento"); }
  if (isNightlife(profile))              { es += 0.70; eEv.push("Nightlife: atração voltada para diversão social e entretenimento"); }
  if (energyIs(profile, "intense"))      { es += 0.20; eEv.push("Energia intensa: ritmo alto agrada entusiastas"); }
  if (formatIs(profile, "park"))         { es += 0.75; eEv.push("Parque de diversão: foco direto em entretenimento"); }
  if (formatIs(profile, "musical"))      { es += 0.40; eEv.push("Musical: espetáculo com alta satisfação experiencial"); }
  if (formatIs(profile, "show"))         { es += 0.35; eEv.push("Show: evento voltado ao entretenimento do espectador"); }


  // ─── DESCOBRIDOR ───────────────────────────────────────────────────────────
  // Sem evidência de lado nenhum → null (desconhecido)
  let ds = 0;
  const dEv: string[] = [];
  const tourism = profile.tourism_profile.value;
  if (tourism === "local")              { ds += 0.40; dEv.push("Turismo local: perfil ideal para Descobridor"); }
  else if (tourism === "balanced")      { ds += 0.15; dEv.push("Turismo balanceado: compatível com Descobridor"); }
  else if (tourism === "mainstream")    { ds -= 0.40; dEv.push("Penalizado: atração mainstream afasta Descobridores"); }
  else if (tourism === "iconic")        { ds -= 0.50; dEv.push("Penalizado: ícone turístico incompatível com Descobridor"); }
  if (hasTheme(profile, "local"))       { ds += 0.20; dEv.push("Tema local: autenticidade da experiência"); }
  if (hasTheme(profile, "gastronomy"))  { ds += 0.15; dEv.push("Gastronomia local: culinária autêntica"); }
  if (hasTheme(profile, "hidden_gem"))  { ds += 0.30; dEv.push("Pérola escondida: descoberta fora do circuito turístico"); }
  if (hasTheme(profile, "mainstream"))  { ds -= 0.30; dEv.push("Penalizado: tema mainstream reduz apelo ao Descobridor"); }

  // ─── SLOW TRAVELER ─────────────────────────────────────────────────────────
  // Principio: prefere ritmo lento, calma, contemplação, sem pressa
  // Penalizar fortemente nightlife, energia intensa, ruído alto
  let ss = 0;
  const sEv: string[] = [];
  if (hasTheme(profile, "relaxation"))    { ss += 0.40; sEv.push("Relaxamento: atração projetada para ritmo lento"); }
  if (energyIs(profile, "calm"))          { ss += 0.30; sEv.push("Energia calma: ambiente sem pressa"); }
  if (noiseIs(profile, "low"))            { ss += 0.20; sEv.push("Ruído baixo: silêncio propício à contemplação"); }
  if (formatIs(profile, "wellness"))      { ss += 0.25; sEv.push("Wellness: ritmo intrinsecamente lento"); }
  if (formatIs(profile, "museum"))        { ss += 0.25; sEv.push("Museu: ritmo contemplativo, sem pressão de tempo"); }
  if (energyIs(profile, "moderate") && !isNightlife(profile)) {
    ss += 0.20; sEv.push("Energia moderada (sem nightlife): compatível com Slow Traveler");
  }
  if (formatIs(profile, "musical", "show") && !isNightlife(profile)) {
    ss += 0.15; sEv.push("Show/Musical sentado: ritmo controlado, sem caminhadas longas");
  }
  // Rooftop calm + dining → ritmo lento de refeição relaxante
  if (hasTheme(profile, "scenic_view") && energyIs(profile, "calm")) { ss += 0.15; sEv.push("Vista cênica com energia calma: refeição contemplativa"); }
  // Penalizações — também são evidências explicáveis
  if (isNightlife(profile))           { ss -= 0.50; sEv.push("Penalizado: nightlife é incompatível com Slow Traveler"); }
  if (energyIs(profile, "intense"))   { ss -= 0.40; sEv.push("Penalizado: energia intensa"); }
  if (noiseIs(profile, "high"))       { ss -= 0.25; sEv.push("Penalizado: ruído alto"); }

  // ─── FAMILY ────────────────────────────────────────────────────────────────
  // Principio: adequação para famílias com crianças
  // Sem sinal de orientação → null (desconhecido — não assumimos adequação genérica)
  // Com sinal → score explicável
  let fs = 0;
  const fEv: string[] = [];
  if (familyIs(profile, "child_focused")) {
    fs += 0.80; fEv.push("Foco em crianças: adequação máxima para famílias");
  } else if (familyIs(profile, "family_friendly")) {
    fs += 0.65; fEv.push("Ambiente familiar: alta adequação para todos os membros da família");
  } else if (familyIs(profile, "adult_oriented")) {
    fs += 0.20; fEv.push("Orientação adulta: baixa (mas não impossível) adequação familiar");
  }

  if (familyIs(profile, "child_focused") || familyIs(profile, "family_friendly")) {
    if (hasTheme(profile, "family")) { fs += 0.15; fEv.push("Tema familiar explícito nos dados da experiência"); }
  }
  if (isNightlife(profile))      { fs -= 0.45; fEv.push("Penalizado: nightlife é inadequado para famílias com crianças"); }
  if (energyIs(profile, "intense") && !familyIs(profile, "child_focused")) {
    fs -= 0.20; fEv.push("Penalizado: energia intensa reduz adequação familiar");
  }

  // ─── SOLO ──────────────────────────────────────────────────────────────────
  // Principio: a experiência é confortável para ser feita sozinho
  // Cada formato/tema tem uma evidência concreta de por que é (ou não) adequado para solo
  let soloS = 0;
  const soloEv: string[] = [];
  if (formatIs(profile, "museum"))   { soloS += 0.80; soloEv.push("Museu: contemplação individual — ideal para solo"); }
  if (formatIs(profile, "wellness")) { soloS += 0.75; soloEv.push("Spa/Wellness: experiência introspectiva — ideal para solo"); }
  if (formatIs(profile, "musical"))  { soloS += 0.65; soloEv.push("Musical: assistir a um espetáculo solo é socialmente aceito e agradável"); }
  if (formatIs(profile, "show"))     { soloS += 0.60; soloEv.push("Show: espetáculo pode ser assistido solo"); }
  if (formatIs(profile, "dining"))   { soloS += 0.55; soloEv.push("Restaurante: comer solo é normal e aceitável"); }
  if (formatIs(profile, "park"))     { soloS += 0.40; soloEv.push("Parque: atividade ao ar livre acessível para solo"); }
  if (formatIs(profile, "nightlife")){ soloS += 0.60; soloEv.push("Nightlife: viável para solo — encontrar pessoas faz parte"); }


  // ─── COUPLE ────────────────────────────────────────────────────────────────
  let coupleS = 0;
  const coupleEv: string[] = [];
  if (hasTheme(profile, "romance"))      { coupleS += 0.35; coupleEv.push("Tema romântico: experiência projetada para casais"); }
  if (energyIs(profile, "calm"))         { coupleS += 0.25; coupleEv.push("Energia calma: ambiente propício para casais"); }
  if (hasTheme(profile, "scenic_view"))  { coupleS += 0.25; coupleEv.push("Vista cênica: ambiente romântico natural para casais"); }
  if (formatIs(profile, "musical"))      { coupleS += 0.65; coupleEv.push("Musical: espetáculo ao qual casais frequentemente vão juntos"); }
  if (formatIs(profile, "show"))         { coupleS += 0.60; coupleEv.push("Show: experiência compartilhada agradável para casais"); }
  if (formatIs(profile, "dining"))       { coupleS += 0.55; coupleEv.push("Restaurante: refeição compartilhada é clássica para casais"); }
  if (formatIs(profile, "wellness"))     { coupleS += 0.70; coupleEv.push("Spa/Wellness: relaxamento compartilhado ideal para casais"); }
  if (formatIs(profile, "museum"))       { coupleS += 0.65; coupleEv.push("Museu: descoberta cultural compartilhada muito comum para casais"); }
  if (isNightlife(profile))              { coupleS += 0.55; coupleEv.push("Nightlife: popular entre casais que saem juntos"); }
  if (formatIs(profile, "park"))         { coupleS += 0.45; coupleEv.push("Parque: passeio agradável para casais"); }


  // ─── FRIENDS ───────────────────────────────────────────────────────────────
  let friendsS = 0;
  const friendsEv: string[] = [];
  if (isNightlife(profile))              { friendsS += 0.85; friendsEv.push("Nightlife: atração core para grupos de amigos"); }
  if (hasTheme(profile, "entertainment")){ friendsS += 0.30; friendsEv.push("Entretenimento: diversão em grupo é amplificada"); }
  if (energyIs(profile, "intense"))      { friendsS += 0.20; friendsEv.push("Energia intensa: amigos aproveitam melhor em grupo"); }
  if (formatIs(profile, "musical"))      { friendsS += 0.50; friendsEv.push("Musical: espetáculo que grupos de amigos frequentam"); }
  if (formatIs(profile, "show"))         { friendsS += 0.50; friendsEv.push("Show: diversão compartilhada com amigos"); }
  if (formatIs(profile, "park"))         { friendsS += 0.45; friendsEv.push("Parque: atividade dinâmica em grupo"); }

  if (formatIs(profile, "dining"))       { friendsS += 0.60; friendsEv.push("Restaurante: refeição em grupo é prazerosa"); }
  if (hasTheme(profile, "adventure"))    { friendsS += 0.20; friendsEv.push("Aventura: amigos aproveitam experiências intensas juntos"); }
  if (formatIs(profile, "museum"))       { friendsS += 0.55; friendsEv.push("Museu: visita em grupo é atividade social comum"); }


  return {
    schema_version: "affinity-v2",
    calculated_at: new Date().toISOString(),
    source_profile_format: profile.experience_format.value,
    personas: {
      explorador_visual:    dim(vs,    vEv),
      curador_experiencias: dim(cs,    cEv),
      aproveitador:         dim(es,    eEv),
      descobridor:          dim(ds,    dEv),
      slow_traveler:        dim(ss,    sEv),
    },
    companionship: {
      solo:    dim(soloS,   soloEv),
      couple:  dim(coupleS, coupleEv),
      friends: dim(friendsS,friendsEv),
      family:  dim(fs,      fEv),
    }
  };
}
