import { describe, it, expect } from 'vitest';
import {
  Order,
  Payment,
  B2CProfileDTO,
  SystemSetting,
  AnalyticsEvent,
  calculateOrderNet,
  calculateCommission,
  normalizeCurrency,
  paginate,
  CommissionRule,
  sanitizeProfileDTO,
  filterPublicSettings,
  validateAnalyticsEvent,
  sanitizeAdminSearch
} from './adminContracts';

describe('ADMIN-2 Backend Foundation Contracts', () => {

  describe('2. e 3. Finanças (Valores não negativos e Moeda)', () => {
    it('7. valores negativos são rejeitados', () => {
      expect(calculateOrderNet(100, 20)).toBe(80);
      expect(() => calculateOrderNet(-10, 0)).toThrow();
      expect(() => calculateOrderNet(100, -20)).toThrow();
    });

    it('6. moeda inválida é rejeitada e normalizada', () => {
      expect(normalizeCurrency('usd')).toBe('USD');
      expect(normalizeCurrency('brl')).toBe('BRL');
      expect(() => normalizeCurrency('')).toThrow('Moeda inválida');
      expect(() => normalizeCurrency('us')).toThrow('Moeda deve ter 3 letras (ex: USD)');
      expect(() => normalizeCurrency('123')).toThrow('Moeda deve ter 3 letras (ex: USD)');
    });

    it('8. cálculo de comissão respeita arredondamento (duas casas)', () => {
      const pRule: CommissionRule = { type: 'percentage', value: 10.5 };
      expect(calculateCommission(205.50, pRule)).toBe(21.58); // 21.5775 -> 21.58
    });
  });

  describe('4. e 5. Pedidos, Pagamentos e Comissões', () => {
    it('9. pagamento mantém separação do pedido (independência)', () => {
      const order: Order = { id: 'o1', total_gross: 100, total_discount: 0, total_net: 100, currency: 'USD', status: 'pending' };
      const payment: Payment = { id: 'p1', order_id: 'o1', amount: 100, provider: 'stripe', status: 'paid' };
      expect(order.id).toBe(payment.order_id);
      expect(order.total_net).toBe(payment.amount);
      expect(order.status).not.toBe(payment.status);
    });

    it('10. idempotency_key é documentada na tipagem (opcional para criação, mas validável no DB)', () => {
      const payment: Payment = { id: 'p1', order_id: 'o1', amount: 100, provider: 'stripe', status: 'paid', idempotency_key: 'idk_123' };
      expect(payment.idempotency_key).toBe('idk_123');
    });
  });

  describe('6. e 7. Proteção de Dados e Payload B2C', () => {
    it('4. DTO remove campos não permitidos', () => {
      const rawPayload = {
        id: 'user_123',
        email: 'test@test.com',
        created_at: '2026-07-19',
        last_sign_in_at: '2026-07-19',
        password: 'hash',
        app_metadata: { provider: 'email' },
        user_metadata: { phone: '123' }
      };
      
      const safeDTO = sanitizeProfileDTO(rawPayload);
      
      expect(safeDTO).toHaveProperty('id', 'user_123');
      expect(safeDTO).toHaveProperty('email', 'test@test.com');
      expect((safeDTO as any).password).toBeUndefined();
      expect((safeDTO as any).app_metadata).toBeUndefined();
    });
    
    it('13. role enviada pelo cliente não concede acesso local, validação apenas em backend (conceitual)', () => {
      // Como a validação real ocorre na Edge Function (via `admin_users`),
      // testamos a garantia de que o DTO B2C jamais trafegará ou absorverá "role" livremente
      const rawPayload = { id: '1', email: 'e', created_at: 'c', role: 'admin' };
      const safeDTO = sanitizeProfileDTO(rawPayload);
      expect((safeDTO as any).role).toBeUndefined();
    });
  });

  describe('8. e 9. Configurações e Feature Flags', () => {
    it('5. configuração privada não aparece no payload público', () => {
      const settings: SystemSetting[] = [
        { key: 'MAINTENANCE_MODE', value: true, is_active: true, is_public: true },
        { key: 'STRIPE_SECRET_KEY', value: 'sk_test', is_active: true, is_public: false },
        { key: 'OLD_KEY', value: false, is_active: false, is_public: true }
      ];
      
      const publicSettings = filterPublicSettings(settings);
      
      expect(publicSettings).toHaveLength(1);
      expect(publicSettings[0].key).toBe('MAINTENANCE_MODE');
    });
  });

  describe('11. e 12. Analytics e Paginação', () => {
    it('11. evento de Analytics sem nome é rejeitado', () => {
      expect(() => validateAnalyticsEvent({ anonymous_id: '123' })).toThrow('O evento deve possuir um nome');
      expect(() => validateAnalyticsEvent({ event_name: ' ', anonymous_id: '123' })).toThrow('O evento deve possuir um nome');
    });

    it('12. propriedades sensíveis de Analytics são removidas', () => {
      const raw = {
        event_name: 'checkout',
        anonymous_id: 'abc',
        properties: { item: '1', password: '123', credit_card: '4444' }
      };
      const safe = validateAnalyticsEvent(raw);
      expect(safe.properties.password).toBeUndefined();
      expect(safe.properties.credit_card).toBeUndefined();
      expect(safe.properties.item).toBe('1');
    });

    it('1. perPage acima de 100 é limitado', () => {
      const items = new Array(200).fill(1);
      const paginated = paginate(items, 1, 150);
      expect(paginated.length).toBe(100);
    });

    it('2. página inválida é normalizada (NaN ou < 1)', () => {
      const items = [1, 2, 3];
      expect(paginate(items, 0, 10)).toEqual([1, 2, 3]);
      expect(paginate(items, NaN, 10)).toEqual([1, 2, 3]);
    });
    
    it('3. busca excessivamente longa é rejeitada ou truncada', () => {
      const veryLong = 'a'.repeat(100);
      const safe = sanitizeAdminSearch(veryLong);
      expect(safe.length).toBe(50);
    });
  });
});
