import api from './axios';
import { ApiResponse, Page, Pageable } from '@/types/api';
import { FeedbackDTO } from '@/types/entities';

export const feedbackAPI = {
  // Créer un nouveau feedback
  createFeedback: async (commentaire: string): Promise<FeedbackDTO> => {
    const response = await api.post<ApiResponse<FeedbackDTO>>(`/feedbacks/create?commentaire=${encodeURIComponent(commentaire)}`);
    return response.data.data;
  },

  // Lister tous les feedbacks (Admin)
  getAllFeedbacks: async (pageable?: Pageable): Promise<Page<FeedbackDTO>> => {
    const params = new URLSearchParams();
    if (pageable?.page !== undefined) params.append('page', pageable.page.toString());
    if (pageable?.size !== undefined) params.append('size', pageable.size.toString());
    if (pageable?.sort) params.append('sort', pageable.sort);

    const response = await api.get<ApiResponse<Page<FeedbackDTO>>>(`/feedbacks/all?${params}`);
    return response.data.data;
  },

  // Obtenir un feedback par ID
  getFeedbackById: async (id: number): Promise<FeedbackDTO> => {
    const response = await api.get<ApiResponse<FeedbackDTO>>(`/feedbacks/${id}`);
    return response.data.data;
  },

  // Mettre à jour un feedback
  updateFeedback: async (id: number, commentaire: string): Promise<FeedbackDTO> => {
    const response = await api.patch<ApiResponse<FeedbackDTO>>(
      `/feedbacks/update?id=${id}&commentaire=${encodeURIComponent(commentaire)}`
    );
    return response.data.data;
  },

  // Obtenir mes feedbacks (utilisateur connecté)
  getMyFeedbacks: async (pageable?: Pageable): Promise<Page<FeedbackDTO>> => {
    const params = new URLSearchParams();
    if (pageable?.page !== undefined) params.append('page', pageable.page.toString());
    if (pageable?.size !== undefined) params.append('size', pageable.size.toString());
    if (pageable?.sort) params.append('sort', pageable.sort);

    const response = await api.get<ApiResponse<Page<FeedbackDTO>>>(`/feedbacks/my-feedbacks?${params}`);
    return response.data.data;
  },

  // Supprimer un feedback
  deleteFeedback: async (id: number): Promise<void> => {
    await api.delete<ApiResponse<void>>(`/feedbacks/delete?id=${id}`);
  }
};

export default feedbackAPI;