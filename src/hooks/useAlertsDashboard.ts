import { useState, useEffect, useCallback } from 'react';
import { securityApi } from '@/services/api/alerts.api';
import type { SecurityDashboard, SecurityStats, SecurityAlert } from '@/types/entities';
import { toast } from 'sonner';

interface UseAlertsDashboardReturn {
  // État du dashboard
  dashboard: SecurityDashboard | null;
  stats: SecurityStats | null;
  alerts: SecurityAlert[];
  
  // États de chargement
  isLoadingDashboard: boolean;
  isLoadingStats: boolean;
  isLoadingAlerts: boolean;
  
  // États d'erreur
  dashboardError: string | null;
  statsError: string | null;
  alertsError: string | null;
  
  // Actions
  refreshDashboard: () => Promise<void>;
  refreshStats: () => Promise<void>;
  refreshAlerts: (includeResolved?: boolean) => Promise<void>;
  resolveAlert: (alertId: number) => Promise<void>;
  
  // État global
  isRefreshing: boolean;
  lastUpdate: Date | null;
  
  // Métriques utiles
  criticalAlertsCount: number;
  highAlertsCount: number;
  unresolvedCount: number;
  recentAlertsCount: number;
}

export const useAlertsDashboard = (autoRefresh = true, refreshInterval = 30000): UseAlertsDashboardReturn => {

  // États principaux
  const [dashboard, setDashboard] = useState<SecurityDashboard | null>(null);
  const [stats, setStats] = useState<SecurityStats | null>(null);
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  
  // États de chargement
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(false);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [isLoadingAlerts, setIsLoadingAlerts] = useState(false);
  
  // États d'erreur
  const [dashboardError, setDashboardError] = useState<string | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [alertsError, setAlertsError] = useState<string | null>(null);
  
  // États utilitaires
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [includeResolvedAlerts, setIncludeResolvedAlerts] = useState(false);

  // Charger le dashboard
  const refreshDashboard = useCallback(async () => {
    setIsLoadingDashboard(true);
    setDashboardError(null);
    
    try {
      const data = await securityApi.getDashboard();
      setDashboard(data);
      setLastUpdate(new Date());
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Erreur lors du chargement du dashboard';
      setDashboardError(errorMessage);
      console.error('Erreur dashboard sécurité:', error);
    } finally {
      setIsLoadingDashboard(false);
    }
  }, []);

  // Charger les statistiques
  const refreshStats = useCallback(async () => {
    setIsLoadingStats(true);
    setStatsError(null);
    
    try {
      const data = await securityApi.getStats();
      setStats(data);
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Erreur lors du chargement des statistiques';
      setStatsError(errorMessage);
      console.error('Erreur stats sécurité:', error);
    } finally {
      setIsLoadingStats(false);
    }
  }, []);

  // Charger les alertes
  const refreshAlerts = useCallback(async (includeResolved = false) => {
    setIsLoadingAlerts(true);
    setAlertsError(null);
    setIncludeResolvedAlerts(includeResolved);
    
    try {
      const data = await securityApi.getAlerts(includeResolved);
      setAlerts(data);
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Erreur lors du chargement des alertes';
      setAlertsError(errorMessage);
      console.error('Erreur alertes sécurité:', error);
    } finally {
      setIsLoadingAlerts(false);
    }
  }, []);

  // Résoudre une alerte
  const resolveAlert = useCallback(async (alertId: number) => {
    try {
      await securityApi.resolveAlert(alertId);
      
      // Mettre à jour localement
      setAlerts(prevAlerts => 
        prevAlerts.map(alert => 
          alert.id === alertId 
            ? { ...alert, resolved: true, resolvedAt: new Date().toISOString() }
            : alert
        )
      );
      
      // Rafraîchir le dashboard
      await refreshDashboard();
      
      toast.success('Alerte résolue avec succès');
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Erreur lors de la résolution de l\'alerte';
      toast.error(errorMessage);
      console.error('Erreur résolution alerte:', error);
    }
  }, [refreshDashboard]);

  // Rafraîchir toutes les données
  const refreshAll = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        refreshDashboard(),
        refreshStats(),
        refreshAlerts(includeResolvedAlerts)
      ]);
    } finally {
      setIsRefreshing(false);
    }
  }, [refreshDashboard, refreshStats, refreshAlerts, includeResolvedAlerts]);

  // Chargement initial
  useEffect(() => {
    refreshAll();
  }, []);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      refreshAll();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, refreshAll]);

  // Calculer les métriques dérivées
  const derivedMetrics = {
    criticalAlertsCount: alerts.filter(a => a.severity === 'CRITICAL' && !a.resolved).length,
    highAlertsCount: alerts.filter(a => a.severity === 'HIGH' && !a.resolved).length,
    unresolvedCount: alerts.filter(a => !a.resolved).length,
    recentAlertsCount: alerts.filter(a => {
      const alertTime = new Date(a.timestamp);
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);
      return alertTime > oneDayAgo && !a.resolved;
    }).length
  };

  return {
    // Données
    dashboard,
    stats,
    alerts,
    
    // États de chargement
    isLoadingDashboard,
    isLoadingStats,
    isLoadingAlerts,
    
    // États d'erreur
    dashboardError,
    statsError,
    alertsError,
    
    // Actions
    refreshDashboard,
    refreshStats,
    refreshAlerts,
    resolveAlert,
    
    // État global
    isRefreshing,
    lastUpdate,
    
    // Métriques utiles (ajout explicite des propriétés manquantes)
    criticalAlertsCount: derivedMetrics.criticalAlertsCount,
    highAlertsCount: derivedMetrics.highAlertsCount,
    unresolvedCount: derivedMetrics.unresolvedCount,
    recentAlertsCount: derivedMetrics.recentAlertsCount
  };
};