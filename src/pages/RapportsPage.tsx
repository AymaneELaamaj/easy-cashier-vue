// src/pages/RapportsPage.tsx
import React, { useState } from 'react';
import {
  Calendar,
  FileText,
  Download,
  Trash2,
  Plus,
  Eye,
  BarChart3,
  FileJson,
  RefreshCw,
  User2,
  Loader2,
  Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useRapportManager, useRapportEmploye, useDownloadRapportEmployePDF } from '@/hooks/useRapports';
import { useUserSearch } from '@/hooks/useUsers';
import { StatutRapport, TypeRapport } from '@/types/api';

const RapportsPage: React.FC = () => {
  const {
    rapports,
    rapportDetails,
    selectedRapportId,
    showDetails,
    loadingRapports,
    loadingDetails,
    isDownloading,
    openDetails,
    closeDetails,
    refetch,
    genererHistorique,
    genererHistoriqueMensuel,
    exportJSON,
    handleDownloadPDF,
    handleDelete,
    isGenerating,
    isExporting,
    isDeleting,
  } = useRapportManager();

  // Filtres liste
  const [filterStatut, setFilterStatut] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Générateur mensuel
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);

  // -------------------------------------------------------------------
  // 🔹 Rapport par employé (recherche par nom/prénom)
  // -------------------------------------------------------------------
  const { term: empQuery, setTerm: setEmpQuery, results: empResults, loading: empLoading } = useUserSearch();
  const [selectedEmpId, setSelectedEmpId] = useState<number | null>(null);
  const [selectedEmpLabel, setSelectedEmpLabel] = useState<string>('');
  const [showEmpDropdown, setShowEmpDropdown] = useState(false);

  const [empDebut, setEmpDebut] = useState<string>(''); // yyyy-MM-dd
  const [empFin, setEmpFin] = useState<string>('');     // yyyy-MM-dd

  const rapportEmploye = useRapportEmploye();
  const { download: downloadEmpPdf, isDownloadingEmp } = useDownloadRapportEmployePDF();
  const [empDialogOpen, setEmpDialogOpen] = useState(false);
  const [empData, setEmpData] = useState<any>(null);

  const handlePickEmployee = (u: any) => {
    setSelectedEmpId(u.id);
    setSelectedEmpLabel(`${u.nom ?? ''} ${u.prenom ?? ''}`.trim() || u.email || u.codeBadge || `#${u.id}`);
    setEmpQuery(`${u.nom ?? ''} ${u.prenom ?? ''}`.trim());
    setShowEmpDropdown(false);
  };

  const handleVoirRapportEmploye = async () => {
    if (!selectedEmpId) return;
    const data = await rapportEmploye.mutateAsync({
      employeId: Number(selectedEmpId),
      debut: empDebut || undefined,
      fin: empFin || undefined,
    });
    setEmpData(data);
    setEmpDialogOpen(true);
  };

  const handleExportPdfEmploye = async () => {
    if (!selectedEmpId) return;
    await downloadEmpPdf({
      employeId: Number(selectedEmpId),
      debut: empDebut || undefined,
      fin: empFin || undefined,
      fileName: `rapport-employe-${selectedEmpLabel || selectedEmpId}${empDebut ? '-' + empDebut : ''}${empFin ? '-' + empFin : ''}.pdf`,
    });
  };

  // -------------------------------------------------------------------

  // Filtrage des rapports globaux
  const filteredRapports =
    rapports?.filter((rapport) => {
      const matchesStatut = filterStatut === 'all' || rapport.statut === filterStatut;
      const matchesType = filterType === 'all' || rapport.typeRapport === filterType;
      const matchesSearch =
        rapport.titre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rapport.numeroRapport?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesStatut && matchesType && matchesSearch;
    }) || [];

  const getStatusColor = (statut: StatutRapport) => {
    switch (statut) {
      case 'TERMINE':
        return 'bg-green-100 text-green-800';
      case 'EN_COURS':
        return 'bg-yellow-100 text-yellow-800';
      case 'ERREUR':
        return 'bg-red-100 text-red-800';
      case 'ENVOYE':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: TypeRapport) => {
    switch (type) {
      case 'MENSUEL':
        return <Calendar className="h-4 w-4" />;
      case 'HEBDOMADAIRE':
        return <BarChart3 className="h-4 w-4" />;
      case 'ANNUEL':
        return <FileText className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const handleGenerateMensuel = () => {
    genererHistoriqueMensuel({ annee: selectedYear, mois: selectedMonth });
    setShowGenerateDialog(false);
  };

  if (loadingRapports) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Rapports d'Historique</h1>
          <p className="text-muted-foreground">Gérez et consultez vos rapports de transactions</p>
        </div>

        <div className="flex gap-2">
          <Button onClick={() => refetch()} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>

          <Button onClick={() => genererHistorique()} disabled={isGenerating} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            {isGenerating ? 'Génération...' : 'Générer (Mois actuel)'}
          </Button>
          <Button onClick={() => setShowGenerateDialog(true)} variant="outline" size="sm">
            <Calendar className="h-4 w-4 mr-2" />
            Mois spécifique
          </Button>
        </div>
      </div>

      {/* 🔹 Bloc Rapport par Employé (recherche par nom/prénom) */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <User2 className="h-5 w-5" />
            Rapport par employé
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid gap-3 md:grid-cols-4">
            {/* Champ recherche employé */}
            <div className="relative">
              <label className="text-sm font-medium mb-2 block">Nom ou prénom</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="Saisir au moins 2 lettres..."
                  value={empQuery}
                  onChange={(e) => {
                    setEmpQuery(e.target.value);
                    setShowEmpDropdown(true);
                    setSelectedEmpId(null);
                    setSelectedEmpLabel('');
                  }}
                  onFocus={() => setShowEmpDropdown(true)}
                />
                {empLoading && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>

              {/* Dropdown résultats */}
              {showEmpDropdown && empQuery.trim().length >= 2 && (
                <div
                  className="absolute z-10 w-full mt-1 border bg-white rounded-md shadow-sm max-h-64 overflow-auto"
                  onMouseDown={(e) => e.preventDefault()} // évite blur
                >
                  {empResults.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-muted-foreground">Aucun résultat</div>
                  ) : (
                    empResults.map((u: any) => (
                      <button
                        type="button"
                        key={u.id}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                        onClick={() => handlePickEmployee(u)}
                      >
                        <div className="font-medium">
                          {(u.nom ?? '') + ' ' + (u.prenom ?? '')} {u.isActive === false && <span className="text-red-500">(inactif)</span>}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          id: {u.id} • {u.email ?? '-'} • badge: {u.codeBadge ?? '-'}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
              {selectedEmpId && (
                <div className="mt-1 text-xs text-green-700">
                  Employé sélectionné : <strong>{selectedEmpLabel}</strong> (id : {selectedEmpId})
                </div>
              )}
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Début (optionnel)</label>
              <Input type="date" value={empDebut} onChange={(e) => setEmpDebut(e.target.value)} />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Fin (optionnel)</label>
              <Input type="date" value={empFin} onChange={(e) => setEmpFin(e.target.value)} />
            </div>

            <div className="flex items-end gap-2">
              <Button
                className="flex-1"
                onClick={handleVoirRapportEmploye}
                disabled={!selectedEmpId || rapportEmploye.isPending}
              >
                {rapportEmploye.isPending ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Chargement...
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 mr-2" />
                    Voir
                  </>
                )}
              </Button>

              <Button
                className="flex-1"
                variant="outline"
                onClick={handleExportPdfEmploye}
                disabled={!selectedEmpId || isDownloadingEmp}
              >
                {isDownloadingEmp ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Export...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    PDF
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filtres liste rapports globaux */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Rechercher par titre ou numéro..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>

            <Select value={filterStatut} onValueChange={setFilterStatut}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="TERMINE">Terminé</SelectItem>
                <SelectItem value="EN_COURS">En cours</SelectItem>
                <SelectItem value="ERREUR">Erreur</SelectItem>
                <SelectItem value="ENVOYE">Envoyé</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                <SelectItem value="MENSUEL">Mensuel</SelectItem>
                <SelectItem value="HEBDOMADAIRE">Hebdomadaire</SelectItem>
                <SelectItem value="ANNUEL">Annuel</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Liste des rapports globaux */}
      {filteredRapports.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Aucun rapport trouvé</h3>
            <p className="text-muted-foreground mb-4">
              {rapports?.length === 0
                ? 'Commencez par générer votre premier rapport'
                : 'Aucun rapport ne correspond aux critères de recherche'}
            </p>
            {rapports?.length === 0 && (
              <Button onClick={() => genererHistorique()} disabled={isGenerating}>
                <Plus className="h-4 w-4 mr-2" />
                Générer un rapport
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredRapports.map((rapport) => (
            <Card key={rapport.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    {getTypeIcon(rapport.typeRapport)}
                    <CardTitle className="text-lg">{rapport.titre}</CardTitle>
                  </div>
                  <Badge className={getStatusColor(rapport.statut)}>
                    {rapport.statut?.replace('_', ' ')}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{rapport.numeroRapport}</p>
              </CardHeader>

              <CardContent>
                <div className="space-y-3">
                  <div className="text-sm">
                    <p>
                      <strong>Période:</strong> {rapport.dateDebut} au {rapport.dateFin}
                    </p>
                    <p>
                      <strong>Créé le:</strong>{' '}
                      {rapport.dateCreation ? new Date(rapport.dateCreation).toLocaleDateString() : '-'}
                    </p>
                  </div>

                  {rapport.nombreTransactions && (
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-muted-foreground">Transactions</p>
                        <p className="font-semibold">{rapport.nombreTransactions}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Montant total</p>
                        <p className="font-semibold">{rapport.montantTotalPeriode?.toFixed(2)} MAD</p>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button onClick={() => openDetails(rapport.id)} size="sm" variant="outline" className="flex-1">
                      <Eye className="h-4 w-4 mr-1" />
                      Voir
                    </Button>

                    <Button
                      onClick={() => exportJSON(rapport.id)}
                      disabled={isExporting}
                      size="sm"
                      variant="outline"
                      title="Exporter JSON"
                    >
                      <FileJson className="h-4 w-4" />
                    </Button>

                    <Button
                      onClick={() => handleDownloadPDF(rapport.id, rapport.titre)}
                      disabled={isDownloading}
                      size="sm"
                      variant="outline"
                      title="Générer & Télécharger PDF"
                    >
                      {isDownloading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                    </Button>

                    <Button
                      onClick={() => handleDelete(rapport.id)}
                      disabled={isDeleting}
                      size="sm"
                      variant="outline"
                      className="text-red-600 hover:text-red-700"
                      title="Supprimer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex gap-2 pt-2 border-t">
                    <Button
                      onClick={() => exportJSON(rapport.id)}
                      disabled={isExporting}
                      size="sm"
                      variant="secondary"
                      className="flex-1"
                    >
                      <FileJson className="h-4 w-4 mr-2" />
                      Export JSON
                    </Button>

                    <Button
                      onClick={() => handleDownloadPDF(rapport.id, rapport.titre)}
                      disabled={isDownloading}
                      size="sm"
                      variant="secondary"
                      className="flex-1"
                    >
                      {isDownloading ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Génération...
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4 mr-2" />
                          Export PDF
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog : Générer mensuel spécifique */}
      <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Générer un rapport mensuel</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Année</label>
              <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 5 }, (_, i) => {
                    const year = new Date().getFullYear() - i;
                    return (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Mois</label>
              <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => {
                    const month = i + 1;
                    const monthName = new Date(2023, i, 1).toLocaleDateString('fr-FR', { month: 'long' });
                    return (
                      <SelectItem key={month} value={month.toString()}>
                        {monthName} ({month})
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowGenerateDialog(false)}>
                Annuler
              </Button>
              <Button onClick={handleGenerateMensuel} disabled={isGenerating}>
                {isGenerating ? 'Génération...' : 'Générer'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog : Détails rapport global */}
      <Dialog open={showDetails} onOpenChange={closeDetails}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Détails du rapport</DialogTitle>
          </DialogHeader>

          {loadingDetails ? (
            <div className="space-y-4">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-48 w-full" />
            </div>
          ) : rapportDetails ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2">Informations générales</h3>
                  <div className="space-y-1 text-sm">
                    <p>
                      <strong>Titre:</strong> {rapportDetails.rapport?.titre}
                    </p>
                    <p>
                      <strong>Numéro:</strong> {rapportDetails.rapport?.numeroRapport}
                    </p>
                    <p>
                      <strong>Type:</strong> {rapportDetails.rapport?.typeRapport}
                    </p>
                    <p>
                      <strong>Statut:</strong> {rapportDetails.rapport?.statut}
                    </p>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Statistiques</h3>
                  <div className="space-y-1 text-sm">
                    <p>
                      <strong>Transactions:</strong> {rapportDetails.nombreTransactions}
                    </p>
                    <p>
                      <strong>Montant total:</strong>{' '}
                      {rapportDetails.rapport?.montantTotalPeriode?.toFixed(2)} MAD
                    </p>
                    <p>
                      <strong>Part salariale:</strong>{' '}
                      {rapportDetails.rapport?.totalPartSalariale?.toFixed(2)} MAD
                    </p>
                    <p>
                      <strong>Part patronale:</strong>{' '}
                      {rapportDetails.rapport?.totalPartPatronale?.toFixed(2)} MAD
                    </p>
                  </div>
                </div>
              </div>

              {rapportDetails.transactions && rapportDetails.transactions.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">
                    Transactions ({rapportDetails.transactions.length})
                  </h3>
                  <div className="max-h-96 overflow-y-auto border rounded-lg">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-3 py-2 text-left">N° Ticket</th>
                          <th className="px-3 py-2 text-left">Date</th>
                          <th className="px-3 py-2 text-left">Utilisateur</th>
                          <th className="px-3 py-2 text-right">Montant</th>
                          <th className="px-3 py-2 text-left">Type Paiement</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rapportDetails.transactions.map((t: any, idx: number) => (
                          <tr key={idx} className="border-t">
                            <td className="px-3 py-2">{t.numeroTicket}</td>
                            <td className="px-3 py-2">
                              {t.date ? new Date(t.date).toLocaleDateString() : '-'}
                            </td>
                            <td className="px-3 py-2">
                              {t.utilisateur?.nom} {t.utilisateur?.prenom}
                            </td>
                            <td className="px-3 py-2 text-right">
                              {t.montantTotal?.toFixed(2)} MAD
                            </td>
                            <td className="px-3 py-2">{t.typePaiement}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p>Aucun détail disponible</p>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog : Rapport Employé */}
      <Dialog open={empDialogOpen} onOpenChange={setEmpDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Rapport employé {selectedEmpLabel || selectedEmpId}</DialogTitle>
          </DialogHeader>

          {!empData ? (
            <Skeleton className="h-48 w-full" />
          ) : (
            <div className="space-y-6">
              {/* Bandeau période */}
              <div className="text-sm p-3 rounded-md bg-gray-50 border">
                <div>
                  <strong>Période:</strong> {empData?.periode?.debut || empDebut || '—'} → {empData?.periode?.fin || empFin || '—'}
                </div>
                {empData?.utilisateur && (
                  <div>
                    <strong>Employé:</strong> {empData.utilisateur.nom} {empData.utilisateur.prenom} (ID: {selectedEmpId})
                  </div>
                )}
                {empData?.totaux && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
                    <div>
                      <span className="text-muted-foreground block">Transactions</span>
                      <span className="font-semibold">{empData.totaux.transactionsCount}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Montant total</span>
                      <span className="font-semibold">{Number(empData.totaux.montantTotal || 0).toFixed(2)} MAD</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Part salariale</span>
                      <span className="font-semibold">{Number(empData.totaux.partSalariale || 0).toFixed(2)} MAD</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Part patronale</span>
                      <span className="font-semibold">{Number(empData.totaux.partPatronale || 0).toFixed(2)} MAD</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Tableau des transactions */}
              <div>
                <h3 className="font-semibold mb-3">Transactions ({empData?.transactions?.length || 0})</h3>
                <div className="max-h-96 overflow-y-auto border rounded-lg">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left">N° Ticket</th>
                        <th className="px-3 py-2 text-left">Date</th>
                        <th className="px-3 py-2 text-right">Montant</th>
                        <th className="px-3 py-2 text-left">Type Paiement</th>
                        <th className="px-3 py-2 text-left">Articles</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(empData?.transactions || []).map((t: any, i: number) => (
                        <tr key={i} className="border-t">
                          <td className="px-3 py-2">{t.numeroTicket}</td>
                          <td className="px-3 py-2">
                            {t.date ? new Date(t.date).toLocaleDateString() : '-'} {t.heureTransaction || ''}
                          </td>
                          <td className="px-3 py-2 text-right">{Number(t.montantTotal || 0).toFixed(2)} MAD</td>
                          <td className="px-3 py-2">{t.typePaiement}</td>
                          <td className="px-3 py-2">{(t.articles || []).map((a: any) => a.nom).join(', ')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RapportsPage;
