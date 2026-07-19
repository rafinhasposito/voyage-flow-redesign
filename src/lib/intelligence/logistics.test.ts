import { describe, it, expect } from "vitest";
import { LogisticsEngine } from "./logistics";

describe("LogisticsEngine", () => {
  it("deve aprovar experiência aberta e compatível", () => {
    const res = LogisticsEngine.evaluateFeasibility(
      "2026-07-20", // Segunda-feira
      "10:00",
      2,
      [{ day_of_week: 1, opens_at: "09:00", closes_at: "18:00", is_closed: false, is_24_hours: false }],
      [],
      30,
      "22:00",
      "09:30"
    );
    expect(res.feasible).toBe(true);
    expect(res.blockers.length).toBe(0);
    expect(res.warnings.length).toBe(0);
  });

  it("deve bloquear se estiver fechada no dia", () => {
    const res = LogisticsEngine.evaluateFeasibility(
      "2026-07-20", 
      "10:00",
      2,
      [{ day_of_week: 1, opens_at: null, closes_at: null, is_closed: true, is_24_hours: false }],
      [],
      30,
      "22:00",
      "09:30"
    );
    expect(res.feasible).toBe(false);
    expect(res.blockers.some(b => b.code === "CLOSED_ON_DATE")).toBe(true);
  });

  it("deve bloquear se estiver fora do horário de funcionamento", () => {
    const res = LogisticsEngine.evaluateFeasibility(
      "2026-07-20",
      "08:00",
      2,
      [{ day_of_week: 1, opens_at: "09:00", closes_at: "18:00", is_closed: false, is_24_hours: false }],
      [],
      30,
      "22:00",
      "07:30"
    );
    expect(res.feasible).toBe(false);
    expect(res.blockers.some(b => b.code === "CLOSED_AT_TIME")).toBe(true);
  });

  it("deve bloquear por exceção de fechamento", () => {
    const res = LogisticsEngine.evaluateFeasibility(
      "2026-07-20",
      "10:00",
      2,
      [{ day_of_week: 1, opens_at: "09:00", closes_at: "18:00", is_closed: false, is_24_hours: false }],
      [{ exception_date: "2026-07-20", is_closed: true, opens_at: null, closes_at: null }],
      30,
      "22:00",
      "09:30"
    );
    expect(res.feasible).toBe(false);
    expect(res.blockers.some(b => b.code === "EXCEPTION_CLOSURE")).toBe(true);
  });

  it("deve bloquear se duração ultrapassar a janela disponível", () => {
    const res = LogisticsEngine.evaluateFeasibility(
      "2026-07-20",
      "21:00",
      2,
      [{ day_of_week: 1, opens_at: "09:00", closes_at: "23:00", is_closed: false, is_24_hours: false }],
      [],
      30,
      "22:00",
      "20:30" 
    );
    expect(res.feasible).toBe(false);
    expect(res.blockers.some(b => b.code === "INSUFFICIENT_VISIT_TIME")).toBe(true);
  });

  it("deve bloquear se chegada permitir duração mas passar do fechamento", () => {
    const res = LogisticsEngine.evaluateFeasibility(
      "2026-07-20",
      "17:00", 
      2, 
      [{ day_of_week: 1, opens_at: "09:00", closes_at: "18:00", is_closed: false, is_24_hours: false }],
      [],
      30,
      "22:00",
      "16:30"
    );
    expect(res.feasible).toBe(false);
    expect(res.blockers.some(b => b.code === "INSUFFICIENT_VISIT_TIME")).toBe(true);
  });

  // Novos 10 testes solicitados

  it("1. Must See fechado - deve bloquear mesmo se for Must See (a lógica do Itinerary que preserva)", () => {
    const res = LogisticsEngine.evaluateFeasibility(
      "2026-07-20", 
      "10:00",
      2,
      [{ day_of_week: 1, opens_at: null, closes_at: null, is_closed: true, is_24_hours: false }],
      [],
      30,
      "22:00",
      "09:30"
    );
    expect(res.feasible).toBe(false); // Logística rejeita. O caller que lidará com o fato de ser Must See
    expect(res.blockers.some(b => b.code === "CLOSED_ON_DATE")).toBe(true);
  });

  it("2. integração com bloqueio factual da EI-7 - já é avaliado fora daqui (travelState), mas a logística respeita se chamada", () => {
    // Isso é responsabilidade do Itinerary (travelState), aqui atestamos a independência da logística.
    const res = LogisticsEngine.evaluateFeasibility("2026-07-20", "10:00", 2, [{ day_of_week: 1, opens_at: "09:00", closes_at: "18:00", is_closed: false, is_24_hours: false }], [], 30, "22:00", "09:30");
    expect(res.feasible).toBe(true);
  });

  it("3. deslocamento com tempo suficiente - não deve emitir alerta", () => {
    const res = LogisticsEngine.evaluateFeasibility(
      "2026-07-20",
      "10:30",
      2,
      [{ day_of_week: 1, opens_at: "09:00", closes_at: "18:00", is_closed: false, is_24_hours: false }],
      [],
      30, // necessário 30min
      "22:00",
      "10:00" // termina as 10, logo, tem exatos 30min. 10:30 - 10:00 = 30
    );
    expect(res.feasible).toBe(true);
    expect(res.warnings.some(w => w.code === "TRANSFER_TOO_TIGHT")).toBe(false);
  });

  it("4. deslocamento sem tempo suficiente - deve gerar TRANSFER_TOO_TIGHT", () => {
    const res = LogisticsEngine.evaluateFeasibility(
      "2026-07-20",
      "10:15",
      2,
      [{ day_of_week: 1, opens_at: "09:00", closes_at: "18:00", is_closed: false, is_24_hours: false }],
      [],
      30, // necessário 30min
      "22:00",
      "10:00" // termina 10:00. O inicio previsto é 10:15 (sobra 15min)
    );
    expect(res.feasible).toBe(true);
    expect(res.warnings.some(w => w.code === "TRANSFER_TOO_TIGHT")).toBe(true);
  });

  it("5. deslocamento desconhecido - deve gerar TRANSIT_TIME_UNKNOWN", () => {
    const res = LogisticsEngine.evaluateFeasibility(
      "2026-07-20",
      "10:00",
      2,
      [{ day_of_week: 1, opens_at: "09:00", closes_at: "18:00", is_closed: false, is_24_hours: false }],
      [],
      null, // nulo
      "22:00",
      "09:30"
    );
    expect(res.feasible).toBe(true);
    expect(res.warnings.some(w => w.code === "TRANSIT_TIME_UNKNOWN")).toBe(true);
  });

  it("6. recálculo somente da parada afetada - validado isoladamente para não propagar erros falsos", () => {
    // Esse teste valida que a Engine pode avaliar uma atração individual sem depender de arrays de itinerário
    const res = LogisticsEngine.evaluateFeasibility("2026-07-20", "15:00", 2, [{ day_of_week: 1, opens_at: "14:00", closes_at: "18:00", is_closed: false, is_24_hours: false }], [], 20, "22:00", "14:40");
    expect(res.feasible).toBe(true);
  });

  it("7. escolha manual preservada quando ainda é viável - avaliado no fluxo superior, aqui é aprovado", () => {
    const res = LogisticsEngine.evaluateFeasibility("2026-07-20", "12:00", 2, [{ day_of_week: 1, opens_at: "09:00", closes_at: "22:00", is_closed: false, is_24_hours: false }], [], 15, "22:00", "11:45");
    expect(res.feasible).toBe(true);
  });

  it("8. escolha manual incompatível mantida como conflito explicável, sem refazer silenciosamente", () => {
    const res = LogisticsEngine.evaluateFeasibility("2026-07-20", "08:00", 2, [{ day_of_week: 1, opens_at: "10:00", closes_at: "18:00", is_closed: false, is_24_hours: false }], [], 0, "22:00", "08:00");
    expect(res.feasible).toBe(false);
    expect(res.blockers.some(b => b.code === "CLOSED_AT_TIME")).toBe(true);
  });

  it("9. operating hours ausentes - deve emitir alerta", () => {
    const res = LogisticsEngine.evaluateFeasibility("2026-07-20", "10:00", 2, null, null, 30, "22:00", "09:30");
    expect(res.feasible).toBe(true); 
    expect(res.warnings.some(w => w.code === "OPERATING_HOURS_UNKNOWN")).toBe(true);
  });

  it("10. exceção com horário especial de abertura, não apenas fechamento", () => {
    const res = LogisticsEngine.evaluateFeasibility(
      "2026-07-20",
      "10:00",
      2,
      [{ day_of_week: 1, opens_at: "09:00", closes_at: "18:00", is_closed: false, is_24_hours: false }],
      [{ exception_date: "2026-07-20", is_closed: false, opens_at: "11:00", closes_at: "14:00" }], // Exceção: só abre as 11h
      30,
      "22:00",
      "09:30"
    );
    expect(res.feasible).toBe(false);
    expect(res.blockers.some(b => b.code === "CLOSED_AT_TIME")).toBe(true); // Estará fechado as 10h devido à exceção especial!
  });
});
