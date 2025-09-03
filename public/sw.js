// Service Worker EasyPOS - Version 1.0.0
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
  `${API_BASE_URL}/utilisateurs/account`  // AJOUTÉ pour éviter erreur auth offline
];

// 🚀 INSTALLATION DU SERVICE WORKER
self.addEventListener('install', (event) => {
  console.log('🔧 [SW] Installation démarrée...');
  
  event.waitUntil(
    Promise.all([
      // Cache des ressources statiques critiques
      caches.open(STATIC_CACHE).then((cache) => {
        console.log('📦 [SW] Mise en cache des ressources critiques');
        return cache.addAll(CRITICAL_RESOURCES);
      })
    ]).then(() => {
      console.log('✅ [SW] Installation terminée avec succès');
      // Force l'activation immédiate
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
      // Nettoyage des anciens caches
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
      // Prise de contrôle immédiate
      self.clients.claim()
    ]).then(() => {
      console.log('✅ [SW] Activation terminée - Service Worker actif');
    }).catch((error) => {
      console.error('❌ [SW] Erreur lors de l\'activation:', error);
    })
  );
});

// 🌐 INTERCEPTION DES REQUÊTES
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  
  // Ignorer les requêtes non-HTTP
  if (!request.url.startsWith('http')) {
    return;
  }

  // Stratégie selon le type de requête
  if (url.pathname.startsWith('/api/')) {
    // Requêtes API
    event.respondWith(handleApiRequest(request));
  } else if (request.destination === 'image') {
    // Images
    event.respondWith(handleImageRequest(request));
  } else if (request.destination === 'document' || 
             url.pathname.endsWith('.html') || 
             APP_ROUTES.includes(url.pathname)) {
    // Pages/routes de l'application
    event.respondWith(handlePageRequest(request));
  } else {
    // Ressources statiques (JS, CSS, etc.)
    event.respondWith(handleStaticRequest(request));
  }
});

// 📡 GESTION DES REQUÊTES API - Network First avec cache fallback
async function handleApiRequest(request) {
  const url = new URL(request.url);
  console.log('📡 [SW] Requête API:', url.pathname);

  try {
    // Tentative réseau d'abord - TOUJOURS essayer le réseau
    const networkResponse = await fetch(request);
    
    console.log(`📡 [SW] Réponse réseau pour ${url.pathname}:`, networkResponse.status);
    
    if (networkResponse.ok) {
      // Mettre en cache les réponses réussies
      const cache = await caches.open(API_CACHE);
      
      // Cloner pour le cache (la réponse ne peut être lue qu'une fois)
      const responseToCache = networkResponse.clone();
      
      // Cache seulement les GET et les endpoints critiques
      if (request.method === 'GET' && isCriticalEndpoint(url.pathname)) {
        await cache.put(request, responseToCache);
        console.log('💾 [SW] API mise en cache:', url.pathname);
      }
      
      return networkResponse;
    } else {
      // Si le serveur retourne une erreur (401, 404, 500, etc.)
      // on DOIT laisser cette erreur passer à l'application
      console.log(`⚠️ [SW] Erreur serveur ${networkResponse.status} pour ${url.pathname} - transmission à l'app`);
      return networkResponse; // MODIFIÉ : Retourner la réponse d'erreur au lieu de throw
    }
  } catch (error) {
    console.log('🔄 [SW] Réseau complètement échoué pour:', url.pathname, error);
    
    // Fallback vers le cache seulement si le réseau est complètement inaccessible
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      console.log('📦 [SW] Réponse servie depuis le cache:', url.pathname);
      return cachedResponse;
    }
    
    // Si c'est le health check, retourner une réponse offline
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
    
    console.error('❌ [SW] Pas de cache disponible pour:', url.pathname);
    // MODIFIÉ : Re-throw l'erreur pour que l'app la gère
    throw error;
  }
}

// 🖼️ GESTION DES IMAGES - Cache First avec network fallback
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
    // Retourner une image placeholder en cas d'échec
    return new Response('', { status: 404 });
  }
}

// 📄 GESTION DES PAGES - Network First avec cache fallback
async function handlePageRequest(request) {
  const url = new URL(request.url);
  console.log('📄 [SW] Requête page:', url.pathname);
  
  try {
    // TOUJOURS essayer le réseau d'abord
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      console.log('🌐 [SW] Page servie depuis le réseau:', url.pathname);
      
      // Mettre en cache la réponse réussie
      const cache = await caches.open(STATIC_CACHE);
      
      // Pour les routes React, cacher sous '/'
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
    
    // Fallback vers le cache seulement si le réseau échoue
    let cachedResponse;
    
    // Pour les routes React, chercher index.html
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
    
    // Page fallback offline en dernier recours
    console.log('🚫 [SW] Aucune page en cache, affichage page offline');
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
          console.log('📱 Page offline chargée');
          
          // Fonction de reconnexion améliorée
          const attemptReconnection = async () => {
            console.log('🔄 Tentative de reconnexion...');
            
            try {
              // Test direct de votre API
              const healthResponse = await fetch('http://localhost:8080/api/pos/health', {
                method: 'GET',
                cache: 'no-cache',
                signal: AbortSignal.timeout(5000)
              });
              
              if (healthResponse.ok) {
                console.log('✅ API accessible - redirection...');
                // Forcer le rechargement sans cache
                window.location.href = window.location.href + '?t=' + Date.now();
                return true;
              }
            } catch (error) {
              console.log('❌ API encore inaccessible:', error.message);
            }
            
            return false;
          };
          
          // Vérification immédiate
          attemptReconnection();
          
          // Vérification périodique toutes les 3 secondes
          const reconnectInterval = setInterval(attemptReconnection, 3000);
          
          // Écouter l'événement online + test immédiat
          window.addEventListener('online', () => {
            console.log('🔌 Event online détecté');
            setTimeout(attemptReconnection, 500);
          });
          
          // Nettoyage
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

// 📦 GESTION DES RESSOURCES STATIQUES - Cache First
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

// 🎯 VÉRIFIER SI L'ENDPOINT EST CRITIQUE
function isCriticalEndpoint(pathname) {
  const criticalPaths = [
    '/articles/products',
    '/pos/health',
    '/utilisateurs/badge',
    '/utilisateurs/account'  // AJOUTÉ pour cache auth
  ];
  
  return criticalPaths.some(path => pathname.includes(path));
}

// 📨 GESTION DES MESSAGES (pour communication avec l'app)
self.addEventListener('message', (event) => {
  const { type, payload } = event.data;
  
  switch (type) {
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

// 📊 OBTENIR LE STATUT DES CACHES
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

// 🗑️ NETTOYER TOUS LES CACHES
async function clearAllCaches() {
  const cacheNames = await caches.keys();
  await Promise.all(
    cacheNames.map(cacheName => caches.delete(cacheName))
  );
  console.log('🧹 [SW] Tous les caches supprimés');
}

// 🔄 SYNC DES DONNÉES OFFLINE (préparation future)
self.addEventListener('sync', (event) => {
  console.log('🔄 [SW] Background sync déclenché:', event.tag);
  
  if (event.tag === 'sync-offline-transactions') {
    event.waitUntil(syncOfflineTransactions());
  }
});

// 📤 SYNCHRONISATION DES TRANSACTIONS OFFLINE (squelette pour phase 4)
async function syncOfflineTransactions() {
  console.log('📤 [SW] Début sync des transactions offline...');
  
  try {
    // TODO: Implémenter la synchronisation des transactions stockées offline
    // Cette fonction sera développée dans la Phase 4
    console.log('ℹ️ [SW] Sync des transactions - à implémenter en Phase 4');
    return true;
  } catch (error) {
    console.error('❌ [SW] Erreur sync transactions:', error);
    throw error;
  }
}

// 📱 GESTION DES NOTIFICATIONS PUSH (préparation future)
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

console.log('🚀 [SW] Service Worker EasyPOS chargé et prêt !');