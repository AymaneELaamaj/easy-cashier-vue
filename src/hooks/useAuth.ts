import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authAPI } from '@/services/api/auth.api';
import { usersAPI } from '@/services/api/users.api';
import { LoginRequest, UtilisateurDTO } from '@/types/entities';
import { tokenManager } from '@/services/api/axios';
import toast from 'react-hot-toast';

export const useAuth = () => {
  const queryClient = useQueryClient();

  // Query pour obtenir l'utilisateur actuel
  const {
    data: currentUser,
    isLoading: isLoadingUser,
    error: userError
  } = useQuery({
    queryKey: ['currentUser'],
    queryFn: usersAPI.getCurrentUser,
    enabled: !!tokenManager.getAccessToken(),
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Mutation de connexion
  const loginMutation = useMutation({
    mutationFn: (credentials: LoginRequest) => authAPI.login(credentials),
    onSuccess: (user) => {
      queryClient.setQueryData(['currentUser'], user);
      toast.success(user ? `Bienvenue, ${user.prenom ?? ''} ${user.nom ?? ''}`.trim() : 'Connexion réussie');
    },
    onError: (error: any) => {
      console.error('Erreur de connexion:', error);
      toast.error('Échec de la connexion. Vérifiez vos identifiants.');
    }
  });

  // Mutation de déconnexion
  const logoutMutation = useMutation({
    mutationFn: authAPI.logout,
    onSuccess: () => {
      queryClient.clear();
      queryClient.removeQueries();
      toast.success('Déconnexion réussie');
    },
    onError: (error) => {
      console.error('Erreur de déconnexion:', error);
      // Nettoyer quand même en cas d'erreur
      queryClient.clear();
      queryClient.removeQueries();
    }
  });

  const login = (credentials: LoginRequest) => {
    return loginMutation.mutateAsync(credentials);
  };

  const logout = () => {
    return logoutMutation.mutateAsync();
  };

  const isAuthenticated = !!tokenManager.getAccessToken() && !!currentUser;

  const hasRole = (requiredRole: string | string[]): boolean => {
    if (!currentUser) return false;
    
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    return roles.includes(currentUser.role);
  };

  const hasAnyRole = (roles: string[]): boolean => {
    if (!currentUser) return false;
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