import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { transactionsAPI } from '@/services/api/transactions.api';
import { TransactionDTO } from '@/types/entities';
import toast from 'react-hot-toast';

export const useTransactions = () => {
  const queryClient = useQueryClient();

  // Query pour l'historique complet
  const historiqueQuery = useQuery({
    queryKey: ['transactions', 'historique'],
    queryFn: () => transactionsAPI.getHistorique(),
    staleTime: 1 * 60 * 1000, // 1 minute
  });

  // Mutation pour annuler une transaction
  const cancelTransactionMutation = useMutation({
    mutationFn: ({ id, motif }: { id: number; motif?: string }) => 
      transactionsAPI.cancelTransaction(id, motif),
    onSuccess: (cancelledTransaction) => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast.success(`Transaction ${cancelledTransaction.numeroTicket} annulée`);
    },
    onError: (error: any) => {
      toast.error('Erreur lors de l\'annulation de la transaction');
      console.error('Erreur annulation transaction:', error);
    }
  });

  return {
    // Données
    transactions: historiqueQuery.data,
    isLoading: historiqueQuery.isLoading,
    error: historiqueQuery.error,
    isError: historiqueQuery.isError,

    // Actions
    cancelTransaction: cancelTransactionMutation.mutateAsync,

    // États des mutations
    isCancelling: cancelTransactionMutation.isPending,

    // Refetch
    refetch: historiqueQuery.refetch,
  };
};

// Hook pour les transactions par période
export const useTransactionsPeriode = (dateDebut?: string, dateFin?: string) => {
  return useQuery({
    queryKey: ['transactions', 'periode', dateDebut, dateFin],
    queryFn: () => transactionsAPI.getHistoriquePeriode(dateDebut!, dateFin!),
    enabled: !!dateDebut && !!dateFin,
    staleTime: 1 * 60 * 1000,
  });
};

// Hook pour les transactions d'un utilisateur
export const useTransactionsUtilisateur = (
  utilisateurId?: number, 
  dateDebut?: string, 
  dateFin?: string
) => {
  return useQuery({
    queryKey: ['transactions', 'utilisateur', utilisateurId, dateDebut, dateFin],
    queryFn: () => transactionsAPI.getHistoriqueUtilisateur(utilisateurId!, dateDebut!, dateFin!),
    enabled: !!utilisateurId && !!dateDebut && !!dateFin,
    staleTime: 1 * 60 * 1000,
  });
};

// Hook pour une transaction spécifique
export const useTransaction = (id: number) => {
  return useQuery({
    queryKey: ['transaction', id],
    queryFn: () => transactionsAPI.getTransactionById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

// Hook pour une transaction par ticket
export const useTransactionByTicket = (numeroTicket: string) => {
  return useQuery({
    queryKey: ['transaction', 'ticket', numeroTicket],
    queryFn: () => transactionsAPI.getTransactionByTicket(numeroTicket),
    enabled: !!numeroTicket,
    staleTime: 5 * 60 * 1000,
  });
};

// Hook pour les transactions de l'utilisateur connecté
export const useMyTransactions = () => {
  return useQuery({
    queryKey: ['transactions', 'me'],
    queryFn: () => transactionsAPI.getMyTransactions(),
    staleTime: 1 * 60 * 1000,
  });
};

export default useTransactions;