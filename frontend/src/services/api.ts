import axios, { type InternalAxiosRequestConfig } from 'axios';
import { shouldAttemptRefreshForUrl } from './tokenRefresh';

/**
 * Garante que todas as chamadas usem o prefixo `/api` do backend.
 * Evita 404 silencioso quando `VITE_API_URL` vem como `http://localhost:3000` (sem `/api`).
 */
const normalizeApiBaseUrl = (raw: string | undefined): string => {
  const fallback = 'http://localhost:3000/api';
  if (!raw || !raw.trim()) {
    return fallback;
  }
  const trimmed = raw.trim().replace(/\/+$/, '');
  if (trimmed.endsWith('/api')) {
    return trimmed;
  }
  return `${trimmed}/api`;
};

export const API_BASE_URL = normalizeApiBaseUrl(import.meta.env.VITE_API_URL as string | undefined);

const api = axios.create({
  baseURL: API_BASE_URL,
});

type RetryableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

let refreshInFlight: Promise<void> | null = null;

const clearStoredSession = () => {
  localStorage.removeItem('@App:token');
  localStorage.removeItem('@App:refreshToken');
  localStorage.removeItem('@App:user');
};

const runRefresh = async (): Promise<void> => {
  const refreshToken = localStorage.getItem('@App:refreshToken');
  if (!refreshToken) {
    throw new Error('Sem refresh token');
  }
  const { data } = await axios.post<{ token: string; refreshToken?: string }>(
    `${API_BASE_URL}/auth/refresh`,
    { refreshToken },
    { headers: { 'Content-Type': 'application/json' } },
  );
  localStorage.setItem('@App:token', data.token);
  if (data.refreshToken) {
    localStorage.setItem('@App:refreshToken', data.refreshToken);
  }
};

// Interceptor para injetar o token JWT em todas as requisições
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('@App:token');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Interceptor: renova access token com refresh quando a API retorna 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;
    const originalRequest = error.config as RetryableConfig | undefined;
    const url = originalRequest?.url;

    // 401 na repetição após refresh (ou token ainda recusado): encerra sessão na UI
    if (status === 401 && originalRequest?._retry) {
      clearStoredSession();
      window.dispatchEvent(new CustomEvent('auth:session-expired'));
      return Promise.reject(error);
    }

    if (status !== 401 || !originalRequest || originalRequest._retry || !shouldAttemptRefreshForUrl(url)) {
      return Promise.reject(error);
    }

    if (!localStorage.getItem('@App:refreshToken')) {
      clearStoredSession();
      window.dispatchEvent(new CustomEvent('auth:session-expired'));
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      if (!refreshInFlight) {
        refreshInFlight = runRefresh().finally(() => {
          refreshInFlight = null;
        });
      }
      await refreshInFlight;
      const newToken = localStorage.getItem('@App:token');
      if (!newToken) {
        throw new Error('Token não retornado após refresh');
      }
      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return api(originalRequest);
    } catch {
      clearStoredSession();
      window.dispatchEvent(new CustomEvent('auth:session-expired'));
      return Promise.reject(error);
    }
  },
);

export default api;
