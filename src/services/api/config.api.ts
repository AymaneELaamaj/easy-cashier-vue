import api from './axios';
import { ConfigPaiementDTO, ConfigPaiementResponse } from '@/types/entities';

// Unwrap compatible ApiResponse { data: ... }
const unwrap = <T>(res: any): T => (res?.data?.data ?? res?.data ?? res) as T;

export type ConfigType = 'POST_PAIEMENT' | 'PRE_PAIEMENT';

const configAPI = {
  getTypePaiement: async (): Promise<ConfigPaiementResponse> => {
    const res = await api.get('/config/type-paiement');
    return unwrap<ConfigPaiementResponse>(res);
  },

  // Adapter DataTable: array d’un seul élément
  getAllConfigs: async (): Promise<ConfigPaiementDTO[]> => {
    const obj = await configAPI.getTypePaiement();
    return [{ id: 1, typePaiement: obj.typePaiement }];
  },

  // "create" = set (POST)
  createConfig: async (configData: ConfigPaiementDTO): Promise<ConfigPaiementDTO> => {
    await api.post('/config/type-paiement', { typePaiement: configData.typePaiement });
    const obj = await configAPI.getTypePaiement();
    return { id: 1, typePaiement: obj.typePaiement };
  },

  updateConfig: async (id: number, configData: ConfigPaiementDTO): Promise<ConfigPaiementDTO> => {
    // id ignoré côté back (global id=1), on le garde pour compat UI
    await api.put('/config/type-paiement', { typePaiement: configData.typePaiement });
    const obj = await configAPI.getTypePaiement();
    return { id: 1, typePaiement: obj.typePaiement };
  },

  deleteConfig: async (_id: number): Promise<void> => {
    await api.delete('/config/type-paiement');
  },
};

export default configAPI;
