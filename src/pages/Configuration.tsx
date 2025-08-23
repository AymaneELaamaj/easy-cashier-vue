import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/DataTable';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useConfigs } from '@/hooks/useConfigs';
import { ConfigPaiementDTO } from '@/types/entities';
import { Search, Plus, Settings, CreditCard } from 'lucide-react';

export function Configuration() {
  const [search, setSearch] = useState('');
  const [selectedConfig, setSelectedConfig] = useState<ConfigPaiementDTO | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const {
    configs,
    isLoading,
    error,
    createConfig,
    updateConfig,
    deleteConfig,
    isCreating,
    isUpdating,
    isDeleting
  } = useConfigs();

  const handleEdit = (config: ConfigPaiementDTO) => {
    setSelectedConfig(config);
    setShowEditModal(true);
  };

  const handleDelete = (config: ConfigPaiementDTO) => {
    setSelectedConfig(config);
    setShowDeleteModal(true);
  };

  const filteredConfigs = (configs || []).filter((config: any) =>
    config.typePaiement?.toLowerCase().includes(search.toLowerCase())
  );

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'POST_PAIEMENT':
        return 'default';
      case 'PRE_PAIEMENT':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const columns = [
    {
      key: 'id',
      header: 'ID',
      render: (value: any, config: ConfigPaiementDTO) => (
        <div className="font-medium">{(config as any).id}</div>
      ),
    },
    {
      key: 'typePaiement',
      header: 'Type de Paiement',
      render: (value: any, config: ConfigPaiementDTO) => (
        <Badge variant={getTypeColor(config.typePaiement)}>
          {config.typePaiement}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (value: any, config: ConfigPaiementDTO) => (
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleEdit(config)}
          >
            Modifier
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDelete(config)}
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
          <h1 className="text-3xl font-bold tracking-tight">Configuration</h1>
          <p className="text-muted-foreground">
            Gérez les configurations de paiement de votre système.
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle Configuration
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Configurations</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(configs || []).length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Types de Paiement</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(filteredConfigs.map(c => c.typePaiement)).size}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher des configurations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des Configurations</CardTitle>
          <CardDescription>
            Gérez toutes vos configurations de paiement.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={filteredConfigs}
            searchable={false}
          />
        </CardContent>
      </Card>

      {/* TODO: Implement modals */}
    </div>
  );
}