import {
  ExperienceRestrictionsInput,
  ExperienceRestrictionsResult,
  ExperienceRestrictionFact,
  RestrictionVerification,
  RestrictionValidationIssue,
  ConfidenceLevel
} from "./types";

function createFact<T>(
  value: T | null,
  globalConfidence: ConfidenceLevel,
  evidences: string[] = []
): ExperienceRestrictionFact<T | null> {
  const isAbsent = value === null || value === undefined;

  return {
    value: isAbsent ? null : value,
    confidence: isAbsent ? "none" : globalConfidence,
    evidences: isAbsent ? ["Restrição não informada"] : evidences,
    source: "rule",
    manual_override: false,
  };
}

export function buildExperienceRestrictionsProfile(
  input: ExperienceRestrictionsInput
): ExperienceRestrictionsResult {
  const issues: RestrictionValidationIssue[] = [];

  // 1. Calculate Global Confidence
  let globalConfidence: ConfidenceLevel = "low";

  const hasSource = Boolean(input.restriction_source && input.restriction_source.trim() !== "");
  const hasVerifiedAt = Boolean(input.verified_at && input.verified_at.trim() !== "");
  const hasVerifiedBy = Boolean(input.verified_by && input.verified_by.trim() !== "");
  const isAiSuggestion = input.restriction_source === "ai_suggestion";
  const isImport = input.restriction_source === "import";

  if (!hasSource) {
    globalConfidence = "low";
  } else if (hasSource && (!hasVerifiedAt || !hasVerifiedBy)) {
    globalConfidence = "medium";
  } else if (hasSource && hasVerifiedAt && hasVerifiedBy) {
    globalConfidence = (isAiSuggestion || isImport) ? "medium" : "high";
  } else {
    globalConfidence = "medium";
  }

  // Detect issues that don't depend on individual fields
  if (hasVerifiedAt && !hasVerifiedBy) {
    issues.push({
      code: "MISSING_VERIFIER",
      severity: "warning",
      message: "Data de verificação preenchida sem o responsável (verified_by).",
      affected_fields: ["verified_at", "verified_by"],
    });
  }

  if (hasVerifiedBy && !hasVerifiedAt) {
    issues.push({
      code: "MISSING_VERIFICATION_DATE",
      severity: "warning",
      message: "Responsável pela verificação preenchido sem a data (verified_at).",
      affected_fields: ["verified_at", "verified_by"],
    });
  }

  if (globalConfidence === "high" && !hasSource) {
    // This branch might not be hit naturally due to our logic above, but strictly following requirements:
    issues.push({
      code: "UNVERIFIABLE_HIGH_CONFIDENCE",
      severity: "warning",
      message: "Confiança alta requer uma fonte verificável.",
      affected_fields: ["restriction_source"],
    });
  }

  // 2. Map facts
  const minAge = input.min_age ?? null;
  const adultOnly = input.adult_only ?? null;
  const familyAllowed = input.family_with_children_allowed ?? null;
  const minGroup = input.minimum_group_size ?? null;
  const maxGroup = input.maximum_group_size ?? null;
  const requiresCompanion = input.requires_companion ?? null;
  const wheelchair = input.wheelchair_accessible ?? null;
  const stairs = input.stairs_required ?? null;
  const accessNotes = input.accessibility_notes ?? null;

  // Detect issues
  if (minAge !== null && minAge < 0) {
    issues.push({
      code: "INVALID_MIN_AGE",
      severity: "error",
      message: "A idade mínima não pode ser negativa.",
      affected_fields: ["min_age"],
    });
  }

  if (minGroup !== null && minGroup < 1) {
    issues.push({
      code: "INVALID_MIN_GROUP_SIZE",
      severity: "error",
      message: "O tamanho mínimo do grupo não pode ser menor que um.",
      affected_fields: ["minimum_group_size"],
    });
  }

  if (minGroup !== null && maxGroup !== null && maxGroup < minGroup) {
    issues.push({
      code: "MAX_GROUP_BELOW_MINIMUM",
      severity: "error",
      message: "O tamanho máximo do grupo não pode ser menor que o mínimo.",
      affected_fields: ["minimum_group_size", "maximum_group_size"],
    });
  }

  if (adultOnly === true && familyAllowed === true) {
    issues.push({
      code: "CONTRADICTORY_FAMILY_POLICY",
      severity: "error",
      message: "Experiência não pode ser apenas para adultos e permitir crianças simultaneamente.",
      affected_fields: ["adult_only", "family_with_children_allowed"],
    });
  }

  if (requiresCompanion === false && minGroup !== null && minGroup > 1) {
    issues.push({
      code: "CONTRADICTORY_COMPANION_POLICY",
      severity: "warning",
      message: "Experiência não exige acompanhante, mas o tamanho mínimo do grupo é maior que um.",
      affected_fields: ["requires_companion", "minimum_group_size"],
    });
  }

  // Create facts
  const result: ExperienceRestrictionsResult = {
    min_age: createFact(minAge, globalConfidence, [`Idade mínima informada: ${minAge}`]),
    adult_only: createFact(adultOnly, globalConfidence, [`Política apenas para adultos: ${adultOnly}`]),
    family_with_children_allowed: createFact(familyAllowed, globalConfidence, [`Crianças permitidas: ${familyAllowed}`]),
    minimum_group_size: createFact(minGroup, globalConfidence, [`Tamanho mínimo do grupo: ${minGroup}`]),
    maximum_group_size: createFact(maxGroup, globalConfidence, [`Tamanho máximo do grupo: ${maxGroup}`]),
    requires_companion: createFact(requiresCompanion, globalConfidence, [`Exige acompanhante: ${requiresCompanion}`]),
    wheelchair_accessible: createFact(wheelchair, globalConfidence, [`Acessibilidade para cadeirantes: ${wheelchair}`]),
    stairs_required: createFact(stairs, globalConfidence, [`Requer subir escadas: ${stairs}`]),
    accessibility_notes: createFact(accessNotes, globalConfidence, [`Notas de acessibilidade fornecidas`]),
    verification: {
      source: input.restriction_source ?? null,
      verified_at: input.verified_at ?? null,
      verified_by: input.verified_by ?? null,
    },
    issues,
  };

  return result;
}
