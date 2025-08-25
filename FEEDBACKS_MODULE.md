# Module Feedbacks

## Description

Le module Feedbacks permet aux utilisateurs de l'application de soumettre leurs commentaires, suggestions et avis sur les services de la cantine. Il offre également aux administrateurs la possibilité de consulter et gérer tous les feedbacks reçus.

## Fonctionnalités

### Pour les Employés
- ✅ **Créer un feedback** : Soumettre un nouveau commentaire ou suggestion
- ✅ **Voir mes feedbacks** : Consulter la liste de ses propres feedbacks
- ✅ **Modifier mes feedbacks** : Modifier un feedback existant
- ✅ **Supprimer mes feedbacks** : Supprimer un feedback créé

### Pour les Administrateurs
- ✅ **Voir tous les feedbacks** : Consulter tous les feedbacks de tous les utilisateurs
- ✅ **Rechercher dans les feedbacks** : Recherche par contenu ou utilisateur
- ✅ **Statistiques** : Vue d'ensemble des feedbacks (total, mensuel, longueur moyenne)
- ✅ **Gestion complète** : Modifier ou supprimer n'importe quel feedback

## Architecture

### API (Backend)
- **Contrôleur** : `FeedbackController.java`
- **Endpoints disponibles** :
  - `POST /api/feedbacks/create` - Créer un feedback
  - `GET /api/feedbacks/all` - Lister tous les feedbacks (Admin)
  - `GET /api/feedbacks/my-feedbacks` - Lister mes feedbacks
  - `GET /api/feedbacks/{id}` - Obtenir un feedback par ID
  - `PATCH /api/feedbacks/update` - Mettre à jour un feedback
  - `DELETE /api/feedbacks/delete` - Supprimer un feedback

### Frontend
- **Page principale** : `src/pages/Feedbacks.tsx`
- **Composants** :
  - `CreateFeedbackModal.tsx` - Modal de création
  - `EditFeedbackModal.tsx` - Modal de modification
  - `DeleteFeedbackModal.tsx` - Modal de suppression
  - `FeedbackCard.tsx` - Carte d'affichage d'un feedback
- **Hook** : `src/hooks/useFeedbacks.ts`
- **API Service** : `src/services/api/feedback.api.ts`

## Permissions

| Rôle | Créer | Voir tous | Voir les miens | Modifier | Supprimer |
|------|-------|-----------|----------------|----------|-----------|
| EMPLOYE | ✅ | ❌ | ✅ | Ses propres | Ses propres |
| ADMIN | ✅ | ✅ | ✅ | Tous | Tous |
| SUPER_ADMIN | ✅ | ✅ | ✅ | Tous | Tous |

## Interface utilisateur

### Page principale
- **Onglets** : 
  - "Tous les feedbacks" (Admin uniquement)
  - "Mes feedbacks" (Tous les utilisateurs)
- **Statistiques** : 4 cartes KPI affichant les métriques importantes
- **Recherche** : Barre de recherche pour filtrer les feedbacks
- **Actions** : Bouton "Nouveau Feedback" pour créer

### Modals
1. **Création** : Textarea pour saisir le commentaire (max 500 caractères)
2. **Modification** : Pré-remplissage avec le contenu existant
3. **Suppression** : Confirmation avec aperçu du contenu

## Types de données

```typescript
interface FeedbackDTO {
  id?: number;
  commentaire: string;
  utilisateurid?: number;
  utilisateur?: UtilisateurDTO;
}
```

## Installation et configuration

1. **Backend** : Le contrôleur est déjà configuré avec les endpoints nécessaires
2. **Frontend** : Tous les composants sont créés et la route `/feedback` est configurée
3. **Navigation** : Le lien existe déjà dans la sidebar de l'application

## Utilisation

1. **Accès** : Naviguer vers `/feedback` dans l'application
2. **Création** : Cliquer sur "Nouveau Feedback" et saisir le commentaire
3. **Gestion** : Utiliser les onglets pour basculer entre "Tous" et "Mes feedbacks"
4. **Actions** : Utiliser les boutons d'édition/suppression sur chaque carte

## Remarques techniques

- **Pagination** : Support de la pagination côté serveur
- **Recherche** : Recherche en temps réel côté client
- **États de chargement** : Gestion complète des états de chargement et d'erreur
- **Validation** : Validation côté client et serveur
- **Responsive** : Interface adaptative pour mobile et desktop

## Améliorations futures possibles

- 📧 Notifications email pour nouveaux feedbacks
- 📊 Analytics avancés sur les sentiments
- 🏷️ Système de catégories pour les feedbacks
- ⭐ Système de notation/étoiles
- 📎 Support des pièces jointes
