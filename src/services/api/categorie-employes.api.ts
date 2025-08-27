import api from './axios';
import { Page, Pageable } from '@/types/api';
import { CategorieEmployesResponse } from '@/types/entities';

export const categorieEmployesAPI = {
  // Lister toutes les catégories d'employés (avec pagination)
  getAll: async (pageable?: Pageable): Promise<Page<CategorieEmployesResponse>> => {
    try {
      const params = new URLSearchParams();
      if (pageable?.page !== undefined) params.append('page', pageable.page.toString());
      if (pageable?.size !== undefined) params.append('size', pageable.size.toString());
      if (pageable?.sort) params.append('sort', pageable.sort);

      const qs = params.toString();
      const url = `/categories-employes/all${qs ? `?${qs}` : ''}`;
      console.log('🌐 Appel API Categories Employés:', url);
      
      const response = await api.get(url);
      console.log('📡 Réponse API Categories:', response.data);
      
      // Adapter selon la structure de votre réponse
      if (response.data.page) {
        return response.data.page;
      }
      return response.data.data || response.data;
      
    } catch (error) {
      console.error('❌ Erreur dans getAll categories:', error);
      throw error;
    }
  },

  // Version lite pour récupérer toutes les catégories sans pagination
  getAllLite: async (): Promise<Array<{ id: number; cadre?: string }>> => {
    const res = await categorieEmployesAPI.getAll({ page: 0, size: 1000 });
    const content = (res as any)?.content;
    if (Array.isArray(content)) return content;
    if (Array.isArray((res as any)?.data?.content)) return (res as any).data.content;
    if (Array.isArray(res)) return res as any[];
    return [];
  },

  // Obtenir une catégorie par ID
  getById: async (id: number): Promise<CategorieEmployesResponse> => {
    console.log('🔍 Récupération catégorie ID:', id);
    const response = await api.get(`/categories-employes/${id}`);
    console.log('✅ Catégorie trouvée:', response.data);
    return response.data.data || response.data;
  },

  // Créer une nouvelle catégorie d'employé
  create: async (cadre: string): Promise<CategorieEmployesResponse> => {
    console.log('🆕 Création catégorie avec cadre:', cadre);
    
    // Le backend attend le paramètre 'cadre' en query parameter
    const response = await api.post(`/categories-employes/create?cadre=${encodeURIComponent(cadre)}`);
    console.log('✅ Catégorie créée:', response.data);
    return response.data.data || response.data;
  },

  // Mettre à jour une catégorie d'employé
  update: async (id: number, cadre: string): Promise<CategorieEmployesResponse> => {
    console.log('📝 Mise à jour catégorie ID:', id, 'avec cadre:', cadre);
    
    // Le backend attend le paramètre 'cadre' en query parameter
    const response = await api.patch(`/categories-employes/${id}?cadre=${encodeURIComponent(cadre)}`);
    console.log('✅ Catégorie mise à jour:', response.data);
    return response.data.data || response.data;
  },

  // Supprimer une catégorie d'employé
  delete: async (id: number): Promise<void> => {
    console.log('🗑️ Suppression catégorie ID:', id);
    await api.delete(`/categories-employes/${id}`);
    console.log('✅ Catégorie supprimée');
  }
};

export default categorieEmployesAPI;