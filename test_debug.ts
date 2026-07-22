import { SchedulerV1 } from './src/domain/itinerary-engine/schedulerV1';
import { EngineInputBuilder } from './src/domain/itinerary-engine/inputBuilder';
const mockTrip: any = { id: 'test', start_date: '2026-08-01', end_date: '2026-08-05', destination: 'New York', preferences: { pace: 'intense', interests: [] } };
const mockReservations: any[] = [ { type: 'flight', id: 'f1', structured_data: { flight_number: '100', arrival_local_datetime: '2026-08-01T08:00:00Z' } }, { type: 'hotel', id: 'h1', title: 'Arlo', latitude: 40.7, longitude: -73.9 } ];
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
input.matchVotes["press"] = "maybe";
const draft = SchedulerV1.generate(input);
draft.days.forEach(d => console.log(d.date, d.activities.map(a => `${a.startTime.split('T')[1]} - ${a.id}`)));
