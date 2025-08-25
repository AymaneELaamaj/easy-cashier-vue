import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { MessageSquarePlus } from 'lucide-react';

interface CreateFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (commentaire: string) => void;
  isLoading?: boolean;
}

export const CreateFeedbackModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  isLoading = false 
}: CreateFeedbackModalProps) => {
  const [commentaire, setCommentaire] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (commentaire.trim()) {
      onSubmit(commentaire.trim());
      setCommentaire('');
      onClose();
    }
  };

  const handleClose = () => {
    setCommentaire('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquarePlus className="h-5 w-5" />
            Nouveau Feedback
          </DialogTitle>
          <DialogDescription>
            Partagez votre avis ou vos suggestions pour améliorer nos services.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="commentaire">
              Commentaire <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="commentaire"
              placeholder="Entrez votre commentaire..."
              value={commentaire}
              onChange={(e) => setCommentaire(e.target.value)}
              rows={4}
              className="resize-none"
              required
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              {commentaire.length}/500 caractères
            </p>
          </div>

          <DialogFooter className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={!commentaire.trim() || isLoading}
              className="flex items-center gap-2"
            >
              {isLoading && <LoadingSpinner size="sm" />}
              {isLoading ? 'Création...' : 'Créer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
