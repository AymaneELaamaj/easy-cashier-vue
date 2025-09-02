import { useQuery } from '@tanstack/react-query';
import { transactionsAPI } from '@/services/api/transactions.api';
import { TransactionDTO } from '@/types/entities';

export function useTransactionsRemboursementNull(enabled: boolean = true) {
  return useQuery<TransactionDTO[]>({
    queryKey: ['transactions-remboursement-null'],
    queryFn: () => transactionsAPI.getTransactionsRemboursementNull(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
    enabled: enabled,
  });
}

export default useTransactionsRemboursementNull;
