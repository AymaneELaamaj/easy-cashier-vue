import api from './axios';
import { ApiResponse, Page, Pageable } from '@/types/api';
import { BadgeDTO } from '@/types/entities';

export const badgesAPI = {
  // Créer un nouveau badge
  createBadge: async (badgeData: BadgeDTO): Promise<BadgeDTO> => {
    const response = await api.post<ApiResponse<BadgeDTO>>('/badges/create', badgeData);
    return response.data.data;
  },

  // Lister tous les badges (avec pagination)
  getAllBadges: async (pageable?: Pageable): Promise<Page<BadgeDTO>> => {
    const params = new URLSearchParams();
    if (pageable?.page !== undefined) params.append('page', pageable.page.toString());
    if (pageable?.size !== undefined) params.append('size', pageable.size.toString());
    if (pageable?.sort) params.append('sort', pageable.sort);

    const response = await api.get<ApiResponse<Page<BadgeDTO>>>(`/badges/all?${params}`);
    return response.data.data;
  },

  // Lister les badges non assignés
  getUnassignedBadges: async (pageable?: Pageable): Promise<Page<BadgeDTO>> => {
    const params = new URLSearchParams();
    if (pageable?.page !== undefined) params.append('page', pageable.page.toString());
    if (pageable?.size !== undefined) params.append('size', pageable.size.toString());
    if (pageable?.sort) params.append('sort', pageable.sort);

    const response = await api.get<ApiResponse<Page<BadgeDTO>>>(`/badges/unassigned?${params}`);
    return response.data.data;
  },

  // Obtenir un badge par ID
  getBadgeById: async (id: number): Promise<BadgeDTO> => {
    const response = await api.get<ApiResponse<BadgeDTO>>(`/badges/${id}`);
    return response.data.data;
  },

  // Obtenir un badge par code
  getBadgeByCode: async (codeBadge: string): Promise<BadgeDTO> => {
    const response = await api.get<ApiResponse<BadgeDTO>>(`/badges/code?codeBadge=${encodeURIComponent(codeBadge)}`);
    return response.data.data;
  },

  // Activer un badge
  activateBadge: async (id: number): Promise<BadgeDTO> => {
    const response = await api.patch<ApiResponse<BadgeDTO>>(`/badges/activer/${id}`);
    return response.data.data;
  },

  // Désactiver un badge
  deactivateBadge: async (id: number): Promise<BadgeDTO> => {
    const response = await api.patch<ApiResponse<BadgeDTO>>(`/badges/desactiver/${id}`);
    return response.data.data;
  },

  // Assigner un badge à un utilisateur
  assignBadge: async (utilisateurId: number, badgeId: number): Promise<BadgeDTO> => {
    const response = await api.patch<ApiResponse<BadgeDTO>>(`/badges/assigner?utilisateurId=${utilisateurId}&badgeId=${badgeId}`);
    return response.data.data;
  },

  // Supprimer un badge
  deleteBadge: async (id: number): Promise<void> => {
    await api.delete<ApiResponse<void>>(`/badges/${id}`);
  }
};

export default badgesAPI;