import { describe, it, expect } from 'vitest';
import { EngineInputBuilder } from '../inputBuilder';
import { SchedulerV1 } from '../schedulerV1';
import { LocalDeterministicGeoProvider } from '../geoProvider';
import { TravelExperience } from '../../../repositories/ExperienceRepository';

describe('Two Distinct Profiles Verification', () => {
  const geoProvider = new LocalDeterministicGeoProvider();
  
  const fakeCatalog: TravelExperience[] = [
    { id: 'mus-1', name: 'Museu 1', type: 'experience', category: 'Museum', costLevel: '$', experienceRole: 'culture', duration_minutes: 120, opening_hours: [{ open: '10:00', close: '18:00' }] } as any,
    { id: 'mus-2', name: 'Museu 2', type: 'experience', category: 'Museum', costLevel: '$', experienceRole: 'culture', duration_minutes: 120, opening_hours: [{ open: '10:00', close: '18:00' }] } as any,
    { id: 'roof-1', name: 'Rooftop 1', type: 'experience', category: 'Nightlife', costLevel: '$$$', experienceRole: 'nightlife', duration_minutes: 120, opening_hours: [{ open: '18:00', close: '24:00' }] } as any,
    { id: 'roof-2', name: 'Rooftop 2', type: 'experience', category: 'Nightlife', costLevel: '$$$', experienceRole: 'nightlife', duration_minutes: 120, opening_hours: [{ open: '18:00', close: '24:00' }] } as any,
  ];

  it('generates different itineraries for Cultural and Nightlife profiles', async () => {
    // Cultural Profile
    const culturalTrip = {
      id: "trip-cultural",
      start_date: "2026-08-02",
      end_date: "2026-08-05",
      preferences: {
        budget: "economic",
        pace: "slow",
        travelProfile: { interests: ["culture"] },
        match_votes: {
          'mus-1': 'yes',
          'mus-2': 'yes',
          'roof-1': 'no',
          'roof-2': 'no'
        }
      }
    } as any;

    const culturalInput = EngineInputBuilder.build(culturalTrip, [], fakeCatalog);
    const culturalDraft = await SchedulerV1.generate(culturalInput, geoProvider);

    const culturalActs = culturalDraft.days.flatMap(d => d.activities.filter(a => a.source === 'engine'));
    const culturalIds = culturalActs.map(a => a.id);

    expect(culturalIds).toContain('mus-1');
    expect(culturalIds).not.toContain('roof-1');
    expect(culturalIds).not.toContain('roof-2');
    
    // Nightlife Profile
    const nightlifeTrip = {
      id: "trip-night",
      start_date: "2026-08-02",
      end_date: "2026-08-05",
      preferences: {
        budget: "luxury",
        pace: "fast",
        travelProfile: { interests: ["nightlife"] },
        match_votes: {
          'mus-1': 'no',
          'mus-2': 'no',
          'roof-1': 'yes',
          'roof-2': 'yes'
        }
      }
    } as any;

    const nightInput = EngineInputBuilder.build(nightlifeTrip, [], fakeCatalog);
    const nightDraft = await SchedulerV1.generate(nightInput, geoProvider);

    const nightActs = nightDraft.days.flatMap(d => d.activities.filter(a => a.source === 'engine'));
    const nightIds = nightActs.map(a => a.id);

    expect(nightIds).toContain('roof-1');
    expect(nightIds).not.toContain('mus-1');
    expect(nightIds).not.toContain('mus-2');
    
    // Ensure they are strictly different
    expect(culturalIds).not.toEqual(nightIds);
    
    // Ensure no duplicates inside
    expect(new Set(culturalIds).size).toBe(culturalIds.length);
    expect(new Set(nightIds).size).toBe(nightIds.length);
  });
});
