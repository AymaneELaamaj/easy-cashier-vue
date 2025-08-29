import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/DataTable';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useTransactions, useTransactionsPeriode } from '@/hooks/useTransactions';
import { TransactionDTO } from '@/types/entities';
import { Search, Receipt, CreditCard, TrendingUp, Calendar, RefreshCw, Filter, X } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

export function Transactions() {
  // --------- états UI ---------
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // filtre période
  const [dateDebut, setDateDebut] = useState<string>('');
  const [dateFin, setDateFin] = useState<string>('');
  const usePeriod = Boolean(dateDebut && dateFin);

  // annulation
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionDTO | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [motif, setMotif] = useState('');

  // --------- data hooks ---------
  const {
    transactions: allTransactions,
    isLoading: isLoadingAll,
    error: errorAll,
    cancelTransaction,
    isCancelling,
    refetch: refetchAll,
  } = useTransactions();

  const periodeQuery = useTransactionsPeriode(dateDebut || undefined, dateFin || undefined);
  const periodeTransactions = periodeQuery.data ?? [];
  const isLoadingPeriode = periodeQuery.isLoading;
  const errorPeriode = periodeQuery.error as any | undefined;

  const isLoading = usePeriod ? isLoadingPeriode : isLoadingAll;
  const error = usePeriod ? errorPeriode : errorAll;

  // dataset actif (période si 2 dates, sinon tout)
  const baseTransactions = usePeriod ? periodeTransactions : allTransactions;

  // --------- handlers ---------
  const handleOpenCancel = (t: TransactionDTO) => {
    setSelectedTransaction(t);
    setMotif('');
    setShowCancelModal(true);
  };

  const handleConfirmCancel = async () => {
    if (!selectedTransaction) return;
    await cancelTransaction({ id: selectedTransaction.id!, motif: motif?.trim() || undefined });
    setShowCancelModal(false);
    setSelectedTransaction(null);
    // rafraîchir la bonne source
    if (usePeriod) {
      periodeQuery.refetch();
    } else {
      refetchAll();
    }
  };

  const handleResetPeriod = () => {
    setDateDebut('');
    setDateFin('');
  };

  const handleRefresh = () => {
    if (usePeriod) {
      periodeQuery.refetch();
    } else {
      refetchAll();
    }
  };

  // --------- helpers UI ---------
  const getPaymentTypeColor = (type: string) => {
    switch (type) {
      case 'POST_PAIEMENT':
        return 'default';
      case 'PRE_PAIEMENT':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getPaymentTypeLabel = (type: string) => {
    switch (type) {
      case 'POST_PAIEMENT':
        return 'Post-paiement';
      case 'PRE_PAIEMENT':
        return 'Pré-paiement';
      default:
        return type;
    }
  };

  // --------- search + agrégats ---------
  const filteredTransactions = useMemo(() => {
    const q = search.toLowerCase();
    return (baseTransactions || []).filter((t) =>
      (t.numeroTicket ?? '').toLowerCase().includes(q) ||
      (t.utilisateurEmail ?? '').toLowerCase().includes(q)
    );
  }, [baseTransactions, search]);

  const totalAmount = useMemo(
    () => filteredTransactions.reduce((sum, t) => sum + (t.montantTotal ?? 0), 0),
    [filteredTransactions]
  );
  const totalSalariale = useMemo(
    () => filteredTransactions.reduce((sum, t) => sum + (t.partSalariale ?? 0), 0),
    [filteredTransactions]
  );
  const totalPatronale = useMemo(
    () => filteredTransactions.reduce((sum, t) => sum + (t.partPatronale ?? 0), 0),
    [filteredTransactions]
  );

  // --------- columns ---------
  const columns = [
    {
      key: 'numeroTicket',
      header: 'N° Ticket',
      render: (_: any, t: TransactionDTO) => (
        <div className="font-medium font-mono">{t.numeroTicket}</div>
      ),
    },
    {
      key: 'date',
      header: 'Date',
      render: (_: any, t: TransactionDTO) => (
        <div className="text-sm">
          {t.date ? format(new Date(t.date), 'dd/MM/yyyy', { locale: fr }) : '—'}
        </div>
      ),
    },
    {
      key: 'heureTransaction',
      header: 'Heure',
      render: (_: any, t: TransactionDTO) => (
        <div className="text-sm font-mono">{t.heureTransaction ?? '—'}</div>
      ),
    },
    {
      key: 'utilisateur',
      header: 'Utilisateur',
      render: (_: any, t: TransactionDTO) => (
        <div className="text-sm">{t.utilisateurEmail ?? 'N/A'}</div>
      ),
    },
    {
      key: 'montantTotal',
      header: 'Montant Total',
      render: (_: any, t: TransactionDTO) => (
        <div className="font-medium text-success">
          {(t.montantTotal ?? 0).toLocaleString('fr-FR', { style: 'currency', currency: 'MAD' })}
        </div>
      ),
    },
    {
      key: 'partSalariale',
      header: 'Part Salariale',
      render: (_: any, t: TransactionDTO) => (
        <div className="text-sm">
          {(t.partSalariale ?? 0).toLocaleString('fr-FR', { style: 'currency', currency: 'MAD' })}
        </div>
      ),
    },
    {
      key: 'partPatronale',
      header: 'Part Patronale',
      render: (_: any, t: TransactionDTO) => (
        <div className="text-sm">
          {(t.partPatronale ?? 0).toLocaleString('fr-FR', { style: 'currency', currency: 'MAD' })}
        </div>
      ),
    },
    {
      key: 'typePaiement',
      header: 'Type Paiement',
      render: (_: any, t: TransactionDTO) => (
        <Badge variant={getPaymentTypeColor(String(t.typePaiement))}>
          {getPaymentTypeLabel(String(t.typePaiement))}
        </Badge>
      ),
    },
    {
      key: 'articles',
      header: 'Articles',
      render: (_: any, t: TransactionDTO) => (
        <div className="text-sm">{t.articles?.length || 0} article(s)</div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (_: any, t: TransactionDTO) => (
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={() => handleOpenCancel(t)}>
            Annuler
          </Button>
        </div>
      ),
    },
  ];

  if (isLoading) return <LoadingSpinner />;
  if (error) return <div>Erreur: {(error as any)?.message ?? 'Inconnue'}</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
          <p className="text-muted-foreground">
            Consultez l'historique des transactions du système.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Rafraîchir
          </Button>
        </div>
      </div>

      {/* Filtres & recherche */}
      <Card>
        <CardHeader>
          <CardTitle>Filtres</CardTitle>
          <CardDescription>Rechercher et filtrer par période</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par ticket ou email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={dateDebut}
                onChange={(e) => setDateDebut(e.target.value)}
              />
              <span className="text-muted-foreground">→</span>
              <Input
                type="date"
                value={dateFin}
                onChange={(e) => setDateFin(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" disabled={!usePeriod}>
                <Filter className="h-4 w-4 mr-2" />
                Filtre période actif
              </Button>
              {usePeriod && (
                <Button variant="ghost" onClick={handleResetPeriod} title="Réinitialiser la période">
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredTransactions.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Montant Total</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {totalAmount.toLocaleString('fr-FR', { style: 'currency', currency: 'MAD' })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Part Salariale</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalSalariale.toLocaleString('fr-FR', { style: 'currency', currency: 'MAD' })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Part Patronale</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalPatronale.toLocaleString('fr-FR', { style: 'currency', currency: 'MAD' })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Historique des Transactions</CardTitle>
          <CardDescription>Consultez et gérez toutes les transactions effectuées.</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={filteredTransactions}
            pagination={{
              page: page,
              size: pageSize,
              total: filteredTransactions.length,
              onPageChange: setPage,
              onSizeChange: setPageSize,
            }}
            searchable={false}
          />
        </CardContent>
      </Card>

      {/* Modal Annulation */}
      <Dialog open={showCancelModal} onOpenChange={setShowCancelModal}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Annuler la transaction</DialogTitle>
            <DialogDescription>
              Ticket {selectedTransaction?.numeroTicket} — Cette action annulera définitivement la transaction.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="motif">Motif (optionnel)</Label>
              <Textarea
                id="motif"
                placeholder="Ex: erreur de saisie, produit retourné, etc."
                value={motif}
                onChange={(e) => setMotif(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelModal(false)} disabled={isCancelling}>
              Fermer
            </Button>
            <Button onClick={handleConfirmCancel} disabled={isCancelling}>
              {isCancelling ? 'Annulation...' : 'Confirmer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
