import React, { useMemo, useState } from 'react';
import { Plus, Search, MessageSquare, User, Calendar, TrendingUp, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useFeedbacks } from '@/hooks/useFeedbacks';
import { FeedbackResponse } from '@/types/entities';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const Feedbacks: React.FC = () => {
  const { currentUser, isAdmin, isEmploye, isAuthenticated } = useAuth();
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackResponse | null>(null);

  // Utilisation du hook useFeedbacks
  const {
    feedbacks,
    myFeedbacks,
    isLoading,
    isLoadingMy,
    error,
    errorMy,
    createFeedback,
    updateFeedback,
    deleteFeedback,
    isCreating,
    isUpdating,
    isDeleting,
    refetch,
    refetchMy,
  } = useFeedbacks();

  // Logique selon les permissions : Admin voit tous les feedbacks, Employé voit les siens
  const currentData = useMemo(() => {
    if (isAdmin) {
      return feedbacks?.content || [];
    } else {
      return myFeedbacks?.content || [];
    }
  }, [isAdmin, feedbacks?.content, myFeedbacks?.content]);
  
  const currentLoading = isAdmin ? isLoading : isLoadingMy;
  const currentError = isAdmin ? error : errorMy;
  const currentRefetch = isAdmin ? refetch : refetchMy;

  // Recherche filtrée
  const filteredData = useMemo(() => {
    if (!currentData || !Array.isArray(currentData)) return [];
    
    return currentData.filter(feedback => 
      feedback?.commentaire?.toLowerCase().includes(search.toLowerCase()) ||
      (feedback?.utilisateurPrenom && feedback.utilisateurPrenom.toLowerCase().includes(search.toLowerCase())) ||
      (feedback?.utilisateurNom && feedback.utilisateurNom.toLowerCase().includes(search.toLowerCase()))
    );
  }, [currentData, search]);

  // Statistiques
  const stats = useMemo(() => {
    if (!currentData || !Array.isArray(currentData)) {
      return { total: 0, myFeedbacks: 0, thisMonth: 0, avgLength: 0 };
    }
    
    const total = currentData.length;
    const myFeedbacksCount = isAdmin 
      ? currentData.filter(f => f?.utilisateurid === currentUser?.id).length
      : total;
    
    const thisMonth = currentData.filter(feedback => {
      if (!feedback?.id) return false;
      // Pas de date dans FeedbackResponse, on estime que c'est récent
      return true; // Simulation pour l'instant
    }).length;
    
    const avgLength = currentData.length 
      ? Math.round(currentData.reduce((acc, f) => acc + (f?.commentaire?.length || 0), 0) / currentData.length)
      : 0;

    return { total, myFeedbacks: myFeedbacksCount, thisMonth, avgLength };
  }, [currentData, currentUser?.id, isAdmin]);

  // Gestion des actions
  const handleCreateFeedback = (commentaire: string) => {
    createFeedback(commentaire);
    setShowCreateModal(false);
    // Rafraîchir les données après création
    setTimeout(() => {
      currentRefetch();
    }, 500);
  };

  const handleEditFeedback = (feedback: FeedbackResponse) => {
    setSelectedFeedback(feedback);
    setShowEditModal(true);
  };

  const handleUpdateFeedback = (id: number, commentaire: string) => {
    updateFeedback({ id, commentaire });
    setShowEditModal(false);
    setSelectedFeedback(null);
    // Rafraîchir les données après modification
    setTimeout(() => {
      currentRefetch();
    }, 500);
  };

  const handleDeleteFeedback = (feedback: FeedbackResponse) => {
    setSelectedFeedback(feedback);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = (id: number) => {
    deleteFeedback(id);
    setShowDeleteModal(false);
    setSelectedFeedback(null);
    // Rafraîchir les données après suppression
    setTimeout(() => {
      currentRefetch();
    }, 500);
  };

  // Permissions
  const canEditFeedback = (feedback: FeedbackResponse) => {
    // Seulement les employés peuvent modifier leurs propres feedbacks
    return isEmploye && currentUser?.id === feedback.utilisateurid;
  };

  const canDeleteFeedback = (feedback: FeedbackResponse) => {
    // Les employés peuvent supprimer leurs propres feedbacks, les admins peuvent supprimer tous les feedbacks
    return (isEmploye && currentUser?.id === feedback.utilisateurid) || isAdmin;
  };

  const canCreateFeedback = isEmploye; // Seulement les employés peuvent créer des feedbacks

  if (currentLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (currentError) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <div className="text-destructive text-lg font-semibold">
          Erreur lors du chargement des feedbacks
        </div>
        <div className="text-muted-foreground text-center max-w-md">
          {currentError?.message || 'Une erreur est survenue'}
        </div>
        <Button onClick={() => currentRefetch()} variant="outline">
          Réessayer
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Feedbacks</h1>
          <p className="text-muted-foreground">
            {isAdmin ? "Gestion de tous les commentaires et suggestions" : "Gestion de vos commentaires et suggestions"}
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
            <CardTitle className="text-sm font-medium">
              {isAdmin ? 'Total Feedbacks' : 'Mes Feedbacks'}
            </CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              {isAdmin ? 'Tous les feedbacks' : 'Feedbacks créés'}
            </p>
          </CardContent>
        </Card>
        
        {!isAdmin && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mes Contributions</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.myFeedbacks}</div>
              <p className="text-xs text-muted-foreground">
                Mes feedbacks
              </p>
            </CardContent>
          </Card>
        )}
        
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

      {/* Barre de recherche */}
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

      {/* Liste des feedbacks */}
      <Card>
        <CardHeader>
          <CardTitle>
            {isAdmin ? 'Tous les Feedbacks' : 'Mes Feedbacks'}
          </CardTitle>
          <CardDescription>
            {isAdmin 
              ? 'Gérez tous les feedbacks de vos employés'
              : 'Consultez et gérez vos propres feedbacks'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <MessageSquare className="h-16 w-16 text-muted-foreground/30" />
              <div className="text-center">
                <h3 className="text-lg font-medium text-muted-foreground">
                  Aucun feedback trouvé
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {search ? 'Essayez de modifier votre recherche' : 'Commencez par créer votre premier feedback'}
                </p>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredData.map((feedback) => (
                <Card key={feedback.id} className="p-4">
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600 line-clamp-3">
                        {feedback.commentaire}
                      </p>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div>
                        {feedback.utilisateurNom && feedback.utilisateurPrenom && (
                          <span>{feedback.utilisateurPrenom} {feedback.utilisateurNom}</span>
                        )}
                      </div>
                      <div className="flex space-x-1">
                        {canEditFeedback(feedback) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditFeedback(feedback)}
                            disabled={isUpdating}
                            className="h-7 w-7 p-0"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                        )}
                        {canDeleteFeedback(feedback) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteFeedback(feedback)}
                            disabled={isDeleting}
                            className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de création */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Nouveau Feedback</CardTitle>
              <CardDescription>Partagez vos commentaires et suggestions</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const commentaire = formData.get('commentaire') as string;
                if (commentaire.trim()) {
                  handleCreateFeedback(commentaire);
                }
              }}>
                <textarea
                  name="commentaire"
                  placeholder="Votre commentaire..."
                  className="w-full p-3 border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={4}
                  required
                />
                <div className="flex justify-end space-x-2 mt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowCreateModal(false)}
                    disabled={isCreating}
                  >
                    Annuler
                  </Button>
                  <Button type="submit" disabled={isCreating}>
                    {isCreating ? 'Création...' : 'Créer'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal de modification */}
      {showEditModal && selectedFeedback && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Modifier Feedback</CardTitle>
              <CardDescription>Modifiez votre commentaire</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const commentaire = formData.get('commentaire') as string;
                if (commentaire.trim() && selectedFeedback.id) {
                  handleUpdateFeedback(selectedFeedback.id, commentaire);
                }
              }}>
                <textarea
                  name="commentaire"
                  defaultValue={selectedFeedback.commentaire}
                  placeholder="Votre commentaire..."
                  className="w-full p-3 border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={4}
                  required
                />
                <div className="flex justify-end space-x-2 mt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setShowEditModal(false);
                      setSelectedFeedback(null);
                    }}
                    disabled={isUpdating}
                  >
                    Annuler
                  </Button>
                  <Button type="submit" disabled={isUpdating}>
                    {isUpdating ? 'Mise à jour...' : 'Modifier'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal de suppression */}
      {showDeleteModal && selectedFeedback && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Supprimer Feedback</CardTitle>
              <CardDescription>Cette action est irréversible</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                Êtes-vous sûr de vouloir supprimer ce feedback ?
              </p>
              <div className="bg-gray-50 p-3 rounded-md mb-4">
                <p className="text-sm text-gray-600 line-clamp-2">
                  {selectedFeedback.commentaire}
                </p>
              </div>
              <div className="flex justify-end space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedFeedback(null);
                  }}
                  disabled={isDeleting}
                >
                  Annuler
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={() => {
                    if (selectedFeedback.id) {
                      handleConfirmDelete(selectedFeedback.id);
                    }
                  }} 
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Suppression...' : 'Supprimer'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default Feedbacks;
