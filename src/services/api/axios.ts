import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import toast from 'react-hot-toast';
import Cookies from 'js-cookie';
import { ErrorResponse } from '@/types/api';

// ===== Base config =====
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ===== Token keys =====
const ACCESS_TOKEN_KEY = 'easypos_access_token';
const REFRESH_TOKEN_KEY = 'easypos_refresh_token';

// ===== Token manager =====
export const tokenManager = {
  getAccessToken: () => Cookies.get(ACCESS_TOKEN_KEY),
  setAccessToken: (token: string) => Cookies.set(ACCESS_TOKEN_KEY, token, { expires: 1 }),
  removeAccessToken: () => Cookies.remove(ACCESS_TOKEN_KEY),

  getRefreshToken: () => Cookies.get(REFRESH_TOKEN_KEY),
  setRefreshToken: (token: string) => Cookies.set(REFRESH_TOKEN_KEY, token, { expires: 7 }),
  removeRefreshToken: () => Cookies.remove(REFRESH_TOKEN_KEY),

  clearTokens: () => {
    Cookies.remove(ACCESS_TOKEN_KEY);
    Cookies.remove(REFRESH_TOKEN_KEY);
  }
};

// On autorise une propriété interne non transmise au serveur
type AxiosMeta = { silent?: boolean };
type ExtConfig = InternalAxiosRequestConfig & { meta?: AxiosMeta; _retry?: boolean };

// ===== Request interceptor: inject token =====
api.interceptors.request.use(
  (config: ExtConfig) => {
    const token = tokenManager.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // ⚠️ Ne JAMAIS mettre de header custom type X-Silent ici (CORS)
    return config;
  },
  (error) => Promise.reject(error)
);

// ===== Refresh queue handling =====
let isRefreshing = false;
let failedQueue: Array<{ resolve: (value?: any) => void; reject: (reason?: any) => void }> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => (error ? reject(error) : resolve(token)));
  failedQueue = [];
};

// ===== Response interceptor =====
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError<ErrorResponse>) => {
    const originalRequest = error.config as ExtConfig;

    // 401 → refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      // pas de refresh pour les routes d'auth
      if (
        originalRequest.url?.includes('/auth/login') ||
        originalRequest.url?.includes('/auth/refresh') ||
        originalRequest.url?.includes('/auth/logout')
      ) {
        tokenManager.clearTokens();
        if (window.location.pathname !== '/login') window.location.href = '/login';
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          if (originalRequest.headers && token) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
          }
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = tokenManager.getRefreshToken();
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
          const { accessToken, refreshToken: newRefreshToken } = (response as any).data || {};

          if (!accessToken) throw new Error('Access token manquant dans la réponse');

          tokenManager.setAccessToken(accessToken);
          if (newRefreshToken) tokenManager.setRefreshToken(newRefreshToken);

          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          }

          processQueue(null, accessToken);
          return api(originalRequest);
        } catch (refreshError) {
          processQueue(refreshError as any, null);
          tokenManager.clearTokens();
          if (window.location.pathname !== '/login') window.location.href = '/login';
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      } else {
        tokenManager.clearTokens();
        if (window.location.pathname !== '/login') window.location.href = '/login';
        return Promise.reject(error);
      }
    }

    // autres erreurs
    handleApiError(error);
    return Promise.reject(error);
  }
);

// ===== Centralized error handler =====
const handleApiError = (error: AxiosError<ErrorResponse>) => {
  const cfg = error.config as ExtConfig | undefined;
  const silent = cfg?.meta?.silent === true; // ← flag interne, pas de header envoyé

  let message = 'Une erreur est survenue';
  if (error.response?.data?.message) message = error.response.data.message;
  else if (error.message) message = error.message;

  // pas de toast si 401 (déjà géré) OU si silent
  if (error.response?.status !== 401 && !silent) {
    toast.error(message);
  }

  console.error('API Error:', {
    status: error.response?.status,
    message,
    url: error.config?.url,
    method: error.config?.method
  });
};

export default api;
