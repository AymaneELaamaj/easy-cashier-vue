import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoriesAPI } from '@/services/api/categories.api';
import { CategorieDTO } from '@/types/entities';
import toast from 'react-hot-toast';

export const useCategories = () => {
  const queryClient = useQueryClient();

  // Query principale pour lister les catégories
  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesAPI.getAllCategories(),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Mutation pour créer une catégorie
  const createCategoryMutation = useMutation({
    mutationFn: categoriesAPI.createCategory,
    onSuccess: (newCategory) => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success(`Catégorie "${newCategory.libelle}" créée avec succès`);
    },
    onError: (error: any) => {
      toast.error('Erreur lors de la création de la catégorie');
      console.error('Erreur création catégorie:', error);
    }
  });

  // Mutation pour mettre à jour une catégorie
  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: CategorieDTO }) => 
      categoriesAPI.updateCategory(id, data),
    onSuccess: (updatedCategory) => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['category', updatedCategory.id] });
      toast.success(`Catégorie "${updatedCategory.libelle}" mise à jour`);
    },
    onError: (error: any) => {
      toast.error('Erreur lors de la mise à jour de la catégorie');
      console.error('Erreur mise à jour catégorie:', error);
    }
  });

  // Mutation pour supprimer une catégorie
  const deleteCategoryMutation = useMutation({
    mutationFn: categoriesAPI.deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
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
export const useCategory = (id: number) => {
  return useQuery({
    queryKey: ['category', id],
    queryFn: () => categoriesAPI.getCategoryById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

export default useCategories;