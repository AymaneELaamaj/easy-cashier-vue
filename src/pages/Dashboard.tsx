import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { KPICard } from '@/components/ui/KPICard';
import { useAuthContext } from '@/contexts/AuthContext';
import { 
  Users, 
  Receipt, 
  Euro, 
  Package, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  Clock
} from 'lucide-react';

export function Dashboard() {
  const { currentUser, isAdmin } = useAuthContext();

  // Données mockées pour les KPIs - à remplacer par de vraies données API
  const kpiData = {
    totalUsers: 145,
    totalTransactions: 2834,
    totalRevenue: 45623.50,
    totalProducts: 89,
    monthlyGrowth: {
      users: 12,
      transactions: 8,
      revenue: 15,
      products: 5
    }
  };

  const recentTransactions = [
    {
      id: 1,
      ticket: 'TK-2024-001',
      user: 'Marie Dubois',
      amount: 25.50,
      time: 'Il y a 5 min',
      status: 'Validé'
    },
    {
      id: 2,
      ticket: 'TK-2024-002',
      user: 'Jean Martin',
      amount: 18.75,
      time: 'Il y a 12 min',
      status: 'Validé'
    },
    {
      id: 3,
      ticket: 'TK-2024-003',
      user: 'Sophie Leroy',
      amount: 42.00,
      time: 'Il y a 18 min',
      status: 'En attente'
    }
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* En-tête */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">
          Tableau de bord
        </h1>
        <p className="text-muted-foreground">
          Bienvenue, {currentUser?.prenom} {currentUser?.nom}. 
          Voici un aperçu de votre activité EasyPOS.
        </p>
      </div>

      {/* KPIs Grid */}
      {isAdmin && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <KPICard
            title="Utilisateurs Total"
            value={kpiData.totalUsers}
            icon={Users}
            change={{
              value: kpiData.monthlyGrowth.users,
              type: 'increase'
            }}
          />
          <KPICard
            title="Transactions"
            value={kpiData.totalTransactions}
            icon={Receipt}
            change={{
              value: kpiData.monthlyGrowth.transactions,
              type: 'increase'
            }}
          />
          <KPICard
            title="Chiffre d'affaires"
            value={`${kpiData.totalRevenue.toLocaleString('fr-FR', { 
              style: 'currency', 
              currency: 'EUR' 
            })}`}
            icon={Euro}
            change={{
              value: kpiData.monthlyGrowth.revenue,
              type: 'increase'
            }}
          />
          <KPICard
            title="Produits"
            value={kpiData.totalProducts}
            icon={Package}
            change={{
              value: kpiData.monthlyGrowth.products,
              type: 'increase'
            }}
          />
        </div>
      )}

      {/* Grille de contenu */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Transactions récentes */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Transactions récentes
            </CardTitle>
            <CardDescription>
              Les dernières transactions effectuées dans le système
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentTransactions.map((transaction) => (
                <div 
                  key={transaction.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex flex-col">
                    <p className="font-medium">{transaction.ticket}</p>
                    <p className="text-sm text-muted-foreground">{transaction.user}</p>
                  </div>
                  <div className="flex flex-col items-end">
                    <p className="font-semibold text-success">
                      {transaction.amount.toLocaleString('fr-FR', { 
                        style: 'currency', 
                        currency: 'EUR' 
                      })}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {transaction.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Statut personnel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Mon profil
            </CardTitle>
            <CardDescription>
              Informations de votre compte
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Solde actuel</span>
                <span className="font-semibold text-primary">
                  {currentUser?.solde?.toLocaleString('fr-FR', { 
                    style: 'currency', 
                    currency: 'EUR' 
                  }) || '0,00€'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Rôle</span>
                <span className="font-medium">{currentUser?.role}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Catégorie</span>
                <span className="font-medium">{currentUser?.cadre || 'Non définie'}</span>
              </div>
            </div>
            
            {currentUser?.badge && (
              <div className="p-3 bg-gradient-primary/10 rounded-lg border border-primary/20">
                <p className="text-sm font-medium text-primary">Badge assigné</p>
                <p className="text-xs text-muted-foreground">{currentUser.badge.codeBadge}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Activité du jour */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Activité du jour
            </CardTitle>
            <CardDescription>
              Résumé des activités d'aujourd'hui
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-success/10 border border-success/20">
                <TrendingUp className="h-8 w-8 text-success" />
                <div>
                  <p className="font-semibold text-lg">67</p>
                  <p className="text-sm text-muted-foreground">Transactions validées</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 rounded-lg bg-warning/10 border border-warning/20">
                <Clock className="h-8 w-8 text-warning" />
                <div>
                  <p className="font-semibold text-lg">5</p>
                  <p className="text-sm text-muted-foreground">En attente</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <TrendingDown className="h-8 w-8 text-destructive" />
                <div>
                  <p className="font-semibold text-lg">2</p>
                  <p className="text-sm text-muted-foreground">Annulées</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default Dashboard;