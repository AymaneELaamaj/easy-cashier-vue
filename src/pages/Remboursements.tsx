import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/DataTable';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useRemboursements } from '@/hooks/useRemboursements';
import { useAuth } from '@/hooks/useAuth';
import { RemboursementResponseDTO, StatusRemboursement } from '@/types/entities';
import { 
  Search, 
  Plus, 
  Clock, 
  CheckCircle, 
  XCircle, 
  DollarSign, 
  FileText,
  Users,
  AlertTriangle
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { CreateRemboursementModal } from '@/components/remboursements/CreateRemboursementModal';

export default function Remboursements() {
  // Récupération de l'utilisateur connecté pour déterminer les permissions
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPER_ADMIN';
  const isEmploye = currentUser?.role === 'EMPLOYE';

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [selectedRemboursement, setSelectedRemboursement] = useState<RemboursementResponseDTO | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

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

  // Gestion des données selon le rôle
  const currentData = useMemo(() => {
    if (isAdmin) {
      return remboursements; // Les admins voient toujours toutes les demandes
    }
    return myRemboursements; // Les employés voient leurs propres demandes
  }, [remboursements, myRemboursements, isAdmin]);

  // Gestion des états de chargement selon le rôle
  const currentLoading = isAdmin ? isLoading : isLoadingMy;
  const currentRefetch = isAdmin ? refetch : refetchMy;

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

  const handleStatusChange = (remboursement: RemboursementResponseDTO, newStatus: StatusRemboursement) => {
    if (!isAdmin) return;
    updateStatus({ remboursementId: remboursement.id!, status: newStatus });
  };

  const handleDelete = (remboursement: RemboursementResponseDTO) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce remboursement ?')) {
      deleteRemboursement(remboursement.id!);
    }
  };

  const columns = [
    {
      key: 'numeroTicket',
      header: 'N° Ticket',
      render: (_: string, remb: RemboursementResponseDTO) => (
        <div className="font-medium">{remb.numeroTicket || '-'}</div>
      ),
    },
    {
      key: 'montantRemboursement',
      header: 'Montant',
      render: (_: number, remb: RemboursementResponseDTO) => (
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
      render: (_: string, remb: RemboursementResponseDTO) => (
        <div className="text-sm">
          {remb.dateCreation ? format(new Date(remb.dateCreation), 'dd/MM/yyyy HH:mm', { locale: fr }) : '-'}
        </div>
      ),
    },
    {
      key: 'message',
      header: 'Motif',
      render: (_: string, remb: RemboursementResponseDTO) => (
        <div className="text-sm max-w-xs truncate" title={remb.message}>
          {remb.message || '-'}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Statut',
      render: (_: StatusRemboursement, remb: RemboursementResponseDTO) => (
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
      render: (_: string, remb: RemboursementResponseDTO) => (
        <div className="text-sm">
          {remb.dateTraitement ? format(new Date(remb.dateTraitement), 'dd/MM/yyyy HH:mm', { locale: fr }) : '-'}
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (_: unknown, remb: RemboursementResponseDTO) => (
        <div className="flex space-x-1">
          {/* Boutons admin pour changer le statut - seulement pour les admins */}
          {isAdmin && remb.status === StatusRemboursement.EN_ATTENTE && (
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
          
          {/* Bouton supprimer - seulement pour les employés sur leurs propres demandes */}
          {isEmploye && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleDelete(remb)}
              disabled={isDeleting}
              className="h-7 px-2 text-xs"
            >
              Supprimer
            </Button>
          )}
        </div>
      ),
    },
  ];

  // Statistiques
  const stats = useMemo(() => ({
    total: remboursementsContent.length,
    enAttente: remboursementsContent.filter(r => r.status === StatusRemboursement.EN_ATTENTE).length,
    acceptes: remboursementsContent.filter(r => r.status === StatusRemboursement.ACCEPTE).length,
    refuses: remboursementsContent.filter(r => r.status === StatusRemboursement.REFUSE).length,
    montantTotal: remboursementsContent.reduce((sum, r) => sum + (r.montantRemboursement || 0), 0)
  }), [remboursementsContent]);

  if (currentLoading) return <LoadingSpinner />;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <div className="text-destructive text-lg font-semibold">
          Erreur lors du chargement des remboursements
        </div>
        <div className="text-muted-foreground text-center max-w-md">
          {error.message || 'Une erreur est survenue'}
        </div>
        <Button onClick={() => currentRefetch()} variant="outline">
          Réessayer
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Remboursements</h1>
          <p className="text-muted-foreground">
            {isAdmin ? "Gérez toutes les demandes de remboursement" : "Gérez vos demandes de remboursement"}
          </p>
        </div>
        {isEmploye && (
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle Demande
          </Button>
        )}
      </div>

      {/* Onglets - Seulement pour les admins, et seulement l'onglet "Toutes les demandes" */}
      {isAdmin && (
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
          <Button
            variant="default"
            size="sm"
            className="flex items-center gap-2"
          >
            <Users className="h-4 w-4" />
            Toutes les Demandes
          </Button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Attente</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.enAttente}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Acceptés</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.acceptes}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Refusés</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.refuses}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Montant Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.montantTotal.toLocaleString('fr-FR', { 
                style: 'currency', 
                currency: 'MAD' 
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher des remboursements..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {isAdmin ? 'Toutes les Demandes' : 'Mes Demandes'}
          </CardTitle>
          <CardDescription>
            {isAdmin 
              ? 'Gérez toutes les demandes de remboursement de vos employés'
              : 'Consultez et gérez vos propres demandes de remboursement'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={filteredRemboursements}
            pagination={{
              page,
              size: pageSize,
              total: currentData?.totalElements ?? 0,
              onPageChange: setPage,
              onSizeChange: setPageSize,
            }}
            searchable={false}
          />
        </CardContent>
      </Card>

      {/* Modal de création */}
      <CreateRemboursementModal 
        open={showCreateModal} 
        onOpenChange={setShowCreateModal} 
      />
    </div>
  );
}
