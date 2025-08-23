import api from './axios';
import { ApiResponse } from '@/types/api';
import { RapportDTO } from '@/types/entities';

export const rapportsAPI = {
  // Générer un rapport de l'historique complet
  genererHistorique: async (): Promise<RapportDTO> => {
    const response = await api.post<ApiResponse<RapportDTO>>('/rapports/generer-historique');
    return response.data.data;
  },

  // Générer un rapport pour un mois spécifique
  genererHistoriqueMensuel: async (annee: number, mois: number): Promise<RapportDTO> => {
    const response = await api.post<ApiResponse<RapportDTO>>(`/rapports/generer-historique/${annee}/${mois}`);
    return response.data.data;
  },

  // Lister tous les rapports
  getAllRapports: async (): Promise<RapportDTO[]> => {
    const response = await api.get<ApiResponse<RapportDTO[]>>('/rapports/');
    return response.data.data;
  },

  // Obtenir l'historique d'un rapport
  getRapportHistorique: async (id: number): Promise<{ [key: string]: any }> => {
    const response = await api.get<ApiResponse<{ [key: string]: any }>>(`/rapports/${id}/historique`);
    return response.data.data;
  },

  // Exporter un rapport en JSON
  exportRapportJSON: async (id: number): Promise<{ [key: string]: any }> => {
    const response = await api.get<ApiResponse<{ [key: string]: any }>>(`/rapports/${id}/export-json`);
    return response.data.data;
  },

  // Télécharger un rapport PDF (retourne l'URL ou les données binaires)
  downloadRapportPDF: async (id: number): Promise<Blob> => {
    const response = await api.get(`/rapports/${id}/export-pdf`, {
      responseType: 'blob'
    });
    return response.data;
  },

  // Supprimer un rapport
  deleteRapport: async (id: number): Promise<string> => {
    const response = await api.delete<ApiResponse<string>>(`/rapports/${id}`);
    return response.data.data;
  }
};

export default rapportsAPI;