import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/DataTable';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useRemboursements } from '@/hooks/useRemboursements';
import { RemboursementDTO, StatusRemboursement } from '@/types/entities';
import { Search, Plus, CreditCard, Clock, CheckCircle, XCircle, DollarSign } from 'lucide-react';
import { CreateRemboursementModal } from '../components/remboursements/CreateRemboursementModal';
import { UpdateStatusModal } from '../components/remboursements/UpdateStatusModal';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// Types locaux pour les statistiques
interface RemboursementStats {
  total: number;
  enAttente: number;
  accepte: number;
  refuse: number;
  montantTotal: number;
}

export default function Remboursements() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [selectedRemboursement, setSelectedRemboursement] = useState<RemboursementDTO | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'my'>('all');

  const {
    remboursements,
    myRemboursements,
    isLoading,
    isLoadingMy,
    error,
    updateStatus,
    isUpdatingStatus,
    deleteRemboursement,
    isDeleting,
    refetch,
    refetchMy
  } = useRemboursements({ page, size: pageSize });

  // Debug: Log des données
  console.log('Remboursements data:', { remboursements, myRemboursements, isLoading, isLoadingMy, error });

  // Gestion des données selon l'onglet actif
  const currentData = activeTab === 'all' ? remboursements : myRemboursements;
  const currentLoading = activeTab === 'all' ? isLoading : isLoadingMy;
  const currentRefetch = activeTab === 'all' ? refetch : refetchMy;

  const remboursementsContent = useMemo(() => 
    currentData?.content || [], [currentData?.content]
  );
  
  const filteredRemboursements = useMemo(() => {
    return remboursementsContent.filter(remb =>
      remb.message?.toLowerCase().includes(search.toLowerCase()) ||
      remb.numeroTicket?.toLowerCase().includes(search.toLowerCase()) ||
      remb.status?.toLowerCase().includes(search.toLowerCase())
    );
  }, [search, remboursementsContent]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case StatusRemboursement.EN_ATTENTE: return 'secondary';
      case StatusRemboursement.ACCEPTE: return 'default';
      case StatusRemboursement.REFUSE: return 'destructive';
      default: return 'outline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case StatusRemboursement.EN_ATTENTE: return <Clock className="h-3 w-3" />;
      case StatusRemboursement.ACCEPTE: return <CheckCircle className="h-3 w-3" />;
      case StatusRemboursement.REFUSE: return <XCircle className="h-3 w-3" />;
      default: return <Clock className="h-3 w-3" />;
    }
  };

  const handleStatusChange = (remboursement: RemboursementDTO, newStatus: StatusRemboursement) => {
    updateStatus({ remboursementId: remboursement.id!, status: newStatus });
  };

  const handleDelete = (remboursement: RemboursementDTO) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce remboursement ?')) {
      deleteRemboursement(remboursement.id!);
    }
  };

  const columns = [
    {
      key: 'numeroTicket',
      header: 'N° Ticket',
      render: (_: string, remb: RemboursementDTO) => (
        <div className="font-medium">{remb.numeroTicket || '-'}</div>
      ),
    },
    {
      key: 'montantRemboursement',
      header: 'Montant',
      render: (_: number, remb: RemboursementDTO) => (
        <div className="font-medium text-success">
          {remb.montantRemboursement.toLocaleString('fr-FR', { 
            style: 'currency', 
            currency: 'MAD' 
          })}
        </div>
      ),
    },
    {
      key: 'dateCreation',
      header: 'Date Demande',
      render: (_: string, remb: RemboursementDTO) => (
        <div className="text-sm">
          {remb.dateCreation ? format(new Date(remb.dateCreation), 'dd/MM/yyyy HH:mm', { locale: fr }) : '-'}
        </div>
      ),
    },
    {
      key: 'message',
      header: 'Motif',
      render: (_: string, remb: RemboursementDTO) => (
        <div className="text-sm max-w-xs truncate" title={remb.message}>
          {remb.message || '-'}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Statut',
      render: (_: StatusRemboursement, remb: RemboursementDTO) => (
        <Badge variant={getStatusColor(remb.status)} className="flex items-center gap-1">
          {getStatusIcon(remb.status)}
          {remb.status === StatusRemboursement.EN_ATTENTE ? 'En attente' :
           remb.status === StatusRemboursement.ACCEPTE ? 'Accepté' :
           remb.status === StatusRemboursement.REFUSE ? 'Refusé' : remb.status}
        </Badge>
      ),
    },
    {
      key: 'dateTraitement',
      header: 'Date Traitement',
      render: (_: string, remb: RemboursementDTO) => (
        <div className="text-sm">
          {remb.dateTraitement ? format(new Date(remb.dateTraitement), 'dd/MM/yyyy HH:mm', { locale: fr }) : '-'}
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (_: unknown, remb: RemboursementDTO) => (
        <div className="flex space-x-1">
          {/* Boutons admin pour changer le statut */}
          {activeTab === 'all' && remb.status === StatusRemboursement.EN_ATTENTE && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleStatusChange(remb, StatusRemboursement.ACCEPTE)}
                disabled={isUpdatingStatus}
                className="h-7 px-2 text-xs text-green-600 border-green-600 hover:bg-green-50"
              >
                Accepter
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleStatusChange(remb, StatusRemboursement.REFUSE)}
                disabled={isUpdatingStatus}
                className="h-7 px-2 text-xs text-red-600 border-red-600 hover:bg-red-50"
              >
                Refuser
              </Button>
            </>
          )}
          
          {/* Bouton supprimer */}
          <Button
            variant="destructive"
            size="sm"
            onClick={() => handleDelete(remb)}
            disabled={isDeleting}
            className="h-7 px-2 text-xs"
          >
            Supprimer
          </Button>
        </div>
      ),
    },
  ];

  if (currentLoading) return <LoadingSpinner />;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <div className="text-destructive text-lg font-semibold">
          Erreur lors du chargement des remboursements
        </div>
        <div className="text-muted-foreground text-center max-w-md">
          {error.message || 'Une erreur inattendue s\'est produite'}
        </div>
        <Button onClick={() => currentRefetch()}>
          Réessayer
        </Button>
      </div>
    );
  }

  // Statistiques
  const stats = {
    total: remboursementsContent.length,
    enAttente: remboursementsContent.filter(r => r.status === StatusRemboursement.EN_ATTENTE).length,
    acceptes: remboursementsContent.filter(r => r.status === StatusRemboursement.ACCEPTE).length,
    refuses: remboursementsContent.filter(r => r.status === StatusRemboursement.REFUSE).length,
    montantTotal: remboursementsContent.reduce((sum, r) => sum + (r.montantRemboursement || 0), 0)
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Remboursements</h1>
          <p className="text-sm text-muted-foreground">
            Gérez les demandes de remboursement du système.
          </p>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => currentRefetch()}
            disabled={currentLoading}
          >
            <Search className="h-4 w-4 mr-2" />
            {currentLoading ? 'Chargement...' : 'Recharger'}
          </Button>
          <Button size="sm" onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle Demande
          </Button>
        </div>
      </div>

      {/* Onglets */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
        <Button
          variant={activeTab === 'all' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('all')}
        >
          Tous les remboursements
        </Button>
        <Button
          variant={activeTab === 'my' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('my')}
        >
          Mes demandes
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-3 grid-cols-5">
        <Card className="py-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3">
            <CardTitle className="text-xs font-medium">Total</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pb-3">
            <div className="text-xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card className="py-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3">
            <CardTitle className="text-xs font-medium">En attente</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent className="pb-3">
            <div className="text-xl font-bold text-yellow-600">{stats.enAttente}</div>
          </CardContent>
        </Card>

        <Card className="py-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3">
            <CardTitle className="text-xs font-medium">Acceptés</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent className="pb-3">
            <div className="text-xl font-bold text-green-600">{stats.acceptes}</div>
          </CardContent>
        </Card>

        <Card className="py-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3">
            <CardTitle className="text-xs font-medium">Refusés</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent className="pb-3">
            <div className="text-xl font-bold text-red-600">{stats.refuses}</div>
          </CardContent>
        </Card>

        <Card className="py-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3">
            <CardTitle className="text-xs font-medium">Montant Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pb-3">
            <div className="text-xl font-bold">
              {stats.montantTotal.toLocaleString('fr-FR', { style: 'currency', currency: 'MAD' })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex items-center">
        <div className="relative w-80">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher des remboursements..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9"
          />
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-lg">
                {activeTab === 'all' ? 'Tous les remboursements' : 'Mes demandes de remboursement'}
              </CardTitle>
              <CardDescription className="text-sm">
                {activeTab === 'all' 
                  ? 'Gérez toutes les demandes de remboursement du système.'
                  : 'Consultez et gérez vos propres demandes de remboursement.'
                }
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pb-4">
          {remboursementsContent.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <CreditCard className="h-16 w-16 text-muted-foreground" />
              <div className="text-lg font-semibold">Aucun remboursement trouvé</div>
              <div className="text-muted-foreground text-center max-w-md">
                {activeTab === 'all' 
                  ? 'Aucune demande de remboursement n\'a été trouvée dans le système.'
                  : 'Vous n\'avez encore aucune demande de remboursement.'
                }
              </div>
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Créer une demande
              </Button>
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={filteredRemboursements}
              pagination={{
                page: page,
                size: pageSize,
                total: currentData?.totalElements || 0,
                onPageChange: setPage,
                onSizeChange: setPageSize,
              }}
              searchable={false}
            />
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <CreateRemboursementModal 
        open={showCreateModal} 
        onOpenChange={setShowCreateModal} 
      />
      
      <UpdateStatusModal 
        open={showStatusModal} 
        onOpenChange={setShowStatusModal} 
        remboursement={selectedRemboursement} 
      />
    </div>
  );
}
