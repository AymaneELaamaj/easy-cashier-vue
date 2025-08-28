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
import { ConfigPaiementDTO } from '@/types/entities';

type PaymentType = 'POST_PAIEMENT' | 'PRE_PAIEMENT';

const OPTIONS: { value: PaymentType; label: string }[] = [
  { value: 'POST_PAIEMENT', label: 'Post Paiement' },
  { value: 'PRE_PAIEMENT', label: 'Pre Paiement' },
];

interface EditConfigModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: ConfigPaiementDTO | null; // doit contenir id?:1, typePaiement
  onUpdated?: () => void;
}

export default function EditConfigModal({ open, onOpenChange, config, onUpdated }: EditConfigModalProps) {
  const { updateConfig, isUpdating } = useConfigs();
  const [type, setType] = useState<PaymentType>('POST_PAIEMENT');

  useEffect(() => {
    if (open && config?.typePaiement) {
      setType(config.typePaiement as PaymentType);
    }
  }, [open, config?.typePaiement]);

  if (!config) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = config.id ?? 1; // id global = 1
    try {
      await updateConfig({ id, data: { typePaiement: type } });
      toast.success('Type de paiement mis à jour');
      onUpdated?.();
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      toast.error('Erreur lors de la mise à jour du type de paiement');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Modifier le type de paiement</DialogTitle>
          <DialogDescription>Actualisez le type de paiement global.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <select
              id="type"
              className="w-full border rounded-md px-3 py-2 bg-background"
              value={type}
              onChange={(e) => setType(e.target.value as PaymentType)}
              disabled={isUpdating}
            >
              {OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isUpdating}>
              Annuler
            </Button>
            <Button type="submit" disabled={isUpdating}>
              {isUpdating ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Mise à jour…</>) : 'Mettre à jour'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
