//src/types/entities.ts
import { StatutRapport, TypeRapport } from './api';

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

// ✅ MODIFICATION : Ajout du champ imageUrl
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
  imageUrl?: string; // 🆕 Nouveau champ pour l'image
}

// 🆕 NOUVEAU : Interface pour les données de création d'article avec image
export interface CreateArticleRequest {
  article: Omit<ArticleDTO, 'id' | 'imageUrl'>;
  image?: File;
}

// 🆕 NOUVEAU : Interface pour les données de mise à jour d'article avec image
export interface UpdateArticleRequest {
  article: ArticleDTO;
  image?: File;
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
  utilisateurEmail?: string;
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
  categorieEmployesNom?: string;
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

export interface RapportDetailDTO {
  id?: number;
  utilisateur?: UtilisateurResponse;
  nombreTransactionsUtilisateur?: number;
  montantTotalUtilisateur?: number;
  partSalarialeUtilisateur?: number;
  partPatronaleUtilisateur?: number;
  articleLePlusAchete?: string;
  frequenceUtilisation?: number;
  moyenneParTransaction?: number;
}

export interface RapportDTO {
  id?: number;
  numeroRapport?: string;
  titre?: string;
  typeRapport?: TypeRapport;
  statut?: StatutRapport;
  dateDebut?: string; // Format: YYYY-MM-DD
  dateFin?: string;   // Format: YYYY-MM-DD
  dateCreation?: string; // Format: ISO DateTime
  dateEnvoi?: string;    // Format: ISO DateTime
  
  // Statistiques globales
  nombreTransactions?: number;
  montantTotalPeriode?: number;
  totalPartSalariale?: number;
  totalPartPatronale?: number;
  nombreUtilisateurs?: number;
  
  // Métadonnées
  cheminFichier?: string;
  creePar?: UtilisateurResponse;
  
  // Détails par utilisateur
  details?: RapportDetailDTO[];
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
// Ajoutez ces types à votre fichier types/entities.ts existant

export interface SecurityAlert {
  id: number;
  alertType: string;
  message: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  timestamp: string;
  resolved: boolean;
  resolvedAt?: string;
  resolvedBy?: string;
}

export interface SecurityDashboard {
  activeAlerts: SecurityAlert[];
  totalAlerts: number;
  criticalAlerts: number;
  unresolvedAlerts: number;
  lastUpdate: string;
}

export interface SecurityStats {
  todayAlerts: number;
  weekAlerts: number;
  alertsByType: Record<string, number>;
  alertsBySeverity: Record<string, number>;
}

export interface LogEntry {
  timestamp: string;
  thread: string;
  level: string;
  logger: string;
  message: string;
  rawLine: string;
  userId?: number;
  userEmail?: string;
  eventType?: string;
  alertType?: string;
  severity?: string;
}

export interface SearchCriteria {
  startDate?: string;
  endDate?: string;
  userId?: number;
  userEmail?: string;
  eventType?: string;
  alertType?: string;
  severity?: string;
  keyword?: string;
  logLevel?: string;
  maxResults?: number;
}

export interface UserSession {
  userId: number;
  userEmail: string;
  startTime: string;
  endTime: string;
  events: LogEntry[];
  transactionCount: number;
  alertCount: number;
  suspiciousActivity: boolean;
}

export interface IncidentReport {
  incidentId: string;
  reportTime: string;
  reportType: string;
  criteria: SearchCriteria;
  relatedLogs: LogEntry[];
  involvedSessions: UserSession[];
  statistics: Record<string, any>;
  summary: string;
}