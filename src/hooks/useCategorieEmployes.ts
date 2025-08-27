import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categorieEmployesAPI } from '@/services/api/categorie-employes.api';
import { CategorieEmployesResponse } from '@/types/entities';
import { Pageable } from '@/types/api';
import toast from 'react-hot-toast';

export const useCategorieEmployes = (pageable?: Pageable) => {
  const queryClient = useQueryClient();

  // Query principale pour lister les catégories d'employés
  const categoriesQuery = useQuery({
    queryKey: ['categorie-employes', pageable],
    queryFn: async () => {
      try {
        const result = await categorieEmployesAPI.getAll(pageable);
        return result;
      } catch (error) {
        console.error('❌ Error fetching categorie employes:', error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Mutation pour créer une catégorie
  const createCategoryMutation = useMutation({
    mutationFn: categorieEmployesAPI.create,
    onSuccess: (newCategory) => {
      queryClient.invalidateQueries({ queryKey: ['categorie-employes'] });
      toast.success(`Catégorie "${newCategory.cadre}" créée avec succès`);
    },
    onError: (error: any) => {
      toast.error('Erreur lors de la création de la catégorie');
      console.error('Erreur création catégorie:', error);
    }
  });

  // Mutation pour mettre à jour une catégorie
  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, cadre }: { id: number; cadre: string }) => 
      categorieEmployesAPI.update(id, cadre),
    onSuccess: (updatedCategory) => {
      queryClient.invalidateQueries({ queryKey: ['categorie-employes'] });
      toast.success(`Catégorie mise à jour: "${updatedCategory.cadre}"`);
    },
    onError: (error: any) => {
      toast.error('Erreur lors de la mise à jour de la catégorie');
      console.error('Erreur mise à jour catégorie:', error);
    }
  });

  // Mutation pour supprimer une catégorie
  const deleteCategoryMutation = useMutation({
    mutationFn: categorieEmployesAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categorie-employes'] });
      toast.success('Catégorie supprimée avec succès');
    },
    onError: (error: any) => {
      toast.error('Erreur lors de la suppression de la catégorie');
      console.error('Erreur suppression catégorie:', error);
    }
  });

  return {
    // Données
    categories: categoriesQuery.data,
    isLoading: categoriesQuery.isLoading,
    error: categoriesQuery.error,
    isError: categoriesQuery.isError,

    // Actions
    createCategory: createCategoryMutation.mutateAsync,
    updateCategory: updateCategoryMutation.mutateAsync,
    deleteCategory: deleteCategoryMutation.mutateAsync,

    // États des mutations
    isCreating: createCategoryMutation.isPending,
    isUpdating: updateCategoryMutation.isPending,
    isDeleting: deleteCategoryMutation.isPending,

    // Refetch
    refetch: categoriesQuery.refetch,
  };
};

// Hook pour obtenir une catégorie spécifique
export const useCategorieEmploye = (id: number) => {
  return useQuery({
    queryKey: ['categorie-employe', id],
    queryFn: () => categorieEmployesAPI.getById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

export default useCategorieEmployes;