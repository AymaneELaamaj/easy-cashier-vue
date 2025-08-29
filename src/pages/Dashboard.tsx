import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/services/api/axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { KPICard } from '@/components/ui/KPICard';
import { useAuthContext } from '@/contexts/AuthContext';
import {
  Users,
  Receipt,
  Package,
  TrendingUp,
  Calendar,
  Clock,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

type TransactionRow = {
  id?: number;
  numeroTicket?: string;
  date?: string;             // ISO
  heureTransaction?: string; // "HH:mm:ss"
  montantTotal?: number;
  utilisateurEmail?: string;
};

// ========= Helpers de parsing sûrs =========
const parseApiPage = <T,>(resp: any): { content: T[]; total: number } => {
  // Cas ApiResponse avec "page" (ex: /transactions/historique, /articles/products)
  if (resp?.data?.page) {
    const page = resp.data.page;
    return {
      content: page?.content ?? [],
      total: page?.totalElements ?? 0,
    };
  }
  // Cas Page direct (ex: /utilisateurs?size=1)
  if (resp?.data?.content && typeof resp?.data?.totalElements === 'number') {
    return {
      content: resp.data.content ?? [],
      total: resp.data.totalElements ?? 0,
    };
  }
  // Fallback
  return { content: [], total: 0 };
};

const todayISO = () => format(new Date(), 'yyyy-MM-dd');

// ========= Queries Dashboard =========
const useRecentTransactions = () =>
  useQuery({
    queryKey: ['dashboard', 'recentTransactions'],
    queryFn: async () => {
      const resp = await api.get('/transactions/historique?page=0&size=5');
      const { content } = parseApiPage<TransactionRow>(resp);
      return content;
    },
    staleTime: 60_000,
  });

const useTransactionsTotal = () =>
  useQuery({
    queryKey: ['dashboard', 'transactionsTotal'],
    queryFn: async () => {
      const resp = await api.get('/transactions/historique?page=0&size=1');
      const { total } = parseApiPage<any>(resp);
      return total;
    },
    staleTime: 60_000,
  });

const useUsersTotal = () =>
  useQuery({
    queryKey: ['dashboard', 'usersTotal'],
    queryFn: async () => {
      // Ce contrôleur retourne ResponseEntity<Page<UtilisateurResponse>>
      const resp = await api.get('/utilisateurs?page=0&size=1');
      const { total } = parseApiPage<any>(resp);
      return total;
    },
    staleTime: 120_000,
  });

const useProductsTotal = () =>
  useQuery({
    queryKey: ['dashboard', 'productsTotal'],
    queryFn: async () => {
      // Ce contrôleur retourne ApiResponse avec "page"
      const resp = await api.get('/articles/products?page=0&size=1');
      const { total } = parseApiPage<any>(resp);
      return total;
    },
    staleTime: 120_000,
  });

const useTodayActivity = () =>
  useQuery({
    queryKey: ['dashboard', 'todayActivity', todayISO()],
    queryFn: async () => {
      const d = todayISO();
      // Période jour courant
      const resp = await api.get(
        `/transactions/historique/periode?dateDebut=${d}&dateFin=${d}&page=0&size=5000`
      );
      const { content } = parseApiPage<TransactionRow>(resp);
      const count = content.length;
      const totalAmount = content.reduce((s, t) => s + (t.montantTotal ?? 0), 0);
      return { count, totalAmount, rows: content };
    },
    staleTime: 30_000,
  });

export function Dashboard() {
  const { currentUser, isAdmin } = useAuthContext();

  const recentQ = useRecentTransactions();
  const txTotalQ = useTransactionsTotal();
  const usersTotalQ = useUsersTotal();
  const productsTotalQ = useProductsTotal();
  const todayQ = useTodayActivity();

  const isLoading =
    recentQ.isLoading || txTotalQ.isLoading || usersTotalQ.isLoading || productsTotalQ.isLoading || todayQ.isLoading;

  const recentTransactions = recentQ.data ?? [];
  const totalTransactions = txTotalQ.data ?? 0;
  const totalUsers = usersTotalQ.data ?? 0;
  const totalProducts = productsTotalQ.data ?? 0;
  const todayCount = todayQ.data?.count ?? 0;
  const todayAmount = todayQ.data?.totalAmount ?? 0;

  const handleRefresh = () => {
    recentQ.refetch();
    txTotalQ.refetch();
    usersTotalQ.refetch();
    productsTotalQ.refetch();
    todayQ.refetch();
  };

  const recentUi = useMemo(
    () =>
      recentTransactions.map((t, idx) => {
        const dt = t.date ? new Date(t.date) : null;
        const human =
          dt ? formatDistanceToNow(dt, { addSuffix: true, locale: fr }) : '';
        const montant = (t.montantTotal ?? 0).toLocaleString('fr-FR', {
          style: 'currency',
          currency: 'MAD',
        });
        return {
          id: t.id ?? idx,
          ticket: t.numeroTicket ?? '—',
          user: t.utilisateurEmail ?? '—',
          amount: montant,
          time: human || (t.heureTransaction ?? '—'),
        };
      }),
    [recentTransactions]
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* En-tête */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Tableau de bord</h1>
          <p className="text-muted-foreground">
            Bienvenue, {currentUser?.prenom} {currentUser?.nom}. Voici un aperçu
            de votre activité EasyPOS.
          </p>
        </div>
        <Button variant="outline" onClick={handleRefresh}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Rafraîchir
        </Button>
      </div>

      {/* KPIs Grid (admin) */}
      {isAdmin && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <KPICard
            title="Utilisateurs total"
            value={isLoading ? '—' : totalUsers}
            icon={Users}
            change={{ value: 0, type: 'increase' }} // TODO: brancher un vrai delta si tu ajoutes un endpoint
          />
          <KPICard
            title="Transactions"
            value={isLoading ? '—' : totalTransactions}
            icon={Receipt}
            change={{ value: 0, type: 'increase' }}
          />
          <KPICard
            title="Chiffre d'affaires (aujourd'hui)"
            value={
              isLoading
                ? '—'
                : todayAmount.toLocaleString('fr-FR', { style: 'currency', currency: 'MAD' })
            }
            icon={TrendingUp}
            change={{ value: 0, type: 'increase' }}
          />
          <KPICard
            title="Produits"
            value={isLoading ? '—' : totalProducts}
            icon={Package}
            change={{ value: 0, type: 'increase' }}
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
              {isLoading && <div className="text-sm text-muted-foreground">Chargement…</div>}
              {!isLoading && recentUi.length === 0 && (
                <div className="text-sm text-muted-foreground">Aucune transaction récente</div>
              )}
              {recentUi.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex flex-col">
                    <p className="font-medium">{t.ticket}</p>
                    <p className="text-sm text-muted-foreground">{t.user}</p>
                  </div>
                  <div className="flex flex-col items-end">
                    <p className="font-semibold text-success">{t.amount}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {t.time}
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
            <CardDescription>Informations de votre compte</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Solde actuel</span>
                <span className="font-semibold text-primary">
                  {(currentUser?.solde ?? 0).toLocaleString('fr-FR', {
                    style: 'currency',
                    currency: 'MAD',
                  })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Rôle</span>
                <span className="font-medium">{currentUser?.role}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Catégorie</span>
                <span className="font-medium">
                  {currentUser?.categorieEmployes?.cadre || 'Non définie'}
                </span>
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
            <CardDescription>Résumé des activités d'aujourd'hui</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-success/10 border border-success/20">
                <TrendingUp className="h-8 w-8 text-success" />
                <div>
                  <p className="font-semibold text-lg">{isLoading ? '—' : todayCount}</p>
                  <p className="text-sm text-muted-foreground">Transactions du jour</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-success/10 border border-success/20">
                <TrendingUp className="h-8 w-8 text-success" />
                <div>
                  <p className="font-semibold text-lg">
                    {isLoading
                      ? '—'
                      : todayAmount.toLocaleString('fr-FR', { style: 'currency', currency: 'MAD' })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/10 border border-muted/20">
                <Clock className="h-8 w-8 text-muted-foreground" />
                <div>
                  <p className="font-semibold text-lg">{format(new Date(), 'dd/MM/yyyy')}</p>
                  <p className="text-sm text-muted-foreground">Aujourd'hui</p>
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
