// DTOs des entités métier

export interface UtilisateurDTO {
  id?: number;
  nom: string;
  prenom: string;
  email: string;
  username?: string;
  telephone?: string;
  role: string;
  cadre?: string;
  solde: number;
  active: boolean;
  dateCreation?: string;
  dateModification?: string;
  badgeId?: number;
  badge?: BadgeDTO;
}

export interface ArticleDTO {
  id?: number;
  nom: string;
  type: string;
  prix: string;
  statut: boolean;
  categorieId?: number;
  categorie?: CategorieDTO;
  dateCreation?: string;
  dateModification?: string;
}

export interface CategorieDTO {
  id?: number;
  libelle: string;
  dateCreation?: string;
  dateModification?: string;
}

export interface CategorieEmployesDTO {
  id?: number;
  cadre: string;
  dateCreation?: string;
  dateModification?: string;
}

export interface BadgeDTO {
  id?: number;
  codeBadge: string;
  active?: boolean;
  utilisateurId?: number;
  utilisateur?: UtilisateurDTO;
  dateCreation?: string;
  dateModification?: string;
}

export interface TransactionDTO {
  id?: number;
  numeroTicket: string;
  montantTotal: number;
  statut: string;
  dateTransaction: string;
  utilisateurId?: number;
  utilisateur?: UtilisateurDTO;
  articles: ArticleTransactionDTO[];
  typeTransaction?: string;
  commentaire?: string;
  motifAnnulation?: string;
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
  nom: string;
  description?: string;
  taux: number;
  plafondJour?: number;
  plafondSemaine?: number;
  plafondMois?: number;
  active: boolean;
  dateDebut?: string;
  dateFin?: string;
  dateCreation?: string;
  dateModification?: string;
}

export interface RemboursementDTO {
  id?: number;
  transactionId: number;
  transaction?: TransactionDTO;
  utilisateurId?: number;
  utilisateur?: UtilisateurDTO;
  montant: number;
  message: string;
  status: string;
  dateCreation: string;
  dateModification?: string;
  dateReponse?: string;
  reponseAdmin?: string;
}

export interface RapportDTO {
  id?: number;
  nom: string;
  description?: string;
  dateGeneration: string;
  periode: string;
  donnees?: { [key: string]: any };
  fichierPath?: string;
  taille?: number;
}

export interface FeedbackDTO {
  id?: number;
  commentaire: string;
  utilisateurId?: number;
  utilisateur?: UtilisateurDTO;
  dateCreation: string;
  dateModification?: string;
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
  role?: string;
  cin: string;
  telephone?: string;
  solde?: number;
  isActive?: boolean;
  categorieEmployesId?: number;
}

export interface ConfigPaiementRequest {
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