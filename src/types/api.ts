// Types génériques pour les réponses API
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  timestamp?: string;
}

export interface ErrorResponse {
  timestamp: string;
  status: number;
  error?: string;
  message: string;
  path?: string;
  details?: string[];
}

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export interface Pageable {
  page?: number;
  size?: number;
  sort?: string;
}

// Types d'énumération
export enum UserRole {
  EMPLOYE = 'EMPLOYE',
  CAISSIER = 'CAISSIER',
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN'
}

export enum StatusRemboursement {
  EN_ATTENTE = 'EN_ATTENTE',
  APPROUVE = 'APPROUVE',
  REJETE = 'REJETE',
  TRAITE = 'TRAITE'
}

export enum TypePaiement {
  PRE_PAIEMENT = 'PRE_PAIEMENT',
  POST_PAIEMENT = 'POST_PAIEMENT'
}

export enum StatutTransaction {
  EN_COURS = 'EN_COURS',
  VALIDE = 'VALIDE',
  ANNULE = 'ANNULE',
  ECHEC = 'ECHEC'
}