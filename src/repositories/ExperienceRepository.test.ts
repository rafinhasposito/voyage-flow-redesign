import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ExperienceRepository, ExperienceRow } from './ExperienceRepository';
import { supabase } from '@/lib/supabase';
import { CacheManager } from '../services/CacheManager';

import { TravelExperience } from '@/utils/travelState';

const mapRowToModel = (row: Partial<ExperienceRow>) => {
  return (ExperienceRepository as unknown as { mapRowToModel: (r: ExperienceRow) => TravelExperience }).mapRowToModel(row as ExperienceRow);
};

describe('ExperienceRepository', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_DEMO_MODE', 'false');
    vi.stubEnv('VITE_GYG_PARTNER_ID', 'test_partner');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  describe('Mapeamento de Colunas Estruturadas', () => {
    it('deve mapear tags, rating, reviews_count, reservation_required', () => {
      const row = {
        tags: ['parque', 'natureza'],
        rating: 4.8,
        reviews_count: 1500,
        reservation_required: true,
      };
      const result = mapRowToModel(row);
      expect(result.tags).toEqual(['parque', 'natureza']);
      expect(result.rating).toBe(4.8);
      expect(result.reviews_count).toBe(1500);
      expect(result.reservationRequired).toBe(true);
    });

    it('deve mapear is_must_see, exclusivity_level, dress_code', () => {
      const row = {
        is_must_see: true,
        exclusivity_level: 'premium',
        dress_code: 'smart_casual',
      };
      const result = mapRowToModel(row);
      expect(result.is_must_see).toBe(true);
      expect(result.exclusivityLevel).toBe('premium');
      expect(result.dressCode).toBe('smart_casual');
    });

    it('deve mapear type distinto de category, climate, ideal_companion', () => {
      const row = {
        category: 'culture',
        type: 'museum',
        climate: 'indoor_controlled',
        ideal_companion: 'family',
      };
      const result = mapRowToModel(row);
      expect(result.category).toBe('culture');
      expect(result.type).toBe('museum');
      expect(result.climate).toBe('indoor_controlled');
      expect(result.ideal_companion).toBe('family');
    });

    it('deve lidar com coordenadas iguais a zero (válidas)', () => {
      const row = {
        location_lat: 0,
        location_lng: 0,
      };
      const result = mapRowToModel(row);
      expect(result.coordinates).toEqual({ lat: 0, lng: 0 });
    });

    it('deve lidar com coordenadas null', () => {
      const row = {
        location_lat: null,
        location_lng: null,
      };
      const result = mapRowToModel(row);
      expect(result.coordinates).toBeUndefined();
    });

    it('deve lidar com media_urls null', () => {
      const row = {
        media_urls: null,
      };
      const result = mapRowToModel(row);
      expect(result.images).toEqual([]);
      expect(result.image).toBe('');
    });

    it('deve ignorar short_description textual', () => {
      const row = {
        short_description: 'Um belo texto editorial que não é JSON.',
        intelligence_metadata: null,
      };
      const result = mapRowToModel(row);
      expect(result.personaWeights).toBeUndefined();
    });
  });

  describe('Intelligence Metadata', () => {
    it('deve lidar com intelligence_metadata null', () => {
      const row = {
        intelligence_metadata: null,
      };
      const result = mapRowToModel(row);
      expect(result.personaWeights).toBeUndefined();
      expect(result.companionshipCompatibility).toBeUndefined();
      expect(result.recommendedSeasons).toBeUndefined();
      expect(result.weatherCompatibility).toBeUndefined();
    });

    it('deve lidar com pesos na escala 0-1 (ideal)', () => {
      const row = {
        intelligence_metadata: {
          personaWeights: { explorador_visual: 0.9, curador_experiencias: 0.8 },
          companionshipCompatibility: { solo: 0.7, couple: 1.0 },
          recommendedSeasons: ['summer'],
        },
      };
      const result = mapRowToModel(row);
      expect(result.personaWeights.explorador_visual).toBe(0.9);
      expect(result.personaWeights.curador_experiencias).toBe(0.8);
      expect(result.personaWeights.descobridor).toBe(0.5); // Default
      expect(result.companionshipCompatibility.solo).toBe(0.7);
      expect(result.companionshipCompatibility.couple).toBe(1.0);
      expect(result.recommendedSeasons).toEqual(['summer']);
    });

    it('deve converter pesos em 0-100 para escala 0-1', () => {
      const row = {
        intelligence_metadata: {
          personaWeights: { explorador_visual: 90, curador_experiencias: 80 },
        },
      };
      const result = mapRowToModel(row);
      expect(result.personaWeights.explorador_visual).toBe(0.9);
      expect(result.personaWeights.curador_experiencias).toBe(0.8);
    });

    it('deve usar default para pesos fora da faixa', () => {
      const row = {
        intelligence_metadata: {
          personaWeights: { explorador_visual: -10, curador_experiencias: 150 },
        },
      };
      const result = mapRowToModel(row);
      expect(result.personaWeights.explorador_visual).toBe(0.5);
      expect(result.personaWeights.curador_experiencias).toBe(0.5);
    });
  });

  describe('Comportamento de Erro e Fallback', () => {
    it('deve retornar vazio quando catálogo é vazio e não deve usar fallback se VITE_DEMO_MODE=false', async () => {
      // Setup mock
      vi.spyOn(supabase, 'from').mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      } as unknown as ReturnType<typeof supabase.from>);

      vi.spyOn(CacheManager, 'invalidate').mockImplementation(() => {});
      vi.spyOn(CacheManager, 'set').mockImplementation(() => {});

      CacheManager.invalidate('experiences', 1);
      const data = await ExperienceRepository.forceRefresh();
      expect(data).toEqual([]);
    });

    it('deve lançar erro de rede sem usar fallback silencioso', async () => {
      vi.spyOn(supabase, 'from').mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: null, error: { message: 'Network error' } }),
        }),
      } as unknown as ReturnType<typeof supabase.from>);

      vi.spyOn(CacheManager, 'invalidate').mockImplementation(() => {});
      vi.spyOn(CacheManager, 'set').mockImplementation(() => {});

      CacheManager.invalidate('experiences', 1);
      await expect(ExperienceRepository.forceRefresh()).rejects.toEqual({ message: 'Network error' });
    });
  });
});
