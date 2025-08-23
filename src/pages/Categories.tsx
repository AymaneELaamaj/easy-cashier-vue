import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/DataTable';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useCategories } from '@/hooks/useCategories';
import { CategorieDTO } from '@/types/entities';
import { Search, Plus, Tag, CheckCircle } from 'lucide-react';
import { CreateCategoryModal } from '@/components/categories/CreateCategoryModal';
import { EditCategoryModal } from '@/components/categories/EditCategoryModal';
import { DeleteCategoryModal } from '@/components/categories/DeleteCategoryModal';

export function Categories() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategorieDTO | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const {
    categories,
    isLoading,
    error,
    createCategory,
    updateCategory,
    deleteCategory,
    isCreating,
    isUpdating,
    isDeleting
  } = useCategories();

  const handleEdit = (category: CategorieDTO) => {
    setSelectedCategory(category);
    setShowEditModal(true);
  };

  const handleDelete = (category: CategorieDTO) => {
    setSelectedCategory(category);
    setShowDeleteModal(true);
  };

  const categoriesArray = Array.isArray(categories) ? categories : categories?.content || [];
  const filteredCategories = categoriesArray.filter((category: any) =>
    category.libelle?.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusColor = (statut: boolean) => {
    return statut ? 'default' : 'secondary';
  };

  const columns = [
    {
      key: 'id',
      header: 'ID',
      render: (value: any, category: CategorieDTO) => (
        <div className="font-medium">{category.id}</div>
      ),
    },
    {
      key: 'libelle',
      header: 'Libellé',
      render: (value: any, category: CategorieDTO) => (
        <div className="font-medium">{category.libelle}</div>
      ),
    },
    {
      key: 'odooCategoryId',
      header: 'ID Odoo',
      render: (value: any, category: CategorieDTO) => (
        <div className="text-sm text-muted-foreground">
          {category.odooCategoryId || '-'}
        </div>
      ),
    },
    {
      key: 'statut',
      header: 'Statut',
      render: (value: any, category: CategorieDTO) => (
        <Badge variant={getStatusColor(category.statut)}>
          {category.statut ? 'Actif' : 'Inactif'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (value: any, category: CategorieDTO) => (
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleEdit(category)}
          >
            Modifier
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDelete(category)}
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
          <h1 className="text-3xl font-bold tracking-tight">Catégories</h1>
          <p className="text-muted-foreground">
            Gérez les catégories d'articles de votre système.
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle Catégorie
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Catégories</CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categoriesArray.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Actives</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {filteredCategories.filter(c => c.statut).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avec ID Odoo</CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredCategories.filter(c => c.odooCategoryId).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher des catégories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des Catégories</CardTitle>
          <CardDescription>
            Gérez toutes vos catégories d'articles.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={filteredCategories}
            searchable={false}
          />
        </CardContent>
      </Card>

      {/* TODO: Implement modals when components are ready */}
    </div>
  );
}