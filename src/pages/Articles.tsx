import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/DataTable';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useArticles } from '@/hooks/useArticles';
import { useAuth } from '@/hooks/useAuth';
import { ArticleDTO } from '@/types/entities';
import { Search, Plus, Package, ShoppingCart, DollarSign } from 'lucide-react';
import { CreateArticleModal } from '@/components/articles/CreateArticleModal';
import { EditArticleModal } from '@/components/articles/EditArticleModal';
import { DeleteArticleModal } from '@/components/articles/DeleteArticleModal';

export function Articles() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [selectedArticle, setSelectedArticle] = useState<ArticleDTO | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Hook d'authentification pour vérifier les rôles
  const { isAdmin, isSuperAdmin } = useAuth();
  
  // Vérifier si l'utilisateur peut gérer les articles (seulement ADMIN et SUPER_ADMIN)
  const canManageArticles = isAdmin || isSuperAdmin;

  const {
    articles,
    isLoading,
    error,
    createArticle,
    updateArticle,
    deleteArticle,
    isCreating,
    isUpdating,
    isDeleting,
    refetch
  } = useArticles({ page, size: pageSize });

  const handleEdit = (article: ArticleDTO) => {
    setSelectedArticle(article);
    setShowEditModal(true);
  };

  const handleDelete = (article: ArticleDTO) => {
    setSelectedArticle(article);
    setShowDeleteModal(true);
  };

  // Gestion sécurisée des articles avec fallback pour les données vides
  const articlesContent = articles?.content || [];
  
  const filteredArticles = articlesContent.filter(article =>
    article.nom?.toLowerCase().includes(search.toLowerCase()) ||
    article.description?.toLowerCase().includes(search.toLowerCase())
  );

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
      render: (value: unknown, article: ArticleDTO) => (
        <div className="font-medium">{article.nom}</div>
      ),
    },
    {
      key: 'prix',
      header: 'Prix',
      render: (value: unknown, article: ArticleDTO) => (
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
      render: (value: unknown, article: ArticleDTO) => (
        <div className="text-sm text-muted-foreground max-w-xs truncate">
          {article.description || '-'}
        </div>
      ),
    },
    {
      key: 'quantite',
      header: 'Quantité',
      render: (value: unknown, article: ArticleDTO) => (
        <div className="text-center">{article.quantite || 0}</div>
      ),
    },
    {
      key: 'disponible',
      header: 'Disponibilité',
      render: (value: unknown, article: ArticleDTO) => (
        <Badge variant={getAvailabilityColor(article.disponible)}>
          {article.disponible ? 'Disponible' : 'Indisponible'}
        </Badge>
      ),
    },
    {
      key: 'status',
      header: 'Statut',
      render: (value: unknown, article: ArticleDTO) => (
        <Badge variant={getStatusColor(article.status)}>
          {article.status ? 'Actif' : 'Inactif'}
        </Badge>
      ),
    },
    {
      key: 'categorie',
      header: 'Catégorie',
      render: (value: unknown, article: ArticleDTO) => (
        <div className="text-sm">
          {(article as any).categorie?.libelle || '-'}
        </div>
      ),
    },
    // Colonne Actions - masquée pour les employés et caissiers
    ...(canManageArticles ? [{
      key: 'actions',
      header: 'Actions',
      render: (value: unknown, article: ArticleDTO) => (
        <div className="flex space-x-1">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleEdit(article)}
            className="h-7 px-2 text-xs"
          >
            Modifier
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => handleDelete(article)}
            className="h-7 px-2 text-xs"
          >
            Supprimer
          </Button>
        </div>
      ),
    }] : []),
  ];

  if (isLoading) return <LoadingSpinner />;
  
  // Gestion des erreurs avec plus de détails
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <div className="text-destructive text-lg font-semibold">
          Erreur lors du chargement des articles
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
      {/* Header compact */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Articles</h1>
          <p className="text-sm text-muted-foreground">
            {canManageArticles ? 'Gérez les articles et produits de votre système.' : 'Consultez les articles disponibles.'}
          </p>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <Search className="h-4 w-4 mr-2" />
            {isLoading ? 'Chargement...' : 'Recharger'}
          </Button>
          {/* Bouton Nouvel Article - masqué pour les employés et caissiers */}
          {canManageArticles && (
            <Button size="sm" onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nouvel Article
            </Button>
          )}
        </div>
      </div>

      {/* KPI Cards - Plus compactes */}
      <div className="grid gap-3 grid-cols-4">
        <Card className="py-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3">
            <CardTitle className="text-xs font-medium">Total Articles</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pb-3">
            <div className="text-xl font-bold">{articles?.totalElements || 0}</div>
          </CardContent>
        </Card>

        <Card className="py-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3">
            <CardTitle className="text-xs font-medium">Disponibles</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pb-3">
            <div className="text-xl font-bold text-success">
              {filteredArticles.filter(a => a.disponible).length}
            </div>
          </CardContent>
        </Card>

        <Card className="py-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3">
            <CardTitle className="text-xs font-medium">Valeur Stock</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pb-3">
            <div className="text-xl font-bold">
              {filteredArticles.reduce((total, article) => 
                total + (parseFloat(article.prix) * (article.quantite || 0)), 0
              ).toLocaleString('fr-FR', { style: 'currency', currency: 'MAD' })}
            </div>
          </CardContent>
        </Card>

        <Card className="py-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3">
            <CardTitle className="text-xs font-medium">Stock Total</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pb-3">
            <div className="text-xl font-bold">
              {filteredArticles.reduce((total, article) => total + (article.quantite || 0), 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search compact */}
      <div className="flex items-center">
        <div className="relative w-80">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher des articles..."
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
              <CardTitle className="text-lg">Liste des Articles</CardTitle>
              <CardDescription className="text-sm">
                {canManageArticles ? 'Gérez tous vos articles et leur disponibilité.' : 'Consultez tous les articles disponibles.'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pb-4">
          {articlesContent.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Package className="h-16 w-16 text-muted-foreground" />
              <div className="text-lg font-semibold">Aucun article trouvé</div>
              <div className="text-muted-foreground text-center max-w-md">
                {canManageArticles 
                  ? 'Commencez par créer votre premier article en cliquant sur "Nouvel Article"'
                  : 'Aucun article n\'est disponible pour le moment.'
                }
              </div>
              {canManageArticles && (
                <Button onClick={() => setShowCreateModal(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Créer le premier article
                </Button>
              )}
            </div>
          ) : (
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
          )}
        </CardContent>
      </Card>

      {/* Modals - masqués pour les employés et caissiers */}
      {canManageArticles && (
        <>
          <CreateArticleModal 
            open={showCreateModal} 
            onOpenChange={setShowCreateModal} 
          />
          
          <EditArticleModal 
            open={showEditModal} 
            onOpenChange={setShowEditModal} 
            article={selectedArticle} 
          />
          
          <DeleteArticleModal 
            open={showDeleteModal} 
            onOpenChange={setShowDeleteModal} 
            article={selectedArticle} 
          />
        </>
      )}
    </div>
  );
}