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

    const response = await api.get<ApiResponse<Page<CategorieDTO>>>(`/categories/?${params}`);
    return response.data.data;
  },

  // Obtenir une catégorie par nom
  getCategoryByName: async (name: string): Promise<CategorieDTO> => {
    const response = await api.get<ApiResponse<CategorieDTO>>(`/categories/by-name?name=${encodeURIComponent(name)}`);
    return response.data.data;
  },

  // Créer une nouvelle catégorie
  createCategory: async (categoryData: CategorieDTO): Promise<CategorieDTO> => {
    const response = await api.post<ApiResponse<CategorieDTO>>('/categories/', categoryData);
    return response.data.data;
  },

  // Mettre à jour une catégorie
  updateCategory: async (id: number, newName: string): Promise<CategorieDTO> => {
    const response = await api.put<ApiResponse<CategorieDTO>>(`/categories/update/${id}?newName=${encodeURIComponent(newName)}`);
    return response.data.data;
  },

  // Supprimer une catégorie
  deleteCategory: async (id: number): Promise<void> => {
    await api.delete(`/categories/delete/${id}`);
  }
};

export default categoriesAPI;