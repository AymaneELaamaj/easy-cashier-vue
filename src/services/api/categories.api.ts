import api from './axios';
import { ApiResponse, Page, Pageable } from '@/types/api';
import { CategorieDTO } from '@/types/entities';

export const categoriesAPI = {
  // Lister toutes les catégories (avec pagination)
  getAllCategories: async (pageable?: Pageable): Promise<Page<CategorieDTO>> => {
    const params = new URLSearchParams();
    if (pageable?.page !== undefined) params.append('page', pageable.page.toString());
    if (pageable?.size !== undefined) params.append('size', pageable.size.toString());
    if (pageable?.sort) params.append('sort', pageable.sort);

    const response = await api.get<ApiResponse<Page<CategorieDTO>>>(`/categories/all?${params}`);
    return response.data.data;
  },

  // Obtenir une catégorie par ID
  getCategoryById: async (id: number): Promise<CategorieDTO> => {
    const response = await api.get<ApiResponse<CategorieDTO>>(`/categories/${id}`);
    return response.data.data;
  },

  // Créer une nouvelle catégorie
  createCategory: async (categoryData: CategorieDTO): Promise<CategorieDTO> => {
    const response = await api.post<ApiResponse<CategorieDTO>>('/categories/create', categoryData);
    return response.data.data;
  },

  // Mettre à jour une catégorie
  updateCategory: async (id: number, categoryData: CategorieDTO): Promise<CategorieDTO> => {
    const response = await api.put<ApiResponse<CategorieDTO>>(`/categories/update/${id}`, categoryData);
    return response.data.data;
  },

  // Supprimer une catégorie
  deleteCategory: async (id: number): Promise<void> => {
    await api.delete(`/categories/${id}`);
  }
};

export default categoriesAPI;