import api from './axios';
import { Page, Pageable } from '@/types/api';
import { CategorieEmployesDTO } from '@/types/entities';

export const categorieEmployesAPI = {
  // Lister toutes les catégories d'employés
  getAllCategoriesEmployes: async (pageable?: Pageable): Promise<Page<CategorieEmployesDTO>> => {
    const params = new URLSearchParams();
    if (pageable?.page !== undefined) params.append('page', pageable.page.toString());
    if (pageable?.size !== undefined) params.append('size', pageable.size.toString());
    if (pageable?.sort) params.append('sort', pageable.sort);

    const response = await api.get<Page<CategorieEmployesDTO>>(`/categorie-employes/all?${params}`);
    return response.data;
  },

  // Obtenir une catégorie d'employé par ID
  getCategorieEmployeById: async (id: number): Promise<CategorieEmployesDTO> => {
    const response = await api.get<CategorieEmployesDTO>(`/categorie-employes/${id}`);
    return response.data;
  },

  // Créer une nouvelle catégorie d'employé
  createCategorieEmploye: async (cadre: string): Promise<CategorieEmployesDTO> => {
    const response = await api.post<CategorieEmployesDTO>('/categorie-employes/create', { cadre });
    return response.data;
  },

  // Mettre à jour une catégorie d'employé
  updateCategorieEmploye: async (id: number, cadre: string): Promise<CategorieEmployesDTO> => {
    const response = await api.patch<CategorieEmployesDTO>(`/categorie-employes/${id}?cadre=${encodeURIComponent(cadre)}`);
    return response.data;
  },

  // Supprimer une catégorie d'employé
  deleteCategorieEmploye: async (id: number): Promise<void> => {
    await api.delete(`/categorie-employes/${id}`);
  }
};

export default categorieEmployesAPI;