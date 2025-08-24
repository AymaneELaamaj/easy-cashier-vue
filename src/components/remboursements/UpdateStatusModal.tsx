import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useRemboursements } from '@/hooks/useRemboursements';
import { toast } from 'react-hot-toast';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { RemboursementDTO, StatusRemboursement } from '@/types/entities';

interface UpdateStatusModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  remboursement: RemboursementDTO | null;
}

export function UpdateStatusModal({ open, onOpenChange, remboursement }: UpdateStatusModalProps) {
  const { updateStatus, isUpdatingStatus } = useRemboursements();
  
  const [formData, setFormData] = useState({
    status: '',
    commentaireAdmin: '',
  });

  React.useEffect(() => {
    if (remboursement && open) {
      setFormData({
        status: remboursement.status || 'EN_ATTENTE',
        commentaireAdmin: remboursement.commentaireAdmin || '',
      });
    }
  }, [remboursement, open]);

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!remboursement || !formData.status) {
      toast.error('Veuillez sélectionner un statut');
      return;
    }

    try {
      updateStatus({
        remboursementId: remboursement.id!,
        status: formData.status as StatusRemboursement
      });
      
      onOpenChange(false);
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
    }
  };

  const resetForm = () => {
    setFormData({ status: '', commentaireAdmin: '' });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACCEPTE':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'REFUSE':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'ACCEPTE':
        return 'default' as const;
      case 'REFUSE':
        return 'destructive' as const;
      case 'EN_ATTENTE':
        return 'secondary' as const;
      default:
        return 'secondary' as const;
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      onOpenChange(isOpen);
      if (!isOpen) resetForm();
    }}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Mettre à jour le statut</DialogTitle>
          <DialogDescription>
            Modifiez le statut de cette demande de remboursement.
          </DialogDescription>
        </DialogHeader>

        {remboursement && (
          <div className="space-y-4">
            {/* Informations de la demande */}
            <div className="bg-muted/50 p-4 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium">Demande #{remboursement.id}</span>
                <Badge variant={getStatusVariant(remboursement.status || 'EN_ATTENTE')}>
                  <div className="flex items-center gap-1">
                    {getStatusIcon(remboursement.status || 'EN_ATTENTE')}
                    {remboursement.status || 'EN_ATTENTE'}
                  </div>
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                <strong>Transaction:</strong> #{remboursement.transactionId}
              </p>
              <p className="text-sm text-muted-foreground">
                <strong>Demandeur:</strong> {remboursement.utilisateur?.nom} {remboursement.utilisateur?.prenom}
              </p>
              <p className="text-sm text-muted-foreground">
                <strong>Motif:</strong> {remboursement.message}
              </p>
              <p className="text-sm text-muted-foreground">
                <strong>Montant:</strong> {remboursement.montant} €
              </p>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="status">Nouveau statut *</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleInputChange('status', value)}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EN_ATTENTE">
                      <div className="flex items-center gap-2">
                        En attente
                      </div>
                    </SelectItem>
                    <SelectItem value="ACCEPTE">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Accepté
                      </div>
                    </SelectItem>
                    <SelectItem value="REFUSE">
                      <div className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-red-500" />
                        Refusé
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="commentaireAdmin">Commentaire administrateur</Label>
                <Textarea
                  id="commentaireAdmin"
                  value={formData.commentaireAdmin}
                  onChange={(e) => handleInputChange('commentaireAdmin', e.target.value)}
                  placeholder="Ajoutez un commentaire sur votre décision..."
                  rows={3}
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isUpdatingStatus}
                >
                  Annuler
                </Button>
                <Button type="submit" disabled={isUpdatingStatus}>
                  {isUpdatingStatus ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Mise à jour...
                    </>
                  ) : (
                    'Mettre à jour'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
