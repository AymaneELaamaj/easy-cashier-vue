import React, { createContext, useContext, ReactNode, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { UtilisateurResponse, LoginRequest } from '@/types/entities';
import { useNavigate, useLocation } from 'react-router-dom';

interface AuthContextType {
  // État
  currentUser: UtilisateurResponse | undefined;
  isAuthenticated: boolean;
  isLoadingUser: boolean;
  userError: any;

  // Actions
  login: (credentials: LoginRequest) => Promise<UtilisateurResponse>;
  logout: () => Promise<void>;
  isLoggingIn: boolean;
  isLoggingOut: boolean;

  // Vérifications de rôles
  hasRole: (requiredRole: string | string[]) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isEmploye: boolean;
  isCaissier: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const authHook = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirection automatique pour les caissiers après connexion
  useEffect(() => {
    if (authHook.isAuthenticated && authHook.currentUser) {
      const userRole = authHook.currentUser.role;
      
      // Si l'utilisateur est CAISSIER uniquement, le rediriger vers l'interface POS
      if (userRole === 'CAISSIER' && window.location.pathname !== '/pos') {
        navigate('/pos', { replace: true });
      }
      // Les autres rôles (ADMIN, SUPER_ADMIN) peuvent accéder au dashboard et au POS
    }
  }, [authHook.isAuthenticated, authHook.currentUser, navigate]);

  // Wrapper du login avec logique de redirection
 const loginWithRedirection = async (credentials: LoginRequest): Promise<UtilisateurResponse> => {
  const user = await authHook.login(credentials);
  
  // NOUVEAU : Envoyer le token au Service Worker après connexion réussie
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    try {
      const { offlineApiService } = await import('@/services/OfflineApiService');
      await offlineApiService.sendAuthTokenToServiceWorker();
      console.log('🔐 Token envoyé au Service Worker après login');
    } catch (error) {
      console.warn('⚠️ Erreur envoi token au SW:', error);
    }
  }
  
  // Logique de redirection selon le rôle (votre code existant)
  if (user.role === 'CAISSIER') {
    navigate('/pos', { replace: true });
  } else {
    const from = (location.state as any)?.from?.pathname || '/dashboard';
    navigate(from, { replace: true });
  }
  
  return user;
};

// AJOUTER cette nouvelle fonction de logout avec nettoyage SW
const logoutWithCleanup = async (): Promise<void> => {
  // NOUVEAU : Nettoyer le token du Service Worker avant logout
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    try {
      const { offlineApiService } = await import('@/services/OfflineApiService');
      await offlineApiService.clearAuthTokenFromServiceWorker();
      console.log('🧹 Token nettoyé du Service Worker avant logout');
    } catch (error) {
      console.warn('⚠️ Erreur nettoyage token SW:', error);
    }
  }
  
  // Continuer avec le logout normal
  await authHook.logout();
};

  const contextValue: AuthContextType = {
    ...authHook,
    login: loginWithRedirection, // On override le login avec notre logique
    logout: logoutWithCleanup, // NOUVEAU : utiliser la version avec nettoyage SW

  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;