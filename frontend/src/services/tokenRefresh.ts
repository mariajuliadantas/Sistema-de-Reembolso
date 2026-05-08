/**
 * Evita tentar renovar sessão em endpoints de credencial (evita loop e UX ruim).
 */
export function shouldAttemptRefreshForUrl(url: string | undefined): boolean {
  if (!url) {
    return false;
  }
  if (url.includes('/auth/login')) {
    return false;
  }
  if (url.includes('/auth/refresh')) {
    return false;
  }
  return true;
}
