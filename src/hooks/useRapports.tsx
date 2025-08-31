import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { rapportsAPI } from '@/services/api/rapports.api';
import { RapportDTO } from '@/types/entities';
import { toast } from 'sonner';

// Hook pour lister tous les rapports
export const useRapports = () => {
  return useQuery({
    queryKey: ['rapports'],
    queryFn: rapportsAPI.getAllRapports,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook pour générer un rapport du mois courant
export const useGenererHistorique = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: rapportsAPI.genererHistorique,
    onSuccess: (data: RapportDTO) => {
      toast.success('Rapport d\'historique généré avec succès');
      // IMPORTANT: Invalider ET refetch immédiatement la liste des rapports
      queryClient.invalidateQueries({ queryKey: ['rapports'] });
      queryClient.refetchQueries({ queryKey: ['rapports'] });
    },
    onError: (error: any) => {
      console.error('Erreur génération rapport:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de la génération du rapport');
    },
  });
};

// Hook pour générer un rapport pour un mois spécifique
export const useGenererHistoriqueMensuel = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ annee, mois }: { annee: number; mois: number }) => 
      rapportsAPI.genererHistoriqueMensuel(annee, mois),
    onSuccess: (data: RapportDTO) => {
      toast.success(`Rapport généré pour ${data.dateDebut} - ${data.dateFin}`);
      // IMPORTANT: Invalider ET refetch immédiatement la liste des rapports
      queryClient.invalidateQueries({ queryKey: ['rapports'] });
      queryClient.refetchQueries({ queryKey: ['rapports'] });
    },
    onError: (error: any) => {
      console.error('Erreur génération rapport mensuel:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de la génération du rapport');
    },
  });
};

// Hook pour obtenir l'historique détaillé d'un rapport
export const useRapportHistorique = (id: number | null, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['rapport-historique', id],
    queryFn: () => rapportsAPI.getRapportHistorique(id!),
    enabled: enabled && !!id,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Hook pour exporter un rapport en JSON
export const useExportRapportJSON = () => {
  return useMutation({
    mutationFn: (id: number) => rapportsAPI.exportRapportJSON(id),
    onSuccess: (data) => {
      toast.success('Export JSON réussi');
      // Optionnel: télécharger automatiquement le JSON
      const blob = new Blob([JSON.stringify(data, null, 2)], { 
        type: 'application/json' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rapport-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de l\'export JSON');
    },
  });
};

// Hook pour télécharger un rapport PDF
export const useDownloadRapportPDF = () => {
  const [isDownloading, setIsDownloading] = useState(false);

  const downloadPDF = async (id: number, fileName?: string) => {
    setIsDownloading(true);
    try {
      const blob = await rapportsAPI.downloadRapportPDF(id);
      
      // Créer un lien de téléchargement
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName || `rapport-${id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      
      toast.success('Rapport PDF téléchargé avec succès');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors du téléchargement PDF');
    } finally {
      setIsDownloading(false);
    }
  };

  return {
    downloadPDF,
    isDownloading,
  };
};

// Hook pour supprimer un rapport
export const useDeleteRapport = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => rapportsAPI.deleteRapport(id),
    onSuccess: () => {
      toast.success('Rapport supprimé avec succès');
      queryClient.invalidateQueries({ queryKey: ['rapports'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la suppression');
    },
  });
};

// Hook composé pour gérer l'état d'un rapport sélectionné
export const useRapportManager = () => {
  const [selectedRapportId, setSelectedRapportId] = useState<number | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const { data: rapports, isLoading: loadingRapports, refetch } = useRapports();
  
  const { 
    data: rapportDetails, 
    isLoading: loadingDetails 
  } = useRapportHistorique(selectedRapportId, showDetails);

  const genererHistorique = useGenererHistorique();
  const genererHistoriqueMensuel = useGenererHistoriqueMensuel();
  const exportJSON = useExportRapportJSON();
  const { downloadPDF, isDownloading } = useDownloadRapportPDF();
  const deleteRapport = useDeleteRapport();

  const openDetails = (rapportId: number) => {
    setSelectedRapportId(rapportId);
    setShowDetails(true);
  };

  const closeDetails = () => {
    setSelectedRapportId(null);
    setShowDetails(false);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce rapport ?')) {
      await deleteRapport.mutateAsync(id);
      if (selectedRapportId === id) {
        closeDetails();
      }
    }
  };

  const handleDownloadPDF = (id: number, titre?: string) => {
    const fileName = titre ? `${titre.replace(/[^a-zA-Z0-9]/g, '_')}.pdf` : undefined;
    downloadPDF(id, fileName);
  };

  return {
    // Data
    rapports,
    rapportDetails,
    selectedRapportId,
    showDetails,
    
    // Loading states
    loadingRapports,
    loadingDetails,
    isDownloading,
    
    // Actions
    openDetails,
    closeDetails,
    refetch,
    
    // Mutations
    genererHistorique: genererHistorique.mutate,
    genererHistoriqueMensuel: genererHistoriqueMensuel.mutate,
    exportJSON: exportJSON.mutate,
    handleDownloadPDF,
    handleDelete,
    
    // Loading states for mutations
    isGenerating: genererHistorique.isPending || genererHistoriqueMensuel.isPending,
    isExporting: exportJSON.isPending,
    isDeleting: deleteRapport.isPending,
  };
};