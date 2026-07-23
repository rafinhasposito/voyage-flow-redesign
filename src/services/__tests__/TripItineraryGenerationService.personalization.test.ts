import { vi, describe, it, expect, beforeEach } from 'vitest';
import { TripItineraryGenerationService } from '../TripItineraryGenerationService';
import { TripRepository } from '../../repositories/TripRepository';
import { TripWalletRepository } from '../../repositories/TripWalletRepository';
import { ExperienceRepository, TravelExperience } from '../../repositories/ExperienceRepository';

// Mock dependencies
vi.mock('../../repositories/TripRepository');
vi.mock('../../repositories/TripWalletRepository');
vi.mock('../../repositories/ExperienceRepository');

describe('TripItineraryGenerationService Personalization', () => {
  const commonCatalog: TravelExperience[] = [
    { id: 'museum-a', name: 'Museum A', category: 'Museum', costUSD: 10, is_published: true, durationHours: 2, tags: ['culture'] } as TravelExperience,
    { id: 'museum-b', name: 'Museum B', category: 'Museum', costUSD: 15, is_published: true, durationHours: 2, tags: ['culture'] } as TravelExperience,
    { id: 'rooftop-a', name: 'Rooftop A', category: 'Rooftop', costUSD: 100, is_published: true, durationHours: 3, tags: ['nightlife'] } as TravelExperience,
    { id: 'nightclub-a', name: 'Nightclub A', category: 'Club', costUSD: 50, is_published: true, durationHours: 4, tags: ['nightlife'] } as TravelExperience,
    { id: 'park-a', name: 'Park A', category: 'Park', costUSD: 0, is_published: true, durationHours: 2, tags: ['nature'] } as TravelExperience
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(TripWalletRepository.getReservations).mockResolvedValue([]);
    vi.mocked(ExperienceRepository.getByDestination).mockResolvedValue(commonCatalog);
  });

  it('should generate completely different itineraries for opposing profiles', async () => {
    // Profile A: Culture, low budget, slow pace. Loves museums, rejects nightlife.
    const tripA = {
      id: 'trip-a',
      destination: 'dest-1',
      start_date: '2024-01-01',
      end_date: '2024-01-03',
      pace: 'relaxed',
      budget_level: 'economic',
      preferences: {
        match_votes: {
          'museum-a': 'love',
          'museum-b': 'yes',
          'rooftop-a': 'no',
          'nightclub-a': 'reject'
        }
      }
    };

    // Profile B: Nightlife, high budget, fast pace. Loves rooftops, rejects museums.
    const tripB = {
      id: 'trip-b',
      destination: 'dest-1',
      start_date: '2024-01-01',
      end_date: '2024-01-03',
      pace: 'intense',
      budget_level: 'luxury',
      preferences: {
        match_votes: {
          'rooftop-a': 'love',
          'nightclub-a': 'love',
          'museum-a': 'no',
          'museum-b': 'dislike'
        }
      }
    };

    // Mock getTripById conditionally
    vi.mocked(TripRepository.getTripById).mockImplementation(async (id) => {
      if (id === 'trip-a') return tripA;
      if (id === 'trip-b') return tripB;
      throw new Error('Not found');
    });

    const resultA = await TripItineraryGenerationService.generatePreview('trip-a');
    const resultB = await TripItineraryGenerationService.generatePreview('trip-b');

    expect(resultA.metadata.inputHash).not.toBe(resultB.metadata.inputHash);
    
    // Check eligible candidates
    const eligibleA = resultA.diagnostics.eligibleCandidates;
    const eligibleB = resultB.diagnostics.eligibleCandidates;
    
    expect(eligibleA).not.toEqual(eligibleB);
    expect(eligibleA.find((e: any) => e.id === 'rooftop-a')).toBeUndefined();
    expect(eligibleB.find((e: any) => e.id === 'museum-a')).toBeUndefined();

    // Check selected
    const selectedA = resultA.itinerary.flatMap(d => d.activities || []).map(a => a.sourceExperienceId);
    const selectedB = resultB.itinerary.flatMap(d => d.activities || []).map(a => a.sourceExperienceId);

    expect(selectedA).not.toEqual(selectedB);
    expect(selectedA).not.toContain('rooftop-a');
    expect(selectedB).not.toContain('museum-a');

    // No duplicates
    expect(new Set(selectedA).size).toBe(selectedA.length);
    expect(new Set(selectedB).size).toBe(selectedB.length);
  });
});
