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
    currency: 'EUR' 
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
    isChangingCategory
  } = useUsers({ page, size: pageSize });

  // Debug logs
  console.log('🔧 Users page state:', {
    users,
    isLoading,
    error,
    page,
    pageSize
  });

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

  const filteredUsers = users?.content?.filter(user =>
    user.prenom?.toLowerCase().includes(search.toLowerCase()) ||
    user.nom?.toLowerCase().includes(search.toLowerCase()) ||
    user.email?.toLowerCase().includes(search.toLowerCase())
  ) || [];

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive">Erreur lors du chargement des utilisateurs</p>
        <Button onClick={() => window.location.reload()} className="mt-4">
          Réessayer
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestion des utilisateurs</h1>
          <p className="text-muted-foreground">
            Gérez les utilisateurs, leurs rôles et leurs soldes
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nouvel utilisateur
        </Button>
      </div>

      {/* Statistiques */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total utilisateurs</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users?.totalElements || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utilisateurs actifs</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users?.content?.filter(u => u.isActive).length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Solde total</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(
                users?.content?.reduce((sum, u) => sum + (u.solde || 0), 0) || 0
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Administrateurs</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users?.content?.filter(u => 
                u.role === UserRole.ADMIN || u.role === UserRole.SUPER_ADMIN
              ).length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres et recherche */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des utilisateurs</CardTitle>
          <CardDescription>
            Recherchez et gérez tous les utilisateurs du système
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom, prénom ou email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner size="lg" />
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