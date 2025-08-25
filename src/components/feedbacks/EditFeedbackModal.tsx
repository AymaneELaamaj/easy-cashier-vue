import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Edit3 } from 'lucide-react';
import { FeedbackDTO } from '@/types/entities';

interface EditFeedbackModalProps {
  feedback: FeedbackDTO | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (id: number, commentaire: string) => void;
  isLoading?: boolean;
}

export const EditFeedbackModal = ({ 
  feedback,
  isOpen, 
  onClose, 
  onSubmit, 
  isLoading = false 
}: EditFeedbackModalProps) => {
  const [commentaire, setCommentaire] = useState('');

  useEffect(() => {
    if (feedback) {
      setCommentaire(feedback.commentaire || '');
    }
  }, [feedback]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (feedback?.id && commentaire.trim()) {
      onSubmit(feedback.id, commentaire.trim());
      onClose();
    }
  };

  const handleClose = () => {
    setCommentaire(feedback?.commentaire || '');
    onClose();
  };

  if (!feedback) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit3 className="h-5 w-5" />
            Modifier le Feedback
          </DialogTitle>
          <DialogDescription>
            Modifiez votre commentaire ci-dessous.
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
              disabled={!commentaire.trim() || isLoading || commentaire === feedback.commentaire}
              className="flex items-center gap-2"
            >
              {isLoading && <LoadingSpinner size="sm" />}
              {isLoading ? 'Modification...' : 'Modifier'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
