import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  AlertTriangle, 
  Clock, 
  RefreshCw, 
  Search,
  Filter,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  Download,
  Calendar
} from 'lucide-react';
import { useAlertsDashboard } from '@/hooks/UseAlertsDashboard';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { SecurityAlert } from '@/types/entities';

const Alerts: React.FC = () => {
  const {
    alerts,
    isLoadingAlerts,
    alertsError,
    refreshAlerts,
    resolveAlert,
    isRefreshing
  } = useAlertsDashboard();

  // États locaux pour les filtres
  const [includeResolved, setIncludeResolved] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');

  // Filtrer les alertes selon les critères
  const filteredAlerts = alerts.filter((alert) => {
    // Filtre texte
    if (searchTerm && !alert.message.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !alert.alertType.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }

    // Filtre sévérité
    if (severityFilter !== 'all' && alert.severity !== severityFilter) {
      return false;
    }

    // Filtre type
    if (typeFilter !== 'all' && alert.alertType !== typeFilter) {
      return false;
    }

    // Filtre date
    if (dateFilter !== 'all') {
      const alertDate = new Date(alert.timestamp);
      const now = new Date();
      
      switch (dateFilter) {
        case 'today':
          return alertDate.toDateString() === now.toDateString();
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return alertDate >= weekAgo;
        case 'month':
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          return alertDate >= monthAgo;
        default:
          return true;
      }
    }

    return true;
  });

  const getSeverityBadge = (severity: string) => {
    const variants: Record<string, any> = {
      'CRITICAL': { variant: 'destructive', icon: XCircle, color: 'text-red-600' },
      'HIGH': { variant: 'destructive', icon: AlertTriangle, color: 'text-orange-600' },
      'MEDIUM': { variant: 'default', icon: AlertCircle, color: 'text-yellow-600' },
      'LOW': { variant: 'secondary', icon: Eye, color: 'text-blue-600' }
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
    return format(new Date(timestamp), 'dd/MM/yyyy HH:mm:ss', { locale: fr });
  };

  const getRelativeTime = (timestamp: string) => {
    const now = new Date();
    const alertTime = new Date(timestamp);
    const diffMs = now.getTime() - alertTime.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays > 0) return `il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
    if (diffHours > 0) return `il y a ${diffHours} heure${diffHours > 1 ? 's' : ''}`;
    return 'Il y a moins d\'une heure';
  };

  const getAlertTypeDisplay = (alertType: string) => {
    const types: Record<string, string> = {
      'SUSPICIOUS_TRANSACTION_VOLUME': 'Volume suspect de transactions',
      'LOG_INTEGRITY_VIOLATION': 'Violation intégrité logs',
      'SUBSIDY_LIMIT_EXCEEDED': 'Dépassement subvention',
      'BRUTE_FORCE_DETECTED': 'Attaque brute force',
      'UNAUTHORIZED_ACCESS': 'Accès non autorisé',
      'ACCOUNT_UNDER_ATTACK': 'Compte sous attaque',
      'DISK_SPACE_HIGH': 'Espace disque faible'
    };
    return types[alertType] || alertType;
  };

  const exportAlerts = useCallback(() => {
    const dataStr = JSON.stringify(filteredAlerts, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `security-alerts-${format(new Date(), 'yyyy-MM-dd')}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }, [filteredAlerts]);

  // Obtenir types uniques pour le filtre
  const uniqueTypes = Array.from(new Set(alerts.map(alert => alert.alertType)));
  const uniqueSeverities = Array.from(new Set(alerts.map(alert => alert.severity)));

  return (
    <div className="p-6 space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <AlertTriangle className="h-8 w-8 text-orange-600" />
            Alertes de Sécurité
          </h1>
          <p className="text-muted-foreground">
            Gestion et suivi des alertes de sécurité du système
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            onClick={exportAlerts}
            variant="outline"
            size="sm"
            disabled={filteredAlerts.length === 0}
          >
            <Download className="h-4 w-4 mr-1" />
            Exporter ({filteredAlerts.length})
          </Button>
          
          <Button
            onClick={() => refreshAlerts(includeResolved)}
            disabled={isRefreshing}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600">
              {alerts.filter(a => a.severity === 'CRITICAL' && !a.resolved).length}
            </div>
            <p className="text-sm text-muted-foreground">Critiques</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-orange-600">
              {alerts.filter(a => a.severity === 'HIGH' && !a.resolved).length}
            </div>
            <p className="text-sm text-muted-foreground">Hautes</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {alerts.filter(a => !a.resolved).length}
            </div>
            <p className="text-sm text-muted-foreground">Non résolues</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">
              {alerts.filter(a => a.resolved).length}
            </div>
            <p className="text-sm text-muted-foreground">Résolues</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtres
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Recherche</label>
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                <Input
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Sévérité</label>
              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes</SelectItem>
                  {uniqueSeverities.map(severity => (
                    <SelectItem key={severity} value={severity}>
                      {severity}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Type</label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous types</SelectItem>
                  {uniqueTypes.map(type => (
                    <SelectItem key={type} value={type}>
                      {getAlertTypeDisplay(type)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Période</label>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes périodes</SelectItem>
                  <SelectItem value="today">Aujourd'hui</SelectItem>
                  <SelectItem value="week">Cette semaine</SelectItem>
                  <SelectItem value="month">Ce mois</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">État</label>
              <Button
                onClick={() => {
                  setIncludeResolved(!includeResolved);
                  refreshAlerts(!includeResolved);
                }}
                variant={includeResolved ? "default" : "outline"}
                className="w-full"
              >
                {includeResolved ? "Masquer résolues" : "Inclure résolues"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des alertes */}
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
        ) : filteredAlerts.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <h3 className="text-lg font-medium">Aucune alerte trouvée</h3>
              <p className="text-muted-foreground">
                Aucune alerte ne correspond aux filtres sélectionnés.
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredAlerts.map((alert) => (
            <Card 
              key={alert.id} 
              className={`${alert.resolved ? 'opacity-60 border-l-4 border-l-green-500' : ''} ${
                alert.severity === 'CRITICAL' ? 'border-l-4 border-l-red-500' : 
                alert.severity === 'HIGH' ? 'border-l-4 border-l-orange-500' : ''
              }`}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    {getSeverityBadge(alert.severity)}
                    <div className="space-y-1">
                      <CardTitle className="text-base">
                        {getAlertTypeDisplay(alert.alertType)}
                      </CardTitle>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>{formatTimestamp(alert.timestamp)}</span>
                        <span>•</span>
                        <span>{getRelativeTime(alert.timestamp)}</span>
                        <span>•</span>
                        <span>ID: #{alert.id}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
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
                <p className="text-sm mb-2">{alert.message}</p>
                {alert.resolvedAt && (
                  <div className="text-xs text-muted-foreground bg-green-50 p-2 rounded">
                    <CheckCircle className="h-3 w-3 inline mr-1" />
                    Résolue le {formatTimestamp(alert.resolvedAt)}
                    {alert.resolvedBy && ` par ${alert.resolvedBy}`}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Pagination ou load more si nécessaire */}
      {filteredAlerts.length > 50 && (
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground">
              Affichage des 50 premières alertes. Utilisez les filtres pour affiner votre recherche.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Alerts;