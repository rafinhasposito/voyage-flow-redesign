import {
  ExperienceRestrictionsInput,
  ExperienceRestrictionsResult,
  ExperienceRestrictionFact,
  RestrictionVerification,
  RestrictionValidationIssue,
  ConfidenceLevel,
  RestrictionFieldKey,
  RestrictionProvenanceEntry,
  RestrictionsProvenance
} from "./types";

function getFieldConfidence(
  provenance: RestrictionProvenanceEntry | undefined
): ConfidenceLevel {
  if (!provenance || !provenance.source || provenance.source.trim() === "") {
    return "low";
  }
  const hasVerifiedAt = Boolean(provenance.verified_at && provenance.verified_at.trim() !== "");
  const hasVerifiedBy = Boolean(provenance.verified_by && provenance.verified_by.trim() !== "");

  if (!hasVerifiedAt || !hasVerifiedBy) {
    return "medium";
  }

  const isAiSuggestion = provenance.source === "ai_suggestion" || provenance.source === "Sugestão de IA";
  const isImport = provenance.source === "import" || provenance.source === "Importação";

  if (isAiSuggestion || isImport) {
    return "medium";
  }

  return "high";
}

function createFact<T>(
  value: T | null,
  provenance: RestrictionProvenanceEntry | undefined,
  evidences: string[] = []
): ExperienceRestrictionFact<T | null> {
  const isAbsent = value === null || value === undefined || (typeof value === 'string' && value.trim() === '');

  return {
    value: isAbsent ? null : value,
    confidence: isAbsent ? "none" : getFieldConfidence(provenance),
    evidences: isAbsent ? ["Restrição não informada"] : evidences,
    source: "rule",
    manual_override: false,
  };
}

export function buildExperienceRestrictionsProfile(
  input: ExperienceRestrictionsInput
): ExperienceRestrictionsResult {
  const issues: RestrictionValidationIssue[] = [];

  const prov = input.restrictions_provenance || {};

  // Check verification issues for all prov entries
  for (const key in prov) {
    const entry = prov[key as RestrictionFieldKey];
    if (!entry) continue;

    const hasSource = Boolean(entry.source && entry.source.trim() !== "");
    const hasVerifiedAt = Boolean(entry.verified_at && entry.verified_at.trim() !== "");
    const hasVerifiedBy = Boolean(entry.verified_by && entry.verified_by.trim() !== "");

    if (hasVerifiedAt && !hasVerifiedBy) {
      issues.push({
        code: "MISSING_VERIFIER",
        severity: "warning",
        message: `Data de verificação preenchida sem o responsável (verified_by) para ${key}.`,
        affected_fields: ["verified_at", "verified_by"],
      });
    }

    if (hasVerifiedBy && !hasVerifiedAt) {
      issues.push({
        code: "MISSING_VERIFICATION_DATE",
        severity: "warning",
        message: `Responsável pela verificação preenchido sem a data (verified_at) para ${key}.`,
        affected_fields: ["verified_at", "verified_by"],
      });
    }

    if (getFieldConfidence(entry) === "high" && !hasSource) {
      issues.push({
        code: "UNVERIFIABLE_HIGH_CONFIDENCE",
        severity: "warning",
        message: "Confiança alta requer uma fonte verificável.",
        affected_fields: ["restriction_source"],
      });
    }
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
    min_age: createFact(minAge, prov.min_age, [`Idade mínima informada: ${minAge}`]),
    adult_only: createFact(adultOnly, prov.adult_only, [`Política apenas para adultos: ${adultOnly}`]),
    family_with_children_allowed: createFact(familyAllowed, prov.family_with_children_allowed, [`Crianças permitidas: ${familyAllowed}`]),
    minimum_group_size: createFact(minGroup, prov.minimum_group_size, [`Tamanho mínimo do grupo: ${minGroup}`]),
    maximum_group_size: createFact(maxGroup, prov.maximum_group_size, [`Tamanho máximo do grupo: ${maxGroup}`]),
    requires_companion: createFact(requiresCompanion, prov.requires_companion, [`Exige acompanhante: ${requiresCompanion}`]),
    wheelchair_accessible: createFact(wheelchair, prov.wheelchair_accessible, [`Acessibilidade para cadeirantes: ${wheelchair}`]),
    stairs_required: createFact(stairs, prov.stairs_required, [`Requer subir escadas: ${stairs}`]),
    accessibility_notes: createFact(accessNotes, prov.accessibility_notes, [`Notas de acessibilidade fornecidas`]),
    verification: {
      source: null,
      verified_at: null,
      verified_by: null,
    },
    issues,
  };

  return result;
}
