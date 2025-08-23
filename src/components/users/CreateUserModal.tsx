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
import { RegisterRequest } from '@/types/entities';
import { useAuth } from '@/hooks/useAuth';
import { useCategorieEmployes } from '@/hooks/useCategorieEmployes';

const createUserSchema = z.object({
  nom: z.string().min(1, 'Le nom est requis'),
  prenom: z.string().min(1, 'Le prénom est requis'),
  email: z.string().email('Email invalide').min(1, 'Email requis'),
  password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
  role: z.string().min(1, 'Le rôle est requis'),
  cin: z.string().min(1, 'Le CIN est requis'),
  telephone: z.string().optional(),
  solde: z.number().min(0, 'Le solde doit être positif').optional(),
  isActive: z.boolean().optional(),
  categorieEmployesId: z.number().nullable().optional(),
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
  const { currentUser } = useAuth();
  const { categories } = useCategorieEmployes();

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
      role: 'EMPLOYE',
      solde: 0,
      isActive: true,
      categorieEmployesId: null,
    }
  });

  const selectedRole = watch('role');
  const isActive = watch('isActive');

  // Reset le formulaire quand le modal s'ouvre
  useEffect(() => {
    if (open) {
      reset({
        role: 'EMPLOYE',
        solde: 0,
        isActive: true,
        categorieEmployesId: null,
      });
    }
  }, [open, reset]);

  // Roles disponibles selon le rôle de l'utilisateur connecté
  const availableRoles = () => {
    if (currentUser?.role === 'SUPER_ADMIN') {
      return [
        { value: 'EMPLOYE', label: 'Employé' },
        { value: 'CAISSIER', label: 'Caissier' },
        { value: 'ADMIN', label: 'Administrateur' },
      ];
    } else if (currentUser?.role === 'ADMIN') {
      return [
        { value: 'EMPLOYE', label: 'Employé' },
        { value: 'CAISSIER', label: 'Caissier' },
      ];
    }
    return [];
  };

  const onSubmit = async (data: CreateUserForm) => {
    try {
      // Préparer les données pour l'envoi
      const userData: RegisterRequest = {
        nom: data.nom.trim(),
        prenom: data.prenom.trim(),
        email: data.email.trim(),
        password: data.password,
        role: data.role,
        cin: data.cin.trim(),
        telephone: data.telephone?.trim() || null,
        solde: data.solde || 0,
        isActive: data.isActive !== undefined ? data.isActive : true,
        // Pour CAISSIER et ADMIN, toujours envoyer null pour categorieEmployesId
        categorieEmployesId: selectedRole === 'EMPLOYE' && data.categorieEmployesId 
          ? data.categorieEmployesId 
          : null,
      };
      
      console.log('Données envoyées:', userData);
      
      await createUser(userData);
      
      // Reset le formulaire après succès
      reset({
        role: 'EMPLOYE',
        solde: 0,
        isActive: true,
        categorieEmployesId: null,
      });
      
      // Appeler onSuccess qui devrait rafraîchir la liste
      onSuccess();
      
      // Fermer le modal
      onClose();
    } catch (error) {
      console.error('Erreur lors de la création:', error);
      // Ne pas fermer le modal en cas d'erreur pour que l'utilisateur puisse corriger
    }
  };

  const handleClose = () => {
    reset({
      role: 'EMPLOYE',
      solde: 0,
      isActive: true,
      categorieEmployesId: null,
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Créer un nouvel utilisateur</DialogTitle>
          <DialogDescription>
            Remplissez les informations ci-dessous pour créer un nouveau compte utilisateur.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="prenom">Prénom *</Label>
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
              <Label htmlFor="nom">Nom *</Label>
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
            <Label htmlFor="email">Email *</Label>
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
            <Label htmlFor="password">Mot de passe *</Label>
            <Input
              id="password"
              type="password"
              placeholder="Minimum 6 caractères"
              {...register('password')}
              className={errors.password ? 'border-destructive' : ''}
              disabled={isCreating}
            />
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="cin">CIN *</Label>
            <Input
              id="cin"
              placeholder="CIN"
              {...register('cin')}
              className={errors.cin ? 'border-destructive' : ''}
              disabled={isCreating}
            />
            {errors.cin && (
              <p className="text-sm text-destructive">{errors.cin.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="telephone">Téléphone</Label>
            <Input
              id="telephone"
              placeholder="Numéro de téléphone"
              {...register('telephone')}
              disabled={isCreating}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Rôle *</Label>
            <Select 
              value={selectedRole} 
              onValueChange={(value) => {
                setValue('role', value);
                // Réinitialiser categorieEmployesId si le rôle n'est pas EMPLOYE
                if (value !== 'EMPLOYE') {
                  setValue('categorieEmployesId', null);
                }
              }}
              disabled={isCreating}
            >
              <SelectTrigger className={errors.role ? 'border-destructive' : ''}>
                <SelectValue placeholder="Sélectionnez un rôle" />
              </SelectTrigger>
              <SelectContent>
                {availableRoles().map((role) => (
                  <SelectItem key={role.value} value={role.value}>
                    {role.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.role && (
              <p className="text-sm text-destructive">{errors.role.message}</p>
            )}
          </div>

          {selectedRole === 'EMPLOYE' && (
            <div className="space-y-2">
              <Label htmlFor="categorieEmployesId">Catégorie d'employé</Label>
              <Select 
                onValueChange={(value) => setValue('categorieEmployesId', parseInt(value))}
                disabled={isCreating}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une catégorie (optionnel)" />
                </SelectTrigger>
                <SelectContent>
                  {categories?.content?.map((category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.cadre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="solde">Solde initial</Label>
            <Input
              id="solde"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              defaultValue="0"
              {...register('solde', { valueAsNumber: true })}
              className={errors.solde ? 'border-destructive' : ''}
              disabled={isCreating}
            />
            {errors.solde && (
              <p className="text-sm text-destructive">{errors.solde.message}</p>
            )}
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
            <div className="space-y-0.5">
              <Label htmlFor="isActive">Compte actif</Label>
              <div className="text-[0.8rem] text-muted-foreground">
                L'utilisateur peut se connecter et utiliser l'application
              </div>
            </div>
            <Switch
              id="isActive"
              checked={isActive}
              onCheckedChange={(checked) => setValue('isActive', checked)}
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