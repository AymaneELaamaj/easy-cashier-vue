# EasyPOS - Frontend React + TypeScript

Application moderne de gestion point de vente (POS) construite avec React 18, TypeScript, et une architecture robuste.

## 🚀 Démarrage Rapide

### Prérequis

- Node.js 18+ et npm
- Backend EasyPOS en cours d'exécution sur `http://localhost:8080`

### Installation

```bash
# Cloner le projet
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>

# Installer les dépendances
npm install

# Configurer les variables d'environnement
cp src/env.example .env.local
```

### Configuration

Éditez le fichier `.env.local` :

```env
# URL de base de l'API backend
VITE_API_BASE_URL=http://localhost:8080/api
```

### Démarrage

```bash
# Mode développement
npm run dev

# Build production
npm run build

# Prévisualiser le build
npm run preview
```

L'application sera accessible sur `http://localhost:8080`

## 🏗️ Architecture

### Structure du Projet

```
src/
├── components/          # Composants réutilisables
│   ├── layout/         # Composants de layout (Sidebar, Header)
│   └── ui/             # Composants UI de base (shadcn/ui)
├── contexts/           # Contextes React (Auth, etc.)
├── hooks/              # Hooks personnalisés React Query
├── pages/              # Pages de l'application
├── services/           # Services API et utilitaires
│   └── api/           # Services API par domaine
├── types/              # Types TypeScript
└── lib/               # Utilitaires et helpers
```

### Technologies Utilisées

- **React 18** - Interface utilisateur
- **TypeScript** - Typage statique
- **React Router v6** - Routage avec protection par rôles
- **React Query** - Gestion des données et cache
- **React Hook Form + Zod** - Formulaires et validation
- **Axios** - Client HTTP avec intercepteurs JWT
- **Tailwind CSS** - Styles avec design system
- **shadcn/ui** - Composants UI modernes
- **React Hot Toast** - Notifications
- **next-themes** - Gestion thème sombre/clair

## 🔐 Authentification & Autorisation

### Système d'Auth

- **JWT** avec refresh token automatique
- **Persistance** via cookies sécurisés
- **Intercepteurs Axios** pour l'injection de tokens
- **Guards de routes** basés sur les rôles

### Rôles Supportés

- `SUPER_ADMIN` - Accès complet
- `ADMIN` - Gestion administrative
- `CAISSIER` - Operations de caisse
- `EMPLOYE` - Utilisation basique

### Utilisation

```tsx
import { useAuthContext } from '@/contexts/AuthContext';

function MyComponent() {
  const { currentUser, isAdmin, hasRole } = useAuthContext();
  
  if (hasRole('ADMIN')) {
    // Logique pour admin
  }
}
```

## 📊 Gestion des Données

### React Query Hooks

```tsx
// Utilisateurs
const { users, createUser, updateUser } = useUsers();

// Articles
const { articles, createArticle } = useArticles();

// Transactions
const { transactions } = useTransactions();
```

### Services API

Chaque domaine a son service API :

- `authAPI` - Authentification
- `usersAPI` - Gestion utilisateurs
- `articlesAPI` - Gestion articles
- `transactionsAPI` - Historique transactions
- `badgesAPI` - Gestion badges
- `remboursementsAPI` - Remboursements
- `subventionsAPI` - Subventions
- `rapportsAPI` - Génération rapports
- `configAPI` - Configuration système

## 🎨 Design System

### Variables CSS Custom

Le design system utilise des variables CSS pour une cohérence parfaite :

```css
/* Couleurs primaires */
--primary: 217 91% 60%;
--success: 134 61% 50%;
--destructive: 348 86% 58%;

/* Mode sombre automatique */
.dark {
  --primary: 217 91% 60%;
  /* ... */
}
```

### Composants Réutilisables

- `KPICard` - Cartes de métriques avec animations
- `DataTable` - Tables avec pagination, tri, filtrage
- `LoadingSpinner` - Indicateurs de chargement
- `ProtectedRoute` - Wrapper pour routes protégées

## 🔧 Configuration Avancée

### Variables d'Environnement

```env
# Base URL de l'API (requis)
VITE_API_BASE_URL=http://localhost:8080/api

# Debug (optionnel)
VITE_DEBUG=true
VITE_LOG_LEVEL=debug
```

### Gestion des Erreurs

```tsx
// Gestion centralisée via Axios interceptors
api.interceptors.response.use(
  response => response,
  error => {
    // Auto-refresh JWT
    // Toast notifications
    // Redirection si 401
  }
);
```

### Refresh Token Flow

1. Token expiré → Intercepteur détecte 401
2. Tentative refresh automatique
3. Retry de la requête originale
4. Sinon, redirection /login

## 📱 Fonctionnalités

### Dashboard
- KPIs en temps réel
- Graphiques d'activité
- Transactions récentes
- Profil utilisateur

### Gestion des Entités
- **Articles** - CRUD avec catégorisation
- **Utilisateurs** - Gestion complète + rôles
- **Badges** - Attribution et statuts
- **Transactions** - Historique et filtres
- **Remboursements** - Demandes et approbation
- **Subventions** - Configuration des taux
- **Rapports** - Génération et export PDF

### Interface Utilisateur
- **Responsive** - Mobile-first design
- **Dark/Light Mode** - Toggle système
- **Sidebar** - Navigation contextuelle par rôle
- **Tables** - Pagination, tri, recherche
- **Formulaires** - Validation temps réel
- **Toasts** - Feedback utilisateur

## 🧪 Tests

```bash
# Tests unitaires
npm run test

# Coverage
npm run test:coverage
```

## 🚀 Déploiement

### Build Production

```bash
npm run build
```

### Variables de Production

```env
VITE_API_BASE_URL=https://api.votre-domaine.com/api
```

## 🤝 Contribution

### Conventions de Code

- **TypeScript strict** - Types obligatoires
- **ESLint + Prettier** - Formatage automatique
- **Conventional Commits** - Messages standardisés
- **Husky hooks** - Validation pre-commit

### Ajout d'une Nouvelle Page

1. Créer le composant dans `src/pages/`
2. Ajouter les hooks React Query si nécessaire
3. Définir les types TypeScript
4. Ajouter la route dans `App.tsx`
5. Mettre à jour la sidebar si applicable

### API Integration

1. Créer le service dans `src/services/api/`
2. Définir les types dans `src/types/`
3. Créer les hooks dans `src/hooks/`
4. Utiliser dans les composants

## 📚 Documentation API

Les endpoints backend sont documentés et intégrés :

- **Base URL** : `/api`
- **Auth** : Bearer Token via headers
- **Format** : `ApiResponse<T>` wrapper
- **Erreurs** : Format standardisé `ErrorResponse`

## 🆘 Dépannage

### Erreurs Communes

**401 Unauthorized**
- Vérifier la configuration `VITE_API_BASE_URL`
- S'assurer que le backend est démarré
- Vider les cookies si token corrompu

**CORS Errors**
- Configurer le backend pour autoriser l'origine frontend
- Vérifier les headers de requêtes

**Build Errors**
- `npm install` pour mettre à jour les dépendances
- Vérifier les types TypeScript

### Debug Mode

```env
VITE_DEBUG=true
```

Active les logs détaillés dans la console navigateur.

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

---

Développé avec ❤️ pour EasyPOS Management System