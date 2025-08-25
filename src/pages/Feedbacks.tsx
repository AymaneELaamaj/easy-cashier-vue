import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useFeedbacks } from '@/hooks/useFeedbacks';
import { useAuth } from '@/hooks/useAuth';
import { FeedbackDTO } from '@/types/entities';
import { 
  Search, 
  Plus, 
  MessageSquare, 
  Users, 
  User,
  Calendar,
  TrendingUp
} from 'lucide-react';
import {
  CreateFeedbackModal,
  EditFeedbackModal,
  DeleteFeedbackModal,
  FeedbackCard
} from '@/components/feedbacks';

// Types locaux pour les statistiques
interface FeedbackStats {
  total: number;
  myFeedbacks: number;
  thisMonth: number;
  avgLength: number;
}

export default function Feedbacks() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(12);
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackDTO | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'my'>('all');

  const { currentUser } = useAuth();
  
  const {
    feedbacks,
    myFeedbacks,
    isLoading,
    isLoadingMy,
    isCreating,
    isUpdating,
    isDeleting,
    error,
    errorMy,
    createFeedback,
    updateFeedback,
    deleteFeedback,
    refetch,
    refetchMy
  } = useFeedbacks({ page, size: pageSize });

  // Calcul des statistiques
  const stats: FeedbackStats = useMemo(() => {
    const allFeedbacksData = feedbacks?.content || [];
    const myFeedbacksData = myFeedbacks?.content || [];
    const currentMonth = new Date().getMonth();
    
    const thisMonthCount = allFeedbacksData.filter(feedback => {
      // Approximation - vous pourriez avoir une date de création dans le DTO
      return true; // Pour le moment, on compte tous les feedbacks
    }).length;

    const avgLength = allFeedbacksData.length > 0
      ? Math.round(allFeedbacksData.reduce((sum, f) => sum + f.commentaire.length, 0) / allFeedbacksData.length)
      : 0;

    return {
      total: feedbacks?.totalElements || 0,
      myFeedbacks: myFeedbacks?.totalElements || 0,
      thisMonth: thisMonthCount,
      avgLength
    };
  }, [feedbacks, myFeedbacks]);

  // Filtrage des données
  const filteredData = useMemo(() => {
    const data = activeTab === 'all' ? feedbacks?.content || [] : myFeedbacks?.content || [];
    if (!search.trim()) return data;
    
    return data.filter(feedback =>
      feedback.commentaire.toLowerCase().includes(search.toLowerCase()) ||
      feedback.utilisateur?.nom?.toLowerCase().includes(search.toLowerCase()) ||
      feedback.utilisateur?.prenom?.toLowerCase().includes(search.toLowerCase())
    );
  }, [feedbacks, myFeedbacks, activeTab, search]);

  // Handlers
  const handleCreateFeedback = (commentaire: string) => {
    createFeedback(commentaire);
  };

  const handleEditFeedback = (feedback: FeedbackDTO) => {
    setSelectedFeedback(feedback);
    setShowEditModal(true);
  };

  const handleUpdateFeedback = (id: number, commentaire: string) => {
    updateFeedback({ id, commentaire });
  };

  const handleDeleteFeedback = (feedback: FeedbackDTO) => {
    setSelectedFeedback(feedback);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = (id: number) => {
    deleteFeedback(id);
  };

  const canEditFeedback = (feedback: FeedbackDTO) => {
    return currentUser?.id === feedback.utilisateurid || 
           ['ADMIN', 'SUPER_ADMIN'].includes(currentUser?.role || '');
  };

  const canDeleteFeedback = (feedback: FeedbackDTO) => {
    return currentUser?.id === feedback.utilisateurid || 
           ['ADMIN', 'SUPER_ADMIN'].includes(currentUser?.role || '');
  };

  const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(currentUser?.role || '');
  const canCreateFeedback = currentUser?.role === 'EMPLOYE' || isAdmin;

  const currentIsLoading = activeTab === 'all' ? isLoading : isLoadingMy;
  const currentError = activeTab === 'all' ? error : errorMy;

  return (
    <div className="space-y-6 p-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Feedbacks</h1>
          <p className="text-muted-foreground">
            Gestion des commentaires et suggestions
          </p>
        </div>
        {canCreateFeedback && (
          <Button 
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2"
            disabled={isCreating}
          >
            <Plus className="h-4 w-4" />
            {isCreating ? 'Création...' : 'Nouveau Feedback'}
          </Button>
        )}
      </div>

      {/* Statistiques */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Feedbacks</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              Tous les feedbacks
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mes Feedbacks</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.myFeedbacks}</div>
            <p className="text-xs text-muted-foreground">
              Feedbacks que j'ai créés
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ce Mois</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.thisMonth}</div>
            <p className="text-xs text-muted-foreground">
              Feedbacks récents
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Longueur Moyenne</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgLength}</div>
            <p className="text-xs text-muted-foreground">
              Caractères par feedback
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Barre de recherche et filtres */}
      <Card>
        <CardHeader>
          <CardTitle>Rechercher</CardTitle>
          <CardDescription>
            Recherchez dans les feedbacks par commentaire ou utilisateur
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardContent>
      </Card>

      {/* Onglets et contenu */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'all' | 'my')}>
        <TabsList>
          {isAdmin && (
            <TabsTrigger value="all" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Tous les feedbacks
              <Badge variant="secondary">{stats.total}</Badge>
            </TabsTrigger>
          )}
          <TabsTrigger value="my" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Mes feedbacks
            <Badge variant="secondary">{stats.myFeedbacks}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          {currentIsLoading ? (
            <div className="flex justify-center items-center h-64">
              <LoadingSpinner size="lg" />
            </div>
          ) : currentError ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center h-64">
                <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center">
                  Erreur lors du chargement des feedbacks
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => activeTab === 'all' ? refetch() : refetchMy()}
                  className="mt-4"
                >
                  Réessayer
                </Button>
              </CardContent>
            </Card>
          ) : filteredData.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center h-64">
                <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center">
                  {search ? 'Aucun feedback trouvé' : 'Aucun feedback disponible'}
                </p>
                {canCreateFeedback && !search && (
                  <Button 
                    onClick={() => setShowCreateModal(true)}
                    className="mt-4"
                  >
                    Créer le premier feedback
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredData.map((feedback) => (
                <FeedbackCard
                  key={feedback.id}
                  feedback={feedback}
                  canEdit={canEditFeedback(feedback)}
                  canDelete={canDeleteFeedback(feedback)}
                  onEdit={handleEditFeedback}
                  onDelete={handleDeleteFeedback}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="my" className="mt-6">
          {currentIsLoading ? (
            <div className="flex justify-center items-center h-64">
              <LoadingSpinner size="lg" />
            </div>
          ) : currentError ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center h-64">
                <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center">
                  Erreur lors du chargement de vos feedbacks
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => refetchMy()}
                  className="mt-4"
                >
                  Réessayer
                </Button>
              </CardContent>
            </Card>
          ) : filteredData.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center h-64">
                <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center">
                  {search ? 'Aucun feedback trouvé' : 'Vous n\'avez pas encore créé de feedback'}
                </p>
                {canCreateFeedback && !search && (
                  <Button 
                    onClick={() => setShowCreateModal(true)}
                    className="mt-4"
                  >
                    Créer mon premier feedback
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredData.map((feedback) => (
                <FeedbackCard
                  key={feedback.id}
                  feedback={feedback}
                  canEdit={canEditFeedback(feedback)}
                  canDelete={canDeleteFeedback(feedback)}
                  onEdit={handleEditFeedback}
                  onDelete={handleDeleteFeedback}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <CreateFeedbackModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateFeedback}
        isLoading={isCreating}
      />

      <EditFeedbackModal
        feedback={selectedFeedback}
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedFeedback(null);
        }}
        onSubmit={handleUpdateFeedback}
        isLoading={isUpdating}
      />

      <DeleteFeedbackModal
        feedback={selectedFeedback}
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedFeedback(null);
        }}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
      />
    </div>
  );
}
