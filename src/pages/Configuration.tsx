import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/DataTable';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useConfigs } from '@/hooks/useConfigs';
import { ConfigPaiementDTO } from '@/types/entities';
import { Search, Plus, Settings, CreditCard } from 'lucide-react';
import CreateConfigModal from '@/components/config/CreateConfigModal';
import EditConfigModal from '@/components/config/EditConfigModal';
import DeleteConfigModal from '@/components/config/DeleteConfigModal';

export function Configuration() {
  const [search, setSearch] = useState('');
  const [selectedConfig, setSelectedConfig] = useState<ConfigPaiementDTO | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const {
    configs,          // toujours un array via le hook
    isLoading,
    error,
    isCreating,       // utilisé pour désactiver le bouton "Nouvelle Configuration"
    refetch,          // pour rafraîchir après create/update/delete
  } = useConfigs();

  const handleEdit = (config: ConfigPaiementDTO) => {
    setSelectedConfig(config);
    setShowEditModal(true);
  };

  const handleDelete = (config: ConfigPaiementDTO) => {
    setSelectedConfig(config);
    setShowDeleteModal(true);
  };

  const filteredConfigs = useMemo(
    () =>
      (configs ?? []).filter((c) =>
        (c.typePaiement ?? '').toLowerCase().includes(search.toLowerCase())
      ),
    [configs, search]
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
      render: (_: any, config: ConfigPaiementDTO) => (
        <div className="font-medium">{(config as any).id ?? '—'}</div>
      ),
    },
    {
      key: 'typePaiement',
      header: 'Type de Paiement',
      render: (_: any, config: ConfigPaiementDTO) => (
        <Badge variant={getTypeColor(config.typePaiement)}>{config.typePaiement}</Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (_: any, config: ConfigPaiementDTO) => (
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={() => handleEdit(config)}>
            Modifier
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleDelete(config)}>
            Supprimer
          </Button>
        </div>
      ),
    },
  ];

  if (isLoading) return <LoadingSpinner />;
  if (error) return <div>Erreur: {(error as any)?.message ?? 'Inconnue'}</div>;

  const current = configs?.[0];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Configuration</h1>
          <p className="text-muted-foreground">
            Gérez la configuration globale du type de paiement.
          </p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          disabled={isCreating}
          title={current ? 'Une seule configuration globale est gérée' : undefined}
        >
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
            <div className="text-2xl font-bold">{(configs ?? []).length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Types de Paiement</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(filteredConfigs.map((c) => c.typePaiement)).size}
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
          <CardDescription>Créer, modifier ou supprimer le type global.</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={filteredConfigs} searchable={false} />
        </CardContent>
      </Card>

      {/* Modals */}
      <CreateConfigModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onCreated={refetch}
      />

      <EditConfigModal
        open={showEditModal}
        onOpenChange={setShowEditModal}
        config={selectedConfig ?? current ?? null}
        onUpdated={() => {
          refetch();
          setSelectedConfig(null);
        }}
      />

      <DeleteConfigModal
        open={showDeleteModal}
        onOpenChange={setShowDeleteModal}
        config={selectedConfig ?? current ?? null}
        onDeleted={() => {
          refetch();
          setSelectedConfig(null);
        }}
      />
    </div>
  );
}
