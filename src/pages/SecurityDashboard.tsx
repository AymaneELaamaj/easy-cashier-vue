import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { 
  Shield, 
  AlertTriangle, 
  Clock, 
  RefreshCw, 
  Search,
  BarChart3,
  FileText,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
  Activity
} from 'lucide-react';
import { useAlertsDashboard } from '@/hooks/UseAlertsDashboard';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const SecurityDashboard: React.FC = () => {
  const {
    dashboard,
    stats,
    alerts,
    isLoadingDashboard,
    isLoadingStats,
    isLoadingAlerts,
    dashboardError,
    statsError,
    alertsError,
    refreshDashboard,
    refreshAlerts,
    resolveAlert,
    isRefreshing,
    lastUpdate,
    criticalAlertsCount,
    highAlertsCount,
    unresolvedCount
  } = useAlertsDashboard();

  const [includeResolved, setIncludeResolved] = useState(false);

  const getSeverityBadge = (severity: string) => {
    const variants: Record<string, any> = {
      'CRITICAL': { variant: 'destructive', icon: XCircle },
      'HIGH': { variant: 'destructive', icon: AlertTriangle },
      'MEDIUM': { variant: 'default', icon: AlertCircle },
      'LOW': { variant: 'secondary', icon: Eye }
    };

    const config = variants[severity] || variants['LOW'];
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {severity}
      </Badge>
    );
  };

  const formatTimestamp = (timestamp: string) => {
    return format(new Date(timestamp), 'dd/MM/yyyy HH:mm', { locale: fr });
  };

  const getAlertTypeDisplay = (alertType: string) => {
    const types: Record<string, string> = {
      'SUSPICIOUS_TRANSACTION_VOLUME': 'Volume suspect de transactions',
      'LOG_INTEGRITY_VIOLATION': 'Violation intégrité logs',
      'SUBSIDY_LIMIT_EXCEEDED': 'Dépassement subvention',
      'BRUTE_FORCE_DETECTED': 'Attaque brute force',
      'UNAUTHORIZED_ACCESS': 'Accès non autorisé'
    };
    return types[alertType] || alertType;
  };

  if (dashboardError) {
    return (
      <Alert className="m-6">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Erreur lors du chargement du dashboard de sécurité: {dashboardError}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            Dashboard de Sécurité
          </h1>
          <p className="text-muted-foreground">
            Surveillance et analyse des événements de sécurité
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {lastUpdate && (
            <span className="text-sm text-muted-foreground">
              Dernière mise à jour: {formatTimestamp(lastUpdate.toISOString())}
            </span>
          )}
          <Button
            onClick={refreshDashboard}
            disabled={isRefreshing}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Cartes de synthèse */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alertes Actives</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoadingDashboard ? '...' : dashboard?.totalAlerts || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {unresolvedCount} non résolues
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critiques</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {isLoadingDashboard ? '...' : criticalAlertsCount || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Nécessitent attention immédiate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hautes</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {isLoadingDashboard ? '...' : highAlertsCount || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Priorité élevée
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cette semaine</CardTitle>
            <Activity className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoadingStats ? '...' : stats?.weekAlerts || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              7 derniers jours
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Contenu principal */}
      <Tabs defaultValue="alerts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="alerts">Alertes</TabsTrigger>
          <TabsTrigger value="statistics">Statistiques</TabsTrigger>
          <TabsTrigger value="investigation">Investigation</TabsTrigger>
        </TabsList>

        {/* Onglet Alertes */}
        <TabsContent value="alerts" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Alertes de Sécurité</h2>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => {
                  setIncludeResolved(!includeResolved);
                  refreshAlerts(!includeResolved);
                }}
                variant={includeResolved ? "default" : "outline"}
                size="sm"
              >
                {includeResolved ? "Masquer résolues" : "Inclure résolues"}
              </Button>
            </div>
          </div>

          {alertsError && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{alertsError}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-3">
            {isLoadingAlerts ? (
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-center">
                    <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                    Chargement des alertes...
                  </div>
                </CardContent>
              </Card>
            ) : alerts.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
                  <h3 className="text-lg font-medium">Aucune alerte</h3>
                  <p className="text-muted-foreground">
                    Système sécurisé, aucune alerte en cours.
                  </p>
                </CardContent>
              </Card>
            ) : (
              alerts.map((alert) => (
                <Card key={alert.id} className={alert.resolved ? 'opacity-60' : ''}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getSeverityBadge(alert.severity)}
                        <CardTitle className="text-base">
                          {getAlertTypeDisplay(alert.alertType)}
                        </CardTitle>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          {formatTimestamp(alert.timestamp)}
                        </span>
                        {!alert.resolved && (
                          <Button
                            onClick={() => resolveAlert(alert.id)}
                            size="sm"
                            variant="outline"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Résoudre
                          </Button>
                        )}
                        {alert.resolved && (
                          <Badge variant="outline" className="text-green-600">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Résolue
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{alert.message}</p>
                    {alert.resolvedAt && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Résolue le {formatTimestamp(alert.resolvedAt)}
                        {alert.resolvedBy && ` par ${alert.resolvedBy}`}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Onglet Statistiques */}
        <TabsContent value="statistics" className="space-y-4">
          <h2 className="text-xl font-semibold">Statistiques de Sécurité</h2>
          
          {statsError && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{statsError}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Répartition par sévérité */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Répartition par Sévérité
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingStats ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-3">
                    {stats?.alertsBySeverity && Object.entries(stats.alertsBySeverity).map(([severity, count]) => (
                      <div key={severity} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>{severity}</span>
                          <span>{count}</span>
                        </div>
                        <Progress 
                          value={(count / Math.max(...Object.values(stats.alertsBySeverity))) * 100} 
                          className="h-2" 
                        />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Répartition par type */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Types d'Alertes
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingStats ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-2">
                    {stats?.alertsByType && Object.entries(stats.alertsByType).map(([type, count]) => (
                      <div key={type} className="flex justify-between text-sm">
                        <span className="truncate">{getAlertTypeDisplay(type)}</span>
                        <span className="font-medium">{count}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Onglet Investigation */}
        <TabsContent value="investigation" className="space-y-4">
          <h2 className="text-xl font-semibold">Outils d'Investigation</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Search className="h-5 w-5" />
                  Recherche dans les Logs
                </CardTitle>
                <CardDescription>
                  Recherche avancée avec filtres personnalisés
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" variant="outline">
                  Ouvrir la recherche
                </Button>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Activity className="h-5 w-5" />
                  Timeline Utilisateur
                </CardTitle>
                <CardDescription>
                  Reconstitution d'activité par utilisateur
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" variant="outline">
                  Analyser utilisateur
                </Button>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <AlertTriangle className="h-5 w-5" />
                  Détection d'Anomalies
                </CardTitle>
                <CardDescription>
                  Identification automatique de patterns suspects
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" variant="outline">
                  Détecter anomalies
                </Button>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileText className="h-5 w-5" />
                  Rapport d'Incident
                </CardTitle>
                <CardDescription>
                  Génération de rapports d'investigation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" variant="outline">
                  Créer rapport
                </Button>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Shield className="h-5 w-5" />
                  Intégrité des Logs
                </CardTitle>
                <CardDescription>
                  Vérification cryptographique des logs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" variant="outline">
                  Vérifier intégrité
                </Button>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <BarChart3 className="h-5 w-5" />
                  Statistiques Avancées
                </CardTitle>
                <CardDescription>
                  Analyse approfondie des tendances
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" variant="outline">
                  Analyser tendances
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SecurityDashboard;