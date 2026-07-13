import { describe, it, expect } from 'vitest';
import { mapAdminAuthError, getSafeAdminRedirect } from './adminAuthUtils';

describe('mapAdminAuthError', () => {
  it('deve mapear credenciais inválidas', () => {
    expect(mapAdminAuthError({ message: 'Invalid login credentials' })).toBe('E-mail ou senha inválidos.');
  });
  it('deve mapear erro de rede', () => {
    expect(mapAdminAuthError({ message: 'Failed to fetch' })).toBe('Não foi possível conectar. Verifique sua internet e tente novamente.');
  });
  it('deve mapear erro desconhecido', () => {
    expect(mapAdminAuthError({ message: 'unknown error' })).toBe('Não foi possível entrar agora. Tente novamente.');
  });
  it('deve lidar com objeto inesperado', () => {
    expect(mapAdminAuthError(null)).toBe('Não foi possível entrar agora. Tente novamente.');
    expect(mapAdminAuthError('string erro')).toBe('Não foi possível entrar agora. Tente novamente.');
  });
});

describe('getSafeAdminRedirect', () => {
  it('/admin/dashboard é aceito', () => {
    expect(getSafeAdminRedirect({ from: { pathname: '/admin/dashboard' } })).toBe('/admin/dashboard');
  });
  it('rota com search e hash é preservada', () => {
    expect(getSafeAdminRedirect({ from: { pathname: '/admin/users', search: '?q=1', hash: '#top' } })).toBe('/admin/users?q=1#top');
  });
  it('/admin/login cai em /admin', () => {
    expect(getSafeAdminRedirect({ from: { pathname: '/admin/login' } })).toBe('/admin');
  });
  it('/app cai em /admin', () => {
    expect(getSafeAdminRedirect({ from: { pathname: '/app' } })).toBe('/admin');
  });
  it('https://dominio.com cai em /admin', () => {
    expect(getSafeAdminRedirect({ from: { pathname: 'https://dominio.com' } })).toBe('/admin');
  });
  it('//dominio.com cai em /admin', () => {
    expect(getSafeAdminRedirect({ from: { pathname: '//dominio.com' } })).toBe('/admin');
  });
  it('javascript: cai em /admin', () => {
    expect(getSafeAdminRedirect({ from: { pathname: 'javascript:alert(1)' } })).toBe('/admin');
  });
  it('estado nulo cai em /admin', () => {
    expect(getSafeAdminRedirect(null)).toBe('/admin');
  });
  it('objeto malformado cai em /admin', () => {
    expect(getSafeAdminRedirect({ missingFrom: true })).toBe('/admin');
    expect(getSafeAdminRedirect({ from: 'not object' })).toBe('/admin');
  });
});
