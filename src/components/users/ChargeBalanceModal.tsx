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
import { Wallet } from 'lucide-react';

const chargeBalanceSchema = z.object({
  amount: z.number({ 
    required_error: 'Le montant est requis',
    invalid_type_error: 'Le montant doit être un nombre'
  }).min(0.01, 'Le montant doit être supérieur à 0'),
});

type ChargeBalanceForm = z.infer<typeof chargeBalanceSchema>;

interface ChargeBalanceModalProps {
  open: boolean;
  onClose: () => void;
  user: UtilisateurDTO;
  onSuccess: () => void;
  chargeBalance: (userId: number, amount: number) => Promise<void>;
  isCharging: boolean;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('fr-FR', { 
    style: 'currency', 
    currency: 'EUR' 
  }).format(amount);
};

export function ChargeBalanceModal({ 
  open, 
  onClose, 
  user, 
  onSuccess, 
  chargeBalance, 
  isCharging 
}: ChargeBalanceModalProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch
  } = useForm<ChargeBalanceForm>({
    resolver: zodResolver(chargeBalanceSchema),
  });

  const amount = watch('amount');

  const onSubmit = async (data: ChargeBalanceForm) => {
    try {
      await chargeBalance(user.id, data.amount);
      reset();
      onSuccess();
    } catch (error) {
      console.error('Erreur lors du chargement du solde:', error);
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
            <Wallet className="h-5 w-5" />
            Charger le solde
          </DialogTitle>
          <DialogDescription>
            Ajoutez des fonds au compte de <strong>{user.prenom} {user.nom}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="bg-muted p-4 rounded-lg mb-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Solde actuel :</span>
              <span className={`font-medium ${user.solde >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(user.solde || 0)}
              </span>
            </div>
            {amount && !isNaN(amount) && (
              <>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm text-muted-foreground">Montant à ajouter :</span>
                  <span className="font-medium text-blue-600">
                    +{formatCurrency(amount)}
                  </span>
                </div>
                <div className="border-t pt-2 mt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Nouveau solde :</span>
                    <span className="font-bold text-green-600">
                      {formatCurrency((user.solde || 0) + amount)}
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Montant à ajouter (€)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                {...register('amount', { valueAsNumber: true })}
                className={errors.amount ? 'border-destructive' : ''}
                disabled={isCharging}
              />
              {errors.amount && (
                <p className="text-sm text-destructive">{errors.amount.message}</p>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose} disabled={isCharging}>
                Annuler
              </Button>
              <Button type="submit" disabled={isCharging}>
                {isCharging ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Chargement...
                  </>
                ) : (
                  'Charger le solde'
                )}
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ChargeBalanceModal;