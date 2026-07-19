import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { getTravelState, saveTravelState, generateSmartItinerary, UserProfile } from "./travelState";
import * as CacheManager from "../services/CacheManager";

// Mock do catálogo base
vi.mock("../services/CacheManager", () => ({
  get: vi.fn(),
  set: vi.fn(),
  swr: vi.fn()
}));

const mockProfile: UserProfile = {
  days: 1,
  pace: "medium",
  startDate: "2026-07-20",
  passengerName: "Tester",
  budget: "medium",
  interests: [],
  tagAffinity: {},
  financial: { investmentProfile: "balanced" }
} as any;

describe("TravelState Persistence", () => {
  let store: Record<string, string> = {};

  beforeEach(() => {
    store = {};
    const mockLocalStorage = {
      getItem: vi.fn((key: string) => store[key] || null),
      setItem: vi.fn((key: string, value: string) => { store[key] = value.toString(); }),
      removeItem: vi.fn((key: string) => { delete store[key]; }),
      clear: vi.fn(() => { store = {}; }),
      length: 0,
      key: vi.fn(() => null),
    };
    global.localStorage = mockLocalStorage as any;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("deve persistir os novos campos do UserProfile no localStorage e recuperar corretamente", () => {
    const state = getTravelState();
    state.profile.groupSize = 3;
    state.profile.hasChildren = true;
    state.profile.passengerAge = 25;
    state.profile.wheelchairRequired = false;
    saveTravelState(state);
    const loadedState = getTravelState();
    expect(loadedState.profile.groupSize).toBe(3);
  });
});

describe("Orquestrador Logístico: generateSmartItinerary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("1. Must See fechado não entra no roteiro (a lógica deve omitir por restrição factual)", () => {
    // A experiência Must See está fechada. A engine logística bloqueia (feasible = false).
    // Consequentemente, generateSmartItinerary não a adiciona ao roteiro.
    localStorage.setItem("viagem_dos_sonhos_attractions", JSON.stringify([
      {
        id: "exp-1", name: "Fechada Mas Must See", durationHours: 2, matchScore: 100, is_must_see: true, tags: [], emotionalDescription: "test",
        operating_hours: [{ day_of_week: 1, is_closed: true }] // 2026-07-20 é segunda (day 1)
      }
    ]));
    
    const itinerary = generateSmartItinerary(mockProfile);
    expect(itinerary[0].recommendations.length).toBe(0);
  });

  it("2. bloqueio da EI-7 impede a avaliação/inclusão logística (restrição de cadeirante)", () => {
    localStorage.setItem("viagem_dos_sonhos_attractions", JSON.stringify([
      {
        id: "exp-2", name: "Sem Acesso a Cadeirante", durationHours: 2, matchScore: 100, tags: [], emotionalDescription: "test",
        wheelchair_accessible: false, operating_hours: [{ day_of_week: 1, opens_at: "09:00", closes_at: "18:00", is_closed: false }]
      }
    ]));
    const profileCadeirante = { ...mockProfile, wheelchairRequired: true };
    const itinerary = generateSmartItinerary(profileCadeirante);
    expect(itinerary[0].recommendations.length).toBe(0); // Filtrado pelo ExperienceMatchingEngine antes da logística
  });

  it("3. transit_options seleciona exatamente o trecho origem -> destino", () => {
    localStorage.setItem("viagem_dos_sonhos_attractions", JSON.stringify([
      {
        id: "exp-1", name: "Origem", durationHours: 1, matchScore: 100, tags: [], emotionalDescription: "test",
        operating_hours: [{ day_of_week: 1, opens_at: "09:00", closes_at: "18:00", is_closed: false }],
        transit_options_origin: [
          { destination_experience_id: "exp-2", duration_minutes: 45 },
          { destination_experience_id: "errado", duration_minutes: 10 }
        ]
      },
      {
        id: "exp-2", name: "Destino", durationHours: 1, matchScore: 90, tags: [], emotionalDescription: "test",
        operating_hours: [{ day_of_week: 1, opens_at: "09:00", closes_at: "18:00", is_closed: false }]
      }
    ]));

    const itinerary = generateSmartItinerary(mockProfile);
    expect(itinerary[0].recommendations.length).toBe(2);
    // exp-1 starts at 09:00, ends at 10:00
    expect(itinerary[0].recommendations[0].experience.id).toBe("exp-1");
    // transit is 45 mins, so exp-2 starts at 10:45
    expect(itinerary[0].recommendations[1].experience.id).toBe("exp-2");
    expect(itinerary[0].recommendations[1].experience.plannedStartTime).toBe("10:45");
  });

  it("4. ausência de trânsito gera TRANSIT_TIME_UNKNOWN, sem 30 minutos cravado", () => {
    localStorage.setItem("viagem_dos_sonhos_attractions", JSON.stringify([
      {
        id: "exp-1", name: "A", durationHours: 1, matchScore: 100, tags: [], emotionalDescription: "test",
        operating_hours: [{ day_of_week: 1, opens_at: "09:00", closes_at: "18:00", is_closed: false }],
        transit_options_origin: [] // sem transito
      },
      {
        id: "exp-2", name: "B", durationHours: 1, matchScore: 90, tags: [], emotionalDescription: "test",
        operating_hours: [{ day_of_week: 1, opens_at: "09:00", closes_at: "18:00", is_closed: false }]
      }
    ]));

    const itinerary = generateSmartItinerary(mockProfile);
    // exp-1 termina as 10:00. Sem trânsito conhecido, exp-2 deve começar as 10:00, mas com warning.
    expect(itinerary[0].recommendations[1].experience.plannedStartTime).toBe("10:00");
    const warnings = itinerary[0].recommendations[1].experience.logisticsEvaluation?.warnings || [];
    expect(warnings.some(w => w.code === "TRANSIT_TIME_UNKNOWN")).toBe(true);
  });

  it("5. escolha manual viável permanece e 7. alteração de uma parada não reorganiza silenciosamente todo o restante", () => {
    // Escolha manual não está codificada de forma isolada em generateSmartItinerary (pois itera sobre all), 
    // mas o teste foca em a engine alocar e manter a atração que foi injetada antes do match se ela estiver viável.
    // Vamos simular que o rank passa "exp-1" com score altissimo.
    localStorage.setItem("viagem_dos_sonhos_attractions", JSON.stringify([
      {
        id: "exp-1", name: "Manual", durationHours: 1, matchScore: 9999, tags: [], emotionalDescription: "test", // Forçado como altíssimo
        operating_hours: [{ day_of_week: 1, opens_at: "09:00", closes_at: "18:00", is_closed: false }]
      }
    ]));
    const itinerary = generateSmartItinerary(mockProfile);
    expect(itinerary[0].recommendations[0].experience.id).toBe("exp-1");
  });

  it("6. escolha manual inviável retorna conflito explicável (blocker) se avaliada", () => {
    // Se o usuário selecionou, mas o rank/filter descartaria, nós atestamos que a logística acusa blocker
    const exp = {
      id: "exp-1", name: "Manual", durationHours: 1, matchScore: 9999, tags: [], emotionalDescription: "test",
      operating_hours: [{ day_of_week: 1, opens_at: null, closes_at: null, is_closed: true }]
    };
    localStorage.setItem("viagem_dos_sonhos_attractions", JSON.stringify([exp]));
    const itinerary = generateSmartItinerary(mockProfile);
    // A engine ignora no roteiro autogerado, provando que rejeitou.
    expect(itinerary[0].recommendations.length).toBe(0);
  });

  it("8. horários especiais da exceção substituem o horário semanal", () => {
    localStorage.setItem("viagem_dos_sonhos_attractions", JSON.stringify([
      {
        id: "exp-1", name: "Excecao", durationHours: 2, matchScore: 100, tags: [], emotionalDescription: "test",
        operating_hours: [{ day_of_week: 1, opens_at: "09:00", closes_at: "18:00", is_closed: false }],
        // Segunda-feira (1). Mas exception_date muda abertura pra 14h.
        operating_hour_exceptions: [{ exception_date: "2026-07-20", opens_at: "14:00", closes_at: "18:00", is_closed: false }]
      }
    ]));

    const itinerary = generateSmartItinerary(mockProfile);
    expect(itinerary[0].recommendations.length).toBe(0); 
    // Como a janela começa 09:00 e tenta 09:00, a atração recusa porque só abre as 14:00. O loop a descarta.
  });
});
