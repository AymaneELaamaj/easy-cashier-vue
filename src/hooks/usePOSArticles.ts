// src/hooks/usePOSArticles.ts
import { useArticles } from './useArticles';
import { ArticleDTO } from '@/types/entities';

/**
 * Hook adaptateur pour utiliser les articles existants dans l'interface POS
 * Filtre automatiquement les articles disponibles et actifs pour le POS
 */
export const usePOSArticles = () => {
  const { articles: articlesPage, isLoading, error, refetch } = useArticles();

  // Vérifier le type de données retourné et extraire les articles
  let articles: ArticleDTO[] = [];
  
  if (articlesPage) {
    // Si articlesPage est un objet avec une propriété 'content' (pagination)
    if (typeof articlesPage === 'object' && 'content' in articlesPage) {
      articles = Array.isArray(articlesPage.content) ? articlesPage.content : [];
    }
    // Si articlesPage est directement un tableau
    else if (Array.isArray(articlesPage)) {
      articles = articlesPage;
    }
    // Si articlesPage est un objet avec une propriété 'data'
    else if (typeof articlesPage === 'object' && 'data' in articlesPage) {
      const data = (articlesPage as any).data;
      articles = Array.isArray(data) ? data : [];
    }
  }
  
  // Filtrer uniquement les articles disponibles et actifs pour le POS
  const availableArticles = articles.filter(article => 
    article && 
    article.disponible && 
    article.status &&
    // Optionnel : exclure les articles sans prix ou avec prix à 0
    article.prix && 
    parseFloat(article.prix) > 0
  );

  return {
    articles: availableArticles,
    allArticles: articles, // Si vous voulez accéder à tous les articles
    totalArticles: (articlesPage as any)?.totalElements || articles.length,
    isLoading,
    error,
    refetch
  };
};