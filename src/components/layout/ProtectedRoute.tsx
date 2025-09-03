import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: string[];
  requireAuth?: boolean;
}

// Utilitaire pour détecter si on est offline
const isOfflineMode = (): boolean => {
  return !navigator.onLine;
};

// Utilitaire pour détecter si c'est l'interface POS
const isPOSRoute = (pathname: string): boolean => {
  return pathname === '/pos' || pathname.startsWith('/pos');
};

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRoles = [],
  requireAuth = true,
}) => {
  const { isAuthenticated, currentUser, isLoadingUser, hasAnyRole } = useAuthContext();
  const location = useLocation();

  // Attendre le chargement des données utilisateur
  if (isLoadingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  //  Autoriser l'accès à POS en mode offline même sans auth
  if (isPOSRoute(location.pathname) && isOfflineMode()) {
    console.log('🏪 Mode offline détecté pour POS - accès autorisé sans auth');
    return <>{children}</>;
  }

  // Vérifier l'authentification (seulement en ligne)
  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Vérifier les rôles requis
  if (requiredRoles.length > 0 && currentUser) {
    if (!hasAnyRole(requiredRoles)) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;