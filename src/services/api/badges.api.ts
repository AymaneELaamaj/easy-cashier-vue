// services/api/badges.api.ts
import api from "./axios";
import { ApiResponse, Page, Pageable } from "@/types/api";
import { BadgeDTO } from "@/types/entities";

/* -------------------- Helpers sûrs -------------------- */
function emptyPage<T>(page = 0, size = 10): Page<T> {
  return {
    content: [],
    totalElements: 0,
    totalPages: 0,
    size,
    number: page,
    first: true,
    last: true,
    empty: true,
  } as Page<T>;
}

/** Déballe toujours un ApiResponse<T> en T */
function unwrap<T>(raw: any): T {
  // axios -> res.data == ApiResponse<T> | T
  const maybe = raw?.data ?? raw;
  if (maybe && typeof maybe === "object" && "data" in maybe) {
    return (maybe as any).data as T;
  }
  return maybe as T;
}

/** Extrait une Page<T> depuis ApiResponse ou objet brut */
function pickPage<T>(raw: any, fallbackPage = 0, fallbackSize = 10): Page<T> {
  const body = raw?.data ?? raw;
  const page = body?.page ?? body?.data?.page;
  if (page && typeof page === "object" && Array.isArray(page.content)) {
    return {
      content: page.content as T[],
      totalElements: page.totalElements ?? 0,
      totalPages: page.totalPages ?? 0,
      size: page.size ?? fallbackSize,
      number: page.number ?? fallbackPage,
      first: !!page.first,
      last: !!page.last,
      empty: !!page.empty,
    } as Page<T>;
  }
  return emptyPage<T>(fallbackPage, fallbackSize);
}

/* -------------------- API -------------------- */
export const badgesAPI = {
  createBadge: async (badgeData: BadgeDTO): Promise<BadgeDTO> => {
    const res = await api.post<ApiResponse<BadgeDTO>>("/badges/create", badgeData);
    return unwrap<BadgeDTO>(res);
  },

  getAllBadges: async (pageable?: Pageable): Promise<Page<BadgeDTO>> => {
    const params = new URLSearchParams();
    if (pageable?.page !== undefined) params.append("page", String(pageable.page));
    if (pageable?.size !== undefined) params.append("size", String(pageable.size));
    if (pageable?.sort) params.append("sort", pageable.sort);

    const res = await api.get<ApiResponse<Page<BadgeDTO>>>(`/badges/all${params.toString() ? `?${params}` : ""}`);
    return pickPage<BadgeDTO>(res, pageable?.page ?? 0, pageable?.size ?? 10);
  },

  getUnassignedBadges: async (pageable?: Pageable): Promise<Page<BadgeDTO>> => {
    const params = new URLSearchParams();
    if (pageable?.page !== undefined) params.append("page", String(pageable.page));
    if (pageable?.size !== undefined) params.append("size", String(pageable.size));
    if (pageable?.sort) params.append("sort", pageable.sort);

    const res = await api.get<ApiResponse<Page<BadgeDTO>>>(`/badges/unassigned${params.toString() ? `?${params}` : ""}`);
    return pickPage<BadgeDTO>(res, pageable?.page ?? 0, pageable?.size ?? 10);
  },

  getBadgeById: async (id: number): Promise<BadgeDTO> => {
    const res = await api.get<ApiResponse<BadgeDTO>>(`/badges/${id}`);
    return unwrap<BadgeDTO>(res);
  },

  getBadgeByCode: async (codeBadge: string): Promise<BadgeDTO> => {
    const res = await api.get<ApiResponse<BadgeDTO>>(`/badges/code`, { params: { codeBadge } });
    return unwrap<BadgeDTO>(res);
  },

  activateBadge: async (id: number): Promise<BadgeDTO> => {
    const res = await api.patch<ApiResponse<BadgeDTO>>(`/badges/activer/${id}`);
    return unwrap<BadgeDTO>(res);
  },

  deactivateBadge: async (id: number): Promise<BadgeDTO> => {
    const res = await api.patch<ApiResponse<BadgeDTO>>(`/badges/desactiver/${id}`);
    return unwrap<BadgeDTO>(res);
  },

  assignBadge: async (utilisateurId: number, badgeId: number): Promise<BadgeDTO> => {
    // ✅ Bonne signature Axios: params dans le 3e arg (config)
    const res = await api.patch<ApiResponse<BadgeDTO>>(`/badges/assigner`, null, {
      params: { utilisateurId, badgeId },
    });
    return unwrap<BadgeDTO>(res);
  },

  deleteBadge: async (id: number): Promise<void> => {
    await api.delete<ApiResponse<void>>(`/badges/${id}`);
  },
};

export default badgesAPI;
