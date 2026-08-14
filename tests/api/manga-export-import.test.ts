import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const categoryFindMany = vi.fn();
const mangaFindMany = vi.fn();
const txDeleteMany = vi.fn();
const txCategoryFindUnique = vi.fn();
const txCategoryCreate = vi.fn();
const txMangaFindUnique = vi.fn();
const txMangaUpdate = vi.fn();
const txMangaCreate = vi.fn();
const txCallback = vi.fn(async (cb: (tx: any) => Promise<any>) => {
  return cb({
    manga: {
      deleteMany: txDeleteMany,
      findUnique: txMangaFindUnique,
      update: txMangaUpdate,
      create: txMangaCreate,
    },
    category: {
      findUnique: txCategoryFindUnique,
      create: txCategoryCreate,
    },
  });
});

vi.mock("@/lib/db", () => ({
  prisma: {
    category: { findMany: () => categoryFindMany() },
    manga: { findMany: (a: unknown) => mangaFindMany(a) },
    $transaction: (cb: any) => txCallback(cb),
  },
}));

const { GET } = await import("@/app/api/manga/export/route");
const { POST } = await import("@/app/api/manga/import/route");

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  categoryFindMany.mockReset();
  mangaFindMany.mockReset();
  txDeleteMany.mockReset();
  txCategoryFindUnique.mockReset();
  txCategoryCreate.mockReset();
  txMangaFindUnique.mockReset();
  txMangaUpdate.mockReset();
  txMangaCreate.mockReset();
  txCallback.mockClear();
});

describe("GET /api/manga/export", () => {
  it("exports library and categories formatted as a backup JSON payload", async () => {
    categoryFindMany.mockResolvedValue([{ id: 1, name: "Favorites" }]);
    mangaFindMany.mockResolvedValue([
      {
        id: 10,
        anilistId: 30002,
        title: "Berserk",
        genres: "Action, Dark Fantasy",
        coverUrl: "https://example.com/berserk.jpg",
        synopsis: "Guts is a wanderer...",
        publicationStatus: "FINISHED",
        readingStatus: "completed",
        rating: 10,
        authors: "Kentaro Miura",
        publishedFrom: "1989-08-25",
        publishedTo: null,
        chapters: 364,
        volumes: 41,
        malScore: 9.4,
        siteUrl: "https://anilist.co/manga/30002",
        categories: [{ name: "Favorites" }],
      },
    ]);

    const res = await GET();
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("application/json");

    const data = await res.json();
    expect(data.version).toBe(1);
    expect(data.categories).toEqual([{ name: "Favorites" }]);
    expect(data.library).toHaveLength(1);
    expect(data.library[0]).toMatchObject({
      anilistId: 30002,
      title: "Berserk",
      categories: ["Favorites"],
      rating: 10,
    });
  });

  it("returns 500 when database export query fails", async () => {
    categoryFindMany.mockRejectedValue(new Error("db down"));
    const res = await GET();
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "Failed to export library backup" });
  });
});

describe("POST /api/manga/import", () => {
  it("returns 400 when invalid payload is passed", async () => {
    const req = new NextRequest("http://localhost/api/manga/import", {
      method: "POST",
      body: JSON.stringify({ invalid: true }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({
      error: "Invalid backup format. Expected a JSON object with a 'library' array.",
    });
  });

  it("imports new manga and creates missing categories in merge mode", async () => {
    txCategoryFindUnique.mockResolvedValue(null);
    txCategoryCreate.mockResolvedValue({ id: 1, name: "Classics" });
    txMangaFindUnique.mockResolvedValue(null);
    txMangaCreate.mockResolvedValue({ id: 100 });

    const payload = {
      version: 1,
      categories: [{ name: "Classics" }],
      library: [
        {
          anilistId: 30002,
          title: "Berserk",
          readingStatus: "completed",
          rating: 10,
          categories: ["Classics"],
        },
      ],
      mode: "merge" as const,
    };

    const req = new NextRequest("http://localhost/api/manga/import", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toMatchObject({
      success: true,
      mode: "merge",
      importedCount: 1,
      updatedCount: 0,
      createdCategoriesCount: 1,
    });

    expect(txDeleteMany).not.toHaveBeenCalled();
    expect(txCategoryCreate).toHaveBeenCalledWith({ data: { name: "Classics" } });
    expect(txMangaCreate).toHaveBeenCalled();
  });

  it("updates existing manga when anilistId already exists", async () => {
    txCategoryFindUnique.mockResolvedValue({ id: 1, name: "Favorites" });
    txMangaFindUnique.mockResolvedValue({
      id: 10,
      anilistId: 30002,
      title: "Berserk",
      rating: 8,
    });
    txMangaUpdate.mockResolvedValue({ id: 10 });

    const payload = {
      library: [
        {
          anilistId: 30002,
          title: "Berserk",
          rating: 10,
          categories: ["Favorites"],
        },
      ],
      mode: "merge" as const,
    };

    const req = new NextRequest("http://localhost/api/manga/import", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.importedCount).toBe(0);
    expect(data.updatedCount).toBe(1);
    expect(txMangaUpdate).toHaveBeenCalled();
  });

  it("clears existing manga when mode is replace", async () => {
    txMangaFindUnique.mockResolvedValue(null);
    txMangaCreate.mockResolvedValue({ id: 101 });

    const payload = {
      library: [
        {
          anilistId: 30005,
          title: "Monster",
        },
      ],
      mode: "replace" as const,
    };

    const req = new NextRequest("http://localhost/api/manga/import", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(txDeleteMany).toHaveBeenCalled();
  });
});
