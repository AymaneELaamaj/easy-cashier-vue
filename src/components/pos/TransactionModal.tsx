// src/components/pos/TransactionModal.tsx
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Receipt, CheckCircle2, RefreshCw, User, AlertCircle } from 'lucide-react';
import { CartItem } from '@/hooks/usePOS';
import { UtilisateurResponse } from '@/types/entities';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UtilisateurResponse | null;
  cart: CartItem[];
  cartTotal: number;
  estimatedSubvention: number;
  estimatedToPay: number;
  isLoading: boolean;
  onConfirm: () => void;
}

const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  cart,
  cartTotal,
  estimatedSubvention,
  estimatedToPay,
  isLoading,
  onConfirm
}) => {
  const hasInsufficientFunds = currentUser && estimatedToPay > currentUser.solde;
  const hasNegativeBalance = currentUser && currentUser.solde < 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Receipt className="w-5 h-5 mr-2" />
            Confirmer la transaction
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Info client */}
          {currentUser && (
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
              <div className="flex items-center">
                <User className="w-5 h-5 text-blue-600 mr-2" />
                <div>
                  <p className="font-semibold text-blue-800">
                    {currentUser.prenom} {currentUser.nom}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-xs">
                      {currentUser.cadre || 'Employé'}
                    </Badge>
                    <span className="text-sm text-blue-600">{currentUser.email}</span>
                  </div>
                  <p className="text-sm mt-1">
                    Solde actuel: 
                    <span className={`ml-1 font-semibold ${
                      currentUser.solde >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {currentUser.solde.toFixed(2)} €
                    </span>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Articles */}
          <div>
            <h4 className="font-semibold mb-2">Articles ({cart.length}):</h4>
            <div className="max-h-32 overflow-y-auto space-y-1 bg-gray-50 p-2 rounded">
              {cart.map((item) => (
                <div key={item.article.id} className="flex justify-between text-sm">
                  <span>{item.article.nom} x{item.quantite}</span>
                  <span className="font-medium">{item.sousTotal.toFixed(2)} €</span>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Totaux détaillés */}
          <div className="space-y-2 bg-gray-50 p-3 rounded-lg">
            <div className="flex justify-between">
              <span>Total articles:</span>
              <span className="font-semibold">{cartTotal.toFixed(2)} €</span>
            </div>
            <div className="flex justify-between text-green-600">
              <span>Subvention estimée:</span>
              <span className="font-medium">-{estimatedSubvention.toFixed(2)} €</span>
            </div>
            <div className="flex justify-between text-lg font-bold border-t pt-2">
              <span>À débiter du badge:</span>
              <span className="text-blue-600">{estimatedToPay.toFixed(2)} €</span>
            </div>
          </div>

          {/* Alertes */}
          {hasInsufficientFunds && (
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-700">
                <span className="font-semibold">Solde insuffisant !</span>
                <br />
                Il manque {(estimatedToPay - currentUser!.solde).toFixed(2)} € sur le badge.
              </AlertDescription>
            </Alert>
          )}

          {hasNegativeBalance && !hasInsufficientFunds && (
            <Alert className="border-amber-200 bg-amber-50">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-700">
                Attention : Le solde du badge est déjà négatif.
              </AlertDescription>
            </Alert>
          )}

          {currentUser && estimatedToPay <= currentUser.solde && currentUser.solde >= 0 && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700">
                Transaction possible. Nouveau solde après achat : {(currentUser.solde - estimatedToPay).toFixed(2)} €
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={isLoading}
          >
            Annuler
          </Button>
          <Button 
            onClick={onConfirm}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4 mr-2" />
            )}
            Confirmer le paiement
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TransactionModal;