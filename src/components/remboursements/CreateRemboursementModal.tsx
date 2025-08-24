import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface CreateRemboursementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateRemboursementModal({ open, onOpenChange }: CreateRemboursementModalProps) {
  const { createDemande, isCreatingDemande } = useRemboursements();
  
  const [formData, setFormData] = useState({
    transactionId: '',
    message: '',
  });

  // Ici vous pouvez ajouter une query pour récupérer les transactions de l'utilisateur
  // const { data: transactions } = useQuery({ ... });

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.transactionId || !formData.message.trim()) {
      toast.error('Veuillez remplir tous les champs requis');
      return;
    }

    try {
      createDemande({
        transactionId: parseInt(formData.transactionId),
        message: formData.message.trim()
      });
      
      // Reset form
      setFormData({ transactionId: '', message: '' });
      onOpenChange(false);
    } catch (error) {
      console.error('Erreur lors de la création de la demande:', error);
    }
  };

  const resetForm = () => {
    setFormData({ transactionId: '', message: '' });
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      onOpenChange(isOpen);
      if (!isOpen) resetForm();
    }}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nouvelle demande de remboursement</DialogTitle>
          <DialogDescription>
            Créez une nouvelle demande de remboursement pour une transaction.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="transactionId">Transaction ID *</Label>
            <Input
              id="transactionId"
              type="number"
              value={formData.transactionId}
              onChange={(e) => handleInputChange('transactionId', e.target.value)}
              placeholder="ID de la transaction à rembourser"
              required
            />
            <p className="text-xs text-muted-foreground">
              Entrez l'ID de la transaction pour laquelle vous demandez un remboursement
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Motif de la demande *</Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => handleInputChange('message', e.target.value)}
              placeholder="Décrivez la raison de votre demande de remboursement..."
              rows={4}
              required
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isCreatingDemande}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isCreatingDemande}>
              {isCreatingDemande ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Création...
                </>
              ) : (
                'Créer la demande'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
