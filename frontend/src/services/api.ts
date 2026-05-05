import axios from 'axios';

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

const api = axios.create({
  baseURL: normalizeApiBaseUrl(import.meta.env.VITE_API_URL as string | undefined),
});

// Interceptor para injetar o token JWT em todas as requisições
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('@App:token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
}, (error) => {
  return Promise.reject(error);
});

// Interceptor para tratar erros globais (ex: token expirado)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Se receber 401, podemos limpar o storage e forçar logout
      // localStorage.removeItem('@App:token');
      // localStorage.removeItem('@App:user');
      // window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
