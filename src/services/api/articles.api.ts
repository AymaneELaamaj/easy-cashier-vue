import api from './axios';
import { ApiResponse, Page, Pageable } from '@/types/api';
import { ArticleDTO, CreateArticleRequest, UpdateArticleRequest } from '@/types/entities';

// Utilitaire pour créer FormData avec article et image
const createFormData = (article: any, image?: File): FormData => {
  const formData = new FormData();
  
  // Ajouter l'article en tant que JSON string
  formData.append('article', JSON.stringify(article));
  
  // Ajouter l'image si elle existe
  if (image) {
    formData.append('image', image);
  }
  
  return formData;
};

export const articlesAPI = {
  // 🆕 NOUVEAU : Créer un nouvel article avec image
  createArticleWithImage: async (data: CreateArticleRequest): Promise<ArticleDTO> => {
    const formData = createFormData(data.article, data.image);
    
    const response = await api.post<ApiResponse<ArticleDTO>>(
      '/articles/createProduct', 
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data.data;
  },

  // ✅ MODIFIÉ : Créer un nouvel article (sans image - rétrocompatibilité)
  createArticle: async (articleData: ArticleDTO | CreateArticleRequest): Promise<ArticleDTO> => {
    // Si c'est une CreateArticleRequest avec image
    if ('article' in articleData && articleData.image) {
      return articlesAPI.createArticleWithImage(articleData);
    }
    
    // Si c'est une CreateArticleRequest sans image
    if ('article' in articleData) {
      const formData = createFormData(articleData.article);
      const response = await api.post<ApiResponse<ArticleDTO>>(
        '/articles/createProduct', 
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return response.data.data;
    }
    
    // Ancien format (ArticleDTO direct) - pour rétrocompatibilité
    const formData = createFormData(articleData);
    const response = await api.post<ApiResponse<ArticleDTO>>(
      '/articles/createProduct', 
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data.data;
  },

  // 🆕 NOUVEAU : Mettre à jour un article avec image
  updateArticleWithImage: async (id: number, data: UpdateArticleRequest): Promise<ArticleDTO> => {
    const formData = createFormData(data.article, data.image);
    
    const response = await api.put<ApiResponse<ArticleDTO>>(
      `/articles/${id}`, 
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data.data;
  },

  // ✅ MODIFIÉ : Mettre à jour un article (avec support image optionnel)
  updateArticle: async (id: number, articleData: ArticleDTO | UpdateArticleRequest): Promise<ArticleDTO> => {
    // Si c'est une UpdateArticleRequest avec image
    if ('article' in articleData && articleData.image) {
      return articlesAPI.updateArticleWithImage(id, articleData);
    }
    
    // Si c'est une UpdateArticleRequest sans image
    if ('article' in articleData) {
      const formData = createFormData(articleData.article);
      const response = await api.put<ApiResponse<ArticleDTO>>(
        `/articles/${id}`, 
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return response.data.data;
    }
    
    // Ancien format (ArticleDTO direct) - pour rétrocompatibilité
    const formData = createFormData(articleData);
    const response = await api.put<ApiResponse<ArticleDTO>>(
      `/articles/${id}`, 
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data.data;
  },

  // Lister tous les articles (avec pagination) - INCHANGÉ
  getAllArticles: async (pageable?: Pageable): Promise<Page<ArticleDTO>> => {
    try {
      const params = new URLSearchParams();
      if (pageable?.page !== undefined) params.append('page', pageable.page.toString());
      if (pageable?.size !== undefined) params.append('size', pageable.size.toString());
      if (pageable?.sort) params.append('sort', pageable.sort);

      const url = `/articles/products?${params}`;
      console.log('🌐 Appel API:', url);
      
      const response = await api.get<any>(url);
      console.log('📡 Réponse API brute:', response);
      console.log('📡 Response.data:', response.data);
      console.log('📡 Response.data.page:', response.data.page);
      
      if (response.data && response.data.page) {
        console.log('✅ Données valides trouvées dans page:', response.data.page);
        return response.data.page;
      }
      
      console.log('⚠️ Pas de données valides, retour page vide');
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

  // ajoute/replace cette fonction - INCHANGÉ
  getAllLite: async (): Promise<Array<{ id: number;  nom?: string }>> => {
    const page = await articlesAPI.getAllArticles({ page: 0, size: 1000 });
    const content = (page as any)?.content;
    if (Array.isArray(content)) return content;
    if (Array.isArray((page as any)?.data?.content)) return (page as any).data.content;
    if (Array.isArray(page)) return page as any[];
    return [];
  },

  // Obtenir un article par nom - INCHANGÉ
  getArticleByName: async (name: string): Promise<ArticleDTO> => {
    const response = await api.get<ApiResponse<ArticleDTO>>(`/articles/products/${encodeURIComponent(name)}`);
    return response.data.data;
  },

  // Supprimer un article - INCHANGÉ
  deleteArticle: async (id: number): Promise<void> => {
    await api.delete<ApiResponse<void>>(`/articles/${id}`);
  },

  // 🆕 NOUVEAU : Utilitaire pour construire l'URL complète d'une image
   getImageUrl: (imagePath?: string): string | null => {
    if (!imagePath) return null;

    // 1) déjà absolu → on renvoie tel quel
    if (/^https?:\/\//i.test(imagePath)) return imagePath;

    // 2) base de l'API (ex: http://localhost:8080/api)
    const apiBase = (api.defaults.baseURL as string) || '';

    // 3) racine serveur de fichiers (enlève le /api final)
    const envRoot = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/+$/, '');
    const serverOrigin =
      envRoot || apiBase.replace(/\/+$/, '').replace(/\/api$/i, '').replace(/\/api\/?$/i, '');

    // 4) normalise le chemin reçu du backend
    const normalized = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;

    try {
      return new URL(normalized, serverOrigin).toString();
    } catch {
      return `${serverOrigin}${normalized}`;
    }
  },

};

export default articlesAPI;