import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '@/services/api/auth.api';
import { usersAPI } from '@/services/api/users.api';
import { LoginRequest, UtilisateurResponse } from '@/types/entities';
import { tokenManager } from '@/services/api/axios';
import toast from 'react-hot-toast';
import { useState, useEffect } from 'react';

export const useAuth = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [isLoggedOut, setIsLoggedOut] = useState(false);

  // Vérifier si les tokens sont présents au chargement
  const hasTokens = !!tokenManager.getAccessToken();

  // Query pour obtenir l'utilisateur actuel
  const {
    data: currentUser,
    isLoading: isLoadingUser,
    error: userError
  } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      try {
        console.log('🔍 Récupération de l\'utilisateur connecté...');
        const user = await usersAPI.getCurrentUser();
        console.log('✅ Utilisateur connecté récupéré:', user);
        return user;
      } catch (error) {
        console.error('❌ Erreur lors de la récupération de l\'utilisateur:', error);
        
        // MODIFIÉ : Vérifier si on est offline avant de forcer logout
        if (!navigator.onLine) {
          console.log('📴 Mode offline détecté - pas de déconnexion forcée');
          throw error; // Laisser l'erreur se propager sans logout
        }
        
        // Si c'est une erreur d'authentification (401, 403) ET qu'on est online
        if ((error as any)?.response?.status === 401 || (error as any)?.response?.status === 403) {
          console.log('🚨 Token invalide, déconnexion forcée');
          authAPI.forceLogout();
        }
        
        throw error;
      }
    },
    enabled: hasTokens && !isLoggedOut, // Désactiver la query si pas de token ou si déconnecté
    retry: (failureCount, error) => {
      // Ne pas retry si offline
      if (!navigator.onLine) {
        console.log('📴 Pas de retry en mode offline');
        return false;
      }
      
      // Ne pas retry sur les erreurs d'auth
      if ((error as any)?.response?.status === 401 || (error as any)?.response?.status === 403) {
        return false;
      }
      return failureCount < 2;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  // Mutation de connexion - utilise la nouvelle API
  const loginMutation = useMutation({
    mutationFn: (credentials: LoginRequest) => authAPI.login(credentials),
    onSuccess: (user) => {
      console.log('✅ Login réussi, utilisateur:', user);
      
      // Mettre à jour le cache
      queryClient.setQueryData(['currentUser'], user);
      
      // Reset du flag de déconnexion
      setIsLoggedOut(false);
      
      // Message de bienvenue
      const welcomeMessage = user?.prenom && user?.nom 
        ? `Bienvenue, ${user.prenom} ${user.nom}`
        : 'Connexion réussie';
      toast.success(welcomeMessage);
      
      // Redirection vers le dashboard
      navigate('/dashboard', { replace: true });
    },
    onError: (error: any) => {
      console.error('❌ Erreur de connexion:', error);
      
      let errorMessage = 'Échec de la connexion. Vérifiez vos identifiants.';
      
      // Messages d'erreur spécifiques selon le backend
      if (error.response?.status === 401) {
        errorMessage = 'Email ou mot de passe incorrect';
      } else if (error.response?.status === 429) {
        errorMessage = 'Trop de tentatives de connexion. Réessayez plus tard.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      toast.error(errorMessage);
    }
  });

  // Mutation de déconnexion - utilise la nouvelle API
  const logoutMutation = useMutation({
    mutationFn: authAPI.logout,
    onSuccess: () => {
      console.log('✅ Logout réussi, nettoyage du cache...');
      
      // Marquer comme déconnecté
      setIsLoggedOut(true);
      
      // Nettoyer complètement le cache React Query
      queryClient.clear();
      queryClient.removeQueries();
      
      toast.success('Déconnexion réussie');
      
      // Redirection vers la page de login
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 100);
    },
    onError: (error) => {
      console.error('❌ Erreur de déconnexion:', error);
      
      // Marquer comme déconnecté même en cas d'erreur
      setIsLoggedOut(true);
      
      // Nettoyer quand même le cache
      queryClient.clear();
      queryClient.removeQueries();
      
      toast.error('Erreur lors de la déconnexion, mais vous avez été déconnecté');
      
      // Redirection forcée
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 100);
    }
  });

  // SUPPRIMÉ : La redirection automatique qui causait le problème
  // L'effet qui forçait la redirection vers login a été retiré
  // La vérification d'auth se fera maintenant uniquement via ProtectedRoute

  const login = (credentials: LoginRequest) => {
    return loginMutation.mutateAsync(credentials);
  };

  const logout = () => {
    console.log('🚪 Début du processus de déconnexion...');
    return logoutMutation.mutateAsync();
  };

  // Un utilisateur est authentifié s'il a des tokens valides ET des données utilisateur
  const isAuthenticated = !isLoggedOut && hasTokens && !!currentUser && authAPI.isAuthenticated();

  const hasRole = (requiredRole: string | string[]): boolean => {
    if (!currentUser || !currentUser.role || isLoggedOut) return false;
    
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    return roles.includes(currentUser.role);
  };

  const hasAnyRole = (roles: string[]): boolean => {
    if (!currentUser || !currentUser.role || isLoggedOut) {
      return false;
    }
    return roles.some(role => currentUser.role === role);
  };

  const isAdmin = hasAnyRole(['ADMIN', 'SUPER_ADMIN']);
  const isSuperAdmin = hasRole('SUPER_ADMIN');
  const isEmploye = hasRole('EMPLOYE');
  const isCaissier = hasRole('CAISSIER');

  // Debug info (à supprimer en production)
  useEffect(() => {
    console.log('🔍 Auth state:', {
      hasTokens,
      isLoggedOut,
      currentUser: currentUser?.email,
      isAuthenticated,
      isLoadingUser,
      isOnline: navigator.onLine
    });
  }, [hasTokens, isLoggedOut, currentUser, isAuthenticated, isLoadingUser]);

  return {
    // État
    currentUser,
    isAuthenticated,
    isLoadingUser,
    userError,

    // Actions
    login,
    logout,
    isLoggingIn: loginMutation.isPending,
    isLoggingOut: logoutMutation.isPending,

    // Vérifications de rôles
    hasRole,
    hasAnyRole,
    isAdmin,
    isSuperAdmin,
    isEmploye,
    isCaissier,
  };
};

export default useAuth;