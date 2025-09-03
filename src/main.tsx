import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { indexedDBService } from './services/indexedDBService'; // NOUVEAU IMPORT

// 🔧 ENREGISTREMENT DU SERVICE WORKER
const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      console.log('🔍 Vérification support Service Worker...');
      
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });
      
      console.log('✅ Service Worker enregistré avec succès:', registration);
      
      // Gestion des mises à jour du Service Worker
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        console.log('🔄 Nouvelle version du Service Worker détectée');
        
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('🆕 Service Worker mis à jour et prêt');
              // Optionnel: notifier l'utilisateur qu'une mise à jour est disponible
            }
          });
        }
      });
      
      // Vérifier les mises à jour existantes
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

// NOUVEAU 💾 INITIALISATION INDEXEDDB
const initializeIndexedDB = async () => {
  try {
    console.log('💾 Initialisation IndexedDB...');
    await indexedDBService.init();
    console.log('✅ IndexedDB initialisé avec succès');
    
    // Optionnel : afficher les stats de stockage
    const stats = await indexedDBService.getStorageStats();
    console.log('📊 Statistiques stockage offline:', stats);
    
  } catch (error) {
    console.error('❌ Erreur initialisation IndexedDB:', error);
    // L'app peut continuer sans IndexedDB, mais en mode online uniquement
  }
};

// 📱 VÉRIFICATION SUPPORT PWA
const checkPWACapabilities = () => {
  const capabilities = {
    serviceWorker: 'serviceWorker' in navigator,
    indexedDB: 'indexedDB' in window, // NOUVEAU CHECK
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
    
    // Dispatch d'un événement personnalisé pour notifier l'app
    window.dispatchEvent(new CustomEvent('networkStatusChange', {
      detail: { isOnline }
    }));
  };

  // Écouter les changements de connectivité
  window.addEventListener('online', updateNetworkStatus);
  window.addEventListener('offline', updateNetworkStatus);
  
  // État initial
  updateNetworkStatus();
};

// 🚀 INITIALISATION DE L'APPLICATION - MODIFIÉ
const initializeApp = async () => {
  console.log('🚀 Initialisation EasyPOS...');
  
  // 1. Vérifier les capacités PWA
  const pwaCapabilities = checkPWACapabilities();
  
  // 2. Configurer la détection réseau
  setupNetworkDetection();
  
  // 3. NOUVEAU - Initialiser IndexedDB en premier
  if (pwaCapabilities.indexedDB) {
    await initializeIndexedDB();
  } else {
    console.warn('⚠️ IndexedDB non supporté - Mode offline limité');
  }
  
  // 4. Enregistrer le Service Worker
  if (pwaCapabilities.serviceWorker) {
    await registerServiceWorker();
  }
  
  // 5. Monter l'application React
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
  
  console.log('🎉 EasyPOS initialisé - PWA avec stockage offline prête !'); // MODIFIÉ
};

// 🏁 DÉMARRAGE
initializeApp().catch((error) => {
  console.error('❌ Erreur lors de l\'initialisation:', error);
});