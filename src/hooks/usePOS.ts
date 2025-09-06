// src/hooks/usePOS.ts
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArticleDTO, UtilisateurResponse } from '@/types/entities';
import { offlineApiService } from '@/services/OfflineApiService';
import useNetworkStatus from './useNetworkStatus';
import toast from 'react-hot-toast';
import POS_FLAGS from '@/config/posFlags';
import type { CustomPaymentResponse } from '@/services/api/pos.api';

interface CartItem {
  article: ArticleDTO;
  quantite: number;
  sousTotal: number;
}

interface ValidationResult {
  user?: UtilisateurResponse;
  success: boolean;
  data?: any;
  error?: string;
  isOffline?: boolean;
  fromCache?: boolean;
}

export type UsePOSOptions = {
  /** Callback exécuté à chaque transaction validée avec succès */
  onTransactionSuccess?: (tx: CustomPaymentResponse) => void;
};

export const usePOS = (options: UsePOSOptions = {}) => {
  // --- State -----------------------------------------------------------
  const [currentUser, setCurrentUser] = useState<UtilisateurResponse | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // --- Network status --------------------------------------------------
  const networkStatus = useNetworkStatus();
  useEffect(() => {
    offlineApiService.updateConnectionStatus(networkStatus.isOnline);
  }, [networkStatus.isOnline]);

  // --- Articles (cache offline via React Query) ------------------------
  const {
    data: articles = [],
    isLoading: articlesLoading,
    refetch: refetchArticles,
  } = useQuery({
    queryKey: ['pos-articles'],
    queryFn: () => offlineApiService.getArticles(),
    staleTime: 5 * 60 * 1000,
    retry: (failureCount) => networkStatus.isOnline && failureCount < 2,
    refetchInterval: networkStatus.isOnline ? 30 * 60 * 1000 : false,
  });

  // --- Totaux (mémorisés) ----------------------------------------------
  const cartTotal = useMemo(
    () => cart.reduce((total, item) => total + item.sousTotal, 0),
    [cart]
  );

  const estimatedSubvention = useMemo(
    () => (currentUser ? cartTotal * 0.3 : 0),
    [currentUser, cartTotal]
  );

  const estimatedToPay = useMemo(
    () => cartTotal - estimatedSubvention,
    [cartTotal, estimatedSubvention]
  );

  // --- validateTransaction (définie AVANT validateBadge) ---------------
  const validateTransaction = useCallback(
    async (opts?: { userOverride?: UtilisateurResponse }): Promise<ValidationResult> => {
      const user = opts?.userOverride ?? currentUser;
      if (!user || cart.length === 0) {
        return { success: false, error: "Pas d'utilisateur ou panier vide" };
      }

      setIsLoading(true);
      try {
        const result = await offlineApiService.createTransaction({
          userEmail: user.email,
          articles: cart.map((i) => ({ articleId: i.article.id!, quantite: i.quantite })),
          utilisateur: user,
          cartTotal,
          estimatedSubvention,
          estimatedToPay,
          articleDetails: cart.map((i) => i.article),
        });

        if (result.success && result.data) {
          setCart([]);
          setCurrentUser(null);

          // ✅ Laissez le composant décider (ex: imprimer le ticket)
          options.onTransactionSuccess?.(result.data as CustomPaymentResponse);

          toast.success(
            `${result.isOffline ? 'Transaction enregistrée (mode offline)' : 'Transaction réussie'}\nTicket: ${result.data.numeroTicket}`,
            { duration: result.isOffline ? 4000 : 3000, icon: result.isOffline ? '📱' : '✅' }
          );

          return { success: true, data: result.data, isOffline: result.isOffline };
        }

        const msg = result.error || 'Erreur lors de la transaction';
        toast.error(msg, { duration: 4000, icon: result.isOffline ? '📱' : '❌' });
        return { success: false, error: msg, isOffline: result.isOffline };
      } catch (e) {
        console.error('Erreur validation transaction:', e);
        const msg = 'Erreur lors de la validation de la transaction';
        toast.error(msg, { duration: 4000, icon: '⚠️' });
        return { success: false, error: msg };
      } finally {
        setIsLoading(false);
      }
    },
    [currentUser, cart, cartTotal, estimatedSubvention, estimatedToPay, options]
  );

  // --- validateBadge (auto-achat si flag + panier non vide) -----------
  const validateBadge = useCallback(
    async (codeBadge: string): Promise<ValidationResult> => {
      if (!codeBadge.trim()) {
        return { success: false, error: 'Code badge requis' };
      }

      setIsLoading(true);
      try {
        const result = await offlineApiService.validateBadge(codeBadge);

        if (result.success && result.user) {
          setCurrentUser(result.user);

          toast.success(
            `Badge validé${result.fromCache ? ' (mode offline)' : ''}\n${result.user.prenom} ${result.user.nom}`,
            { duration: result.fromCache ? 3000 : 2000, icon: result.fromCache ? '📱' : '✅' }
          );

          // Auto-validation après badge ?
          const shouldAuto = POS_FLAGS.autoValidateAfterBadge && cart.length > 0;
          const requiresOnline = POS_FLAGS.requireOnlineForAutoValidate && !networkStatus.isOnline;
          const meetsMinTotal = cartTotal >= (POS_FLAGS.minCartTotalForAutoValidate ?? 0);

          if (shouldAuto && !requiresOnline && meetsMinTotal) {
            const delay = Math.max(0, POS_FLAGS.autoValidateDelayMs || 0);
            await new Promise((res) => setTimeout(res, delay));
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
      } finally {
        setIsLoading(false);
      }
    },
    [cart.length, cartTotal, networkStatus.isOnline, validateTransaction]
  );

  // --- Sync offline ----------------------------------------------------
  const syncOfflineTransactions = useCallback(async () => {
    if (!networkStatus.isOnline) {
      toast.error('Impossible de synchroniser : pas de connexion', { duration: 3000, icon: '📱' });
      return { synced: 0, failed: 0, errors: [] };
    }

    setIsLoading(true);
    try {
      const result = await offlineApiService.syncOfflineTransactions();

      if (result.synced > 0) {
        toast.success(`${result.synced} transaction(s) synchronisée(s)`, { duration: 3000, icon: '🔄' });
      }
      if (result.failed > 0) {
        toast.error(`${result.failed} transaction(s) échouée(s)`, { duration: 4000, icon: '⚠️' });
      }
      if (result.synced === 0 && result.failed === 0) {
        toast('Aucune transaction à synchroniser', { duration: 2000, icon: 'ℹ️' });
      }

      return result;
    } catch (e) {
      console.error('Erreur synchronisation:', e);
      toast.error('Erreur lors de la synchronisation', { duration: 4000, icon: '⚠️' });
      return { synced: 0, failed: 0, errors: ['Erreur technique'] };
    } finally {
      setIsLoading(false);
    }
  }, [networkStatus.isOnline]);

  const forceSync = useCallback(async () => {
    const apiConnected = await networkStatus.testApiConnectivity();
    if (!apiConnected) {
      toast.error('Impossible de synchroniser : API non accessible', { duration: 3000, icon: '📱' });
      return { synced: 0, failed: 0, errors: ['API non accessible'] };
    }

    try {
      if ('serviceWorker' in navigator && 'sync' in (window as any).ServiceWorkerRegistration.prototype) {
        const registration = await navigator.serviceWorker.ready;
        await (registration as any).sync.register('sync-offline-transactions');
        toast('Synchronisation programmée en arrière-plan', { duration: 2000, icon: '🔄' });
        return { synced: 0, failed: 0, errors: [], backgroundSync: true };
      }
    } catch (e) {
      console.warn('Background sync échoué, fallback manuel:', e);
    }

    return await syncOfflineTransactions();
  }, [networkStatus.testApiConnectivity, syncOfflineTransactions]);

  // --- Panier ----------------------------------------------------------
  const addToCart = useCallback((article: ArticleDTO) => {
    if (!article.disponible || !article.status) {
      toast.error('Article non disponible', { duration: 2000, icon: '❌' });
      return;
    }

    setCart((prev) => {
      const exists = prev.find((i) => i.article.id === article.id);
      if (exists) {
        return prev.map((i) =>
          i.article.id === article.id
            ? { ...i, quantite: i.quantite + 1, sousTotal: (i.quantite + 1) * parseFloat(article.prix) }
            : i
        );
    }
      return [...prev, { article, quantite: 1, sousTotal: parseFloat(article.prix) }];
    });

    toast.success(`${article.nom} ajouté au panier`, { duration: 1500, icon: '🛒' });
  }, []);

  const updateQuantity = useCallback((articleId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      setCart((prev) => prev.filter((i) => i.article.id !== articleId));
      return;
    }
    setCart((prev) =>
      prev.map((i) =>
        i.article.id === articleId
          ? { ...i, quantite: newQuantity, sousTotal: newQuantity * parseFloat(i.article.prix) }
          : i
      )
    );
  }, []);

  const removeFromCart = useCallback((articleId: number) => {
    setCart((prev) => {
      const item = prev.find((i) => i.article.id === articleId);
      const next = prev.filter((i) => i.article.id !== articleId);
      if (item) toast.success(`${item.article.nom} retiré du panier`, { duration: 1500, icon: '🗑️' });
      return next;
    });
  }, []);

  const clearCart = useCallback(() => {
    if (cart.length > 0) {
      setCart([]);
      toast.success('Panier vidé', { duration: 1500, icon: '🧹' });
    }
  }, [cart.length]);

  const resetAll = useCallback(() => {
    setCart([]);
    setCurrentUser(null);
    toast('Interface réinitialisée', { duration: 1500, icon: '🔄' });
  }, []);

  // --- Offline stats (pour UI/auto-sync) -------------------------------
  const { data: offlineStats } = useQuery({
    queryKey: ['offline-stats'],
    queryFn: () => offlineApiService.getOfflineStats(),
    refetchInterval: 30000,
  });

  // --- Service Worker messages ----------------------------------------
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      const { type, payload } = event.data || {};
      if (type === 'SYNC_COMPLETE') {
        if (payload?.synced > 0) {
          toast.success(`${payload.synced} transaction(s) synchronisée(s) en arrière-plan`, {
            duration: 3000,
            icon: '🔄',
          });
        }
        if (payload?.failed > 0) {
          toast.error(`${payload.failed} transaction(s) échouée(s)`, { duration: 4000, icon: '⚠️' });
        }
      }
    };
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handler);
      return () => navigator.serviceWorker.removeEventListener('message', handler);
    }
  }, []);

  // --- Auto-sync à la reconnexion -------------------------------------
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
          } catch (e) {
            console.error('Erreur auto-sync:', e);
            await syncOfflineTransactions();
          }
        }, 2000);
      }
    }

    return () => {
      if (t) clearTimeout(t);
    };
  }, [networkStatus.isOnline, networkStatus.lastOnlineAt, offlineStats?.pendingTransactions, syncOfflineTransactions]);

  // --- Return API ------------------------------------------------------
  return {
    // États
    currentUser,
    cart,
    isLoading,
    articles,
    articlesLoading,

    // Réseau / offline
    networkStatus,
    offlineStats,

    // Actions principales
    validateBadge,
    validateTransaction,
    syncOfflineTransactions,
    forceSync,

    // Panier
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,

    // Divers
    resetAll,
    setCurrentUser,
    refetchArticles,

    // Calculs
    cartTotal,
    estimatedSubvention,
    estimatedToPay,

    // Flags utiles
    canValidateTransaction: Boolean(currentUser) && cart.length > 0,
    hasOfflineTransactions: (offlineStats?.pendingTransactions || 0) > 0,
    isOnline: networkStatus.isOnline,
  };
};

export default usePOS;
