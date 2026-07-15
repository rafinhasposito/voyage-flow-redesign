import { FormState } from "@/pages/admin/ExperienceEditor";

export type AffinityResult = {
  score: number | null;
  evidences: string[];
};

export type AffinityEngineResult = {
  personaWeights: {
    explorador_visual: AffinityResult;
    curador_experiencias: AffinityResult;
    descobridor: AffinityResult;
    aproveitador: AffinityResult;
    slow_traveler: AffinityResult;
  };
  companionshipCompatibility: {
    solo: AffinityResult;
    couple: AffinityResult;
    family: AffinityResult;
    friends: AffinityResult;
  };
  metadata: {
    source: string;
    calculatedAt: string;
  };
};

export function calculateAffinityV1(form: Partial<FormState>): AffinityEngineResult {
  const clamp = (v: number) => Math.max(0, Math.min(100, v));
  const hasTags = (tags: string[]) => tags.some(t => form.tags?.includes(t));

  // Explorador Visual
  let visualScore = 0;
  const visualEvidences: string[] = [];
  if ((form.media_urls?.length || 0) >= 3) { visualScore += 40; visualEvidences.push("Múltiplas imagens disponíveis (+40)"); }
  if (form.is_must_see) { visualScore += 30; visualEvidences.push("Localização icônica 'Must See' (+30)"); }
  if (hasTags(['fotografia', 'arte', 'mirante', 'design'])) { visualScore += 20; visualEvidences.push("Tags visuais identificadas (+20)"); }

  // Curador de Experiências
  let curadorScore = 0;
  const curadorEvidences: string[] = [];
  if ((form.base_cost || 0) >= 100) { curadorScore += 30; curadorEvidences.push("Alto valor agregado (+30)"); }
  if (['premium', 'exclusive', 'invite_only'].includes(form.exclusivity_level || '')) { curadorScore += 40; curadorEvidences.push("Alta exclusividade (+40)"); }
  if (['elegant', 'formal'].includes(form.dress_code || '')) { curadorScore += 20; curadorEvidences.push("Dress code sofisticado (+20)"); }
  if (form.reservation_required) { curadorScore += 10; curadorEvidences.push("Requer reserva (+10)"); }

  // Descobridor
  let descobridorScore = 0;
  const descobridorEvidences: string[] = [];
  if (form.reviews_count !== null && form.reviews_count !== undefined && form.reviews_count < 50) { descobridorScore += 40; descobridorEvidences.push("Poucas avaliações (Hidden Gem) (+40)"); }
  if (form.exclusivity_level === 'invite_only') { descobridorScore += 30; descobridorEvidences.push("Somente convidados (+30)"); }
  const isTouristy = ['midtown', 'downtown', 'times square'].includes((form.neighborhood || '').toLowerCase());
  if (form.neighborhood && !isTouristy) { descobridorScore += 20; descobridorEvidences.push("Fora do circuito turístico padrão (+20)"); }

  // Aproveitador
  let aproveitadorScore = 0;
  const aproveitadorEvidences: string[] = [];
  if (form.base_cost === 0) { aproveitadorScore = 100; aproveitadorEvidences.push("Atividade gratuita (Max)"); }
  else if ((form.base_cost || 0) < 30) { aproveitadorScore += 50; aproveitadorEvidences.push("Custo muito baixo (+50)"); }
  if ((form.duration_minutes || 0) > 180 && (form.base_cost || 0) < 50) { aproveitadorScore += 30; aproveitadorEvidences.push("Excelente custo-benefício por tempo (+30)"); }

  // Slow Traveler
  let slowScore = 0;
  const slowEvidences: string[] = [];
  if ((form.duration_minutes || 0) >= 120) { slowScore += 30; slowEvidences.push("Duração estendida (>2h) (+30)"); }
  if ((form.duration_minutes || 0) >= 240) { slowScore += 20; slowEvidences.push("Experiência imersiva (>4h) (+20)"); }
  if (hasTags(['relaxante', 'natureza', 'parque', 'spa', 'café'])) { slowScore += 40; slowEvidences.push("Tags de relaxamento (+40)"); }

  // Solo
  let soloScore = 0;
  const soloEvidences: string[] = [];
  if ((form.base_cost || 0) < 50) { soloScore += 30; soloEvidences.push("Custo acessível para indivíduo (+30)"); }
  if (['museum', 'attractions', 'parks'].includes(form.type || '')) { soloScore += 40; soloEvidences.push("Categoria amigável para solo (+40)"); }
  if (hasTags(['seguro', 'solo'])) { soloScore += 20; soloEvidences.push("Tags favoráveis para solo (+20)"); }

  // Casal
  let coupleScore = 0;
  const coupleEvidences: string[] = [];
  if (hasTags(['romântico', 'casal', 'date'])) { coupleScore += 50; coupleEvidences.push("Tags românticas (+50)"); }
  if (['premium', 'exclusive'].includes(form.exclusivity_level || '')) { coupleScore += 20; coupleEvidences.push("Clima exclusivo (+20)"); }
  if (['dining', 'shows'].includes(form.type || '')) { coupleScore += 20; coupleEvidences.push("Ideal para encontro (+20)"); }

  // Família
  let familyScore = 0;
  const familyEvidences: string[] = [];
  if (hasTags(['família', 'crianças', 'kids'])) { familyScore += 60; familyEvidences.push("Foco em família/crianças (+60)"); }
  if ((form.base_cost || 0) < 40) { familyScore += 20; familyEvidences.push("Custo viável para grupos familiares (+20)"); }
  if (['parks', 'attractions'].includes(form.type || '')) { familyScore += 10; familyEvidences.push("Local espaçoso (+10)"); }

  // Amigos
  let friendsScore = 0;
  const friendsEvidences: string[] = [];
  if (hasTags(['amigos', 'grupo', 'bar', 'festa', 'drinks'])) { friendsScore += 60; friendsEvidences.push("Foco em grupos/social (+60)"); }
  if (['events', 'dining', 'nightlife'].includes(form.type || '')) { friendsScore += 30; friendsEvidences.push("Atividade social (+30)"); }

  return {
    personaWeights: {
      explorador_visual: { score: visualEvidences.length > 0 ? clamp(visualScore) : null, evidences: visualEvidences },
      curador_experiencias: { score: curadorEvidences.length > 0 ? clamp(curadorScore) : null, evidences: curadorEvidences },
      descobridor: { score: descobridorEvidences.length > 0 ? clamp(descobridorScore) : null, evidences: descobridorEvidences },
      aproveitador: { score: aproveitadorEvidences.length > 0 ? clamp(aproveitadorScore) : null, evidences: aproveitadorEvidences },
      slow_traveler: { score: slowEvidences.length > 0 ? clamp(slowScore) : null, evidences: slowEvidences },
    },
    companionshipCompatibility: {
      solo: { score: soloEvidences.length > 0 ? clamp(soloScore) : null, evidences: soloEvidences },
      couple: { score: coupleEvidences.length > 0 ? clamp(coupleScore) : null, evidences: coupleEvidences },
      family: { score: familyEvidences.length > 0 ? clamp(familyScore) : null, evidences: familyEvidences },
      friends: { score: friendsEvidences.length > 0 ? clamp(friendsScore) : null, evidences: friendsEvidences }
    },
    metadata: {
      source: "rules_v1",
      calculatedAt: new Date().toISOString()
    }
  };
}
