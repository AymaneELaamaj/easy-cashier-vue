import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { remboursementsAPI } from '@/services/api/remboursements.api';
import { RemboursementDTO, StatusRemboursement } from '@/types/entities';
import { Page, Pageable } from '@/types/api';
import { toast } from 'react-hot-toast';

export function useRemboursements(pageable?: Pageable) {
  const queryClient = useQueryClient();

  // Lister tous les remboursements (Admin)
  const {
    data: remboursements,
    isLoading,
    error,
    refetch
  } = useQuery<Page<RemboursementDTO>>({
    queryKey: ['remboursements', pageable],
    queryFn: () => remboursementsAPI.getAllRemboursements(pageable),
    staleTime: 30 * 1000, // 30 secondes
    retry: 2,
    enabled: true, // Toujours enabled pour le moment
  });

  // Mes remboursements (Employé/Admin)
  const {
    data: myRemboursements,
    isLoading: isLoadingMy,
    refetch: refetchMy
  } = useQuery<Page<RemboursementDTO>>({
    queryKey: ['myRemboursements', pageable],
    queryFn: () => remboursementsAPI.getMyRemboursements(pageable),
    staleTime: 30 * 1000,
    retry: 2,
    enabled: true, // Toujours enabled pour le moment
  });

  // Créer une demande de remboursement
  const createDemandeMutation = useMutation({
    mutationFn: ({ transactionId, message }: { transactionId: number; message: string }) =>
      remboursementsAPI.createDemandeRemboursement(transactionId, message),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['remboursements'] });
      queryClient.invalidateQueries({ queryKey: ['myRemboursements'] });
      toast.success('Demande de remboursement créée avec succès');
    },
    onError: (error: Error) => {
      toast.error(error?.message || 'Erreur lors de la création de la demande');
    }
  });

  // Mettre à jour une demande (message)
  const updateRemboursementMutation = useMutation({
    mutationFn: ({ remboursementId, message }: { remboursementId: number; message: string }) =>
      remboursementsAPI.updateRemboursement(remboursementId, message),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['remboursements'] });
      queryClient.invalidateQueries({ queryKey: ['myRemboursements'] });
      toast.success('Demande mise à jour avec succès');
    },
    onError: (error: Error) => {
      toast.error(error?.message || 'Erreur lors de la mise à jour');
    }
  });

  // Changer le statut (Admin seulement)
  const updateStatusMutation = useMutation({
    mutationFn: ({ remboursementId, status }: { remboursementId: number; status: StatusRemboursement }) =>
      remboursementsAPI.updateRemboursementStatus(remboursementId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['remboursements'] });
      queryClient.invalidateQueries({ queryKey: ['myRemboursements'] });
      toast.success('Statut mis à jour avec succès');
    },
    onError: (error: Error) => {
      toast.error(error?.message || 'Erreur lors de la mise à jour du statut');
    }
  });

  // Supprimer un remboursement
  const deleteRemboursementMutation = useMutation({
    mutationFn: (id: number) => remboursementsAPI.deleteRemboursement(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['remboursements'] });
      queryClient.invalidateQueries({ queryKey: ['myRemboursements'] });
      toast.success('Remboursement supprimé avec succès');
    },
    onError: (error: Error) => {
      toast.error(error?.message || 'Erreur lors de la suppression');
    }
  });

  return {
    // Données
    remboursements,
    myRemboursements,
    
    // États de chargement
    isLoading,
    isLoadingMy,
    
    // Erreurs
    error,
    
    // Fonctions de refetch
    refetch,
    refetchMy,
    
    // Mutations
    createDemande: createDemandeMutation.mutate,
    isCreatingDemande: createDemandeMutation.isPending,
    
    updateRemboursement: updateRemboursementMutation.mutate,
    isUpdating: updateRemboursementMutation.isPending,
    
    updateStatus: updateStatusMutation.mutate,
    isUpdatingStatus: updateStatusMutation.isPending,
    
    deleteRemboursement: deleteRemboursementMutation.mutate,
    isDeleting: deleteRemboursementMutation.isPending,
  };
}
