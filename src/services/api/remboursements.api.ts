import api from './axios';
import { ApiResponse, Page, Pageable } from '@/types/api';
import { RemboursementDTO } from '@/types/entities';

export const remboursementsAPI = {
  // Lister tous les remboursements (Admin)
  getAllRemboursements: async (pageable?: Pageable): Promise<Page<RemboursementDTO>> => {
    const params = new URLSearchParams();
    if (pageable?.page !== undefined) params.append('page', pageable.page.toString());
    if (pageable?.size !== undefined) params.append('size', pageable.size.toString());
    if (pageable?.sort) params.append('sort', pageable.sort);

    const response = await api.get<ApiResponse<Page<RemboursementDTO>>>(`/remboursements/all?${params}`);
    return response.data.data;
  },

  // Obtenir un remboursement par ID
  getRemboursementById: async (id: number): Promise<RemboursementDTO> => {
    const response = await api.get<ApiResponse<RemboursementDTO>>(`/remboursements/${id}`);
    return response.data.data;
  },

  // Créer une demande de remboursement
  createDemandeRemboursement: async (transactionId: number, message: string): Promise<RemboursementDTO> => {
    const response = await api.post<ApiResponse<RemboursementDTO>>(
      `/remboursements/demande?transactionId=${transactionId}&message=${encodeURIComponent(message)}`
    );
    return response.data.data;
  },

  // Mettre à jour une demande de remboursement
  updateRemboursement: async (remboursementId: number, message: string): Promise<RemboursementDTO> => {
    const response = await api.put<ApiResponse<RemboursementDTO>>(
      `/remboursements/update?remboursementId=${remboursementId}&message=${encodeURIComponent(message)}`
    );
    return response.data.data;
  },

  // Mettre à jour le statut d'un remboursement (Admin)
  updateRemboursementStatus: async (remboursementId: number, status: string): Promise<RemboursementDTO> => {
    const response = await api.put<ApiResponse<RemboursementDTO>>(
      `/remboursements/update_status?remboursementId=${remboursementId}&status=${status}`
    );
    return response.data.data;
  },

  // Supprimer un remboursement
  deleteRemboursement: async (id: number): Promise<void> => {
    await api.delete<ApiResponse<void>>(`/remboursements/delete?id=${id}`);
  },

  // Obtenir les remboursements de l'utilisateur connecté
  getMyRemboursements: async (pageable?: Pageable): Promise<Page<RemboursementDTO>> => {
    const params = new URLSearchParams();
    if (pageable?.page !== undefined) params.append('page', pageable.page.toString());
    if (pageable?.size !== undefined) params.append('size', pageable.size.toString());
    if (pageable?.sort) params.append('sort', pageable.sort);

    const response = await api.get<ApiResponse<Page<RemboursementDTO>>>(`/remboursements/myRemboursements?${params}`);
    return response.data.data;
  }
};

export default remboursementsAPI;