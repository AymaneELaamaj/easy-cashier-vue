import api from './axios';
import { ConfigPaiementRequest, ConfigPaiementResponse, TypesDisponiblesResponse } from '@/types/entities';

export const configAPI = {
  // Définir le type de paiement
  setTypePaiement: async (typePaiement: string): Promise<{ success: boolean; message: string; typePaiement: string }> => {
    const response = await api.post('/config/type-paiement', { typePaiement });
    return response.data;
  },

  // Obtenir le type de paiement actuel
  getTypePaiement: async (): Promise<ConfigPaiementResponse> => {
    const response = await api.get<ConfigPaiementResponse>('/config/type-paiement');
    return response.data;
  },

  // Obtenir les types de paiement disponibles
  getTypesDisponibles: async (): Promise<TypesDisponiblesResponse> => {
    const response = await api.get<TypesDisponiblesResponse>('/config/types-disponibles');
    return response.data;
  }
};

export default configAPI;