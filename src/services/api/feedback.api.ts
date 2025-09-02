import api from './axios';
import { Page, Pageable } from '@/types/api';
import { FeedbackResponse, FeedbackRequest } from '@/types/entities';

export const feedbackAPI = {
  // Créer un nouveau feedback (Employé uniquement)
  createFeedback: async (commentaire: string): Promise<FeedbackResponse> => {
    try {
      console.log('🆕 Création feedback:', commentaire);
      const response = await api.post<FeedbackResponse>(`/feedbacks/create?commentaire=${encodeURIComponent(commentaire)}`);
      console.log('✅ Feedback créé:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Erreur dans createFeedback:', error);
      throw error;
    }
  },

  // Lister tous les feedbacks (Admin/Super Admin uniquement)
  getAllFeedbacks: async (pageable?: Pageable): Promise<Page<FeedbackResponse>> => {
    try {
      const params = new URLSearchParams();
      if (pageable?.page !== undefined) params.append('page', pageable.page.toString());
      if (pageable?.size !== undefined) params.append('size', pageable.size.toString());
      if (pageable?.sort) params.append('sort', pageable.sort);

      const url = `/feedbacks/all${params.toString() ? `?${params.toString()}` : ''}`;
      console.log('🌐 Appel API Feedbacks (tous):', url);
      
      const response = await api.get<Page<FeedbackResponse>>(url);
      console.log('📡 Réponse API Feedbacks (tous):', response.data);
      return response.data;
      
    } catch (error) {
      console.error('❌ Erreur dans getAllFeedbacks:', error);
      throw error;
    }
  },

  // Obtenir un feedback par ID (Admin/Super Admin uniquement)
  getFeedbackById: async (id: number): Promise<FeedbackResponse> => {
    try {
      console.log('🔍 Récupération feedback ID:', id);
      const response = await api.get<FeedbackResponse>(`/feedbacks/${id}`);
      console.log('✅ Feedback récupéré:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Erreur dans getFeedbackById:', error);
      throw error;
    }
  },

  // Mettre à jour un feedback (Employé - son propre feedback)
  updateFeedback: async (id: number, commentaire: string): Promise<FeedbackResponse> => {
    try {
      console.log('📝 Mise à jour feedback ID:', id, 'avec commentaire:', commentaire);
      const response = await api.patch<FeedbackResponse>(
        `/feedbacks/update?id=${id}&commentaire=${encodeURIComponent(commentaire)}`
      );
      console.log('✅ Feedback mis à jour:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Erreur dans updateFeedback:', error);
      throw error;
    }
  },

  // Obtenir mes feedbacks (Employé - ses propres feedbacks)
  getMyFeedbacks: async (pageable?: Pageable): Promise<Page<FeedbackResponse>> => {
    try {
      const params = new URLSearchParams();
      if (pageable?.page !== undefined) params.append('page', pageable.page.toString());
      if (pageable?.size !== undefined) params.append('size', pageable.size.toString());
      if (pageable?.sort) params.append('sort', pageable.sort);

      const url = `/feedbacks/my-feedbacks${params.toString() ? `?${params.toString()}` : ''}`;
      console.log('🌐 Appel API Feedbacks (mes feedbacks):', url);
      
      const response = await api.get<Page<FeedbackResponse>>(url);
      console.log('📡 Réponse API Feedbacks (mes feedbacks):', response.data);
      return response.data;
      
    } catch (error) {
      console.error('❌ Erreur dans getMyFeedbacks:', error);
      throw error;
    }
  },

  // Supprimer un feedback (Employé - son propre feedback, Admin - tous les feedbacks)
  deleteFeedback: async (id: number): Promise<void> => {
    try {
      console.log('🗑️ Suppression feedback ID:', id);
      await api.delete<void>(`/feedbacks/delete?id=${id}`);
      console.log('✅ Feedback supprimé');
    } catch (error) {
      console.error('❌ Erreur dans deleteFeedback:', error);
      throw error;
    }
  }
};

export default feedbackAPI;