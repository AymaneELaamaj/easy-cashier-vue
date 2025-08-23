import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/DataTable';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useBadges } from '@/hooks/useBadges';
import { BadgeDTO } from '@/types/entities';
import { Search, Plus, CreditCard, User, CheckCircle } from 'lucide-react';
// import { CreateBadgeModal } from '@/components/badges/CreateBadgeModal';
// import { EditBadgeModal } from '@/components/badges/EditBadgeModal';
// import { DeleteBadgeModal } from '@/components/badges/DeleteBadgeModal';
// import { AssignBadgeModal } from '@/components/badges/AssignBadgeModal';

export function Badges() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [selectedBadge, setSelectedBadge] = useState<BadgeDTO | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);

  const {
    data: badges,
    isLoading,
    error,
    createBadge,
    updateBadge,
    deleteBadge,
    activateBadge,
    deactivateBadge,
    assignBadge,
    isCreating,
    isUpdating,
    isDeleting
  } = useBadges({ page, size: pageSize });

  const handleEdit = (badge: BadgeDTO) => {
    setSelectedBadge(badge);
    setShowEditModal(true);
  };

  const handleDelete = (badge: BadgeDTO) => {
    setSelectedBadge(badge);
    setShowDeleteModal(true);
  };

  const handleAssign = (badge: BadgeDTO) => {
    setSelectedBadge(badge);
    setShowAssignModal(true);
  };

  const handleToggleStatus = (badge: BadgeDTO) => {
    if (badge.active) {
      deactivateBadge(badge.id!);
    } else {
      activateBadge(badge.id!);
    }
  };

  const filteredBadges = badges?.content?.filter(badge =>
    badge.codeBadge?.toLowerCase().includes(search.toLowerCase()) ||
    badge.statut?.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const getStatusColor = (active: boolean) => {
    return active ? 'default' : 'secondary';
  };

  const getStatutColor = (statut: string) => {
    switch (statut) {
      case 'ACTIF':
        return 'default';
      case 'INACTIF':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const columns = [
    {
      key: 'codeBadge',
      header: 'Code Badge',
      render: (value: any, badge: BadgeDTO) => (
        <div className="font-medium font-mono">{badge.codeBadge || 'N/A'}</div>
      ),
    },
    {
      key: 'active',
      header: 'Activé',
      render: (value: any, badge: BadgeDTO) => (
        <Badge variant={getStatusColor(badge.active)}>
          {badge.active ? 'Activé' : 'Désactivé'}
        </Badge>
      ),
    },
    {
      key: 'statut',
      header: 'Statut',
      render: (value: any, badge: BadgeDTO) => (
        <Badge variant={getStatutColor(badge.statut)}>
          {badge.statut}
        </Badge>
      ),
    },
    {
      key: 'utilisateurId',
      header: 'Utilisateur',
      render: (value: any, badge: BadgeDTO) => (
        <div className="text-sm">
          {badge.utilisateurId ? (
            <span className="text-success">Assigné #{badge.utilisateurId}</span>
          ) : (
            <span className="text-muted-foreground">Non assigné</span>
          )}
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (value: any, badge: BadgeDTO) => (
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleToggleStatus(badge)}
          >
            {badge.active ? 'Désactiver' : 'Activer'}
          </Button>
          {!badge.utilisateurId && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAssign(badge)}
            >
              Assigner
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleEdit(badge)}
          >
            Modifier
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDelete(badge)}
          >
            Supprimer
          </Button>
        </div>
      ),
    },
  ];

  if (isLoading) return <LoadingSpinner />;
  if (error) return <div>Erreur: {error.message}</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Badges</h1>
          <p className="text-muted-foreground">
            Gérez les badges d'accès de votre système.
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau Badge
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Badges</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{badges?.totalElements || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assignés</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {filteredBadges.filter(b => b.utilisateurId).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Disponibles</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredBadges.filter(b => !b.utilisateurId).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Actifs</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {filteredBadges.filter(b => b.active).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher des badges..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des Badges</CardTitle>
          <CardDescription>
            Gérez tous vos badges d'accès et leurs assignations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={filteredBadges}
            pagination={{
              page: page,
              size: pageSize,
              total: badges?.totalElements || 0,
              onPageChange: setPage,
              onSizeChange: setPageSize,
            }}
            searchable={false}
          />
        </CardContent>
      </Card>

      {/* Modals - TODO: Implement modals */}
    </div>
  );
}