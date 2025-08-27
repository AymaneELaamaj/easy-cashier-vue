import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersAPI } from '@/services/api/users.api';
import { UtilisateurResponse, UtilisateurRequest } from '@/types/entities';
import { Pageable } from '@/types/api';
import toast from 'react-hot-toast';

export const useUsers = (pageable?: Pageable) => {
  const queryClient = useQueryClient();

  // Query principale pour lister les utilisateurs  
  const usersQuery = useQuery({
    queryKey: ['users', pageable],
    queryFn: async () => {
      console.log('🔍 Fetching users with pageable:', pageable);
      try {
        const result = await usersAPI.getAllUsers(pageable);
        console.log('✅ Users fetched successfully:', result);
        return result;
      } catch (error) {
        console.error('❌ Error fetching users:', error);
        throw error;
      }
    },
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
    mutationFn: ({ id, data }: { id: number; data: UtilisateurRequest }) => 
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

  // Mutation pour activer/désactiver un utilisateur
  const toggleStatusMutation = useMutation({
    mutationFn: ({ userId, isActive }: { userId: number; isActive: boolean }) => 
      usersAPI.toggleUserStatus(userId, isActive),
    onSuccess: (updatedUser) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user', updatedUser.id] });
      toast.success(`Statut utilisateur modifié`);
    },
    onError: (error: any) => {
      toast.error('Erreur lors du changement de statut');
      console.error('Erreur changement statut:', error);
    }
  });

  // Mutation pour déduire le solde
  const deductBalanceMutation = useMutation({
    mutationFn: ({ userId, amount, reason }: { userId: number; amount: number; reason: string }) => 
      usersAPI.deductBalance(userId, amount, reason),
    onSuccess: (updatedUser) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user', updatedUser.id] });
      toast.success(`Solde déduit: ${updatedUser.solde}€`);
    },
    onError: (error: any) => {
      toast.error('Erreur lors de la déduction du solde');
      console.error('Erreur déduction solde:', error);
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
    toggleStatus: toggleStatusMutation.mutateAsync,
    deductBalance: deductBalanceMutation.mutateAsync,

    // États des mutations
    isCreating: createUserMutation.isPending,
    isUpdating: updateUserMutation.isPending,
    isDeleting: deleteUserMutation.isPending,
    isTogglingStatus: toggleStatusMutation.isPending,
    isDeductingBalance: deductBalanceMutation.isPending,

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

// Hook pour obtenir les employés sans badge
export const useEmployeesWithoutBadge = () => {
  return useQuery({
    queryKey: ['employees', 'without-badge'],
    queryFn: async () => {
      console.log('🔍 Fetching employees without badge...');
      try {
        const result = await usersAPI.getEmployeesWithoutBadge();
        console.log('✅ Employees without badge fetched successfully:', result);
        return result;
      } catch (error) {
        console.error('❌ Error fetching employees without badge:', error);
        throw error;
      }
    },
    staleTime: 2 * 60 * 1000,
  });
};

export default useUsers;