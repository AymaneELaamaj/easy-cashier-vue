import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { CategorieEmployesDTO } from '@/types/entities';
import { Edit } from 'lucide-react';

const editCategorySchema = z.object({
  cadre: z.string().min(1, 'Le nom de la catégorie est requis').max(100, 'Le nom ne peut pas dépasser 100 caractères'),
});

type EditCategoryForm = z.infer<typeof editCategorySchema>;

interface EditCategoryModalProps {
  open: boolean;
  onClose: () => void;
  category: CategorieEmployesDTO;
  onSuccess: () => void;
  updateCategory: (id: number, cadre: string) => Promise<void>;
  isUpdating: boolean;
}

export function EditCategoryModal({ 
  open, 
  onClose, 
  category, 
  onSuccess, 
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
    resolver: zodResolver(editCategorySchema),
  });

  // Mettre à jour les valeurs par défaut quand la catégorie change
  useEffect(() => {
    if (category) {
      setValue('cadre', category.cadre || '');
    }
  }, [category, setValue]);

  const onSubmit = async (data: EditCategoryForm) => {
    try {
      await updateCategory(category.id!, data.cadre);
      reset();
      onSuccess();
    } catch (error) {
      console.error('Erreur lors de la modification de la catégorie:', error);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Modifier la catégorie
          </DialogTitle>
          <DialogDescription>
            Modifiez les informations de la catégorie <strong>{category.cadre}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="bg-muted p-4 rounded-lg mb-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Catégorie actuelle :</span>
              <span className="font-medium">{category.cadre}</span>
            </div>
            {category.dateCreation && (
              <div className="flex items-center justify-between mt-2">
                <span className="text-sm text-muted-foreground">Créée le :</span>
                <span className="text-sm">
                  {new Date(category.dateCreation).toLocaleDateString('fr-FR')}
                </span>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cadre">Nom de la catégorie</Label>
              <Input
                id="cadre"
                placeholder="Ex: Cadre supérieur, Manager, Employé..."
                {...register('cadre')}
                className={errors.cadre ? 'border-destructive' : ''}
                disabled={isUpdating}
              />
              {errors.cadre && (
                <p className="text-sm text-destructive">{errors.cadre.message}</p>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose} disabled={isUpdating}>
                Annuler
              </Button>
              <Button type="submit" disabled={isUpdating}>
                {isUpdating ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Modification...
                  </>
                ) : (
                  'Modifier la catégorie'
                )}
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default EditCategoryModal;