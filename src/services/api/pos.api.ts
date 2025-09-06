// src/services/api/pos.api.ts
import { ApiResponse } from '@/types/api';
import { UtilisateurResponse, ArticleDTO } from '@/types/entities';

const API_URL = import.meta.env.BASE_URL || 'http://localhost:8080';

export interface CustomPaymentRequest {
  // L'un des deux est requis côté appelant (backend accepte l'un OU l'autre)
  userEmail?: string;
  codeBadge?: string;

  articles: {
    articleId: number;
    quantite: number;
  }[];

  terminalId?: string;
  sessionId?: string;
  notes?: string;
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
    const token =
      localStorage.getItem('authToken') ||
      localStorage.getItem('token') ||
      localStorage.getItem('accessToken');

    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  private async parseOrText(res: Response) {
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      return { message: text || res.statusText };
    }
  }

  /** Obtenir les articles pour le POS */
  async getArticlesForPOS(): Promise<ApiResponse<ArticleDTO[]>> {
    const res = await fetch(`${API_URL}/api/articles/products`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    if (!res.ok) {
      const err = await this.parseOrText(res);
      throw new Error(`HTTP ${res.status}: ${err.message || 'Erreur articles POS'}`);
    }

    return res.json();
  }

  /** Valider un badge utilisateur */
  async validateBadge(codeBadge: string): Promise<ApiResponse<UtilisateurResponse>> {
    const res = await fetch(
      `${API_URL}/api/utilisateurs/badge?codeBadge=${encodeURIComponent(codeBadge)}`,
      { method: 'GET', headers: this.getAuthHeaders() }
    );

    if (!res.ok) {
      const err = await this.parseOrText(res);
      throw new Error(`HTTP ${res.status}: ${err.message || 'Erreur badge'}`);
    }

    return res.json();
  }

  /** Valider une transaction POS (par email OU par codeBadge) */
  async validateTransaction(request: CustomPaymentRequest): Promise<CustomPaymentResponse> {
    const res = await fetch(`${API_URL}/api/pos/validate`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(request),
    });

    if (!res.ok) {
      const err = await this.parseOrText(res);
      throw new Error(err.message || `HTTP ${res.status}`);
    }

    return res.json();
  }

  /** Health check */
  async healthCheck(): Promise<POSHealthResponse> {
    const res = await fetch(`${API_URL}/api/pos/health`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    if (!res.ok) {
      const err = await this.parseOrText(res);
      throw new Error(`Health check failed: ${err.message || `HTTP ${res.status}`}`);
    }

    return res.json();
  }

  /** Vérifier la connexion */
  async checkConnection(): Promise<boolean> {
    try {
      await this.healthCheck();
      return true;
    } catch (e) {
      console.error('Connection check failed:', e);
      return false;
    }
  }
}

export const posApiService = new POSApiService();