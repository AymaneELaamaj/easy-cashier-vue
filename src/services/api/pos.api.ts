// src/services/api/pos.api.ts
import { ApiResponse } from '@/types/api';
import { UtilisateurResponse, ArticleDTO } from '@/types/entities';

const API_URL = import.meta.env.BASE_URL || 'http://localhost:8080';

export interface CustomPaymentRequest {
  userEmail: string;
  articles: {
    articleId: number;
    quantite: number;
  }[];
}

export interface CustomPaymentResponse {
  status: string;
  message: string;
  utilisateurNomComplet: string;
  utilisateurNom?: string;
  utilisateurPrenom?: string;
  utilisateurEmail?: string;
  utilisateurCategorie?: string;
  montantTotal: number;
  partSalariale: number;
  partPatronale: number;
  soldeActuel: number;
  nouveauSolde: number;
  numeroTicket: string;
  transactionId: number;
  articles: Array<{
    articleId: number;
    nom: string;
    quantite: number;
    prixUnitaire: number;
    montantTotal: number;
    subventionTotale: number;
    partSalariale: number;
    quantiteAvecSubvention?: number;
    quantiteSansSubvention?: number;
  }>;
}

export interface POSHealthResponse {
  status: string;
  message: string;
  timestamp: number;
  service: string;
  version: string;
}

export class POSApiService {
  private getAuthHeaders(): HeadersInit {
    // Essayer plusieurs clés possibles pour le token
    const token = localStorage.getItem('authToken') || 
                  localStorage.getItem('token') || 
                  localStorage.getItem('accessToken');
    
    console.log('🔐 Token pour API POS:', token ? 'Présent' : 'Absent');
    
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    };
  }

  /**
   * Obtenir les articles pour le POS
   */
  async getArticlesForPOS(): Promise<ApiResponse<ArticleDTO[]>> {
    try {
      const response = await fetch(`${API_URL}/api/articles/products`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Erreur API articles:', response.status, errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      return response.json();
    } catch (error) {
      console.error('Erreur lors du chargement des articles POS:', error);
      throw error;
    }
  }

  /**
   * Valider un badge utilisateur
   */
  async validateBadge(codeBadge: string): Promise<ApiResponse<UtilisateurResponse>> {
    const response = await fetch(
      `${API_URL}/api/utilisateurs/badge?codeBadge=${encodeURIComponent(codeBadge)}`,
      {
        method: 'GET',
        headers: this.getAuthHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Valider une transaction POS
   */
  async validateTransaction(request: CustomPaymentRequest): Promise<CustomPaymentResponse> {
    const response = await fetch(`${API_URL}/api/pos/validate`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  /**
   * Vérifier le statut de l'API POS
   */
  async healthCheck(): Promise<POSHealthResponse> {
    const response = await fetch(`${API_URL}/api/pos/health`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Health check failed: HTTP ${response.status}`);
    }

    return response.json();
  }

  /**
   * Obtenir le statut de connexion
   */
  async checkConnection(): Promise<boolean> {
    try {
      await this.healthCheck();
      return true;
    } catch (error) {
      console.error('Connection check failed:', error);
      return false;
    }
  }
}

export const posApiService = new POSApiService();