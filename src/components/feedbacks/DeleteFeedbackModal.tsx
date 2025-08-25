import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Trash2, AlertTriangle } from 'lucide-react';
import { FeedbackDTO } from '@/types/entities';

interface DeleteFeedbackModalProps {
  feedback: FeedbackDTO | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (id: number) => void;
  isLoading?: boolean;
}

export const DeleteFeedbackModal = ({ 
  feedback,
  isOpen, 
  onClose, 
  onConfirm, 
  isLoading = false 
}: DeleteFeedbackModalProps) => {
  
  const handleConfirm = () => {
    if (feedback?.id) {
      onConfirm(feedback.id);
      onClose();
    }
  };

  if (!feedback) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Supprimer le Feedback
          </DialogTitle>
          <DialogDescription className="text-left">
            Êtes-vous sûr de vouloir supprimer ce feedback ? Cette action est irréversible.
          </DialogDescription>
        </DialogHeader>
        
        <div className="bg-gray-50 p-4 rounded-lg border">
          <p className="text-sm text-gray-700 line-clamp-3">
            "{feedback.commentaire}"
          </p>
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            Annuler
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleConfirm}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            {isLoading && <LoadingSpinner size="sm" />}
            <Trash2 className="h-4 w-4" />
            {isLoading ? 'Suppression...' : 'Supprimer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
