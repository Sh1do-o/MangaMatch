// Typed wrappers around this app's API routes, so the URL, method and
// payload shape of each endpoint is defined in exactly one place.
import { fetchJson, jsonRequest } from "@/lib/http";
import type { Category, SavedManga } from "@/lib/types";
import type { MangaResult } from "@/lib/anilist";

export async function fetchLibrary(): Promise<SavedManga[]> {
  const data = await fetchJson<{ manga: SavedManga[] }>("/api/manga/list");
  return data.manga ?? [];
}

export async function fetchCategories(): Promise<Category[]> {
  const data = await fetchJson<{ categories: Category[] }>("/api/categories");
  return data.categories ?? [];
}

export async function createCategory(name: string): Promise<Category> {
  const data = await fetchJson<{ category: Category }>(
    "/api/categories",
    jsonRequest("POST", { name })
  );
  return data.category;
}

export function deleteCategory(categoryId: number): Promise<unknown> {
  return fetchJson("/api/categories/" + categoryId, { method: "DELETE" });
}

export function updateManga(
  mangaId: number,
  patch: { readingStatus?: string; rating?: number | null }
): Promise<unknown> {
  return fetchJson(`/api/manga/${mangaId}`, jsonRequest("PATCH", patch));
}

export function deleteManga(mangaId: number): Promise<unknown> {
  return fetchJson(`/api/manga/${mangaId}`, { method: "DELETE" });
}

export function setMangaCategory(
  mangaId: number,
  categoryId: number,
  assigned: boolean
): Promise<unknown> {
  return fetchJson(
    `/api/manga/${mangaId}/categories`,
    jsonRequest(assigned ? "DELETE" : "POST", { categoryId })
  );
}

export async function addMangaToLibrary(
  manga: MangaResult
): Promise<SavedManga> {
  const data = await fetchJson<{ manga: SavedManga }>(
    "/api/manga/add",
    jsonRequest("POST", manga)
  );
  return data.manga;
}
