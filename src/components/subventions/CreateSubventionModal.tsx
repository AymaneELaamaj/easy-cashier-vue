// components/subventions/CreateSubventionModal.tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SubventionForm, SubventionFormValues } from "./SubventionForm";
import { useSubventions } from "@/hooks/useSubventions";

export function CreateSubventionModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { createSubvention, isCreating } = useSubventions();

  const handleSubmit = async (values: SubventionFormValues) => {
    await createSubvention(values as undefined);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Nouvelle subvention</DialogTitle>
        </DialogHeader>
        <SubventionForm onSubmit={handleSubmit} submitting={isCreating} submitLabel="Créer" />
      </DialogContent>
    </Dialog>
  );
}
