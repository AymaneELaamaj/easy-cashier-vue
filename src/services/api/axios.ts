import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import toast from 'react-hot-toast';
import Cookies from 'js-cookie';
import { ErrorResponse } from '@/types/api';

// Configuration de base
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Constantes pour les tokens
const ACCESS_TOKEN_KEY = 'easypos_access_token';
const REFRESH_TOKEN_KEY = 'easypos_refresh_token';

// Utilitaires pour la gestion des tokens
export const tokenManager = {
  getAccessToken: () => Cookies.get(ACCESS_TOKEN_KEY),
  setAccessToken: (token: string) => 
    Cookies.set(ACCESS_TOKEN_KEY, token, { expires: 1 }), // 1 jour
  removeAccessToken: () => Cookies.remove(ACCESS_TOKEN_KEY),
  
  getRefreshToken: () => Cookies.get(REFRESH_TOKEN_KEY),
  setRefreshToken: (token: string) => 
    Cookies.set(REFRESH_TOKEN_KEY, token, { expires: 7 }), // 7 jours
  removeRefreshToken: () => Cookies.remove(REFRESH_TOKEN_KEY),
  
  clearTokens: () => {
    Cookies.remove(ACCESS_TOKEN_KEY);
    Cookies.remove(REFRESH_TOKEN_KEY);
  }
};

// Intercepteur de requête - Injection du token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = tokenManager.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Variable pour éviter les boucles de refresh
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });
  
  failedQueue = [];
};

// Intercepteur de réponse - Gestion des erreurs et refresh token
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError<ErrorResponse>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Gestion des erreurs 401 - Token expiré
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Éviter le refresh sur les endpoints d'auth pour éviter les boucles infinies
      if (originalRequest.url?.includes('/auth/login') || 
          originalRequest.url?.includes('/auth/refresh') ||
          originalRequest.url?.includes('/auth/logout')) {
        tokenManager.clearTokens();
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // Si un refresh est déjà en cours, mettre en queue
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
          }
          return api(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = tokenManager.getRefreshToken();
      
      if (refreshToken) {
        try {
          console.log('🔄 Tentative de refresh automatique...');
          
          // Utiliser l'endpoint exact de votre backend
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken: refreshToken
          });

          console.log('✅ Refresh automatique réussi');

          const { accessToken, refreshToken: newRefreshToken } = response.data;
          
          if (!accessToken) {
            throw new Error('Access token manquant dans la réponse');
          }

          // Sauvegarder les nouveaux tokens
          tokenManager.setAccessToken(accessToken);
          if (newRefreshToken) {
            tokenManager.setRefreshToken(newRefreshToken);
          }
          
          // Mettre à jour l'en-tête de la requête originale
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          }

          // Traiter la queue des requêtes en attente
          processQueue(null, accessToken);
          
          // Relancer la requête originale
          return api(originalRequest);
          
        } catch (refreshError: any) {
          console.error('❌ Erreur refresh automatique:', refreshError);
          
          processQueue(refreshError, null);
          tokenManager.clearTokens();
          
          // Rediriger vers login seulement si pas déjà dessus
          if (window.location.pathname !== '/login') {
            console.log('🚪 Redirection vers login...');
            window.location.href = '/login';
          }
          
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      } else {
        console.log('🚫 Pas de refresh token, redirection vers login');
        
        // Pas de refresh token, redirection vers login
        tokenManager.clearTokens();
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    }

    // Gestion des autres erreurs
    handleApiError(error);
    return Promise.reject(error);
  }
);

// Gestionnaire d'erreurs centralisé
const handleApiError = (error: AxiosError<ErrorResponse>) => {
  let message = 'Une erreur est survenue';
  
  if (error.response?.data?.message) {
    message = error.response.data.message;
  } else if (error.message) {
    message = error.message;
  }
  
  // Afficher le toast d'erreur
  if (error.response?.status !== 401) { // Éviter les toasts pour les 401 (gérés par la redirection)
    toast.error(message);
  }
  
  // Log pour le debug
  console.error('API Error:', {
    status: error.response?.status,
    message,
    url: error.config?.url,
    method: error.config?.method
  });
};

export default api;