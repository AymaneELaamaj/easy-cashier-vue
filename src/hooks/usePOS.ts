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

  // Synchronisation automatique à la reconnexion
  useEffect(() => {
    if (networkStatus.isOnline && networkStatus.lastOnlineAt) {
      // Vérifier s'il y a des transactions en attente
      if (offlineStats?.pendingTransactions && offlineStats.pendingTransactions > 0) {
        // Synchroniser automatiquement après 2 secondes de reconnexion
        const timer = setTimeout(() => {
          syncOfflineTransactions();
        }, 2000);
        
        return () => clearTimeout(timer);
      }
    }
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