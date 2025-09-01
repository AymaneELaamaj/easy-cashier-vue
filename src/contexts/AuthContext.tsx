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
    
    // Après connexion réussie, rediriger selon le rôle
    if (user.role === 'CAISSIER') {
      // Les caissiers vont directement au POS
      navigate('/pos', { replace: true });
    } else {
      // Les autres rôles vont au dashboard (ou là où ils étaient avant)
      const from = (location.state as any)?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
    
    return user;
  };

  const contextValue: AuthContextType = {
    ...authHook,
    login: loginWithRedirection, // On override le login avec notre logique
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