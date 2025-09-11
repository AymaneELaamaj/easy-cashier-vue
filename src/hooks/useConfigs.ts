// src/hooks/useConfigs.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import configAPI, { ConfigPaiementDTO } from '@/services/api/config.api';
import toast from 'react-hot-toast';

export const useConfigs = () => {
  const qc = useQueryClient();

  const configsQuery = useQuery({
    queryKey: ['configs'],
    queryFn: () => configAPI.getAllConfigs(),
    staleTime: 2 * 60 * 1000,
  });

  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: ['configs'] });
    qc.invalidateQueries({ queryKey: ['payment-mode'] }); // ← pour que le POS voie le nouveau mode
  };

  const createConfigMutation = useMutation({
    mutationFn: (payload: ConfigPaiementDTO) => configAPI.createConfig(payload),
    onSuccess: (newCfg) => {
      invalidateAll();
      toast.success(`Type de paiement défini: ${newCfg.typePaiement}`);
    },
    onError: (e: any) => {
      console.error(e);
      toast.error('Erreur lors de la définition du type de paiement');
    },
  });

  const updateConfigMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: ConfigPaiementDTO }) =>
      configAPI.updateConfig(id, data),
    onSuccess: (updated) => {
      invalidateAll();
      toast.success(`Type de paiement mis à jour: ${updated.typePaiement}`);
    },
    onError: (e: any) => {
      console.error(e);
      toast.error('Erreur lors de la mise à jour du type de paiement');
    },
  });

  const deleteConfigMutation = useMutation({
    mutationFn: (id: number) => configAPI.deleteConfig(id),
    onSuccess: () => {
      invalidateAll();
      toast.success('Configuration supprimée');
    },
    onError: (e: any) => {
      console.error(e);
      toast.error('Erreur lors de la suppression de la configuration');
    },
  });

  return {
    // data
    configs: configsQuery.data ?? [],
    isLoading: configsQuery.isLoading,
    error: configsQuery.error as any,
    isError: configsQuery.isError,

    // actions
    createConfig: createConfigMutation.mutateAsync,
    updateConfig: updateConfigMutation.mutateAsync,
    deleteConfig: deleteConfigMutation.mutateAsync,

    // states
    isCreating: createConfigMutation.isPending,
    isUpdating: updateConfigMutation.isPending,
    isDeleting: deleteConfigMutation.isPending,

    // refetch
    refetch: configsQuery.refetch,
  };
};

export default useConfigs;
