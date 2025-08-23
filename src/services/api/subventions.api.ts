import api from './axios';
import { ApiResponse, Page, Pageable } from '@/types/api';
import { SubventionDTO } from '@/types/entities';

export const subventionsAPI = {
  // Créer une nouvelle subvention
  createSubvention: async (subventionData: SubventionDTO): Promise<SubventionDTO> => {
    const response = await api.post<ApiResponse<SubventionDTO>>('/subventions/create', subventionData);
    return response.data.data;
  },

  // Lister toutes les subventions
  getAllSubventions: async (pageable?: Pageable): Promise<Page<SubventionDTO>> => {
    const params = new URLSearchParams();
    if (pageable?.page !== undefined) params.append('page', pageable.page.toString());
    if (pageable?.size !== undefined) params.append('size', pageable.size.toString());
    if (pageable?.sort) params.append('sort', pageable.sort);

    const response = await api.get<ApiResponse<Page<SubventionDTO>>>(`/subventions/all?${params}`);
    return response.data.data;
  },

  // Obtenir une subvention par ID
  getSubventionById: async (id: number): Promise<SubventionDTO> => {
    const response = await api.get<ApiResponse<SubventionDTO>>(`/subventions/${id}`);
    return response.data.data;
  },

  // Mettre à jour une subvention
  updateSubvention: async (id: number, subventionData: SubventionDTO): Promise<SubventionDTO> => {
    const response = await api.put<ApiResponse<SubventionDTO>>(`/subventions/update?id=${id}`, subventionData);
    return response.data.data;
  },

  // Supprimer une subvention
  deleteSubvention: async (id: number): Promise<void> => {
    await api.delete<ApiResponse<void>>(`/subventions/delete?id=${id}`);
  }
};

export default subventionsAPI;