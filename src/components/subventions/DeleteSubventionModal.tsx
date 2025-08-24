// components/subventions/DeleteSubventionModal.tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useSubventions } from "@/hooks/useSubventions";
import { SubventionDTO } from "@/types/entities";

export function DeleteSubventionModal({
  open,
  onClose,
  subvention,
}: {
  open: boolean;
  onClose: () => void;
  subvention: SubventionDTO | null;
}) {
  const { deleteSubvention, isDeleting } = useSubventions();

  const onConfirm = async () => {
    if (!subvention?.id) return;
    await deleteSubvention(subvention.id);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Supprimer la subvention</DialogTitle>
        </DialogHeader>
        <p>Voulez-vous vraiment supprimer la subvention liée à l’article #{subvention?.articleId} ?</p>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isDeleting}>
            Supprimer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
