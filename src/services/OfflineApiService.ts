// src/services/OfflineApiService.ts
import { ArticleDTO, UtilisateurResponse } from '@/types/entities';
import { indexedDBService } from './indexedDBService';

interface OfflineApiConfig {
  isOnline: boolean;
  retryAttempts?: number;
  cacheDuration?: number; // minutes
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

class OfflineApiService {
  private config: OfflineApiConfig = {
    isOnline: true,
    retryAttempts: 3,
    cacheDuration: 60,
  };

  private dbReady = false;

  constructor() {
    indexedDBService
      .init()
      .then(() => {
        this.dbReady = true;
      })
      .catch((e) => console.warn('[OfflineAPI] IndexedDB init error:', e));
  }

  /** Mettre à jour l'état de connexion */
  updateConnectionStatus(isOnline: boolean) {
    console.log(`[OfflineAPI] État connexion mis à jour: ${isOnline ? 'ONLINE' : 'OFFLINE'}`);
    this.config.isOnline = isOnline;
  }

  // -------------------- UTILITAIRES HTTP/AUTH --------------------------

  private getApiBase(): string {
    // Garde tes variables .env telles quelles (pas de modification obligatoire)
    // On supporte les deux si jamais les deux existent.
    return (import.meta as any).env?.VITE_API_BASE_URL ||
           (import.meta as any).env?.VITE_API_URL ||
           '/api';
  }

  private getToken(): string | null {
    let t =
      localStorage.getItem('authToken') ||
      localStorage.getItem('token') ||
      localStorage.getItem('accessToken') ||
      sessionStorage.getItem('authToken') ||
      sessionStorage.getItem('token') ||
      sessionStorage.getItem('accessToken') ||
      null;

    // Fallback cookie "token"
    if (!t && typeof document !== 'undefined') {
      const m = document.cookie.match(/(?:^|;\s*)token=([^;]+)/);
      if (m) t = decodeURIComponent(m[1]);
    }

    return t;
  }

  private previewAuthForLogs(): string {
    const t = this.getToken();
    if (!t) return 'none';
    const v = t.startsWith('Bearer ') ? t.slice(7) : t;
    return `Bearer ${v.slice(0, 10)}…`;
  }

  private getAuthHeaders(): HeadersInit {
    const token = this.getToken();
    const headers: Record<string, string> = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
    }
    // Log court pour debug
    console.log('[OfflineAPI] Authorization header:', this.previewAuthForLogs());
    return headers;
  }

  // ✅ Une seule propriété `headers`, fusion propre avec extra.headers
  private fetchOpts(extra?: RequestInit): RequestInit {
    const baseHeaders = this.getAuthHeaders();
    const mergedHeaders: HeadersInit = {
      ...baseHeaders,
      ...(extra?.headers as HeadersInit | undefined),
    };
    const { headers: _ignored, ...restExtra } = extra || {};

    return {
      credentials: 'include', // utile si session cookie
      mode: 'cors',
      cache: 'no-store',
      ...restExtra,
      headers: mergedHeaders,
    };
  }

  // -------------------- ARTICLES ---------------------------------------

  async getArticles(): Promise<ArticleDTO[]> {
    console.log('[OfflineAPI] Récupération articles...');
    try {
      if (this.config.isOnline) {
        const response = await fetch(`${this.getApiBase()}/articles/products`, this.fetchOpts());

        if (response.ok) {
          const data = await response.json();
          const articles = this.extractArticlesFromApiResponse(data);
          if (this.dbReady) {
            await indexedDBService.cacheArticles(articles);
            console.log(`[OfflineAPI] ${articles.length} articles mis en cache`);
          }
          return articles;
        }

        if (response.status === 401) {
          console.warn('[OfflineAPI] 401 Unauthorized sur /articles/products → fallback cache');
          return this.getCachedArticles();
        }
        throw new Error(`API Error: ${response.status}`);
      }

      console.log('[OfflineAPI] Mode offline - lecture cache articles');
      return this.getCachedArticles();
    } catch (error) {
      console.warn('[OfflineAPI] Erreur API articles, fallback cache:', error);
      return this.getCachedArticles();
    }
  }

  // -------------------- BADGE ------------------------------------------

  async validateBadge(codeBadge: string): Promise<{
    success: boolean;
    user?: UtilisateurResponse;
    error?: string;
    fromCache?: boolean;
  }> {
    console.log(`[OfflineAPI] Validation badge: ${codeBadge}`);

    if (!this.config.isOnline) {
      console.log('[OfflineAPI] Mode offline - validation badge depuis cache');
      return this.validateBadgeFromCache(codeBadge);
    }

    try {
      const response = await fetch(
        `${this.getApiBase()}/utilisateurs/badge?codeBadge=${encodeURIComponent(codeBadge)}`,
        this.fetchOpts()
      );

      if (response.ok) {
        const result = await response.json();
        const user = result.data;

        if (this.dbReady) {
          await indexedDBService.cacheUser({
            id: user.id,
            nom: user.nom,
            prenom: user.prenom,
            email: user.email,
            codeBadge: user.codeBadge,
            solde: user.solde,
            categoryId: user.categorieEmployesId,
            cachedAt: new Date().toISOString(),
          });
        }

        return { success: true, user, fromCache: false };
      }

      if (response.status === 404) {
        return { success: false, error: 'Badge non trouvé' };
      }
      if (response.status === 401) {
        console.warn('[OfflineAPI] 401 Unauthorized sur /utilisateurs/badge → fallback cache');
        return this.validateBadgeFromCache(codeBadge);
      }

      throw new Error(`API Error: ${response.status}`);
    } catch (error) {
      console.warn('[OfflineAPI] Erreur API badge, fallback cache:', error);
      return this.validateBadgeFromCache(codeBadge);
    }
  }

  // -------------------- TRANSACTION ------------------------------------

  async createTransaction(transactionData: {
    userEmail: string;
    articles: Array<{ articleId: number; quantite: number }>;
    utilisateur: UtilisateurResponse;
    cartTotal: number;
    estimatedSubvention: number;
    estimatedToPay: number;
    articleDetails: ArticleDTO[];
  }): Promise<{ success: boolean; data?: any; error?: string; isOffline?: boolean }> {
    console.log('[OfflineAPI] Création transaction...');

    if (!this.config.isOnline) {
      console.log('[OfflineAPI] Mode offline - création transaction locale');
      return this.createOfflineTransaction(transactionData);
    }

    try {
      const response = await fetch(
        `${this.getApiBase()}/pos/validate`,
        this.fetchOpts({
          method: 'POST',
          body: JSON.stringify({
            userEmail: transactionData.userEmail,
            articles: transactionData.articles,
          }),
        })
      );

      if (response.ok) {
        const result = await response.json();
        return { success: true, data: result, isOffline: false };
      }

      if (response.status === 401) {
        console.warn('[OfflineAPI] 401 Unauthorized sur /pos/validate → bascule en offline');
        return this.createOfflineTransaction(transactionData);
      }

      throw new Error(`API Error: ${response.status}`);
    } catch (error) {
      console.warn('[OfflineAPI] Erreur API transaction, stockage offline:', error);
      return this.createOfflineTransaction(transactionData);
    }
  }

  // -------------------- SYNC OFFLINE -----------------------------------

  async syncOfflineTransactions(): Promise<{ synced: number; failed: number; errors: string[] }> {
    console.log('[OfflineAPI] Début synchronisation transactions offline...');

    if (!this.config.isOnline) {
      return { synced: 0, failed: 0, errors: ['Pas de connexion réseau'] };
    }

    const pendingTransactions = this.dbReady ? await indexedDBService.getPendingTransactions() : [];
    console.log(`[OfflineAPI] ${pendingTransactions.length} transactions à synchroniser`);

    let synced = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const transaction of pendingTransactions) {
      try {
        if (this.dbReady) {
          await indexedDBService.updateTransactionSyncStatus(transaction.tempId, 'SYNCING');
        }

        const response = await fetch(
          `${this.getApiBase()}/pos/validate`,
          this.fetchOpts({
            method: 'POST',
            body: JSON.stringify({
              userEmail: transaction.utilisateur.email,
              articles: transaction.articles.map((a) => ({
                articleId: a.articleId,
                quantite: a.quantite,
              })),
            }),
          })
        );

        if (response.ok) {
          if (this.dbReady) {
            await indexedDBService.updateTransactionSyncStatus(transaction.tempId, 'SYNCED');
          }
          synced++;
          console.log(`[OfflineAPI] Transaction ${transaction.tempId} synchronisée`);
        } else {
          throw new Error(`API Error: ${response.status}`);
        }
      } catch (error: any) {
        if (this.dbReady) {
          await indexedDBService.updateTransactionSyncStatus(
            transaction.tempId,
            'FAILED',
            error?.message || String(error)
          );
        }
        failed++;
        errors.push(`Transaction ${transaction.tempId}: ${error?.message || error}`);
        console.error(`[OfflineAPI] Échec sync transaction ${transaction.tempId}:`, error);
      }
    }

    if (synced > 0) {
      localStorage.setItem('lastOfflineSync', new Date().toISOString());
    }

    console.log(`[OfflineAPI] Sync terminée: ${synced} réussies, ${failed} échouées`);
    return { synced, failed, errors };
  }

  // -------------------- STATS ------------------------------------------

  async getOfflineStats(): Promise<{
    cachedArticles: number;
    cachedUsers: number;
    pendingTransactions: number;
    failedTransactions: number;
    lastSyncAt?: string;
  }> {
    const [stats, pendingCount, failedCount] = this.dbReady
      ? await Promise.all([
          indexedDBService.getStorageStats(),
          indexedDBService.getPendingTransactionsCount(),
          indexedDBService.getFailedTransactionsCount(),
        ])
      : [{ cachedArticles: 0, cachedUsers: 0 }, 0, 0];

    return {
      cachedArticles: (stats as any).cachedArticles || 0,
      cachedUsers: (stats as any).cachedUsers || 0,
      pendingTransactions: pendingCount,
      failedTransactions: failedCount,
      lastSyncAt: localStorage.getItem('lastOfflineSync') || undefined,
    };
  }

  // -------------------- SW TOKEN / BG SYNC -----------------------------

  async sendAuthTokenToServiceWorker(): Promise<void> {
    if (!('serviceWorker' in navigator)) return;
    try {
      const registration = await navigator.serviceWorker.ready;
      if (registration.active) {
        const token = this.getToken();
        if (token) {
          const ch = new MessageChannel();
          ch.port1.onmessage = (event) => {
            if (event.data?.type === 'AUTH_TOKEN_UPDATED') {
              console.log('✅ [OfflineAPI] Token envoyé au Service Worker');
            }
          };
          registration.active.postMessage(
            { type: 'SET_AUTH_TOKEN', payload: { token } },
            [ch.port2]
          );
        }
      }
    } catch (error) {
      console.warn('[OfflineAPI] Erreur envoi token au SW:', error);
    }
  }

  async clearAuthTokenFromServiceWorker(): Promise<void> {
    if (!('serviceWorker' in navigator)) return;
    try {
      const registration = await navigator.serviceWorker.ready;
      if (registration.active) {
        registration.active.postMessage({ type: 'CLEAR_AUTH_TOKEN' });
        console.log('🧹 [OfflineAPI] Token nettoyé du Service Worker');
      }
    } catch (error) {
      console.warn('[OfflineAPI] Erreur nettoyage token SW:', error);
    }
  }

  async registerBackgroundSync(): Promise<boolean> {
    // @ts-ignore
    if (!('serviceWorker' in navigator) || !('sync' in ServiceWorkerRegistration.prototype)) {
      console.warn('[OfflineAPI] Background Sync non supporté');
      return false;
    }
    try {
      const registration = await navigator.serviceWorker.ready;
      // @ts-ignore
      await registration.sync.register('sync-offline-transactions');
      console.log('✅ [OfflineAPI] Background sync enregistré');
      return true;
    } catch (error) {
      console.error('❌ [OfflineAPI] Erreur enregistrement background sync:', error);
      return false;
    }
  }

  // -------------------- PRIVÉ : Transformations & Cache ----------------

  private extractArticlesFromApiResponse(data: any): ArticleDTO[] {
    if (data?.content && Array.isArray(data.content)) return data.content;
    if (data?.data?.content && Array.isArray(data.data.content)) return data.data.content;
    if (Array.isArray(data)) return data;
    return [];
  }

  private async getCachedArticles(): Promise<ArticleDTO[]> {
    try {
      if (!this.dbReady) return [];
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
    if (!this.dbReady) return { success: false, error: 'Cache indisponible', fromCache: true };

    try {
      const user = await indexedDBService.getUserByBadge(codeBadge);
      if (user) {
        const userResponse: UtilisateurResponse = {
          id: user.id,
          nom: user.nom,
          prenom: user.prenom,
          email: user.email,
          codeBadge: user.codeBadge,
          solde: user.solde,
          categorieEmployesId: user.categoryId,
          role: user.role || 'EMPLOYE',
          cadre: user.cadre || 'Employé',
          cin: user.cin,
          isActive: user.isActive,
        };
        console.log(`[OfflineAPI] Badge ${codeBadge} trouvé dans le cache`);
        return { success: true, user: userResponse, fromCache: true };
      }
      return { success: false, error: 'Badge non trouvé dans le cache offline', fromCache: true };
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
  }): Promise<{ success: boolean; data?: any; error?: string; isOffline: boolean }> {
    try {
      const now = new Date();
      const tempId = `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const numeroTicket = `OFF-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(
        now.getDate()
      ).padStart(2, '0')}-${tempId.slice(-6)}`;

      const offlineTransaction: OfflineTransaction = {
        tempId,
        numeroTicket,
        date: now.toISOString(),
        montantTotal: transactionData.cartTotal,
        partSalariale: transactionData.estimatedToPay,
        partPatronale: transactionData.estimatedSubvention,
        articles: transactionData.articles.map((item) => {
          const a = transactionData.articleDetails.find((x) => x.id === item.articleId);
          const pu = parseFloat(a?.prix || '0');
          return {
            articleId: item.articleId,
            nom: a?.nom || 'Article inconnu',
            quantite: item.quantite,
            prixUnitaire: pu,
            montantTotal: item.quantite * pu,
            subventionTotale: 0,
            partSalariale: item.quantite * pu,
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

      if (this.dbReady) {
        await indexedDBService.storeOfflineTransaction(offlineTransaction);
      }

      console.log(`[OfflineAPI] Transaction offline créée: ${numeroTicket}`);
      await this.registerBackgroundSync();

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

      return { success: true, data: offlineResponse, isOffline: true };
    } catch (error) {
      console.error('[OfflineAPI] Erreur création transaction offline:', error);
      return { success: false, error: 'Impossible de créer la transaction offline', isOffline: true };
    }
  }
}

// Instance singleton
export const offlineApiService = new OfflineApiService();
export default offlineApiService;
