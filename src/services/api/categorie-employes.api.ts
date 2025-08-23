import api from './axios';
import { Page, Pageable } from '@/types/api';
import { CategorieEmployesDTO } from '@/types/entities';

export const categorieEmployesAPI = {
  // Lister toutes les catégories d'employés (avec pagination)
  getAll: async (pageable?: Pageable): Promise<Page<CategorieEmployesDTO>> => {
    const params = new URLSearchParams();
    if (pageable?.page !== undefined) params.append('page', pageable.page.toString());
    if (pageable?.size !== undefined) params.append('size', pageable.size.toString());
    if (pageable?.sort) params.append('sort', pageable.sort);

    const qs = params.toString();
    const response = await api.get(`/categorie-employes/all${qs ? `?${qs}` : ''}`);
    return response.data;
  },

  // Obtenir une catégorie par ID
  getById: async (id: number): Promise<CategorieEmployesDTO> => {
    const response = await api.get(`/categorie-employes/${id}`);
    return response.data;
  },

  // Créer une nouvelle catégorie d'employé
  create: async (cadre: string): Promise<CategorieEmployesDTO> => {
    const response = await api.post('/categorie-employes/create', { cadre });
    return response.data;
  },

  // Mettre à jour une catégorie d'employé
  update: async (id: number, cadre: string): Promise<CategorieEmployesDTO> => {
    const response = await api.patch(`/categorie-employes/${id}?cadre=${encodeURIComponent(cadre)}`);
    return response.data;
  },

  // Supprimer une catégorie d'employé
  delete: async (id: number): Promise<void> => {
    await api.delete(`/categorie-employes/${id}`);
  }
};

export default categorieEmployesAPI;