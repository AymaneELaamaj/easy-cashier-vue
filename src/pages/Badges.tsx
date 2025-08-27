import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/DataTable';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { useBadges } from '@/hooks/useBadges';
import { BadgeResponse } from '@/types/entities';
import { Search, Plus, CreditCard, User, CheckCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { AssignBadgeModal } from '@/components/badges/AssignBadgeModal';
// import { CreateBadgeModal } from '@/components/badges/CreateBadgeModal';
// import { EditBadgeModal } from '@/components/badges/EditBadgeModal';
// import { DeleteBadgeModal } from '@/components/badges/DeleteBadgeModal';

export function Badges() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [selectedBadge, setSelectedBadge] = useState<BadgeResponse | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
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
    unassignBadge,
    isCreating,
    isUpdating,
    isDeleting,
    isAssigning,
    isUnassigning
  } = useBadges({ page, size: pageSize });

  // Debug logs
  console.log('🔍 Badges data:', badges);
  console.log('🔍 Badges content:', badges?.content);
  console.log('🔍 Is loading:', isLoading);
  console.log('🔍 Error:', error);



  const handleDelete = (badge: BadgeResponse) => {
    setSelectedBadge(badge);
    setShowDeleteModal(true);
  };

  const handleAssign = (badge: BadgeResponse) => {
    setSelectedBadge(badge);
    setShowAssignModal(true);
  };

  const handleUnassign = async (badge: BadgeResponse) => {
    if (!badge.id) return;
    
    try {
      await unassignBadge(badge.id);
    } catch (error) {
      console.error('Error unassigning badge:', error);
      // Le toast d'erreur sera affiché par le hook useBadges
    }
  };

  const handleToggleStatus = (badge: BadgeResponse) => {
    if (badge.active) {
      deactivateBadge(badge.id!);
    } else {
      activateBadge(badge.id!);
    }
  };

  const handleAssignBadge = async (utilisateurId: number, badgeId: number) => {
    try {
      await assignBadge({ utilisateurId, badgeId });
    } catch (error) {
      console.error('Error assigning badge:', error);
      throw error; // Re-throw pour que le modal puisse gérer l'erreur
    }
  };

  const handleCreateBadge = async () => {
    try {
      await createBadge();
      setShowCreateModal(false);
      // Pas besoin de toast ici car le hook gère déjà le toast de succès
    } catch (error) {
      const msg = (error as { message?: string })?.message || 'Erreur lors de la création du badge';
      toast.error(msg);
    }
  };

  const filteredBadges = badges?.content?.filter(badge =>
    badge.codeBadge?.toLowerCase().includes(search.toLowerCase())
  ) || [];

  // Debug: Afficage des informations sur les données
  console.log('📊 Total badges:', badges?.totalElements);
  console.log('📊 Filtered badges count:', filteredBadges.length);
  console.log('📊 Current page:', badges?.number);
  console.log('📊 Is empty?', badges?.empty);

  const getStatusColor = (active: boolean) => {
    return active ? 'default' : 'secondary';
  };

  const getStatusBgColor = (active: boolean) => {
    return active ? 'bg-green-50' : 'bg-red-50';
  };

  const getBadgeRowColor = (badge: BadgeResponse) => {
    if (!badge.active) return 'bg-red-50/30';
    if (badge.utilisateurId) return 'bg-green-50/30';
    return 'bg-blue-50/30';
  };

  const columns = [
    {
      key: 'codeBadge',
      header: 'Code Badge',
      render: (_value: unknown, badge: BadgeResponse) => (
        <div className={`p-2 rounded ${getBadgeRowColor(badge)}`}>
          <div className="font-medium font-mono text-lg">{badge.codeBadge || 'N/A'}</div>
          <div className="text-xs text-muted-foreground mt-1">
            #{badge.id}
          </div>
        </div>
      ),
    },
    {
      key: 'active',
      header: 'Statut',
      render: (_value: unknown, badge: BadgeResponse) => (
        <div className="flex flex-col space-y-2">
          <Badge 
            variant={getStatusColor(badge.active)}
            className={`${badge.active ? 'bg-green-100 text-green-800 border-green-300' : 'bg-red-100 text-red-800 border-red-300'}`}
          >
            {badge.active ? '🟢 Activé' : '🔴 Désactivé'}
          </Badge>
          {badge.utilisateurId && (
            <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
              👤 Assigné
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: 'utilisateurId',
      header: 'Utilisateur',
      render: (_value: unknown, badge: BadgeResponse) => (
        <div className="text-sm">
          {badge.utilisateurId ? (
            <div className="flex flex-col space-y-1">
              <span className="font-medium text-success">✓ Assigné</span>
              <span className="text-muted-foreground">ID: #{badge.utilisateurId}</span>
            </div>
          ) : (
            <div className="flex items-center space-x-1">
              <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
              <span className="text-yellow-700 font-medium">Disponible</span>
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (_value: unknown, badge: BadgeResponse) => (
        <div className="flex space-x-2 flex-wrap">
          {/* Bouton Activer/Désactiver */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleToggleStatus(badge)}
            className={badge.active 
              ? 'border-red-300 hover:bg-red-50 text-red-600 hover:text-red-700' 
              : 'border-green-300 hover:bg-green-50 text-green-600 hover:text-green-700'
            }
          >
            {badge.active ? '⏸️ Désactiver' : '▶️ Activer'}
          </Button>
          
          {/* Bouton Assigner (seulement si pas assigné) */}
          {!badge.utilisateurId && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAssign(badge)}
              className="border-blue-300 hover:bg-blue-50 text-blue-600 hover:text-blue-700"
              disabled={isAssigning}
            >
              👤 Assigner
            </Button>
          )}
          
          {/* Bouton Désassigner (seulement si assigné) */}
          {badge.utilisateurId && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleUnassign(badge)}
              className="border-orange-300 hover:bg-orange-50 text-orange-600 hover:text-orange-700"
              disabled={isUnassigning}
            >
              {isUnassigning ? '⏳' : '🚫'} Désassigner
            </Button>
          )}
          
          {/* Bouton Supprimer */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDelete(badge)}
            className="border-red-300 hover:bg-red-50 text-red-600 hover:text-red-700"
          >
            🗑️ Supprimer
          </Button>
        </div>
      ),
    },
  ];

  if (isLoading) return <LoadingSpinner />;
  
  if (error) {
    console.error('❌ Badges error:', error);
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="text-red-600 text-lg">❌ Erreur: {error.message}</div>
        <div className="text-sm text-muted-foreground">
          Vérifiez votre connexion et votre authentification.
        </div>
        <Button onClick={() => window.location.reload()} variant="outline">
          🔄 Recharger
        </Button>
      </div>
    );
  }

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
        <Card className="border-t-4 border-t-blue-500 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-blue-50/50">
            <CardTitle className="text-sm font-medium text-blue-900">Total Badges</CardTitle>
            <CreditCard className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-800">{badges?.totalElements || 0}</div>
            <p className="text-xs text-blue-600 mt-1">
              Badges dans le système
            </p>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-green-500 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-green-50/50">
            <CardTitle className="text-sm font-medium text-green-900">Assignés</CardTitle>
            <User className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-800">
              {filteredBadges.filter(b => b.utilisateurId).length}
            </div>
            <p className="text-xs text-green-600 mt-1">
              Badges en utilisation
            </p>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-yellow-500 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-yellow-50/50">
            <CardTitle className="text-sm font-medium text-yellow-900">Disponibles</CardTitle>
            <CreditCard className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-800">
              {filteredBadges.filter(b => !b.utilisateurId).length}
            </div>
            <p className="text-xs text-yellow-600 mt-1">
              Prêts à assigner
            </p>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-emerald-500 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-emerald-50/50">
            <CardTitle className="text-sm font-medium text-emerald-900">Actifs</CardTitle>
            <CheckCircle className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-800">
              {filteredBadges.filter(b => b.active).length}
            </div>
            <p className="text-xs text-emerald-600 mt-1">
              Badges opérationnels
            </p>
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
      <Card className="shadow-lg border-t-4 border-t-blue-500">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center space-x-2">
            <CreditCard className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-blue-900">Liste des Badges</CardTitle>
          </div>
          <CardDescription className="text-blue-700">
            Gérez tous vos badges d'accès avec un système coloré pour une identification rapide.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="bg-white rounded-b-lg overflow-hidden">
            {filteredBadges.length === 0 && !isLoading ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <div className="text-6xl">🏷️</div>
                <div className="text-xl font-semibold text-muted-foreground">
                  Aucun badge trouvé
                </div>
                <div className="text-sm text-muted-foreground text-center max-w-md">
                  {search ? 
                    `Aucun badge ne correspond à "${search}". Essayez de modifier votre recherche.` :
                    "Aucun badge n'est disponible dans le système. Créez votre premier badge en cliquant sur le bouton 'Nouveau Badge'."
                  }
                </div>
                {search && (
                  <Button 
                    variant="outline" 
                    onClick={() => setSearch('')}
                    className="mt-4"
                  >
                    🔍 Effacer la recherche
                  </Button>
                )}
              </div>
            ) : (
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
            )}
          </div>
        </CardContent>
      </Card>

      {/* Create Badge Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>🆕 Créer un nouveau badge</DialogTitle>
            <DialogDescription>
              Un nouveau badge sera créé avec un code unique généré automatiquement.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Le badge sera créé avec les paramètres par défaut :
            </p>
            <ul className="list-disc list-inside text-sm text-muted-foreground mt-2 space-y-1">
              <li>🏷️ Code unique généré automatiquement</li>
              <li>⏸️ Statut : Inactif (à activer après création)</li>
              <li>👤 Non assigné à un utilisateur</li>
            </ul>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowCreateModal(false)}
              disabled={isCreating}
            >
              Annuler
            </Button>
            <Button 
              onClick={handleCreateBadge}
              disabled={isCreating}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isCreating ? '⏳ Création...' : '✨ Créer le badge'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Badge Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>🗑️ Supprimer le badge</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer ce badge ? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          
          {selectedBadge && (
            <div className="py-4">
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="font-medium text-red-800">Badge à supprimer :</p>
                <p className="font-mono text-lg text-red-900">{selectedBadge.codeBadge}</p>
                {selectedBadge.utilisateurId && (
                  <p className="text-sm text-red-600 mt-2">
                    ⚠️ Ce badge est actuellement assigné à l'utilisateur #{selectedBadge.utilisateurId}
                  </p>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowDeleteModal(false);
                setSelectedBadge(null);
              }}
              disabled={isDeleting}
            >
              Annuler
            </Button>
            <Button 
              variant="destructive"
              onClick={async () => {
                if (selectedBadge?.id) {
                  try {
                    await deleteBadge(selectedBadge.id);
                    setShowDeleteModal(false);
                    setSelectedBadge(null);
                  } catch (error) {
                    console.error('Error deleting badge:', error);
                  }
                }
              }}
              disabled={isDeleting}
            >
              {isDeleting ? '⏳ Suppression...' : '🗑️ Supprimer définitivement'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Badge Modal */}
      <AssignBadgeModal
        badge={selectedBadge}
        isOpen={showAssignModal}
        onClose={() => {
          setShowAssignModal(false);
          setSelectedBadge(null);
        }}
        onAssign={handleAssignBadge}
        isAssigning={isAssigning}
      />

      {/* TODO: Implement edit modal */}
    </div>
  );
}