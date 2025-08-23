import api from './axios';
import { Page, Pageable } from '@/types/api';
import { TerminalPOS } from '@/types/entities';

export const terminalsAPI = {
  // Lister tous les terminaux POS
  getAllTerminals: async (pageable?: Pageable): Promise<{ success: boolean; terminaux: Page<TerminalPOS>; count: number }> => {
    const params = new URLSearchParams();
    if (pageable?.page !== undefined) params.append('page', pageable.page.toString());
    if (pageable?.size !== undefined) params.append('size', pageable.size.toString());
    if (pageable?.sort) params.append('sort', pageable.sort);

    const response = await api.get(`/terminaux/?${params}`);
    return response.data;
  }
};

export default terminalsAPI;