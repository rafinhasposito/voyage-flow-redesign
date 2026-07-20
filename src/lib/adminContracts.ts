/**
 * Contratos Oficiais da Fundação B2B (Fase ADMIN-2)
 * Tipagem de entidades para a operação do painel de controle (Vendas, Afiliados, Analytics).
 */

export type CommissionRule = {
  type: 'percentage' | 'fixed';
  value: number;
};

export type SystemSetting = {
  key: string;
  value: any;
  is_active: boolean;
  is_public: boolean;
};

export type Partner = {
  id: string;
  name: string;
  type: 'ota' | 'direct' | 'affiliate_network';
  status: 'active' | 'inactive';
};

export type AffiliateProgram = {
  id: string;
  partner_id: string;
  platform: string;
  identifier: string;
  commission_model: 'percentage' | 'fixed';
  commission_value: number;
};

export type AffiliateLink = {
  id: string;
  original_url: string;
  affiliate_url: string;
  partner_id: string;
};

export type Order = {
  id: string;
  total_gross: number;
  total_discount: number;
  total_net: number;
  currency: string;
  status: 'pending' | 'paid' | 'cancelled' | 'refunded';
};

export type OrderItem = {
  id: string;
  order_id: string;
  experience_id: string | null;
  gross_price: number;
  commission_expected: number;
  currency: string;
};

export type Payment = {
  id: string;
  order_id: string;
  amount: number;
  provider: string;
  status: 'pending' | 'paid' | 'failed';
  idempotency_key?: string;
};

export type B2CProfileDTO = {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at?: string;
  // payload sanitizado: senha, hash e metadados sensíveis são excluídos.
};

export type AnalyticsEvent = {
  event_name: string;
  anonymous_id: string;
  source: string;
  properties: Record<string, any>;
};

// ==========================================
// FUNÇÕES PURAS E VALIDADORES REAIS DE DOMÍNIO
// ==========================================

export function calculateOrderNet(gross: number, discount: number): number {
  if (gross < 0 || discount < 0) {
    throw new Error('Valores financeiros não podem ser negativos');
  }
  return Math.max(0, gross - discount);
}

export function calculateCommission(net: number, rule: CommissionRule): number {
  if (net < 0) throw new Error('O valor líquido não pode ser negativo');
  if (rule.type === 'percentage') {
    // Retorna com arredondamento seguro de 2 casas
    return Math.round((net * rule.value) / 100 * 100) / 100;
  }
  return Math.round(rule.value * 100) / 100;
}

export function normalizeCurrency(currency: string): string {
  if (!currency || currency.trim() === '') throw new Error('Moeda inválida');
  const upper = currency.toUpperCase().trim();
  if (!/^[A-Z]{3}$/.test(upper)) throw new Error('Moeda deve ter 3 letras (ex: USD)');
  return upper;
}

export function paginate<T>(items: T[], page: number, limit: number): T[] {
  let safePage = Math.max(1, isNaN(page) ? 1 : page);
  let safeLimit = Math.max(1, isNaN(limit) ? 25 : limit);
  if (safeLimit > 100) safeLimit = 100; // Limite rígido
  const start = (safePage - 1) * safeLimit;
  return items.slice(start, start + safeLimit);
}

export function sanitizeProfileDTO(rawUser: any): B2CProfileDTO {
  const allowed = {
    id: rawUser.id,
    email: rawUser.email,
    created_at: rawUser.created_at,
    last_sign_in_at: rawUser.last_sign_in_at
  };
  
  // Remove chaves undefined para limpeza do DTO
  return JSON.parse(JSON.stringify(allowed));
}

export function filterPublicSettings(settings: SystemSetting[]): SystemSetting[] {
  return settings.filter(s => s.is_public && s.is_active);
}

export function validateAnalyticsEvent(event: Partial<AnalyticsEvent>): AnalyticsEvent {
  if (!event.event_name?.trim()) throw new Error('O evento deve possuir um nome');
  if (!event.anonymous_id?.trim()) throw new Error('Identificador anônimo obrigatório');
  
  const properties = event.properties || {};
  // Remover campos sensíveis genéricos que podem vazar
  if ('password' in properties) delete properties.password;
  if ('token' in properties) delete properties.token;
  if ('credit_card' in properties) delete properties.credit_card;

  return {
    event_name: event.event_name.trim(),
    anonymous_id: event.anonymous_id.trim(),
    source: event.source || 'web',
    properties
  };
}

export function sanitizeAdminSearch(query: string): string {
  if (!query) return '';
  let sanitized = query.trim();
  if (sanitized.length > 50) sanitized = sanitized.substring(0, 50);
  return sanitized;
}
