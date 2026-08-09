import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import type { MangaResult } from "@/lib/anilist";

const findMany = vi.fn();
const getCandidatePool = vi.fn();
const getMediaRecommendations = vi.fn();
const rankCandidates = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: { manga: { findMany: (a: unknown) => findMany(a) } },
}));
vi.mock("@/lib/anilist", () => ({
  getCandidatePool: (f: unknown) => getCandidatePool(f),
  getMediaRecommendations: (id: number) => getMediaRecommendations(id),
}));
vi.mock("@/lib/gemini", () => ({
  rankCandidates: (c: unknown, f: unknown) => rankCandidates(c, f),
}));

const { POST } = await import("@/app/api/recommend/route");

function manga(overrides: Partial<MangaResult> = {}): MangaResult {
  return {
    malId: 1,
    title: "Candidate 1",
    genres: ["Action"],
    coverUrl: "https://img/1.jpg",
    synopsis: "Synopsis 1",
    status: "FINISHED",
    authors: [],
    publishedFrom: null,
    publishedTo: null,
    chapters: 50,
    volumes: null,
    score: 8,
    siteUrl: "https://anilist.co/manga/1",
    ...overrides,
  };
}

function request(body: Record<string, unknown> = {}) {
  return new NextRequest("http://localhost/api/recommend", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

beforeEach(() => {
  findMany.mockResolvedValue([]);
  getCandidatePool.mockResolvedValue([manga()]);
  getMediaRecommendations.mockResolvedValue([]);
  rankCandidates.mockResolvedValue([{ index: 0, reason: "Great fit" }]);
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  for (const m of [findMany, getCandidatePool, getMediaRecommendations, rankCandidates]) {
    m.mockReset();
  }
});

describe("POST /api/recommend", () => {
  it("maps ranked picks back onto the real candidate data", async () => {
    const res = await POST(request());

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      recommendations: [
        {
          title: "Candidate 1",
          synopsis: "Synopsis 1",
          reason: "Great fit",
          malId: 1,
          coverUrl: "https://img/1.jpg",
          genres: ["Action"],
          chapters: 50,
          status: "FINISHED",
          siteUrl: "https://anilist.co/manga/1",
        },
      ],
    });
  });

  it("defaults filters to 'any' when the body is empty", async () => {
    await POST(request());

    expect(getCandidatePool).toHaveBeenCalledWith({
      genres: [],
      completionStatus: "any",
      chapterLength: "any",
      page: 1,
    });
    expect(rankCandidates.mock.calls[0][1]).toEqual({
      genres: [],
      completionStatus: "any",
      chapterLength: "any",
      baseManga: [],
      diverge: false,
      customQuery: "",
    });
  });

  it("returns an empty synopsis rather than null", async () => {
    getCandidatePool.mockResolvedValue([manga({ synopsis: null })]);

    const res = await POST(request());

    expect((await res.json()).recommendations[0].synopsis).toBe("");
  });

  it("caps the response at 5 recommendations", async () => {
    getCandidatePool.mockResolvedValue(
      Array.from({ length: 8 }, (_, i) => manga({ malId: i + 1, title: `C${i}` }))
    );
    rankCandidates.mockResolvedValue(
      Array.from({ length: 8 }, (_, i) => ({ index: i, reason: `r${i}` }))
    );

    const res = await POST(request());

    expect((await res.json()).recommendations).toHaveLength(5);
  });

  it("loads base manga from the library and splits stored genres", async () => {
    findMany
      .mockResolvedValueOnce([
        {
          id: 3,
          malId: 999,
          title: "Berserk",
          genres: "Action,Drama,",
          synopsis: "Dark fantasy",
        },
      ])
      .mockResolvedValueOnce([{ title: "Berserk" }]);

    await POST(request({ baseMangaIds: ["3"] }));

    expect(findMany).toHaveBeenNthCalledWith(1, {
      where: { id: { in: [3] } },
    });
    expect(rankCandidates.mock.calls[0][1].baseManga).toEqual([
      { title: "Berserk", genres: ["Action", "Drama"], synopsis: "Dark fantasy" },
    ]);
    expect(getMediaRecommendations).toHaveBeenCalledWith(999);
  });

  it("skips the library lookup and community recommendations without base manga", async () => {
    await POST(request());

    expect(findMany).toHaveBeenCalledTimes(1);
    expect(getMediaRecommendations).not.toHaveBeenCalled();
  });

  it("merges community recommendations into the pool, de-duplicated by id", async () => {
    findMany
      .mockResolvedValueOnce([
        { id: 3, malId: 999, title: "Berserk", genres: "", synopsis: null },
      ])
      .mockResolvedValueOnce([]);
    getMediaRecommendations.mockResolvedValue([
      manga({ malId: 1, title: "Duplicate of pool" }),
      manga({ malId: 2, title: "Community pick" }),
    ]);

    await POST(request({ baseMangaIds: [3] }));

    const candidates = rankCandidates.mock.calls[0][0];
    expect(candidates.map((c: { malId: number }) => c.malId)).toEqual([1, 2]);
    expect(candidates[0].title).toBe("Candidate 1");
  });

  it("excludes titles already in the library, case-insensitively", async () => {
    getCandidatePool.mockResolvedValue([
      manga({ malId: 1, title: "Berserk" }),
      manga({ malId: 2, title: "Vagabond" }),
    ]);
    findMany.mockResolvedValue([{ title: "bErSeRk" }]);

    await POST(request());

    expect(
      rankCandidates.mock.calls[0][0].map((c: { title: string }) => c.title)
    ).toEqual(["Vagabond"]);
  });

  it("excludes titles the client has already seen", async () => {
    getCandidatePool.mockResolvedValue([
      manga({ malId: 1, title: "Berserk" }),
      manga({ malId: 2, title: "Vagabond" }),
    ]);

    await POST(request({ excludeTitles: ["VAGABOND"] }));

    expect(
      rankCandidates.mock.calls[0][0].map((c: { title: string }) => c.title)
    ).toEqual(["Berserk"]);
  });

  it.each([
    ["completed", ["FINISHED", null]],
    ["ongoing", ["RELEASING", "HIATUS", null]],
    ["any", ["FINISHED", "RELEASING", "HIATUS", "NOT_YET_RELEASED", null]],
  ] as const)(
    "keeps only statuses compatible with completionStatus=%s",
    async (completionStatus, expected) => {
      getCandidatePool.mockResolvedValue(
        ["FINISHED", "RELEASING", "HIATUS", "NOT_YET_RELEASED", null].map(
          (status, i) => manga({ malId: i + 1, status })
        )
      );

      await POST(request({ completionStatus }));

      expect(
        rankCandidates.mock.calls[0][0].map((c: { status: string | null }) => c.status)
      ).toEqual(expected);
    }
  );

  it.each([
    ["short", [99, null]],
    ["medium", [100, 400, null]],
    ["long", [401, null]],
    ["any", [99, 100, 400, 401, null]],
  ] as const)(
    "keeps only chapter counts compatible with chapterLength=%s, never punishing unknowns",
    async (chapterLength, expected) => {
      getCandidatePool.mockResolvedValue(
        [99, 100, 400, 401, null].map((chapters, i) =>
          manga({ malId: i + 1, chapters })
        )
      );

      await POST(request({ chapterLength }));

      expect(
        rankCandidates.mock.calls[0][0].map((c: { chapters: number | null }) => c.chapters)
      ).toEqual(expected);
    }
  );

  it("drops adult genres when contentRating is 'safe'", async () => {
    getCandidatePool.mockResolvedValue([
      manga({ malId: 1, title: "Safe", genres: ["Action"] }),
      manga({ malId: 2, title: "Hentai pick", genres: ["Hentai"] }),
      manga({ malId: 3, title: "Ecchi pick", genres: ["Comedy", "Ecchi"] }),
    ]);

    await POST(request({ contentRating: "safe" }));

    expect(
      rankCandidates.mock.calls[0][0].map((c: { title: string }) => c.title)
    ).toEqual(["Safe"]);
  });

  it("keeps adult genres when contentRating is unrestricted", async () => {
    getCandidatePool.mockResolvedValue([
      manga({ malId: 2, title: "Ecchi pick", genres: ["Ecchi"] }),
    ]);

    await POST(request({ contentRating: "any" }));

    expect(rankCandidates.mock.calls[0][0]).toHaveLength(1);
  });

  it("returns an explanatory note instead of calling Gemini when nothing matches", async () => {
    getCandidatePool.mockResolvedValue([manga({ chapters: 500 })]);

    const res = await POST(request({ chapterLength: "short" }));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      recommendations: [],
      note: "No manga matched these filters. Try loosening completion status or chapter length.",
    });
    expect(rankCandidates).not.toHaveBeenCalled();
  });

  it("forwards diverge and the custom query to the ranker", async () => {
    await POST(request({ diverge: true, customQuery: "no isekai" }));

    expect(rankCandidates.mock.calls[0][1]).toMatchObject({
      diverge: true,
      customQuery: "no isekai",
    });
  });

  it("500s with the failure details when ranking throws", async () => {
    rankCandidates.mockRejectedValue(new Error("Gemini API error: 429"));

    const res = await POST(request());

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({
      error: "Failed to generate recommendations",
      details: "Gemini API error: 429",
    });
  });

  it("reports a generic message for non-Error failures", async () => {
    getCandidatePool.mockRejectedValue("nope");

    const res = await POST(request());

    expect(res.status).toBe(500);
    expect(await res.json()).toMatchObject({ details: "Unknown error" });
  });
});
