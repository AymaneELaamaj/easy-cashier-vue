import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { subventionsAPI } from '@/services/api/subventions.api';
import { SubventionDTO } from '@/types/entities';
import { Pageable } from '@/types/api';
import { toast } from 'react-hot-toast';

export function useSubventions(pageable?: Pageable) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['subventions', pageable],
    queryFn: () => subventionsAPI.getAllSubventions(pageable)
  });

  const createMutation = useMutation({
    mutationFn: subventionsAPI.createSubvention,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subventions'] });
      toast.success('Subvention créée avec succès');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erreur lors de la création de la subvention');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: SubventionDTO }) => 
      subventionsAPI.updateSubvention(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subventions'] });
      toast.success('Subvention modifiée avec succès');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erreur lors de la modification de la subvention');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: subventionsAPI.deleteSubvention,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subventions'] });
      toast.success('Subvention supprimée avec succès');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erreur lors de la suppression de la subvention');
    }
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error,
    createSubvention: createMutation.mutateAsync,
    updateSubvention: updateMutation.mutateAsync,
    deleteSubvention: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    refetch: query.refetch
  };
}

export function useSubventionById(id: number) {
  return useQuery({
    queryKey: ['subvention', id],
    queryFn: () => subventionsAPI.getSubventionById(id),
    enabled: !!id
  });
}