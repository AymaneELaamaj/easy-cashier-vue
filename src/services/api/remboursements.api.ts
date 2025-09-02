import api from './axios';
import { ApiResponse, Page, Pageable } from '@/types/api';
import { RemboursementRequestDTO, RemboursementResponseDTO, StatusRemboursement } from '@/types/entities';

export const remboursementsAPI = {
  // Lister tous les remboursements (Admin/Super Admin uniquement)
  getAllRemboursements: async (pageable?: Pageable): Promise<Page<RemboursementResponseDTO>> => {
    try {
      const params = new URLSearchParams();
      if (pageable?.page !== undefined) params.append('page', pageable.page.toString());
      if (pageable?.size !== undefined) params.append('size', pageable.size.toString());
      if (pageable?.sort) params.append('sort', pageable.sort);

      const url = `/remboursements/all${params.toString() ? `?${params.toString()}` : ''}`;
      console.log('🌐 Appel API Remboursements (tous):', url);
      
      const response = await api.get<Page<RemboursementResponseDTO>>(url);
      console.log('📡 Réponse API Remboursements (tous):', response.data);
      return response.data;
      
    } catch (error) {
      console.error('❌ Erreur dans getAllRemboursements:', error);
      throw error;
    }
  },

  // Obtenir un remboursement par ID (Admin/Super Admin uniquement)
  getRemboursementById: async (id: number): Promise<RemboursementResponseDTO> => {
    try {
      console.log('🔍 Récupération remboursement ID:', id);
      const response = await api.get<RemboursementResponseDTO>(`/remboursements/${id}`);
      console.log('✅ Remboursement récupéré:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Erreur dans getRemboursementById:', error);
      throw error;
    }
  },

  // Créer une demande de remboursement (Employé uniquement)
  createDemandeRemboursement: async (request: RemboursementRequestDTO): Promise<RemboursementResponseDTO> => {
    try {
      console.log('🆕 Création demande remboursement:', request);
      const response = await api.post<RemboursementResponseDTO>(
        `/remboursements/demande`,
        request
      );
      console.log('✅ Demande remboursement créée:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Erreur dans createDemandeRemboursement:', error);
      throw error;
    }
  },

  // Mettre à jour une demande de remboursement (Employé - son propre remboursement)
  updateRemboursement: async (remboursementId: number, message: string): Promise<RemboursementResponseDTO> => {
    try {
      console.log('📝 Mise à jour remboursement ID:', remboursementId, 'avec message:', message);
      const response = await api.put<RemboursementResponseDTO>(
        `/remboursements/update?remboursementId=${remboursementId}&message=${encodeURIComponent(message)}`
      );
      console.log('✅ Remboursement mis à jour:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Erreur dans updateRemboursement:', error);
      throw error;
    }
  },

  // Mettre à jour le statut d'un remboursement (Admin/Super Admin uniquement)
  updateRemboursementStatus: async (remboursementId: number, status: StatusRemboursement): Promise<RemboursementResponseDTO> => {
    try {
      console.log('🔄 Mise à jour statut remboursement ID:', remboursementId, 'statut:', status);
      const response = await api.put<RemboursementResponseDTO>(
        `/remboursements/update_status?remboursementId=${remboursementId}&status=${status}`
      );
      console.log('✅ Statut remboursement mis à jour:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Erreur dans updateRemboursementStatus:', error);
      throw error;
    }
  },

  // Supprimer un remboursement (Employé - son propre remboursement)
  deleteRemboursement: async (id: number): Promise<void> => {
    try {
      console.log('🗑️ Suppression remboursement ID:', id);
      await api.delete(`/remboursements/${id}`);
      console.log('✅ Remboursement supprimé');
    } catch (error) {
      console.error('❌ Erreur dans deleteRemboursement:', error);
      throw error;
    }
  },

  // Obtenir les remboursements de l'utilisateur connecté (Employé - ses propres remboursements)
  getMyRemboursements: async (pageable?: Pageable): Promise<Page<RemboursementResponseDTO>> => {
    try {
      const params = new URLSearchParams();
      if (pageable?.page !== undefined) params.append('page', pageable.page.toString());
      if (pageable?.size !== undefined) params.append('size', pageable.size.toString());
      if (pageable?.sort) params.append('sort', pageable.sort);

      const url = `/remboursements/myRemboursements${params.toString() ? `?${params.toString()}` : ''}`;
      console.log('🌐 Appel API Remboursements (mes remboursements):', url);
      
      const response = await api.get<Page<RemboursementResponseDTO>>(url);
      console.log('📡 Réponse API Remboursements (mes remboursements):', response.data);
      return response.data;
      
    } catch (error) {
      console.error('❌ Erreur dans getMyRemboursements:', error);
      throw error;
    }
  }
};

export default remboursementsAPI;