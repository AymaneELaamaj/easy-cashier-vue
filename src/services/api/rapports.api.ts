import api from './axios';
import { ApiResponse, RapportsApiResponse } from '@/types/api';
import { RapportDTO } from '@/types/entities';

export type RapportEmployeData = any; // le backend renvoie Map<String, Object>, on laisse souple

const buildQuery = (params?: Record<string, any>) => {
  if (!params) return '';
  const qs = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
  return qs ? `?${qs}` : '';
};

export const rapportsAPI = {
  // Générer un rapport de l'historique complet (mois courant)
  genererHistorique: async (): Promise<RapportDTO> => {
    const response = await api.post<ApiResponse<RapportDTO>>('/rapports/generer-historique');
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

  // Lister tous les rapports
  getAllRapports: async (): Promise<RapportDTO[]> => {
    const response = await api.get<RapportsApiResponse<RapportDTO[]>>('/rapports');
    return response.data?.items || [];
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
      throw new Error("Erreur lors de l'export JSON");
    }
    return response.data.data;
  },

  // Télécharger directement un rapport PDF (rapport global existant)
  downloadRapportPDF: async (id: number): Promise<Blob> => {
    const response = await api.get(`/rapports/${id}/download-pdf`, { responseType: 'blob' });
    return response.data;
  },

  // Générer un PDF (retourne le chemin du fichier) pour un rapport global existant
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
  },

  // ============================================================
  // 🔹 NOUVEAU : RAPPORT PAR EMPLOYÉ
  // ============================================================

  // JSON des transactions d'un employé sur une période
  getRapportEmployeJson: async (
    employeId: number,
    debut?: string, // yyyy-MM-dd
    fin?: string    // yyyy-MM-dd
  ): Promise<RapportEmployeData> => {
    const qs = buildQuery({ debut, fin });
    const url = `/rapports/employes/${employeId}/transactions${qs}`;
    const response = await api.get<ApiResponse<RapportEmployeData>>(url);
    if (!response.data || response.data.data === undefined) {
      throw new Error("Aucune donnée trouvée pour ce rapport employé");
    }
    return response.data.data;
  },

  // Générer le PDF du rapport d'un employé (retourne le chemin)
  exportRapportEmployePDF: async (
    employeId: number,
    debut?: string,
    fin?: string
  ): Promise<string> => {
    const qs = buildQuery({ debut, fin });
    const response = await api.post<ApiResponse<string>>(`/rapports/employes/${employeId}/export-pdf${qs}`);
    if (!response.data || response.data.data === undefined) {
      throw new Error('Erreur lors de la génération du PDF employé');
    }
    return response.data.data;
  },

  // Télécharger directement le PDF du rapport d'un employé
  downloadRapportEmployePDF: async (
    employeId: number,
    debut?: string,
    fin?: string
  ): Promise<Blob> => {
    const qs = buildQuery({ debut, fin });
    const response = await api.get(`/rapports/employes/${employeId}/download-pdf${qs}`, {
      responseType: 'blob',
    });
    return response.data;
  },
};

export default rapportsAPI;
