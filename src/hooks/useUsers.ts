import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersAPI } from '@/services/api/users.api';
import { UtilisateurDTO, RegisterRequest } from '@/types/entities';
import { Pageable } from '@/types/api';
import toast from 'react-hot-toast';

export const useUsers = (pageable?: Pageable) => {
  const queryClient = useQueryClient();

  // Query principale pour lister les utilisateurs
  const usersQuery = useQuery({
    queryKey: ['users', pageable],
    queryFn: () => usersAPI.getAllUsers(pageable),
    staleTime: 2 * 60 * 1000,
  });

  // Mutation pour créer un utilisateur
  const createUserMutation = useMutation({
    mutationFn: usersAPI.createUser,
    onSuccess: (newUser) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success(`Utilisateur "${newUser.prenom} ${newUser.nom}" créé avec succès`);
    },
    onError: (error: any) => {
      toast.error('Erreur lors de la création de l\'utilisateur');
      console.error('Erreur création utilisateur:', error);
    }
  });

  // Mutation pour mettre à jour un utilisateur
  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<UtilisateurDTO> }) => 
      usersAPI.updateUser(id, data),
    onSuccess: (updatedUser) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user', updatedUser.id] });
      toast.success(`Utilisateur "${updatedUser.prenom} ${updatedUser.nom}" mis à jour`);
    },
    onError: (error: any) => {
      toast.error('Erreur lors de la mise à jour de l\'utilisateur');
      console.error('Erreur mise à jour utilisateur:', error);
    }
  });

  // Mutation pour supprimer un utilisateur
  const deleteUserMutation = useMutation({
    mutationFn: usersAPI.deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Utilisateur supprimé avec succès');
    },
    onError: (error: any) => {
      toast.error('Erreur lors de la suppression de l\'utilisateur');
      console.error('Erreur suppression utilisateur:', error);
    }
  });

  // Mutation pour recharger le solde
  const chargeBalanceMutation = useMutation({
    mutationFn: ({ userId, amount }: { userId: number; amount: number }) => 
      usersAPI.chargeUserBalance(userId, amount),
    onSuccess: (updatedUser) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user', updatedUser.id] });
      toast.success(`Solde rechargé: ${updatedUser.solde}€`);
    },
    onError: (error: any) => {
      toast.error('Erreur lors du rechargement du solde');
      console.error('Erreur rechargement solde:', error);
    }
  });

  // Mutation pour initialiser le solde
  const initializeBalanceMutation = useMutation({
    mutationFn: usersAPI.initializeUserBalance,
    onSuccess: (updatedUser) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user', updatedUser.id] });
      toast.success('Solde initialisé');
    },
    onError: (error: any) => {
      toast.error('Erreur lors de l\'initialisation du solde');
      console.error('Erreur initialisation solde:', error);
    }
  });

  // Mutation pour changer la catégorie
  const changeCategoryMutation = useMutation({
    mutationFn: ({ userId, cadre }: { userId: number; cadre: string }) => 
      usersAPI.changeUserCategory(userId, cadre),
    onSuccess: (updatedUser) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user', updatedUser.id] });
      toast.success('Catégorie mise à jour');
    },
    onError: (error: any) => {
      toast.error('Erreur lors du changement de catégorie');
      console.error('Erreur changement catégorie:', error);
    }
  });

  return {
    // Données
    users: usersQuery.data,
    isLoading: usersQuery.isLoading,
    error: usersQuery.error,
    isError: usersQuery.isError,

    // Actions
    createUser: createUserMutation.mutateAsync,
    updateUser: updateUserMutation.mutateAsync,
    deleteUser: deleteUserMutation.mutateAsync,
    chargeBalance: chargeBalanceMutation.mutateAsync,
    initializeBalance: initializeBalanceMutation.mutateAsync,
    changeCategory: changeCategoryMutation.mutateAsync,

    // États des mutations
    isCreating: createUserMutation.isPending,
    isUpdating: updateUserMutation.isPending,
    isDeleting: deleteUserMutation.isPending,
    isChargingBalance: chargeBalanceMutation.isPending,
    isInitializingBalance: initializeBalanceMutation.isPending,
    isChangingCategory: changeCategoryMutation.isPending,

    // Refetch
    refetch: usersQuery.refetch,
  };
};

// Hook pour obtenir un utilisateur spécifique
export const useUser = (id: number) => {
  return useQuery({
    queryKey: ['user', id],
    queryFn: () => usersAPI.getUserById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

// Hook pour obtenir les utilisateurs non assignés
export const useUnassignedUsers = (pageable?: Pageable) => {
  return useQuery({
    queryKey: ['users', 'unassigned', pageable],
    queryFn: () => usersAPI.getUnassignedUsers(pageable),
    staleTime: 2 * 60 * 1000,
  });
};

// Hook pour obtenir les caissiers
export const useCaissiers = (pageable?: Pageable) => {
  return useQuery({
    queryKey: ['users', 'caissiers', pageable],
    queryFn: () => usersAPI.getCaissiers(pageable),
    staleTime: 2 * 60 * 1000,
  });
};

export default useUsers;