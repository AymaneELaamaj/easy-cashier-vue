// hooks/useBadges.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { badgesAPI } from "@/services/api/badges.api";
import { BadgeResponse } from "@/types/entities";
import { Pageable, Page } from "@/types/api";
import { toast } from "react-hot-toast";

export function useBadges(pageable?: Pageable) {
  const queryClient = useQueryClient();
  
  console.log('🔧 useBadges called with pageable:', pageable);

  const query = useQuery<Page<BadgeResponse>, Error>({
    queryKey: ["badges", pageable ?? { page: 0, size: 10 }],
    queryFn: async () => {
      console.log('🌐 Fetching badges from API...');
      try {
        const result = await badgesAPI.getAllBadges(pageable);
        console.log('✅ Badges fetched successfully:', result);
        return result;
      } catch (error) {
        console.error('❌ Error fetching badges:', error);
        throw error;
      }
    },
    placeholderData: (prev) => prev, // évite les flashs vides et protège contre undefined
    retry: 1,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      console.log('Creating badge...');
      const result = await badgesAPI.createBadge();
      console.log('Badge created:', result);
      return result;
    },
    onSuccess: () => {
      // Invalide toutes les queries badges, peu importe la pagination
      queryClient.invalidateQueries({ 
        queryKey: ["badges"],
        exact: false 
      });
      toast.success("Badge créé avec succès");
    },
    onError: (error: unknown) => {
      console.error('Error creating badge:', error);
      const msg = (error as { message?: string })?.message || "Erreur lors de la création du badge";
      toast.error(msg);
    },
  });

  // Pour update, on mappe sur activate/deactivate selon data.active
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: BadgeResponse }) =>
      data.active ? badgesAPI.activateBadge(id) : badgesAPI.deactivateBadge(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ["badges"],
        exact: false 
      });
      toast.success("Badge modifié avec succès");
    },
    onError: (error: unknown) => {
      const msg = (error as { message?: string })?.message || "Erreur lors de la modification du badge";
      toast.error(msg);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: badgesAPI.deleteBadge,
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ["badges"],
        exact: false 
      });
      toast.success("Badge supprimé avec succès");
    },
    onError: (error: unknown) => {
      const msg = (error as { message?: string })?.message || "Erreur lors de la suppression du badge";
      toast.error(msg);
    },
  });

  const activateMutation = useMutation({
    mutationFn: async (id: number) => {
      console.log('Activating badge:', id);
      const result = await badgesAPI.activateBadge(id);
      console.log('Badge activated:', result);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ["badges"],
        exact: false 
      });
      toast.success("Badge activé avec succès");
    },
    onError: (error: unknown) => {
      console.error('Error activating badge:', error);
      const msg = (error as { message?: string })?.message || "Erreur lors de l'activation du badge";
      toast.error(msg);
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: async (id: number) => {
      console.log('Deactivating badge:', id);
      const result = await badgesAPI.deactivateBadge(id);
      console.log('Badge deactivated:', result);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ["badges"],
        exact: false 
      });
      toast.success("Badge désactivé avec succès");
    },
    onError: (error: unknown) => {
      console.error('Error deactivating badge:', error);
      const msg = (error as { message?: string })?.message || "Erreur lors de la désactivation du badge";
      toast.error(msg);
    },
  });

  const assignMutation = useMutation({
    mutationFn: ({ utilisateurId, badgeId }: { utilisateurId: number; badgeId: number }) =>
      badgesAPI.assignBadge(utilisateurId, badgeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ["badges"],
        exact: false 
      });
      toast.success("Badge assigné avec succès");
    },
    onError: (error: unknown) => {
      const msg = (error as { message?: string })?.message || "Erreur lors de l'assignation du badge";
      toast.error(msg);
    },
  });

  const unassignMutation = useMutation({
    mutationFn: async (badgeId: number) => {
      console.log('Unassigning badge:', badgeId);
      const result = await badgesAPI.unassignBadge(badgeId);
      console.log('Badge unassigned:', result);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ["badges"],
        exact: false 
      });
      toast.success("Badge désassigné avec succès");
    },
    onError: (error: unknown) => {
      console.error('Error unassigning badge:', error);
      const msg = (error as { message?: string })?.message || "Erreur lors de la désassignation du badge";
      toast.error(msg);
    },
  });

  return {
    data: query.data,              // Page<BadgeResponse>
    isLoading: query.isLoading,
    error: query.error,
    createBadge: createMutation.mutateAsync,
    updateBadge: updateMutation.mutateAsync,
    deleteBadge: deleteMutation.mutateAsync,
    activateBadge: activateMutation.mutateAsync,
    deactivateBadge: deactivateMutation.mutateAsync,
    assignBadge: assignMutation.mutateAsync,
    unassignBadge: unassignMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isAssigning: assignMutation.isPending,
    isUnassigning: unassignMutation.isPending,
    refetch: query.refetch,
  };
}
