// services/api/subventions.api.ts
import { api } from "@/services/api/axios"; // ← ton axios instance
import { Pageable } from "@/types/api";
import { SubventionDTO } from "@/types/entities";

/** Shape normalisé pour React Query et tes composants */
export type PageResponse<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;      // page index
  size: number;        // page size
  first: boolean;
  last: boolean;
  numberOfElements: number;
  empty: boolean;
};

function emptyPage<T>(page = 0, size = 10): PageResponse<T> {
  return {
    content: [],
    totalElements: 0,
    totalPages: 0,
    number: page,
    size,
    first: true,
    last: true,
    numberOfElements: 0,
    empty: true,
  };
}

// ⚠️ Ton backend renvoie { timestamp, status, message, page, path }
// On mappe toujours vers un PageResponse<T> et on ne retourne JAMAIS undefined.
async function getAllSubventions(pageable?: Pageable): Promise<PageResponse<SubventionDTO>> {
  const params: any = {};
  if (pageable?.page !== undefined) params.page = pageable.page;
  if (pageable?.size !== undefined) params.size = pageable.size;

  const res = await api.get("/subventions/all", { params });

  const data = res?.data;
  const page = data?.page;

  if (page && typeof page === "object") {
    return {
      content: Array.isArray(page.content) ? page.content : [],
      totalElements: page.totalElements ?? 0,
      totalPages: page.totalPages ?? 0,
      number: page.number ?? (pageable?.page ?? 0),
      size: page.size ?? (pageable?.size ?? 10),
      first: !!page.first,
      last: !!page.last,
      numberOfElements: page.numberOfElements ?? 0,
      empty: !!page.empty,
    };
  }

  // Cas de secours : le backend renverrait directement un tableau
  if (Array.isArray(data)) {
    const content = data as SubventionDTO[];
    const size = pageable?.size !== undefined ? pageable.size : (content.length || 10);
    return {
      ...emptyPage<SubventionDTO>(pageable?.page ?? 0, size),
      content,
      totalElements: content.length,
      numberOfElements: content.length,
      empty: content.length === 0,
    };
  }

  return emptyPage<SubventionDTO>(pageable?.page ?? 0, pageable?.size ?? 10);
}

async function getSubventionById(id: number): Promise<SubventionDTO | null> {
  const res = await api.get(`/subventions/${id}`);
  // ApiResponse.ok(subvention, ...) → { data: subvention, ... } le plus souvent
  const body = res?.data;
  if (body?.data) return body.data as SubventionDTO;
  // fallback si quelqu’un a changé ApiResponse
  if (body && !body.page) return body as SubventionDTO;
  return null;
}

async function createSubvention(payload: SubventionDTO): Promise<SubventionDTO> {
  const res = await api.post("/subventions/create", payload);
  return res?.data?.data ?? res?.data ?? payload;
}

async function updateSubvention(id: number, payload: SubventionDTO): Promise<SubventionDTO> {
  const res = await api.put(`/subventions/update?id=${id}`, payload);
  return res?.data?.data ?? res?.data ?? payload;
}

async function deleteSubvention(id: number): Promise<void> {
  await api.delete(`/subventions/delete?id=${id}`);
}

export const subventionsAPI = {
  getAllSubventions,
  getSubventionById,
  createSubvention,
  updateSubvention,
  deleteSubvention,
};
