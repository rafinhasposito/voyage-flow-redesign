import { describe, test, expect } from 'vitest';
import { SchedulerV1 } from '../schedulerV1';
import { EngineInputBuilder } from '../inputBuilder';

describe('Engine V2 Regression Tests (Phase B Semantic Rules)', () => {

  test('Deve aplicar todas as regras de proteção temporal e semântica', async () => {
    const mockTrip: any = {
       id: 'test-trip-f116',
       start_date: '2026-08-01',
       end_date: '2026-08-05',
       destination: 'New York, USA',
       preferences: { pace: 'intense', interests: [] }
    };

    const mockReservations: any[] = [
      { type: 'flight', id: 'flight-arr', structured_data: { flight_number: '100', arrival_local_datetime: '2026-08-01T08:00:00Z' } },
      { type: 'hotel', id: 'hotel-1', title: 'Arlo NoMad', latitude: 40.7, longitude: -73.9 }
    ];
    
    const mockCatalog: any[] = [
      { id: "ktown", title: "Jantar K-Town", category: "Restaurant", tags: ["gastronomia", "cultura_coreana", "noite"], duration_minutes: 120 },
      { id: "edge", title: "Festa no The Edge", category: "Entertainment", tags: ["rooftop", "noite", "luxo"], duration_minutes: 120 },
      { id: "shake", title: "Shake Shack", category: "Restaurant", tags: ["hamburguer", "rápido"], duration_minutes: 90 },
      { id: "joes", title: "Joe's Pizza", category: "Restaurant", tags: ["pizza", "times_square"], duration_minutes: 90 },
      { id: "tick", title: "Tick Tock Diner NY", category: "Restaurant", tags: ["café da manhã", "casual"], duration_minutes: 120 },
      { id: "brunch", title: "Sunday Brunch", category: "Restaurant", tags: ["brunch", "weekend"], duration_minutes: 120 },
      { id: "one40", title: "One40 Rooftop Bar", category: "Rooftop", tags: ["rooftop", "view", "almoço"], duration_minutes: 120 },
      { id: "timeout", title: "Time Out Market Rooftop", category: "Rooftop", tags: ["rooftop", "dia"], duration_minutes: 120 },
      { id: "press", title: "The Press Lounge", category: "Rooftop", tags: ["rooftop"], duration_minutes: 120 }
    ];

    const input = EngineInputBuilder.build(mockTrip, mockReservations, mockCatalog);
    mockCatalog.forEach(c => input.matchVotes[c.id] = 'yes');
    input.matchVotes["press"] = "maybe"; // Will be used for Repair Pass test

    const draft = await SchedulerV1.generate(input);
    
    const getScheduledStartTime = (id: string) => {
       let st = '';
       draft.days.forEach(d => d.activities.forEach(a => { if (a.id === id) st = a.startTime; }));
       return st ? Number(st.split('T')[1].substring(0, 2)) : -1;
    };
    
    // máximo de dois rooftops na viagem;
    let totalRooftops = 0;
    draft.days.forEach(d => d.activities.forEach(a => {
        if (['one40', 'timeout', 'press'].includes(a.id)) totalRooftops++;
    }));
    expect(totalRooftops).toBeLessThanOrEqual(2);

    // máximo de um rooftop por dia;
    let maxRooftopPerDay = 0;
    draft.days.forEach(d => {
        let dailyR = 0;
        d.activities.forEach(a => { if (['one40', 'timeout', 'press'].includes(a.id)) dailyR++; });
        if (dailyR > maxRooftopPerDay) maxRooftopPerDay = dailyR;
    });
    expect(maxRooftopPerDay).toBeLessThanOrEqual(1);
    
    // Jantar K-Town após 18h;
    const ktownHour = getScheduledStartTime('ktown');
    expect(ktownHour >= 18 || ktownHour === -1).toBe(true);

    // Festa no The Edge no período noturno;
    const edgeHour = getScheduledStartTime('edge');
    expect(edgeHour >= 18 || edgeHour === -1).toBe(true);
    
    // máximo de uma refeição principal na chegada;
    let mealsArrivalDay = 0;
    draft.days[0].activities.forEach(a => {
       if (['shake', 'joes', 'ktown', 'brunch', 'tick'].includes(a.id)) mealsArrivalDay++;
    });
    expect(mealsArrivalDay).toBeLessThanOrEqual(1);
    
    // diner e brunch não consecutivos;
    const tickHour = getScheduledStartTime('tick');
    const brunchHour = getScheduledStartTime('brunch');
    const consec = (tickHour !== -1 && brunchHour !== -1 && Math.abs(tickHour - brunchHour) < 3.5);
    expect(consec).toBe(false);
    
    // zero Critical Issues após Repair Pass;
    const hasCritical = draft.days.some(d => d.warnings.length > 0 && (d.warnings.some(w => w.includes('OVERLOAD') || w.includes('DUPLICATE') || w.includes('INVALID'))));
    expect(hasCritical).toBe(false);
    
    // último dia protegido sem voo e integração bloqueada quando a partida estiver ausente.
    const isProtected = draft.days[draft.days.length - 1].activities.length === 0;
    expect(isProtected).toBe(true);
  });
});
