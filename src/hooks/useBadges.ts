// hooks/useBadges.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { badgesAPI } from "@/services/api/badges.api";
import { BadgeDTO } from "@/types/entities";
import { Pageable, Page } from "@/types/api";
import { toast } from "react-hot-toast";

export function useBadges(pageable?: Pageable) {
  const queryClient = useQueryClient();

  const query = useQuery<Page<BadgeDTO>, Error>({
    queryKey: ["badges", pageable ?? { page: 0, size: 10 }],
    queryFn: () => badgesAPI.getAllBadges(pageable),
    placeholderData: (prev) => prev, // évite les flashs vides et protège contre undefined
    retry: 1,
  });

  const createMutation = useMutation({
    mutationFn: badgesAPI.createBadge,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["badges"] });
      toast.success("Badge créé avec succès");
    },
    onError: (error: any) => toast.error(error?.message || "Erreur lors de la création du badge"),
  });

  // Pour update, on mappe sur activate/deactivate selon data.active
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: BadgeDTO }) =>
      data.active ? badgesAPI.activateBadge(id) : badgesAPI.deactivateBadge(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["badges"] });
      toast.success("Badge modifié avec succès");
    },
    onError: (error: any) => toast.error(error?.message || "Erreur lors de la modification du badge"),
  });

  const deleteMutation = useMutation({
    mutationFn: badgesAPI.deleteBadge,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["badges"] });
      toast.success("Badge supprimé avec succès");
    },
    onError: (error: any) => toast.error(error?.message || "Erreur lors de la suppression du badge"),
  });

  const activateMutation = useMutation({
    mutationFn: badgesAPI.activateBadge,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["badges"] });
      toast.success("Badge activé avec succès");
    },
    onError: (error: any) => toast.error(error?.message || "Erreur lors de l'activation du badge"),
  });

  const deactivateMutation = useMutation({
    mutationFn: badgesAPI.deactivateBadge,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["badges"] });
      toast.success("Badge désactivé avec succès");
    },
    onError: (error: any) => toast.error(error?.message || "Erreur lors de la désactivation du badge"),
  });

  const assignMutation = useMutation({
    mutationFn: ({ utilisateurId, badgeId }: { utilisateurId: number; badgeId: number }) =>
      badgesAPI.assignBadge(utilisateurId, badgeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["badges"] });
      toast.success("Badge assigné avec succès");
    },
    onError: (error: any) => toast.error(error?.message || "Erreur lors de l'assignation du badge"),
  });

  return {
    data: query.data,              // Page<BadgeDTO>
    isLoading: query.isLoading,
    error: query.error,
    createBadge: createMutation.mutateAsync,
    updateBadge: updateMutation.mutateAsync,
    deleteBadge: deleteMutation.mutateAsync,
    activateBadge: activateMutation.mutateAsync,
    deactivateBadge: deactivateMutation.mutateAsync,
    assignBadge: assignMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    refetch: query.refetch,
  };
}
