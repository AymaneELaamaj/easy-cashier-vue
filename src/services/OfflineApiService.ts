import { ArticleDTO, UtilisateurResponse } from '@/types/entities';
import { indexedDBService } from './indexedDBService';

interface OfflineApiConfig {
  isOnline: boolean;
  retryAttempts?: number;
  cacheDuration?: number; // en minutes
}

interface CachedData<T> {
  data: T;
  cachedAt: string;
  expiresAt: string;
}

interface OfflineTransaction {
  tempId: string;
  numeroTicket: string;
  date: string;
  montantTotal: number;
  partSalariale: number;
  partPatronale: number;
  articles: Array<{
    articleId: number;
    nom: string;
    quantite: number;
    prixUnitaire: number;
    montantTotal: number;
    subventionTotale: number;
    partSalariale: number;
  }>;
  utilisateur: {
    id: number;
    nom: string;
    prenom: string;
    email: string;
    codeBadge: string;
  };
  syncStatus: 'PENDING' | 'SYNCING' | 'SYNCED' | 'FAILED';
  createdOfflineAt: string;
  syncRetryCount: number;
  lastSyncAttempt?: string;
  syncError?: string;
}

/**
 * Service qui wraps les APIs existantes pour gérer le mode offline
 * Utilise IndexedDB comme cache local
 */
class OfflineApiService {
  private config: OfflineApiConfig = {
    isOnline: true,
    retryAttempts: 3,
    cacheDuration: 60, // 1 heure par défaut
  };

  /**
   * Mettre à jour l'état de connexion
   */
  updateConnectionStatus(isOnline: boolean) {
    console.log(`[OfflineAPI] État connexion mis à jour: ${isOnline ? 'ONLINE' : 'OFFLINE'}`);
    this.config.isOnline = isOnline;
  }

  /**
   * Articles - avec cache offline
   */
  async getArticles(): Promise<ArticleDTO[]> {
    console.log('[OfflineAPI] Récupération articles...');

    if (this.config.isOnline) {
      try {
        // Mode online - appel API normal
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/articles/products`, {
          headers: this.getAuthHeaders(),
        });

        if (response.ok) {
          const data = await response.json();
          const articles = this.extractArticlesFromApiResponse(data);
          
          // Mettre en cache pour utilisation offline
          await indexedDBService.cacheArticles(articles);
          console.log(`[OfflineAPI] ${articles.length} articles mis en cache`);
          
          return articles;
        }
        throw new Error(`API Error: ${response.status}`);
      } catch (error) {
        console.warn('[OfflineAPI] Erreur API articles, fallback cache:', error);
        // Fallback vers cache si API échoue
        return this.getCachedArticles();
      }
    } else {
      // Mode offline - lecture depuis cache
      console.log('[OfflineAPI] Mode offline - lecture cache articles');
      return this.getCachedArticles();
    }
  }

  /**
   * Validation badge - avec cache utilisateur
   */
  async validateBadge(codeBadge: string): Promise<{
    success: boolean;
    user?: UtilisateurResponse;
    error?: string;
    fromCache?: boolean;
  }> {
    console.log(`[OfflineAPI] Validation badge: ${codeBadge}`);

    if (this.config.isOnline) {
      try {
        // Mode online - appel API normal
        const response = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/utilisateurs/badge?codeBadge=${encodeURIComponent(codeBadge)}`,
          {
            headers: this.getAuthHeaders(),
          }
        );

        if (response.ok) {
          const result = await response.json();
          const user = result.data;
          
          // Mettre en cache l'utilisateur pour utilisation offline
          await indexedDBService.cacheUser({
            id: user.id,
            nom: user.nom,
            prenom: user.prenom,
            email: user.email,
            codeBadge: user.codeBadge,
            solde: user.solde,
            categoryId: user.categorieEmployeId,
            cachedAt: new Date().toISOString(),
          });
          
          return { success: true, user, fromCache: false };
        } else if (response.status === 404) {
          return { success: false, error: 'Badge non trouvé' };
        }
        throw new Error(`API Error: ${response.status}`);
      } catch (error) {
        console.warn('[OfflineAPI] Erreur API badge, fallback cache:', error);
        // Fallback vers cache si API échoue
        return this.validateBadgeFromCache(codeBadge);
      }
    } else {
      // Mode offline - validation depuis cache
      console.log('[OfflineAPI] Mode offline - validation badge depuis cache');
      return this.validateBadgeFromCache(codeBadge);
    }
  }

  /**
   * Création transaction - stockage offline si nécessaire
   */
  async createTransaction(transactionData: {
    userEmail: string;
    articles: Array<{
      articleId: number;
      quantite: number;
    }>;
    utilisateur: UtilisateurResponse;
    cartTotal: number;
    estimatedSubvention: number;
    estimatedToPay: number;
    articleDetails: ArticleDTO[];
  }): Promise<{
    success: boolean;
    data?: any;
    error?: string;
    isOffline?: boolean;
  }> {
    console.log('[OfflineAPI] Création transaction...');

    if (this.config.isOnline) {
      try {
        // Mode online - appel API normal
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/pos/validate`, {
          method: 'POST',
          headers: this.getAuthHeaders(),
          body: JSON.stringify({
            userEmail: transactionData.userEmail,
            articles: transactionData.articles,
          }),
        });

        if (response.ok) {
          const result = await response.json();
          return { success: true, data: result };
        }
        throw new Error(`API Error: ${response.status}`);
      } catch (error) {
        console.warn('[OfflineAPI] Erreur API transaction, stockage offline:', error);
        // Stocker offline et retourner succès local
        return this.createOfflineTransaction(transactionData);
      }
    } else {
      // Mode offline - stockage local
      console.log('[OfflineAPI] Mode offline - création transaction locale');
      return this.createOfflineTransaction(transactionData);
    }
  }

  /**
   * Synchroniser les transactions offline
   */
  async syncOfflineTransactions(): Promise<{
    synced: number;
    failed: number;
    errors: string[];
  }> {
    console.log('[OfflineAPI] Début synchronisation transactions offline...');
    
    if (!this.config.isOnline) {
      return { synced: 0, failed: 0, errors: ['Pas de connexion réseau'] };
    }

    const pendingTransactions = await indexedDBService.getPendingTransactions();
    console.log(`[OfflineAPI] ${pendingTransactions.length} transactions à synchroniser`);

    let synced = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const transaction of pendingTransactions) {
      try {
        // Marquer comme en cours de sync
        await indexedDBService.updateTransactionSyncStatus(transaction.tempId, 'SYNCING');

        // Essayer de synchroniser avec l'API
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/pos/validate`, {
          method: 'POST',
          headers: this.getAuthHeaders(),
          body: JSON.stringify({
            userEmail: transaction.utilisateur.email,
            articles: transaction.articles.map(a => ({
              articleId: a.articleId,
              quantite: a.quantite,
            })),
          }),
        });

        if (response.ok) {
          // Succès - marquer comme synchronisé
          await indexedDBService.updateTransactionSyncStatus(transaction.tempId, 'SYNCED');
          synced++;
          console.log(`[OfflineAPI] Transaction ${transaction.tempId} synchronisée`);
        } else {
          throw new Error(`API Error: ${response.status}`);
        }
      } catch (error) {
        // Échec - marquer comme échoué et incrémenter retry
        await indexedDBService.updateTransactionSyncStatus(
          transaction.tempId, 
          'FAILED',
          error instanceof Error ? error.message : 'Erreur inconnue'
        );
        failed++;
        errors.push(`Transaction ${transaction.tempId}: ${error}`);
        console.error(`[OfflineAPI] Échec sync transaction ${transaction.tempId}:`, error);
      }
    }

    console.log(`[OfflineAPI] Sync terminée: ${synced} réussies, ${failed} échouées`);
    return { synced, failed, errors };
  }

  /**
   * Obtenir les statistiques du cache offline
   */
  async getOfflineStats(): Promise<{
    cachedArticles: number;
    cachedUsers: number;
    pendingTransactions: number;
    failedTransactions: number;
    lastSyncAt?: string;
  }> {
    const [stats, pendingCount, failedCount] = await Promise.all([
      indexedDBService.getStorageStats(),
      indexedDBService.getPendingTransactionsCount(),
      indexedDBService.getFailedTransactionsCount(),
    ]);

    return {
      cachedArticles: stats.cachedArticles,
      cachedUsers: stats.cachedUsers,
      pendingTransactions: pendingCount,
      failedTransactions: failedCount,
      lastSyncAt: localStorage.getItem('lastOfflineSync') || undefined,
    };
  }

  // MÉTHODES PRIVÉES

  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('authToken') || 
                  localStorage.getItem('token') || 
                  localStorage.getItem('accessToken');
    
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    };
  }

  private extractArticlesFromApiResponse(data: any): ArticleDTO[] {
    // Adapter selon la structure de votre API
    if (data?.content && Array.isArray(data.content)) {
      return data.content;
    }
    if (data?.data?.content && Array.isArray(data.data.content)) {
      return data.data.content;
    }
    if (Array.isArray(data)) {
      return data;
    }
    return [];
  }

  private async getCachedArticles(): Promise<ArticleDTO[]> {
    try {
      const articles = await indexedDBService.getCachedArticles();
      console.log(`[OfflineAPI] ${articles.length} articles lus depuis le cache`);
      return articles;
    } catch (error) {
      console.error('[OfflineAPI] Erreur lecture cache articles:', error);
      return [];
    }
  }

  private async validateBadgeFromCache(codeBadge: string): Promise<{
    success: boolean;
    user?: UtilisateurResponse;
    error?: string;
    fromCache: boolean;
  }> {
    try {
      const user = await indexedDBService.getUserByBadge(codeBadge);
      if (user) {
        // Convertir le format cache vers le format API
        const userResponse: UtilisateurResponse = {
            id: user.id,
            nom: user.nom,
            prenom: user.prenom,
            email: user.email,
            codeBadge: user.codeBadge,
            solde: user.solde,
            categorieEmployesId: user.categoryId,
            role: 'EMPLOYE', // Valeur par défaut en cache
            cadre: 'Employé',
            cin: user.cin ,
            isActive: user.isActive 
        };
        
        console.log(`[OfflineAPI] Badge ${codeBadge} trouvé dans le cache`);
        return { success: true, user: userResponse, fromCache: true };
      } else {
        return { success: false, error: 'Badge non trouvé dans le cache offline', fromCache: true };
      }
    } catch (error) {
      console.error('[OfflineAPI] Erreur validation cache badge:', error);
      return { success: false, error: 'Erreur lecture cache', fromCache: true };
    }
  }

  private async createOfflineTransaction(transactionData: {
    userEmail: string;
    articles: Array<{ articleId: number; quantite: number }>;
    utilisateur: UtilisateurResponse;
    cartTotal: number;
    estimatedSubvention: number;
    estimatedToPay: number;
    articleDetails: ArticleDTO[];
  }): Promise<{
    success: boolean;
    data?: any;
    error?: string;
    isOffline: boolean;
  }> {
    try {
      const now = new Date();
      const tempId = `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const numeroTicket = `OFF-${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}-${tempId.slice(-6)}`;

      const offlineTransaction: OfflineTransaction = {
        tempId,
        numeroTicket,
        date: now.toISOString(),
        montantTotal: transactionData.cartTotal,
        partSalariale: transactionData.estimatedToPay,
        partPatronale: transactionData.estimatedSubvention,
        articles: transactionData.articles.map(item => {
          const articleDetail = transactionData.articleDetails.find(a => a.id === item.articleId);
          return {
            articleId: item.articleId,
            nom: articleDetail?.nom || 'Article inconnu',
            quantite: item.quantite,
            prixUnitaire: parseFloat(articleDetail?.prix || '0'),
            montantTotal: item.quantite * parseFloat(articleDetail?.prix || '0'),
            subventionTotale: 0, // À calculer plus tard
            partSalariale: item.quantite * parseFloat(articleDetail?.prix || '0'),
          };
        }),
        utilisateur: {
          id: transactionData.utilisateur.id,
          nom: transactionData.utilisateur.nom,
          prenom: transactionData.utilisateur.prenom,
          email: transactionData.utilisateur.email,
          codeBadge: transactionData.utilisateur.codeBadge,
        },
        syncStatus: 'PENDING',
        createdOfflineAt: now.toISOString(),
        syncRetryCount: 0,
      };

      await indexedDBService.storeOfflineTransaction(offlineTransaction);
      
      console.log(`[OfflineAPI] Transaction offline créée: ${numeroTicket}`);
      
      // Simuler une réponse API pour compatibilité
      const offlineResponse = {
        status: 'offline_success',
        message: 'Transaction enregistrée en mode offline',
        numeroTicket,
        utilisateurNomComplet: `${transactionData.utilisateur.prenom} ${transactionData.utilisateur.nom}`,
        montantTotal: transactionData.cartTotal,
        partSalariale: transactionData.estimatedToPay,
        partPatronale: transactionData.estimatedSubvention,
        soldeActuel: transactionData.utilisateur.solde,
        nouveauSolde: transactionData.utilisateur.solde - transactionData.estimatedToPay,
        articles: offlineTransaction.articles,
        transactionId: tempId,
      };

      return {
        success: true,
        data: offlineResponse,
        isOffline: true,
      };
    } catch (error) {
      console.error('[OfflineAPI] Erreur création transaction offline:', error);
      return {
        success: false,
        error: 'Impossible de créer la transaction offline',
        isOffline: true,
      };
    }
  }
}

// Instance singleton
export const offlineApiService = new OfflineApiService();
export default offlineApiService;