import { describe, it, expect } from 'vitest';
// Simulação local dos helpers testáveis da Edge Function

function handleCorsOptions(origin: string) {
  const ALLOWED_ORIGINS = ['http://localhost:5173', 'https://admin.voyageflow.com'];
  return ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
}

function sanitizePagination(pageStr: string, limitStr: string) {
  const page = Math.max(1, isNaN(parseInt(pageStr)) ? 1 : parseInt(pageStr));
  let limit = Math.max(1, isNaN(parseInt(limitStr)) ? 25 : parseInt(limitStr));
  limit = Math.min(limit, 100);
  return { page, limit };
}

function sanitizeSearchString(search: string) {
  if (search.length > 50) return search.substring(0, 50);
  return search;
}

function sanitizeB2CUser(user: any) {
  return {
    id: user.id,
    email: user.email,
    created_at: user.created_at,
    last_sign_in_at: user.last_sign_in_at
  };
}

describe('Edge Function: admin-list-users (Helpers)', () => {
  it('1 e 2. origem permitida e bloqueada (CORS)', () => {
    expect(handleCorsOptions('http://localhost:5173')).toBe('http://localhost:5173');
    expect(handleCorsOptions('https://hacker.com')).toBe('http://localhost:5173'); // fallback seguro
  });

  it('5, 6 e 7. paginação (padrão, limite 100, inválida)', () => {
    expect(sanitizePagination('', '')).toEqual({ page: 1, limit: 25 });
    expect(sanitizePagination('0', '150')).toEqual({ page: 1, limit: 100 });
    expect(sanitizePagination('abc', 'def')).toEqual({ page: 1, limit: 25 });
  });

  it('8. busca acima de 50 caracteres truncada', () => {
    const long = 'a'.repeat(60);
    expect(sanitizeSearchString(long).length).toBe(50);
  });

  it('9 e 11. sanitização do DTO ignora role injetada', () => {
    const raw = {
      id: '123',
      email: 'a@b.com',
      created_at: 'now',
      last_sign_in_at: 'now',
      password: 'hash',
      role: 'admin' // Injetada indevidamente
    };
    const safe = sanitizeB2CUser(raw);
    expect((safe as any).password).toBeUndefined();
    expect((safe as any).role).toBeUndefined();
    expect(safe.id).toBe('123');
  });
});
