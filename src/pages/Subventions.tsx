import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/DataTable';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useSubventions } from '@/hooks/useSubventions';
import { SubventionDTO } from '@/types/entities';
import { Search, Plus, Percent, Clock, Calendar, DollarSign } from 'lucide-react';
// import { CreateSubventionModal } from '@/components/subventions/CreateSubventionModal';
// import { EditSubventionModal } from '@/components/subventions/EditSubventionModal';
// import { DeleteSubventionModal } from '@/components/subventions/DeleteSubventionModal';

export function Subventions() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [selectedSubvention, setSelectedSubvention] = useState<SubventionDTO | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const {
    data: subventions,
    isLoading,
    error,
    createSubvention,
    updateSubvention,
    deleteSubvention,
    isCreating,
    isUpdating,
    isDeleting
  } = useSubventions({ page, size: pageSize });

  const handleEdit = (subvention: SubventionDTO) => {
    setSelectedSubvention(subvention);
    setShowEditModal(true);
  };

  const handleDelete = (subvention: SubventionDTO) => {
    setSelectedSubvention(subvention);
    setShowDeleteModal(true);
  };

  const filteredSubventions = subventions?.content?.filter(subvention =>
    subvention.taux?.toString().includes(search) ||
    subvention.articleId?.toString().includes(search) ||
    subvention.categorieEmployesId?.toString().includes(search)
  ) || [];

  const getStatusColor = (actif: boolean) => {
    return actif ? 'default' : 'secondary';
  };

  const columns = [
    {
      key: 'articleId',
      header: 'Article ID',
      render: (value: any, subvention: SubventionDTO) => (
        <div className="font-medium">#{subvention.articleId}</div>
      ),
    },
    {
      key: 'categorieEmployesId',
      header: 'Catégorie Employés',
      render: (value: any, subvention: SubventionDTO) => (
        <div className="text-sm">#{subvention.categorieEmployesId}</div>
      ),
    },
    {
      key: 'taux',
      header: 'Taux',
      render: (value: any, subvention: SubventionDTO) => (
        <div className="font-medium text-success">
          {subvention.taux}%
        </div>
      ),
    },
    {
      key: 'plafondJour',
      header: 'Plafond Jour',
      render: (value: any, subvention: SubventionDTO) => (
        <div className="text-sm">
          {subvention.plafondJour.toLocaleString('fr-FR', { 
            style: 'currency', 
            currency: 'MAD' 
          })}
        </div>
      ),
    },
    {
      key: 'plafondSemaine',
      header: 'Plafond Semaine',
      render: (value: any, subvention: SubventionDTO) => (
        <div className="text-sm">
          {subvention.plafondSemaine.toLocaleString('fr-FR', { 
            style: 'currency', 
            currency: 'MAD' 
          })}
        </div>
      ),
    },
    {
      key: 'plafondMois',
      header: 'Plafond Mois',
      render: (value: any, subvention: SubventionDTO) => (
        <div className="text-sm">
          {subvention.plafondMois.toLocaleString('fr-FR', { 
            style: 'currency', 
            currency: 'MAD' 
          })}
        </div>
      ),
    },
    {
      key: 'actif',
      header: 'Statut',
      render: (value: any, subvention: SubventionDTO) => (
        <Badge variant={getStatusColor(subvention.actif)}>
          {subvention.actif ? 'Actif' : 'Inactif'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (value: any, subvention: SubventionDTO) => (
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleEdit(subvention)}
          >
            Modifier
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDelete(subvention)}
          >
            Supprimer
          </Button>
        </div>
      ),
    },
  ];

  const moyenneTaux = filteredSubventions.length > 0 
    ? filteredSubventions.reduce((sum, s) => sum + s.taux, 0) / filteredSubventions.length 
    : 0;

  const totalPlafondMois = filteredSubventions.reduce((sum, s) => sum + s.plafondMois, 0);

  if (isLoading) return <LoadingSpinner />;
  if (error) return <div>Erreur: {error.message}</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Subventions</h1>
          <p className="text-muted-foreground">
            Gérez les subventions et plafonds de votre système.
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle Subvention
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Subventions</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{subventions?.totalElements || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Actives</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {filteredSubventions.filter(s => s.actif).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux Moyen</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {moyenneTaux.toFixed(1)}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Plafond Total Mensuel</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalPlafondMois.toLocaleString('fr-FR', { style: 'currency', currency: 'MAD' })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher des subventions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des Subventions</CardTitle>
          <CardDescription>
            Gérez toutes vos subventions et leurs plafonds.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={filteredSubventions}
            pagination={{
              page: page,
              size: pageSize,
              total: subventions?.totalElements || 0,
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