import { describe, it, expect } from 'vitest';
import { SchedulerV1 } from '../schedulerV1';
import { GeoRoutingProvider, GeoPoint, RouteEstimate } from '../contracts';

describe('Repair Pass Geográfico e Validações Finais', () => {
   it('deve reorganizar atividade flexível quando deslocamento não cabe', async () => {
       const mockGeo: GeoRoutingProvider = {
          getEstimate: async (from: GeoPoint, to: GeoPoint): Promise<RouteEstimate> => {
             return { distanceMeters: 5000, durationMinutes: 40, mode: 'transit', encodedPolyline: '' };
          }
       };

       const input = {
          engineVersion: '1.0',
          tripId: '1', destinationId: 'nyc', startDate: '2026-08-01', endDate: '2026-08-02',
          travelers: { count: 2, children: false, wheelchair: false },
          companionship: 'couple', travelProfile: 'classic', pace: 'balanced', budget: 'balanced',
          matchVotes: {}, avoidances: [], accessibilityNeeds: [],
          flightSegments: [], 
          arrivalFlight: { arrivalTime: '2026-08-01T08:00:00' }, 
          departureFlight: { departureTime: '2026-08-02T22:00:00' },
          fixedReservations: [{
             id: 'res-1', title: 'Start', type: 'reservation', date: '2026-08-01',
             startTime: '2026-08-01T09:00:00', endTime: '2026-08-01T11:00:00',
             location: 'Place A', coordinates: { lat: 40, lng: -74 }
          }],
          flexibleReservations: [],
          catalog: [
             { id: 'exp-1', title: 'Ess-a-Bagel', category: 'food', coordinates: { lat: 40.1, lng: -74.1 } }
          ],
          basecamp: undefined
       };

       const draft = await SchedulerV1.generate(input as any, mockGeo);
       const day = draft.days[0];
       
       const exp = day.activities.find(a => a.id === 'exp-1');
       expect(exp).toBeDefined();
       expect(exp!.startTime).toBe('2026-08-01T12:10:00'); 
       
       const transit = day.activities.find(a => a.type === 'logistics' && a.id.startsWith('transit'));
       expect(transit).toBeDefined();
       
       expect(draft.geoHealthIssues.filter(g => g.code === 'TRAVEL_TIME_DOES_NOT_FIT').length).toBe(0);
   });

   it('deve diagnosticar coordenadas duplicadas', async () => {
       const input = {
          startDate: '2026-08-01', endDate: '2026-08-02', matchVotes: {}, fixedReservations: [], flightSegments: [], 
          arrivalFlight: { arrivalTime: '2026-08-01T08:00:00' }, departureFlight: { departureTime: '2026-08-02T22:00:00' },
          catalog: [
             { id: 'c1', title: 'Local 1', coordinates: { lat: 10, lng: 20 } },
             { id: 'c2', title: 'Local 2', coordinates: { lat: 10, lng: 20 } }
          ]
       };
       const draft = await SchedulerV1.generate(input as any);
       const issue = draft.geoHealthIssues.find(g => g.code === 'DUPLICATE_GEOPOINT_REVIEW_REQUIRED');
       expect(issue).toBeDefined();
       expect(issue!.message).toContain('Local 1, Local 2');
   });

   it('deve definir readiness como PARTIAL se Basecamp nao tem GPS mas outros tem', async () => {
       const mockGeo: GeoRoutingProvider = {
          getEstimate: async () => ({ distanceMeters: 5000, durationMinutes: 10, mode: 'transit', encodedPolyline: '' })
       };
       const input = {
          startDate: '2026-08-01', endDate: '2026-08-02', matchVotes: {}, fixedReservations: [], flightSegments: [],
          arrivalFlight: { arrivalTime: '2026-08-01T08:00:00' }, departureFlight: { departureTime: '2026-08-02T22:00:00' },
          basecamp: { name: 'Hotel' }, 
          catalog: [
             { id: 'c1', title: 'Local 1', category: 'food', coordinates: { lat: 10, lng: 20 } },
             { id: 'c2', title: 'Local 2', category: 'attraction', coordinates: { lat: 11, lng: 21 } }
          ]
       };
       const draft = await SchedulerV1.generate(input as any, mockGeo);
       expect(draft.geographicReadiness).toBe('PARTIAL');
   });
});
