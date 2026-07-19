import { Database } from '@/types/supabase.types';

type ExperienceRow = Database['public']['Tables']['experiences']['Row'];

/**
 * Filtra a lista de experiências pelo tipo do catálogo.
 */
export function filterCatalogByType(experiences: ExperienceRow[], fixedType: string) {
  if (!fixedType) return experiences;
  return experiences.filter(e => e.type === fixedType);
}

/**
 * Agrupa destinos com base nas experiências fornecidas, retornando
 * contagem, vizinhanças únicas e status consolidados.
 */
export function aggregateDestinations(experiences: ExperienceRow[]) {
  const map = new Map<string, {
    totalExperiences: number;
    neighborhoods: Set<string>;
    hasErrors: boolean;
    issues: string[];
  }>();

  experiences.forEach(exp => {
    const dest = exp.destination || 'Desconhecido';
    const entry = map.get(dest) || {
      totalExperiences: 0,
      neighborhoods: new Set<string>(),
      hasErrors: false,
      issues: []
    };

    entry.totalExperiences += 1;
    if (exp.neighborhood) {
      entry.neighborhoods.add(exp.neighborhood);
    }
    
    // Calcula possíveis issues de qualidade que bloqueiam B2B
    if (!exp.location_lat || !exp.location_lng) {
      entry.hasErrors = true;
      if (!entry.issues.includes('Coordenadas Ausentes')) {
        entry.issues.push('Coordenadas Ausentes');
      }
    }

    map.set(dest, entry);
  });

  return Array.from(map.entries()).map(([name, data]) => ({
    name,
    totalExperiences: data.totalExperiences,
    neighborhoods: Array.from(data.neighborhoods),
    hasErrors: data.hasErrors,
    issues: data.issues
  })).sort((a, b) => b.totalExperiences - a.totalExperiences);
}

/**
 * Normaliza e agrupa a taxonomia de tags em uso.
 */
export function aggregateTags(experiences: ExperienceRow[]) {
  const tagMap = new Map<string, number>();

  experiences.forEach(exp => {
    if (Array.isArray(exp.tags)) {
      exp.tags.forEach(t => {
        if (typeof t === 'string') {
          const trimmed = t.trim().toLowerCase();
          tagMap.set(trimmed, (tagMap.get(trimmed) || 0) + 1);
        }
      });
    }
  });

  return Array.from(tagMap.entries())
    .map(([name, usageCount]) => ({ name, usageCount }))
    .sort((a, b) => b.usageCount - a.usageCount);
}

/**
 * Afiliados: calcula métricas reais baseadas no banco (links configurados).
 */
export function calculateAffiliateCoverage(experiences: ExperienceRow[]) {
  const total = experiences.length;
  if (total === 0) return { totalLinks: 0, coveragePercent: 0, isHealthy: false };
  
  const totalWithLink = experiences.filter(e => !!e.booking_url).length;
  const coveragePercent = Math.round((totalWithLink / total) * 100);
  
  return {
    totalLinks: totalWithLink,
    coveragePercent,
    isHealthy: coveragePercent >= 80
  };
}

/**
 * Verifica as rotas suportadas ativas na camada de visualização (simulação de permissão de rota)
 */
export function isRouteSupportedByBackend(routePath: string): boolean {
  const REQUIRED_BACKEND_ROUTES = ['/admin/partners', '/admin/sales', '/admin/analytics'];
  // Se está na lista, não é suportado plenamente pelo backend
  return !REQUIRED_BACKEND_ROUTES.includes(routePath);
}
