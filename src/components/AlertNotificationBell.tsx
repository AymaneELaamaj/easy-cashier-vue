import React, { useState } from 'react';
import { Bell, AlertTriangle, XCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAlertsDashboard } from '@/hooks/UseAlertsDashboard';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export const AlertNotificationBell: React.FC = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  
  const {
    alerts,
    resolveAlert,
    criticalAlertsCount,
    highAlertsCount,
    unresolvedCount
  } = useAlertsDashboard();

  // Prendre seulement les 5 alertes les plus récentes non résolues
  const recentUnresolvedAlerts = alerts
    .filter(alert => !alert.resolved)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 5);

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'HIGH':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'MEDIUM':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-blue-500" />;
    }
  };

  const getAlertTypeDisplay = (alertType: string) => {
    const types: Record<string, string> = {
      'SUSPICIOUS_TRANSACTION_VOLUME': 'Volume suspect',
      'LOG_INTEGRITY_VIOLATION': 'Violation logs',
      'SUBSIDY_LIMIT_EXCEEDED': 'Subvention dépassée',
      'BRUTE_FORCE_DETECTED': 'Brute force',
      'UNAUTHORIZED_ACCESS': 'Accès non autorisé'
    };
    return types[alertType] || alertType;
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const alertTime = new Date(timestamp);
    const diffMs = now.getTime() - alertTime.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays > 0) return `${diffDays}j`;
    if (diffHours > 0) return `${diffHours}h`;
    if (diffMinutes > 0) return `${diffMinutes}min`;
    return 'Maintenant';
  };

  const hasUrgentAlerts = criticalAlertsCount > 0 || highAlertsCount > 0;

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="relative p-2"
        >
          <Bell 
            className={cn(
              "h-5 w-5",
              hasUrgentAlerts ? "text-red-500 animate-pulse" : "text-gray-600"
            )}
          />
          {unresolvedCount > 0 && (
            <Badge 
              variant={hasUrgentAlerts ? "destructive" : "secondary"}
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unresolvedCount > 99 ? '99+' : unresolvedCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>
          <div className="flex items-center justify-between">
            <h4 className="font-semibold">Alertes de Sécurité</h4>
            {unresolvedCount > 0 && (
              <Badge variant={hasUrgentAlerts ? "destructive" : "secondary"}>
                {unresolvedCount} non résolue{unresolvedCount > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {recentUnresolvedAlerts.length === 0 ? (
          <DropdownMenuItem className="text-center py-4 text-muted-foreground">
            Aucune alerte active
          </DropdownMenuItem>
        ) : (
          <>
            {recentUnresolvedAlerts.map((alert) => (
              <DropdownMenuItem
                key={alert.id}
                className="flex flex-col items-start p-3 cursor-pointer hover:bg-muted"
                onClick={() => {
                  setIsOpen(false);
                  navigate('/security/alerts');
                }}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    {getSeverityIcon(alert.severity)}
                    <span className="font-medium text-sm">
                      {getAlertTypeDisplay(alert.alertType)}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatTimeAgo(alert.timestamp)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1 truncate w-full">
                  {alert.message}
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-2 h-6 text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    resolveAlert(alert.id);
                  }}
                >
                  Résoudre
                </Button>
              </DropdownMenuItem>
            ))}

            {unresolvedCount > recentUnresolvedAlerts.length && (
              <DropdownMenuSeparator />
            )}

            <DropdownMenuItem
              className="text-center py-2 text-sm font-medium text-primary cursor-pointer"
              onClick={() => {
                setIsOpen(false);
                navigate('/security/alerts');
              }}
            >
              {unresolvedCount > recentUnresolvedAlerts.length 
                ? `Voir toutes les ${unresolvedCount} alertes`
                : 'Voir toutes les alertes'
              }
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              className="text-center py-2 text-sm font-medium cursor-pointer"
              onClick={() => {
                setIsOpen(false);
                navigate('/security/dashboard');
              }}
            >
              Dashboard de Sécurité
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};