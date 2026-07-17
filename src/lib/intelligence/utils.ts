export function normalizeIntelligenceValue(value: number | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  
  if (isNaN(value)) return null;

  // Se o valor estiver na escala 0-100 por algum motivo legado de cálculo na memória, tratamos
  // Mas a persistência final canônica e em memória deve ser sempre 0-1
  // Por precaução, se vier um valor > 1 (ex: 85), nós convertemos para 0.85
  const normalized = value > 1 ? value / 100 : value;

  // Clamp 0-1
  return Math.max(0, Math.min(1, normalized));
}

export function toDisplayPercent(value: number | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  
  const normalized = normalizeIntelligenceValue(value);
  if (normalized === null) return null;

  return Math.round(normalized * 100);
}

export function fromDisplayPercent(percent: number | null | undefined): number | null {
  if (percent === null || percent === undefined) return null;
  
  if (isNaN(percent)) return null;

  // Clamp 0-100 para o percentual de entrada
  const clamped = Math.max(0, Math.min(100, percent));
  
  return clamped / 100;
}

export const PERSONA_DISPLAY_LABELS: Record<string, string> = {
  explorador_visual: "Visual",
  curador_experiencias: "Curador",
  aproveitador: "Entusiasta",
  descobridor: "Descobridor",
  slow_traveler: "Slow Traveler"
};
