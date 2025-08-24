// components/subventions/EditSubventionModal.tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SubventionForm, SubventionFormValues } from "./SubventionForm";
import { useSubventions } from "@/hooks/useSubventions";
import { SubventionDTO } from "@/types/entities";

export function EditSubventionModal({
  open,
  onClose,
  subvention,
}: {
  open: boolean;
  onClose: () => void;
  subvention: SubventionDTO | null;
}) {
  const { updateSubvention, isUpdating } = useSubventions();

  const handleSubmit = async (values: SubventionFormValues) => {
    if (!subvention?.id) return;
    await updateSubvention({ id: subvention.id, data: values as any });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Modifier la subvention</DialogTitle>
        </DialogHeader>
        <SubventionForm
          defaultValues={subvention ?? undefined}
          onSubmit={handleSubmit}
          submitting={isUpdating}
          submitLabel="Enregistrer"
        />
      </DialogContent>
    </Dialog>
  );
}
