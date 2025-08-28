// DTOs des entités métier

export interface UtilisateurResponse {
  id?: number;
  nom: string;
  prenom: string;
  cin: string;
  email: string;
  telephone?: string;
  solde: number;
  role: string;
  isActive: boolean;
  badgeId?: number;
  categorieEmployesId?: number;
  codeBadge?: string; // From Badge
  cadre?: string; // From CategorieEmployes
  badge?: BadgeResponse;
}

export interface UtilisateurRequest {
  nom: string;
  prenom: string;
  cin: string;
  email: string;
  password: string;
  telephone?: string;
  solde?: number;
  role: string;
  categorieEmployesId?: number;
  isActive?: boolean;
}

export interface ArticleDTO {
  id?: number;
  nom: string;
  prix: string;
  description?: string;
  codeOdoo?: number;
  productId?: number;
  quantite?: number;
  disponible: boolean;
  status: boolean;
  categorie?: CategorieDTO;
}

export interface CategorieDTO {
  id?: number;
  libelle: string;
  odooCategoryId?: number;
  statut: boolean;
}

export interface CategorieEmployesResponse {
  id?: number;
  cadre: string;
}

export interface BadgeResponse {
  id?: number;
  codeBadge?: string;
  active: boolean;
  utilisateurId?: number;
  utilisateurNom?: string;
}

export interface TransactionDTO {
  id?: number;
  numeroTicket: string;
  date: string;
  heureTransaction: string;
  montantTotal: number;
  partSalariale: number;
  partPatronale: number;
  typePaiement: string;
  utilisateur?: UtilisateurResponse;
  articles: ArticleDTO[];
}

export interface ArticleTransactionDTO {
  id?: number;
  articleId: number;
  article?: ArticleDTO;
  quantite: number;
  prixUnitaire: number;
  sousTotal: number;
}

export interface SubventionDTO {
  id?: number;
  taux: number;
  articleId: number;
  articleNom?: string;
  plafondJour: number;
  plafondSemaine: number;
  plafondMois: number;
  actif: boolean;
  categorieEmployesId: number;
  cadre?: string;
}

export interface RemboursementDTO {
  id?: number;
  montantRemboursement: number;
  dateCreation?: string;
  dateTraitement?: string;
  message: string;
  status: StatusRemboursement;
  transactionId: number;
  numeroTicket?: string;
  utilisateurId: number;
  utilisateur?: UtilisateurResponse;
  commentaireAdmin?: string;
  montant?: number; // Alias pour compatibilité
}

export enum StatusRemboursement {
  EN_ATTENTE = 'EN_ATTENTE',
  ACCEPTE = 'ACCEPTE',
  REFUSE = 'REFUSE'
}

export interface RapportDTO {
  id?: number;
  nom: string;
  description?: string;
  dateGeneration: string;
  periode: string;
  donnees?: { [key: string]: unknown };
  fichierPath?: string;
  taille?: number;
}

export interface FeedbackDTO {
  id?: number;
  commentaire: string;
  utilisateurid?: number;
  utilisateur?: UtilisateurResponse;
}

export interface TerminalPOS {
  id?: number;
  nom: string;
  description?: string;
  adresseIP?: string;
  port?: number;
  actif: boolean;
  dateCreation?: string;
  dernierePing?: string;
}

// DTOs pour les requêtes
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  nom: string;
  prenom: string;
  email: string;
  password: string;
  cin: string;
  telephone?: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'CAISSIER' | 'EMPLOYE';
  isActive?: boolean;
  solde?: number;
  categorieEmployesId?: number;
}

export interface ConfigPaiementRequest {
  typePaiement: string;
}

export interface ConfigPaiementDTO {
  id?: number;
  typePaiement: string;
}

export interface ConfigPaiementResponse {
  typePaiement: string;
  label: string;
  dateModification?: string;
}

export interface TypesDisponiblesResponse {
  typesDisponibles: { [key: string]: string };
}