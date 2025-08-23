import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/DataTable';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useTransactions } from '@/hooks/useTransactions';
import { TransactionDTO } from '@/types/entities';
import { Search, Receipt, CreditCard, TrendingUp, Calendar } from 'lucide-react';
// import { CancelTransactionModal } from '@/components/transactions/CancelTransactionModal';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export function Transactions() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionDTO | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);

  const {
    transactions,
    isLoading,
    error,
    cancelTransaction,
    isCancelling
  } = useTransactions();

  const handleCancel = (transaction: TransactionDTO) => {
    setSelectedTransaction(transaction);
    setShowCancelModal(true);
  };

  const filteredTransactions = transactions?.filter(transaction =>
    transaction.numeroTicket?.toLowerCase().includes(search.toLowerCase()) ||
    transaction.utilisateur?.nom?.toLowerCase().includes(search.toLowerCase()) ||
    transaction.utilisateur?.prenom?.toLowerCase().includes(search.toLowerCase())
  ) || [];

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

  const columns = [
    {
      key: 'numeroTicket',
      header: 'N° Ticket',
      render: (value: any, transaction: TransactionDTO) => (
        <div className="font-medium font-mono">{transaction.numeroTicket}</div>
      ),
    },
    {
      key: 'date',
      header: 'Date',
      render: (value: any, transaction: TransactionDTO) => (
        <div className="text-sm">
          {format(new Date(transaction.date), 'dd/MM/yyyy', { locale: fr })}
        </div>
      ),
    },
    {
      key: 'heureTransaction',
      header: 'Heure',
      render: (value: any, transaction: TransactionDTO) => (
        <div className="text-sm font-mono">{transaction.heureTransaction}</div>
      ),
    },
    {
      key: 'utilisateur',
      header: 'Utilisateur',
      render: (value: any, transaction: TransactionDTO) => (
        <div className="text-sm">
          {transaction.utilisateur ? 
            `${transaction.utilisateur.prenom} ${transaction.utilisateur.nom}` : 
            'N/A'
          }
        </div>
      ),
    },
    {
      key: 'montantTotal',
      header: 'Montant Total',
      render: (value: any, transaction: TransactionDTO) => (
        <div className="font-medium text-success">
          {transaction.montantTotal.toLocaleString('fr-FR', { 
            style: 'currency', 
            currency: 'MAD' 
          })}
        </div>
      ),
    },
    {
      key: 'partSalariale',
      header: 'Part Salariale',
      render: (value: any, transaction: TransactionDTO) => (
        <div className="text-sm">
          {transaction.partSalariale.toLocaleString('fr-FR', { 
            style: 'currency', 
            currency: 'MAD' 
          })}
        </div>
      ),
    },
    {
      key: 'partPatronale',
      header: 'Part Patronale',
      render: (value: any, transaction: TransactionDTO) => (
        <div className="text-sm">
          {transaction.partPatronale.toLocaleString('fr-FR', { 
            style: 'currency', 
            currency: 'MAD' 
          })}
        </div>
      ),
    },
    {
      key: 'typePaiement',
      header: 'Type Paiement',
      render: (value: any, transaction: TransactionDTO) => (
        <Badge variant={getPaymentTypeColor(transaction.typePaiement)}>
          {getPaymentTypeLabel(transaction.typePaiement)}
        </Badge>
      ),
    },
    {
      key: 'articles',
      header: 'Articles',
      render: (value: any, transaction: TransactionDTO) => (
        <div className="text-sm">
          {transaction.articles?.length || 0} article(s)
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (value: any, transaction: TransactionDTO) => (
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleCancel(transaction)}
          >
            Annuler
          </Button>
        </div>
      ),
    },
  ];

  const totalAmount = filteredTransactions.reduce((sum, t) => sum + t.montantTotal, 0);
  const totalSalariale = filteredTransactions.reduce((sum, t) => sum + t.partSalariale, 0);
  const totalPatronale = filteredTransactions.reduce((sum, t) => sum + t.partPatronale, 0);

  if (isLoading) return <LoadingSpinner />;
  if (error) return <div>Erreur: {error.message}</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
          <p className="text-muted-foreground">
            Consultez l'historique des transactions du système.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{transactions?.length || 0}</div>
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

      {/* Search */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher des transactions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Historique des Transactions</CardTitle>
          <CardDescription>
            Consultez et gérez toutes les transactions effectuées.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={filteredTransactions}
            pagination={{
              page: page,
              size: pageSize,
              total: transactions?.length || 0,
              onPageChange: setPage,
              onSizeChange: setPageSize,
            }}
            searchable={false}
          />
        </CardContent>
      </Card>

      {/* Modals - TODO: Implement cancel modal */}
    </div>
  );
}