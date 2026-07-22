import { SchedulerV1 } from './src/domain/itinerary-engine/schedulerV1';
import { EngineInputBuilder } from './src/domain/itinerary-engine/inputBuilder';
import { InputHealthValidator } from './src/domain/itinerary-engine/inputHealth';

async function runTests() {
  console.log("=== EXECUTANDO TESTES DE VALIDAÇÃO DA ENGINE V2 ===");
  
  // MOCK DATA
  const mockTrip: any = {
     id: 'test-trip-1',
     start_date: '2026-08-01',
     end_date: '2026-08-05',
     destination: 'New York, USA',
     preferences: { pace: 'relaxed', interests: [] }
  };

  const mockReservations: any[] = [
    {
       type: 'flight',
       id: 'flight-arr',
       structured_data: { flight_number: '100', arrival_local_datetime: '2026-08-01T08:00:00Z' }
    }
  ];
  
  const mockCatalog: any[] = [
    { id: 'heli-1', name: 'NYC Helicopter Tour', tags: ['helicopter'], category: 'tour' },
    { id: 'pizza-1', name: 'Joe\'s Pizza', tags: ['pizza'], category: 'food' },
    { id: 'shake-1', name: 'Shake Shack', tags: ['fast_food'], category: 'food' },
    { id: 'roof-1', name: 'One40 Rooftop Bar', tags: ['rooftop', 'bar'], category: 'nightlife' },
    { id: 'brunch-1', name: 'Sunday Brunch NYC', tags: ['brunch'], category: 'food' }
  ];

  const input = EngineInputBuilder.build(mockTrip, mockReservations, mockCatalog);
  input.basecamp = { name: 'Arlo NoMad', lat: 40.7, lng: -73.9, locationString: 'NYC' };
  
  input.matchVotes['heli-1'] = 'yes';
  input.matchVotes['pizza-1'] = 'yes';
  input.matchVotes['shake-1'] = 'yes';
  input.matchVotes['roof-1'] = 'yes';
  input.matchVotes['brunch-1'] = 'yes';

  // TEST 1: isReadyForIntegration=false com draft incompleto (sem voo de partida)
  const health = InputHealthValidator.validate(input);
  console.log(`[TEST 1] isReadyForIntegration com partida faltando: ${health.isReadyForIntegration === false ? 'PASSOU' : 'FALHOU'}`);
  
  const draft = SchedulerV1.generate(input);
  if (!draft.days || draft.days.length === 0) {
      console.log("DRAFT GENERATION FAILED:", draft.overallWarnings);
      return;
  }
  const day1 = draft.days[0];
  
  // TEST 2: Primeiro dia sem helicóptero (alta fricção)
  const hasHelicopterDay1 = day1.activities.some(a => a.id === 'heli-1');
  console.log(`[TEST 2] Dia 1 protegido contra alta fricção (Helicóptero): ${hasHelicopterDay1 === false ? 'PASSOU' : 'FALHOU'}`);

  // TEST 3: availability_window de check-in não é fixo
  const checkinAct = day1.activities.find(a => a.id === 'arr-checkin');
  console.log(`[TEST 3] Check-in é uma availability_window (isWindow): ${checkinAct?.isWindow === true ? 'PASSOU' : 'FALHOU'}`);

  // TEST 4: Refeições (Pizza/Shake) não ocupam as 09:00
  const hasPizzaMorning = day1.activities.some(a => a.id === 'pizza-1' && a.startTime.includes('T09:'));
  console.log(`[TEST 4] Pizza bloqueada às 09:00: ${hasPizzaMorning === false ? 'PASSOU' : 'FALHOU'}`);

  // TEST 5: Rooftop bar protegido
  let roofScheduled = false;
  draft.days.forEach(d => d.activities.forEach(a => { if (a.id === 'roof-1') roofScheduled = true; }));
  const hasRoofMorning = draft.days.some(d => d.activities.some(a => a.id === 'roof-1' && (a.startTime.includes('T09:') || a.startTime.includes('T11:'))));
  console.log(`[TEST 5] Rooftop Bar bloqueado no horário da manhã: ${hasRoofMorning === false ? 'PASSOU' : 'FALHOU'}`);

  // TEST 6: Ordenação cronológica e ausência de sobreposição
  let sortedAndNoOverlap = true;
  draft.days.forEach(day => {
     let lastEndMs = 0;
     const nonWindows = day.activities.filter(a => !a.isWindow);
     nonWindows.forEach(act => {
        const [h, m] = act.startTime.split('T')[1].split(':').map(Number);
        const startMs = h * 3600000 + m * 60000;
        const [eh, em] = act.endTime.split('T')[1].split(':').map(Number);
        const endMs = eh * 3600000 + em * 60000;
        
        if (startMs < lastEndMs) {
          console.log(`OVERLAP in Day ${day.date}: act start=${startMs} lastEndMs=${lastEndMs} act=${act.title}`);
          sortedAndNoOverlap = false; // overlap!
        }
        lastEndMs = endMs;
     });
  });
  console.log(`[TEST 6] Ordenação e Sobreposição Temporal: ${sortedAndNoOverlap === true ? 'PASSOU' : 'FALHOU'}`);

  // TEST 7: Último dia protegido
  const lastDay = draft.days[draft.days.length - 1];
  const hasWarningsLastDay = lastDay.warnings.some(w => w.includes('partida para liberar atividades'));
  console.log(`[TEST 7] Último dia bloqueado por falta de voo: ${hasWarningsLastDay === true ? 'PASSOU' : 'FALHOU'}`);

  console.log("=== FIM DOS TESTES ===");
}

runTests().catch(console.error);
