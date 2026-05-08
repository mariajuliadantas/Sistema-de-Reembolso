import { shouldAttemptRefreshForUrl } from './tokenRefresh';

describe('shouldAttemptRefreshForUrl', () => {
  it('retorna false para login', () => {
    expect(shouldAttemptRefreshForUrl('/auth/login')).toBe(false);
  });

  it('retorna false para refresh', () => {
    expect(shouldAttemptRefreshForUrl('/auth/refresh')).toBe(false);
  });

  it('retorna true para rotas comuns da API', () => {
    expect(shouldAttemptRefreshForUrl('/reimbursements')).toBe(true);
    expect(shouldAttemptRefreshForUrl('/categories/active')).toBe(true);
  });

  it('retorna false quando url é indefinida', () => {
    expect(shouldAttemptRefreshForUrl(undefined)).toBe(false);
  });
});
