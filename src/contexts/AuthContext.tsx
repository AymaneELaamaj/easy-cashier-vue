import React, { createContext, useContext, ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { UtilisateurResponse, LoginRequest } from '@/types/entities';

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

  return (
    <AuthContext.Provider value={authHook}>
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