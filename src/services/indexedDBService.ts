import { ArticleDTO } from '@/types/entities';

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

interface CachedUser {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  codeBadge: string;
  solde: number;
  categoryId: number;
  cin?: string;
  isActive?: boolean;
  role?: string;
  cadre?: string;
  cachedAt: string;
}

class IndexedDBService {
  private dbName = 'EasyPosOfflineDB';
  private version = 1;
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains('offlineTransactions')) {
          const txStore = db.createObjectStore('offlineTransactions', { keyPath: 'tempId' });
          txStore.createIndex('syncStatus', 'syncStatus');
          txStore.createIndex('createdOfflineAt', 'createdOfflineAt');
        }
        
        if (!db.objectStoreNames.contains('articles')) {
          db.createObjectStore('articles', { keyPath: 'id' });
        }
        
        if (!db.objectStoreNames.contains('users')) {
          const userStore = db.createObjectStore('users', { keyPath: 'id' });
          userStore.createIndex('codeBadge', 'codeBadge', { unique: true });
        }
      };
    });
  }

  // TRANSACTIONS OFFLINE
  async storeOfflineTransaction(transaction: OfflineTransaction): Promise<void> {
    if (!this.db) throw new Error('DB not initialized');
    
    const tx = this.db.transaction(['offlineTransactions'], 'readwrite');
    const store = tx.objectStore('offlineTransactions');
    
    return new Promise((resolve, reject) => {
      const request = store.add(transaction);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getPendingTransactions(): Promise<OfflineTransaction[]> {
    if (!this.db) throw new Error('DB not initialized');
    
    const tx = this.db.transaction(['offlineTransactions'], 'readonly');
    const store = tx.objectStore('offlineTransactions');
    const index = store.index('syncStatus');
    
    return new Promise((resolve, reject) => {
      const request = index.getAll('PENDING');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getPendingTransactionsCount(): Promise<number> {
    if (!this.db) throw new Error('DB not initialized');
    
    const tx = this.db.transaction(['offlineTransactions'], 'readonly');
    const store = tx.objectStore('offlineTransactions');
    const index = store.index('syncStatus');
    
    return new Promise((resolve, reject) => {
      const request = index.count('PENDING');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getFailedTransactionsCount(): Promise<number> {
    if (!this.db) throw new Error('DB not initialized');
    
    const tx = this.db.transaction(['offlineTransactions'], 'readonly');
    const store = tx.objectStore('offlineTransactions');
    const index = store.index('syncStatus');
    
    return new Promise((resolve, reject) => {
      const request = index.count('FAILED');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async updateTransactionSyncStatus(
    tempId: string, 
    status: 'PENDING' | 'SYNCING' | 'SYNCED' | 'FAILED',
    error?: string
  ): Promise<void> {
    if (!this.db) throw new Error('DB not initialized');
    
    const tx = this.db.transaction(['offlineTransactions'], 'readwrite');
    const store = tx.objectStore('offlineTransactions');
    
    return new Promise((resolve, reject) => {
      const getRequest = store.get(tempId);
      getRequest.onsuccess = () => {
        const transaction = getRequest.result;
        if (transaction) {
          transaction.syncStatus = status;
          transaction.lastSyncAttempt = new Date().toISOString();
          
          if (status === 'FAILED') {
            transaction.syncRetryCount = (transaction.syncRetryCount || 0) + 1;
            transaction.syncError = error;
          } else if (status === 'SYNCED') {
            transaction.syncError = undefined;
          }
          
          const updateRequest = store.put(transaction);
          updateRequest.onsuccess = () => resolve();
          updateRequest.onerror = () => reject(updateRequest.error);
        } else {
          reject(new Error('Transaction not found'));
        }
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  // ARTICLES CACHE
  async cacheArticles(articles: ArticleDTO[]): Promise<void> {
    if (!this.db) throw new Error('DB not initialized');
    
    const tx = this.db.transaction(['articles'], 'readwrite');
    const store = tx.objectStore('articles');
    
    return new Promise((resolve, reject) => {
      // Vider le cache existant
      store.clear();
      
      // Ajouter nouveaux articles
      articles.forEach(article => store.put(article));
      
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async getCachedArticles(): Promise<ArticleDTO[]> {
    if (!this.db) throw new Error('DB not initialized');
    
    const tx = this.db.transaction(['articles'], 'readonly');
    const store = tx.objectStore('articles');
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // UTILISATEURS CACHE
  async cacheUser(user: CachedUser): Promise<void> {
    if (!this.db) throw new Error('DB not initialized');
    
    const tx = this.db.transaction(['users'], 'readwrite');
    const store = tx.objectStore('users');
    
    return new Promise((resolve, reject) => {
      const request = store.put(user);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getUserByBadge(codeBadge: string): Promise<CachedUser | null> {
    if (!this.db) throw new Error('DB not initialized');
    
    const tx = this.db.transaction(['users'], 'readonly');
    const store = tx.objectStore('users');
    const index = store.index('codeBadge');
    
    return new Promise((resolve, reject) => {
      const request = index.get(codeBadge);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  // STATISTIQUES
  async getStorageStats(): Promise<{
    offlineTransactions: number;
    cachedArticles: number;
    cachedUsers: number;
  }> {
    if (!this.db) return { offlineTransactions: 0, cachedArticles: 0, cachedUsers: 0 };
    
    const tx = this.db.transaction(['offlineTransactions', 'articles', 'users'], 'readonly');
    
    const [txCount, articlesCount, usersCount] = await Promise.all([
      this.getCount(tx.objectStore('offlineTransactions')),
      this.getCount(tx.objectStore('articles')),
      this.getCount(tx.objectStore('users'))
    ]);
    
    return {
      offlineTransactions: txCount,
      cachedArticles: articlesCount,
      cachedUsers: usersCount
    };
  }

  // NETTOYAGE
  async clearCache(): Promise<void> {
    if (!this.db) throw new Error('DB not initialized');
    
    const tx = this.db.transaction(['offlineTransactions', 'articles', 'users'], 'readwrite');
    
    return new Promise((resolve, reject) => {
      tx.objectStore('offlineTransactions').clear();
      tx.objectStore('articles').clear();
      tx.objectStore('users').clear();
      
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async clearSyncedTransactions(): Promise<number> {
    if (!this.db) throw new Error('DB not initialized');
    
    const tx = this.db.transaction(['offlineTransactions'], 'readwrite');
    const store = tx.objectStore('offlineTransactions');
    const index = store.index('syncStatus');
    
    return new Promise((resolve, reject) => {
      let deletedCount = 0;
      const request = index.openCursor(IDBKeyRange.only('SYNCED'));
      
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          cursor.delete();
          deletedCount++;
          cursor.continue();
        } else {
          resolve(deletedCount);
        }
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  // MÉTHODE PRIVÉE
  private getCount(store: IDBObjectStore): Promise<number> {
    return new Promise((resolve, reject) => {
      const request = store.count();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
}

export const indexedDBService = new IndexedDBService();
export default indexedDBService;