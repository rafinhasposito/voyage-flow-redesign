import { SchedulerV1 } from './src/domain/itinerary-engine/schedulerV1';
import { EngineInputBuilder } from './src/domain/itinerary-engine/inputBuilder';

async function runTests() {
  console.log("=== EXECUTANDO TESTES DE REGRESSÃO DA FASE B ===");
  
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

  const draft = SchedulerV1.generate(input);
  
  const getScheduledStartTime = (id: string) => {
     let st = '';
     draft.days.forEach(d => d.activities.forEach(a => { if (a.id === id) st = a.startTime; }));
     return st ? Number(st.split('T')[1].substring(0, 2)) : -1;
  };
  
  let totalRooftops = 0;
  draft.days.forEach(d => d.activities.forEach(a => {
      if (['one40', 'timeout', 'press'].includes(a.id)) totalRooftops++;
  }));
  console.log(`[TEST] Máximo de dois rooftops na viagem (global limit): ${totalRooftops} -> ${totalRooftops <= 2 ? 'PASSOU' : 'FALHOU'}`);

  let maxRooftopPerDay = 0;
  draft.days.forEach(d => {
      let dailyR = 0;
      d.activities.forEach(a => { if (['one40', 'timeout', 'press'].includes(a.id)) dailyR++; });
      if (dailyR > maxRooftopPerDay) maxRooftopPerDay = dailyR;
  });
  console.log(`[TEST] Máximo de um rooftop por dia: ${maxRooftopPerDay} -> ${maxRooftopPerDay <= 1 ? 'PASSOU' : 'FALHOU'}`);
  
  const ktownHour = getScheduledStartTime('ktown');
  console.log(`[TEST] Jantar K-Town depois das 18h: ${ktownHour} -> ${ktownHour >= 18 || ktownHour === -1 ? 'PASSOU' : 'FALHOU'}`);

  const edgeHour = getScheduledStartTime('edge');
  console.log(`[TEST] Festa no The Edge no período noturno: ${edgeHour} -> ${edgeHour >= 18 || edgeHour === -1 ? 'PASSOU' : 'FALHOU'}`);
  
  let mealsArrivalDay = 0;
  draft.days[0].activities.forEach(a => {
     if (['shake', 'joes', 'ktown', 'brunch', 'tick'].includes(a.id)) mealsArrivalDay++;
  });
  console.log(`[TEST] Máximo de uma refeição principal no dia de chegada (<=1): ${mealsArrivalDay} -> ${mealsArrivalDay <= 1 ? 'PASSOU' : 'FALHOU'}`);
  
  const tickHour = getScheduledStartTime('tick');
  const brunchHour = getScheduledStartTime('brunch');
  const consec = (tickHour !== -1 && brunchHour !== -1 && Math.abs(tickHour - brunchHour) < 3.5);
  console.log(`[TEST] Não haver Tick Tock e Brunch consecutivos: ${!consec ? 'PASSOU' : 'FALHOU'}`);
  
  const hasCritical = draft.days.some(d => d.warnings.length > 0 && (d.warnings.some(w => w.includes('OVERLOAD') || w.includes('DUPLICATE') || w.includes('INVALID'))));
  console.log(`[TEST] Zero Critical Issues no draft final (Após Repair Pass): ${!hasCritical ? 'PASSOU' : 'FALHOU'}`);
  
  const isProtected = draft.days[draft.days.length - 1].activities.length === 0;
  console.log(`[TEST] Último dia protegido (sem atividades pois não há voo): ${isProtected ? 'PASSOU' : 'FALHOU'}`);
  
  console.log("=== FIM DOS TESTES ===");
}

runTests().catch(console.error);
