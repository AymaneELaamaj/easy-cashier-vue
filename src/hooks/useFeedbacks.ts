import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { feedbackAPI } from '@/services/api/feedback.api';
import { FeedbackDTO } from '@/types/entities';
import { Pageable } from '@/types/api';
import toast from 'react-hot-toast';
import { useState } from 'react';

interface UseFeedbacksOptions {
  page?: number;
  size?: number;
  sort?: string;
}

export const useFeedbacks = (options: UseFeedbacksOptions = {}) => {
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);

  const pageable: Pageable = {
    page: options.page || 0,
    size: options.size || 10,
    sort: options.sort
  };

  // Query pour récupérer tous les feedbacks (Admin)
  const {
    data: feedbacks,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['feedbacks', 'all', pageable],
    queryFn: () => feedbackAPI.getAllFeedbacks(pageable),
    retry: 2
  });

  // Query pour récupérer mes feedbacks
  const {
    data: myFeedbacks,
    isLoading: isLoadingMy,
    error: errorMy,
    refetch: refetchMy
  } = useQuery({
    queryKey: ['feedbacks', 'my', pageable],
    queryFn: () => feedbackAPI.getMyFeedbacks(pageable),
    retry: 2
  });

  // Hook pour récupérer un feedback par ID (à utiliser séparément)
  const useFeedbackById = (id: number) => {
    return useQuery({
      queryKey: ['feedback', id],
      queryFn: () => feedbackAPI.getFeedbackById(id),
      enabled: !!id,
      retry: 2
    });
  };

  // Mutation pour créer un feedback
  const createFeedback = useMutation({
    mutationFn: (commentaire: string) => {
      setIsCreating(true);
      return feedbackAPI.createFeedback(commentaire);
    },
    onSuccess: (data) => {
      setIsCreating(false);
      toast.success('Feedback créé avec succès');
      queryClient.invalidateQueries({ queryKey: ['feedbacks'] });
    },
    onError: (error: Error) => {
      setIsCreating(false);
      console.error('Erreur lors de la création du feedback:', error);
      const errorMessage = (error as { response?: { data?: { message?: string } } }).response?.data?.message || error.message || 'Erreur lors de la création du feedback';
      toast.error(errorMessage);
    }
  });

  // Mutation pour mettre à jour un feedback
  const updateFeedback = useMutation({
    mutationFn: ({ id, commentaire }: { id: number; commentaire: string }) =>
      feedbackAPI.updateFeedback(id, commentaire),
    onSuccess: () => {
      toast.success('Feedback mis à jour avec succès');
      queryClient.invalidateQueries({ queryKey: ['feedbacks'] });
    },
    onError: (error: Error) => {
      console.error('Erreur lors de la mise à jour du feedback:', error);
      const errorMessage = (error as { response?: { data?: { message?: string } } }).response?.data?.message || error.message || 'Erreur lors de la mise à jour du feedback';
      toast.error(errorMessage);
    }
  });

  // Mutation pour supprimer un feedback
  const deleteFeedback = useMutation({
    mutationFn: (id: number) => feedbackAPI.deleteFeedback(id),
    onSuccess: () => {
      toast.success('Feedback supprimé avec succès');
      queryClient.invalidateQueries({ queryKey: ['feedbacks'] });
    },
    onError: (error: Error) => {
      console.error('Erreur lors de la suppression du feedback:', error);
      const errorMessage = (error as { response?: { data?: { message?: string } } }).response?.data?.message || error.message || 'Erreur lors de la suppression du feedback';
      toast.error(errorMessage);
    }
  });

  return {
    // Données
    feedbacks,
    myFeedbacks,
    
    // États de chargement
    isLoading,
    isLoadingMy,
    isCreating,
    isUpdating: updateFeedback.isPending,
    isDeleting: deleteFeedback.isPending,
    
    // Erreurs
    error,
    errorMy,
    
    // Actions
    createFeedback: createFeedback.mutate,
    updateFeedback: updateFeedback.mutate,
    deleteFeedback: deleteFeedback.mutate,
    refetch,
    refetchMy,
    useFeedbackById,
    
    // Utilitaires
    invalidateQueries: () => queryClient.invalidateQueries({ queryKey: ['feedbacks'] })
  };
};

export default useFeedbacks;
