import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '@/services/api/auth.api';
import { usersAPI } from '@/services/api/users.api';
import { LoginRequest, UtilisateurDTO } from '@/types/entities';
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
        
        // Si c'est une erreur d'authentification (401, 403), forcer la déconnexion
        if ((error as any)?.response?.status === 401 || (error as any)?.response?.status === 403) {
          console.log('🚨 Token invalide, déconnexion forcée');
          tokenManager.clearTokens();
          localStorage.removeItem('user');
          navigate('/login', { replace: true });
        }
        
        // En mode développement, retourner un utilisateur temporaire pour éviter les erreurs
        if (process.env.NODE_ENV === 'development') {
          console.warn('⚠️ Mode développement: utilisateur temporaire');
          return {
            id: 1,
            nom: 'Dev',
            prenom: 'User',
            email: 'dev@example.com',
            role: 'ADMIN',
            solde: 0,
            isActive: true
          } as UtilisateurDTO;
        }
        throw error;
      }
    },
    enabled: hasTokens && !isLoggedOut, // Désactiver la query si pas de token ou si déconnecté
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  // Mutation de connexion
  const loginMutation = useMutation({
    mutationFn: (credentials: LoginRequest) => authAPI.login(credentials),
    onSuccess: (user) => {
      queryClient.setQueryData(['currentUser'], user);
      // Invalider et refetch les données utilisateur pour s'assurer qu'elles sont à jour
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      setIsLoggedOut(false); // Reset du flag de déconnexion
      toast.success(user ? `Bienvenue, ${user.prenom ?? ''} ${user.nom ?? ''}`.trim() : 'Connexion réussie');
      
      // Redirection vers le dashboard après connexion réussie
      navigate('/dashboard', { replace: true });
    },
    onError: (error: any) => {
      console.error('Erreur de connexion:', error);
      toast.error('Échec de la connexion. Vérifiez vos identifiants.');
    }
  });

  // Mutation de déconnexion améliorée
  const logoutMutation = useMutation({
    mutationFn: authAPI.logout,
    onSuccess: () => {
      console.log('✅ Logout API réussi, nettoyage du cache...');
      
      // Marquer comme déconnecté
      setIsLoggedOut(true);
      
      // Nettoyer complètement le cache React Query
      queryClient.clear();
      queryClient.removeQueries();
      
      toast.success('Déconnexion réussie');
      
      // Redirection vers la page de login après déconnexion
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 100); // Petit délai pour laisser le temps au state de se mettre à jour
    },
    onError: (error) => {
      console.error('❌ Erreur de déconnexion:', error);
      
      // Marquer comme déconnecté même en cas d'erreur
      setIsLoggedOut(true);
      
      // Nettoyer quand même en cas d'erreur
      queryClient.clear();
      queryClient.removeQueries();
      
      toast.error('Erreur lors de la déconnexion, mais vous avez été déconnecté');
      
      // Redirection forcée même en cas d'erreur
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 100);
    }
  });

  const login = (credentials: LoginRequest) => {
    return loginMutation.mutateAsync(credentials);
  };

  const logout = () => {
    console.log('🚪 Début du processus de déconnexion...');
    return logoutMutation.mutateAsync();
  };

  // Un utilisateur est authentifié s'il a un token valide ET n'est pas marqué comme déconnecté
  const isAuthenticated = !isLoggedOut && hasTokens && !!currentUser;

  const hasRole = (requiredRole: string | string[]): boolean => {
    if (!currentUser || !currentUser.role) return false;
    
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    return roles.includes(currentUser.role);
  };

  const hasAnyRole = (roles: string[]): boolean => {
    if (!currentUser || !currentUser.role || isLoggedOut) {
      return false; // Plus de fallback en mode dev
    }
    return roles.some(role => currentUser.role === role);
  };

  const isAdmin = hasAnyRole(['ADMIN', 'SUPER_ADMIN']);
  const isSuperAdmin = hasRole('SUPER_ADMIN');
  const isEmploye = hasRole('EMPLOYE');
  const isCaissier = hasRole('CAISSIER');

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