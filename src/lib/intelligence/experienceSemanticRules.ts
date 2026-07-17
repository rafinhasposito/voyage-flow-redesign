import { 
  ExperienceIntelligenceInput, 
  ExperienceSemanticProfile,
  ExperienceDimension,
  ExperienceFormat,
  ExperienceTheme,
  EnvironmentType,
  EnergyLevel,
  NoiseLevel,
  CrowdLevel,
  FamilyOrientation,
  CulturalProfile,
  TourismProfile
} from "./types";

function createDimension<T>(value: T, evidences: string[], confidence: "high" | "medium" | "low" | "none" = "high"): ExperienceDimension<T> {
  return {
    value,
    confidence,
    evidences,
    source: "rule",
    manual_override: false
  };
}

export function buildExperienceSemanticProfile(input: ExperienceIntelligenceInput): ExperienceSemanticProfile {
  const text = `${input.title || ''} ${input.description || ''} ${input.short_description || ''} ${input.category || ''} ${input.type || ''}`.toLowerCase();
  const tags = (input.tags || []).map(t => t.toLowerCase());
  
  const hasWord = (word: string) => text.includes(word) || tags.includes(word);
  
  const isNightclub = hasWord("nightclub") || (hasWord("club") && hasWord("dance")) || (hasWord("dj") && hasWord("party"));
  const isBroadway = hasWord("broadway");
  const isMusical = hasWord("musical");
  const isDisney = hasWord("disney") || hasWord("rei leão");
  const isFantasy = hasWord("fantasia") || hasWord("fantasy") || hasWord("magic");
  const isSpa = hasWord("spa") || hasWord("massagem") || hasWord("massage");
  const isMuseum = hasWord("museu") || hasWord("museum") || input.type === "museum";
  const isPark = hasWord("parque") || hasWord("park");
  const isKids = hasWord("infantil") || hasWord("criança") || hasWord("kids") || hasWord("child");
  const isFamilyWord = hasWord("family") || hasWord("familiar") || hasWord("família");
  const isRestaurant = input.type === "restaurant" || hasWord("restaurante") || hasWord("dining");
  const isBar = hasWord("bar") && !isNightclub; // Bar alone is not nightclub
  const isRooftop = hasWord("rooftop");
  const isStreetFood = hasWord("street food") || hasWord("comida de rua");
  const isAdultOnly = hasWord("adult") || hasWord("adulto");
  const isRomance = hasWord("romance") || hasWord("romântico") || hasWord("romantic") || hasWord("date");

  // Format — precedência: musical > show > nightlife > museum > park > dining > wellness
  let format: ExperienceFormat = "unknown";
  let formatEvidences: string[] = [];
  if (isMusical) { format = "musical"; formatEvidences.push("Contém evidência explícita de musical"); if (isBroadway) formatEvidences.push("Associado ao circuito Broadway"); }
  else if (isBroadway) { format = "show"; formatEvidences.push("Contém broadway mas sem evidência explícita de musical"); }
  else if (isMuseum) { format = "museum"; formatEvidences.push("Contém museu/museum"); }
  else if (isPark) { format = "park"; formatEvidences.push("Contém parque/park"); }
  else if (isNightclub) { format = "nightlife"; formatEvidences.push("Contém nightclub/party"); }
  else if (isRestaurant || isStreetFood || isBar) { format = "dining"; formatEvidences.push("Classificado como dining/restaurant/bar"); }
  else if (isSpa) { format = "wellness"; formatEvidences.push("Classificado como spa/massagem"); }
  
  // Themes
  const themes: ExperienceTheme[] = [];
  const themeEvidences: string[] = [];
  if (isBroadway) { themes.push("broadway"); themeEvidences.push("Contém broadway"); }
  if (isMusical || isBroadway || isNightclub) { themes.push("entertainment"); themeEvidences.push(`${isMusical ? "Musical" : isBroadway ? "Broadway" : "Nightclub"}: entretenimento explícito`); }
  if (isFantasy) { themes.push("fantasy"); themeEvidences.push("Contém fantasia"); }
  if (isKids || isDisney || isFamilyWord) { themes.push("family"); themeEvidences.push("Foco familiar (disney/kids/family)"); }
  if (isRomance) { themes.push("romance"); themeEvidences.push("Foco romântico"); }
  if (isMuseum) { themes.push("art", "culture"); themeEvidences.push("Museu detectado"); }
  if (isStreetFood) { themes.push("local", "gastronomy"); themeEvidences.push("Comida de rua"); }
  if (isSpa) { themes.push("relaxation"); themeEvidences.push("Spa detectado"); }
  if (isRooftop && !isNightclub) { themes.push("scenic_view"); themeEvidences.push("Rooftop sem balada: vista cênica"); }
  if (isBroadway || isDisney || isMuseum) { themes.push("mainstream"); themeEvidences.push("Atração altamente turística"); }

  // Environment
  let environment: EnvironmentType = "unknown";
  let envEvidences: string[] = [];
  if (isMuseum || isBroadway || isSpa || isMusical) { environment = "indoor"; envEvidences.push("Natureza da atividade tipicamente indoor"); }
  if (isPark || isStreetFood) { environment = "outdoor"; envEvidences.push("Natureza da atividade tipicamente outdoor"); }
  
  // Energy
  let energy: EnergyLevel = "unknown";
  let energyEvidences: string[] = [];
  if (isNightclub) { energy = "intense"; energyEvidences.push("Nightclub tem energia intensa"); }
  else if (isSpa || isMuseum || isRomance || (isRooftop && !isNightclub)) { energy = "calm"; energyEvidences.push("Spa/Museu/Rooftop calmo indica energia baixa"); }
  else if (isBroadway || isDisney) { energy = "moderate"; energyEvidences.push("Show familiar tem energia moderada"); }

  // Noise
  let noise: NoiseLevel = "unknown";
  let noiseEvidences: string[] = [];
  if (isNightclub) { noise = "high"; noiseEvidences.push("Nightclub tem som alto"); }
  else if (isSpa) { noise = "low"; noiseEvidences.push("Spa exige silêncio"); }

  // Crowd
  let crowd: CrowdLevel = "unknown";
  let crowdEvidences: string[] = [];
  if (isNightclub) { crowd = "high"; crowdEvidences.push("Nightclub costuma estar lotado"); }

  // Nightlife
  let nightlife: boolean | null = null;
  let nightlifeEvidences: string[] = [];
  if (isNightclub) { nightlife = true; nightlifeEvidences.push("Identificado como nightclub explícito"); }
  else if (isRooftop || isBar || isBroadway) { nightlife = false; nightlifeEvidences.push("Rooftop, Bar ou Show não são classificados como balada"); }

  // Family Orientation
  let familyOrientation: FamilyOrientation = "unknown";
  let famEvidences: string[] = [];
  if (isKids || isDisney) { familyOrientation = "child_focused"; famEvidences.push("Foco explícito em crianças/Disney"); }
  else if (isBroadway || isFamilyWord) { familyOrientation = "family_friendly"; famEvidences.push("Atração broadway/familiar costuma ser family friendly"); }
  else if (isNightclub || (isAdultOnly && !isDisney)) { familyOrientation = "adult_oriented"; famEvidences.push("Nightclub ou adult only exclui crianças"); }
  
  // Cultural Profile
  let cultural: CulturalProfile = "unknown";
  let cultEvidences: string[] = [];
  if (isMuseum) { cultural = "strong"; cultEvidences.push("Museu tem forte apelo cultural"); }

  // Tourism Profile
  let tourism: TourismProfile = "unknown";
  let tourEvidences: string[] = [];
  if (isBroadway || isDisney) { tourism = "mainstream"; tourEvidences.push("Clássicos altamente turísticos"); }
  else if (isStreetFood) { tourism = "local"; tourEvidences.push("Comida de rua costuma ser local"); }

  // semantic_tags: projeção conveniente das dimensões estruturadas para busca e exibição.
  // As dimensões com value, confidence, evidences e source são a fonte canônica.
  // semantic_tags NÃO é uma segunda fonte independente de classificação.
  const semanticTags: string[] = [];
  if (format !== "unknown") semanticTags.push(format);
  themes.forEach(t => semanticTags.push(t));
  if (environment !== "unknown") semanticTags.push(environment);
  if (familyOrientation !== "unknown") semanticTags.push(familyOrientation);
  if (cultural !== "unknown" && cultural !== "none") semanticTags.push(cultural);
  // tourism_profile somente se não redundante com os temas já inseridos
  if (tourism !== "unknown" && !semanticTags.includes(tourism)) semanticTags.push(tourism);

  return {
    semantic_tags: [...new Set(semanticTags)], // garantia extra de deduplicação

    experience_format: createDimension(format, formatEvidences, format === "unknown" ? "none" : "high"),
    themes: createDimension(themes, themeEvidences, themes.length === 0 ? "none" : "high"),
    environment_type: createDimension(environment, envEvidences, environment === "unknown" ? "none" : "high"),
    energy_level: createDimension(energy, energyEvidences, energy === "unknown" ? "none" : "high"),
    noise_level: createDimension(noise, noiseEvidences, noise === "unknown" ? "none" : "high"),
    crowd_level: createDimension(crowd, crowdEvidences, crowd === "unknown" ? "none" : "high"),
    nightlife: createDimension(nightlife, nightlifeEvidences, nightlife === null ? "none" : "high"),
    alcohol_focused: createDimension(null, [], "none"),
    family_orientation: createDimension(familyOrientation, famEvidences, familyOrientation === "unknown" ? "none" : "high"),
    cultural_profile: createDimension(cultural, cultEvidences, cultural === "unknown" ? "none" : "high"),
    tourism_profile: createDimension(tourism, tourEvidences, tourism === "unknown" ? "none" : "high")
  };
}
