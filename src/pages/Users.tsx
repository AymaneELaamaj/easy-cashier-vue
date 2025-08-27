import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, UserPlus, Wallet, RefreshCw, Edit, Trash2, MoreHorizontal,
  Filter, BarChart3, Download, Shield, Key, CreditCard, Users as UsersIcon,
  AlertCircle, Activity, TrendingUp, Calendar, Eye, EyeOff, UserCheck, UserX,
  Settings, Target, DollarSign, Award, Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/DataTable';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useUsers } from '@/hooks/useUsers';
import { usersAPI } from '@/services/api/users.api';
import { UtilisateurResponse } from '@/types/entities';
import { UserRole } from '@/types/api';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { 
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger 
} from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import CreateUserModal from '@/components/users/CreateUserModal';
import EditUserModal from '@/components/users/EditUserModal';
import DeleteUserModal from '@/components/users/DeleteUserModal';
import toast from 'react-hot-toast';

const getRoleColor = (role: string) => {
  switch (role) {
    case UserRole.SUPER_ADMIN:
      return 'destructive'; // Rouge pour Super Admin
    case UserRole.ADMIN:
      return 'secondary'; // Orange pour Admin
    case UserRole.CAISSIER:
      return 'default'; // Bleu pour Caissier
    case UserRole.EMPLOYE:
      return 'outline'; // Vert pour Employé
    default:
      return 'secondary';
  }
};

const getRoleColorClass = (role: string) => {
  switch (role) {
    case UserRole.SUPER_ADMIN:
      return 'role-super-admin';
    case UserRole.ADMIN:
      return 'role-admin';
    case UserRole.CAISSIER:
      return 'role-caissier';
    case UserRole.EMPLOYE:
      return 'role-employe';
    default:
      return 'role-default';
  }
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('fr-FR', { 
    style: 'currency', 
    currency: 'MAD' 
  }).format(amount);
};

export function Users() {
  // Base state
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [activeTab, setActiveTab] = useState<'all' | 'search' | 'statistics' | 'admin'>('all');
  
  // Modal states
  const [selectedUser, setSelectedUser] = useState<UtilisateurResponse | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Search and Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<UserRole | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [searchResults, setSearchResults] = useState<UtilisateurResponse[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Statistics state
  const [statistics, setStatistics] = useState<Record<string, unknown> | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  // Administrative states
  const [deductionAmount, setDeductionAmount] = useState<number>(0);
  const [deductionUser, setDeductionUser] = useState<UtilisateurResponse | null>(null);
  const [isDeductionModalOpen, setIsDeductionModalOpen] = useState(false);
  const [passwordResetUser, setPasswordResetUser] = useState<UtilisateurResponse | null>(null);
  const [isPasswordResetModalOpen, setIsPasswordResetModalOpen] = useState(false);

  // Hook for users data
  const {
    users,
    isLoading,
    error,
    createUser,
    updateUser,
    deleteUser,
    toggleStatus,
    deductBalance,
    isCreating,
    isUpdating,
    isDeleting,
    isTogglingStatus,
    isDeductingBalance,
    refetch
  } = useUsers({ page, size: pageSize });

  // Get users data with safe fallback
  const usersContent = users?.content || [];

  // Load statistics when tab changes
  useEffect(() => {
    if (activeTab === 'statistics' && !statistics) {
      loadStatistics();
    }
  }, [activeTab, statistics]);

  const loadStatistics = async () => {
    setIsLoadingStats(true);
    try {
      const stats = await usersAPI.getUserStatistics();
      setStatistics(stats);
    } catch (error) {
      toast.error('Erreur lors du chargement des statistiques');
    } finally {
      setIsLoadingStats(false);
    }
  };

  // Advanced search function
  const handleAdvancedSearch = async () => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const results = await usersAPI.searchUsers(searchTerm);
      setSearchResults(results.content || []);
      toast.success(`${results.content?.length || 0} utilisateur(s) trouvé(s)`);
    } catch (error) {
      toast.error('Erreur lors de la recherche');
    } finally {
      setIsSearching(false);
    }
  };

  // Filter users by role
  const loadUsersByRole = async (role: UserRole) => {
    setIsSearching(true);
    try {
      const results = await usersAPI.getUsersByRole(role);
      setSearchResults(results.content || []);
      toast.success(`${results.content?.length || 0} utilisateur(s) avec le rôle ${role}`);
    } catch (error) {
      toast.error('Erreur lors du filtrage par rôle');
    } finally {
      setIsSearching(false);
    }
  };

  // Load special user lists
  const loadActiveUsers = async () => {
    setIsSearching(true);
    try {
      const results = await usersAPI.getActiveUsers();
      setSearchResults(results.content || []);
      toast.success(`${results.content?.length || 0} utilisateur(s) actif(s)`);
    } catch (error) {
      toast.error('Erreur lors du chargement des utilisateurs actifs');
    } finally {
      setIsSearching(false);
    }
  };

  const loadUsersWithLowBalance = async () => {
    setIsSearching(true);
    try {
      const results = await usersAPI.getUsersWithLowBalance(10);
      setSearchResults(results.content || []);
      toast.success(`${results.content?.length || 0} utilisateur(s) avec solde faible`);
    } catch (error) {
      toast.error('Erreur lors du chargement des utilisateurs avec solde faible');
    } finally {
      setIsSearching(false);
    }
  };

  const loadUsersWithoutBadge = async () => {
    setIsSearching(true);
    try {
      const results = await usersAPI.getUsersWithoutBadge();
      setSearchResults(results);
      toast.success(`${results.length} utilisateur(s) sans badge`);
    } catch (error) {
      toast.error('Erreur lors du chargement des utilisateurs sans badge');
    } finally {
      setIsSearching(false);
    }
  };

  // Handle actions
  const handleEdit = (user: UtilisateurResponse) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  const handleDelete = (user: UtilisateurResponse) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const handleToggleStatus = async (user: UtilisateurResponse) => {
    try {
      await toggleStatus({ userId: user.id!, isActive: !user.isActive });
      toast.success(`Utilisateur ${user.isActive ? 'désactivé' : 'activé'} avec succès`);
    } catch (error) {
      toast.error('Erreur lors du changement de statut');
    }
  };

  // Handle balance deduction
  const handleDeductBalance = async () => {
    if (!deductionUser || deductionAmount <= 0) return;

    try {
      await deductBalance({
        userId: deductionUser.id!,
        amount: deductionAmount,
        reason: 'Déduction manuelle depuis l\'interface admin'
      });
      toast.success(`${deductionAmount}€ déduits du solde de ${deductionUser.nom}`);
      setIsDeductionModalOpen(false);
      setDeductionUser(null);
      setDeductionAmount(0);
    } catch (error) {
      toast.error('Erreur lors de la déduction du solde');
    }
  };

  // Handle password reset
  const handlePasswordReset = async () => {
    if (!passwordResetUser) return;

    try {
      await usersAPI.resetPassword(passwordResetUser.id!.toString());
      toast.success(`Mot de passe réinitialisé pour ${passwordResetUser.nom}`);
      setIsPasswordResetModalOpen(false);
      setPasswordResetUser(null);
    } catch (error) {
      toast.error('Erreur lors de la réinitialisation du mot de passe');
    }
  };

  // Table columns - adapted for DataTable component
  const columns = [
    {
      key: 'nom',
      header: 'Nom complet',
      render: (_value: unknown, user: UtilisateurResponse) => (
        <div>
          <div className="font-medium">{user.prenom} {user.nom}</div>
          <div className="text-sm text-muted-foreground">{user.email}</div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Rôle',
      render: (_value: unknown, user: UtilisateurResponse) => (
        <Badge className={getRoleColorClass(user.role)}>
          {user.role}
        </Badge>
      ),
    },
    {
      key: 'cadre',
      header: 'Catégorie',
      render: (_value: unknown, user: UtilisateurResponse) => (
        <span className="text-sm">{user.cadre || 'Non définie'}</span>
      ),
    },
    {
      key: 'solde',
      header: 'Solde',
      render: (_value: unknown, user: UtilisateurResponse) => (
        <span className={`font-medium ${user.solde && user.solde >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {formatCurrency(user.solde || 0)}
        </span>
      ),
    },
    {
      key: 'isActive',
      header: 'Statut',
      render: (_value: unknown, user: UtilisateurResponse) => (
        <Badge variant={user.isActive ? 'default' : 'secondary'}>
          {user.isActive ? 'Actif' : 'Inactif'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (_value: unknown, user: UtilisateurResponse) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              className="h-8 w-8 p-0"
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              <span className="sr-only">Ouvrir le menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            
            <DropdownMenuItem 
              onClick={(e) => {
                e.stopPropagation();
                handleEdit(user);
              }}
              className="cursor-pointer"
            >
              <Edit className="mr-2 h-4 w-4" />
              Modifier
            </DropdownMenuItem>
            
            <DropdownMenuItem 
              onClick={(e) => {
                e.stopPropagation();
                handleToggleStatus(user);
              }}
              className={`cursor-pointer ${user.isActive ? 'text-red-600 focus:text-red-700' : 'text-green-600 focus:text-green-700'}`}
            >
              {user.isActive ? (
                <>
                  <EyeOff className="mr-2 h-4 w-4" />
                  Désactiver
                </>
              ) : (
                <>
                  <Eye className="mr-2 h-4 w-4" />
                  Activer
                </>
              )}
            </DropdownMenuItem>
            
            <DropdownMenuItem 
              onClick={(e) => {
                e.stopPropagation();
                setDeductionUser(user);
                setIsDeductionModalOpen(true);
              }}
              className="cursor-pointer"
            >
              <Wallet className="mr-2 h-4 w-4" />
              Déduire solde
            </DropdownMenuItem>
            
            <DropdownMenuItem 
              onClick={(e) => {
                e.stopPropagation();
                setPasswordResetUser(user);
                setIsPasswordResetModalOpen(true);
              }}
              className="cursor-pointer"
            >
              <Key className="mr-2 h-4 w-4" />
              Réinitialiser mot de passe
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem 
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(user);
              }}
              className="cursor-pointer text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Supprimer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  // Get current users to display
  const getCurrentUsers = () => {
    if (activeTab === 'search' && searchResults.length > 0) {
      return searchResults;
    }
    return usersContent;
  };

  // Filter current users based on local filters
  const getFilteredUsers = () => {
    let filtered = getCurrentUsers();

    if (filterRole !== 'all') {
      filtered = filtered.filter(user => user.role === filterRole);
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(user => 
        filterStatus === 'active' ? user.isActive : !user.isActive
      );
    }

    return filtered;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-red-600">
              <AlertCircle className="h-12 w-12 mx-auto mb-4" />
              <p>Erreur lors du chargement des utilisateurs</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => refetch && refetch()}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Réessayer
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestion des utilisateurs</h1>
          <p className="text-muted-foreground">
            Gérez tous vos utilisateurs avec des outils avancés de recherche et d'administration
          </p>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            onClick={() => refetch && refetch()}
            disabled={isLoading}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nouvel utilisateur
          </Button>
        </div>
      </div>

      {/* Quick Statistics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total utilisateurs</CardTitle>
            <UsersIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users?.totalElements || 0}</div>
            <p className="text-xs text-muted-foreground">
              Tous les utilisateurs du système
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utilisateurs actifs</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {usersContent.filter((u: UtilisateurResponse) => u.isActive).length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Comptes activés et fonctionnels
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Solde total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(
                usersContent.reduce((sum: number, u: UtilisateurResponse) => sum + (u.solde || 0), 0) || 0
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Somme de tous les soldes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Soldes faibles</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {usersContent.filter((u: UtilisateurResponse) => 
                u.solde !== undefined && u.solde < 10
              ).length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Utilisateurs avec moins de 10€
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content with Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'all' | 'search' | 'statistics' | 'admin')} className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">Tous les utilisateurs</TabsTrigger>
          <TabsTrigger value="search">Recherche avancée</TabsTrigger>
          <TabsTrigger value="statistics">Statistiques</TabsTrigger>
          <TabsTrigger value="admin">Administration</TabsTrigger>
        </TabsList>

        {/* All Users Tab */}
        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Liste des utilisateurs</CardTitle>
                  <CardDescription>
                    Gérez tous les utilisateurs du système
                  </CardDescription>
                </div>
                <div className="flex space-x-2">
                  <Select 
                    value={filterStatus} 
                    onValueChange={(value) => setFilterStatus(value as 'all' | 'active' | 'inactive')}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Statut" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous</SelectItem>
                      <SelectItem value="active">Actifs</SelectItem>
                      <SelectItem value="inactive">Inactifs</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select 
                    value={filterRole} 
                    onValueChange={(value) => setFilterRole(value as UserRole | 'all')}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Rôle" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les rôles</SelectItem>
                      <SelectItem value={UserRole.SUPER_ADMIN}>Super Admin</SelectItem>
                      <SelectItem value={UserRole.ADMIN}>Admin</SelectItem>
                      <SelectItem value={UserRole.CAISSIER}>Caissier</SelectItem>
                      <SelectItem value={UserRole.EMPLOYE}>Employé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {getFilteredUsers().length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <UsersIcon className="h-16 w-16 text-muted-foreground" />
                  <div className="text-lg font-semibold">Aucun utilisateur trouvé</div>
                  <div className="text-muted-foreground text-center max-w-md">
                    {usersContent.length === 0 
                      ? "Commencez par créer votre premier utilisateur"
                      : "Aucun utilisateur ne correspond aux filtres appliqués"
                    }
                  </div>
                  {usersContent.length === 0 && (
                    <Button onClick={() => setShowCreateModal(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Créer le premier utilisateur
                    </Button>
                  )}
                </div>
              ) : (
                <DataTable
                  columns={columns}
                  data={getFilteredUsers()}
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
        </TabsContent>

        {/* Advanced Search Tab */}
        <TabsContent value="search" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Text Search */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recherche par texte</CardTitle>
                <CardDescription>Rechercher par nom, email ou autres champs</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex space-x-2">
                  <Input
                    placeholder="Terme de recherche..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAdvancedSearch()}
                  />
                  <Button 
                    onClick={handleAdvancedSearch}
                    disabled={isSearching || !searchTerm.trim()}
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Filter by Role */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Filtrer par rôle</CardTitle>
                <CardDescription>Afficher uniquement un type d'utilisateur</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-2">
                  <Button
                    variant="outline"
                    onClick={() => loadUsersByRole(UserRole.ADMIN)}
                    disabled={isSearching}
                    className="justify-start"
                  >
                    <Shield className="mr-2 h-4 w-4" />
                    Administrateurs
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => loadUsersByRole(UserRole.CAISSIER)}
                    disabled={isSearching}
                    className="justify-start"
                  >
                    <CreditCard className="mr-2 h-4 w-4" />
                    Caissiers
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => loadUsersByRole(UserRole.EMPLOYE)}
                    disabled={isSearching}
                    className="justify-start"
                  >
                    <UserCheck className="mr-2 h-4 w-4" />
                    Employés
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Special Lists */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Listes spéciales</CardTitle>
                <CardDescription>Filtres prédéfinis pour des besoins spécifiques</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-2">
                  <Button
                    variant="outline"
                    onClick={loadActiveUsers}
                    disabled={isSearching}
                    className="justify-start"
                  >
                    <Activity className="mr-2 h-4 w-4" />
                    Utilisateurs actifs
                  </Button>
                  <Button
                    variant="outline"
                    onClick={loadUsersWithLowBalance}
                    disabled={isSearching}
                    className="justify-start"
                  >
                    <AlertCircle className="mr-2 h-4 w-4" />
                    Soldes faibles
                  </Button>
                  <Button
                    variant="outline"
                    onClick={loadUsersWithoutBadge}
                    disabled={isSearching}
                    className="justify-start"
                  >
                    <Award className="mr-2 h-4 w-4" />
                    Sans badge
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search Results */}
          {(searchResults.length > 0 || isSearching) && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Résultats de recherche</CardTitle>
                    <CardDescription>
                      {isSearching 
                        ? "Recherche en cours..." 
                        : `${searchResults.length} utilisateur(s) trouvé(s)`
                      }
                    </CardDescription>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={() => setSearchResults([])}
                    disabled={isSearching}
                  >
                    Effacer
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isSearching ? (
                  <div className="flex justify-center py-8">
                    <LoadingSpinner />
                  </div>
                ) : searchResults.length > 0 ? (
                  <DataTable
                    columns={columns}
                    data={searchResults}
                    searchable={false}
                  />
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Aucun résultat trouvé
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Statistics Tab */}
        <TabsContent value="statistics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="mr-2 h-5 w-5" />
                  Répartition par rôle
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.values(UserRole).map(role => {
                    const count = usersContent.filter(u => u.role === role).length;
                    const percentage = usersContent.length > 0 ? (count / usersContent.length * 100).toFixed(1) : '0';
                    
                    return (
                      <div key={role} className="flex items-center justify-between">
                        <Badge className={getRoleColor(role)}>{role}</Badge>
                        <div className="text-sm">
                          {count} ({percentage}%)
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="mr-2 h-5 w-5" />
                  Analyse des soldes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Solde moyen:</span>
                    <span className="font-medium">
                      {formatCurrency(
                        usersContent.length > 0 
                          ? usersContent.reduce((sum, u) => sum + (u.solde || 0), 0) / usersContent.length 
                          : 0
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Solde le plus élevé:</span>
                    <span className="font-medium">
                      {formatCurrency(
                        Math.max(...usersContent.map(u => u.solde || 0), 0)
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Utilisateurs avec solde {'>'}50€:</span>
                    <span className="font-medium">
                      {usersContent.filter(u => (u.solde || 0) > 50).length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Utilisateurs avec solde {'<'}10€:</span>
                    <span className="font-medium text-red-600">
                      {usersContent.filter(u => (u.solde || 0) < 10).length}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Load detailed statistics */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Statistiques détaillées</CardTitle>
                <Button 
                  onClick={loadStatistics}
                  disabled={isLoadingStats}
                  variant="outline"
                >
                  {isLoadingStats ? (
                    <LoadingSpinner />
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Charger
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {statistics ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {Object.entries(statistics).map(([key, value]) => (
                    <div key={key} className="p-4 border rounded-lg">
                      <div className="text-sm text-muted-foreground">{key}</div>
                      <div className="text-2xl font-bold">{String(value)}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Cliquez sur "Charger" pour voir les statistiques détaillées
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Admin Tab */}
        <TabsContent value="admin" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Bulk Operations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="mr-2 h-5 w-5" />
                  Opérations en masse
                </CardTitle>
                <CardDescription>
                  Effectuer des actions sur plusieurs utilisateurs
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={loadActiveUsers}
                >
                  <UserCheck className="mr-2 h-4 w-4" />
                  Voir tous les utilisateurs actifs
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={loadUsersWithLowBalance}
                >
                  <AlertCircle className="mr-2 h-4 w-4" />
                  Utilisateurs avec solde faible
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={loadUsersWithoutBadge}
                >
                  <Award className="mr-2 h-4 w-4" />
                  Utilisateurs sans badge
                </Button>
              </CardContent>
            </Card>

            {/* System Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="mr-2 h-5 w-5" />
                  Informations système
                </CardTitle>
                <CardDescription>
                  Vue d'ensemble du système d'utilisateurs
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span>Dernière mise à jour:</span>
                  <span className="text-sm text-muted-foreground">
                    <Clock className="inline mr-1 h-3 w-3" />
                    {new Date().toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Total pages:</span>
                  <span>{users?.totalPages || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Page actuelle:</span>
                  <span>{(users?.number || 0) + 1}</span>
                </div>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => refetch && refetch()}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Actualiser les données
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <CreateUserModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => setShowCreateModal(false)}
        createUser={async (data) => { 
          await createUser(data); 
        }}
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
            updateUser={async (id, data) => { 
              await updateUser({ id, data }); 
            }}
            isUpdating={isUpdating}
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
            deleteUser={(id) => deleteUser(id)}
            isDeleting={isDeleting}
          />
        </>
      )}

      {/* Balance Deduction Modal */}
      <Dialog open={isDeductionModalOpen} onOpenChange={setIsDeductionModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Déduire du solde</DialogTitle>
            <DialogDescription>
              Déduire un montant du solde de {deductionUser?.prenom} {deductionUser?.nom}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="amount">Montant à déduire (€)</Label>
              <Input
                id="amount"
                type="number"
                min="0"
                step="0.01"
                value={deductionAmount}
                onChange={(e) => setDeductionAmount(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
              />
            </div>
            <div className="p-3 bg-muted rounded-md">
              <div className="text-sm">
                <div>Solde actuel: <strong>{formatCurrency(deductionUser?.solde || 0)}</strong></div>
                <div>Nouveau solde: <strong>{formatCurrency((deductionUser?.solde || 0) - deductionAmount)}</strong></div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsDeductionModalOpen(false);
                setDeductionUser(null);
                setDeductionAmount(0);
              }}
            >
              Annuler
            </Button>
            <Button 
              onClick={handleDeductBalance}
              disabled={deductionAmount <= 0 || isDeductingBalance}
            >
              {isDeductingBalance ? "Déduction..." : "Déduire"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Password Reset Modal */}
      <Dialog open={isPasswordResetModalOpen} onOpenChange={setIsPasswordResetModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Réinitialiser le mot de passe</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir réinitialiser le mot de passe de {passwordResetUser?.prenom} {passwordResetUser?.nom} ?
            </DialogDescription>
          </DialogHeader>
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-800">
              <strong>Attention:</strong> Cette action générera un nouveau mot de passe temporaire 
              qui sera envoyé à l'utilisateur par email.
            </p>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsPasswordResetModalOpen(false);
                setPasswordResetUser(null);
              }}
            >
              Annuler
            </Button>
            <Button onClick={handlePasswordReset}>
              Réinitialiser
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default Users;
