import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArticleDTO, UtilisateurResponse } from '@/types/entities';
import { offlineApiService } from '@/services/OfflineApiService';
import useNetworkStatus from './useNetworkStatus';
import toast from 'react-hot-toast';

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

/**
 * Hook principal pour l'interface POS avec support offline
 * Utilise OfflineApiService pour la gestion automatique online/offline
 */
export const usePOS = () => {
  // États locaux
  const [currentUser, setCurrentUser] = useState<UtilisateurResponse | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Hook de détection réseau
  const networkStatus = useNetworkStatus();

  // Synchroniser l'état réseau avec OfflineApiService
  useEffect(() => {
    offlineApiService.updateConnectionStatus(networkStatus.isOnline);
  }, [networkStatus.isOnline]);

  // Articles avec cache offline via React Query
  const { data: articles = [], isLoading: articlesLoading, refetch: refetchArticles } = useQuery({
    queryKey: ['pos-articles'],
    queryFn: () => offlineApiService.getArticles(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount) => {
      // Retry seulement si online
      return networkStatus.isOnline && failureCount < 2;
    },
    refetchInterval: networkStatus.isOnline ? 30 * 60 * 1000 : false, // 30 min si online
  });

  // Validation badge avec cache offline
  const validateBadge = useCallback(async (codeBadge: string): Promise<ValidationResult> => {
    if (!codeBadge.trim()) {
      return { success: false, error: 'Code badge requis' };
    }

    setIsLoading(true);
    try {
      const result = await offlineApiService.validateBadge(codeBadge);
      
      if (result.success && result.user) {
        setCurrentUser(result.user);
        
        // Toast différent selon source
        if (result.fromCache) {
          toast.success(`Badge validé (mode offline)\n${result.user.prenom} ${result.user.nom}`, {
            duration: 3000,
            icon: '📱',
          });
        } else {
          toast.success(`Badge validé\n${result.user.prenom} ${result.user.nom}`, {
            duration: 2000,
            icon: '✅',
          });
        }
        
        return { 
          success: true, 
          data: result.user,
          fromCache: result.fromCache 
        };
      } else {
        const errorMsg = result.error || 'Badge invalide';
        toast.error(errorMsg, { 
          duration: 3000,
          icon: result.fromCache ? '📱' : '❌',
        });
        return { 
          success: false, 
          error: errorMsg,
          fromCache: result.fromCache 
        };
      }
    } catch (error) {
      console.error('Erreur validation badge:', error);
      const errorMsg = 'Erreur lors de la validation du badge';
      toast.error(errorMsg, { duration: 3000, icon: '⚠️' });
      return { success: false, error: errorMsg, user: undefined };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Validation transaction avec gestion offline
  const validateTransaction = useCallback(async (): Promise<ValidationResult> => {
    console.log("🔥 NOUVEAU CODE validateTransaction appelé");

    if (!currentUser || cart.length === 0) {
      return { success: false, error: 'Pas d\'utilisateur ou panier vide' };
    }

    setIsLoading(true);
    try {
      const result = await offlineApiService.createTransaction({
        userEmail: currentUser.email,
        articles: cart.map(item => ({
          articleId: item.article.id!,
          quantite: item.quantite,
        })),
        utilisateur: currentUser,
        cartTotal,
        estimatedSubvention,
        estimatedToPay,
        articleDetails: cart.map(item => item.article),
      });

      if (result.success && result.data) {
        // Succès - nettoyer l'interface
        setCart([]);
        setCurrentUser(null);
        
        // Toast différent selon mode
        if (result.isOffline) {
          toast.success(
            `Transaction enregistrée (mode offline)\nTicket: ${result.data.numeroTicket}`,
            {
              duration: 4000,
              icon: '📱',
            }
          );
        } else {
          toast.success(`Transaction réussie\nTicket: ${result.data.numeroTicket}`, {
            duration: 3000,
            icon: '✅',
          });
        }
        
        return { 
          success: true, 
          data: result.data,
          isOffline: result.isOffline 
        };
      } else {
        const errorMsg = result.error || 'Erreur lors de la transaction';
        toast.error(errorMsg, { 
          duration: 4000,
          icon: result.isOffline ? '📱' : '❌',
        });
        return { 
          success: false, 
          error: errorMsg,
          isOffline: result.isOffline 
        };
      }
    } catch (error) {
      console.error('Erreur validation transaction:', error);
      const errorMsg = 'Erreur lors de la validation de la transaction';
      toast.error(errorMsg, { duration: 4000, icon: '⚠️' });
      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, cart]);

  // Synchronisation automatique des transactions offline
  const syncOfflineTransactions = useCallback(async () => {
    if (!networkStatus.isOnline) {
      toast.error('Impossible de synchroniser : pas de connexion', { 
        duration: 3000,
        icon: '📱' 
      });
      return { synced: 0, failed: 0, errors: [] };
    }

    setIsLoading(true);
    try {
      const result = await offlineApiService.syncOfflineTransactions();
      
      if (result.synced > 0) {
        toast.success(
          `${result.synced} transaction(s) synchronisée(s)`,
          { duration: 3000, icon: '🔄' }
        );
      }
      
      if (result.failed > 0) {
        toast.error(
          `${result.failed} transaction(s) échouée(s)`,
          { duration: 4000, icon: '⚠️' }
        );
      }
      
      if (result.synced === 0 && result.failed === 0) {
        toast('Aucune transaction à synchroniser', { 
          duration: 2000,
          icon: 'ℹ️' 
        });
      }
      
      return result;
    } catch (error) {
      console.error('Erreur synchronisation:', error);
      toast.error('Erreur lors de la synchronisation', { 
        duration: 4000,
        icon: '⚠️' 
      });
      return { synced: 0, failed: 0, errors: ['Erreur technique'] };
    } finally {
      setIsLoading(false);
    }
  }, [networkStatus.isOnline]);

  // NOUVEAU : Fonction pour forcer la synchronisation avec background sync
const forceSync = useCallback(async () => {
  console.log('🔄 Synchronisation forcée demandée');
  
  const apiConnected = await networkStatus.testApiConnectivity();
  if (!apiConnected) {
    toast.error('Impossible de synchroniser : API non accessible', { 
      duration: 3000,
      icon: '📱' 
    });
    return { synced: 0, failed: 0, errors: ['API non accessible'] };
  }

  try {
    if ('serviceWorker' in navigator && 'sync' in (window as any).ServiceWorkerRegistration.prototype) {
      const registration = await navigator.serviceWorker.ready;
      await (registration as any).sync.register('sync-offline-transactions');
      
      toast('Synchronisation programmée en arrière-plan', { 
        duration: 2000,
        icon: '🔄' 
      });
      
      return { synced: 0, failed: 0, errors: [], backgroundSync: true };
    }
  } catch (error) {
    console.warn('Background sync échoué, fallback manuel:', error);
  }

  return await syncOfflineTransactions();
}, [networkStatus.testApiConnectivity, syncOfflineTransactions]);

  // Gestion du panier
  const addToCart = useCallback((article: ArticleDTO) => {
    if (!article.disponible || !article.status) {
      toast.error('Article non disponible', { duration: 2000, icon: '❌' });
      return;
    }

    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.article.id === article.id);
      
      if (existingItem) {
        // Augmenter quantité
        return prevCart.map(item =>
          item.article.id === article.id
            ? {
                ...item,
                quantite: item.quantite + 1,
                sousTotal: (item.quantite + 1) * parseFloat(article.prix)
              }
            : item
        );
      } else {
        // Nouveau article
        return [...prevCart, {
          article,
          quantite: 1,
          sousTotal: parseFloat(article.prix)
        }];
      }
    });
    
    toast.success(`${article.nom} ajouté au panier`, { 
      duration: 1500,
      icon: '🛒' 
    });
  }, []);

  const updateQuantity = useCallback((articleId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(articleId);
      return;
    }

    setCart(prevCart =>
      prevCart.map(item =>
        item.article.id === articleId
          ? {
              ...item,
              quantite: newQuantity,
              sousTotal: newQuantity * parseFloat(item.article.prix)
            }
          : item
      )
    );
  }, []);

  const removeFromCart = useCallback((articleId: number) => {
    setCart(prevCart => {
      const item = prevCart.find(item => item.article.id === articleId);
      const newCart = prevCart.filter(item => item.article.id !== articleId);
      
      if (item) {
        toast.success(`${item.article.nom} retiré du panier`, { 
          duration: 1500,
          icon: '🗑️' 
        });
      }
      
      return newCart;
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

  // Calculs des totaux
  const cartTotal = cart.reduce((total, item) => total + item.sousTotal, 0);
  
  // Estimation subvention (sera plus précise avec les vraies règles)
  const estimatedSubvention = currentUser ? cartTotal * 0.3 : 0; // 30% par défaut
  
  const estimatedToPay = cartTotal - estimatedSubvention;

  // Statistiques offline
  const { data: offlineStats } = useQuery({
    queryKey: ['offline-stats'],
    queryFn: () => offlineApiService.getOfflineStats(),
    refetchInterval: 30000, // Refresh toutes les 30 secondes
  });

  // Écouter les messages du Service Worker pour les sync en arrière-plan
  useEffect(() => {
    const messageHandler = (event: MessageEvent) => {
      const { type, payload } = event.data;
      
      switch (type) {
        case 'SYNC_COMPLETE':
          console.log('🔄 Background sync terminé:', payload);
          if (payload.synced > 0) {
            toast.success(
              `${payload.synced} transaction(s) synchronisée(s) en arrière-plan`,
              { duration: 3000, icon: '🔄' }
            );
          }
          if (payload.failed > 0) {
            toast.error(
              `${payload.failed} transaction(s) échouée(s)`,
              { duration: 4000, icon: '⚠️' }
            );
          }
          break;
        default:
          console.log('Message SW non géré:', type);
      }
    };

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', messageHandler);
      
      return () => {
        navigator.serviceWorker.removeEventListener('message', messageHandler);
      };
    }
  }, []);

  // Écouter les événements de synchronisation du Service Worker
  useEffect(() => {
    const handleSwSyncComplete = (event: CustomEvent) => {
      const { synced, failed, errors } = event.detail;
      
      if (synced > 0) {
        toast.success(
          `${synced} transaction(s) synchronisée(s) en arrière-plan`,
          { duration: 3000, icon: '🔄' }
        );
      }
      
      if (failed > 0) {
        toast.error(
          `${failed} transaction(s) échouée(s) lors de la sync`,
          { duration: 4000, icon: '⚠️' }
        );
      }
    };

    const handleSwSyncError = (event: CustomEvent) => {
      const { error } = event.detail;
      toast.error(`Erreur synchronisation: ${error}`, { 
        duration: 4000, 
        icon: '❌' 
      });
    };

    window.addEventListener('swSyncComplete', handleSwSyncComplete as EventListener);
    window.addEventListener('swSyncError', handleSwSyncError as EventListener);
    
    return () => {
      window.removeEventListener('swSyncComplete', handleSwSyncComplete as EventListener);
      window.removeEventListener('swSyncError', handleSwSyncError as EventListener);
    };
  }, []);

  // Synchronisation automatique améliorée à la reconnexion
useEffect(() => {
  let reconnectionTimer: NodeJS.Timeout;
  
  if (networkStatus.isOnline && networkStatus.lastOnlineAt) {
    const shouldAutoSync = offlineStats?.pendingTransactions && offlineStats.pendingTransactions > 0;
    
    if (shouldAutoSync) {
      console.log('🔄 Reconnexion détectée avec transactions en attente');
      
      toast('Reconnexion détectée - Synchronisation en cours...', { 
        duration: 2000,
        icon: '🌐' 
      });
      
      reconnectionTimer = setTimeout(async () => {
        try {
          if ('serviceWorker' in navigator && 'sync' in (window as any).ServiceWorkerRegistration.prototype) {
            const registration = await navigator.serviceWorker.ready;
            await (registration as any).sync.register('sync-offline-transactions');
            console.log('✅ Background sync programmé pour reconnexion');
          } else {
            console.log('⚠️ Background sync non supporté - synchronisation manuelle');
            await syncOfflineTransactions();
          }
        } catch (error) {
          console.error('❌ Erreur auto-sync:', error);
          await syncOfflineTransactions();
        }
      }, 2000);
    }
  }
  
  return () => {
    if (reconnectionTimer) {
      clearTimeout(reconnectionTimer);
    }
  };
}, [networkStatus.isOnline, networkStatus.lastOnlineAt, offlineStats?.pendingTransactions, syncOfflineTransactions]);
  return {
    // États
    currentUser,
    cart,
    isLoading,
    articles,
    articlesLoading,
    
    // Statut réseau et offline
    networkStatus,
    offlineStats,
    
    // Actions principales
    validateBadge,
    validateTransaction,
    syncOfflineTransactions,
    forceSync, // NOUVEAU
    
    // Actions panier
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    
    // Actions générales
    resetAll,
    setCurrentUser,
    refetchArticles,
    
    // Calculs
    cartTotal,
    estimatedSubvention,
    estimatedToPay,
    
    // Flags utiles
    canValidateTransaction: currentUser && cart.length > 0,
    hasOfflineTransactions: (offlineStats?.pendingTransactions || 0) > 0,
    isOnline: networkStatus.isOnline,
  };
};

export default usePOS;