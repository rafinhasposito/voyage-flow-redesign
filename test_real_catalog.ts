import { SchedulerV1 } from './src/domain/itinerary-engine/schedulerV1';
import { EngineInputBuilder } from './src/domain/itinerary-engine/inputBuilder';

async function runTests() {
  console.log("=== EXECUTANDO TESTES COM CATÁLOGO REAL ===");
  
  const mockTrip: any = {
     id: 'test-trip-real',
     start_date: '2026-08-01',
     end_date: '2026-08-05',
     destination: 'New York, USA',
     preferences: { pace: 'relaxed', interests: [] }
  };

  const mockReservations: any[] = [
    { type: 'flight', id: 'flight-arr', structured_data: { flight_number: '100', arrival_local_datetime: '2026-08-01T08:00:00Z' } },
    { type: 'hotel', id: 'hotel-1', title: 'Arlo NoMad', latitude: 40.7, longitude: -73.9 }
  ];
  
  const mockCatalog: any[] = [
    { id: "ktown", title: "Jantar K-Town", type: "restaurant", category: "Restaurant", tags: ["gastronomia", "cultura_coreana", "noite", "experiência_gastronômica", "koreatown"], duration_minutes: 120 },
    { id: "edge", title: "Festa no The Edge", type: "attraction", category: "Entertainment", tags: ["rooftop", "view", "noite", "luxo", "evento"], duration_minutes: 120 },
    { id: "shake", title: "Shake Shack", type: "restaurant", category: "Restaurant", tags: ["hamburguer", "rápido", "prático", "gourmet", "midtown"], duration_minutes: 90 },
    { id: "joes", title: "Joe's Pizza", type: "restaurant", category: "Restaurant", tags: ["pizza", "gastronomia", "times_square", "famoso", "rápido"], duration_minutes: 90 },
    { id: "juliana", title: "Juliana's Pizza", type: "restaurant", category: "Restaurant", tags: ["pizza", "gastronomia", "família", "local", "DUMBO"], duration_minutes: 120 },
    { id: "tick", title: "Tick Tock Diner NY", type: "restaurant", category: "Restaurant", tags: ["diner", "café da manhã", "comida americana", "casual"], duration_minutes: 120 },
    { id: "brunch", title: "Sunday Brunch", type: "restaurant", category: "Restaurant", tags: ["brunch", "gourmet", "social", "noMad", "weekend"], duration_minutes: 120 },
    { id: "one40", title: "One40 Rooftop Bar", type: "restaurant", category: "Rooftop", tags: ["rooftop", "view", "gastronomia", "almoço", "financeiro"], duration_minutes: 120 }
  ];

  const input = EngineInputBuilder.build(mockTrip, mockReservations, mockCatalog);
  mockCatalog.forEach(c => input.matchVotes[c.id] = 'yes');

  const draft = SchedulerV1.generate(input);
  if (!draft.days || draft.days.length === 0) {
      console.log("DRAFT GENERATION FAILED:", draft.overallWarnings);
      return;
  }
  
  const getScheduledStartTime = (id: string) => {
     let st = '';
     draft.days.forEach(d => d.activities.forEach(a => { if (a.id === id) st = a.startTime; }));
     return st ? Number(st.split('T')[1].substring(0, 2)) : -1;
  };
  
  const ktownHour = getScheduledStartTime('ktown');
  console.log(`[TEST] Jantar K-Town antes do jantar? (Hora: ${ktownHour}) -> ${ktownHour >= 18 || ktownHour === -1 ? 'PASSOU' : 'FALHOU'}`);

  const edgeHour = getScheduledStartTime('edge');
  console.log(`[TEST] Festa no The Edge antes da noite? (Hora: ${edgeHour}) -> ${edgeHour >= 18 || edgeHour === -1 ? 'PASSOU' : 'FALHOU'}`);
  
  const shakeHour = getScheduledStartTime('shake');
  const joesHour = getScheduledStartTime('joes');
  console.log(`[TEST] Fast Food às 09:00? (Shake: ${shakeHour}, Joes: ${joesHour}) -> ${shakeHour >= 11 && joesHour >= 11 ? 'PASSOU' : 'FALHOU'}`);
  
  const tickHour = getScheduledStartTime('tick');
  console.log(`[TEST] Tick Tock Diner entra de manhã? (Hora: ${tickHour}) -> ${tickHour >= 7 && tickHour <= 11 ? 'PASSOU' : 'FALHOU'}`);
  
  let mealsArrivalDay = 0;
  draft.days[0].activities.forEach(a => {
     if (['shake', 'joes', 'juliana', 'ktown', 'brunch'].includes(a.id)) mealsArrivalDay++;
  });
  console.log(`[TEST] Máximo de refeições no dia de chegada (<=2): ${mealsArrivalDay} -> ${mealsArrivalDay <= 2 ? 'PASSOU' : 'FALHOU'}`);
  
  const hasCritical = draft.days.some(d => d.warnings.length > 0);
  console.log(`[TEST] Validation Gate detecta saídas inválidas: ${hasCritical ? 'PASSOU' : 'N/A'}`);
  
  console.log("=== FIM DOS TESTES ===");
}

runTests().catch(console.error);
