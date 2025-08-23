import api from './axios';
import { ApiResponse, Page, Pageable } from '@/types/api';
import { ArticleDTO } from '@/types/entities';

export const articlesAPI = {
  // Créer un nouvel article
  createArticle: async (articleData: ArticleDTO): Promise<ArticleDTO> => {
    const response = await api.post<ApiResponse<ArticleDTO>>('/articles/createProduct', articleData);
    return response.data.data;
  },

  // Lister tous les articles (avec pagination)
  getAllArticles: async (pageable?: Pageable): Promise<Page<ArticleDTO>> => {
    const params = new URLSearchParams();
    if (pageable?.page !== undefined) params.append('page', pageable.page.toString());
    if (pageable?.size !== undefined) params.append('size', pageable.size.toString());
    if (pageable?.sort) params.append('sort', pageable.sort);

    const response = await api.get<ApiResponse<Page<ArticleDTO>>>(`/articles/products?${params}`);
    return response.data.data;
  },

  // Obtenir un article par nom
  getArticleByName: async (name: string): Promise<ArticleDTO> => {
    const response = await api.get<ApiResponse<ArticleDTO>>(`/articles/products/${encodeURIComponent(name)}`);
    return response.data.data;
  },

  // Mettre à jour un article
  updateArticle: async (id: number, articleData: ArticleDTO): Promise<ArticleDTO> => {
    const response = await api.put<ApiResponse<ArticleDTO>>(`/articles/update/${id}`, articleData);
    return response.data.data;
  },

  // Supprimer un article
  deleteArticle: async (id: number): Promise<void> => {
    await api.delete<ApiResponse<void>>(`/articles/${id}`);
  }
};

export default articlesAPI;