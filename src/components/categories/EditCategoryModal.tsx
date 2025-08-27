import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { CategorieEmployesResponse } from '@/types/entities';

const editCategorySchema = z.object({
  cadre: z.string().min(1, 'Le nom de la catégorie est requis'),
});

type EditCategoryForm = z.infer<typeof editCategorySchema>;

interface EditCategoryModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  category: CategorieEmployesResponse;
  updateCategory: (id: number, cadre: string) => Promise<void>;
  isUpdating: boolean;
}

export function EditCategoryModal({ 
  open, 
  onClose, 
  onSuccess, 
  category,
  updateCategory, 
  isUpdating 
}: EditCategoryModalProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue
  } = useForm<EditCategoryForm>({
    resolver: zodResolver(editCategorySchema)
  });

  // Pré-remplir le formulaire avec les données de la catégorie
  useEffect(() => {
    if (category && open) {
      setValue('cadre', category.cadre);
    }
  }, [category, open, setValue]);

  const onSubmit = async (data: EditCategoryForm) => {
    try {
      if (category.id) {
        await updateCategory(category.id, data.cadre);
        reset();
        onSuccess();
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
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
          <DialogTitle>Modifier la catégorie</DialogTitle>
          <DialogDescription>
            Modifiez les informations de la catégorie d'employé.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cadre">Nom de la catégorie</Label>
            <Input
              id="cadre"
              placeholder="Ex: Cadre supérieur, Employé, etc."
              {...register('cadre')}
              disabled={isUpdating}
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
              disabled={isUpdating}
            >
              Annuler
            </Button>
            <Button 
              type="submit" 
              disabled={isUpdating}
            >
              {isUpdating ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Modification...
                </>
              ) : (
                'Modifier'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default EditCategoryModal;
