import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { badgesAPI } from '@/services/api/badges.api';
import { BadgeDTO } from '@/types/entities';
import { Pageable } from '@/types/api';
import { toast } from 'react-hot-toast';

export function useBadges(pageable?: Pageable) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['badges', pageable],
    queryFn: () => badgesAPI.getAllBadges(pageable)
  });

  const createMutation = useMutation({
    mutationFn: badgesAPI.createBadge,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['badges'] });
      toast.success('Badge créé avec succès');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erreur lors de la création du badge');
    }
  });

  // Note: L'API ne fournit pas de méthode updateBadge générique
  // Les badges peuvent être activés/désactivés ou assignés uniquement
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: BadgeDTO }) => {
      // Pour le moment, on utilisera activate/deactivate selon l'état du badge
      if (data.active) {
        return badgesAPI.activateBadge(id);
      } else {
        return badgesAPI.deactivateBadge(id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['badges'] });
      toast.success('Badge modifié avec succès');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erreur lors de la modification du badge');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: badgesAPI.deleteBadge,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['badges'] });
      toast.success('Badge supprimé avec succès');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erreur lors de la suppression du badge');
    }
  });

  const activateMutation = useMutation({
    mutationFn: badgesAPI.activateBadge,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['badges'] });
      toast.success('Badge activé avec succès');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erreur lors de l\'activation du badge');
    }
  });

  const deactivateMutation = useMutation({
    mutationFn: badgesAPI.deactivateBadge,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['badges'] });
      toast.success('Badge désactivé avec succès');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erreur lors de la désactivation du badge');
    }
  });

  const assignMutation = useMutation({
    mutationFn: ({ utilisateurId, badgeId }: { utilisateurId: number; badgeId: number }) =>
      badgesAPI.assignBadge(utilisateurId, badgeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['badges'] });
      toast.success('Badge assigné avec succès');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erreur lors de l\'assignation du badge');
    }
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error,
    createBadge: createMutation.mutateAsync,
    updateBadge: updateMutation.mutateAsync,
    deleteBadge: deleteMutation.mutateAsync,
    activateBadge: activateMutation.mutateAsync,
    deactivateBadge: deactivateMutation.mutateAsync,
    assignBadge: assignMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    refetch: query.refetch
  };
}

export function useBadgeById(id: number) {
  return useQuery({
    queryKey: ['badge', id],
    queryFn: () => badgesAPI.getBadgeById(id),
    enabled: !!id
  });
}

export function useBadgeByCode(codeBadge: string) {
  return useQuery({
    queryKey: ['badge', 'code', codeBadge],
    queryFn: () => badgesAPI.getBadgeByCode(codeBadge),
    enabled: !!codeBadge
  });
}