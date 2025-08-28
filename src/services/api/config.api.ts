import api from './axios';
import { ApiResponse, Page, Pageable } from '@/types/api';
import { ConfigPaiementDTO, ConfigPaiementResponse, TypesDisponiblesResponse } from '@/types/entities';

export const configPaiementAPI = {
  // Récupérer toutes les configurations de paiement
  getAllConfigs: async (): Promise<ConfigPaiementDTO[]> => {
    const response = await api.get<ApiResponse<ConfigPaiementDTO[]>>('/config/type-paiement');
    return response.data.data;
  },

 

  // Créer une nouvelle configuration de paiement
  createConfig: async (configData: ConfigPaiementDTO): Promise<ConfigPaiementDTO> => {
    const response = await api.post<ApiResponse<ConfigPaiementDTO>>('/config/type-paiement', configData);
    return response.data.data;
  },

  // // Mettre à jour une configuration de paiement
  // updateConfig: async (id: number, configData: ConfigPaiementDTO): Promise<ConfigPaiementDTO> => {
  //   const response = await api.put<ApiResponse<ConfigPaiementDTO>>(`/config-paiements/update/${id}`, configData);
  //   return response.data.data;
  // },

 
};

export default configPaiementAPI;