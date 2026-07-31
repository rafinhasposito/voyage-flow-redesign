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

export const isFactEmpty = (val: any) => {
  if (val === null || val === undefined) return true;
  if (typeof val === 'string' && val.trim() === '') return true;
  return false; // 0 and false are considered NOT empty
};

export function sanitizeRestrictionsProvenance(
  facts: Record<string, any>,
  provenance: Record<string, any> | null,
  selectedFields: string[]
): { provenance: Record<string, any> | null; selectedFields: string[] } {
  let changed = false;
  const newProv = { ...(provenance || {}) };
  let newSelected = [...(selectedFields || [])];

  const restrictionKeys = [
    "min_age", "adult_only", "family_with_children_allowed", "requires_companion",
    "minimum_group_size", "maximum_group_size", "wheelchair_accessible", "stairs_required", "accessibility_notes"
  ];

  for (const key of restrictionKeys) {
    if (isFactEmpty(facts[key])) {
      if (newProv[key]) {
        delete newProv[key];
        changed = true;
      }
      if (newSelected.includes(key)) {
        newSelected = newSelected.filter(k => k !== key);
        changed = true;
      }
    }
  }

  if (changed) {
    return {
      provenance: Object.keys(newProv).length > 0 ? newProv : null,
      selectedFields: newSelected
    };
  }

  return { provenance, selectedFields };
}

export const defaultForm: FormState = {
  title: "", description: "", short_description: "", category: "Atração", type: "attraction", status: "draft", destination_id: "",
  address: "", neighborhood: "Midtown", location_lat: null, location_lng: null,
  duration_minutes: 60, reservation_required: false, check_in_time: null, check_out_time: null,
  base_cost: 0, booking_url: "",
  tags: [], personas: [], rating: null, reviews_count: null, is_must_see: false, exclusivity_level: "accessible", dress_code: "casual", climate: "", ideal_companion: "",
  personaWeights: { explorador_visual: null, curador_experiencias: null, descobridor: null, aproveitador: null, slow_traveler: null },
  companionshipCompatibility: { solo: null, couple: null, family: null, friends: null },
  recommendedSeasons: ["all"], weatherCompatibility: ["all"],
  media_urls: [], video_embed_url: null, cover_image_url: null,
  min_age: null, adult_only: null, family_with_children_allowed: null, requires_companion: null,
  minimum_group_size: null, maximum_group_size: null, wheelchair_accessible: null, stairs_required: null,
  accessibility_notes: null, restrictions_provenance: null,
  _ui_provenance_source: null, _ui_provenance_source_url: null, _ui_provenance_verified_at: null, _ui_provenance_verified_by: null, _ui_provenance_selected_fields: [],
  _original_intelligence_metadata: null,
  manualOverride: false
};

export function buildExperiencePayload(form: FormState): ExperienceInsert {
  const scaleDown = (val: number | null): number | null => (val === null ? null : val / 100);

  const intelligence: Record<string, any> = {
    ...(form._original_intelligence_metadata || {})
  };

  const hasAnyWeight = Object.values(form.personaWeights).some(v => v !== null) || Object.values(form.companionshipCompatibility).some(v => v !== null);

  if (hasAnyWeight) {
    intelligence.personaWeights = {
      explorador_visual: scaleDown(form.personaWeights.explorador_visual),
      curador_experiencias: scaleDown(form.personaWeights.curador_experiencias),
      descobridor: scaleDown(form.personaWeights.descobridor),
      aproveitador: scaleDown(form.personaWeights.aproveitador),
      slow_traveler: scaleDown(form.personaWeights.slow_traveler)
    };
    intelligence.companionshipCompatibility = {
      solo: scaleDown(form.companionshipCompatibility.solo),
      couple: scaleDown(form.companionshipCompatibility.couple),
      family: scaleDown(form.companionshipCompatibility.family),
      friends: scaleDown(form.companionshipCompatibility.friends)
    };
  }

  // Only assign if they are actively provided by the rules engine or manual
  if (form.intelligence_metadata_source) intelligence.source = form.intelligence_metadata_source;
  if (form.intelligence_metadata_calculatedAt) intelligence.calculatedAt = form.intelligence_metadata_calculatedAt;

  if (form.manualOverride) {
    intelligence.manualOverride = true;
    intelligence.source = "manual";
  }

  // Safely update arrays only if changed from what we parsed
  const origRecommended = intelligence.recommendedSeasons || ['all'];
  const origWeather = intelligence.weatherCompatibility || ['all'];
  const origVideo = intelligence.video_embed_url || null;
  const origCoverMediaUrl = intelligence.cover_media_url || null;
  const origCoverMediaType = intelligence.cover_media_type || null;
  const origCoverMediaPosterUrl = intelligence.cover_media_poster_url || null;

  if (JSON.stringify(form.recommendedSeasons) !== JSON.stringify(origRecommended)) {
    intelligence.recommendedSeasons = form.recommendedSeasons;
  }
  if (JSON.stringify(form.weatherCompatibility) !== JSON.stringify(origWeather)) {
    intelligence.weatherCompatibility = form.weatherCompatibility;
  }
  if (form.video_embed_url !== origVideo) {
    intelligence.video_embed_url = form.video_embed_url;
  }

  if (form.cover_media_url !== origCoverMediaUrl) {
    intelligence.cover_media_url = form.cover_media_url;
  }
  if (form.cover_media_type !== origCoverMediaType) {
    intelligence.cover_media_type = form.cover_media_type;
  }
  if (form.cover_media_poster_url !== origCoverMediaPosterUrl) {
    intelligence.cover_media_poster_url = form.cover_media_poster_url;
  }

  // Clear out empty objects if intelligence is just an empty object and we had nothing
  const intelligenceValue = Object.keys(intelligence).length > 0 ? intelligence : null;

  const row: ExperienceInsert = {
    title: form.title,
    description: form.description,
    short_description: form.short_description,
    category: form.category || 'Atração',
    type: form.type,
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
    intelligence_metadata: intelligenceValue,
    min_age: form.min_age !== undefined ? form.min_age : null,
    adult_only: form.adult_only !== undefined ? form.adult_only : null,
    family_with_children_allowed: form.family_with_children_allowed !== undefined ? form.family_with_children_allowed : null,
    requires_companion: form.requires_companion !== undefined ? form.requires_companion : null,
    minimum_group_size: form.minimum_group_size !== undefined ? form.minimum_group_size : null,
    maximum_group_size: form.maximum_group_size !== undefined ? form.maximum_group_size : null,
    wheelchair_accessible: form.wheelchair_accessible !== undefined ? form.wheelchair_accessible : null,
    stairs_required: form.stairs_required !== undefined ? form.stairs_required : null,
    accessibility_notes: form.accessibility_notes !== undefined ? form.accessibility_notes : null,
    restrictions_provenance: form.restrictions_provenance !== undefined ? form.restrictions_provenance : null
  };

  if (form.partner_id && String(form.partner_id).trim() !== "") {
    row.partner_id = String(form.partner_id);
  }

  return row;
}

export const safeScale = (val: unknown, def: number | null = null): number | null => {
  if (val === undefined || val === null || typeof val !== 'number') return def === null ? null : def * 100;
  if (val >= 0 && val <= 1) return val * 100;
  if (val > 1 && val <= 100) return val;
  return def === null ? null : def * 100;
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
      explorador_visual: safeScale(weights.explorador_visual),
      curador_experiencias: safeScale(weights.curador_experiencias),
      descobridor: safeScale(weights.descobridor),
      aproveitador: safeScale(weights.aproveitador),
      slow_traveler: safeScale(weights.slow_traveler)
    },
    companionshipCompatibility: {
      solo: safeScale(comp.solo),
      couple: safeScale(comp.couple),
      family: safeScale(comp.family),
      friends: safeScale(comp.friends)
    },
    recommendedSeasons: (ai.recommendedSeasons as string[]) || ['all'],
    weatherCompatibility: (ai.weatherCompatibility as string[]) || ['all'],

    media_urls: node.media_urls || [],
    video_embed_url: (ai.video_embed_url as string) || null,
    cover_media_url: (ai.cover_media_url as string) || null,
    cover_media_type: (ai.cover_media_type as 'image' | 'video') || null,
    cover_media_poster_url: (ai.cover_media_poster_url as string) || null,
    cover_image_url: (ai.cover_image_url as string) || null, // legacy
    intelligence_metadata_source: (ai.source as string) || undefined,
    intelligence_metadata_calculatedAt: (ai.calculatedAt as string) || undefined,
    manualOverride: (ai.manualOverride as boolean) || false,
    _original_intelligence_metadata: ai,

    // Precedence: structured column > intelligence_metadata > null
    min_age: node.min_age !== undefined ? node.min_age : (ai.min_age ?? null),
    adult_only: node.adult_only !== undefined ? node.adult_only : (ai.adult_only ?? null),
    family_with_children_allowed: node.family_with_children_allowed !== undefined ? node.family_with_children_allowed : (ai.family_with_children_allowed ?? null),
    requires_companion: node.requires_companion !== undefined ? node.requires_companion : (ai.requires_companion ?? null),
    minimum_group_size: node.minimum_group_size !== undefined ? node.minimum_group_size : (ai.minimum_group_size ?? null),
    maximum_group_size: node.maximum_group_size !== undefined ? node.maximum_group_size : (ai.maximum_group_size ?? null),
    wheelchair_accessible: node.wheelchair_accessible !== undefined ? node.wheelchair_accessible : (ai.wheelchair_accessible ?? null),
    stairs_required: node.stairs_required !== undefined ? node.stairs_required : (ai.stairs_required ?? null),
    accessibility_notes: node.accessibility_notes !== undefined ? node.accessibility_notes : (ai.accessibility_notes ?? null),
    restrictions_provenance: node.restrictions_provenance !== undefined ? node.restrictions_provenance : (ai.restrictions_provenance ?? null),

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
