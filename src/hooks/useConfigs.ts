import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import configAPI from '@/services/api/config.api';
import { ConfigPaiementDTO } from '@/types/entities';
import toast from 'react-hot-toast';

export const useConfigs = () => {
  const queryClient = useQueryClient();

  // Query principale pour lister les configurations
  const configsQuery = useQuery({
    queryKey: ['configs'],
    queryFn: () => configAPI.getAllConfigs(),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Mutation pour créer une configuration
  const createConfigMutation = useMutation({
    mutationFn: configAPI.createConfig,
    onSuccess: (newConfig: ConfigPaiementDTO) => {
      queryClient.invalidateQueries({ queryKey: ['configs'] });
      toast.success(`Configuration "${newConfig.typePaiement}" créée avec succès`);
    },
    onError: (error: any) => {
      toast.error('Erreur lors de la création de la configuration');
      console.error('Erreur création configuration:', error);
    }
  });

  // Mutation pour mettre à jour une configuration
  const updateConfigMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: ConfigPaiementDTO }) => 
      configAPI.updateConfig(id, data),
    onSuccess: (updatedConfig: ConfigPaiementDTO) => {
      queryClient.invalidateQueries({ queryKey: ['configs'] });
      queryClient.invalidateQueries({ queryKey: ['config', updatedConfig.id] });
      toast.success(`Configuration "${updatedConfig.typePaiement}" mise à jour`);
    },
    onError: (error: any) => {
      toast.error('Erreur lors de la mise à jour de la configuration');
      console.error('Erreur mise à jour configuration:', error);
    }
  });

  // Mutation pour supprimer une configuration
  const deleteConfigMutation = useMutation({
    mutationFn: configAPI.deleteConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configs'] });
      toast.success('Configuration supprimée avec succès');
    },
    onError: (error: any) => {
      toast.error('Erreur lors de la suppression de la configuration');
      console.error('Erreur suppression configuration:', error);
    }
  });

  return {
    // Données
    configs: configsQuery.data,
    isLoading: configsQuery.isLoading,
    error: configsQuery.error,
    isError: configsQuery.isError,

    // Actions
    createConfig: createConfigMutation.mutateAsync,
    updateConfig: updateConfigMutation.mutateAsync,
    deleteConfig: deleteConfigMutation.mutateAsync,

    // États des mutations
    isCreating: createConfigMutation.isPending,
    isUpdating: updateConfigMutation.isPending,
    isDeleting: deleteConfigMutation.isPending,

    // Refetch
    refetch: configsQuery.refetch,
  };
};

// Hook pour obtenir une configuration spécifique
export const useConfig = (id: number) => {
  return useQuery({
    queryKey: ['config', id],
    queryFn: () => configAPI.getConfigById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

export default useConfigs;