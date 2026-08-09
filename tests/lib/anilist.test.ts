import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getBrowseManga,
  getCandidatePool,
  getMediaRecommendations,
  searchManga,
} from "@/lib/anilist";

interface FetchCall {
  url: string;
  query: string;
  variables: Record<string, unknown>;
}

function mediaFixture(overrides: Record<string, unknown> = {}) {
  return {
    id: 30002,
    siteUrl: "https://anilist.co/manga/30002",
    title: { romaji: "Berserk", english: "Berserk EN" },
    genres: ["Action", "Drama"],
    coverImage: {
      extraLarge: "https://img/extra.jpg",
      large: "https://img/large.jpg",
    },
    description: "<p>A <i>dark</i> fantasy.</p>  ",
    status: "RELEASING",
    chapters: 374,
    volumes: 41,
    averageScore: 94,
    startDate: { year: 1989, month: 8, day: 25 },
    endDate: { year: null, month: null, day: null },
    staff: {
      edges: [
        { role: "Story & Art", node: { name: { full: "Kentarou Miura" } } },
        { role: "Assistant", node: { name: { full: "Ignore Me" } } },
      ],
    },
    ...overrides,
  };
}

function jsonResponse(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  } as Response;
}

function pageResponse(media: unknown[]) {
  return jsonResponse({ data: { Page: { media } } });
}

let calls: FetchCall[];
let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  calls = [];
  fetchMock = vi.fn(async (url: string, init: RequestInit) => {
    const body = JSON.parse(String(init.body));
    calls.push({ url, query: body.query, variables: body.variables });
    return pageResponse([mediaFixture()]);
  });
  vi.stubGlobal("fetch", fetchMock);
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("searchManga", () => {
  it("returns an empty list without calling the API for blank queries", async () => {
    expect(await searchManga("")).toEqual([]);
    expect(await searchManga("   ")).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("posts the search term to AniList and maps the response", async () => {
    const results = await searchManga("berserk");

    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe("https://graphql.anilist.co");
    expect(calls[0].variables).toEqual({ search: "berserk" });
    expect(results).toEqual([
      {
        malId: 30002,
        title: "Berserk EN",
        genres: ["Action", "Drama"],
        coverUrl: "https://img/extra.jpg",
        synopsis: "A dark fantasy.",
        status: "RELEASING",
        authors: ["Kentarou Miura"],
        publishedFrom: "1989-08-25",
        publishedTo: null,
        chapters: 374,
        volumes: 41,
        score: 9.4,
        siteUrl: "https://anilist.co/manga/30002",
      },
    ]);
  });

  it("falls back and normalizes missing fields", async () => {
    fetchMock.mockResolvedValueOnce(
      pageResponse([
        mediaFixture({
          title: { romaji: "Romaji Only", english: null },
          genres: null,
          coverImage: { extraLarge: null, large: "https://img/large.jpg" },
          description: null,
          status: null,
          chapters: null,
          volumes: null,
          averageScore: null,
          startDate: { year: 2001, month: null, day: null },
          endDate: { year: null, month: 3, day: 4 },
          staff: undefined,
          siteUrl: null,
        }),
      ])
    );

    const [result] = await searchManga("x");

    expect(result.title).toBe("Romaji Only");
    expect(result.genres).toEqual([]);
    expect(result.coverUrl).toBe("https://img/large.jpg");
    expect(result.synopsis).toBeNull();
    expect(result.authors).toEqual([]);
    expect(result.publishedFrom).toBe("2001-01-01");
    expect(result.publishedTo).toBeNull();
    expect(result.score).toBeNull();
    expect(result.siteUrl).toBeNull();
  });

  it("throws when AniList replies HTTP 200 with GraphQL errors", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ errors: [{ message: "Bad query" }] })
    );

    await expect(searchManga("x")).rejects.toThrow(/AniList GraphQL error/);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("does not retry non-transient HTTP errors", async () => {
    fetchMock.mockResolvedValue(jsonResponse({}, 404));

    await expect(searchManga("x")).rejects.toThrow(
      /AniList API error: 404/
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("retries transient errors and returns the eventual success", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({}, 429))
      .mockResolvedValueOnce(pageResponse([mediaFixture({ id: 7 })]));

    const results = await searchManga("x");

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(results[0].malId).toBe(7);
  });

  it("gives up after the retry limit on persistent transient errors", async () => {
    fetchMock.mockResolvedValue(jsonResponse({}, 503));

    await expect(searchManga("x")).rejects.toThrow(/AniList API error: 503/);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});

describe("getBrowseManga", () => {
  it.each([
    ["trending", ["TRENDING_DESC"]],
    ["popular", ["POPULARITY_DESC"]],
    ["top-rated", ["SCORE_DESC"]],
  ] as const)("maps sort %s to %j", async (sort, expected) => {
    await getBrowseManga(sort);
    expect(calls[0].variables.sort).toEqual(expected);
  });

  it("passes a real genre through and treats 'All' / undefined as no filter", async () => {
    await getBrowseManga("trending", "Romance");
    await getBrowseManga("trending", "All");
    await getBrowseManga("trending");

    expect(calls[0].variables.genre).toBe("Romance");
    expect(calls[1].variables.genre).toBeNull();
    expect(calls[2].variables.genre).toBeNull();
  });
});

describe("getMediaRecommendations", () => {
  function recResponse(nodes: unknown[]) {
    return jsonResponse({ data: { Media: { recommendations: { nodes } } } });
  }

  it("maps community recommendations, skipping null entries", async () => {
    fetchMock.mockResolvedValueOnce(
      recResponse([
        { mediaRecommendation: mediaFixture({ id: 1 }) },
        { mediaRecommendation: null },
        {},
      ])
    );

    const results = await getMediaRecommendations(30002);

    const sentBody = JSON.parse(String(fetchMock.mock.calls[0][1].body));
    expect(sentBody.variables).toEqual({ id: 30002 });
    expect(results.map((r) => r.malId)).toEqual([1]);
  });

  it("returns an empty list when the media has no recommendations", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ data: { Media: null } }));
    expect(await getMediaRecommendations(1)).toEqual([]);
  });

  it("swallows HTTP errors, GraphQL errors and network failures", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({}, 500));
    expect(await getMediaRecommendations(1)).toEqual([]);

    fetchMock.mockResolvedValueOnce(jsonResponse({ errors: [{}] }));
    expect(await getMediaRecommendations(1)).toEqual([]);

    fetchMock.mockRejectedValueOnce(new Error("network down"));
    expect(await getMediaRecommendations(1)).toEqual([]);
  });
});

describe("getCandidatePool", () => {
  const baseFilters = {
    genres: ["Action"],
    completionStatus: "any",
    chapterLength: "any",
  };

  it("issues a popularity query per selection, plus a recency-biased query", async () => {
    await getCandidatePool(baseFilters);

    // One selection ("Action") -> one popularity query + one recency query.
    expect(calls).toHaveLength(2);
    const sorts = calls.map((c) => c.variables.sort);
    expect(sorts).toEqual([["POPULARITY_DESC"], ["POPULARITY_DESC"]]);

    const recent = calls.find((c) => "startDate_greater" in c.variables)!;
    const popular = calls.find((c) => !("startDate_greater" in c.variables))!;
    const expectedCutoff = (new Date().getFullYear() - 2) * 10000 + 101;
    expect(recent.variables.startDate_greater).toBe(expectedCutoff);
    expect(recent.query).toContain("$startDate_greater: FuzzyDateInt");
    expect(popular.query).not.toContain("startDate_greater");
  });

  it("queries each selected genre/theme individually (any-of, not all-of), and never applies chapter length server-side", async () => {
    await getCandidatePool({
      genres: ["Action", "Isekai"],
      completionStatus: "any",
      chapterLength: "short",
    });

    // "Action" is a real genre -> queried via `genre`.
    // "Isekai" is an AniList tag, not a genre -> queried via `tag_in`.
    const genreCalls = calls.filter((c) => c.variables.genre === "Action");
    const tagCalls = calls.filter((c) =>
      Array.isArray(c.variables.tag_in)
    );
    expect(genreCalls.length).toBeGreaterThan(0);
    expect(tagCalls.length).toBeGreaterThan(0);
    expect(tagCalls[0].variables.tag_in).toEqual(["Isekai"]);

    for (const call of calls) {
      // genre_in requires matching ALL listed values at once — never used.
      expect(call.variables).not.toHaveProperty("genre_in");
      expect(call.variables).not.toHaveProperty("chapters_lesser");
      expect(call.variables).not.toHaveProperty("chapters_greater");
    }
  });

  it.each([
    ["completed", ["FINISHED"]],
    ["ongoing", ["RELEASING", "HIATUS"]],
  ] as const)(
    "applies completion status %s as a hard status filter",
    async (completionStatus, expected) => {
      await getCandidatePool({ ...baseFilters, completionStatus });

      for (const call of calls) {
        expect(call.variables.status_in).toEqual(expected);
        expect(call.query).toContain("$status_in: [MediaStatus]");
      }
    }
  );

  it("omits the status filter when completion status is 'any'", async () => {
    await getCandidatePool(baseFilters);
    for (const call of calls) {
      expect(call.variables).not.toHaveProperty("status_in");
    }
  });

  it("merges both batches and de-duplicates by AniList id, round-robin", async () => {
    fetchMock
      .mockResolvedValueOnce(
        pageResponse([mediaFixture({ id: 1 }), mediaFixture({ id: 2 })])
      )
      .mockResolvedValueOnce(
        pageResponse([mediaFixture({ id: 2 }), mediaFixture({ id: 3 })])
      );

    const results = await getCandidatePool(baseFilters);

    // Round-robin across batches (popularity query, then recency query),
    // so no single query dominates the pool: 1 (batch0[0]), 2 (batch1[0],
    // batch0[1] already seen), 3 (batch1[1]).
    expect(results.map((r) => r.malId)).toEqual([1, 2, 3]);
  });

  it("still returns the other batch when one query fails", async () => {
    fetchMock
      .mockResolvedValueOnce(pageResponse([mediaFixture({ id: 1 })]))
      .mockResolvedValueOnce(jsonResponse({ errors: [{ message: "boom" }] }));

    const results = await getCandidatePool(baseFilters);

    expect(results.map((r) => r.malId)).toEqual([1]);
  });
});
