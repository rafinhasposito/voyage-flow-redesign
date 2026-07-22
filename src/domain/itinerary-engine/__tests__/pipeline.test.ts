import { describe, test, expect } from 'vitest';
import { EngineInputBuilder } from '../inputBuilder';
import { SchedulerV1 } from '../schedulerV1';
import { LocalDeterministicGeoProvider } from '../geoProvider';

describe('Engine V2 Phase C Pipeline Integration Test', () => {
  test('Deve processar dados geográficos reais, propagar coordenadas e gerar RouteSegments', async () => {
    // 1. Mock do objeto retornado pelo TripRepository
    const mockTrip = {
       id: 'trip-f116cf27',
       start_date: '2026-08-01',
       end_date: '2026-08-05',
       destination: 'New York, USA',
       preferences: { pace: 'balanced', matchVotes: {
         'joes-pizza': 'yes',
         'exchange-place': 'yes',
         'timeout-market': 'yes'
       }}
    };

    // 2. Mock dos objetos do ExperienceRepository com a estrutura real (location_lat / location_lng)
    const mockCatalog = [
      { 
        id: "joes-pizza", 
        title: "Joe's Pizza", 
        category: "Restaurant", 
        tags: ["pizza"], 
        duration_minutes: 60,
        location_lat: 40.7547051,
        location_lng: -73.9870157
      },
      { 
        id: "exchange-place", 
        title: "Exchange Place", 
        category: "Entertainment", 
        tags: ["view"], 
        duration_minutes: 90,
        location_lat: 40.7161048,
        location_lng: -74.0330907
      },
      { 
        id: "timeout-market", 
        title: "Time Out Market Rooftop", 
        category: "Rooftop", 
        tags: ["rooftop", "gastronomia"], 
        duration_minutes: 120,
        location_lat: 40.7029052,
        location_lng: -73.990118
      }
    ];

    const mockReservations: any[] = [
      {
         type: 'hotel',
         id: 'fake-hotel-id',
         title: 'Hotel Fake',
         latitude: undefined, // Sem GPS propositalmente
         longitude: undefined
      }
    ];

    // 3. EngineInputBuilder (Passo 1 do pipeline)
    const input = EngineInputBuilder.build(mockTrip, mockReservations, mockCatalog);
    
    // Assegurar que input não dropa propriedades não-tipadas do array catalog
    expect(input.catalog[0].location_lat).toBe(40.7547051);

    // 4. Injetar Geo Provider
    const geoProvider = new LocalDeterministicGeoProvider();
    
    // 5. Executar o Scheduler (Passo 2 e 3 do pipeline)
    const draft = await SchedulerV1.generate(input, geoProvider);

    let hasGPSCount = 0;
    let generatedSegments = 0;
    let segmentsValid = true;

    draft.days.forEach(day => {
       day.activities.forEach(act => {
          if (act.coordinates) hasGPSCount++;
          if (act.source === 'transit') {
            generatedSegments++;
            // Verifica se o segmento segue a regra
            expect(act.routeEstimate).toBeDefined();
            if (act.routeEstimate) {
              expect(act.routeEstimate.estimate.source).toBe('local_fallback');
              expect(act.routeEstimate.estimate.confidence).toBe('low');
              expect(act.routeEstimate.estimate.distanceMeters).toBeGreaterThan(0);
              expect(act.routeEstimate.estimate.durationMinutes).toBeGreaterThan(0);
              
              // Segurança temporal
              const st = new Date(act.startTime).getTime();
              const et = new Date(act.endTime).getTime();
              expect(et).toBeGreaterThanOrEqual(st); // Não cria sobreposição negativa
              // O tempo alocado deve ser suficiente ou ajustado para não sobrepor a reserva/atividade
              expect(act.type).toBe('logistics');
              expect(act.isFixed).toBe(false);
            }
          }
       });
    });

    // Validar se gerou segmento entre os itens do dia (se foram alocados no mesmo dia)
    expect(generatedSegments).toBeGreaterThan(0);
    
    // Basecamp sem GPS, então readiness será INSUFFICIENT_DATA (com base na correção)
    expect(draft.geographicReadiness).toBe('INSUFFICIENT_DATA');
    
    // Se o basecamp tivesse GPS, testaríamos tbm.
  });
});
