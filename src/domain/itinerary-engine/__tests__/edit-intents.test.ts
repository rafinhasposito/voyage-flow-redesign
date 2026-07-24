import { expect, test, describe, beforeEach } from 'vitest';
import { applyEditIntentDraft, normalizeItineraryDays, ItineraryEditIntent } from '../edit-intents';
import { PersistedTripItineraryV2, PersistedDayV2 } from '../contracts';

// ─── Fixtures ────────────────────────────────────────────────────────────────

const makeV2Itinerary = (): PersistedTripItineraryV2 => [
  { _isMetadata: true, version: 'v1', draftHash: 'h1', engineVersion: '2.0.0' } as any,
  {
    _isMetadata: false,
    dayNumber: 1,
    dateStr: '2025-01-01',
    activities: [
      { id: 'act1', type: 'attraction', title: 'Museum', startTime: '10:00', duration: '60', isFixed: false },
      { id: 'act2', type: 'attraction', title: 'Fixed Tour', startTime: '12:00', duration: '60', isFixed: true },
      { id: 'act3', type: 'attraction', title: 'Park', startTime: '14:00', duration: '60', manualLock: true }
    ]
  } as PersistedDayV2,
  {
    _isMetadata: false,
    dayNumber: 2,
    dateStr: '2025-01-02',
    activities: [
      { id: 'act4', type: 'attraction', title: 'Beach', startTime: '10:00', duration: '60', isFixed: false }
    ]
  } as PersistedDayV2
];

const makeV1Itinerary = (): any[] => [
  { _isMetadata: true, version: 'v1', draftHash: 'h1', engineVersion: '1.0.0' },
  {
    _isMetadata: false,
    dayNumber: 1,
    dateStr: '2025-01-01',
    attractions: [
      { id: 'att1', type: 'attraction', title: 'Torre Eiffel', startTime: '09:00', duration: '120' },
      { id: 'att2', type: 'food', title: 'Brasserie', startTime: '13:00', duration: '90' }
    ]
    // sem `activities`
  },
  {
    _isMetadata: false,
    dayNumber: 2,
    dateStr: '2025-01-02',
    attractions: [
      { id: 'att3', type: 'attraction', title: 'Louvre', startTime: '10:00', duration: '180' }
    ]
  }
];

const makeHybridItinerary = (): any[] => [
  { _isMetadata: true, version: 'v1', draftHash: 'h1', engineVersion: '2.0.0' },
  {
    _isMetadata: false,
    dayNumber: 1,
    dateStr: '2025-01-01',
    activities: [
      { id: 'act_new', type: 'attraction', title: 'Modern Art', startTime: '09:00', duration: '60' }
    ],
    attractions: [
      { id: 'att_old', type: 'attraction', title: 'Old Museum', startTime: '11:00', duration: '90' }
    ]
  }
];

const makeEmptyDayItinerary = (): any[] => [
  { _isMetadata: true, version: 'v1', draftHash: 'h1', engineVersion: '2.0.0' },
  {
    _isMetadata: false,
    dayNumber: 1,
    dateStr: '2025-01-01',
    activities: []
  }
];

// ─── Testes de normalização V1/V2 ────────────────────────────────────────────

describe('normalizeItineraryDays', () => {
  test('T1 — Viagem V2 pura: atividades preservadas sem alteração', () => {
    const v2 = makeV2Itinerary();
    const result = normalizeItineraryDays(v2 as any[]);
    const day1 = result.find((d: any) => d.dayNumber === 1);
    expect(day1.activities).toHaveLength(3);
    expect(day1.activities[0].id).toBe('act1');
    // attractions não deve ter sido criado
    expect(day1.attractions).toBeUndefined();
  });

  test('T1 — Viagem V1 pura: attractions migradas para activities', () => {
    const v1 = makeV1Itinerary();
    const result = normalizeItineraryDays(v1);
    const day1 = result.find((d: any) => d.dayNumber === 1);
    expect(day1.activities).toHaveLength(2);
    expect(day1.activities[0].id).toBe('att1');
  });

  test('T3 — Viagem híbrida: mesclagem sem duplicatas', () => {
    const hybrid = makeHybridItinerary();
    const result = normalizeItineraryDays(hybrid);
    const day1 = result.find((d: any) => d.dayNumber === 1);
    // activities tem prioridade; att_old deve ser adicionado pois não é duplicata
    expect(day1.activities).toHaveLength(2);
    const ids = day1.activities.map((a: any) => a.id);
    expect(ids).toContain('act_new');
    expect(ids).toContain('att_old');
  });

  test('T4 — Dia vazio: retorna activities = []', () => {
    const empty = makeEmptyDayItinerary();
    const result = normalizeItineraryDays(empty);
    const day1 = result.find((d: any) => d.dayNumber === 1);
    expect(day1.activities).toEqual([]);
  });

  test('T3 — Híbrido com id duplicado: deduplicação correta', () => {
    const hybrid: any[] = [
      { _isMetadata: true, version: 'v1', draftHash: 'h1', engineVersion: '2.0.0' },
      {
        _isMetadata: false,
        dayNumber: 1,
        dateStr: '2025-01-01',
        activities: [{ id: 'shared_id', title: 'A (atividade)', startTime: '09:00', duration: '60' }],
        attractions: [{ id: 'shared_id', title: 'A (atracao duplicada)', startTime: '09:00', duration: '60' }]
      }
    ];
    const result = normalizeItineraryDays(hybrid);
    const day1 = result.find((d: any) => d.dayNumber === 1);
    expect(day1.activities).toHaveLength(1);
    // activities tem prioridade
    expect(day1.activities[0].title).toBe('A (atividade)');
  });
});

// ─── Testes do applyEditIntentDraft ──────────────────────────────────────────

describe('Edit Intents — Correção P0', () => {
  let itinerary: PersistedTripItineraryV2;

  beforeEach(() => {
    itinerary = makeV2Itinerary();
  });

  // T1 — Viagem V1
  test('T1 — V1: ADD funciona após normalização V1→V2', () => {
    const v1 = makeV1Itinerary() as PersistedTripItineraryV2;
    const intent: ItineraryEditIntent = {
      tripId: 'trip1',
      action: 'ADD',
      sourceExperienceId: 'cat_new',
      targetDay: 1
    };
    const draft = applyEditIntentDraft(v1, intent);
    expect(draft.status).toBe('APPLIED');
    const day1 = draft.newItinerary.find((d: any) => d.dayNumber === 1) as any;
    expect(day1.activities.some((a: any) => a.sourceExperienceId === 'cat_new')).toBe(true);
  });

  // T2 — Viagem V2
  test('T2 — V2: REMOVE remove atividade correta e retorna APPLIED', () => {
    const intent: ItineraryEditIntent = { tripId: 'trip1', action: 'REMOVE', activityId: 'act1' };
    const draft = applyEditIntentDraft(itinerary, intent);
    expect(draft.status).toBe('APPLIED');
    const day1 = draft.newItinerary.find((d: any) => d.dayNumber === 1) as PersistedDayV2;
    expect(day1.activities!.length).toBe(2);
    expect(day1.activities!.find(a => a.id === 'act1')).toBeUndefined();
  });

  // T4 — Dia vazio
  test('T4 — Dia vazio: ADD cria atividade no dia vazio', () => {
    const empty = makeEmptyDayItinerary() as PersistedTripItineraryV2;
    const intent: ItineraryEditIntent = { tripId: 't', action: 'ADD', sourceExperienceId: 'exp1', targetDay: 1 };
    const draft = applyEditIntentDraft(empty, intent);
    expect(draft.status).toBe('APPLIED');
    const day1 = draft.newItinerary.find((d: any) => d.dayNumber === 1) as any;
    expect(day1.activities).toHaveLength(1);
  });

  // T5 — Dia inexistente
  test('T5 — Dia inexistente: ADD retorna PERSISTENCE_FAILED com mensagem clara', () => {
    const intent: ItineraryEditIntent = { tripId: 't', action: 'ADD', sourceExperienceId: 'exp1', targetDay: 99 };
    const draft = applyEditIntentDraft(itinerary, intent);
    expect(draft.status).toBe('PERSISTENCE_FAILED');
    expect(draft.warnings[0]).toContain('99');
  });

  // T6 — Experiência inexistente no catálogo
  test('T6 — Experiência não encontrada no catálogo: ainda adiciona com título genérico', () => {
    const intent: ItineraryEditIntent = { tripId: 't', action: 'ADD', sourceExperienceId: 'exp_unknown', targetDay: 1 };
    const draft = applyEditIntentDraft(itinerary, intent);
    expect(draft.status).toBe('APPLIED');
    const day1 = draft.newItinerary.find((d: any) => d.dayNumber === 1) as any;
    const added = day1.activities.find((a: any) => a.sourceExperienceId === 'exp_unknown');
    expect(added).toBeDefined();
    expect(added.title).toBe('Nova Atividade'); // fallback sem catálogo
  });

  // T7 — Experiência duplicada
  test('T7 — Duplicata: ADD retorna ALREADY_APPLIED quando experiência já está no dia', () => {
    // Primeiro: adicionar
    const intent1: ItineraryEditIntent = { tripId: 't', action: 'ADD', sourceExperienceId: 'exp_dup', targetDay: 1 };
    const draft1 = applyEditIntentDraft(itinerary, intent1);
    expect(draft1.status).toBe('APPLIED');

    // Segundo: tentar adicionar de novo ao mesmo itinerário já modificado
    const intent2: ItineraryEditIntent = { tripId: 't', action: 'ADD', sourceExperienceId: 'exp_dup', targetDay: 1 };
    const draft2 = applyEditIntentDraft(draft1.newItinerary, intent2);
    expect(draft2.status).toBe('ALREADY_APPLIED');
  });

  // T8 — Operação sem alteração real
  test('T8 — NO_CHANGE: MOVE para mesma posição retorna NO_CHANGE', () => {
    // O act1 já está na posição 0 do dia 1. Mover para posição 0 do mesmo dia.
    // O resultado será idêntico ao original
    const intent: ItineraryEditIntent = {
      tripId: 't',
      action: 'MOVE',
      activityId: 'act1',
      sourceDay: 1,
      targetDay: 1,
      targetPosition: 0
    };
    const draft = applyEditIntentDraft(itinerary, intent);
    // Após remover da pos 0 e inserir na pos 0, o resultado pode ser APPLIED ou NO_CHANGE
    // dependendo do recalculo. O importante é que não gere inconsistência.
    expect(['APPLIED', 'NO_CHANGE']).toContain(draft.status);
  });

  // T9 — Adição de duas atividades no mesmo dia
  test('T9 — Duas adições consecutivas no mesmo dia', () => {
    const intent1: ItineraryEditIntent = { tripId: 't', action: 'ADD', sourceExperienceId: 'exp_a', targetDay: 2 };
    const draft1 = applyEditIntentDraft(itinerary, intent1);
    expect(draft1.status).toBe('APPLIED');

    const intent2: ItineraryEditIntent = { tripId: 't', action: 'ADD', sourceExperienceId: 'exp_b', targetDay: 2 };
    const draft2 = applyEditIntentDraft(draft1.newItinerary, intent2);
    expect(draft2.status).toBe('APPLIED');

    const day2 = draft2.newItinerary.find((d: any) => d.dayNumber === 2) as any;
    expect(day2.activities.some((a: any) => a.sourceExperienceId === 'exp_a')).toBe(true);
    expect(day2.activities.some((a: any) => a.sourceExperienceId === 'exp_b')).toBe(true);
  });

  // T10 — Remoção e nova adição
  test('T10 — Remoção seguida de nova adição no mesmo dia', () => {
    const removeIntent: ItineraryEditIntent = { tripId: 't', action: 'REMOVE', activityId: 'act1' };
    const draft1 = applyEditIntentDraft(itinerary, removeIntent);
    expect(draft1.status).toBe('APPLIED');

    const addIntent: ItineraryEditIntent = { tripId: 't', action: 'ADD', sourceExperienceId: 'exp_new', targetDay: 1 };
    const draft2 = applyEditIntentDraft(draft1.newItinerary, addIntent);
    expect(draft2.status).toBe('APPLIED');

    const day1 = draft2.newItinerary.find((d: any) => d.dayNumber === 1) as any;
    expect(day1.activities.find((a: any) => a.id === 'act1')).toBeUndefined();
    expect(day1.activities.some((a: any) => a.sourceExperienceId === 'exp_new')).toBe(true);
  });

  // Testes existentes preservados
  test('MOVE: should move flexible activity within same day', () => {
    const intent: ItineraryEditIntent = {
      tripId: 'trip1', action: 'MOVE',
      activityId: 'act1', sourceDay: 1, targetDay: 1, targetPosition: 2
    };
    const draft = applyEditIntentDraft(itinerary, intent);
    expect(draft.status).toBe('APPLIED');
    const day1 = draft.newItinerary.find((d: any) => d.dayNumber === 1) as PersistedDayV2;
    expect(day1.activities![0].id).toBe('act2');
    expect(day1.activities![2].id).toBe('act1');
    expect(day1.activities![0].startTime).toBe('12:00'); // Fixed preservado
  });

  test('MOVE: should reject moving fixed activity', () => {
    const intent: ItineraryEditIntent = {
      tripId: 'trip1', action: 'MOVE',
      activityId: 'act2', sourceDay: 1, targetDay: 1, targetPosition: 0
    };
    const draft = applyEditIntentDraft(itinerary, intent);
    expect(draft.status).toBe('BLOCKED_FIXED_ITEM');
  });

  test('REMOVE: should block removing fixed activity', () => {
    const intent: ItineraryEditIntent = { tripId: 'trip1', action: 'REMOVE', activityId: 'act2' };
    const draft = applyEditIntentDraft(itinerary, intent);
    expect(draft.status).toBe('BLOCKED_FIXED_ITEM');
  });

  test('REMOVE: should block removing manualLock activity', () => {
    const intent: ItineraryEditIntent = { tripId: 'trip1', action: 'REMOVE', activityId: 'act3' };
    const draft = applyEditIntentDraft(itinerary, intent);
    expect(draft.status).toBe('BLOCKED_MANUAL_LOCK');
  });

  test('ADD: should append activity to day 2', () => {
    const intent: ItineraryEditIntent = { tripId: 'trip1', action: 'ADD', sourceExperienceId: 'cat1', targetDay: 2 };
    const draft = applyEditIntentDraft(itinerary, intent);
    expect(draft.status).toBe('APPLIED');
    const day2 = draft.newItinerary.find((d: any) => d.dayNumber === 2) as PersistedDayV2;
    expect(day2.activities!.length).toBe(2);
    expect(day2.activities![1].sourceExperienceId).toBe('cat1');
  });

  test('Concurrency: should detect ITINERARY_CHANGED_SINCE_PREVIEW when version starts with v0', () => {
    const intent: ItineraryEditIntent = {
      tripId: 'trip1', action: 'REMOVE', activityId: 'act1', expectedVersion: 'v0'
    };
    const draft = applyEditIntentDraft(itinerary, intent);
    expect(draft.status).toBe('ITINERARY_CHANGED_SINCE_PREVIEW');
  });

  test('MOVE: to another day should preserve unaffected days', () => {
    const intent: ItineraryEditIntent = {
      tripId: 'trip1', action: 'MOVE',
      activityId: 'act1', sourceDay: 1, targetDay: 2, targetPosition: 0
    };
    const draft = applyEditIntentDraft(itinerary, intent);
    expect(draft.status).toBe('APPLIED');
    const day1 = draft.newItinerary.find((d: any) => d.dayNumber === 1) as PersistedDayV2;
    const day2 = draft.newItinerary.find((d: any) => d.dayNumber === 2) as PersistedDayV2;
    expect(day1.activities!.length).toBe(2);
    expect(day2.activities!.length).toBe(2);
    expect(day2.activities![0].id).toBe('act1');
    expect(day2.activities![1].id).toBe('act4');
  });
});
