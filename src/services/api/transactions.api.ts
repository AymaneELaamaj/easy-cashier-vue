import api from './axios';
import { ApiResponse } from '@/types/api';
import { TransactionDTO } from '@/types/entities';

export const transactionsAPI = {
  // Obtenir l'historique complet des transactions
  getHistorique: async (): Promise<TransactionDTO[]> => {
    const response = await api.get<ApiResponse<TransactionDTO[]>>('/transactions/historique');
    return response.data.data;
  },

  // Obtenir l'historique des transactions par période
  getHistoriquePeriode: async (dateDebut: string, dateFin: string): Promise<TransactionDTO[]> => {
    const response = await api.get<ApiResponse<TransactionDTO[]>>(
      `/transactions/historique/periode?dateDebut=${dateDebut}&dateFin=${dateFin}`
    );
    return response.data.data;
  },

  // Obtenir les transactions d'un utilisateur par période
  getHistoriqueUtilisateur: async (
    utilisateurId: number, 
    dateDebut: string, 
    dateFin: string
  ): Promise<TransactionDTO[]> => {
    const response = await api.get<ApiResponse<TransactionDTO[]>>(
      `/transactions/utilisateur/${utilisateurId}/periode?dateDebut=${dateDebut}&dateFin=${dateFin}`
    );
    return response.data.data;
  },

  // Obtenir une transaction par ID
  getTransactionById: async (id: number): Promise<TransactionDTO> => {
    const response = await api.get<ApiResponse<TransactionDTO>>(`/transactions/${id}`);
    return response.data.data;
  },

  // Obtenir une transaction par numéro de ticket
  getTransactionByTicket: async (numeroTicket: string): Promise<TransactionDTO> => {
    const response = await api.get<ApiResponse<TransactionDTO>>(`/transactions/ticket/${encodeURIComponent(numeroTicket)}`);
    return response.data.data;
  },

  // Obtenir les transactions de l'utilisateur connecté
  getMyTransactions: async (): Promise<TransactionDTO[]> => {
    const response = await api.get<ApiResponse<TransactionDTO[]>>('/transactions/mes-transactions');
    return response.data.data;
  },

  // Annuler une transaction
  cancelTransaction: async (id: number, motif?: string): Promise<TransactionDTO> => {
    const body = motif ? { motif } : {};
    const response = await api.post<ApiResponse<TransactionDTO>>(`/transactions/${id}/annuler`, body);
    return response.data.data;
  }
};

export default transactionsAPI;