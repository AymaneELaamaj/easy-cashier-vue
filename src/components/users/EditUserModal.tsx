import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { UtilisateurDTO } from '@/types/entities';
import { UserRole } from '@/types/api';

const editUserSchema = z.object({
  nom: z.string().min(1, 'Le nom est requis'),
  prenom: z.string().min(1, 'Le prénom est requis'),
  email: z.string().email('Email invalide').min(1, 'Email requis'),
  role: z.enum([UserRole.EMPLOYE, UserRole.CAISSIER, UserRole.ADMIN, UserRole.SUPER_ADMIN]),
  cadre: z.string().optional(),
  active: z.boolean(),
});

type EditUserForm = z.infer<typeof editUserSchema>;

interface EditUserModalProps {
  open: boolean;
  onClose: () => void;
  user: UtilisateurDTO;
  onSuccess: () => void;
  updateUser: (id: number, data: Partial<UtilisateurDTO>) => Promise<void>;
  isUpdating: boolean;
}

export function EditUserModal({ 
  open, 
  onClose, 
  user, 
  onSuccess, 
  updateUser, 
  isUpdating 
}: EditUserModalProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset
  } = useForm<EditUserForm>({
    resolver: zodResolver(editUserSchema),
  });

  const selectedRole = watch('role');
  const isActive = watch('active');

  useEffect(() => {
    if (user && open) {
      reset({
        nom: user.nom || '',
        prenom: user.prenom || '',
        email: user.email || '',
        role: user.role as UserRole,
        cadre: user.cadre || '',
        active: user.active !== false,
      });
    }
  }, [user, open, reset]);

  const onSubmit = async (data: EditUserForm) => {
    try {
      const userData: Partial<UtilisateurDTO> = {
        nom: data.nom,
        prenom: data.prenom,
        email: data.email,
        role: data.role,
        cadre: data.cadre || undefined,
        active: data.active,
      };
      
      await updateUser(user.id, userData);
      onSuccess();
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Modifier l'utilisateur</DialogTitle>
          <DialogDescription>
            Modifiez les informations de {user.prenom} {user.nom}.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="prenom">Prénom</Label>
              <Input
                id="prenom"
                placeholder="Prénom"
                {...register('prenom')}
                className={errors.prenom ? 'border-destructive' : ''}
                disabled={isUpdating}
              />
              {errors.prenom && (
                <p className="text-sm text-destructive">{errors.prenom.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="nom">Nom</Label>
              <Input
                id="nom"
                placeholder="Nom"
                {...register('nom')}
                className={errors.nom ? 'border-destructive' : ''}
                disabled={isUpdating}
              />
              {errors.nom && (
                <p className="text-sm text-destructive">{errors.nom.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="exemple@domaine.com"
              {...register('email')}
              className={errors.email ? 'border-destructive' : ''}
              disabled={isUpdating}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Rôle</Label>
            <Select 
              value={selectedRole} 
              onValueChange={(value) => setValue('role', value as UserRole)}
              disabled={isUpdating}
            >
              <SelectTrigger className={errors.role ? 'border-destructive' : ''}>
                <SelectValue placeholder="Sélectionnez un rôle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={UserRole.EMPLOYE}>Employé</SelectItem>
                <SelectItem value={UserRole.CAISSIER}>Caissier</SelectItem>
                <SelectItem value={UserRole.ADMIN}>Administrateur</SelectItem>
                <SelectItem value={UserRole.SUPER_ADMIN}>Super Administrateur</SelectItem>
              </SelectContent>
            </Select>
            {errors.role && (
              <p className="text-sm text-destructive">{errors.role.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="cadre">Catégorie</Label>
            <Input
              id="cadre"
              placeholder="Catégorie employé"
              {...register('cadre')}
              disabled={isUpdating}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="active"
              checked={isActive}
              onCheckedChange={(checked) => setValue('active', checked)}
              disabled={isUpdating}
            />
            <Label htmlFor="active">Compte actif</Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isUpdating}>
              Annuler
            </Button>
            <Button type="submit" disabled={isUpdating}>
              {isUpdating ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Mise à jour...
                </>
              ) : (
                'Mettre à jour'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default EditUserModal;