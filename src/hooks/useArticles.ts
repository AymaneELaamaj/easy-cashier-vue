import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { articlesAPI } from '@/services/api/articles.api';
import { ArticleDTO } from '@/types/entities';
import { Pageable } from '@/types/api';
import toast from 'react-hot-toast';

export const useArticles = (pageable?: Pageable) => {
  const queryClient = useQueryClient();

  // Query principale pour lister les articles
  const articlesQuery = useQuery({
    queryKey: ['articles', pageable],
    queryFn: () => articlesAPI.getAllArticles(pageable),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Mutation pour créer un article
  const createArticleMutation = useMutation({
    mutationFn: articlesAPI.createArticle,
    onSuccess: (newArticle) => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      toast.success(`Article "${newArticle.nom}" créé avec succès`);
    },
    onError: (error: any) => {
      toast.error('Erreur lors de la création de l\'article');
      console.error('Erreur création article:', error);
    }
  });

  // Mutation pour mettre à jour un article
  const updateArticleMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: ArticleDTO }) => 
      articlesAPI.updateArticle(id, data),
    onSuccess: (updatedArticle) => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      queryClient.invalidateQueries({ queryKey: ['article', updatedArticle.id] });
      toast.success(`Article "${updatedArticle.nom}" mis à jour`);
    },
    onError: (error: any) => {
      toast.error('Erreur lors de la mise à jour de l\'article');
      console.error('Erreur mise à jour article:', error);
    }
  });

  // Mutation pour supprimer un article
  const deleteArticleMutation = useMutation({
    mutationFn: articlesAPI.deleteArticle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      toast.success('Article supprimé avec succès');
    },
    onError: (error: any) => {
      toast.error('Erreur lors de la suppression de l\'article');
      console.error('Erreur suppression article:', error);
    }
  });

  return {
    // Données
    articles: articlesQuery.data,
    isLoading: articlesQuery.isLoading,
    error: articlesQuery.error,
    isError: articlesQuery.isError,

    // Actions
    createArticle: createArticleMutation.mutateAsync,
    updateArticle: updateArticleMutation.mutateAsync,
    deleteArticle: deleteArticleMutation.mutateAsync,

    // États des mutations
    isCreating: createArticleMutation.isPending,
    isUpdating: updateArticleMutation.isPending,
    isDeleting: deleteArticleMutation.isPending,

    // Refetch
    refetch: articlesQuery.refetch,
  };
};

// Hook pour obtenir un article spécifique par nom
export const useArticleByName = (name: string) => {
  return useQuery({
    queryKey: ['article', 'name', name],
    queryFn: () => articlesAPI.getArticleByName(name),
    enabled: !!name,
    staleTime: 5 * 60 * 1000,
  });
};

export default useArticles;