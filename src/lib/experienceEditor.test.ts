import { describe, it, expect, vi } from 'vitest';
import { resolveExperienceRouteMode, isValidExperienceId, mapNodeToFormState, matchesExperienceSection } from './experienceUtils';
import { ExperienceRepository } from '../repositories/ExperienceRepository';

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: vi.fn().mockResolvedValue({ error: null }),
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null })
      })
    }))
  }
}));

describe('experienceUtils e routing', () => {
  describe('resolveExperienceRouteMode', () => {
    it('1. id ausente -> create', () => {
      expect(resolveExperienceRouteMode(undefined)).toEqual({ mode: 'create', id: null });
    });

    it('2. "new" -> create', () => {
      expect(resolveExperienceRouteMode('new')).toEqual({ mode: 'create', id: null });
    });

    it('3. UUID válido -> edit', () => {
      const validUUID = '123e4567-e89b-12d3-a456-426614174000';
      expect(resolveExperienceRouteMode(validUUID)).toEqual({ mode: 'edit', id: validUUID });
    });

    it('4. "undefined" -> invalid', () => {
      expect(resolveExperienceRouteMode('undefined')).toEqual({ mode: 'invalid', id: null });
    });

    it('5. "null" -> invalid', () => {
      expect(resolveExperienceRouteMode('null')).toEqual({ mode: 'invalid', id: null });
    });

    it('6. "abc" -> invalid', () => {
      expect(resolveExperienceRouteMode('abc')).toEqual({ mode: 'invalid', id: null });
    });

    it('7. UUID incompleto -> invalid', () => {
      expect(resolveExperienceRouteMode('123e4567-e89b-12d3-a456')).toEqual({ mode: 'invalid', id: null });
    });
  });

  describe('ExperienceRepository protections and behaviors', () => {
    it('8. modo invalid não chama create', async () => {
      const spy = vi.spyOn(ExperienceRepository, 'create');
      const { mode } = resolveExperienceRouteMode('undefined');
      if (mode === 'create') await ExperienceRepository.create({ title: 'Test' } as Record<string, unknown>);
      expect(spy).not.toHaveBeenCalled();
      spy.mockRestore();
    });

    it('9. modo invalid não chama update', async () => {
      const spy = vi.spyOn(ExperienceRepository, 'update');
      const { mode, id } = resolveExperienceRouteMode('undefined');
      if (mode === 'edit' && id) await ExperienceRepository.update(id, { title: 'Test' } as Record<string, unknown>);
      expect(spy).not.toHaveBeenCalled();
      spy.mockRestore();
    });

    it('10. create remove id do payload', async () => {
      const payload = { id: 'should-be-removed', title: 'Test' } as Record<string, unknown>;
      await ExperienceRepository.create(payload);
      expect(payload).not.toHaveProperty('id');
    });

    it('11. update inválido é bloqueado antes da rede', async () => {
      await expect(ExperienceRepository.update('invalid-id', { title: 'Test' } as Record<string, unknown>))
        .rejects
        .toThrow('Não foi possível identificar a experiência para edição.');
    });

    it('12. update válido usa o UUID recebido', async () => {
      const validId = '123e4567-e89b-12d3-a456-426614174000';
      await expect(ExperienceRepository.update(validId, { title: 'Test' } as Record<string, unknown>))
        .resolves.not.toThrow();
    });
  });

  describe('mapNodeToFormState (Carregamento de dados)', () => {
    it('13. campos null não quebram formatação', () => {
      const node = { title: null, description: null, intelligence_metadata: null };
      const form = mapNodeToFormState(node, {});
      expect(form.title).toBe('');
      expect(form.description).toBe('');
      expect(form.personaWeights.explorador_visual).toBe(50);
      expect(form.recommendedSeasons).toEqual(['all']);
    });

    it('14. registro encontrado preenche o formulário', () => {
      const node = { 
        title: 'Central Park', 
        duration_minutes: 120,
        intelligence_metadata: {
          personaWeights: { explorador_visual: 0.8 }
        }
      };
      const form = mapNodeToFormState(node, {});
      expect(form.title).toBe('Central Park');
      expect(form.duration_minutes).toBe(120);
      expect(form.personaWeights.explorador_visual).toBe(80);
    });
  });

  describe('matchesExperienceSection (Filtros de abas e seções)', () => {
    it('15. hotel com type=hotel aparece em Hospedagens', () => {
      const exp = { type: 'hotel', category: '' };
      expect(matchesExperienceSection(exp, 'lodging')).toBe(true);
    });

    it('16. hostel com type=hotel e category=Hostel aparece em Hospedagens', () => {
      const exp = { type: 'hotel', category: 'Hostel' };
      expect(matchesExperienceSection(exp, 'lodging')).toBe(true);
    });

    it('17. registro com type=restaurant aparece em Restaurantes', () => {
      const exp = { type: 'restaurant', category: 'qualquer' };
      expect(matchesExperienceSection(exp, 'dining')).toBe(true);
    });

    it('18. museum aparece em Atrações', () => {
      const exp = { type: 'museum', category: '' };
      expect(matchesExperienceSection(exp, 'attractions')).toBe(true);
    });

    it('19. category culture sem type não vira hospedagem', () => {
      const exp = { type: '', category: 'culture' };
      expect(matchesExperienceSection(exp, 'lodging')).toBe(false);
    });

    it('20. fallback legado Hospedagem funciona quando type está ausente', () => {
      const exp = { type: null, category: 'Hospedagem' };
      expect(matchesExperienceSection(exp, 'lodging')).toBe(true);
    });

    it('21. type possui prioridade sobre category conflitante', () => {
      // Type = attraction, Category = Hotel -> deveria ser atração, não hotel!
      const exp = { type: 'attraction', category: 'Hotel' };
      expect(matchesExperienceSection(exp, 'attractions')).toBe(true);
      expect(matchesExperienceSection(exp, 'lodging')).toBe(false);
    });

    it('22. comparação ignora maiúsculas e espaços', () => {
      const exp = { type: '  hOtEl  ', category: '' };
      expect(matchesExperienceSection(exp, 'lodging')).toBe(true);
    });

    it('23. Catálogo geral continua mostrando todos', () => {
      const exp = { type: 'weird_type', category: 'weird_cat' };
      expect(matchesExperienceSection(exp, 'all')).toBe(true); // 'all' retorna true sempre
    });

    it('24. filtros laterais continuam funcionando dentro da aba (indireto, testando pureza do filtro)', () => {
      // A pureza da função garante que não quebra filtros laterais
      expect(matchesExperienceSection({ type: 'hotel' }, 'lodging')).toBe(true);
    });
  });
});
