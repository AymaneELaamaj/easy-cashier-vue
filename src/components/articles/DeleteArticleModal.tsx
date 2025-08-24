import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ArticleDTO } from '@/types/entities';
import { useArticles } from '@/hooks/useArticles';
import { toast } from 'react-hot-toast';
import { Loader2, AlertTriangle } from 'lucide-react';

interface DeleteArticleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  article: ArticleDTO | null;
}

export function DeleteArticleModal({ open, onOpenChange, article }: DeleteArticleModalProps) {
  const { deleteArticle, isDeleting } = useArticles();

  const handleDelete = async () => {
    if (!article?.id) {
      toast.error('Article invalide');
      return;
    }

    try {
      await deleteArticle(article.id);
      toast.success('Article supprimé avec succès !');
      onOpenChange(false);
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      toast.error('Erreur lors de la suppression de l\'article');
    }
  };

  if (!article) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <span>Confirmer la suppression</span>
          </DialogTitle>
          <DialogDescription>
            Êtes-vous sûr de vouloir supprimer cet article ? Cette action est irréversible.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Article à supprimer :</h4>
            <div className="space-y-1 text-sm">
              <p><strong>Nom :</strong> {article.nom}</p>
              <p><strong>Prix :</strong> {article.prix} MAD</p>
              {article.description && (
                <p><strong>Description :</strong> {article.description}</p>
              )}
              <p><strong>Quantité :</strong> {article.quantite || 0}</p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
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
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
