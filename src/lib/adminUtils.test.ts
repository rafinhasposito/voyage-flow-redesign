import { describe, it, expect } from 'vitest';
import { 
  filterCatalogByType, 
  aggregateDestinations, 
  aggregateTags, 
  calculateAffiliateCoverage,
  isRouteSupportedByBackend
} from './adminUtils';

describe('Admin Module Logic (Zero Em Breve - ADMIN-1)', () => {

  const mockExperiences: any[] = [
    { id: '1', title: 'Hotel A', type: 'hotel', destination: 'Paris', tags: ['luxo', 'central'], booking_url: 'http' },
    { id: '2', title: 'Hotel B', type: 'hotel', destination: 'Paris', tags: ['LUXO', 'budget'], booking_url: null },
    { id: '3', title: 'Restaurante C', type: 'restaurant', destination: 'Rome', tags: ['jantar'], booking_url: 'http' },
    { id: '4', title: 'Evento D', type: 'event', destination: 'Paris', tags: [], booking_url: null, location_lat: null },
  ];

  describe('Filtros de Conteúdo (Bloco 1)', () => {
    it('deve aplicar corretamente type=hotel (Hospedagens)', () => {
      const hotels = filterCatalogByType(mockExperiences, 'hotel');
      expect(hotels).toHaveLength(2);
      expect(hotels.every(h => h.type === 'hotel')).toBe(true);
    });

    it('deve aplicar corretamente type=restaurant (Restaurantes)', () => {
      const rests = filterCatalogByType(mockExperiences, 'restaurant');
      expect(rests).toHaveLength(1);
      expect(rests[0].title).toBe('Restaurante C');
    });

    it('deve aplicar corretamente type=event (Eventos)', () => {
      const evts = filterCatalogByType(mockExperiences, 'event');
      expect(evts).toHaveLength(1);
      expect(evts[0].type).toBe('event');
    });
  });

  describe('Derivação de Destinos (Bloco 1)', () => {
    it('deve derivar destinos agrupados a partir de experiências reais', () => {
      const dests = aggregateDestinations(mockExperiences);
      expect(dests).toHaveLength(2); // Paris, Rome
      
      const paris = dests.find(d => d.name === 'Paris');
      expect(paris).toBeDefined();
      expect(paris?.totalExperiences).toBe(3); // 1, 2, 4
      
      // Valida detecção de erro logístico simulado (falta de lat/lng no item 4)
      expect(paris?.hasErrors).toBe(true);
      expect(paris?.issues).toContain('Coordenadas Ausentes');
    });
  });

  describe('Normalização de Inteligência (Bloco 2)', () => {
    it('deve agregar tags ignorando case-sensitive', () => {
      const tags = aggregateTags(mockExperiences);
      // 'luxo' e 'LUXO' devem contar como 1 tag = 'luxo' com 2 usos
      const luxo = tags.find(t => t.name === 'luxo');
      expect(luxo?.usageCount).toBe(2);
      expect(tags.find(t => t.name === 'budget')).toBeDefined();
    });
  });

  describe('Controle de Receita e Afiliados (Bloco 3)', () => {
    it('deve distinguir dados calculados reais (cobertura) de forma saudável', () => {
      const metrics = calculateAffiliateCoverage(mockExperiences);
      expect(metrics.totalLinks).toBe(2); // 1 e 3 tem link
      expect(metrics.coveragePercent).toBe(50); // 2 de 4
      expect(metrics.isHealthy).toBe(false); // 50 < 80
    });

    it('deve lidar com catálogo vazio', () => {
      const metrics = calculateAffiliateCoverage([]);
      expect(metrics.totalLinks).toBe(0);
      expect(metrics.coveragePercent).toBe(0);
    });
  });

  describe('Políticas B2B Restritivas (Bloco 4 & Lacunas)', () => {
    it('deve indicar corretamente as rotas documentadas sem backend', () => {
      // 1. Rota de Analytics
      expect(isRouteSupportedByBackend('/admin/analytics')).toBe(false);
      
      // 11. Parceiros apresenta corretamente ausência
      expect(isRouteSupportedByBackend('/admin/partners')).toBe(false);

      // 12. Vendas apresenta estado vazio real
      expect(isRouteSupportedByBackend('/admin/sales')).toBe(false);
      
      // Demais áreas B2B estão suportadas
      expect(isRouteSupportedByBackend('/admin/quality')).toBe(true);
      expect(isRouteSupportedByBackend('/admin/import')).toBe(true);
    });
  });
});
