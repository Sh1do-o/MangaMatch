import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import type { MangaResult } from "@/lib/anilist";

const upsert = vi.fn();
vi.mock("@/lib/db", () => ({ prisma: { manga: { upsert: (a: unknown) => upsert(a) } } }));

const { POST } = await import("@/app/api/manga/add/route");

function postRequest(body: unknown) {
  return new NextRequest("http://localhost/api/manga/add", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

function mangaResult(overrides: Partial<MangaResult> = {}): MangaResult {
  return {
    anilistId: 30002,
    title: "Berserk",
    genres: ["Action", "Drama"],
    coverUrl: "https://img/berserk.jpg",
    synopsis: "Guts.",
    status: "RELEASING",
    authors: ["Kentarou Miura"],
    publishedFrom: "1989-08-25",
    publishedTo: null,
    chapters: 374,
    volumes: 41,
    score: 9.4,
    siteUrl: "https://anilist.co/manga/30002",
    ...overrides,
  };
}

beforeEach(() => {
  upsert.mockResolvedValue({ id: 1, anilistId: 30002, title: "Berserk" });
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  upsert.mockReset();
});

describe("POST /api/manga/add", () => {
  it.each([
    ["anilistId", { title: "Berserk", genres: [], authors: [] }],
    ["title", { anilistId: 1, genres: [], authors: [] }],
  ])("400s when %s is missing", async (_field, body) => {
    const res = await POST(postRequest(body));

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({
      error: "Invalid or missing fields: anilistId, title, genres, authors",
    });
    expect(upsert).not.toHaveBeenCalled();
  });

  it("upserts by anilistId, joining list fields and defaulting reading status", async () => {
    const res = await POST(postRequest(mangaResult()));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      success: true,
      manga: { id: 1, anilistId: 30002, title: "Berserk" },
    });
    expect(upsert).toHaveBeenCalledWith({
      where: { anilistId: 30002 },
      update: {},
      create: {
        anilistId: 30002,
        title: "Berserk",
        genres: "Action,Drama",
        coverUrl: "https://img/berserk.jpg",
        synopsis: "Guts.",
        publicationStatus: "RELEASING",
        readingStatus: "planning",
        authors: "Kentarou Miura",
        publishedFrom: "1989-08-25",
        publishedTo: null,
        chapters: 374,
        volumes: 41,
        malScore: 9.4,
        siteUrl: "https://anilist.co/manga/30002",
      },
    });
  });

  it("stores nulls for absent optional fields", async () => {
    await POST(
      postRequest({
        anilistId: 5,
        title: "Sparse",
        genres: [],
        coverUrl: null,
        synopsis: null,
        status: null,
      })
    );

    expect(upsert.mock.calls[0][0].create).toMatchObject({
      genres: "",
      authors: null,
      publishedFrom: null,
      publishedTo: null,
      chapters: null,
      volumes: null,
      malScore: null,
      siteUrl: null,
    });
  });

  it("500s when the database write fails", async () => {
    upsert.mockRejectedValue(new Error("db down"));

    const res = await POST(postRequest(mangaResult()));

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({
      error: "Failed to save manga to library",
    });
  });
});
