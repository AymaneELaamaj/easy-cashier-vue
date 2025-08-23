import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/DataTable';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useArticles } from '@/hooks/useArticles';
import { ArticleDTO } from '@/types/entities';
import { Search, Plus, Package, ShoppingCart, DollarSign } from 'lucide-react';
// import { CreateArticleModal } from '@/components/articles/CreateArticleModal';
// import { EditArticleModal } from '@/components/articles/EditArticleModal';
// import { DeleteArticleModal } from '@/components/articles/DeleteArticleModal';

export function Articles() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [selectedArticle, setSelectedArticle] = useState<ArticleDTO | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const {
    articles,
    isLoading,
    error,
    createArticle,
    updateArticle,
    deleteArticle,
    isCreating,
    isUpdating,
    isDeleting
  } = useArticles({ page, size: pageSize });

  const handleEdit = (article: ArticleDTO) => {
    setSelectedArticle(article);
    setShowEditModal(true);
  };

  const handleDelete = (article: ArticleDTO) => {
    setSelectedArticle(article);
    setShowDeleteModal(true);
  };

  const filteredArticles = articles?.content?.filter(article =>
    article.nom?.toLowerCase().includes(search.toLowerCase()) ||
    article.description?.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const getStatusColor = (status: boolean) => {
    return status ? 'default' : 'secondary';
  };

  const getAvailabilityColor = (disponible: boolean) => {
    return disponible ? 'default' : 'destructive';
  };

  const columns = [
    {
      key: 'nom',
      header: 'Nom',
      render: (value: any, article: ArticleDTO) => (
        <div className="font-medium">{article.nom}</div>
      ),
    },
    {
      key: 'prix',
      header: 'Prix',
      render: (value: any, article: ArticleDTO) => (
        <div className="font-medium text-success">
          {parseFloat(article.prix).toLocaleString('fr-FR', { 
            style: 'currency', 
            currency: 'MAD' 
          })}
        </div>
      ),
    },
    {
      key: 'description',
      header: 'Description',
      render: (value: any, article: ArticleDTO) => (
        <div className="text-sm text-muted-foreground max-w-xs truncate">
          {article.description || '-'}
        </div>
      ),
    },
    {
      key: 'quantite',
      header: 'Quantité',
      render: (value: any, article: ArticleDTO) => (
        <div className="text-center">{article.quantite || 0}</div>
      ),
    },
    {
      key: 'disponible',
      header: 'Disponibilité',
      render: (value: any, article: ArticleDTO) => (
        <Badge variant={getAvailabilityColor(article.disponible)}>
          {article.disponible ? 'Disponible' : 'Indisponible'}
        </Badge>
      ),
    },
    {
      key: 'status',
      header: 'Statut',
      render: (value: any, article: ArticleDTO) => (
        <Badge variant={getStatusColor(article.status)}>
          {article.status ? 'Actif' : 'Inactif'}
        </Badge>
      ),
    },
    {
      key: 'categorie',
      header: 'Catégorie',
      render: (value: any, article: ArticleDTO) => (
        <div className="text-sm">
          {article.categorie?.libelle || '-'}
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (value: any, article: ArticleDTO) => (
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleEdit(article)}
          >
            Modifier
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDelete(article)}
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
          <h1 className="text-3xl font-bold tracking-tight">Articles</h1>
          <p className="text-muted-foreground">
            Gérez les articles et produits de votre système.
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvel Article
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Articles</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{articles?.totalElements || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Disponibles</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {filteredArticles.filter(a => a.disponible).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valeur Stock</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredArticles.reduce((total, article) => 
                total + (parseFloat(article.prix) * (article.quantite || 0)), 0
              ).toLocaleString('fr-FR', { style: 'currency', currency: 'MAD' })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock Total</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredArticles.reduce((total, article) => total + (article.quantite || 0), 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher des articles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des Articles</CardTitle>
          <CardDescription>
            Gérez tous vos articles et leur disponibilité.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={filteredArticles}
            pagination={{
              page: page,
              size: pageSize,
              total: articles?.totalElements || 0,
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