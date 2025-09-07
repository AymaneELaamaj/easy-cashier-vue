// src/hooks/useNetworkStatus.ts
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

export const useNetworkStatus = () => {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    isSlowConnection: false,
    connectionType: 'unknown',
    lastOnlineAt: null,
    lastOfflineAt: null,
  });

  // Récupère le token sans toucher au .env
  const getToken = () =>
    localStorage.getItem('authToken') ||
    localStorage.getItem('token') ||
    localStorage.getItem('accessToken') ||
    sessionStorage.getItem('authToken') ||
    sessionStorage.getItem('token') ||
    sessionStorage.getItem('accessToken') ||
    null;

  const testApiConnectivity = useCallback(async (): Promise<boolean> => {
    if (!navigator.onLine) return false;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const token = getToken();
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/pos/health`,
        {
          method: 'GET',
          signal: controller.signal,
          cache: 'no-cache',
          credentials: 'include',
          headers: {
            Accept: 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }
      );

      clearTimeout(timeoutId);
      // Si 401 → on considère "offline auth" pour ne pas casser l’UX
      if (response.status === 401) {
        console.warn('[Network] /pos/health → 401 (token manquant/expiré)');
        return false;
      }
      return response.ok;
    } catch (error) {
      console.log('API connectivity test failed:', error);
      return false;
    }
  }, []);

  const detectConnectionSpeed = useCallback((): { isSlowConnection: boolean; connectionType: string } => {
    // @ts-ignore
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (connection) {
      const effectiveType = connection.effectiveType;
      const isSlowConnection = effectiveType === 'slow-2g' || effectiveType === '2g';
      return { isSlowConnection, connectionType: effectiveType || 'unknown' };
    }
    return { isSlowConnection: false, connectionType: 'unknown' };
  }, []);

  const updateNetworkStatus = useCallback(async (isOnline: boolean) => {
    console.log(`Network status changed: ${isOnline ? 'ONLINE' : 'OFFLINE'}`);
    const apiConnected = isOnline ? await testApiConnectivity() : false;
    const { isSlowConnection, connectionType } = detectConnectionSpeed();

    setNetworkStatus((prev) => ({
      ...prev,
      isOnline: apiConnected,
      isSlowConnection: apiConnected ? isSlowConnection : false,
      connectionType: apiConnected ? connectionType : 'offline',
      lastOnlineAt: apiConnected ? new Date() : prev.lastOnlineAt,
      lastOfflineAt: !apiConnected ? new Date() : prev.lastOfflineAt,
    }));
  }, [testApiConnectivity, detectConnectionSpeed]);

  useEffect(() => {
    updateNetworkStatus(navigator.onLine);

    const handleOnline = () => updateNetworkStatus(true);
    const handleOffline = () => updateNetworkStatus(false);
    const handleNetworkChange = (event: CustomEvent<NetworkEventDetail>) => {
      updateNetworkStatus(event.detail.isOnline);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('networkStatusChange', handleNetworkChange as EventListener);

    const connectivityInterval = setInterval(async () => {
      if (navigator.onLine) {
        const apiConnected = await testApiConnectivity();
        if (apiConnected !== networkStatus.isOnline) {
          updateNetworkStatus(apiConnected);
        }
      }
    }, 30000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('networkStatusChange', handleNetworkChange as EventListener);
      clearInterval(connectivityInterval);
    };
  }, [updateNetworkStatus, networkStatus.isOnline, testApiConnectivity]);

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
    if (diffMinutes < 1) return "À l'instant";
    if (diffMinutes < 60) return `${diffMinutes} min ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}j ago`;
  }, [networkStatus]);

  return {
    ...networkStatus,
    forceRefreshNetworkStatus,
    getConnectionQuality,
    getTimeSinceLastConnection,
    testApiConnectivity,
    canMakeApiCalls: networkStatus.isOnline,
    shouldShowOfflineWarning: !networkStatus.isOnline,
    shouldShowSlowConnectionWarning: networkStatus.isOnline && networkStatus.isSlowConnection,
  };
};

export default useNetworkStatus;
