import api from './axios';
import { ApiResponse, Page, Pageable } from '@/types/api';
import { ConfigPaiementDTO, ConfigPaiementResponse, TypesDisponiblesResponse } from '@/types/entities';

export const configPaiementAPI = {
  // Récupérer toutes les configurations de paiement
  getAllConfigs: async (): Promise<ConfigPaiementDTO[]> => {
    const response = await api.get<ApiResponse<ConfigPaiementDTO[]>>('/config-paiements/all');
    return response.data.data;
  },

  // Récupérer une configuration par ID
  getConfigById: async (id: number): Promise<ConfigPaiementDTO> => {
    const response = await api.get<ApiResponse<ConfigPaiementDTO>>(`/config-paiements/${id}`);
    return response.data.data;
  },

  // Créer une nouvelle configuration de paiement
  createConfig: async (configData: ConfigPaiementDTO): Promise<ConfigPaiementDTO> => {
    const response = await api.post<ApiResponse<ConfigPaiementDTO>>('/config-paiements/create', configData);
    return response.data.data;
  },

  // Mettre à jour une configuration de paiement
  updateConfig: async (id: number, configData: ConfigPaiementDTO): Promise<ConfigPaiementDTO> => {
    const response = await api.put<ApiResponse<ConfigPaiementDTO>>(`/config-paiements/update/${id}`, configData);
    return response.data.data;
  },

  // Supprimer une configuration de paiement
  deleteConfig: async (id: number): Promise<void> => {
    await api.delete<ApiResponse<void>>(`/config-paiements/${id}`);
  }
};

export default configPaiementAPI;