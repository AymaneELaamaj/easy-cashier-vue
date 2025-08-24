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
    try {
      const params = new URLSearchParams();
      if (pageable?.page !== undefined) params.append('page', pageable.page.toString());
      if (pageable?.size !== undefined) params.append('size', pageable.size.toString());
      if (pageable?.sort) params.append('sort', pageable.sort);

      const url = `/articles/products?${params}`;
      console.log('🌐 Appel API:', url);
      
      const response = await api.get<any>(url); // Changé le type générique
      console.log('📡 Réponse API brute:', response);
      console.log('📡 Response.data:', response.data);
      console.log('📡 Response.data.page:', response.data.page); // Log de la bonne propriété
      
      // ✅ CORRECTION: Utiliser response.data.page au lieu de response.data.data
      if (response.data && response.data.page) {
        console.log('✅ Données valides trouvées dans page:', response.data.page);
        return response.data.page; // ← Changement ici
      }
      
      console.log('⚠️ Pas de données valides, retour page vide');
      // Retourner une page vide si pas de données
      return {
        content: [],
        totalElements: 0,
        totalPages: 0,
        size: pageable?.size || 10,
        number: pageable?.page || 0,
        first: true,
        last: true,
        empty: true
      };
    } catch (error) {
      console.error('❌ Erreur dans getAllArticles:', error);
      throw error;
    }
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