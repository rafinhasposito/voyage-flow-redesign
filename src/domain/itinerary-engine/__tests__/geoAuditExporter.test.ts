import { describe, test, expect } from 'vitest';
import { GeoAuditExporter } from '../geoAuditExporter';
import { TripEngineInputV1 } from '../contracts';
import { ItineraryDraftV1 } from '../schedulerV1';

describe('GeoAuditExporter', () => {
  test('Deve exportar corretamente o Basecamp e Atividades sem expor chaves ou sessões', () => {
    
    // Mock do inputData com catalog e basecamp
    const inputData: TripEngineInputV1 = {
      tripId: 'trip-123',
      startDate: '2026-08-01',
      endDate: '2026-08-02',
      preferences: { pace: 'balanced', matchVotes: {} },
      fixedReservations: [],
      flexibleReservations: [],
      catalog: [
        { id: 'exp-1', title: 'Exp 1', location_lat: 10, location_lng: 20 },
        { id: 'exp-2', title: 'Exp 2 sem GPS' },
        { id: 'exp-3', title: 'Exp 3 Invalida', latitude: NaN, longitude: 0 },
      ],
      basecamp: {
        id: 'hotel-1',
        name: 'Hotel com GPS',
        lat: 40,
        lng: -74
      }
    };

    const draft: ItineraryDraftV1 = {
      days: [
        {
          date: '2026-08-01',
          activities: [
            { id: 'exp-1', title: 'Exp 1', type: 'experience', startTime: '', isFixed: false, source: 'catalog', isWindow: false, coordinates: { lat: 10, lng: 20 } },
            { id: 'exp-2', title: 'Exp 2 sem GPS', type: 'experience', startTime: '', isFixed: false, source: 'catalog', isWindow: false },
            { id: 'exp-3', title: 'Exp 3 Invalida', type: 'experience', startTime: '', isFixed: false, source: 'catalog', isWindow: false, coordinates: { lat: NaN, lng: 0 } },
            { id: 'flight-1', title: 'Voo ignorado pelo exporter', type: 'flight', startTime: '', isFixed: true, source: 'reservation', isWindow: false }
          ],
          warnings: []
        }
      ],
      geoHealthIssues: [],
      temporalReadiness: true,
      semanticReadiness: true,
      geographicReadiness: 'READY',
      integrationReadiness: true,
      overallWarnings: []
    };

    const exportData = GeoAuditExporter.build(inputData, draft, 'trip-123');

    // Asserts
    expect(exportData.tripId).toBe('trip-123');
    
    // Basecamp tests
    expect(exportData.basecamp).toBeDefined();
    expect(exportData.basecamp.situation).toBe('valid_gps');
    expect(exportData.basecamp.lat).toBe(40);
    
    // Draft Activities tests
    expect(exportData.draftActivities).toHaveLength(3); // Excludes flight
    
    const exp1 = exportData.draftActivities.find((a: any) => a.id === 'exp-1');
    expect(exp1.situation).toBe('valid_gps');
    expect(exp1.lat).toBe(10);
    expect(exp1.diagnostics.catalogFields.location_lat).toBe(10);

    const exp2 = exportData.draftActivities.find((a: any) => a.id === 'exp-2');
    expect(exp2.situation).toBe('missing_gps');
    
    const exp3 = exportData.draftActivities.find((a: any) => a.id === 'exp-3');
    expect(exp3.situation).toBe('invalid_gps');

    // Summary tests
    expect(exportData.summary.totalEntities).toBe(4); // 1 basecamp + 3 experiences
    expect(exportData.summary.validGps).toBe(2); // Hotel + Exp 1
    expect(exportData.summary.missingGps).toBe(1); // Exp 2
    expect(exportData.summary.invalidGps).toBe(1); // Exp 3
    expect(exportData.summary.coveragePercent).toBe(50); // 2 / 4 = 50%
    expect(exportData.summary.basecampHasGps).toBe(true);

    // Possible segments (Hotel -> Exp 1 = 1 segment)
    expect(exportData.summary.possibleSegments).toBe(1);

    // Security Check: No tokens or keys leaked
    const jsonStr = JSON.stringify(exportData);
    expect(jsonStr).not.toMatch(/token/i);
    expect(jsonStr).not.toMatch(/secret/i);
    expect(jsonStr).not.toMatch(/key/i);
  });
});
