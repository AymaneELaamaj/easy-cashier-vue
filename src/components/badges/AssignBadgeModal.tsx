import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { BadgeResponse, UtilisateurResponse } from '@/types/entities';
import { useEmployeesWithoutBadge } from '@/hooks/useUsers';
import { Search, User, UserCheck, CreditCard } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface AssignBadgeModalProps {
  badge: BadgeResponse | null;
  isOpen: boolean;
  onClose: () => void;
  onAssign: (utilisateurId: number, badgeId: number) => Promise<void>;
  isAssigning?: boolean;
}

export function AssignBadgeModal({ 
  badge, 
  isOpen, 
  onClose, 
  onAssign, 
  isAssigning = false 
}: AssignBadgeModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<UtilisateurResponse | null>(null);
  
  const { 
    data: employees, 
    isLoading: isLoadingEmployees, 
    error: employeesError 
  } = useEmployeesWithoutBadge();

  // Reset selection when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedEmployee(null);
      setSearchTerm('');
    }
  }, [isOpen]);

  // Filter employees based on search term
  const filteredEmployees = employees?.filter(emp => {
    const searchLower = searchTerm.toLowerCase();
    return (
      emp.nom.toLowerCase().includes(searchLower) ||
      emp.prenom.toLowerCase().includes(searchLower) ||
      emp.email.toLowerCase().includes(searchLower) ||
      emp.cin.toLowerCase().includes(searchLower)
    );
  }) || [];

  const handleAssign = async () => {
    if (!badge || !selectedEmployee) {
      toast.error('Veuillez sélectionner un employé');
      return;
    }

    try {
      await onAssign(selectedEmployee.id!, badge.id!);
      onClose();
    } catch (error) {
      console.error('Error assigning badge:', error);
      // Le toast d'erreur sera affiché par le hook useBadges
    }
  };

  if (!badge) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <CreditCard className="h-5 w-5 text-blue-600" />
            <span>Assigner le badge</span>
          </DialogTitle>
          <DialogDescription>
            Sélectionnez un employé pour lui assigner ce badge. Seuls les employés sans badge sont affichés.
          </DialogDescription>
        </DialogHeader>
        
        {/* Badge info */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-blue-900">Badge à assigner :</p>
              <p className="font-mono text-lg text-blue-800">{badge.codeBadge}</p>
            </div>
            <Badge className="bg-blue-100 text-blue-800 border-blue-300">
              ID: #{badge.id}
            </Badge>
          </div>
        </div>

        {/* Search input */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un employé (nom, prénom, email, CIN)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Employees list */}
        <div className="max-h-64 overflow-y-auto space-y-2">
          {isLoadingEmployees ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner />
              <span className="ml-2">Chargement des employés...</span>
            </div>
          ) : employeesError ? (
            <div className="text-red-600 text-center py-8">
              ❌ Erreur lors du chargement des employés
            </div>
          ) : filteredEmployees.length === 0 ? (
            <div className="text-center py-8 space-y-2">
              <User className="h-12 w-12 mx-auto text-muted-foreground" />
              <p className="text-muted-foreground">
                {searchTerm ? 
                  `Aucun employé trouvé pour "${searchTerm}"` : 
                  'Aucun employé sans badge disponible'
                }
              </p>
              {searchTerm && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setSearchTerm('')}
                >
                  Effacer la recherche
                </Button>
              )}
            </div>
          ) : (
            filteredEmployees.map((employee) => (
              <Card 
                key={employee.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedEmployee?.id === employee.id 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'hover:border-blue-300'
                }`}
                onClick={() => setSelectedEmployee(employee)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        selectedEmployee?.id === employee.id 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {selectedEmployee?.id === employee.id ? (
                          <UserCheck className="h-5 w-5" />
                        ) : (
                          <User className="h-5 w-5" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">
                          {employee.prenom} {employee.nom}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {employee.email}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="text-xs">
                        CIN: {employee.cin}
                      </Badge>
                      <p className="text-sm text-muted-foreground mt-1">
                        ID: #{employee.id}
                      </p>
                    </div>
                  </div>
                  
                  {/* Employee details */}
                  <div className="mt-2 pt-2 border-t border-gray-100">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Rôle:</span>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        {employee.role}
                      </Badge>
                    </div>
                    {employee.telephone && (
                      <div className="flex justify-between text-sm mt-1">
                        <span className="text-muted-foreground">Téléphone:</span>
                        <span>{employee.telephone}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={isAssigning}
          >
            Annuler
          </Button>
          <Button 
            onClick={handleAssign}
            disabled={!selectedEmployee || isAssigning}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isAssigning ? (
              <>
                <LoadingSpinner className="h-4 w-4 mr-2" />
                Assignation...
              </>
            ) : (
              <>
                <UserCheck className="h-4 w-4 mr-2" />
                Assigner le badge
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
