// src/hooks/usePOS.ts - VERSION CORRIGÉE
import { useState } from 'react';
import { UtilisateurResponse, ArticleDTO } from '@/types/entities';
import { ApiResponse } from '@/types/api';
import { tokenManager } from '@/services/api/axios';
import toast from 'react-hot-toast';

export interface CartItem {
  article: ArticleDTO;
  quantite: number;
  sousTotal: number;
}

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

export const usePOS = () => {
  const [currentUser, setCurrentUser] = useState<UtilisateurResponse | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // ✅ CORRECTION: Utiliser le tokenManager comme le reste de l'application
  const getAuthHeaders = (): HeadersInit => {
    const token = tokenManager.getAccessToken();
    
    console.log('🔐 Token utilisé pour POS:', token ? 'Token présent' : 'Aucun token');
    
    if (!token) {
      console.warn('⚠️ Aucun token d\'authentification trouvé');
    }
    
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    };
  };

  const validateBadge = async (badgeCode: string) => {
    setIsLoading(true);
    try {
      const headers = getAuthHeaders();
      console.log('🔐 Headers pour validation badge:', headers);
      
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/utilisateurs/badge?codeBadge=${encodeURIComponent(badgeCode)}`,
        { 
          headers,
          method: 'GET'
        }
      );

      console.log('📡 Réponse badge - Status:', response.status, 'Content-Type:', response.headers.get('Content-Type'));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Erreur réponse badge:', errorText.substring(0, 200));
        
        // Gestion spécifique erreur 401
        if (response.status === 401) {
          return { 
            success: false, 
            error: "Session expirée. Veuillez vous reconnecter." 
          };
        }
        
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const contentType = response.headers.get('Content-Type');
      if (!contentType || !contentType.includes('application/json')) {
        const responseText = await response.text();
        console.error('❌ Réponse non-JSON reçue:', responseText.substring(0, 200));
        throw new Error('Réponse invalide du serveur');
      }

      const result: ApiResponse<UtilisateurResponse> = await response.json();
        console.log('🔍 Structure réponse complète:', JSON.stringify(result, null, 2));
        console.log('🔍 result.success:', result.success);
        console.log('🔍 result.data:', result.data);

      // ✅ CORRECTION: Vérifier success au lieu de status
      if (result.status===200 && result.data) {
        setCurrentUser(result.data);
        return { success: true, user: result.data };
      } else {
        return { success: false, error: result.message || "Code badge non reconnu" };
      }
    } catch (error) {
      console.error('Erreur validation badge:', error);
      
      if (error instanceof SyntaxError && error.message.includes('JSON')) {
        return { 
          success: false, 
          error: "Erreur de connexion - veuillez vous reconnecter" 
        };
      }
      
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Impossible de valider le badge" 
      };
    } finally {
      setIsLoading(false);
    }
  };

  const validateTransaction = async (): Promise<{success: boolean, data?: CustomPaymentResponse, error?: string}> => {
    if (!currentUser || cart.length === 0) {
      return { success: false, error: "Client ou panier manquant" };
    }

    setIsLoading(true);
    try {
      const transactionData: CustomPaymentRequest = {
        userEmail: currentUser.email,
        articles: cart.map(item => ({
          articleId: item.article.id!,
          quantite: item.quantite
        }))
      };

      const fullUrl = `${import.meta.env.VITE_API_BASE_URL}/pos/validate`;
      console.log('🌐 URL transaction:', fullUrl);

      const response = await fetch(fullUrl, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(transactionData),
      });

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch {
          const errorText = await response.text();
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('Réponse transaction:', result);
      
      if (result && (result.status === 'success' || response.status === 200)) {
        resetAll();
        return { success: true, data: result };
      } else {
        return { 
          success: false, 
          error: result.message || result.error || "Erreur lors de la validation" 
        };
      }
    } catch (error) {
      console.error('Erreur validation transaction:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Impossible de valider la transaction" 
      };
    } finally {
      setIsLoading(false);
    }
  };

  const addToCart = (article: ArticleDTO) => {
    if (!article.id) {
      toast.error('Article invalide');
      return;
    }

    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.article.id === article.id);
      const prixUnitaire = parseFloat(article.prix);
      
      if (existingItem) {
        const newQuantite = existingItem.quantite + 1;
        return prevCart.map(item =>
          item.article.id === article.id
            ? { 
                ...item, 
                quantite: newQuantite, 
                sousTotal: newQuantite * prixUnitaire 
              }
            : item
        );
      } else {
        return [...prevCart, {
          article,
          quantite: 1,
          sousTotal: prixUnitaire
        }];
      }
    });

    toast.success(`${article.nom} ajouté au panier`);
  };

  const updateQuantity = (articleId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(articleId);
      return;
    }

    setCart(prevCart =>
      prevCart.map(item =>
        item.article.id === articleId
          ? { 
              ...item, 
              quantite: newQuantity, 
              sousTotal: newQuantity * parseFloat(item.article.prix) 
            }
          : item
      )
    );
  };

  const removeFromCart = (articleId: number) => {
    setCart(prevCart => prevCart.filter(item => item.article.id !== articleId));
    toast.success('Article supprimé du panier');
  };

  const clearCart = () => {
    setCart([]);
    toast.success('Panier vidé');
  };

  const resetAll = () => {
    setCurrentUser(null);
    setCart([]);
  };

  // Calculs
  const cartTotal = cart.reduce((sum, item) => sum + item.sousTotal, 0);
  const estimatedSubvention = cartTotal * 0.3;
  const estimatedToPay = cartTotal - estimatedSubvention;

  return {
    // State
    currentUser,
    cart,
    isLoading,
    cartTotal,
    estimatedSubvention,
    estimatedToPay,
    
    // Actions
    validateBadge,
    validateTransaction,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    resetAll,
    setCurrentUser
  };
};