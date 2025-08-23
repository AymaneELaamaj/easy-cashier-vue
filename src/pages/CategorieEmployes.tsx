import React, { useState } from 'react';
import { Plus, Search, Edit, Trash2, MoreHorizontal, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/ui/DataTable';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useCategorieEmployes } from '@/hooks/useCategorieEmployes';
import { CategorieEmployesDTO } from '@/types/entities';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import CreateCategoryModal from '@/components/categories/CreateCategoryModal';
import EditCategoryModal from '@/components/categories/EditCategoryModal';
import DeleteCategoryModal from '@/components/categories/DeleteCategoryModal';

export function CategorieEmployes() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [selectedCategory, setSelectedCategory] = useState<CategorieEmployesDTO | null>(null);
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
  } = useCategorieEmployes({ page, size: pageSize });

  const handleEdit = (category: CategorieEmployesDTO) => {
    setSelectedCategory(category);
    setShowEditModal(true);
  };

  const handleDelete = (category: CategorieEmployesDTO) => {
    setSelectedCategory(category);
    setShowDeleteModal(true);
  };

  const columns = [
    {
      key: 'id',
      header: 'ID',
      render: (value: any, category: CategorieEmployesDTO) => (
        <span className="font-mono text-sm">{category.id}</span>
      ),
    },
    {
      key: 'cadre',
      header: 'Catégorie',
      render: (value: any, category: CategorieEmployesDTO) => (
        <div className="font-medium">{category.cadre}</div>
      ),
    },
    {
      key: 'dateCreation',
      header: 'Date de création',
      render: (value: any, category: CategorieEmployesDTO) => (
        <span className="text-sm text-muted-foreground">
          {category.dateCreation ? new Date(category.dateCreation).toLocaleDateString('fr-FR') : '-'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (value: any, category: CategorieEmployesDTO) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => handleEdit(category)}>
              <Edit className="mr-2 h-4 w-4" />
              Modifier
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => handleDelete(category)}
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

  const filteredCategories = categories?.content?.filter(category =>
    category.cadre?.toLowerCase().includes(search.toLowerCase())
  ) || [];

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive">Erreur lors du chargement des catégories</p>
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
          <h1 className="text-3xl font-bold tracking-tight">Catégories Employés</h1>
          <p className="text-muted-foreground">
            Gérez les catégories d'employés pour l'organisation
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nouvelle catégorie
        </Button>
      </div>

      {/* Statistiques */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total catégories</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categories?.totalElements || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pages</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categories?.totalPages || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Catégories visibles</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredCategories.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Liste des catégories */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des catégories</CardTitle>
          <CardDescription>
            Recherchez et gérez toutes les catégories d'employés
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom de catégorie..."
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
              data={filteredCategories}
              pagination={{
                page: page,
                size: pageSize,
                total: categories?.totalElements || 0,
                onPageChange: setPage,
                onSizeChange: setPageSize,
              }}
              searchable={false}
            />
          )}
        </CardContent>
      </Card>

      {/* Modales */}
      <CreateCategoryModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => setShowCreateModal(false)}
        createCategory={(cadre) => createCategory(cadre).then(() => {})}
        isCreating={isCreating}
      />

      {selectedCategory && (
        <>
          <EditCategoryModal
            open={showEditModal}
            onClose={() => {
              setShowEditModal(false);
              setSelectedCategory(null);
            }}
            category={selectedCategory}
            onSuccess={() => {
              setShowEditModal(false);
              setSelectedCategory(null);
            }}
            updateCategory={(id, cadre) => updateCategory({ id, cadre }).then(() => {})}
            isUpdating={isUpdating}
          />

          <DeleteCategoryModal
            open={showDeleteModal}
            onClose={() => {
              setShowDeleteModal(false);
              setSelectedCategory(null);
            }}
            category={selectedCategory}
            onSuccess={() => {
              setShowDeleteModal(false);
              setSelectedCategory(null);
            }}
            deleteCategory={(id) => deleteCategory(id).then(() => {})}
            isDeleting={isDeleting}
          />
        </>
      )}
    </div>
  );
}

export default CategorieEmployes;