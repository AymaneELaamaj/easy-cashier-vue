import { useState, useEffect, useCallback } from 'react';

export interface NetworkStatus {
  isOnline: boolean;
  isSlowConnection: boolean;
  connectionType: string;
  lastOnlineAt: Date | null;
  lastOfflineAt: Date | null;
}

interface NetworkEventDetail {
  isOnline: boolean;
}

/**
 * Hook pour surveiller l'état de la connexion réseau
 * Détecte online/offline + vitesse de connexion
 */
export const useNetworkStatus = () => {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    isSlowConnection: false,
    connectionType: 'unknown',
    lastOnlineAt: null,
    lastOfflineAt: null,
  });

  // Test de ping vers votre API pour vérifier la connectivité réelle
  const testApiConnectivity = useCallback(async (): Promise<boolean> => {
    if (!navigator.onLine) {
      return false;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/pos/health`, {
        method: 'GET',
        signal: controller.signal,
        cache: 'no-cache',
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      console.log('API connectivity test failed:', error);
      return false;
    }
  }, []);

  // Détecter la vitesse de connexion
  const detectConnectionSpeed = useCallback((): { isSlowConnection: boolean; connectionType: string } => {
    // @ts-ignore - navigator.connection peut ne pas être typé
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    
    if (connection) {
      const effectiveType = connection.effectiveType;
      const isSlowConnection = effectiveType === 'slow-2g' || effectiveType === '2g';
      
      return {
        isSlowConnection,
        connectionType: effectiveType || 'unknown'
      };
    }

    return {
      isSlowConnection: false,
      connectionType: 'unknown'
    };
  }, []);

  // Gérer les changements d'état réseau
  const updateNetworkStatus = useCallback(async (isOnline: boolean) => {
    console.log(`Network status changed: ${isOnline ? 'ONLINE' : 'OFFLINE'}`);
    
    // Test API seulement si navigator.onLine indique online
    const apiConnected = isOnline ? await testApiConnectivity() : false;
    const { isSlowConnection, connectionType } = detectConnectionSpeed();

    setNetworkStatus(prev => ({
      ...prev,
      isOnline: apiConnected,
      isSlowConnection: apiConnected ? isSlowConnection : false,
      connectionType: apiConnected ? connectionType : 'offline',
      lastOnlineAt: apiConnected ? new Date() : prev.lastOnlineAt,
      lastOfflineAt: !apiConnected ? new Date() : prev.lastOfflineAt,
    }));
  }, [testApiConnectivity, detectConnectionSpeed]);

  useEffect(() => {
    // État initial
    updateNetworkStatus(navigator.onLine);

    // Écouter les événements navigateur
    const handleOnline = () => updateNetworkStatus(true);
    const handleOffline = () => updateNetworkStatus(false);

    // Écouter l'événement personnalisé du main.tsx
    const handleNetworkChange = (event: CustomEvent<NetworkEventDetail>) => {
      updateNetworkStatus(event.detail.isOnline);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('networkStatusChange', handleNetworkChange as EventListener);

    // Test périodique de connectivité (toutes les 30 secondes)
    const connectivityInterval = setInterval(async () => {
      if (navigator.onLine) {
        const apiConnected = await testApiConnectivity();
        if (apiConnected !== networkStatus.isOnline) {
          updateNetworkStatus(apiConnected);
        }
      }
    }, 30000);

    // Nettoyage
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('networkStatusChange', handleNetworkChange as EventListener);
      clearInterval(connectivityInterval);
    };
  }, [updateNetworkStatus, networkStatus.isOnline]);

  // Fonctions utilitaires
  const forceRefreshNetworkStatus = useCallback(() => {
    updateNetworkStatus(navigator.onLine);
  }, [updateNetworkStatus]);

  const getConnectionQuality = useCallback((): 'excellent' | 'good' | 'poor' | 'offline' => {
    if (!networkStatus.isOnline) return 'offline';
    if (networkStatus.isSlowConnection) return 'poor';
    if (networkStatus.connectionType.includes('4g') || networkStatus.connectionType.includes('wifi')) return 'excellent';
    return 'good';
  }, [networkStatus]);

  const getTimeSinceLastConnection = useCallback((): string | null => {
    if (networkStatus.isOnline || !networkStatus.lastOfflineAt) return null;

    const now = new Date();
    const diffMs = now.getTime() - networkStatus.lastOfflineAt.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    
    if (diffMinutes < 1) return 'À l\'instant';
    if (diffMinutes < 60) return `${diffMinutes} min ago`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}j ago`;
  }, [networkStatus]);

  return {
    // État principal
    ...networkStatus,
    
    // Fonctions utilitaires
    forceRefreshNetworkStatus,
    getConnectionQuality,
    getTimeSinceLastConnection,
    testApiConnectivity,
    
    // Flags pratiques pour l'UI
    canMakeApiCalls: networkStatus.isOnline,
    shouldShowOfflineWarning: !networkStatus.isOnline,
    shouldShowSlowConnectionWarning: networkStatus.isOnline && networkStatus.isSlowConnection,
  };
};

export default useNetworkStatus;