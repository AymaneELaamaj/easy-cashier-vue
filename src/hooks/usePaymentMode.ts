// src/hooks/usePaymentMode.ts
import { useQuery } from '@tanstack/react-query';
import configAPI from '@/services/api/config.api';

export type PaymentMode = 'PRE' | 'POST';

const KEY = 'POS_PAYMENT_MODE';

const normalize = (t?: string | null): PaymentMode =>
  String(t || '').toUpperCase().includes('POST') ? 'POST' : 'PRE';

export function usePaymentMode() {
  const q = useQuery({
    queryKey: ['payment-mode'],
    queryFn: async () => {
      const res = await configAPI.getTypePaiement(); // { typePaiement: 'PRE_PAIEMENT' | 'POST_PAIEMENT' }
      const mode = normalize(res?.typePaiement);
      localStorage.setItem(KEY, mode);
      return mode;
    },
    staleTime: 60_000,
    retry: 1,
  });

  const stored = (localStorage.getItem(KEY) as PaymentMode | null) ?? null;
  const fallback: PaymentMode = stored ?? 'POST'; // défaut POST si rien

  return {
    mode: (q.data as PaymentMode) ?? fallback,
    isLoading: q.isLoading,
    error: q.error,
    refetch: q.refetch,
  };
}
