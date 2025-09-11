// src/services/api/config.api.ts
import api from './axios';

export type ConfigType = 'POST_PAIEMENT' | 'PRE_PAIEMENT';

export interface ConfigPaiementResponse {
  typePaiement: ConfigType;
}

export interface ConfigPaiementDTO {
  id?: number;                 // optionnel côté payload
  typePaiement: ConfigType;
}

// Unwrap compatible ApiResponse { data: ... }
const unwrap = <T,>(res: any): T => (res?.data?.data ?? res?.data ?? res) as T;

const configAPI = {
  /** GET /api/config/type-paiement (auth requise) */
  getTypePaiement: async (): Promise<ConfigPaiementResponse> => {
    // ⚠️ aucun header custom pour éviter CORS (X-Silent retiré)
    const res = await api.get('/config/type-paiement');
    return unwrap<ConfigPaiementResponse>(res);
  },

  /** Liste “synthétique” pour l’écran d’admin (1 ligne) */
  getAllConfigs: async (): Promise<Required<ConfigPaiementDTO>[]> => {
    const obj = await configAPI.getTypePaiement();
    return [{ id: 1, typePaiement: obj.typePaiement }];
  },

  /** POST /api/config/type-paiement */
  createConfig: async (payload: ConfigPaiementDTO): Promise<Required<ConfigPaiementDTO>> => {
    await api.post('/config/type-paiement', { typePaiement: payload.typePaiement });
    const obj = await configAPI.getTypePaiement();
    return { id: 1, typePaiement: obj.typePaiement };
  },

  /** PUT /api/config/type-paiement */
  updateConfig: async (_id: number, payload: ConfigPaiementDTO): Promise<Required<ConfigPaiementDTO>> => {
    await api.put('/config/type-paiement', { typePaiement: payload.typePaiement });
    const obj = await configAPI.getTypePaiement();
    return { id: 1, typePaiement: obj.typePaiement };
  },

  /** DELETE /api/config/type-paiement */
  deleteConfig: async (_id: number): Promise<void> => {
    await api.delete('/config/type-paiement');
  },
};

export default configAPI;
export type { ConfigPaiementDTO as ConfigDTO, ConfigPaiementResponse as ConfigResp };
