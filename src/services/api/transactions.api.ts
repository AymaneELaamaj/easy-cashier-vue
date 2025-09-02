import api from './axios';
import { TransactionDTO } from '@/types/entities';

/** Unwrap compatible avec tes deux formes:
 *  - { data: ... }
 *  - { page: { content: [...] } }
 */
function unwrap<T>(res: any): T {
  const payload = res?.data ?? res;
  if (payload?.data !== undefined) return payload.data as T;
  if (payload?.page?.content !== undefined) return payload.page.content as T;
  return payload as T;
}

export const transactionsAPI = {
  // Historique complet (Page -> content[])
  getHistorique: async (): Promise<TransactionDTO[]> => {
    const res = await api.get('/transactions/historique');
    return unwrap<TransactionDTO[]>(res);
  },

  // Historique par période (Page -> content[])
  getHistoriquePeriode: async (dateDebut: string, dateFin: string): Promise<TransactionDTO[]> => {
    const res = await api.get(
      `/transactions/historique/periode?dateDebut=${dateDebut}&dateFin=${dateFin}`
    );
    return unwrap<TransactionDTO[]>(res);
  },

  // Historique utilisateur par période (Page -> content[])
  getHistoriqueUtilisateur: async (
    utilisateurId: number,
    dateDebut: string,
    dateFin: string
  ): Promise<TransactionDTO[]> => {
    const res = await api.get(
      `/transactions/utilisateur/${utilisateurId}/periode?dateDebut=${dateDebut}&dateFin=${dateFin}`
    );
    return unwrap<TransactionDTO[]>(res);
  },

  // Transaction par ID (objet -> data)
  getTransactionById: async (id: number): Promise<TransactionDTO> => {
    const res = await api.get(`/transactions/${id}`);
    return unwrap<TransactionDTO>(res);
  },

  // Transaction par ticket (objet -> data)
  getTransactionByTicket: async (numeroTicket: string): Promise<TransactionDTO> => {
    const res = await api.get(`/transactions/ticket/${encodeURIComponent(numeroTicket)}`);
    return unwrap<TransactionDTO>(res);
  },

  // Mes transactions (Page -> content[])
  getMyTransactions: async (): Promise<TransactionDTO[]> => {
    const res = await api.get('/transactions/mes-transactions');
    return unwrap<TransactionDTO[]>(res);
  },

  // Annuler une transaction (objet -> data)
  cancelTransaction: async (id: number, motif?: string): Promise<TransactionDTO> => {
    const body = motif ? { motif } : {};
    const res = await api.post(`/transactions/${id}/annuler`, body);
    return unwrap<TransactionDTO>(res);
  },

  // Récupérer les transactions sans remboursement de l'utilisateur actuel
  getTransactionsRemboursementNull: async (): Promise<TransactionDTO[]> => {
    const res = await api.get('/transactions/remboursement-null');
    return unwrap<TransactionDTO[]>(res);
  },
};

export default transactionsAPI;
