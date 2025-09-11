// src/services/api/pos.api.ts
import { ApiResponse } from '@/types/api';
import { UtilisateurResponse, ArticleDTO } from '@/types/entities';

const API_BASE: string =
  (import.meta as any).env?.VITE_API_BASE_URL ||
  (import.meta as any).env?.VITE_API_URL ||
  '/api';

export interface CustomPaymentRequest {
  userEmail?: string;
  codeBadge?: string;
  articles: { articleId: number; quantite: number }[];
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
  nouveauSolde: number; // 🔧 utilisé par le ticket & la MAJ cache
  numeroTicket: string;
  transactionId: number | string;
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

class POSApiService {
  private getAuthHeaders(): HeadersInit {
    const token =
      localStorage.getItem('authToken') ||
      localStorage.getItem('token') ||
      localStorage.getItem('accessToken') ||
      sessionStorage.getItem('authToken') ||
      sessionStorage.getItem('token') ||
      sessionStorage.getItem('accessToken') ||
      null;
    return {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(token ? { Authorization: token.startsWith('Bearer ') ? token : `Bearer ${token}` } : {}),
    };
  }

  private async parseOrText(res: Response) {
    const text = await res.text();
    try { return JSON.parse(text); } catch { return { message: text || res.statusText }; }
  }

  // 🔧 utilitaire d’unwrap
  private unwrap<T>(payload: any): T {
    if (payload?.data !== undefined) return payload.data as T;
    return payload as T;
  }

  async getArticlesForPOS(): Promise<ApiResponse<ArticleDTO[]>> {
    const res = await fetch(`${API_BASE}/articles/products`, {
      method: 'GET', headers: this.getAuthHeaders(), credentials: 'include', mode: 'cors',
    });
    if (!res.ok) { const err = await this.parseOrText(res); throw new Error(`HTTP ${res.status}: ${err.message || 'Erreur articles POS'}`); }
    return res.json();
  }

  async validateBadge(codeBadge: string): Promise<ApiResponse<UtilisateurResponse>> {
    const res = await fetch(`${API_BASE}/utilisateurs/badge?codeBadge=${encodeURIComponent(codeBadge)}`, {
      method: 'GET', headers: this.getAuthHeaders(), credentials: 'include', mode: 'cors',
    });
    if (!res.ok) { const err = await this.parseOrText(res); throw new Error(`HTTP ${res.status}: ${err.message || 'Erreur badge'}`); }
    return res.json();
  }

  // 🔧 retourne toujours directement le CustomPaymentResponse (unwrap .data si présent)
  async validateTransaction(request: CustomPaymentRequest): Promise<CustomPaymentResponse> {
    const res = await fetch(`${API_BASE}/pos/validate`, {
      method: 'POST', headers: this.getAuthHeaders(), credentials: 'include', mode: 'cors',
      body: JSON.stringify(request),
    });
    const raw = await this.parseOrText(res);
    if (!res.ok) { throw new Error(raw?.message || `HTTP ${res.status}`); }
    const unwrapped = this.unwrap<CustomPaymentResponse>(raw);
    return unwrapped;
  }

  async healthCheck(): Promise<POSHealthResponse> {
    const res = await fetch(`${API_BASE}/pos/health`, {
      method: 'GET', headers: this.getAuthHeaders(), credentials: 'include', mode: 'cors',
    });
    if (!res.ok) { const err = await this.parseOrText(res); throw new Error(`Health check failed: ${err.message || `HTTP ${res.status}`}`); }
    return res.json();
  }

  async checkConnection(): Promise<boolean> {
    try { await this.healthCheck(); return true; } catch (e) { console.error('Connection check failed:', e); return false; }
  }
}

export const posApiService = new POSApiService();
export default posApiService;
