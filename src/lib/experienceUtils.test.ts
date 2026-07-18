import { describe, it, expect } from 'vitest';
import { buildExperiencePayload, mapNodeToFormState, defaultForm, sanitizeRestrictionsProvenance } from './experienceUtils';

describe('experienceUtils (EI-6C)', () => {
  it('Não informado vira null e false permanece false', () => {
    const node = { adult_only: false, min_age: null, wheelchair_accessible: null };
    const mapped = mapNodeToFormState(node, {});
    expect(mapped.adult_only).toBe(false);
    expect(mapped.min_age).toBe(null);
    expect(mapped.wheelchair_accessible).toBe(null);
  });

  it('campo vazio não vira 0 (usando null do form state)', () => {
    const node = { minimum_group_size: null };
    const mapped = mapNodeToFormState(node, {});
    expect(mapped.minimum_group_size).toBe(null); // not 0
  });

  it('payload atual não envia colunas de políticas antes da migration aplicada', () => {
    const form = {
      ...defaultForm,
      min_age: 18,
      adult_only: true,
      wheelchair_accessible: true
    };
    const payload = buildExperiencePayload(form as any);

    // As per requirement, these shouldn't be in the payload yet
    expect((payload as any).min_age).toBeUndefined();
    expect((payload as any).adult_only).toBeUndefined();
    expect((payload as any).wheelchair_accessible).toBeUndefined();
  });

  describe('sanitizeRestrictionsProvenance', () => {
    const mockProv = { source: "official_website", source_url: null, captured_at: null, verified_at: null, verified_by: null };

    it('min_age null remove somente min_age', () => {
      const { provenance, selectedFields } = sanitizeRestrictionsProvenance(
        { min_age: null, adult_only: false },
        { min_age: mockProv, adult_only: mockProv },
        ['min_age', 'adult_only']
      );
      expect(provenance).toEqual({ adult_only: mockProv });
      expect(selectedFields).toEqual(['adult_only']);
    });

    it('min_age 0 preserva min_age', () => {
      const { provenance, selectedFields } = sanitizeRestrictionsProvenance(
        { min_age: 0 },
        { min_age: mockProv },
        ['min_age']
      );
      expect(provenance).toEqual({ min_age: mockProv });
      expect(selectedFields).toEqual(['min_age']);
    });

    it('adult_only false preserva adult_only', () => {
      const { provenance, selectedFields } = sanitizeRestrictionsProvenance(
        { adult_only: false },
        { adult_only: mockProv },
        ['adult_only']
      );
      expect(provenance).toEqual({ adult_only: mockProv });
      expect(selectedFields).toEqual(['adult_only']);
    });

    it('accessibility_notes "   " remove somente accessibility_notes', () => {
      const { provenance, selectedFields } = sanitizeRestrictionsProvenance(
        { accessibility_notes: "   ", adult_only: true },
        { accessibility_notes: mockProv, adult_only: mockProv },
        ['accessibility_notes', 'adult_only']
      );
      expect(provenance).toEqual({ adult_only: mockProv });
      expect(selectedFields).toEqual(['adult_only']);
    });

    it('remover um fato preserva fontes dos demais', () => {
      const { provenance, selectedFields } = sanitizeRestrictionsProvenance(
        { min_age: null, adult_only: true, requires_companion: false },
        { min_age: mockProv, adult_only: mockProv, requires_companion: mockProv },
        ['min_age', 'adult_only', 'requires_companion']
      );
      expect(provenance).toEqual({ adult_only: mockProv, requires_companion: mockProv });
      expect(selectedFields).toEqual(['adult_only', 'requires_companion']);
    });

    it('formulário inicial vazio não causa erro', () => {
      const { provenance, selectedFields } = sanitizeRestrictionsProvenance(
        { min_age: null },
        null,
        []
      );
      expect(provenance).toBeNull();
      expect(selectedFields).toEqual([]);
    });

    it('proveniência carregada não é apagada quando o fato correspondente está presente', () => {
      const { provenance, selectedFields } = sanitizeRestrictionsProvenance(
        { wheelchair_accessible: true },
        { wheelchair_accessible: mockProv },
        ['wheelchair_accessible']
      );
      expect(provenance).toEqual({ wheelchair_accessible: mockProv });
      expect(selectedFields).toEqual(['wheelchair_accessible']);
    });
  });
});
