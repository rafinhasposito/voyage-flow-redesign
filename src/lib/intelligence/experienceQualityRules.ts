import {
  ExperienceQualityInput,
  ExperienceQualityResult,
  ExperienceDimension,
  ReviewConfidence,
  EditorialPriority,
  PremiumPositioning,
  PlanningRequirements,
} from "./types";

function createDimension<T>(
  value: T,
  evidences: string[] = [],
  confidence: "high" | "medium" | "low" | "none" = "high",
  source: "rule" | "manual" = "rule"
): ExperienceDimension<T> {
  return {
    value,
    confidence,
    evidences,
    source,
    manual_override: source === "manual",
  };
}

function isFilled(val: any): boolean {
  if (val === null || val === undefined) return false;
  if (typeof val === "string" && val.trim() === "") return false;
  return true;
}

export function buildExperienceQualityProfile(
  input: ExperienceQualityInput
): ExperienceQualityResult {
  // 1. Quality Score
  let qualityScore: number | null = null;
  const qualityEvidences: string[] = [];

  if (typeof input.rating === "number" && input.rating >= 0 && input.rating <= 5) {
    qualityScore = Math.round((input.rating / 5) * 100) / 100;
    qualityEvidences.push(`Avaliação informada: ${input.rating} de 5`);
  }

  // 2. Review Confidence
  let reviewConfidence: ReviewConfidence = "none";
  const confidenceEvidences: string[] = [];

  if (typeof input.reviews_count === "number" && input.reviews_count >= 0) {
    if (input.reviews_count < 10) {
      reviewConfidence = "low";
    } else if (input.reviews_count < 100) {
      reviewConfidence = "medium";
    } else {
      reviewConfidence = "high";
    }
    confidenceEvidences.push(`Baseada em ${input.reviews_count} avaliações`);
  } else {
    confidenceEvidences.push("Número de avaliações não informado");
  }

  // 3. Editorial Priority
  let editorialPriority: EditorialPriority = "none";
  const editorialEvidences: string[] = [];

  if (input.is_must_see === true) {
    editorialPriority = "high";
    editorialEvidences.push("Marcada editorialmente como Must See");
  } else {
    editorialEvidences.push("Não marcada editorialmente como Must See");
  }

  // 4. Premium Positioning
  let premiumPositioning: PremiumPositioning = "none";
  const premiumEvidences: string[] = [];

  if (input.exclusivity_level) {
    const level = input.exclusivity_level.toLowerCase().trim();
    if (["acessível", "accessible"].includes(level)) {
      premiumPositioning = "accessible";
      premiumEvidences.push(`Nível de exclusividade informado: ${input.exclusivity_level}`);
    } else if (["média", "media", "moderate"].includes(level)) {
      premiumPositioning = "moderate";
      premiumEvidences.push(`Nível de exclusividade informado: ${input.exclusivity_level}`);
    } else if (["alta", "high", "premium"].includes(level)) {
      premiumPositioning = "high";
      premiumEvidences.push(`Nível de exclusividade informado: ${input.exclusivity_level}`);
    } else if (["vip", "exclusive", "invite_only"].includes(level)) {
      premiumPositioning = "exclusive";
      premiumEvidences.push(`Nível de exclusividade informado: ${input.exclusivity_level}`);
    } else {
      premiumEvidences.push(`Nível de exclusividade não reconhecido: ${input.exclusivity_level}`);
    }
  } else {
    premiumEvidences.push("Nível de exclusividade não informado");
  }

  // 5. Planning Requirements
  let resReqValue: boolean | null = null;
  const resReqEvidences: string[] = [];
  if (typeof input.reservation_required === "boolean") {
    resReqValue = input.reservation_required;
    resReqEvidences.push(`Reserva obrigatória informada como: ${resReqValue}`);
  } else {
    resReqEvidences.push("Reserva obrigatória não informada");
  }

  let dcValue: string | null = null;
  const dcEvidences: string[] = [];
  if (isFilled(input.dress_code)) {
    dcValue = input.dress_code as string;
    dcEvidences.push(`Dress code: ${dcValue}`);

    // Reforço visual/evidence se for premium e tiver dress code elegante
    if (premiumPositioning !== "none" && premiumPositioning !== "accessible") {
      const dc = dcValue.toLowerCase();
      if (dc.includes("formal") || dc.includes("elegante") || dc.includes("smart") || dc.includes("chic")) {
        premiumEvidences.push(`Dress code formal/elegante reforça o posicionamento`);
      }
    }
  } else {
    dcEvidences.push("Dress code não informado");
  }

  // 6. Data Completeness
  let filledFields = 0;
  if (isFilled(input.rating)) filledFields++;
  if (isFilled(input.reviews_count)) filledFields++;
  if (isFilled(input.is_must_see)) filledFields++;
  if (isFilled(input.exclusivity_level)) filledFields++;
  if (isFilled(input.reservation_required)) filledFields++;
  if (isFilled(input.dress_code)) filledFields++;

  const completenessScore = Math.round((filledFields / 6) * 10000) / 10000;
  const completenessEvidences = [`${filledFields} de 6 campos de qualidade preenchidos`];

  return {
    quality_score: createDimension(qualityScore, qualityEvidences, qualityScore !== null ? "high" : "none"),
    review_confidence: createDimension(reviewConfidence, confidenceEvidences, reviewConfidence !== "none" ? "high" : "none"),
    editorial_priority: createDimension(editorialPriority, editorialEvidences, editorialPriority !== "none" ? "high" : "none"),
    premium_positioning: createDimension(premiumPositioning, premiumEvidences, premiumPositioning !== "none" ? "high" : "none"),
    data_completeness: createDimension(completenessScore, completenessEvidences, "high"),
    planning_requirements: {
      reservation_required: createDimension(resReqValue, resReqEvidences, resReqValue !== null ? "high" : "none"),
      dress_code: createDimension(dcValue, dcEvidences, dcValue !== null ? "high" : "none"),
    },
  };
}
