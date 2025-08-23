import api from './axios';
import { ApiResponse, Page, Pageable } from '@/types/api';
import { UtilisateurDTO, RegisterRequest } from '@/types/entities';

export const usersAPI = {
  // Lister tous les utilisateurs (avec pagination)
  getAllUsers: async (pageable?: Pageable): Promise<Page<UtilisateurDTO>> => {
    const params = new URLSearchParams();
    if (pageable?.page !== undefined) params.append('page', pageable.page.toString());
    if (pageable?.size !== undefined) params.append('size', pageable.size.toString());
    if (pageable?.sort) params.append('sort', pageable.sort);

    const response = await api.get<ApiResponse<Page<UtilisateurDTO>>>(`/utilisateurs/all?${params}`);
    return response.data.data;
  },

  // Lister les utilisateurs non assignés
  getUnassignedUsers: async (pageable?: Pageable): Promise<Page<UtilisateurDTO>> => {
    const params = new URLSearchParams();
    if (pageable?.page !== undefined) params.append('page', pageable.page.toString());
    if (pageable?.size !== undefined) params.append('size', pageable.size.toString());
    if (pageable?.sort) params.append('sort', pageable.sort);

    const response = await api.get<ApiResponse<Page<UtilisateurDTO>>>(`/utilisateurs/unassigned?${params}`);
    return response.data.data;
  },

  // Obtenir un utilisateur par ID
  getUserById: async (id: number): Promise<UtilisateurDTO> => {
    const response = await api.get<ApiResponse<UtilisateurDTO>>(`/utilisateurs/${id}`);
    return response.data.data;
  },

  // Obtenir le profil de l'utilisateur connecté
  getCurrentUser: async (): Promise<UtilisateurDTO> => {
    const response = await api.get<ApiResponse<UtilisateurDTO>>('/utilisateurs/account');
    return response.data.data;
  },

  // Créer un nouvel utilisateur
  createUser: async (userData: RegisterRequest): Promise<UtilisateurDTO> => {
    const response = await api.post<ApiResponse<UtilisateurDTO>>('/utilisateurs/create', userData);
    return response.data.data;
  },

  // Mettre à jour un utilisateur
  updateUser: async (id: number, userData: Partial<UtilisateurDTO>): Promise<UtilisateurDTO> => {
    const response = await api.patch<ApiResponse<UtilisateurDTO>>(`/utilisateurs/update/${id}`, userData);
    return response.data.data;
  },

  // Supprimer un utilisateur
  deleteUser: async (userId: number): Promise<void> => {
    await api.delete<ApiResponse<void>>(`/utilisateurs/delete?userId=${userId}`);
  },

  // Recharger le solde d'un utilisateur
  chargeUserBalance: async (userId: number, amount: number): Promise<UtilisateurDTO> => {
    const response = await api.patch<ApiResponse<UtilisateurDTO>>(`/utilisateurs/charge/?UserId=${userId}&amount=${amount}`);
    return response.data.data;
  },

  // Initialiser le solde d'un utilisateur
  initializeUserBalance: async (userId: number): Promise<UtilisateurDTO> => {
    const response = await api.patch<ApiResponse<UtilisateurDTO>>(`/utilisateurs/initialize/?userId=${userId}`);
    return response.data.data;
  },

  // Changer la catégorie d'un utilisateur
  changeUserCategory: async (userId: number, cadre: string): Promise<UtilisateurDTO> => {
    const response = await api.patch<ApiResponse<UtilisateurDTO>>(`/utilisateurs/changer-categorie?userId=${userId}&cadre=${encodeURIComponent(cadre)}`);
    return response.data.data;
  },

  // Obtenir un utilisateur par code badge
  getUserByBadgeCode: async (codeBadge: string): Promise<UtilisateurDTO> => {
    const response = await api.get<ApiResponse<UtilisateurDTO>>(`/utilisateurs/badge?codeBadge=${encodeURIComponent(codeBadge)}`);
    return response.data.data;
  },

  // Lister les caissiers
  getCaissiers: async (pageable?: Pageable): Promise<Page<UtilisateurDTO>> => {
    const params = new URLSearchParams();
    if (pageable?.page !== undefined) params.append('page', pageable.page.toString());
    if (pageable?.size !== undefined) params.append('size', pageable.size.toString());
    if (pageable?.sort) params.append('sort', pageable.sort);

    const response = await api.get<ApiResponse<Page<UtilisateurDTO>>>(`/utilisateurs/caissiers?${params}`);
    return response.data.data;
  }
};

export default usersAPI;