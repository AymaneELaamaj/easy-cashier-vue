import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { UtilisateurDTO } from '@/types/entities';
import { UserPlus } from 'lucide-react';
import { useCategorieEmployes } from '@/hooks/useCategorieEmployes';

const changeCategorySchema = z.object({
  cadre: z.string().min(1, 'La catégorie est requise'),
});

type ChangeCategoryForm = z.infer<typeof changeCategorySchema>;

interface ChangeCategoryModalProps {
  open: boolean;
  onClose: () => void;
  user: UtilisateurDTO;
  onSuccess: () => void;
  changeCategory: (userId: number, cadre: string) => Promise<void>;
  isChanging: boolean;
}

export function ChangeCategoryModal({ 
  open, 
  onClose, 
  user, 
  onSuccess, 
  changeCategory, 
  isChanging 
}: ChangeCategoryModalProps) {
  const { categories } = useCategorieEmployes({ size: 100 }); // Récupérer toutes les catégories
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<ChangeCategoryForm>({
    resolver: zodResolver(changeCategorySchema),
    defaultValues: {
      cadre: user.cadre || '',
    }
  });

  const onSubmit = async (data: ChangeCategoryForm) => {
    try {
      await changeCategory(user.id, data.cadre);
      reset();
      onSuccess();
    } catch (error) {
      console.error('Erreur lors du changement de catégorie:', error);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  // Suggestions de catégories communes (fallback)
  const fallbackSuggestions = [
    'Cadre',
    'Employé',
    'Stagiaire',
    'Contractuel',
    'Consultant',
    'Manager',
    'Directeur',
    'Assistant',
  ];

  // Utiliser les catégories de l'API ou le fallback
  const categorySuggestions = categories?.content?.map(c => c.cadre) || fallbackSuggestions;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Changer la catégorie
          </DialogTitle>
          <DialogDescription>
            Modifiez la catégorie de <strong>{user.prenom} {user.nom}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="bg-muted p-4 rounded-lg mb-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Catégorie actuelle :</span>
              <span className="font-medium">
                {user.cadre || 'Non définie'}
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cadre">Nouvelle catégorie</Label>
              <Input
                id="cadre"
                placeholder="Ex: Cadre, Employé, Manager..."
                {...register('cadre')}
                className={errors.cadre ? 'border-destructive' : ''}
                disabled={isChanging}
                list="category-suggestions"
              />
              <datalist id="category-suggestions">
                {categorySuggestions.map((category) => (
                  <option key={category} value={category} />
                ))}
              </datalist>
              {errors.cadre && (
                <p className="text-sm text-destructive">{errors.cadre.message}</p>
              )}
            </div>

            <div className="text-sm text-muted-foreground">
              <p>Suggestions : {categorySuggestions.slice(0, 4).join(', ')}, etc.</p>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose} disabled={isChanging}>
                Annuler
              </Button>
              <Button type="submit" disabled={isChanging}>
                {isChanging ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Modification...
                  </>
                ) : (
                  'Changer la catégorie'
                )}
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ChangeCategoryModal;