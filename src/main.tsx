import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { indexedDBService } from './services/indexedDBService';

// 🔧 ENREGISTREMENT DU SERVICE WORKER
const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      console.log('🔍 Vérification support Service Worker...');
      
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });
      
      console.log('✅ Service Worker enregistré avec succès:', registration);
      
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        console.log('🔄 Nouvelle version du Service Worker détectée');
        
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('🆕 Service Worker mis à jour et prêt');
            }
          });
        }
      });
      
      if (registration.waiting) {
        console.log('⏳ Service Worker en attente d\'activation');
      }
      
      if (registration.active) {
        console.log('🎯 Service Worker actif');
      }
      
      return registration;
    } catch (error) {
      console.error('❌ Erreur enregistrement Service Worker:', error);
    }
  } else {
    console.warn('⚠️ Service Worker non supporté par ce navigateur');
  }
};

// 💾 INITIALISATION INDEXEDDB
// 💾 INITIALISATION INDEXEDDB AVEC DIAGNOSTIC COMPLET
const initializeIndexedDB = async () => {
  try {
    console.log('💾 Initialisation IndexedDB...');
    console.log('💾 Navigateur supporté:', 'indexedDB' in window);
    console.log('💾 Service disponible:', !!indexedDBService);
    
    // Test direct d'ouverture
   // Test direct d'ouverture - VERSION CORRIGÉE
console.log('💾 Test ouverture directe...');
const testOpen = indexedDB.open('TestDB');
testOpen.onsuccess = () => {
  console.log('💾 Test ouverture: OK');
  (testOpen.result as IDBDatabase).close();  // ← Cast TypeScript
};
testOpen.onerror = () => {  // ← Simplifié
  console.error('💾 Test ouverture: FAILED', testOpen.error);
};
    
    // Initialisation du service
    console.log('💾 Appel indexedDBService.init()...');
    await indexedDBService.init();
    console.log('✅ IndexedDB initialisé avec succès');
    
    // Vérification immédiate
    console.log('💾 Vérification des tables...');
    const verifyDB = indexedDB.open('EasyPosOfflineDB');
    verifyDB.onsuccess = () => {
      const db = verifyDB.result;
      const stores = Array.from(db.objectStoreNames);
      console.log('💾 Tables créées:', stores);
      if (stores.length === 0) {
        console.error('❌ PROBLÈME: Aucune table créée !');
      }
      db.close();
    };
    
    const stats = await indexedDBService.getStorageStats();
    console.log('📊 Statistiques stockage offline:', stats);
    
  } catch (error) {
    console.error('❌ Erreur initialisation IndexedDB:', error);
    console.error('❌ Type d\'erreur:', error.constructor.name);
    console.error('❌ Message:', error.message);
    console.error('❌ Stack:', error.stack);
    
    // Force la création manuelle
    console.log('🔧 Tentative de création manuelle...');
    return forceCreateIndexedDB();
  }
};

// Fonction de création manuelle de secours
// Fonction de création manuelle de secours - VERSION CORRIGÉE
const forceCreateIndexedDB = (): Promise<void> => {  // ← Ajout du type de retour
  return new Promise<void>((resolve, reject) => {    // ← Ajout du type générique
    console.log('🔧 Création manuelle d\'IndexedDB...');
    const request = indexedDB.open('EasyPosOfflineDB', 1);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;  // ← Cast TypeScript
      console.log('🔧 Event onupgradeneeded déclenché');
      
      if (!db.objectStoreNames.contains('offlineTransactions')) {
        const txStore = db.createObjectStore('offlineTransactions', { keyPath: 'tempId' });
        txStore.createIndex('syncStatus', 'syncStatus');
        txStore.createIndex('createdOfflineAt', 'createdOfflineAt');
        console.log('🔧 Table offlineTransactions créée');
      }
      
      if (!db.objectStoreNames.contains('articles')) {
        db.createObjectStore('articles', { keyPath: 'id' });
        console.log('🔧 Table articles créée');
      }
      
      if (!db.objectStoreNames.contains('users')) {
        const userStore = db.createObjectStore('users', { keyPath: 'id' });
        userStore.createIndex('codeBadge', 'codeBadge', { unique: true });
        console.log('🔧 Table users créée');
      }
    };
    
    request.onsuccess = () => {
      console.log('🔧 Création manuelle réussie');
      (request.result as IDBDatabase).close();  // ← Cast TypeScript
      resolve();  // ← Maintenant valide car Promise<void>
    };
    
    request.onerror = () => {  // ← Simplifié
      console.error('🔧 Création manuelle échouée:', request.error);
      reject(request.error);
    };
  });
};
// 📱 VÉRIFICATION SUPPORT PWA
const checkPWACapabilities = () => {
  const capabilities = {
    serviceWorker: 'serviceWorker' in navigator,
    indexedDB: 'indexedDB' in window,
    pushNotifications: 'PushManager' in window,
    backgroundSync: 'serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype,
    installPrompt: 'BeforeInstallPromptEvent' in window || 
                   ('standalone' in navigator) || 
                   window.matchMedia('(display-mode: standalone)').matches
  };
  
  console.log('📊 Capacités PWA détectées:', capabilities);
  
  if (import.meta.env.VITE_DEBUG === 'true') {
    console.table(capabilities);
  }
  
  return capabilities;
};

// 🌐 DÉTECTION DE L'ÉTAT RÉSEAU
const setupNetworkDetection = () => {
  const updateNetworkStatus = () => {
    const isOnline = navigator.onLine;
    console.log(`🌐 État réseau: ${isOnline ? 'EN LIGNE' : 'HORS LIGNE'}`);
    
    window.dispatchEvent(new CustomEvent('networkStatusChange', {
      detail: { isOnline }
    }));
  };

  window.addEventListener('online', updateNetworkStatus);
  window.addEventListener('offline', updateNetworkStatus);
  
  updateNetworkStatus();
};

// 📡 COMMUNICATION AVEC LE SERVICE WORKER
const setupServiceWorkerCommunication = () => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', (event) => {
      const { type, payload } = event.data;
      
      switch (type) {
        case 'REQUEST_AUTH_TOKEN':
          // Le SW demande le token d'auth
          const token = localStorage.getItem('authToken') || 
                        localStorage.getItem('token') || 
                        localStorage.getItem('accessToken');
          
          // Répondre avec le token
          event.ports[0].postMessage({
            type: 'AUTH_TOKEN_RESPONSE',
            token: token
          });
          
          console.log('📡 Token d\'auth envoyé au Service Worker');
          break;
          
        case 'SYNC_COMPLETE':
          // Synchronisation terminée
          console.log('🔄 Sync terminée depuis SW:', payload);
          
          // Dispatch un événement personnalisé pour l'application
          window.dispatchEvent(new CustomEvent('swSyncComplete', {
            detail: payload
          }));
          break;
          
        case 'SYNC_ERROR':
          console.error('❌ Erreur sync depuis SW:', payload);
          
          window.dispatchEvent(new CustomEvent('swSyncError', {
            detail: payload
          }));
          break;
          
        default:
          console.log('Message SW non géré:', type);
      }
    });
  }
};

// 🚀 INITIALISATION DE L'APPLICATION
const initializeApp = async () => {
  console.log('🚀 Initialisation EasyPOS...');
  
  // 1. Vérifier les capacités PWA
  const pwaCapabilities = checkPWACapabilities();
  
  // 2. Configurer la détection réseau
  setupNetworkDetection();
  
  // 3. Initialiser IndexedDB en premier
  if (pwaCapabilities.indexedDB) {
    await initializeIndexedDB();
  } else {
    console.warn('⚠️ IndexedDB non supporté - Mode offline limité');
  }
  
  // 4. Enregistrer le Service Worker
  if (pwaCapabilities.serviceWorker) {
    await registerServiceWorker();
  }
  
  // 5. NOUVEAU : Configurer la communication avec le Service Worker
  setupServiceWorkerCommunication();
  
  // 6. Monter l'application React
  const rootElement = document.getElementById('root');
  if (rootElement) {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    console.log('✅ Application React montée avec succès');
  } else {
    console.error('❌ Élément root non trouvé');
  }
  
  console.log('🎉 EasyPOS initialisé - PWA avec Background Sync prête !');
};

// 🏁 DÉMARRAGE
initializeApp().catch((error) => {
  console.error('❌ Erreur lors de l\'initialisation:', error);
});