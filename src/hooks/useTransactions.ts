import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { transactionsAPI } from '@/services/api/transactions.api';
import { TransactionDTO } from '@/types/entities';
import toast from 'react-hot-toast';

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
    onSuccess: (t) => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast.success(`Transaction ${t.numeroTicket} annulée`);
    },
    onError: (e: any) => {
      console.error('Erreur annulation transaction:', e);
      toast.error("Erreur lors de l'annulation de la transaction");
    },
  });

  return {
    transactions: historiqueQuery.data ?? [],      // <-- toujours un array
    isLoading: historiqueQuery.isLoading,
    error: historiqueQuery.error,
    isError: historiqueQuery.isError,

    cancelTransaction: cancelTransactionMutation.mutateAsync,
    isCancelling: cancelTransactionMutation.isPending,

    refetch: historiqueQuery.refetch,
  };
};
