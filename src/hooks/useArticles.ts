import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { articlesAPI } from '@/services/api/articles.api';
import { ArticleDTO, CreateArticleRequest, UpdateArticleRequest } from '@/types/entities';
import { Pageable } from '@/types/api';
import toast from 'react-hot-toast';

export const useArticles = (pageable?: Pageable) => {
  const queryClient = useQueryClient();

  // Query principale pour lister les articles
  const articlesQuery = useQuery({
    queryKey: ['articles'],
    queryFn: async () => {
      console.log('🚀 Déclenchement de la requête getAllArticles...');
      try {
        const result = await articlesAPI.getAllArticles(pageable);
        console.log('📡 Résultat de l\'API:', result);
        
        if (!result) {
          console.warn('API returned null/undefined, using fallback');
          return {
            content: [],
            totalElements: 0,
            totalPages: 0,
            size: pageable?.size || 10,
            number: pageable?.page || 0,
            first: true,
            last: true,
            empty: true,
            numberOfElements: 0,
            sort: { empty: true, sorted: false, unsorted: true }
          };
        }
        
        if (!Array.isArray(result.content)) {
          console.warn('API content is not an array, using fallback');
          return {
            ...result,
            content: [],
            totalElements: 0,
            empty: true,
            numberOfElements: 0
          };
        }
        
        console.log('✅ Données valides retournées:', result);
        return result;
      } catch (error) {
        console.error('❌ Erreur dans useArticles:', error);
        return {
          content: [],
          totalElements: 0,
          totalPages: 0,
          size: pageable?.size || 10,
          number: pageable?.page || 0,
          first: true,
          last: true,
          empty: true,
          numberOfElements: 0,
          sort: { empty: true, sorted: false, unsorted: true }
        };
      }
    },
    staleTime: 0,
    retry: 3,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  // ✅ MODIFIÉ : Mutation pour créer un article (avec support d'image)
  const createArticleMutation = useMutation({
    mutationFn: (newArticle: ArticleDTO | CreateArticleRequest) => {
      // Nouveau format avec image
      if ('article' in newArticle) {
        return articlesAPI.createArticle(newArticle);
      }
      // Ancien format (rétrocompatibilité)
      return articlesAPI.createArticle(newArticle);
    },
    onMutate: async (newArticle) => {
      await queryClient.cancelQueries({ queryKey: ['articles'] });
      
      const previousArticles = queryClient.getQueryData(['articles']);
      
      if (previousArticles && Array.isArray((previousArticles as any)?.content)) {
        const articleData = 'article' in newArticle ? newArticle.article : newArticle;
        queryClient.setQueryData(['articles'], (old: any) => {
          if (!old || !Array.isArray(old.content)) return old;
          return {
            ...old,
            content: [articleData, ...old.content],
            totalElements: (old.totalElements || 0) + 1,
            numberOfElements: (old.numberOfElements || 0) + 1
          };
        });
      }
      
      return { previousArticles };
    },
    onSuccess: async (newArticle) => {
      console.log('✅ Article créé avec succès:', newArticle);
      
      await queryClient.invalidateQueries({ queryKey: ['articles'] });
      await queryClient.refetchQueries({ queryKey: ['articles'] });
      
      const updatedData = queryClient.getQueryData(['articles']);
      console.log('🔍 Données après refetch:', updatedData);
      
      toast.success(`Article "${newArticle.nom}" créé avec succès`);
    },
    onError: (error: any, newArticle, context: any) => {
      if (context?.previousArticles) {
        queryClient.setQueryData(['articles'], context.previousArticles);
      }
      toast.error('Erreur lors de la création de l\'article');
      console.error('Erreur création article:', error);
    }
  });

  // ✅ MODIFIÉ : Mutation pour mettre à jour un article (avec support d'image)
  const updateArticleMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: ArticleDTO | UpdateArticleRequest }) => {
      // Nouveau format avec image
      if ('article' in data) {
        return articlesAPI.updateArticle(id, data);
      }
      // Ancien format (rétrocompatibilité)
      return articlesAPI.updateArticle(id, data);
    },
    onSuccess: async (updatedArticle) => {
      await queryClient.invalidateQueries({ queryKey: ['articles'] });
      await queryClient.refetchQueries({ queryKey: ['articles'] });
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
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['articles'] });
      await queryClient.refetchQueries({ queryKey: ['articles'] });
      toast.success('Article supprimé avec succès');
    },
    onError: (error: any) => {
      toast.error('Erreur lors de la suppression de l\'article');
      console.error('Erreur suppression article:', error);
    }
  });

  // Objet de fallback par défaut
  const defaultPage = {
    content: [],
    totalElements: 0,
    totalPages: 0,
    size: pageable?.size || 10,
    number: pageable?.page || 0,
    first: true,
    last: true,
    empty: true,
    numberOfElements: 0,
    sort: { empty: true, sorted: false, unsorted: true }
  };

  return {
    // Données avec fallback sécurisé
    articles: articlesQuery.data || defaultPage,
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