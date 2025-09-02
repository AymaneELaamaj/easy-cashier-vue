import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useRemboursements } from "@/hooks/useRemboursements";
import useTransactionsRemboursementNull from "@/hooks/useTransactionsRemboursementNull";
import { useAuth } from "@/hooks/useAuth";
import { TransactionDTO } from "@/types/entities";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Search, FileText, Calendar, CreditCard, DollarSign } from "lucide-react";

interface CreateRemboursementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateRemboursementModal({ open, onOpenChange }: CreateRemboursementModalProps) {
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionDTO | null>(null);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");

  const { currentUser } = useAuth();
  const isEmploye = currentUser?.role === 'EMPLOYE';

  // N'appeler l'API que si le modal est ouvert ET si l'utilisateur est employé
  const { data: transactionsDisponibles, isLoading: isLoadingTransactions } = useTransactionsRemboursementNull(
    open && isEmploye
  );
  const { createDemande, isCreatingDemande } = useRemboursements();

  const filteredTransactions = transactionsDisponibles?.filter(transaction =>
    transaction.numeroTicket.toLowerCase().includes(search.toLowerCase()) ||
    transaction.date.includes(search) ||
    transaction.montantTotal.toString().includes(search)
  ) || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTransaction) return;

    try {
      await createDemande({
        transactionId: selectedTransaction.id!,
        message: message.trim()
      });
      
      // Reset form
      setSelectedTransaction(null);
      setMessage("");
      setSearch("");
      onOpenChange(false);
    } catch (error) {
      console.error('Erreur lors de la création de la demande:', error);
    }
  };

  const handleReset = () => {
    setSelectedTransaction(null);
    setMessage("");
    setSearch("");
  };

  // Si l'utilisateur n'est pas employé, ne pas afficher le modal
  if (!isEmploye) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Nouvelle Demande de Remboursement
          </DialogTitle>
          <DialogDescription>
            Sélectionnez une transaction à rembourser et fournissez un motif.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col gap-4 overflow-hidden">
          {!selectedTransaction ? (
            // Étape 1: Sélection de la transaction
            <div className="flex-1 flex flex-col gap-4 overflow-hidden">
              <div>
                <Label htmlFor="search">Rechercher une transaction</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Rechercher par numéro de ticket, date ou montant..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-auto">
                {isLoadingTransactions ? (
                  <div className="flex justify-center py-8">
                    <LoadingSpinner />
                  </div>
                ) : filteredTransactions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {transactionsDisponibles?.length === 0 
                      ? "Aucune transaction disponible pour remboursement"
                      : "Aucune transaction trouvée avec ces critères"}
                  </div>
                ) : (
                  <div className="grid gap-2">
                    {filteredTransactions.map((transaction) => (
                      <Card
                        key={transaction.id}
                        className="cursor-pointer hover:bg-accent transition-colors"
                        onClick={() => setSelectedTransaction(transaction)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-2">
                                <CreditCard className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">{transaction.numeroTicket}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">
                                  {format(new Date(transaction.date), 'dd/MM/yyyy HH:mm', { locale: fr })}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-4 w-4 text-success" />
                              <span className="font-semibold text-success">
                                {transaction.montantTotal.toLocaleString('fr-FR', { 
                                  style: 'currency', 
                                  currency: 'MAD' 
                                })}
                              </span>
                            </div>
                          </div>
                          {transaction.articles && transaction.articles.length > 0 && (
                            <div className="mt-2 flex gap-1 flex-wrap">
                              {transaction.articles.slice(0, 3).map((article, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {article.nom}
                                </Badge>
                              ))}
                              {transaction.articles.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{transaction.articles.length - 3} autres
                                </Badge>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Annuler
                </Button>
              </div>
            </div>
          ) : (
            // Étape 2: Saisie du motif
            <div className="flex-1 flex flex-col gap-4">
              <div>
                <Label>Transaction sélectionnée</Label>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{selectedTransaction.numeroTicket}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(selectedTransaction.date), 'dd/MM/yyyy HH:mm', { locale: fr })}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-success" />
                        <span className="font-semibold text-success">
                          {selectedTransaction.montantTotal.toLocaleString('fr-FR', { 
                            style: 'currency', 
                            currency: 'MAD' 
                          })}
                        </span>
                      </div>
                    </div>
                    {selectedTransaction.articles && selectedTransaction.articles.length > 0 && (
                      <div className="flex gap-1 flex-wrap">
                        {selectedTransaction.articles.map((article, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {article.nom}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="flex-1">
                <Label htmlFor="message">Motif du remboursement *</Label>
                <Textarea
                  id="message"
                  placeholder="Expliquez la raison de votre demande de remboursement..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="min-h-[120px]"
                  required
                />
              </div>

              <div className="flex justify-between">
                <Button type="button" variant="outline" onClick={handleReset}>
                  Changer de transaction
                </Button>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                    Annuler
                  </Button>
                  <Button type="submit" disabled={!message.trim() || isCreatingDemande}>
                    {isCreatingDemande ? "Création..." : "Créer la demande"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
