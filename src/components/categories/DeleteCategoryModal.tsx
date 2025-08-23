import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { CategorieEmployesDTO } from '@/types/entities';
import { Trash2, AlertTriangle } from 'lucide-react';

interface DeleteCategoryModalProps {
  open: boolean;
  onClose: () => void;
  category: CategorieEmployesDTO;
  onSuccess: () => void;
  deleteCategory: (id: number) => Promise<void>;
  isDeleting: boolean;
}

export function DeleteCategoryModal({
  open,
  onClose,
  category,
  onSuccess,
  deleteCategory,
  isDeleting
}: DeleteCategoryModalProps) {
  const handleDelete = async () => {
    try {
      await deleteCategory(category.id!);
      onSuccess();
    } catch (error) {
      console.error('Erreur lors de la suppression de la catégorie:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-destructive" />
            Supprimer la catégorie
          </DialogTitle>
          <DialogDescription>
            Êtes-vous sûr de vouloir supprimer la catégorie <strong>{category.cadre}</strong> ?
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <div className="space-y-2">
                <p className="text-sm font-medium text-destructive">
                  Attention - Cette action est irréversible
                </p>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>• La catégorie sera définitivement supprimée</p>
                  <p>• Les utilisateurs associés à cette catégorie devront être reclassés</p>
                  <p>• Cette action ne peut pas être annulée</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 p-4 bg-muted rounded-lg">
            <div className="text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Catégorie :</span>
                <span className="font-medium">{category.cadre}</span>
              </div>
              {category.dateCreation && (
                <div className="flex justify-between mt-1">
                  <span className="text-muted-foreground">Créée le :</span>
                  <span>{new Date(category.dateCreation).toLocaleDateString('fr-FR')}</span>
                </div>
              )}
            </div>
          </div>
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

export default DeleteCategoryModal;