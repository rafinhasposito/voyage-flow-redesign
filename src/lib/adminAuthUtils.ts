import { AuthError } from '@supabase/supabase-js';

export function mapAdminAuthError(error: unknown): string {
  if (!error) return 'Não foi possível entrar agora. Tente novamente.';
  
  if (typeof error === 'object' && 'message' in error) {
    const msg = (error as AuthError).message;
    if (msg === 'Invalid login credentials') {
      return 'E-mail ou senha inválidos.';
    }
    if (msg.includes('Failed to fetch') || msg.includes('Network Error')) {
      return 'Não foi possível conectar. Verifique sua internet e tente novamente.';
    }
  }
  
  return 'Não foi possível entrar agora. Tente novamente.';
}

export function getSafeAdminRedirect(state: unknown): string {
  const fallback = '/admin';
  if (!state || typeof state !== 'object') return fallback;

  const fromObj = (state as Record<string, unknown>).from;
  if (!fromObj || typeof fromObj !== 'object') return fallback;

  const path = fromObj.pathname || '';
  if (typeof path !== 'string') return fallback;

  if (path.includes('://') || path.startsWith('//') || path.startsWith('javascript:')) {
    return fallback;
  }

  if (path.startsWith('/admin') && !path.startsWith('/admin/login')) {
    const search = typeof fromObj.search === 'string' ? fromObj.search : '';
    const hash = typeof fromObj.hash === 'string' ? fromObj.hash : '';
    return `${path}${search}${hash}`;
  }

  return fallback;
}
