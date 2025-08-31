import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { transactionsAPI } from '@/services/api/transactions.api';
import { TransactionDTO } from '@/types/entities';
import { useAuthContext as useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

// Historique complet (admin seulement)
export const useTransactions = () => {
  const queryClient = useQueryClient();

  const historiqueQuery = useQuery<TransactionDTO[]>({
    queryKey: ['transactions', 'historique'],
    queryFn: () => transactionsAPI.getHistorique(),
    staleTime: 60 * 1000,
  });

  const cancelTransactionMutation = useMutation({
    mutationFn: ({ id, motif }: { id: number; motif?: string }) =>
      transactionsAPI.cancelTransaction(id, motif),
    onSuccess: (t: TransactionDTO) => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast.success(`Transaction ${t.numeroTicket} annulée`);
    },
    onError: (e: any) => {
      console.error('Erreur annulation transaction:', e);
      toast.error("Erreur lors de l'annulation de la transaction");
    },
  });

  return {
    transactions: historiqueQuery.data ?? [],
    isLoading: historiqueQuery.isLoading,
    error: historiqueQuery.error,
    isError: historiqueQuery.isError,

    cancelTransaction: cancelTransactionMutation.mutateAsync,
    isCancelling: cancelTransactionMutation.isPending,

    refetch: historiqueQuery.refetch,
  };
};

// Mes transactions personnelles (utilisateurs non-admin)
export const useMyTransactions = () => {
  const queryClient = useQueryClient();

  const myTransactionsQuery = useQuery<TransactionDTO[]>({
    queryKey: ['transactions', 'my-transactions'],
    queryFn: () => transactionsAPI.getMyTransactions(),
    staleTime: 60 * 1000,
  });

  const cancelTransactionMutation = useMutation({
    mutationFn: ({ id, motif }: { id: number; motif?: string }) =>
      transactionsAPI.cancelTransaction(id, motif),
    onSuccess: (t: TransactionDTO) => {
      queryClient.invalidateQueries({ queryKey: ['transactions', 'my-transactions'] });
      toast.success(`Transaction ${t.numeroTicket} annulée`);
    },
    onError: (e: any) => {
      console.error('Erreur annulation transaction:', e);
      toast.error("Erreur lors de l'annulation de la transaction");
    },
  });

  return {
    transactions: myTransactionsQuery.data ?? [],
    isLoading: myTransactionsQuery.isLoading,
    error: myTransactionsQuery.error,
    isError: myTransactionsQuery.isError,

    cancelTransaction: cancelTransactionMutation.mutateAsync,
    isCancelling: cancelTransactionMutation.isPending,

    refetch: myTransactionsQuery.refetch,
  };
};

// Hook intelligent qui choisit selon le rôle
export const useTransactionsBasedOnRole = () => {
  const { hasAnyRole } = useAuth();
  const queryClient = useQueryClient();

  // Admin/Super Admin voient TOUT, autres utilisateurs voient seulement leurs transactions
  const isAdmin = hasAnyRole(['ADMIN', 'SUPER_ADMIN']);
  
  // Query conditionnelle selon le rôle
  const transactionsQuery = useQuery<TransactionDTO[]>({
    queryKey: ['transactions', isAdmin ? 'all' : 'personal'],
    queryFn: () => isAdmin ? transactionsAPI.getHistorique() : transactionsAPI.getMyTransactions(),
    staleTime: 60 * 1000,
  });

  const cancelTransactionMutation = useMutation({
    mutationFn: ({ id, motif }: { id: number; motif?: string }) =>
      transactionsAPI.cancelTransaction(id, motif),
    onSuccess: (t: TransactionDTO) => {
      // Invalider selon le rôle
      if (isAdmin) {
        queryClient.invalidateQueries({ queryKey: ['transactions', 'all'] });
        queryClient.invalidateQueries({ queryKey: ['transactions', 'historique'] });
      } else {
        queryClient.invalidateQueries({ queryKey: ['transactions', 'personal'] });
      }
      toast.success(`Transaction ${t.numeroTicket} annulée`);
    },
    onError: (e: any) => {
      console.error('Erreur annulation transaction:', e);
      toast.error("Erreur lors de l'annulation de la transaction");
    },
  });

  return {
    transactions: transactionsQuery.data ?? [],
    isLoading: transactionsQuery.isLoading,
    error: transactionsQuery.error,
    isError: transactionsQuery.isError,
    isAdmin,

    cancelTransaction: cancelTransactionMutation.mutateAsync,
    isCancelling: cancelTransactionMutation.isPending,

    refetch: transactionsQuery.refetch,
  };
};

// Historique par période
export const useTransactionsPeriode = (dateDebut?: string, dateFin?: string) => {
  const enabled = Boolean(dateDebut && dateFin);
  return useQuery<TransactionDTO[]>({
    queryKey: ['transactions', 'periode', dateDebut, dateFin],
    queryFn: () => transactionsAPI.getHistoriquePeriode(dateDebut!, dateFin!),
    enabled,
    staleTime: 60 * 1000,
  });
};

export default useTransactions;