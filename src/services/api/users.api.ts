import api from './axios';
import { ApiResponse, Page, Pageable } from '@/types/api';
import { UtilisateurDTO, RegisterRequest } from '@/types/entities';

export const usersAPI = {
  // Lister tous les utilisateurs (avec pagination)
  getAllUsers: async (pageable?: Pageable): Promise<Page<UtilisateurDTO>> => {
    try {
      const params = new URLSearchParams();
      if (pageable?.page !== undefined) params.append('page', pageable.page.toString());
      if (pageable?.size !== undefined) params.append('size', pageable.size.toString());
      if (pageable?.sort) params.append('sort', pageable.sort);

      const url = `/utilisateurs/all?${params}`;
      console.log('🌐 Appel API Users:', url);
      
      const response = await api.get<any>(url);
      console.log('📡 Réponse API Users brute:', response);
      console.log('📡 Response.data:', response.data);
      console.log('📡 Response.data.page:', response.data.page);
      
      // ✅ CORRECTION: Utiliser response.data.page au lieu de response.data.data
      if (response.data && response.data.page) {
        console.log('✅ Données users valides trouvées dans page:', response.data.page);
        return response.data.page;
      }
      
      console.log('⚠️ Pas de données users valides, retour page vide');
      // Retourner une page vide si pas de données
      return {
        content: [],
        totalElements: 0,
        totalPages: 0,
        size: pageable?.size || 20,
        number: pageable?.page || 0,
        first: true,
        last: true,
        empty: true
      };
    } catch (error) {
      console.error('❌ Erreur dans getAllUsers:', error);
      throw error;
    }
  },

  // Obtenir l'utilisateur actuel (compte propre)
  getCurrentUser: async (): Promise<UtilisateurDTO> => {
    console.log('🔍 Récupération de l\'utilisateur actuel...');
    const response = await api.get<ApiResponse<UtilisateurDTO>>('/utilisateurs/account');
    console.log('✅ Utilisateur actuel récupéré:', response.data.data);
    return response.data.data;
  },

  // Obtenir un utilisateur par ID
  getUserById: async (id: number): Promise<UtilisateurDTO> => {
    const response = await api.get<ApiResponse<UtilisateurDTO>>(`/utilisateurs/${id}`);
    return response.data.data;
  },

  // Créer un utilisateur
  createUser: async (userData: RegisterRequest): Promise<UtilisateurDTO> => {
    console.log('🆕 Création d\'un nouvel utilisateur:', userData);
    const response = await api.post<ApiResponse<UtilisateurDTO>>('/utilisateurs/create', userData);
    console.log('✅ Utilisateur créé:', response.data.data);
    return response.data.data;
  },

  // Mettre à jour un utilisateur
  updateUser: async (id: number, userData: RegisterRequest): Promise<UtilisateurDTO> => {
    console.log('📝 Mise à jour utilisateur ID:', id, 'avec données:', userData);
    const response = await api.patch<ApiResponse<UtilisateurDTO>>(`/utilisateurs/update/${id}`, userData);
    console.log('✅ Utilisateur mis à jour:', response.data.data);
    return response.data.data;
  },

  // Supprimer un utilisateur
  deleteUser: async (id: number): Promise<void> => {
    console.log('🗑️ Suppression utilisateur ID:', id);
    await api.delete<ApiResponse<void>>(`/utilisateurs/delete?userId=${id}`);
    console.log('✅ Utilisateur supprimé');
  },

  // Charger le solde d'un utilisateur
  chargeBalance: async (userId: number, amount: number): Promise<UtilisateurDTO> => {
    console.log('💰 Rechargement solde pour utilisateur ID:', userId, 'montant:', amount);
    const response = await api.patch<ApiResponse<UtilisateurDTO>>(
      `/utilisateurs/charge/?UserId=${userId}&amount=${amount}`
    );
    console.log('✅ Solde rechargé:', response.data.data);
    return response.data.data;
  },

  // Initialiser le solde d'un utilisateur
  initializeBalance: async (userId: number): Promise<UtilisateurDTO> => {
    console.log('🔄 Initialisation solde pour utilisateur ID:', userId);
    const response = await api.patch<ApiResponse<UtilisateurDTO>>(
      `/utilisateurs/initialize/?userId=${userId}`
    );
    console.log('✅ Solde initialisé:', response.data.data);
    return response.data.data;
  },

  // Changer la catégorie d'un employé
  changeCategory: async (userId: number, cadre: string): Promise<UtilisateurDTO> => {
    console.log('👔 Changement catégorie pour utilisateur ID:', userId, 'nouvelle catégorie:', cadre);
    const response = await api.patch<ApiResponse<UtilisateurDTO>>(
      `/utilisateurs/changer-categorie?userId=${userId}&cadre=${cadre}`
    );
    console.log('✅ Catégorie changée:', response.data.data);
    return response.data.data;
  },

  // Obtenir les utilisateurs non assignés
  getUnassignedUsers: async (pageable?: Pageable): Promise<Page<UtilisateurDTO>> => {
    try {
      const params = new URLSearchParams();
      if (pageable?.page !== undefined) params.append('page', pageable.page.toString());
      if (pageable?.size !== undefined) params.append('size', pageable.size.toString());
      if (pageable?.sort) params.append('sort', pageable.sort);

      const url = `/utilisateurs/unassigned?${params}`;
      console.log('🌐 Appel API Users non assignés:', url);
      
      const response = await api.get<any>(url);
      
      if (response.data && response.data.page) {
        console.log('✅ Utilisateurs non assignés trouvés:', response.data.page);
        return response.data.page;
      }
      
      return {
        content: [],
        totalElements: 0,
        totalPages: 0,
        size: pageable?.size || 20,
        number: pageable?.page || 0,
        first: true,
        last: true,
        empty: true
      };
    } catch (error) {
      console.error('❌ Erreur dans getUnassignedUsers:', error);
      throw error;
    }
  },

  // Obtenir les caissiers
  getCaissiers: async (pageable?: Pageable): Promise<Page<UtilisateurDTO>> => {
    try {
      const params = new URLSearchParams();
      if (pageable?.page !== undefined) params.append('page', pageable.page.toString());
      if (pageable?.size !== undefined) params.append('size', pageable.size.toString());
      if (pageable?.sort) params.append('sort', pageable.sort);

      const url = `/utilisateurs/caissiers?${params}`;
      console.log('🌐 Appel API Caissiers:', url);
      
      const response = await api.get<any>(url);
      
      if (response.data && response.data.page) {
        console.log('✅ Caissiers trouvés:', response.data.page);
        return response.data.page;
      }
      
      return {
        content: [],
        totalElements: 0,
        totalPages: 0,
        size: pageable?.size || 20,
        number: pageable?.page || 0,
        first: true,
        last: true,
        empty: true
      };
    } catch (error) {
      console.error('❌ Erreur dans getCaissiers:', error);
      throw error;
    }
  },

  // Obtenir un utilisateur par code badge
  getUserByBadgeCode: async (codeBadge: string): Promise<UtilisateurDTO> => {
    console.log('🎫 Recherche utilisateur par code badge:', codeBadge);
    const response = await api.get<ApiResponse<UtilisateurDTO>>(
      `/utilisateurs/badge?codeBadge=${codeBadge}`
    );
    console.log('✅ Utilisateur trouvé par badge:', response.data.data);
    return response.data.data;
  }
};

export default usersAPI;