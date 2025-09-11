// src/hooks/usePOS.ts
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArticleDTO, UtilisateurResponse } from '@/types/entities';
import { offlineApiService } from '@/services/OfflineApiService';
import useNetworkStatus from './useNetworkStatus';
import toast from 'react-hot-toast';
import POS_FLAGS from '@/config/posFlags';
import type { CustomPaymentResponse } from '@/services/api/pos.api';
import { usePaymentMode } from '@/hooks/usePaymentMode';

export interface CartItem { article: ArticleDTO; quantite: number; sousTotal: number; }

export interface ValidationResult {
  user?: UtilisateurResponse;
  success: boolean;
  data?: any;
  error?: string;
  isOffline?: boolean;
  fromCache?: boolean;
}

export type UsePOSOptions = { onTransactionSuccess?: (tx: CustomPaymentResponse) => void; };

export const usePOS = (options: UsePOSOptions = {}) => {
  const [currentUser, setCurrentUser] = useState<UtilisateurResponse | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const networkStatus = useNetworkStatus();
  const { mode: paymentMode } = usePaymentMode();   // 'PRE' | 'POST'
  const isPRE = paymentMode === 'PRE';

  useEffect(() => {
    offlineApiService.updateConnectionStatus(networkStatus.isOnline);
  }, [networkStatus.isOnline]);

  const { data: articles = [], isLoading: articlesLoading, refetch: refetchArticles } = useQuery({
    queryKey: ['pos-articles'],
    queryFn: () => offlineApiService.getArticles(),
    staleTime: 5 * 60 * 1000,
    retry: (failureCount) => networkStatus.isOnline && failureCount < 2,
    refetchInterval: networkStatus.isOnline ? 30 * 60 * 1000 : false,
  });

  const cartTotal = useMemo(() => cart.reduce((t, i) => t + i.sousTotal, 0), [cart]);
  const estimatedSubvention = useMemo(() => (currentUser ? cartTotal * 0.3 : 0), [currentUser, cartTotal]);
  const estimatedToPay = useMemo(() => cartTotal - estimatedSubvention, [cartTotal, estimatedSubvention]);

  const validateTransaction = useCallback(
    async (opts?: { userOverride?: UtilisateurResponse }): Promise<ValidationResult> => {
      const user = opts?.userOverride ?? currentUser;
      if (!user || cart.length === 0) return { success: false, error: "Pas d'utilisateur ou panier vide" };

      if (isPRE && estimatedToPay > user.solde) {
        const manque = (estimatedToPay - user.solde).toFixed(2);
        const msg = `Solde insuffisant. Il manque ${manque} MAD.`;
        toast.error(msg, { duration: 4000, icon: '❌' });
        return { success: false, error: msg, isOffline: !networkStatus.isOnline };
      }

      setIsLoading(true);
      try {
        const result = await offlineApiService.createTransaction({
          userEmail: user.email,
          articles: cart.map(i => ({ articleId: i.article.id!, quantite: i.quantite })),
          utilisateur: user,
          cartTotal,
          estimatedSubvention,
          estimatedToPay,
          articleDetails: cart.map(i => i.article),
        });

        if ('error' in result) {
          const msg = result.error;
          toast.error(msg, { duration: 4000, icon: result.isOffline ? '📱' : '❌' });
          return { success: false, error: msg, isOffline: result.isOffline };
        }

        // 🔧 data est déjà unwrap (Online) ou calculée (Offline)
        const tx: CustomPaymentResponse = result.data as CustomPaymentResponse;

        // 🔧 MAJ optimiste du solde en mémoire si tu veux garder l’utilisateur à l’écran
        if (currentUser && typeof tx?.nouveauSolde === 'number') {
          setCurrentUser(prev => (prev ? { ...prev, solde: tx.nouveauSolde } : prev));
        }

        options.onTransactionSuccess?.(tx);

        // reset UI
        setCart([]);
        setCurrentUser(null); // garde ce comportement si tu préfères remettre à zéro l’UI

        toast.success(
          `${result.isOffline ? 'Transaction enregistrée (offline)' : 'Transaction réussie'}\nTicket: ${tx.numeroTicket}`,
          { duration: result.isOffline ? 4000 : 3000, icon: result.isOffline ? '📱' : '✅' }
        );
        return { success: true, data: tx, isOffline: result.isOffline };
      } catch (e) {
        console.error('Erreur validation transaction:', e);
        const msg = 'Erreur lors de la validation de la transaction';
        toast.error(msg, { duration: 4000, icon: '⚠️' });
        return { success: false, error: msg };
      } finally {
        setIsLoading(false);
      }
    },
    [currentUser, cart, cartTotal, estimatedSubvention, estimatedToPay, isPRE, options, networkStatus.isOnline]
  );

  const validateBadge = useCallback(
    async (codeBadge: string): Promise<ValidationResult> => {
      if (!codeBadge.trim()) return { success: false, error: 'Code badge requis' };
      setIsLoading(true);
      try {
        const result = await offlineApiService.validateBadge(codeBadge);
        if (result.success && result.user) {
          setCurrentUser(result.user);
          toast.success(
            `Badge validé${result.fromCache ? ' (offline)' : ''}\n${result.user.prenom} ${result.user.nom}`,
            { duration: result.fromCache ? 3000 : 2000, icon: result.fromCache ? '📱' : '✅' }
          );

          const shouldAuto = POS_FLAGS.autoValidateAfterBadge && cart.length > 0;
          const meetsMinTotal = cartTotal >= (POS_FLAGS.minCartTotalForAutoValidate ?? 0);
          if (shouldAuto && meetsMinTotal) {
            const delay = Math.max(0, POS_FLAGS.autoValidateDelayMs || 0);
            await new Promise(res => setTimeout(res, delay));
            await validateTransaction({ userOverride: result.user });
          }
          return { success: true, data: result.user, fromCache: result.fromCache };
        }
        const errorMsg = result.error || 'Badge invalide';
        toast.error(errorMsg, { duration: 3000, icon: result.fromCache ? '📱' : '❌' });
        return { success: false, error: errorMsg, fromCache: result.fromCache };
      } catch (e) {
        console.error('Erreur validation badge:', e);
        const msg = 'Erreur lors de la validation du badge';
        toast.error(msg, { duration: 3000, icon: '⚠️' });
        return { success: false, error: msg };
      } finally { setIsLoading(false); }
    },
    [cart.length, cartTotal, validateTransaction]
  );

  const syncOfflineTransactions = useCallback(async () => {
    if (!networkStatus.isOnline) {
      toast.error('Impossible de synchroniser : pas de connexion', { duration: 3000, icon: '📱' });
      return { synced: 0, failed: 0, errors: [] };
    }
    setIsLoading(true);
    try {
      const result = await offlineApiService.syncOfflineTransactions();
      if (result.synced > 0) toast.success(`${result.synced} transaction(s) synchronisée(s)`, { duration: 3000, icon: '🔄' });
      if (result.failed > 0) toast.error(`${result.failed} transaction(s) échouée(s)`, { duration: 4000, icon: '⚠️' });
      if (result.synced === 0 && result.failed === 0) toast('Aucune transaction à synchroniser', { duration: 2000, icon: 'ℹ️' });
      return result;
    } catch {
      toast.error('Erreur lors de la synchronisation', { duration: 4000, icon: '⚠️' });
      return { synced: 0, failed: 0, errors: ['Erreur technique'] };
    } finally { setIsLoading(false); }
  }, [networkStatus.isOnline]);

  const forceSync = useCallback(async () => {
    const ok = await networkStatus.testApiConnectivity();
    if (!ok) {
      toast.error('Impossible de synchroniser : API non accessible', { duration: 3000, icon: '📱' });
      return { synced: 0, failed: 0, errors: ['API non accessible'] };
    }
    try {
      if ('serviceWorker' in navigator && 'sync' in (window as any).ServiceWorkerRegistration.prototype) {
        const registration = await navigator.serviceWorker.ready;
        await (registration as any).sync.register('sync-offline-transactions');
        toast('Synchronisation programmée en arrière-plan', { duration: 2000, icon: '🔄' });
        return { synced: 0, failed: 0, errors: [], backgroundSync: true } as any;
      }
    } catch { /* ignore */ }
    return await syncOfflineTransactions();
  }, [networkStatus.testApiConnectivity, syncOfflineTransactions]);

  const addToCart = useCallback((article: ArticleDTO) => {
    if (!article.disponible || !article.status) { toast.error('Article non disponible', { duration: 2000, icon: '❌' }); return; }
    setCart(prev => {
      const ex = prev.find(i => i.article.id === article.id);
      if (ex) return prev.map(i => i.article.id === article.id ? { ...i, quantite: i.quantite + 1, sousTotal: (i.quantite + 1) * parseFloat(article.prix) } : i);
      return [...prev, { article, quantite: 1, sousTotal: parseFloat(article.prix) }];
    });
    toast.success(`${article.nom} ajouté au panier`, { duration: 1500, icon: '🛒' });
  }, []);

  const updateQuantity = useCallback((articleId: number, q: number) => {
    if (q <= 0) { setCart(prev => prev.filter(i => i.article.id !== articleId)); return; }
    setCart(prev => prev.map(i => i.article.id === articleId ? { ...i, quantite: q, sousTotal: q * parseFloat(i.article.prix) } : i));
  }, []);

  const removeFromCart = useCallback((articleId: number) => {
    setCart(prev => {
      const item = prev.find(i => i.article.id === articleId);
      const next = prev.filter(i => i.article.id !== articleId);
      if (item) toast.success(`${item.article.nom} retiré du panier`, { duration: 1500, icon: '🗑️' });
      return next;
    });
  }, []);

  const clearCart = useCallback(() => {
    if (cart.length > 0) { setCart([]); toast.success('Panier vidé', { duration: 1500, icon: '🧹' }); }
  }, [cart.length]);

  const resetAll = useCallback(() => {
    setCart([]); setCurrentUser(null);
    toast('Interface réinitialisée', { duration: 1500, icon: '🔄' });
  }, []);

  const { data: offlineStats } = useQuery({
    queryKey: ['offline-stats'],
    queryFn: () => offlineApiService.getOfflineStats(),
    refetchInterval: 30000,
  });

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      const { type, payload } = event.data || {};
      if (type === 'SYNC_COMPLETE') {
        if (payload?.synced > 0) toast.success(`${payload.synced} transaction(s) synchronisée(s) en arrière-plan`, { duration: 3000, icon: '🔄' });
        if (payload?.failed > 0) toast.error(`${payload.failed} transaction(s) échouée(s)`, { duration: 4000, icon: '⚠️' });
      }
    };
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handler);
      return () => navigator.serviceWorker.removeEventListener('message', handler);
    }
  }, []);

  useEffect(() => {
    let t: ReturnType<typeof setTimeout> | undefined;
    if (networkStatus.isOnline && networkStatus.lastOnlineAt) {
      const pending = offlineStats?.pendingTransactions && offlineStats.pendingTransactions > 0;
      if (pending) {
        toast('Reconnexion détectée - Synchronisation en cours...', { duration: 2000, icon: '🌐' });
        t = setTimeout(async () => {
          try {
            if ('serviceWorker' in navigator && 'sync' in (window as any).ServiceWorkerRegistration.prototype) {
              const registration = await navigator.serviceWorker.ready;
              await (registration as any).sync.register('sync-offline-transactions');
            } else {
              await syncOfflineTransactions();
            }
          } catch {
            await syncOfflineTransactions();
          }
        }, 2000);
      }
    }
    return () => { if (t) clearTimeout(t); };
  }, [networkStatus.isOnline, networkStatus.lastOnlineAt, offlineStats?.pendingTransactions, syncOfflineTransactions]);

  return {
    currentUser, cart, isLoading, articles, articlesLoading,
    networkStatus, offlineStats,
    validateBadge, validateTransaction, syncOfflineTransactions, forceSync,
    addToCart, updateQuantity, removeFromCart, clearCart,
    resetAll, setCurrentUser, refetchArticles,
    cartTotal, estimatedSubvention, estimatedToPay,
    canValidateTransaction: Boolean(currentUser) && cart.length > 0,
    hasOfflineTransactions: (offlineStats?.pendingTransactions || 0) > 0,
    isOnline: networkStatus.isOnline,
    paymentMode,
  };
};

export default usePOS;
