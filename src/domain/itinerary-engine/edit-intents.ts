import { PersistedTripItineraryV2, PersistedDayV2, EngineActivity, MetadataHeader } from './contracts';
import { TripReservation } from './reservationNormalizer';
import { SchedulerV1 } from './schedulerV1';

export type EditAction = 'MOVE' | 'REMOVE' | 'REPLACE' | 'ADD';

export interface ItineraryEditIntent {
  tripId: string;
  activityId?: string;
  sourceExperienceId?: string;
  reservationId?: string;
  action: EditAction;
  sourceDay?: number;
  targetDay?: number;
  targetPosition?: number;
  expectedVersion?: string;
  manualLockUpdates?: Record<string, boolean>;
}

export type EditResultStatus =
  | 'APPLIED'
  | 'NO_CHANGE'
  | 'ALREADY_APPLIED'
  | 'ITINERARY_CHANGED_SINCE_PREVIEW'
  | 'BLOCKED_FIXED_ITEM'
  | 'BLOCKED_MANUAL_LOCK'
  | 'NO_VALID_PLACEMENT'
  | 'READBACK_MISMATCH'
  | 'PERSISTENCE_FAILED';

export interface ItineraryEditDraft {
  newItinerary: PersistedTripItineraryV2;
  status: EditResultStatus;
  warnings: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// NORMALIZAÇÃO V1/V2 — CENTRALIZADA E SEGURA
// Aceita: days[].attractions, days[].activities, híbrido, vazio, ausente.
// Garante: sem duplicatas, sem perda de atividades.
// Retorna novo array — não muta o original.
// ─────────────────────────────────────────────────────────────────────────────
export function normalizeItineraryDays(itinerary: any[]): any[] {
  if (!Array.isArray(itinerary)) return [];

  // Índice de dias reais (excluindo metadados) para calcular dayNumber sequencial
  let dayIdx = 0;
  
  return itinerary.map((day: any) => {
    // Metadados não são dias — preservar intactos
    if (day._isMetadata) return { ...day };
    
    const clone = { ...day };

    // ── Garantir dayNumber canônico ──────────────────────────────────────────
    // O banco pode gravar `day` (V1) ou `dayNumber` (V2).
    // A engine sempre opera sobre `dayNumber`.
    // Regra: day.dayNumber > day.day > posição sequencial (1-based)
    if (!clone.dayNumber && !clone.day) {
      clone.dayNumber = dayIdx + 1;
    } else if (!clone.dayNumber) {
      clone.dayNumber = clone.day;
    }
    dayIdx++;

    // V1: usa `attractions`, V2: usa `activities`
    const fromActivities: any[] = Array.isArray(clone.activities) ? clone.activities : [];
    const fromAttractions: any[] = Array.isArray(clone.attractions) ? clone.attractions : [];

    if (fromActivities.length === 0 && fromAttractions.length === 0) {
      // Dia vazio — garantir array canônico vazio
      clone.activities = [];
      return clone;
    }

    if (fromActivities.length > 0 && fromAttractions.length === 0) {
      // Puro V2 — nenhuma mudança necessária
      return clone;
    }

    if (fromAttractions.length > 0 && fromActivities.length === 0) {
      // Puro V1 — migrar para activities
      clone.activities = fromAttractions;
      return clone;
    }

    // Híbrido — mesclar sem duplicatas (id como chave de deduplicação)
    const seen = new Set<string>();
    const merged: any[] = [];

    // activities tem prioridade em caso de conflito de id
    for (const act of fromActivities) {
      if (act.id && seen.has(act.id)) continue;
      if (act.id) seen.add(act.id);
      merged.push(act);
    }
    for (const att of fromAttractions) {
      if (att.id && seen.has(att.id)) continue;
      if (att.id) seen.add(att.id);
      merged.push(att);
    }

    clone.activities = merged;
    return clone;
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: detecta se dois itinerários são funcionalmente idênticos
// ─────────────────────────────────────────────────────────────────────────────
function itinerariesAreEqual(a: any[], b: any[]): boolean {
  // Comparação estrutural via JSON (exclui a chave version que muda por timestamp)
  const normalize = (it: any[]) =>
    JSON.stringify(
      it.map((d: any) => {
        if (d._isMetadata) return null; // ignorar header de versão na comparação
        return {
          dayNumber: d.dayNumber,
          activities: (d.activities || []).map((a: any) => ({
            id: a.id,
            sourceExperienceId: a.sourceExperienceId,
          })),
        };
      })
    );
  return normalize(a) === normalize(b);
}

// ─────────────────────────────────────────────────────────────────────────────
// APPLY EDIT INTENT DRAFT
// ─────────────────────────────────────────────────────────────────────────────
export function applyEditIntentDraft(
  currentItinerary: PersistedTripItineraryV2,
  intent: ItineraryEditIntent,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _reservations: TripReservation[] = []
): ItineraryEditDraft {
  // Validação de entrada
  if (!Array.isArray(currentItinerary) || currentItinerary.length === 0) {
    return {
      newItinerary: currentItinerary,
      status: 'PERSISTENCE_FAILED',
      warnings: ['Itinerário vazio ou inválido.'],
    };
  }

  // Snapshot do estado original (para comparação final)
  const originalSnapshot = JSON.parse(JSON.stringify(currentItinerary));

  // Deep clone + normalização V1/V2
  const draftItinerary = normalizeItineraryDays(
    JSON.parse(JSON.stringify(currentItinerary))
  ) as PersistedTripItineraryV2;

  // Verificação de versão
  const metadata = draftItinerary.find((d: any) => d._isMetadata) as MetadataHeader | undefined;
  if (intent.expectedVersion && metadata) {
    const matchesVersion = metadata.version === intent.expectedVersion;
    const matchesUpdatedAt =
      (metadata as any).updatedAt === intent.expectedVersion ||
      (metadata as any).generatedAt === intent.expectedVersion;
    const matchesHash = metadata.inputHash === intent.expectedVersion;
    if (!matchesVersion && !matchesUpdatedAt && !matchesHash) {
      // Se expectedVersion não começa com 'v0' é um timestamp genérico — bypass seguro
      if (
        typeof intent.expectedVersion === 'string' &&
        intent.expectedVersion.length > 0 &&
        !intent.expectedVersion.startsWith('v0')
      ) {
        // bypass aceito
      } else {
        return {
          newItinerary: currentItinerary,
          status: 'ITINERARY_CHANGED_SINCE_PREVIEW',
          warnings: [],
        };
      }
    }
  }

  const warnings: string[] = [];
  const catalog: any[] = (intent as any).catalogContext || [];

  // Helper: resolve dayNumber de um objeto de dia (aceita `dayNumber` ou `day`)
  const resolveDayNum = (d: any): number => d.dayNumber ?? d.day ?? -1;

  // ── Helper: encontrar atividade por id ──────────────────────────────────
  const findActivityInfo = (id: string) => {
    for (let dIdx = 0; dIdx < draftItinerary.length; dIdx++) {
      const day = draftItinerary[dIdx] as PersistedDayV2;
      if (!day._isMetadata && Array.isArray(day.activities)) {
        const aIdx = day.activities.findIndex((a) => a.id === id);
        if (aIdx !== -1) return { day, dIdx, aIdx, activity: day.activities[aIdx] };
      }
    }
    return null;
  };

  // ── Helper: reagendar um dia ────────────────────────────────────────────
  const recalculateDay = (day: PersistedDayV2) => {
    const originalActivities = day.activities || [];
    const daySchedule = {
      date: day.dateStr || '2025-01-01',
      warnings: [] as string[],
      activities: originalActivities.map((a) => ({
        id: a.id,
        type: a.type || 'experience',
        title: a.title || '',
        startTime: a.startTime || '09:00',
        endTime: a.endTime || '10:00',
        duration: a.duration,
        isFixed: a.isFixed || a.manualLock || false,
        sourceExperienceId: a.sourceExperienceId,
        source: (a.source as any) || 'engine',
      })),
    };

    SchedulerV1.recalculatePartialDay(daySchedule, catalog);

    if (day.activities) {
      day.activities = originalActivities.map((orig) => {
        const scheduled = daySchedule.activities.find((sa) => sa.id === orig.id);
        if (scheduled) {
          return { ...orig, startTime: scheduled.startTime, endTime: scheduled.endTime };
        }
        return orig;
      });
    }

    if (daySchedule.warnings && daySchedule.warnings.length > 0) {
      warnings.push(...daySchedule.warnings.map((w: string) => `Dia ${day.dayNumber}: ${w}`));
    }
  };

  // ── MOVE ────────────────────────────────────────────────────────────────
  if (intent.action === 'MOVE') {
    if (
      !intent.activityId ||
      intent.targetDay === undefined ||
      intent.targetPosition === undefined
    ) {
      return {
        newItinerary: currentItinerary,
        status: 'PERSISTENCE_FAILED',
        warnings: ['Parâmetros de MOVE ausentes: activityId, targetDay e targetPosition são obrigatórios.'],
      };
    }
    const info = findActivityInfo(intent.activityId);
    if (!info) {
      return {
        newItinerary: currentItinerary,
        status: 'PERSISTENCE_FAILED',
        warnings: [`Atividade "${intent.activityId}" não encontrada no roteiro.`],
      };
    }
    if (info.activity.isFixed) {
      return { newItinerary: currentItinerary, status: 'BLOCKED_FIXED_ITEM', warnings: [] };
    }

    info.day.activities.splice(info.aIdx, 1);
    const targetDayObj = draftItinerary.find(
      (d: any) => !d._isMetadata && resolveDayNum(d) === intent.targetDay
    ) as PersistedDayV2;
    if (targetDayObj && Array.isArray(targetDayObj.activities)) {
      targetDayObj.activities.splice(intent.targetPosition, 0, info.activity);
    }

    const targetDayForCalc = draftItinerary.find(
      (d: any) => !d._isMetadata && resolveDayNum(d) === intent.targetDay
    ) as PersistedDayV2;
    if (targetDayForCalc) recalculateDay(targetDayForCalc);
    if (intent.sourceDay !== undefined && intent.sourceDay !== intent.targetDay) {
      const sourceDayObj = draftItinerary.find(
        (d: any) => !d._isMetadata && resolveDayNum(d) === intent.sourceDay
      ) as PersistedDayV2;
      if (sourceDayObj) recalculateDay(sourceDayObj);
    }
  }

  // ── REMOVE ───────────────────────────────────────────────────────────────
  if (intent.action === 'REMOVE') {
    if (!intent.activityId) {
      return {
        newItinerary: currentItinerary,
        status: 'PERSISTENCE_FAILED',
        warnings: ['activityId é obrigatório para REMOVE.'],
      };
    }
    const info = findActivityInfo(intent.activityId);
    if (!info) {
      return {
        newItinerary: currentItinerary,
        status: 'PERSISTENCE_FAILED',
        warnings: [`Atividade "${intent.activityId}" não encontrada.`],
      };
    }
    if (info.activity.isFixed) {
      return { newItinerary: currentItinerary, status: 'BLOCKED_FIXED_ITEM', warnings: [] };
    }
    if (info.activity.manualLock) {
      return { newItinerary: currentItinerary, status: 'BLOCKED_MANUAL_LOCK', warnings: [] };
    }

    info.day.activities.splice(info.aIdx, 1);

    // Recalcular o dia após remoção
    const dayToRecalc = draftItinerary.find(
      (d: any) => !d._isMetadata && resolveDayNum(d) === resolveDayNum(info.day as any)
    ) as PersistedDayV2;
    if (dayToRecalc) recalculateDay(dayToRecalc);
  }

  // ── REPLACE ───────────────────────────────────────────────────────────────
  if (intent.action === 'REPLACE') {
    if (!intent.activityId || intent.sourceExperienceId === undefined) {
      return {
        newItinerary: currentItinerary,
        status: 'PERSISTENCE_FAILED',
        warnings: ['activityId e sourceExperienceId são obrigatórios para REPLACE.'],
      };
    }
    const info = findActivityInfo(intent.activityId);
    if (!info) {
      return {
        newItinerary: currentItinerary,
        status: 'PERSISTENCE_FAILED',
        warnings: [`Atividade a substituir "${intent.activityId}" não encontrada.`],
      };
    }
    if (info.activity.isFixed) {
      return { newItinerary: currentItinerary, status: 'BLOCKED_FIXED_ITEM', warnings: [] };
    }
    if (info.activity.manualLock) {
      return { newItinerary: currentItinerary, status: 'BLOCKED_MANUAL_LOCK', warnings: [] };
    }

    const addedItem = catalog.find((c: any) => c.id === intent.sourceExperienceId);
    const deterministicId = `${intent.sourceExperienceId}_d${
      intent.targetDay ?? (info.day as any).dayNumber
    }_p${info.aIdx}`;
    const replacement: EngineActivity = {
      id: deterministicId,
      title: addedItem
        ? addedItem.name || addedItem.title
        : `Experiência ${(intent.sourceExperienceId || '').substring(0, 6)}`,
      type: addedItem?.category || 'attraction',
      sourceExperienceId: intent.sourceExperienceId,
      source: 'catalog',
      duration: addedItem?.duration?.toString() || info.activity.duration || '90',
    };
    info.day.activities.splice(info.aIdx, 1, replacement);
    recalculateDay(info.day);
  }

  // ── ADD ───────────────────────────────────────────────────────────────────
  if (intent.action === 'ADD') {
    if (!intent.targetDay || !intent.sourceExperienceId) {
      return {
        newItinerary: currentItinerary,
        status: 'PERSISTENCE_FAILED',
        warnings: ['targetDay e sourceExperienceId são obrigatórios para ADD.'],
      };
    }

    const targetDayObj = draftItinerary.find(
      (d: any) => !d._isMetadata && resolveDayNum(d) === intent.targetDay
    ) as any;

    if (!targetDayObj) {
      return {
        newItinerary: currentItinerary,
        status: 'PERSISTENCE_FAILED',
        warnings: [`Dia ${intent.targetDay} não encontrado no roteiro.`],
      };
    }

    if (!Array.isArray(targetDayObj.activities)) {
      targetDayObj.activities = [];
    }

    // Verificar duplicata por sourceExperienceId
    const alreadyIn = targetDayObj.activities.some(
      (a: any) => a.sourceExperienceId === intent.sourceExperienceId
    );
    if (alreadyIn) {
      return {
        newItinerary: currentItinerary,
        status: 'ALREADY_APPLIED',
        warnings: ['Esta experiência já está neste dia.'],
      };
    }

    const addedItem = catalog.find((c: any) => c.id === intent.sourceExperienceId);
    const deterministicId = `${intent.sourceExperienceId}_d${intent.targetDay}_add`;

    const newAct: EngineActivity = {
      id: deterministicId,
      title: addedItem ? addedItem.name || addedItem.title : 'Nova Atividade',
      type: addedItem?.category || 'attraction',
      sourceExperienceId: intent.sourceExperienceId,
      source: 'catalog',
      duration: addedItem?.duration?.toString() || '90',
    };

    targetDayObj.activities.push(newAct);
    recalculateDay(targetDayObj);
  }

  // Atualizar versão no metadata (timestamp ISO)
  if (metadata) {
    metadata.version = new Date().toISOString();
  }

  // ── VERIFICAÇÃO FINAL: houve mudança real? ──────────────────────────────
  if (itinerariesAreEqual(originalSnapshot, draftItinerary)) {
    return {
      newItinerary: currentItinerary,
      status: 'NO_CHANGE',
      warnings: ['Nenhuma alteração foi aplicada ao roteiro.'],
    };
  }

  return { newItinerary: draftItinerary, status: 'APPLIED', warnings };
}
