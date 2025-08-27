import api from './axios';
import { ApiResponse, Page, Pageable } from '@/types/api';
import { UtilisateurResponse, UtilisateurRequest, RegisterRequest } from '@/types/entities';

export const usersAPI = {
  // Lister tous les utilisateurs (avec pagination)
  getAllUsers: async (pageable?: Pageable): Promise<Page<UtilisateurResponse>> => {
    try {
      const params = new URLSearchParams();
      if (pageable?.page !== undefined) params.append('page', pageable.page.toString());
      if (pageable?.size !== undefined) params.append('size', pageable.size.toString());
      if (pageable?.sort) params.append('sort', pageable.sort);

      const url = `/utilisateurs${params.toString() ? `?${params.toString()}` : ''}`;
      console.log('🌐 Appel API Users:', url);
      
      const response = await api.get(url);
      console.log('📡 Réponse API Users:', response.data);
      
      // Le backend retourne directement la page
      return response.data;
      
    } catch (error) {
      console.error('❌ Erreur dans getAllUsers:', error);
      throw error;
    }
  },

  // Obtenir l'utilisateur actuel (compte propre)
  getCurrentUser: async (): Promise<UtilisateurResponse> => {
    console.log('🔍 Récupération de l\'utilisateur actuel...');
    const response = await api.get<ApiResponse<UtilisateurResponse>>('/utilisateurs/account');
    console.log('✅ Utilisateur actuel récupéré:', response.data.data);
    return response.data.data;
  },

  // Obtenir un utilisateur par ID
  getUserById: async (id: number): Promise<UtilisateurResponse> => {
    const response = await api.get(`/utilisateurs/${id}`);
    return response.data;
  },

  // Créer un utilisateur
  createUser: async (userData: UtilisateurRequest): Promise<UtilisateurResponse> => {
    console.log('🆕 Création d\'un nouvel utilisateur:', userData);
    const response = await api.post('/utilisateurs/create', userData);
    console.log('✅ Utilisateur créé:', response.data);
    return response.data;
  },

  // Mettre à jour un utilisateur
  updateUser: async (id: number, userData: UtilisateurRequest): Promise<UtilisateurResponse> => {
    console.log('📝 Mise à jour utilisateur ID:', id, 'avec données:', userData);
    const response = await api.put(`/utilisateurs/update/${id}`, userData);
    console.log('✅ Utilisateur mis à jour:', response.data);
    return response.data;
  },

  // Supprimer un utilisateur
  deleteUser: async (id: number): Promise<void> => {
    console.log('🗑️ Suppression utilisateur ID:', id);
    await api.delete(`/utilisateurs/${id}`);
    console.log('✅ Utilisateur supprimé');
  },

  // Obtenir un utilisateur par code badge
  getUserByBadgeCode: async (codeBadge: string): Promise<UtilisateurResponse> => {
    console.log('🎫 Recherche utilisateur par code badge:', codeBadge);
    const response = await api.get<ApiResponse<UtilisateurResponse>>(
      `/utilisateurs/badge?codeBadge=${codeBadge}`
    );
    console.log('✅ Utilisateur trouvé par badge:', response.data.data);
    return response.data.data;
  },

  // Changer le mot de passe
  changePassword: async (id: number, oldPassword: string, newPassword: string): Promise<UtilisateurResponse> => {
    console.log('� Changement de mot de passe pour utilisateur ID:', id);
    const response = await api.put(
      `/utilisateurs/${id}/change-password?oldPassword=${encodeURIComponent(oldPassword)}&newPassword=${encodeURIComponent(newPassword)}`
    );
    console.log('✅ Mot de passe changé');
    return response.data;
  },

  // Réinitialiser le mot de passe
  resetPassword: async (email: string): Promise<void> => {
    console.log('🔄 Réinitialisation mot de passe pour email:', email);
    await api.post(`/utilisateurs/reset-password?email=${encodeURIComponent(email)}`);
    console.log('✅ Email de réinitialisation envoyé');
  },

  // Activer/désactiver un utilisateur
  toggleUserStatus: async (id: number, isActive: boolean): Promise<UtilisateurResponse> => {
    console.log('� Changement statut utilisateur ID:', id, 'actif:', isActive);
    const response = await api.put(`/utilisateurs/${id}/toggle-status?isActive=${isActive}`);
    console.log('✅ Statut utilisateur modifié');
    return response.data;
  },

  // Rechercher des utilisateurs
  searchUsers: async (query: string, pageable?: Pageable): Promise<Page<UtilisateurResponse>> => {
    try {
      const params = new URLSearchParams();
      params.append('query', query);
      if (pageable?.page !== undefined) params.append('page', pageable.page.toString());
      if (pageable?.size !== undefined) params.append('size', pageable.size.toString());
      if (pageable?.sort) params.append('sort', pageable.sort);

      const response = await api.get(`/utilisateurs/search?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('❌ Erreur dans searchUsers:', error);
      throw error;
    }
  },

  // Obtenir utilisateurs par rôle
  getUsersByRole: async (role: string, pageable?: Pageable): Promise<Page<UtilisateurResponse>> => {
    try {
      const params = new URLSearchParams();
      if (pageable?.page !== undefined) params.append('page', pageable.page.toString());
      if (pageable?.size !== undefined) params.append('size', pageable.size.toString());
      if (pageable?.sort) params.append('sort', pageable.sort);

      const response = await api.get(`/utilisateurs/by-role/${role}${params.toString() ? `?${params.toString()}` : ''}`);
      return response.data;
    } catch (error) {
      console.error('❌ Erreur dans getUsersByRole:', error);
      throw error;
    }
  },

  // Obtenir utilisateurs par catégorie
  getUsersByCategory: async (cadre: string, pageable?: Pageable): Promise<Page<UtilisateurResponse>> => {
    try {
      const params = new URLSearchParams();
      if (pageable?.page !== undefined) params.append('page', pageable.page.toString());
      if (pageable?.size !== undefined) params.append('size', pageable.size.toString());
      if (pageable?.sort) params.append('sort', pageable.sort);

      const response = await api.get(`/utilisateurs/by-category/${encodeURIComponent(cadre)}${params.toString() ? `?${params.toString()}` : ''}`);
      return response.data;
    } catch (error) {
      console.error('❌ Erreur dans getUsersByCategory:', error);
      throw error;
    }
  },

  // Obtenir utilisateurs actifs
  getActiveUsers: async (pageable?: Pageable): Promise<Page<UtilisateurResponse>> => {
    try {
      const params = new URLSearchParams();
      if (pageable?.page !== undefined) params.append('page', pageable.page.toString());
      if (pageable?.size !== undefined) params.append('size', pageable.size.toString());
      if (pageable?.sort) params.append('sort', pageable.sort);

      const response = await api.get(`/utilisateurs/active${params.toString() ? `?${params.toString()}` : ''}`);
      return response.data;
    } catch (error) {
      console.error('❌ Erreur dans getActiveUsers:', error);
      throw error;
    }
  },

  // Obtenir utilisateurs avec solde faible
  getUsersWithLowBalance: async (threshold: number, pageable?: Pageable): Promise<Page<UtilisateurResponse>> => {
    try {
      const params = new URLSearchParams();
      params.append('threshold', threshold.toString());
      if (pageable?.page !== undefined) params.append('page', pageable.page.toString());
      if (pageable?.size !== undefined) params.append('size', pageable.size.toString());
      if (pageable?.sort) params.append('sort', pageable.sort);

      const response = await api.get(`/utilisateurs/low-balance?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('❌ Erreur dans getUsersWithLowBalance:', error);
      throw error;
    }
  },

  // Obtenir statistiques utilisateurs
  getUserStatistics: async (): Promise<{ [key: string]: any }> => {
    const response = await api.get('/utilisateurs/statistics');
    return response.data;
  },

  // Déduire solde
  deductBalance: async (id: number, amount: number, reason: string): Promise<UtilisateurResponse> => {
    console.log('💸 Déduction solde utilisateur ID:', id, 'montant:', amount, 'raison:', reason);
    const response = await api.put(
      `/utilisateurs/${id}/deduct-balance?amount=${amount}&reason=${encodeURIComponent(reason)}`
    );
    console.log('✅ Solde déduit');
    return response.data;
  },

  // Obtenir utilisateurs sans badge
  getUsersWithoutBadge: async (): Promise<UtilisateurResponse[]> => {
    const response = await api.get('/utilisateurs/without-badge');
    return response.data;
  }
};

export default usersAPI;