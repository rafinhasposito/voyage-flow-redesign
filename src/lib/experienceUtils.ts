import { FormState } from "@/pages/admin/ExperienceEditor";
import { Database } from "@/types/supabase.types";

type ExperienceInsert = Database["public"]["Tables"]["experiences"]["Insert"];

export function isValidExperienceId(value: string | undefined | null): boolean {
  if (!value) return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}

export type RouteMode = "create" | "edit" | "invalid";

export function resolveExperienceRouteMode(id: string | undefined | null): { mode: RouteMode; id: string | null } {
  if (id === undefined || id === null || id === "new") {
    return { mode: "create", id: null };
  }

  if (isValidExperienceId(id)) {
    return { mode: "edit", id };
  }

  return { mode: "invalid", id: null };
}

export function validateExperienceForm(form: FormState, destinationsError: string | null): { valid: boolean; error?: string } {
  if (!form.title.trim()) return { valid: false, error: "O título é obrigatório." };
  if (!form.destination_id) return { valid: false, error: "O destino é obrigatório." };
  if (destinationsError) return { valid: false, error: "Erro ao carregar destinos." };
  return { valid: true };
}

export function buildExperiencePayload(form: FormState): ExperienceInsert {
  const row: ExperienceInsert = {
    title: form.title,
    description: form.description,
    short_description: form.short_description,
    category: form.category || 'Atração',
    status: form.status,
    destination_id: String(form.destination_id),
    address: form.address,
    neighborhood: form.neighborhood,
    location_lat: form.location_lat,
    location_lng: form.location_lng,
    duration_minutes: form.duration_minutes,
    base_cost: form.base_cost,
    booking_url: form.booking_url,
    media_urls: form.media_urls,
    intelligence_metadata: form.intelligence_metadata || null
  };

  if (form.partner_id && String(form.partner_id).trim() !== "") {
    row.partner_id = String(form.partner_id);
  }

  return row;
}

export const safeScale = (val: unknown, def: number) => {
  if (val === undefined || val === null || typeof val !== 'number') return def * 100;
  return Math.round(val * 100);
};

export function mapNodeToFormState(node: Record<string, unknown>, prev: Record<string, unknown>): Record<string, unknown> {
  const ai = (node.intelligence_metadata as Record<string, unknown>) || {};
  const weights = (ai.personaWeights as Record<string, unknown>) || {};
  const comp = (ai.companionshipCompatibility as Record<string, unknown>) || {};

  return {
    ...prev,
    title: node.title || '',
    description: node.description || '',
    short_description: node.short_description || '',
    category: node.category || '',
    type: node.type || node.category || '',
    status: node.status || 'draft',
    destination_id: node.destination_id || '',

    address: node.address || '',
    neighborhood: node.neighborhood || 'Midtown',
    location_lat: node.location_lat,
    location_lng: node.location_lng,

    duration_minutes: node.duration_minutes ?? 60,
    reservation_required: node.reservation_required ?? false,
    check_in_time: node.check_in_time || null,
    check_out_time: node.check_out_time || null,

    base_cost: node.base_cost ?? 0,
    booking_url: node.booking_url || '',

    tags: node.tags || [],
    personas: node.personas || [],
    rating: node.rating ?? null,
    reviews_count: node.reviews_count ?? null,
    is_must_see: node.is_must_see ?? false,
    exclusivity_level: node.exclusivity_level || 'accessible',
    dress_code: node.dress_code || 'casual',
    climate: node.climate || '',
    ideal_companion: node.ideal_companion || '',

    personaWeights: {
      explorador_visual: safeScale(weights.explorador_visual, 0.5),
      curador_experiencias: safeScale(weights.curador_experiencias, 0.5),
      descobridor: safeScale(weights.descobridor, 0.5),
      aproveitador: safeScale(weights.aproveitador, 0.5),
      slow_traveler: safeScale(weights.slow_traveler, 0.5)
    },
    companionshipCompatibility: {
      solo: safeScale(comp.solo, 0.5),
      couple: safeScale(comp.couple, 0.5),
      family: safeScale(comp.family, 0.5),
      friends: safeScale(comp.friends, 0.5)
    },
    recommendedSeasons: (ai.recommendedSeasons as string[]) || ['all'],
    weatherCompatibility: (ai.weatherCompatibility as string[]) || ['all'],

    media_urls: node.media_urls || [],
    intelligence_metadata: node.intelligence_metadata as Record<string, unknown> | null,
    partner_id: node.partner_id || ''
  };
}

export function normalizeTechnicalType(val: string | null | undefined): string {
  if (!val) return 'all';
  const lower = val.trim().toLowerCase();
  if (lower === 'hotel' || lower === 'lodging' || lower === 'hospedagens' || lower === 'hospedagem') return 'lodging';
  if (lower === 'restaurant' || lower === 'dining' || lower === 'restaurantes' || lower === 'restaurante') return 'dining';
  if (lower === 'attraction' || lower === 'attractions' || lower === 'atrações' || lower === 'atração') return 'attractions';
  if (lower === 'event' || lower === 'events' || lower === 'eventos' || lower === 'evento') return 'events';
  return lower;
}

export function matchesExperienceSection(exp: Record<string, unknown>, section: string): boolean {
  if (section === 'all') return true;

  const typeLower = (((exp.type as string)) || '').trim().toLowerCase();
  const catLower = (((exp.category as string)) || '').trim().toLowerCase();

  if (section === 'lodging') {
    if (['hotel', 'hostel', 'apartment', 'accommodation'].includes(typeLower)) return true;
    if (!typeLower && ['hospedagem', 'hostel', 'hotel'].includes(catLower)) return true;
    return false;
  }

  if (section === 'dining') {
    if (['restaurant', 'cafe', 'bar'].includes(typeLower)) return true;
    if (!typeLower && ['restaurante', 'alimentação', 'bar', 'cafe'].includes(catLower)) return true;
    return false;
  }

  if (section === 'attractions') {
    if (['attraction', 'museum', 'park', 'tour', 'theater', 'viewpoint'].includes(typeLower)) return true;
    if (typeLower === 'event') return true;
    if (!typeLower && ['atração', 'museu', 'parque', 'tour'].includes(catLower)) return true;
    return false;
  }

  if (section === 'events') {
    if (['event', 'festival', 'concert'].includes(typeLower)) return true;
    if (!typeLower && ['evento', 'show'].includes(catLower)) return true;
    return false;
  }

  return false;
}
