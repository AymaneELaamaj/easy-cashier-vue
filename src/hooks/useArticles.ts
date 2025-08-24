import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { articlesAPI } from '@/services/api/articles.api';
import { ArticleDTO } from '@/types/entities';
import { Pageable } from '@/types/api';
import toast from 'react-hot-toast';

export const useArticles = (pageable?: Pageable) => {
  const queryClient = useQueryClient();

  // Query principale pour lister les articles
  const articlesQuery = useQuery({
    queryKey: ['articles'], // Clé simplifiée sans pageable
    queryFn: async () => {
      console.log('🚀 Déclenchement de la requête getAllArticles...');
      try {
        const result = await articlesAPI.getAllArticles(pageable);
        console.log('📡 Résultat de l\'API:', result);
        
        // S'assurer que le résultat est toujours valide
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
        
        // Vérifier que content existe, sinon utiliser un fallback
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
        // Retourner un objet valide même en cas d'erreur
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
    staleTime: 0, // Pas de cache pour forcer le rechargement
    retry: 3, // Réessayer 3 fois en cas d'échec
    refetchOnMount: true, // Forcer le refetch au montage
    refetchOnWindowFocus: true, // Refetch quand la fenêtre reprend le focus
  });

  // Mutation pour créer un article
  const createArticleMutation = useMutation({
    mutationFn: articlesAPI.createArticle,
    onMutate: async (newArticle) => {
      // Annuler les requêtes en cours avec la clé exacte
      await queryClient.cancelQueries({ queryKey: ['articles'] });
      
      // Snapshot de l'ancienne valeur
      const previousArticles = queryClient.getQueryData(['articles']);
      
      // Mise à jour optimiste SEULEMENT si on a déjà des données
      if (previousArticles && Array.isArray((previousArticles as any)?.content)) {
        queryClient.setQueryData(['articles'], (old: any) => {
          if (!old || !Array.isArray(old.content)) return old;
          return {
            ...old,
            content: [newArticle, ...old.content],
            totalElements: (old.totalElements || 0) + 1,
            numberOfElements: (old.numberOfElements || 0) + 1
          };
        });
      }
      
      return { previousArticles };
    },
    onSuccess: async (newArticle) => {
      console.log('✅ Article créé avec succès:', newArticle);
      
      // Forcer un refetch immédiat de la query active
      const activeQuery = queryClient.getQueryState(['articles']);
      console.log('🔍 État de la query active:', activeQuery);
      
      // Invalider le cache pour forcer un refetch
      await queryClient.invalidateQueries({ queryKey: ['articles'] });
      console.log('🔄 Cache invalidé');
      
      // Forcer un refetch pour obtenir les données fraîches du backend
      await queryClient.refetchQueries({ queryKey: ['articles'] });
      console.log('🔄 Refetch effectué');
      
      // Vérifier que les données sont mises à jour
      const updatedData = queryClient.getQueryData(['articles']);
      console.log('🔍 Données après refetch:', updatedData);
      
      toast.success(`Article "${newArticle.nom}" créé avec succès`);
    },
    onError: (error: any, newArticle, context: any) => {
      // Restaurer l'ancienne valeur en cas d'erreur
      if (context?.previousArticles) {
        queryClient.setQueryData(['articles'], context.previousArticles);
      }
      toast.error('Erreur lors de la création de l\'article');
      console.error('Erreur création article:', error);
    }
  });

  // Mutation pour mettre à jour un article
  const updateArticleMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: ArticleDTO }) => 
      articlesAPI.updateArticle(id, data),
    onSuccess: async (updatedArticle) => {
      // Invalider le cache et forcer un refetch immédiat
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
      // Invalider le cache et forcer un refetch immédiat
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
    // Données avec fallback sécurisé - jamais undefined
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