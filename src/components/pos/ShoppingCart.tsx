// src/components/pos/ShoppingCart.tsx
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { ShoppingCart, Trash2, Plus, Minus, CreditCard } from 'lucide-react';
import { CartItem } from '@/hooks/usePOS';
import { UtilisateurResponse } from '@/types/entities';

interface ShoppingCartProps {
  cart: CartItem[];
  cartTotal: number;
  estimatedSubvention: number;
  estimatedToPay: number;
  currentUser: UtilisateurResponse | null;
  isLoading: boolean;
  onUpdateQuantity: (articleId: number, newQuantity: number) => void;
  onRemoveFromCart: (articleId: number) => void;
  onClearCart: () => void;
  onValidateTransaction: () => void;
}

const ShoppingCartComponent: React.FC<ShoppingCartProps> = ({
  cart,
  cartTotal,
  estimatedSubvention,
  estimatedToPay,
  currentUser,
  isLoading,
  onUpdateQuantity,
  onRemoveFromCart,
  onClearCart,
  onValidateTransaction
}) => {
  return (
    <div className="w-96 bg-white border-l shadow-lg flex flex-col">
      {/* Header */}
      <div className="p-4 border-b bg-gray-50">
        <h2 className="text-lg font-semibold flex items-center justify-between">
          <span className="flex items-center">
            <ShoppingCart className="w-5 h-5 mr-2" />
            Panier
          </span>
          <Badge variant="outline" className="bg-blue-50 text-blue-700">
            {cart.length} article{cart.length !== 1 ? 's' : ''}
          </Badge>
        </h2>
      </div>

      {/* Liste des articles */}
      <ScrollArea className="flex-1 p-4">
        {cart.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500 mb-2">Panier vide</p>
            <p className="text-sm text-gray-400">
              Cliquez sur les articles pour les ajouter
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {cart.map((item) => (
              <div key={item.article.id} className="bg-gray-50 rounded-lg p-3 border">
                {/* Info article */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="font-medium text-sm" title={item.article.nom}>
                      {item.article.nom}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {parseFloat(item.article.prix).toFixed(2)} € l'unité
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemoveFromCart(item.article.id!)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 ml-2"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                
                {/* Contrôles quantité */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onUpdateQuantity(item.article.id!, item.quantite - 1)}
                      className="h-8 w-8 p-0"
                    >
                      <Minus className="w-3 h-3" />
                    </Button>
                    <span className="w-8 text-center font-semibold">
                      {item.quantite}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onUpdateQuantity(item.article.id!, item.quantite + 1)}
                      className="h-8 w-8 p-0"
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                  <span className="font-bold text-blue-600">
                    {item.sousTotal.toFixed(2)} €
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Totaux et actions */}
      {cart.length > 0 && (
        <div className="p-4 border-t bg-gray-50 space-y-4">
          {/* Totaux */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Sous-total:</span>
              <span className="font-semibold">{cartTotal.toFixed(2)} €</span>
            </div>
            <div className="flex justify-between text-green-600">
              <span>Subvention estimée:</span>
              <span>-{estimatedSubvention.toFixed(2)} €</span>
            </div>
            <Separator />
            <div className="flex justify-between text-lg font-bold">
              <span>À payer:</span>
              <span className="text-blue-600">{estimatedToPay.toFixed(2)} €</span>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2">
            <Button 
              variant="outline" 
              className="w-full"
              onClick={onClearCart}
              disabled={isLoading}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Vider le panier (F2)
            </Button>
            
            <Button 
              className="w-full"
              onClick={onValidateTransaction}
              disabled={!currentUser || cart.length === 0 || isLoading}
              size="lg"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Valider l'achat (F3)
            </Button>

            {!currentUser && (
              <p className="text-xs text-amber-600 text-center bg-amber-50 p-2 rounded">
                Scanner un badge client pour continuer
              </p>
            )}

            {currentUser && estimatedToPay > currentUser.solde && (
              <p className="text-xs text-red-600 text-center bg-red-50 p-2 rounded">
                Solde insuffisant ({(estimatedToPay - currentUser.solde).toFixed(2)} € manquant)
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ShoppingCartComponent;