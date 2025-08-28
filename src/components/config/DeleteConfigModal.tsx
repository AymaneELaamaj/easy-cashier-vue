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
import { Loader2, Trash2 } from 'lucide-react';
import { useConfigs } from '@/hooks/useConfigs';
import toast from 'react-hot-toast';
import { ConfigPaiementDTO } from '@/types/entities';

interface DeleteConfigModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: ConfigPaiementDTO | null; // { id?:1, typePaiement:string }
  onDeleted?: () => void;
}

export default function DeleteConfigModal({ open, onOpenChange, config, onDeleted }: DeleteConfigModalProps) {
  const { deleteConfig, isDeleting } = useConfigs();
  if (!config) return null;

  const handleDelete = async () => {
    const id = config.id ?? 1; // id global
    try {
      await deleteConfig(id);
      toast.success('Configuration supprimée');
      onDeleted?.();
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      toast.error('Erreur lors de la suppression');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle>Supprimer la configuration</DialogTitle>
          <DialogDescription>
            Cette action supprimera la configuration globale du type de paiement.
            Le système retombera sur <strong>POST_PAIEMENT</strong> par défaut.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-md bg-muted p-3 text-sm">
          Type actuel : <strong>{config.typePaiement}</strong>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isDeleting}>
            Annuler
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Suppression…
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Supprimer
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
