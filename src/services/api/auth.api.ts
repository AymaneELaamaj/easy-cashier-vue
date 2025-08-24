import api, { tokenManager } from './axios';
import { ApiResponse } from '@/types/api';
import { LoginRequest, UtilisateurDTO } from '@/types/entities';

export const authAPI = {
  // Connexion
  login: async (credentials: LoginRequest): Promise<UtilisateurDTO> => {
    const response = await api.post<ApiResponse<UtilisateurDTO>>('/auth/login', credentials);
    
    const { data } = response.data;
    
    // Extraire les tokens du corps de la réponse (Spring Boot standard)
    const accessToken = (data as any)?.token || (data as any)?.accessToken || (response.data as any)?.token;
    const refreshToken = (data as any)?.refreshToken || (response.data as any)?.refreshToken;
    
    // Fallback: vérifier aussi les headers si nécessaire
    const headerAccessToken = response.headers['authorization']?.replace('Bearer ', '') || 
                             response.headers['x-access-token'];
    const headerRefreshToken = response.headers['x-refresh-token'];
    
    if (accessToken || headerAccessToken) {
      tokenManager.setAccessToken(accessToken || headerAccessToken);
    }
    if (refreshToken || headerRefreshToken) {
      tokenManager.setRefreshToken(refreshToken || headerRefreshToken);
    }
    
    return data;
  },

  // Déconnexion améliorée
  logout: async (): Promise<void> => {
    try {
      // Optionnel: Si vous ajoutez un endpoint logout côté serveur plus tard
      // await api.post('/auth/logout');
      
      console.log('🚪 Déconnexion en cours...');
    } catch (error) {
      // Ignorer les erreurs de logout côté serveur pour l'instant
      console.warn('⚠️ Pas d\'endpoint logout côté serveur (normal):', error);
    } finally {
      // Toujours nettoyer les tokens locaux
      console.log('🧹 Nettoyage des tokens locaux...');
      tokenManager.clearTokens();
      
      // Nettoyer d'autres données locales si nécessaire
      localStorage.removeItem('user');
      sessionStorage.clear();
      
      console.log('✅ Déconnexion terminée');
    }
  },

  // Déconnexion forcée (pour les cas d'erreur ou token expiré)
  forceLogout: (): void => {
    console.log('🚨 Déconnexion forcée (token invalide/expiré)');
    tokenManager.clearTokens();
    localStorage.removeItem('user');
    sessionStorage.clear();
    
    // Rediriger vers la page de login
    window.location.href = '/login';
  },

  // Vérification du token (optionnel)
  verifyToken: async (): Promise<UtilisateurDTO> => {
    const response = await api.get<ApiResponse<UtilisateurDTO>>('/auth/verify');
    return response.data.data;
  },

  // Refresh token (géré automatiquement par l'intercepteur)
  refreshToken: async (refreshToken: string): Promise<{ accessToken: string }> => {
    const response = await api.post('/auth/refresh', { refreshToken });
    return response.data;
  },

  // Vérifier si l'utilisateur est connecté
  isAuthenticated: (): boolean => {
    const token = tokenManager.getAccessToken();
    if (!token) return false;
    
    try {
      // Vérifier si le token n'est pas expiré (optionnel)
      const payload = JSON.parse(atob(token.split('.')[1]));
      const now = Date.now() / 1000;
      
      if (payload.exp && payload.exp < now) {
        console.log('🕐 Token expiré, déconnexion automatique');
        authAPI.forceLogout();
        return false;
      }
      
      return true;
    } catch (error) {
      console.warn('⚠️ Token invalide:', error);
      authAPI.forceLogout();
      return false;
    }
  }
};

export default authAPI;