// src/components/pos/ProductGrid.tsx
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Search } from 'lucide-react';
import { ArticleDTO } from '@/types/entities';

interface ProductGridProps {
  articles: ArticleDTO[];
  isLoading: boolean;
  onAddToCart: (article: ArticleDTO) => void;
}

const ProductGrid: React.FC<ProductGridProps> = ({
  articles,
  isLoading,
  onAddToCart
}) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-4 xl:grid-cols-5 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="aspect-square bg-gray-200 rounded-lg mb-3"></div>
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-6 bg-gray-200 rounded mb-2"></div>
              <div className="h-8 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <div className="col-span-full text-center py-12">
        <div className="text-gray-400 mb-4">
          <Search className="w-12 h-12 mx-auto mb-4" />
        </div>
        <p className="text-gray-500">Aucun article trouvé</p>
        <p className="text-sm text-gray-400">
          Vérifiez votre recherche ou rechargez les articles
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {articles.map((article) => (
        <Card 
          key={article.id} 
          className="cursor-pointer hover:shadow-lg transition-all duration-200 transform hover:scale-105 border-0 shadow-sm"
          onClick={() => onAddToCart(article)}
        >
          <CardContent className="p-4">
            <div className="aspect-square bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg mb-3 flex items-center justify-center relative overflow-hidden">
              {/* Image placeholder - vous pouvez ajouter une vraie image plus tard */}
              <div className="text-4xl">🍽️</div>
              <div className="absolute top-2 right-2">
                <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                  #{article.id}
                </Badge>
              </div>
            </div>
            
            <h3 className="font-semibold text-sm mb-1 truncate" title={article.nom}>
              {article.nom}
            </h3>
            
            <p className="text-lg font-bold text-blue-600 mb-2">
              {parseFloat(article.prix).toFixed(2)} €
            </p>
            
            {article.description && (
              <p className="text-xs text-gray-500 mb-2 line-clamp-2" title={article.description}>
                {article.description}
              </p>
            )}
            
            {/* Indicateurs de statut */}
            <div className="flex items-center gap-1 mb-2">
              {article.disponible && (
                <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                  Disponible
                </Badge>
              )}
              {article.quantite !== undefined && article.quantite > 0 && (
                <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                  Stock: {article.quantite}
                </Badge>
              )}
            </div>
            
            <Button 
              className="w-full" 
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onAddToCart(article);
              }}
              disabled={!article.disponible || !article.status}
            >
              <Plus className="w-4 h-4 mr-1" />
              Ajouter
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ProductGrid;