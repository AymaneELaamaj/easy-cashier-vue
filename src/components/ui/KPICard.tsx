import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  change?: {
    value: number;
    type: 'increase' | 'decrease';
  };
  loading?: boolean;
  className?: string;
}

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  icon: Icon,
  change,
  loading = false,
  className
}) => {
  if (loading) {
    return (
      <Card className={cn('kpi-card', className)}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium shimmer h-4 w-20 rounded" />
          <div className="shimmer h-4 w-4 rounded" />
        </CardHeader>
        <CardContent>
          <div className="shimmer h-8 w-16 rounded mb-2" />
          <div className="shimmer h-3 w-12 rounded" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('kpi-card group', className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </div>
        {change && (
          <p className={cn(
            'text-xs mt-1 flex items-center',
            change.type === 'increase' ? 'text-success' : 'text-destructive'
          )}>
            {change.type === 'increase' ? '+' : '-'}
            {Math.abs(change.value)}%
            <span className="text-muted-foreground ml-1">vs mois dernier</span>
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default KPICard;