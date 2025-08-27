import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { CategorieEmployesResponse } from '@/types/entities';
import { AlertTriangle } from 'lucide-react';

interface DeleteCategoryModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  category: CategorieEmployesResponse;
  deleteCategory: (id: number) => Promise<void>;
  isDeleting: boolean;
}

export function DeleteCategoryModal({ 
  open, 
  onClose, 
  onSuccess, 
  category,
  deleteCategory, 
  isDeleting 
}: DeleteCategoryModalProps) {
  const handleDelete = async () => {
    try {
      if (category.id) {
        await deleteCategory(category.id);
        onSuccess();
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Supprimer la catégorie
          </DialogTitle>
          <DialogDescription>
            Êtes-vous sûr de vouloir supprimer cette catégorie d'employé ?
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="bg-muted p-3 rounded-md">
            <p className="font-medium">Catégorie à supprimer :</p>
            <p className="text-lg font-semibold text-primary mt-1">
              {category.cadre}
            </p>
          </div>
          
          <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
            <p className="text-sm text-destructive">
              <strong>Attention :</strong> Cette action est irréversible. 
              Tous les employés associés à cette catégorie devront être réassignés.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isDeleting}
          >
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
              'Supprimer'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default DeleteCategoryModal;
