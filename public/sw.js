// Service Worker EasyPOS - Version 1.0.0 avec Background Sync
const CACHE_NAME = 'easypos-cache-v1';
const STATIC_CACHE = 'easypos-static-v1';
const DYNAMIC_CACHE = 'easypos-dynamic-v1';
const API_CACHE = 'easypos-api-v1';

// Configuration - adaptée à votre architecture
const API_BASE_URL = 'http://localhost:8080/api';
const APP_ROUTES = [
  '/',
  '/pos',
  '/dashboard',
  '/articles',
  '/transactions',
  '/badges',
  '/login'
];

// Ressources critiques à mettre en cache immédiatement
const CRITICAL_RESOURCES = [
  '/',
  '/manifest.json',
  '/favicon.ico'
];

// Endpoints API critiques pour le POS
const CRITICAL_API_ENDPOINTS = [
  `${API_BASE_URL}/articles/products`,
  `${API_BASE_URL}/pos/health`,
  `${API_BASE_URL}/utilisateurs/badge`,
  `${API_BASE_URL}/utilisateurs/account`
];

// Variables globales pour l'authentification
let cachedAuthToken = null;
let tokenLastUpdated = null;

// 🚀 INSTALLATION DU SERVICE WORKER
self.addEventListener('install', (event) => {
  console.log('🔧 [SW] Installation démarrée...');
  
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then((cache) => {
        console.log('📦 [SW] Mise en cache des ressources critiques');
        return cache.addAll(CRITICAL_RESOURCES);
      })
    ]).then(() => {
      console.log('✅ [SW] Installation terminée avec succès');
      return self.skipWaiting();
    }).catch((error) => {
      console.error('❌ [SW] Erreur lors de l\'installation:', error);
    })
  );
});

// 🔄 ACTIVATION DU SERVICE WORKER
self.addEventListener('activate', (event) => {
  console.log('🎯 [SW] Activation en cours...');
  
  event.waitUntil(
    Promise.all([
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && 
                cacheName !== STATIC_CACHE && 
                cacheName !== DYNAMIC_CACHE && 
                cacheName !== API_CACHE) {
              console.log('🗑️ [SW] Suppression ancien cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      self.clients.claim()
    ]).then(() => {
      console.log('✅ [SW] Activation terminée - Service Worker actif');
    }).catch((error) => {
      console.error('❌ [SW] Erreur lors de l\'activation:', error);
    })
  );
});

// 🌐 INTERCEPTION DES REQUÊTES + EXTRACTION TOKEN
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  const authHeader = request.headers.get('Authorization');
  
  // Extraire et cacher le token Bearer des requêtes sortantes
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.replace('Bearer ', '');
    if (token !== cachedAuthToken) {
      cachedAuthToken = token;
      tokenLastUpdated = Date.now();
      console.log('🔐 [SW] Token d\'auth mis à jour depuis les requêtes');
    }
  }
  
  if (!request.url.startsWith('http')) {
    return;
  }

  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
  } else if (request.destination === 'image') {
    event.respondWith(handleImageRequest(request));
  } else if (request.destination === 'document' || 
             url.pathname.endsWith('.html') || 
             APP_ROUTES.includes(url.pathname)) {
    event.respondWith(handlePageRequest(request));
  } else {
    event.respondWith(handleStaticRequest(request));
  }
});

// 📡 GESTION DES REQUÊTES API
async function handleApiRequest(request) {
  const url = new URL(request.url);
  console.log('📡 [SW] Requête API:', url.pathname);

  try {
    const networkResponse = await fetch(request);
    console.log(`📡 [SW] Réponse réseau pour ${url.pathname}:`, networkResponse.status);
    
    if (networkResponse.ok) {
      const cache = await caches.open(API_CACHE);
      const responseToCache = networkResponse.clone();
      
      if (request.method === 'GET' && isCriticalEndpoint(url.pathname)) {
        await cache.put(request, responseToCache);
        console.log('💾 [SW] API mise en cache:', url.pathname);
      }
      
      return networkResponse;
    } else {
      console.log(`⚠️ [SW] Erreur serveur ${networkResponse.status} pour ${url.pathname}`);
      return networkResponse;
    }
  } catch (error) {
    console.log('🔄 [SW] Réseau complètement échoué pour:', url.pathname, error);
    
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      console.log('📦 [SW] Réponse servie depuis le cache:', url.pathname);
      return cachedResponse;
    }
    
    if (url.pathname.includes('/pos/health')) {
      return new Response(JSON.stringify({
        status: 'offline',
        message: 'Mode hors ligne actif',
        timestamp: Date.now(),
        service: 'easypos-pwa',
        version: '1.0.0'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    throw error;
  }
}

// 🖼️ GESTION DES IMAGES
async function handleImageRequest(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    return new Response('', { status: 404 });
  }
}

// 📄 GESTION DES PAGES
async function handlePageRequest(request) {
  const url = new URL(request.url);
  console.log('📄 [SW] Requête page:', url.pathname);
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      console.log('🌐 [SW] Page servie depuis le réseau:', url.pathname);
      
      const cache = await caches.open(STATIC_CACHE);
      
      if (APP_ROUTES.includes(url.pathname) || url.pathname.startsWith('/pos')) {
        const indexRequest = new Request(new URL('/', request.url).href);
        cache.put(indexRequest, networkResponse.clone());
      } else {
        cache.put(request, networkResponse.clone());
      }
      
      return networkResponse;
    }
    
    throw new Error(`Network failed: ${networkResponse.status}`);
  } catch (error) {
    console.log('🔄 [SW] Réseau échoué pour page, tentative cache:', url.pathname);
    
    let cachedResponse;
    
    if (APP_ROUTES.includes(url.pathname) || url.pathname.startsWith('/pos')) {
      const indexRequest = new Request(new URL('/', request.url).href);
      cachedResponse = await caches.match(indexRequest);
    } else {
      cachedResponse = await caches.match(request);
    }
    
    if (cachedResponse) {
      console.log('📦 [SW] Page servie depuis le cache:', url.pathname);
      return cachedResponse;
    }
    
    return new Response(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Mode Hors Ligne - EasyPOS</title>
        <style>
          body { 
            font-family: system-ui, -apple-system, sans-serif; 
            margin: 0; 
            padding: 40px 20px; 
            text-align: center; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .container { 
            background: rgba(255,255,255,0.1); 
            padding: 40px; 
            border-radius: 20px; 
            backdrop-filter: blur(10px);
          }
          h1 { margin: 0 0 20px; font-size: 2rem; }
          p { margin: 10px 0; opacity: 0.9; }
          .icon { font-size: 4rem; margin-bottom: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="icon">📱</div>
          <h1>Mode Hors Ligne</h1>
          <p>L'application EasyPOS fonctionne en mode dégradé.</p>
          <p>Certaines fonctionnalités peuvent être limitées.</p>
          <br>
          <p><strong>Reconnexion automatique en cours...</strong></p>
        </div>
        <script>
          const attemptReconnection = async () => {
            try {
              const healthResponse = await fetch('http://localhost:8080/api/pos/health', {
                method: 'GET',
                cache: 'no-cache',
                signal: AbortSignal.timeout(5000)
              });
              
              if (healthResponse.ok) {
                window.location.href = window.location.href + '?t=' + Date.now();
                return true;
              }
            } catch (error) {
              console.log('API encore inaccessible:', error.message);
            }
            return false;
          };
          
          attemptReconnection();
          const reconnectInterval = setInterval(attemptReconnection, 3000);
          
          window.addEventListener('online', () => {
            setTimeout(attemptReconnection, 500);
          });
          
          window.addEventListener('beforeunload', () => {
            clearInterval(reconnectInterval);
          });
        </script>
      </body>
      </html>
    `, {
      status: 200,
      headers: { 'Content-Type': 'text/html' }
    });
  }
}

// 📦 GESTION DES RESSOURCES STATIQUES
async function handleStaticRequest(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('❌ [SW] Impossible de charger la ressource:', request.url);
    throw error;
  }
}

function isCriticalEndpoint(pathname) {
  const criticalPaths = [
    '/articles/products',
    '/pos/health',
    '/utilisateurs/badge',
    '/utilisateurs/account'
  ];
  
  return criticalPaths.some(path => pathname.includes(path));
}

// 📨 GESTION DES MESSAGES + AUTHENTIFICATION
self.addEventListener('message', (event) => {
  const { type, payload } = event.data;
  
  switch (type) {
    case 'SET_AUTH_TOKEN':
      cachedAuthToken = payload.token;
      tokenLastUpdated = Date.now();
      console.log('🔐 [SW] Token d\'auth reçu via message:', !!cachedAuthToken);
      
      event.ports[0]?.postMessage({ 
        type: 'AUTH_TOKEN_UPDATED', 
        success: true 
      });
      break;
      
    case 'CLEAR_AUTH_TOKEN':
      cachedAuthToken = null;
      tokenLastUpdated = null;
      console.log('🔐 [SW] Token d\'auth effacé');
      break;

    case 'REQUEST_AUTH_TOKEN':
      event.ports[0].postMessage({
        type: 'AUTH_TOKEN_RESPONSE',
        token: cachedAuthToken
      });
      break;
      
    case 'SKIP_WAITING':
      console.log('⏭️ [SW] Skip waiting demandé');
      self.skipWaiting();
      break;
      
    case 'GET_CACHE_STATUS':
      getCacheStatus().then((status) => {
        event.ports[0].postMessage({ type: 'CACHE_STATUS', payload: status });
      });
      break;
      
    case 'CLEAR_CACHE':
      clearAllCaches().then(() => {
        event.ports[0].postMessage({ type: 'CACHE_CLEARED' });
      });
      break;
      
    default:
      console.log('📝 [SW] Message non géré:', type);
  }
});

// 🔄 BACKGROUND SYNC
self.addEventListener('sync', (event) => {
  console.log('🔄 [SW] Background sync déclenché:', event.tag);
  
  if (event.tag === 'sync-offline-transactions') {
    event.waitUntil(syncOfflineTransactions());
  }
});

// 📤 SYNCHRONISATION DES TRANSACTIONS OFFLINE - VERSION COMPLÈTE
async function syncOfflineTransactions() {
  console.log('📤 [SW] Début sync des transactions offline...');
  
  try {
    // Récupérer le token d'authentification
    const authToken = await getAuthToken();
    
    if (!authToken) {
      throw new Error('Impossible de récupérer le token d\'authentification');
    }
    
    // Ouvrir IndexedDB
    const db = await openIndexedDB();
    const pendingTransactions = await getPendingTransactionsFromDB(db);
    
    console.log(`📤 [SW] ${pendingTransactions.length} transactions à synchroniser`);
    
    let synced = 0;
    let failed = 0;
    const errors = [];
    
    for (const transaction of pendingTransactions) {
      try {
        await updateTransactionStatus(db, transaction.tempId, 'SYNCING');
        
        const response = await fetch(`${API_BASE_URL}/pos/validate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify({
            userEmail: transaction.utilisateur.email,
            articles: transaction.articles.map(a => ({
              articleId: a.articleId,
              quantite: a.quantite,
            })),
          }),
        });

        if (response.ok) {
          await updateTransactionStatus(db, transaction.tempId, 'SYNCED');
          synced++;
          console.log(`✅ [SW] Transaction ${transaction.tempId} synchronisée`);
        } else if (response.status === 401 || response.status === 403) {
          throw new Error(`Erreur d'authentification: ${response.status}`);
        } else {
          throw new Error(`Erreur API: ${response.status}`);
        }
      } catch (error) {
        await updateTransactionStatus(db, transaction.tempId, 'FAILED', error.message);
        failed++;
        errors.push(`Transaction ${transaction.tempId}: ${error.message}`);
        console.error(`❌ [SW] Échec sync ${transaction.tempId}:`, error);
      }
    }
    
    await notifyMainApp({
      type: 'SYNC_COMPLETE',
      payload: { synced, failed, errors }
    });
    
    console.log(`🎯 [SW] Sync terminée: ${synced} réussies, ${failed} échouées`);
    return { synced, failed, errors };
    
  } catch (error) {
    console.error('❌ [SW] Erreur générale sync transactions:', error);
    
    await notifyMainApp({
      type: 'SYNC_ERROR',
      payload: { error: error.message }
    });
    
    throw error;
  }
}

// FONCTIONS D'AUTHENTIFICATION
async function getAuthToken() {
  if (cachedAuthToken && tokenLastUpdated) {
    const tokenAge = Date.now() - tokenLastUpdated;
    const maxAge = 10 * 60 * 1000; // 10 minutes
    
    if (tokenAge < maxAge) {
      console.log('🔐 [SW] Utilisation du token caché');
      return cachedAuthToken;
    }
  }
  
  try {
    const clients = await self.clients.matchAll({ includeUncontrolled: true });
    
    if (clients.length > 0) {
      console.log('📡 [SW] Demande du token à l\'application principale...');
      
      const messageChannel = new MessageChannel();
      
      const tokenPromise = new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Timeout: pas de réponse pour le token'));
        }, 5000);
        
        messageChannel.port1.onmessage = (event) => {
          clearTimeout(timeout);
          
          if (event.data.type === 'AUTH_TOKEN_RESPONSE') {
            if (event.data.token) {
              cachedAuthToken = event.data.token;
              tokenLastUpdated = Date.now();
              resolve(event.data.token);
            } else {
              reject(new Error('Aucun token reçu'));
            }
          } else {
            reject(new Error('Réponse inattendue'));
          }
        };
      });
      
      clients[0].postMessage(
        { type: 'REQUEST_AUTH_TOKEN' },
        [messageChannel.port2]
      );
      
      return await tokenPromise;
    }
  } catch (error) {
    console.error('❌ [SW] Erreur récupération token:', error);
  }
  
  console.warn('⚠️ [SW] Aucun token d\'authentification disponible');
  return null;
}

// FONCTIONS INDEXEDDB
function openIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('EasyPosOfflineDB', 1);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function getPendingTransactionsFromDB(db) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(['offlineTransactions'], 'readonly');
    const store = tx.objectStore('offlineTransactions');
    const index = store.index('syncStatus');
    const request = index.getAll('PENDING');
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function updateTransactionStatus(db, tempId, status, error = null) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(['offlineTransactions'], 'readwrite');
    const store = tx.objectStore('offlineTransactions');
    
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

async function notifyMainApp(message) {
  const clients = await self.clients.matchAll();
  clients.forEach(client => {
    client.postMessage(message);
  });
}

// FONCTIONS UTILITAIRES
async function getCacheStatus() {
  const cacheNames = await caches.keys();
  const status = {};
  
  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    status[cacheName] = keys.length;
  }
  
  return status;
}

async function clearAllCaches() {
  const cacheNames = await caches.keys();
  await Promise.all(
    cacheNames.map(cacheName => caches.delete(cacheName))
  );
  console.log('🧹 [SW] Tous les caches supprimés');
}

self.addEventListener('push', (event) => {
  console.log('📱 [SW] Notification push reçue');
  
  if (event.data) {
    const notificationData = event.data.json();
    const options = {
      body: notificationData.body || 'Nouvelle notification EasyPOS',
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: 'easypos-notification',
      requireInteraction: false,
      ...notificationData.options
    };
    
    event.waitUntil(
      self.registration.showNotification(notificationData.title || 'EasyPOS', options)
    );
  }
});

console.log('🚀 [SW] Service Worker EasyPOS chargé et prêt avec Background Sync!');