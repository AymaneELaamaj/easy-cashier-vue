// services/api/badges.api.ts
import api from "./axios";
import { ApiResponse, Page, Pageable } from "@/types/api";
import { BadgeResponse } from "@/types/entities";

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
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function unwrap<T>(raw: unknown): T {
  // axios response structure: res.data contains the ApiResponse
  const axiosData: unknown = isRecord(raw) && "data" in (raw as Record<string, unknown>)
    ? (raw as Record<string, unknown>).data as unknown
    : raw;
  
  // Backend ApiResponse structure: { success: boolean, data: T, message: string }
  if (isRecord(axiosData)) {
    const apiResponse = axiosData as Record<string, unknown>;
    if ("data" in apiResponse && apiResponse.data !== undefined) {
      return apiResponse.data as T;
    }
    // Sometimes the data is directly in the response
    if ("content" in apiResponse || "totalElements" in apiResponse) {
      return axiosData as T;
    }
  }
  return axiosData as T;
}

/** Extrait une Page<T> depuis ApiResponse ou objet brut */
function pickPage<T>(raw: unknown, fallbackPage = 0, fallbackSize = 10): Page<T> {
  // axios response structure: res.data contains the ApiResponse
  const axiosData: unknown = isRecord(raw) && "data" in (raw as Record<string, unknown>)
    ? (raw as Record<string, unknown>).data as unknown
    : raw;

  // Backend ApiResponse might have data.page or direct page
  let pageData: unknown = axiosData;
  
  if (isRecord(axiosData)) {
    const apiResponse = axiosData as Record<string, unknown>;
    if ("data" in apiResponse && isRecord(apiResponse.data)) {
      pageData = apiResponse.data;
    }
  }

  // Now pageData should contain the Spring Page object
  if (isRecord(pageData)) {
    const pageRec = pageData as Record<string, unknown>;
    if (Array.isArray(pageRec.content as unknown[])) {
      return {
        content: (pageRec.content as unknown[]) as T[],
        totalElements: (pageRec.totalElements as number) ?? 0,
        totalPages: (pageRec.totalPages as number) ?? 0,
        size: (pageRec.size as number) ?? fallbackSize,
        number: (pageRec.number as number) ?? fallbackPage,
        first: Boolean(pageRec.first),
        last: Boolean(pageRec.last),
        empty: Boolean(pageRec.empty),
      } as Page<T>;
    }
  }
  
  return emptyPage<T>(fallbackPage, fallbackSize);
}

/* -------------------- API -------------------- */
export const badgesAPI = {
  // Backend creates a new badge without payload
  createBadge: async (): Promise<BadgeResponse> => {
    console.log('API: Creating badge...');
    try {
      const res = await api.post<ApiResponse<BadgeResponse>>("/badges/create");
      console.log('API: Badge creation response:', res);
      const result = unwrap<BadgeResponse>(res);
      console.log('API: Unwrapped badge:', result);
      return result;
    } catch (error) {
      console.error('API: Error creating badge:', error);
      throw error;
    }
  },

  getAllBadges: async (pageable?: Pageable): Promise<Page<BadgeResponse>> => {
    console.log('📡 API: getAllBadges called with:', pageable);
    
    const params = new URLSearchParams();
    if (pageable?.page !== undefined) params.append("page", String(pageable.page));
    if (pageable?.size !== undefined) params.append("size", String(pageable.size));
    if (pageable?.sort) params.append("sort", pageable.sort);

    const url = `/badges/all${params.toString() ? `?${params}` : ""}`;
    console.log('📡 API: Requesting URL:', url);

    try {
      const res = await api.get<ApiResponse<Page<BadgeResponse>>>(url);
      console.log('📡 API: Raw response:', res);
      
      const result = pickPage<BadgeResponse>(res, pageable?.page ?? 0, pageable?.size ?? 10);
      console.log('📡 API: Processed result:', result);
      
      return result;
    } catch (error) {
      console.error('📡 API: Error in getAllBadges:', error);
      throw error;
    }
  },

  getUnassignedBadges: async (pageable?: Pageable): Promise<Page<BadgeResponse>> => {
    const params = new URLSearchParams();
    if (pageable?.page !== undefined) params.append("page", String(pageable.page));
    if (pageable?.size !== undefined) params.append("size", String(pageable.size));
    if (pageable?.sort) params.append("sort", pageable.sort);

    const res = await api.get<ApiResponse<Page<BadgeResponse>>>(`/badges/unassigned${params.toString() ? `?${params}` : ""}`);
    return pickPage<BadgeResponse>(res, pageable?.page ?? 0, pageable?.size ?? 10);
  },

  getBadgeById: async (id: number): Promise<BadgeResponse> => {
    const res = await api.get<ApiResponse<BadgeResponse>>(`/badges/${id}`);
    return unwrap<BadgeResponse>(res);
  },

  // Backend path: /api/badges/code/{code}
  getBadgeByCode: async (code: string): Promise<BadgeResponse> => {
    const res = await api.get<ApiResponse<BadgeResponse>>(`/badges/code/${encodeURIComponent(code)}`);
    return unwrap<BadgeResponse>(res);
  },

  // Backend uses toggle with PUT and active param
  activateBadge: async (id: number): Promise<BadgeResponse> => {
    const res = await api.put<ApiResponse<BadgeResponse>>(`/badges/${id}/toggle-status`, null, { params: { active: true } });
    return unwrap<BadgeResponse>(res);
  },

  deactivateBadge: async (id: number): Promise<BadgeResponse> => {
    const res = await api.put<ApiResponse<BadgeResponse>>(`/badges/${id}/toggle-status`, null, { params: { active: false } });
    return unwrap<BadgeResponse>(res);
  },

  // Backend path: PUT /{badgeId}/assign/{userId}
  assignBadge: async (utilisateurId: number, badgeId: number): Promise<BadgeResponse> => {
    const res = await api.put<ApiResponse<BadgeResponse>>(`/badges/${badgeId}/assign/${utilisateurId}`);
    return unwrap<BadgeResponse>(res);
  },

  deleteBadge: async (id: number): Promise<void> => {
    await api.delete<ApiResponse<void>>(`/badges/${id}`);
  },

  // Extra endpoints mapped for completeness
  unassignBadge: async (id: number): Promise<void> => {
    await api.put<ApiResponse<void>>(`/badges/${id}/unassign`);
  },

  getInactiveBadges: async (pageable?: Pageable): Promise<Page<BadgeResponse>> => {
    const params = new URLSearchParams();
    if (pageable?.page !== undefined) params.append("page", String(pageable.page));
    if (pageable?.size !== undefined) params.append("size", String(pageable.size));
    if (pageable?.sort) params.append("sort", pageable.sort);
    const res = await api.get<ApiResponse<Page<BadgeResponse>>>(`/badges/inactive${params.toString() ? `?${params}` : ""}`);
    return pickPage<BadgeResponse>(res, pageable?.page ?? 0, pageable?.size ?? 10);
  },

  searchByUserName: async (name: string, pageable?: Pageable): Promise<Page<BadgeResponse>> => {
    const params = new URLSearchParams();
    params.append("name", name);
    if (pageable?.page !== undefined) params.append("page", String(pageable.page));
    if (pageable?.size !== undefined) params.append("size", String(pageable.size));
    if (pageable?.sort) params.append("sort", pageable.sort);
    const res = await api.get<ApiResponse<Page<BadgeResponse>>>(`/badges/search/by-user-name?${params.toString()}`);
    return pickPage<BadgeResponse>(res, pageable?.page ?? 0, pageable?.size ?? 10);
  },

  searchByCodePattern: async (pattern: string): Promise<BadgeResponse[]> => {
    const res = await api.get<ApiResponse<BadgeResponse[]>>(`/badges/search/by-code-pattern`, {
      params: { pattern },
    });
    // This endpoint returns ApiResponse<Object> with list in data; unwrap handles it
    return unwrap<BadgeResponse[]>(res);
  },

  regenerateCode: async (id: number): Promise<BadgeResponse> => {
    const res = await api.put<ApiResponse<BadgeResponse>>(`/badges/${id}/regenerate-code`);
    return unwrap<BadgeResponse>(res);
  },

  getStatistics: async (): Promise<Record<string, unknown>> => {
    const res = await api.get<ApiResponse<Record<string, unknown>>>(`/badges/statistics`);
    return unwrap<Record<string, unknown>>(res);
  },
};

export default badgesAPI;
