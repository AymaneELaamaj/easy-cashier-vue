import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { RegisterRequest } from '@/types/entities';
import { UserRole } from '@/types/api';

const createUserSchema = z.object({
  nom: z.string().min(1, 'Le nom est requis'),
  prenom: z.string().min(1, 'Le prénom est requis'),
  email: z.string().email('Email invalide').min(1, 'Email requis'),
  password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
  role: z.enum([UserRole.EMPLOYE, UserRole.CAISSIER, UserRole.ADMIN, UserRole.SUPER_ADMIN]),
  cadre: z.string().optional(),
});

type CreateUserForm = z.infer<typeof createUserSchema>;

interface CreateUserModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  createUser: (data: RegisterRequest) => Promise<void>;
  isCreating: boolean;
}

export function CreateUserModal({ 
  open, 
  onClose, 
  onSuccess, 
  createUser, 
  isCreating 
}: CreateUserModalProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset
  } = useForm<CreateUserForm>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      role: UserRole.EMPLOYE
    }
  });

  const selectedRole = watch('role');

  const onSubmit = async (data: CreateUserForm) => {
    try {
      const userData: RegisterRequest = {
        nom: data.nom,
        prenom: data.prenom,
        email: data.email,
        password: data.password,
        role: data.role,
        cadre: data.cadre || undefined,
      };
      
      await createUser(userData);
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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Créer un nouvel utilisateur</DialogTitle>
          <DialogDescription>
            Remplissez les informations ci-dessous pour créer un nouveau compte utilisateur.
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
                disabled={isCreating}
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
                disabled={isCreating}
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
              disabled={isCreating}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Mot de passe</Label>
            <Input
              id="password"
              type="password"
              placeholder="Mot de passe"
              {...register('password')}
              className={errors.password ? 'border-destructive' : ''}
              disabled={isCreating}
            />
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Rôle</Label>
            <Select 
              value={selectedRole} 
              onValueChange={(value) => setValue('role', value as UserRole)}
              disabled={isCreating}
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
            <Label htmlFor="cadre">Catégorie (optionnel)</Label>
            <Input
              id="cadre"
              placeholder="Catégorie employé"
              {...register('cadre')}
              disabled={isCreating}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isCreating}>
              Annuler
            </Button>
            <Button type="submit" disabled={isCreating}>
              {isCreating ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Création...
                </>
              ) : (
                'Créer l\'utilisateur'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default CreateUserModal;