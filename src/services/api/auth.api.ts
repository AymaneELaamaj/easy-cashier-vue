import api, { tokenManager } from './axios';
import { ApiResponse } from '@/types/api';
import { LoginRequest, UtilisateurResponse } from '@/types/entities';

export const authAPI = {
  // Connexion - alignée avec le backend
  login: async (credentials: LoginRequest): Promise<UtilisateurResponse> => {
    console.log('🔐 Tentative de connexion pour:', credentials.email);
    
    const response = await api.post<ApiResponse<UtilisateurResponse>>('/auth/login', credentials);
    
    console.log('✅ Réponse login reçue:', response.data);
    
    // Vérifier la structure de réponse de votre backend
    const userData: UtilisateurResponse = response.data.data as UtilisateurResponse;
    
    // Votre backend retourne probablement les tokens dans la réponse
    // Adapter selon la structure exacte de votre réponse
    const accessToken = (userData as any)?.accessToken || 
                       (response.data as any)?.accessToken ||
                       (userData as any)?.token || 
                       (response.data as any)?.token;

    const refreshToken = (userData as any)?.refreshToken || 
                        (response.data as any)?.refreshToken;
    
    // Fallback: vérifier les headers
    const headerAccessToken = response.headers['authorization']?.replace('Bearer ', '') || 
                             response.headers['x-access-token'];
    const headerRefreshToken = response.headers['x-refresh-token'];
    
    // Sauvegarder les tokens
    if (accessToken || headerAccessToken) {
      const finalAccessToken = accessToken || headerAccessToken;
      tokenManager.setAccessToken(finalAccessToken);
      console.log('💾 Access token sauvegardé');
    }
    
    if (refreshToken || headerRefreshToken) {
      const finalRefreshToken = refreshToken || headerRefreshToken;
      tokenManager.setRefreshToken(finalRefreshToken);
      console.log('💾 Refresh token sauvegardé');
    }
    
    return userData;
  },

  // Refresh token - utilise l'endpoint backend exact
  refreshToken: async (): Promise<{ accessToken: string; refreshToken: string }> => {
    console.log('🔄 Tentative de refresh token...');
    
    const currentRefreshToken = tokenManager.getRefreshToken();
    if (!currentRefreshToken) {
      throw new Error('Aucun refresh token disponible');
    }

    try {
      // Utilise exactement la structure attendue par votre backend
      const response = await api.post('/auth/refresh', {
        refreshToken: currentRefreshToken
      });

      console.log('✅ Refresh token réussi:', response.data);

      // Votre backend retourne { accessToken, refreshToken }
      const { accessToken, refreshToken } = response.data;
      
      if (!accessToken || !refreshToken) {
        throw new Error('Tokens manquants dans la réponse');
      }

      // Sauvegarder les nouveaux tokens
      tokenManager.setAccessToken(accessToken);
      tokenManager.setRefreshToken(refreshToken);
      
      console.log('💾 Nouveaux tokens sauvegardés');
      
      return { accessToken, refreshToken };
      
    } catch (error: any) {
      console.error('❌ Erreur refresh token:', error);
      
      // En cas d'erreur, nettoyer les tokens et forcer la déconnexion
      tokenManager.clearTokens();
      
      // Si on est pas déjà sur la page login, rediriger
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
      
      throw error;
    }
  },

  // Logout - utilise l'endpoint backend exact
  logout: async (): Promise<void> => {
    console.log('🚪 Déconnexion via API backend...');
    
    try {
      // Appel à l'endpoint logout de votre backend
      const response = await api.post('/auth/logout');
      
      console.log('✅ Logout backend réussi:', response.data);
      
    } catch (error: any) {
      console.warn('⚠️ Erreur logout backend:', error);
      
      // Même en cas d'erreur backend, on continue la déconnexion locale
      // Car l'utilisateur veut se déconnecter
    } finally {
      // Toujours nettoyer les tokens locaux
      console.log('🧹 Nettoyage des tokens locaux...');
      tokenManager.clearTokens();
      
      // Nettoyer d'autres données locales
      localStorage.removeItem('user');
      sessionStorage.clear();
      
      console.log('✅ Déconnexion locale terminée');
    }
  },

  // Déconnexion forcée (pour les cas d'erreur ou token expiré)
  forceLogout: (): void => {
    console.log('🚨 Déconnexion forcée (token invalide/expiré)');
    tokenManager.clearTokens();
    localStorage.removeItem('user');
    sessionStorage.clear();
    
    // Rediriger vers la page de login
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  },

  // Vérifier si l'utilisateur est connecté
  isAuthenticated: (): boolean => {
    const accessToken = tokenManager.getAccessToken();
    if (!accessToken) {
      console.log('🚫 Pas de token d\'accès');
      return false;
    }
    
    try {
      // Vérifier si le token n'est pas expiré
      const payload = JSON.parse(atob(accessToken.split('.')[1]));
      const now = Date.now() / 1000;
      
      if (payload.exp && payload.exp < now) {
        console.log('🕐 Access token expiré');
        
        // Vérifier si on a un refresh token pour essayer de le renouveler
        const refreshToken = tokenManager.getRefreshToken();
        if (refreshToken) {
          console.log('🔄 Refresh token disponible, tentative de renouvellement...');
          // La logique de refresh sera gérée par l'intercepteur axios
          return true; // On laisse l'intercepteur gérer
        } else {
          console.log('🚫 Pas de refresh token, déconnexion forcée');
          authAPI.forceLogout();
          return false;
        }
      }
      
      return true;
      
    } catch (error) {
      console.warn('⚠️ Token invalide:', error);
      authAPI.forceLogout();
      return false;
    }
  },

  // Méthode pour obtenir les informations du token (optionnel)
  getTokenInfo: () => {
    const token = tokenManager.getAccessToken();
    if (!token) return null;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return {
        email: payload.sub,
        roles: payload.roles || [],
        exp: payload.exp,
        iat: payload.iat
      };
    } catch (error) {
      console.warn('Erreur décodage token:', error);
      return null;
    }
  }
};

export default authAPI;