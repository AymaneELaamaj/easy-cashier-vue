import api, { tokenManager } from './axios';
import { ApiResponse } from '@/types/api';
import { LoginRequest, UtilisateurDTO } from '@/types/entities';

export const authAPI = {
  // Connexion
  login: async (credentials: LoginRequest): Promise<UtilisateurDTO> => {
    const response = await api.post<ApiResponse<UtilisateurDTO>>('/auth/login', credentials);
    
    // Supposons que les tokens sont dans la réponse ou les headers
    const { data } = response.data;
    
    // Si les tokens sont dans les headers (exemple)
    const accessToken = response.headers['authorization']?.replace('Bearer ', '') || 
                       response.headers['x-access-token'];
    const refreshToken = response.headers['x-refresh-token'];
    
    if (accessToken) {
      tokenManager.setAccessToken(accessToken);
    }
    if (refreshToken) {
      tokenManager.setRefreshToken(refreshToken);
    }
    
    return data;
  },

  // Déconnexion
  logout: async (): Promise<void> => {
    try {
      // Optionnel: appel API pour invalider le token côté serveur
      await api.post('/auth/logout');
    } catch (error) {
      // Ignorer les erreurs de logout côté serveur
      console.warn('Erreur lors du logout côté serveur:', error);
    } finally {
      // Toujours nettoyer les tokens locaux
      tokenManager.clearTokens();
    }
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
  }
};

export default authAPI;