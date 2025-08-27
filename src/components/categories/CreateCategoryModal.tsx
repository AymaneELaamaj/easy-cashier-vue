import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

const createCategorySchema = z.object({
  cadre: z.string().min(1, 'Le nom de la catégorie est requis'),
});

type CreateCategoryForm = z.infer<typeof createCategorySchema>;

interface CreateCategoryModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  createCategory: (cadre: string) => Promise<void>;
  isCreating: boolean;
}

export function CreateCategoryModal({ 
  open, 
  onClose, 
  onSuccess, 
  createCategory, 
  isCreating 
}: CreateCategoryModalProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<CreateCategoryForm>({
    resolver: zodResolver(createCategorySchema)
  });

  const onSubmit = async (data: CreateCategoryForm) => {
    try {
      await createCategory(data.cadre);
      reset();
      onSuccess();
    } catch (error) {
      console.error('Erreur lors de la création:', error);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Nouvelle catégorie d'employé</DialogTitle>
          <DialogDescription>
            Créez une nouvelle catégorie d'employé pour l'organisation.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cadre">Nom de la catégorie</Label>
            <Input
              id="cadre"
              placeholder="Ex: Cadre supérieur, Employé, etc."
              {...register('cadre')}
              disabled={isCreating}
            />
            {errors.cadre && (
              <p className="text-sm text-destructive">{errors.cadre.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isCreating}
            >
              Annuler
            </Button>
            <Button 
              type="submit" 
              disabled={isCreating}
            >
              {isCreating ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Création...
                </>
              ) : (
                'Créer'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default CreateCategoryModal;
