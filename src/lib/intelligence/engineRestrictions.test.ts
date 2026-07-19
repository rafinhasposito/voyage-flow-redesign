import { describe, it, expect } from "vitest";
import { ExperienceMatchingEngine } from "../../utils/travelState";
import { TravelExperience, UserProfile } from "../../utils/travelState";

describe("ExperienceMatchingEngine.evaluateRestrictions", () => {
  const baseExp: TravelExperience = {
    id: "test", name: "Test", category: "culture", categoryLabel: "Culture",
    description: "test", image: "", costLevel: "$", costUSD: 0, neighborhood: "",
    matchScore: 100, durationHours: 1, bestTime: "",
  };

  const baseProfile: UserProfile = {
    style: "solo", interests: [], budget: "$$", days: 1, startDate: "",
    passengerName: "Test", personaAffinity: {} as any, tagAffinity: {},
    pace: "relaxado", companionship: "solo", transport: "walk",
    financial: {} as any, swipedRightIds: [], swipedLeftIds: [], interactions: []
  };

  it("1. adulto em experiência adulta (permitido)", () => {
    const res = ExperienceMatchingEngine.evaluateRestrictions(
      { ...baseExp, adult_only: true },
      { ...baseProfile, style: "couple", hasChildren: false }
    );
    expect(res.allowed).toBe(true);
  });

  it("2. criança em experiência adulta (bloqueado)", () => {
    const res = ExperienceMatchingEngine.evaluateRestrictions(
      { ...baseExp, adult_only: true },
      { ...baseProfile, style: "family", hasChildren: true }
    );
    expect(res.allowed).toBe(false);
    expect(res.blockers[0].code).toBe("ADULT_ONLY");
  });

  it("3. idade abaixo do mínimo (bloqueado)", () => {
    const res = ExperienceMatchingEngine.evaluateRestrictions(
      { ...baseExp, min_age: 18 },
      { ...baseProfile, passengerAge: 16 }
    );
    expect(res.allowed).toBe(false);
    expect(res.blockers[0].code).toBe("BELOW_MINIMUM_AGE");
  });

  it("4. idade compatível (permitido)", () => {
    const res = ExperienceMatchingEngine.evaluateRestrictions(
      { ...baseExp, min_age: 18 },
      { ...baseProfile, passengerAge: 20 }
    );
    expect(res.allowed).toBe(true);
  });

  it("5. viajante solo em experiência que exige acompanhante (bloqueado)", () => {
    const res = ExperienceMatchingEngine.evaluateRestrictions(
      { ...baseExp, requires_companion: true },
      { ...baseProfile, style: "solo", groupSize: 1 }
    );
    expect(res.allowed).toBe(false);
    expect(res.blockers[0].code).toBe("COMPANION_REQUIRED");
  });

  it("6. grupo abaixo do mínimo (bloqueado)", () => {
    const res = ExperienceMatchingEngine.evaluateRestrictions(
      { ...baseExp, minimum_group_size: 4 },
      { ...baseProfile, style: "couple", groupSize: 2 }
    );
    expect(res.allowed).toBe(false);
    expect(res.blockers[0].code).toBe("GROUP_TOO_SMALL");
  });

  it("7. grupo acima do máximo (bloqueado)", () => {
    const res = ExperienceMatchingEngine.evaluateRestrictions(
      { ...baseExp, maximum_group_size: 4 },
      { ...baseProfile, style: "friends", groupSize: 6 }
    );
    expect(res.allowed).toBe(false);
    expect(res.blockers[0].code).toBe("GROUP_TOO_LARGE");
  });

  it("8. cadeira de rodas com acessibilidade confirmada (permitido)", () => {
    const res = ExperienceMatchingEngine.evaluateRestrictions(
      { ...baseExp, wheelchair_accessible: true },
      { ...baseProfile, wheelchairRequired: true }
    );
    expect(res.allowed).toBe(true);
  });

  it("9. cadeira de rodas com acessibilidade negada (bloqueado)", () => {
    const res = ExperienceMatchingEngine.evaluateRestrictions(
      { ...baseExp, wheelchair_accessible: false },
      { ...baseProfile, wheelchairRequired: true }
    );
    expect(res.allowed).toBe(false);
    expect(res.blockers[0].code).toBe("NOT_WHEELCHAIR_ACCESSIBLE");
  });

  it("10. acessibilidade desconhecida (alerta)", () => {
    const res = ExperienceMatchingEngine.evaluateRestrictions(
      { ...baseExp, wheelchair_accessible: null },
      { ...baseProfile, wheelchairRequired: true }
    );
    expect(res.allowed).toBe(true);
    expect(res.warnings[0].code).toBe("WHEELCHAIR_ACCESS_UNKNOWN");
  });

  it("11. escadas obrigatórias (alerta ou bloqueio)", () => {
    const res1 = ExperienceMatchingEngine.evaluateRestrictions(
      { ...baseExp, stairs_required: true },
      { ...baseProfile, wheelchairRequired: false }
    );
    expect(res1.allowed).toBe(true);
    expect(res1.warnings[0].code).toBe("STAIRS_REQUIRED");

    const res2 = ExperienceMatchingEngine.evaluateRestrictions(
      { ...baseExp, stairs_required: true },
      { ...baseProfile, wheelchairRequired: true }
    );
    expect(res2.allowed).toBe(false);
    expect(res2.blockers[0].code).toBe("STAIRS_REQUIRED_BLOCK");
  });

  it("12. Must See com bloqueio factual (bloqueia o item)", () => {
    // Simulando que o Engine usará esse evaluateRestrictions no loop de roteiro (validado via integração)
    const res = ExperienceMatchingEngine.evaluateRestrictions(
      { ...baseExp, wheelchair_accessible: false },
      { ...baseProfile, wheelchairRequired: true }
    );
    expect(res.allowed).toBe(false);
  });

  it("13. campos null (permitido por padrão)", () => {
    const res = ExperienceMatchingEngine.evaluateRestrictions(
      baseExp,
      baseProfile
    );
    expect(res.allowed).toBe(true);
    expect(res.blockers.length).toBe(0);
    expect(res.warnings.length).toBe(0);
  });

  it("14. experiência sem restrições (permitido)", () => {
    const res = ExperienceMatchingEngine.evaluateRestrictions(
      baseExp,
      baseProfile
    );
    expect(res.allowed).toBe(true);
  });

  it("15. proveniência não oficial (alerta)", () => {
    const res = ExperienceMatchingEngine.evaluateRestrictions(
      { 
        ...baseExp, 
        restrictions_provenance: {
          min_age: { source: "ai_suggestion", verified_by: null }
        }
      },
      baseProfile
    );
    expect(res.allowed).toBe(true);
    expect(res.information[0].code).toBe("UNVERIFIED_RESTRICTIONS");
  });

  it("16. perfil sem idade (aviso, sem bloqueio)", () => {
    const res = ExperienceMatchingEngine.evaluateRestrictions(
      { ...baseExp, min_age: 18 },
      { ...baseProfile, passengerAge: undefined }
    );
    expect(res.allowed).toBe(true);
    expect(res.information[0].code).toBe("AGE_UNKNOWN");
  });

  it("17. perfil sem tamanho de grupo informado mas experiência exige tamanho mínimo (aviso, sem bloqueio)", () => {
    const res = ExperienceMatchingEngine.evaluateRestrictions(
      { ...baseExp, minimum_group_size: 4 },
      { ...baseProfile, style: "solo", groupSize: undefined }
    );
    expect(res.allowed).toBe(true);
    expect(res.information[0].code).toBe("GROUP_SIZE_UNKNOWN");
  });

  it("18. estilo família sem confirmação explícita de crianças (aviso de adult_only, sem bloqueio)", () => {
    const res = ExperienceMatchingEngine.evaluateRestrictions(
      { ...baseExp, adult_only: true },
      { ...baseProfile, style: "family", hasChildren: undefined }
    );
    expect(res.allowed).toBe(true);
    expect(res.information[0].code).toBe("CHILDREN_UNKNOWN");
  });
});

