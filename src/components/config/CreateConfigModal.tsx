import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { useConfigs } from '@/hooks/useConfigs';
import toast from 'react-hot-toast';

type PaymentType = 'POST_PAIEMENT' | 'PRE_PAIEMENT';

const OPTIONS: { value: PaymentType; label: string }[] = [
  { value: 'POST_PAIEMENT', label: 'Post Paiement' },
  { value: 'PRE_PAIEMENT', label: 'Pre Paiement' },
];

interface CreateConfigModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
}

export default function CreateConfigModal({ open, onOpenChange, onCreated }: CreateConfigModalProps) {
  const { createConfig, isCreating } = useConfigs();
  const [type, setType] = useState<PaymentType>('POST_PAIEMENT');

  useEffect(() => {
    if (!open) setType('POST_PAIEMENT');
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createConfig({ typePaiement: type });
      toast.success('Type de paiement créé/défini avec succès');
      onCreated?.();
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      toast.error('Erreur lors de la création du type de paiement');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Nouveau type de paiement</DialogTitle>
          <DialogDescription>Définissez le type de paiement global.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <select
              id="type"
              className="w-full border rounded-md px-3 py-2 bg-background"
              value={type}
              onChange={(e) => setType(e.target.value as PaymentType)}
              disabled={isCreating}
            >
              {OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isCreating}>
              Annuler
            </Button>
            <Button type="submit" disabled={isCreating}>
              {isCreating ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Enregistrement…</>) : 'Créer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
