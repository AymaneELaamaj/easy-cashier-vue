import React, { useState } from 'react';
import { Plus, Search, UserPlus, Wallet, RefreshCw, Edit, Trash2, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/DataTable';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useUsers } from '@/hooks/useUsers';
import { UtilisateurDTO } from '@/types/entities';
import { UserRole } from '@/types/api';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import CreateUserModal from '@/components/users/CreateUserModal';
import EditUserModal from '@/components/users/EditUserModal';
import ChargeBalanceModal from '@/components/users/ChargeBalanceModal';
import ChangeCategoryModal from '@/components/users/ChangeCategoryModal';
import DeleteUserModal from '@/components/users/DeleteUserModal';

const getRoleColor = (role: string) => {
  switch (role) {
    case UserRole.SUPER_ADMIN:
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
    case UserRole.ADMIN:
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
    case UserRole.CAISSIER:
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    case UserRole.EMPLOYE:
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
  }
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('fr-FR', { 
    style: 'currency', 
    currency: 'MAD' 
  }).format(amount);
};

export function Users() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [selectedUser, setSelectedUser] = useState<UtilisateurDTO | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showChargeModal, setShowChargeModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const {
    users,
    isLoading,
    error,
    createUser,
    updateUser,
    deleteUser,
    chargeBalance,
    initializeBalance,
    changeCategory,
    isCreating,
    isUpdating,
    isDeleting,
    isChargingBalance,
    isInitializingBalance,
    isChangingCategory,
    refetch
  } = useUsers({ page, size: pageSize });

  // Debug logs améliorés
  console.log('🔍 Users data:', users);
  console.log('🔍 Users type:', typeof users);
  console.log('🔍 Users content:', users?.content);
  console.log('🔍 Is loading:', isLoading);
  console.log('🔍 Error:', error);

  const handleEdit = (user: UtilisateurDTO) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  const handleChargeBalance = (user: UtilisateurDTO) => {
    setSelectedUser(user);
    setShowChargeModal(true);
  };

  const handleChangeCategory = (user: UtilisateurDTO) => {
    setSelectedUser(user);
    setShowCategoryModal(true);
  };

  const handleDelete = (user: UtilisateurDTO) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const handleInitializeBalance = async (user: UtilisateurDTO) => {
    if (confirm(`Êtes-vous sûr de vouloir initialiser le solde de ${user.prenom} ${user.nom} ?`)) {
      await initializeBalance(user.id);
    }
  };

  const columns = [
    {
      key: 'id',
      header: 'ID',
      render: (value: any, user: UtilisateurDTO) => (
        <span className="font-mono text-sm">{user.id}</span>
      ),
    },
    {
      key: 'nom',
      header: 'Nom complet',
      render: (value: any, user: UtilisateurDTO) => (
        <div>
          <div className="font-medium">{user.prenom} {user.nom}</div>
          <div className="text-sm text-muted-foreground">{user.email}</div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Rôle',
      render: (value: any, user: UtilisateurDTO) => (
        <Badge className={getRoleColor(user.role)}>
          {user.role}
        </Badge>
      ),
    },
    {
      key: 'cadre',
      header: 'Catégorie',
      render: (value: any, user: UtilisateurDTO) => (
        <span className="text-sm">{user.categorieEmployes?.cadre || 'Non définie'}</span>
      ),
    },
    {
      key: 'solde',
      header: 'Solde',
      render: (value: any, user: UtilisateurDTO) => (
        <span className={`font-medium ${user.solde >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {formatCurrency(user.solde || 0)}
        </span>
      ),
    },
    {
      key: 'isActive',
      header: 'Statut',
      render: (value: any, user: UtilisateurDTO) => (
        <Badge variant={user.isActive ? 'default' : 'secondary'}>
          {user.isActive ? 'Actif' : 'Inactif'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (value: any, user: UtilisateurDTO) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => handleEdit(user)}>
              <Edit className="mr-2 h-4 w-4" />
              Modifier
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleChargeBalance(user)}>
              <Wallet className="mr-2 h-4 w-4" />
              Charger le solde
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleInitializeBalance(user)}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Initialiser le solde
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleChangeCategory(user)}>
              <UserPlus className="mr-2 h-4 w-4" />
              Changer catégorie
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => handleDelete(user)}
              className="text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Supprimer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  // Gestion sécurisée des utilisateurs avec fallback
  const usersContent = users?.content || [];
  
  const filteredUsers = usersContent.filter((user: any) =>
    user.prenom?.toLowerCase().includes(search.toLowerCase()) ||
    user.nom?.toLowerCase().includes(search.toLowerCase()) ||
    user.email?.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) return <LoadingSpinner />;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="text-destructive text-lg font-semibold">
          Erreur lors du chargement des utilisateurs
        </div>
        <div className="text-muted-foreground text-center max-w-md">
          {error.message || 'Une erreur inattendue s\'est produite'}
        </div>
        <Button onClick={() => window.location.reload()}>
          Réessayer
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gestion des utilisateurs</h1>
          <p className="text-sm text-muted-foreground">
            Gérez les utilisateurs, leurs rôles et leurs soldes
          </p>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => refetch && refetch()}
            disabled={isLoading}
          >
            <Search className="h-4 w-4 mr-2" />
            {isLoading ? 'Chargement...' : 'Recharger'}
          </Button>
          <Button size="sm" onClick={() => setShowCreateModal(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nouvel utilisateur
          </Button>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid gap-3 grid-cols-4">
        <Card className="py-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3">
            <CardTitle className="text-xs font-medium">Total utilisateurs</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pb-3">
            <div className="text-xl font-bold">{users?.totalElements || 0}</div>
          </CardContent>
        </Card>

        <Card className="py-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3">
            <CardTitle className="text-xs font-medium">Utilisateurs actifs</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pb-3">
            <div className="text-xl font-bold">
              {usersContent.filter((u: any) => u.isActive).length || 0}
            </div>
          </CardContent>
        </Card>

        <Card className="py-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3">
            <CardTitle className="text-xs font-medium">Solde total</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pb-3">
            <div className="text-xl font-bold">
              {formatCurrency(
                usersContent.reduce((sum: number, u: any) => sum + (u.solde || 0), 0) || 0
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="py-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3">
            <CardTitle className="text-xs font-medium">Administrateurs</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pb-3">
            <div className="text-xl font-bold">
              {usersContent.filter((u: any) => 
                u.role === UserRole.ADMIN || u.role === UserRole.SUPER_ADMIN
              ).length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recherche */}
      <div className="flex items-center">
        <div className="relative w-80">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom, prénom ou email..."
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
              <CardTitle className="text-lg">Liste des utilisateurs</CardTitle>
              <CardDescription className="text-sm">
                Recherchez et gérez tous les utilisateurs du système
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pb-4">
          {usersContent.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <UserPlus className="h-16 w-16 text-muted-foreground" />
              <div className="text-lg font-semibold">Aucun utilisateur trouvé</div>
              <div className="text-muted-foreground text-center max-w-md">
                Commencez par créer votre premier utilisateur en cliquant sur "Nouvel utilisateur"
              </div>
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Créer le premier utilisateur
              </Button>
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={filteredUsers}
              pagination={{
                page: page,
                size: pageSize,
                total: users?.totalElements || 0,
                onPageChange: setPage,
                onSizeChange: setPageSize,
              }}
              searchable={false}
            />
          )}
        </CardContent>
      </Card>

      {/* Modales */}
      <CreateUserModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => setShowCreateModal(false)}
        createUser={(data) => createUser(data).then(() => {})}
        isCreating={isCreating}
      />

      {selectedUser && (
        <>
          <EditUserModal
            open={showEditModal}
            onClose={() => {
              setShowEditModal(false);
              setSelectedUser(null);
            }}
            user={selectedUser}
            onSuccess={() => {
              setShowEditModal(false);
              setSelectedUser(null);
            }}
            updateUser={(id, data) => updateUser({ id, data }).then(() => {})}
            isUpdating={isUpdating}
          />

          <ChargeBalanceModal
            open={showChargeModal}
            onClose={() => {
              setShowChargeModal(false);
              setSelectedUser(null);
            }}
            user={selectedUser}
            onSuccess={() => {
              setShowChargeModal(false);
              setSelectedUser(null);
            }}
            chargeBalance={(userId, amount) => chargeBalance({ userId, amount }).then(() => {})}
            isCharging={isChargingBalance}
          />

          <ChangeCategoryModal
            open={showCategoryModal}
            onClose={() => {
              setShowCategoryModal(false);
              setSelectedUser(null);
            }}
            user={selectedUser}
            onSuccess={() => {
              setShowCategoryModal(false);
              setSelectedUser(null);
            }}
            changeCategory={(userId, cadre) => changeCategory({ userId, cadre }).then(() => {})}
            isChanging={isChangingCategory}
          />

          <DeleteUserModal
            open={showDeleteModal}
            onClose={() => {
              setShowDeleteModal(false);
              setSelectedUser(null);
            }}
            user={selectedUser}
            onSuccess={() => {
              setShowDeleteModal(false);
              setSelectedUser(null);
            }}
            deleteUser={(id) => deleteUser(id).then(() => {})}
            isDeleting={isDeleting}
          />
        </>
      )}
    </div>
  );
}

export default Users;