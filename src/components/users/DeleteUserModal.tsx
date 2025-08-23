import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { UtilisateurDTO } from '@/types/entities';
import { AlertTriangle } from 'lucide-react';

interface DeleteUserModalProps {
  open: boolean;
  onClose: () => void;
  user: UtilisateurDTO;
  onSuccess: () => void;
  deleteUser: (id: number) => Promise<void>;
  isDeleting: boolean;
}

export function DeleteUserModal({ 
  open, 
  onClose, 
  user, 
  onSuccess, 
  deleteUser, 
  isDeleting 
}: DeleteUserModalProps) {
  const handleDelete = async () => {
    try {
      await deleteUser(user.id);
      onSuccess();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Supprimer l'utilisateur
          </DialogTitle>
          <DialogDescription className="text-left">
            Êtes-vous sûr de vouloir supprimer le compte de{' '}
            <strong>{user.prenom} {user.nom}</strong> ?
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-lg">
            <h4 className="font-medium text-destructive mb-2">
              ⚠️ Cette action est irréversible
            </h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Le compte utilisateur sera définitivement supprimé</li>
              <li>• L'historique des transactions sera conservé</li>
              <li>• Les données personnelles seront effacées</li>
              {user.solde && user.solde > 0 && (
                <li className="text-orange-600 font-medium">
                  • Le solde restant ({user.solde}€) sera perdu
                </li>
              )}
            </ul>
          </div>

          {user.solde && user.solde > 0 && (
            <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <p className="text-sm text-orange-800">
                <strong>Attention :</strong> Cet utilisateur a un solde de{' '}
                <strong>{user.solde}€</strong>. Assurez-vous que ce solde a été 
                remboursé avant de procéder à la suppression.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={isDeleting}>
            Annuler
          </Button>
          <Button 
            type="button" 
            variant="destructive" 
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Suppression...
              </>
            ) : (
              'Supprimer définitivement'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default DeleteUserModal;