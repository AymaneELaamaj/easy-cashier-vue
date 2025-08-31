import api from './axios';
import { ApiResponse, RapportsApiResponse } from '@/types/api';
import { RapportDTO } from '@/types/entities';

export const rapportsAPI = {
  // Générer un rapport de l'historique complet (mois courant)
  genererHistorique: async (): Promise<RapportDTO> => {
    const response = await api.post<ApiResponse<RapportDTO>>('/rapports/generer-historique');
    // Vérification que data existe
    if (!response.data || response.data.data === undefined) {
      throw new Error('Aucune donnée reçue du serveur');
    }
    return response.data.data;
  },

  // Générer un rapport pour un mois spécifique
  genererHistoriqueMensuel: async (annee: number, mois: number): Promise<RapportDTO> => {
    const response = await api.post<ApiResponse<RapportDTO>>(`/rapports/generer-historique/${annee}/${mois}`);
    if (!response.data || response.data.data === undefined) {
      throw new Error('Aucune donnée reçue du serveur');
    }
    return response.data.data;
  },

  // Lister tous les rapports - CORRIGÉ pour utiliser la structure "items"
  getAllRapports: async (): Promise<RapportDTO[]> => {
    console.log('📋 Appel API: GET /rapports');
    const response = await api.get<RapportsApiResponse<RapportDTO[]>>('/rapports');
    console.log('📋 Réponse API:', response.data);
    
    // CORRECTION: Utiliser "items" au lieu de "data"
    const rapports = response.data?.items || [];
    console.log('📋 Rapports extraits:', rapports);
    return rapports;
  },

  // Obtenir l'historique d'un rapport (rapport + transactions)
  getRapportHistorique: async (id: number): Promise<{ [key: string]: any }> => {
    const response = await api.get<ApiResponse<{ [key: string]: any }>>(`/rapports/${id}/historique`);
    if (!response.data || response.data.data === undefined) {
      throw new Error('Aucune donnée trouvée pour ce rapport');
    }
    return response.data.data;
  },

  // Exporter un rapport en JSON
  exportRapportJSON: async (id: number): Promise<{ [key: string]: any }> => {
    const response = await api.get<ApiResponse<{ [key: string]: any }>>(`/rapports/${id}/export-json`);
    if (!response.data || response.data.data === undefined) {
      throw new Error('Erreur lors de l\'export JSON');
    }
    return response.data.data;
  },

  // Télécharger directement un rapport PDF
  downloadRapportPDF: async (id: number): Promise<Blob> => {
    const response = await api.get(`/rapports/${id}/download-pdf`, {
      responseType: 'blob'
    });
    return response.data;
  },

  // Générer un PDF (retourne le chemin du fichier)
  genererPDF: async (id: number): Promise<string> => {
    const response = await api.post<ApiResponse<string>>(`/rapports/${id}/export-pdf`);
    if (!response.data || response.data.data === undefined) {
      throw new Error('Erreur lors de la génération du PDF');
    }
    return response.data.data;
  },

  // Supprimer un rapport
  deleteRapport: async (id: number): Promise<string> => {
    const response = await api.delete<ApiResponse<string>>(`/rapports/${id}`);
    return response.data?.data || 'Rapport supprimé avec succès';
  }
};

export default rapportsAPI;