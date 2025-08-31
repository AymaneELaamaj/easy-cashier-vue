// Types génériques pour les réponses API
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  timestamp?: string;
}

// Interface spécifique pour les réponses paginées du backend
export interface PagedApiResponse<T> {
  timestamp: string;
  status: number;
  message: string;
  page: Page<T>;
  path: string;
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


// Nouveaux enums pour les rapports
export enum StatutRapport {
  EN_COURS = 'EN_COURS',
  TERMINE = 'TERMINE', 
  ENVOYE = 'ENVOYE',
  ERREUR = 'ERREUR',
  ARCHIVE = 'ARCHIVE'
}

export enum TypeRapport {
  MENSUEL = 'MENSUEL',
  HEBDOMADAIRE = 'HEBDOMADAIRE',
  ANNUEL = 'ANNUEL', 
  PERSONNALISE = 'PERSONNALISE'
}

// Types pour l'affichage (optionnel)
export const StatutRapportLabels: Record<StatutRapport, string> = {
  [StatutRapport.EN_COURS]: 'En cours de génération',
  [StatutRapport.TERMINE]: 'Terminé',
  [StatutRapport.ENVOYE]: 'Envoyé',
  [StatutRapport.ERREUR]: 'Erreur lors de la génération',
  [StatutRapport.ARCHIVE]: 'Archivé'
};

export const TypeRapportLabels: Record<TypeRapport, string> = {
  [TypeRapport.MENSUEL]: 'Rapport Mensuel',
  [TypeRapport.HEBDOMADAIRE]: 'Rapport Hebdomadaire',
  [TypeRapport.ANNUEL]: 'Rapport Annuel',
  [TypeRapport.PERSONNALISE]: 'Rapport Personnalisé'
};
export interface RapportsApiResponse<T> {
  timestamp: string;
  status: number;
  message: string;
  items: T;
  path: string;
}